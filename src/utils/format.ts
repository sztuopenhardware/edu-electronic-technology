import type { SimulationOutput } from '../types';

export function formatEng(value: number, unit = '', digits = 2): string {
  if (!Number.isFinite(value)) return `-- ${unit}`.trim();
  const abs = Math.abs(value);
  if (abs === 0) return `0 ${unit}`.trim();

  if (unit === 'dB' || unit === 'deg' || unit === '°' || unit === '%') {
    return `${value.toFixed(digits)} ${unit}`.trim();
  }

  // 若单位已经带 mA / uA，直接格式化数值避免出现 mmA
  if (unit === 'mA' || unit === 'uA' || unit === 'μA' || unit === 'mV') {
    return `${value.toFixed(digits)} ${unit}`;
  }

  const prefixes = [
    { factor: 1e9, sym: 'G' },
    { factor: 1e6, sym: 'M' },
    { factor: 1e3, sym: 'k' },
    { factor: 1, sym: '' },
    { factor: 1e-3, sym: 'm' },
    { factor: 1e-6, sym: 'μ' },
    { factor: 1e-9, sym: 'n' },
    { factor: 1e-12, sym: 'p' },
  ];

  for (const p of prefixes) {
    if (abs >= p.factor * 0.999) {
      const scaled = value / p.factor;
      return `${scaled.toFixed(digits)} ${p.sym}${unit}`.trim();
    }
  }
  return `${value.toExponential(digits)} ${unit}`.trim();
}

export interface WaveStats {
  vMax: number;
  vMin: number;
  vpp: number;
  vAvg: number;
  vRms: number;
}

/**
 * 提取时域后半段稳态区间的峰峰值、平均值（静态分量）、有效值
 */
export function calcWaveStats(values: number[]): WaveStats {
  if (!values || values.length === 0) {
    return { vMax: 0, vMin: 0, vpp: 0, vAvg: 0, vRms: 0 };
  }
  const start = Math.floor(values.length * 0.25);
  const slice = values.slice(start);
  let vMax = -Infinity;
  let vMin = Infinity;
  let sum = 0;
  let sqSum = 0;
  for (const v of slice) {
    if (v > vMax) vMax = v;
    if (v < vMin) vMin = v;
    sum += v;
    sqSum += v * v;
  }
  const n = Math.max(slice.length, 1);
  return {
    vMax,
    vMin,
    vpp: vMax - vMin,
    vAvg: sum / n,
    vRms: Math.sqrt(sqSum / n),
  };
}

export interface BodeMetrics {
  peakGainDb: number;
  peakFreqHz: number;
  fLowHz: number | null;
  fHighHz: number | null;
  phaseMarginDeg: number | null;
  unityGainFreqHz: number | null;
}

/**
 * 从 AC 频响曲线自动测算中频最大增益、下限截止频率 fL、上限截止频率 fH 及相位裕度 PM
 */
export function calcBodeMetrics(sim: SimulationOutput | null, seriesIdx = 0): BodeMetrics {
  const empty: BodeMetrics = {
    peakGainDb: 0,
    peakFreqHz: 0,
    fLowHz: null,
    fHighHz: null,
    phaseMarginDeg: null,
    unityGainFreqHz: null,
  };
  if (!sim || sim.rawType !== 'ac' || !sim.series[seriesIdx]) return empty;

  const freqs = sim.xValues;
  const gains = sim.series[seriesIdx].values;
  const phases = sim.series[seriesIdx].phaseValues;
  if (freqs.length < 3) return empty;

  let peakGainDb = -Infinity;
  let peakIdx = 0;
  for (let i = 0; i < gains.length; i++) {
    if (gains[i] > peakGainDb) {
      peakGainDb = gains[i];
      peakIdx = i;
    }
  }
  const targetDb = peakGainDb - 3.0103;

  // 向低频搜索 -3dB 点 fL
  let fLowHz: number | null = null;
  for (let i = peakIdx; i > 0; i--) {
    if (gains[i] >= targetDb && gains[i - 1] < targetDb) {
      const ratio = (targetDb - gains[i - 1]) / (gains[i] - gains[i - 1] + 1e-12);
      const logF =
        Math.log10(freqs[i - 1]) +
        ratio * (Math.log10(freqs[i]) - Math.log10(freqs[i - 1]));
      fLowHz = Math.pow(10, logF);
      break;
    }
  }

  // 向高频搜索 -3dB 点 fH
  let fHighHz: number | null = null;
  for (let i = peakIdx; i < gains.length - 1; i++) {
    if (gains[i] >= targetDb && gains[i + 1] < targetDb) {
      const ratio = (gains[i] - targetDb) / (gains[i] - gains[i + 1] + 1e-12);
      const logF =
        Math.log10(freqs[i]) +
        ratio * (Math.log10(freqs[i + 1]) - Math.log10(freqs[i]));
      fHighHz = Math.pow(10, logF);
      break;
    }
  }

  // 搜索 0dB 穿越频率与相位裕度 (180° + φ)
  let unityGainFreqHz: number | null = null;
  let phaseMarginDeg: number | null = null;
  if (phases && phases.length === gains.length) {
    for (let i = peakIdx; i < gains.length - 1; i++) {
      if (gains[i] >= 0 && gains[i + 1] < 0) {
        const ratio = gains[i] / (gains[i] - gains[i + 1] + 1e-12);
        const logF =
          Math.log10(freqs[i]) +
          ratio * (Math.log10(freqs[i + 1]) - Math.log10(freqs[i]));
        unityGainFreqHz = Math.pow(10, logF);
        const phAtZero = phases[i] + ratio * (phases[i + 1] - phases[i]);
        // 负反馈反相放大基础相移或开环相移折算
        let normPh = phAtZero;
        while (normPh <= -360) normPh += 360;
        phaseMarginDeg = 180 + normPh;
        break;
      }
    }
  }

  return {
    peakGainDb,
    peakFreqHz: freqs[peakIdx],
    fLowHz,
    fHighHz,
    phaseMarginDeg,
    unityGainFreqHz,
  };
}
