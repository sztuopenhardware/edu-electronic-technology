/**
 * 面向非均匀步长 Ngspice .tran 输出的插值重采样与 Hann 窗频谱分析 + THD 计算工具
 */
export interface SpectrumResult {
  freqs: number[];
  magnitudesDb: number[][]; // [seriesIdx][freqBin]
  magnitudesLinear: number[][];
  thdPercent?: number;
  fundamentalHz?: number;
}

export function computeUniformResample(
  t: number[],
  y: number[],
  numSamples = 1024
): { dt: number; samples: Float64Array } {
  if (t.length < 4) {
    return { dt: 1e-3, samples: new Float64Array(0) };
  }
  // 取后 80% 稳态区间以减少初始瞬态偏移对频谱的泄漏
  const tMin = t[0] + 0.2 * (t[t.length - 1] - t[0]);
  const tMax = t[t.length - 1];
  const span = Math.max(tMax - tMin, 1e-12);
  const dt = span / numSamples;
  const out = new Float64Array(numSamples);

  let idx = 0;
  for (let i = 0; i < numSamples; i++) {
    const targetT = tMin + i * dt;
    while (idx < t.length - 2 && t[idx + 1] < targetT) {
      idx++;
    }
    const t0 = t[idx];
    const t1 = t[idx + 1];
    const y0 = y[idx];
    const y1 = y[idx + 1];
    const alpha = t1 > t0 ? (targetT - t0) / (t1 - t0) : 0;
    out[i] = y0 + Math.max(0, Math.min(1, alpha)) * (y1 - y0);
  }
  return { dt, samples: out };
}

function radix2FFT(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  let j = 0;
  for (let i = 0; i < n; i++) {
    if (i < j) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
    let m = n >> 1;
    while (m >= 1 && j >= m) {
      j -= m;
      m >>= 1;
    }
    j += m;
  }

  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const ang = (-2 * Math.PI) / len;
    const wLenRe = Math.cos(ang);
    const wLenIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wRe = 1;
      let wIm = 0;
      for (let k = 0; k < half; k++) {
        const uRe = re[i + k];
        const uIm = im[i + k];
        const vRe = re[i + k + half] * wRe - im[i + k + half] * wIm;
        const vIm = re[i + k + half] * wIm + im[i + k + half] * wRe;
        re[i + k] = uRe + vRe;
        im[i + k] = uIm + vIm;
        re[i + k + half] = uRe - vRe;
        im[i + k + half] = uIm - vIm;
        const nextWRe = wRe * wLenRe - wIm * wLenIm;
        wIm = wRe * wLenIm + wIm * wLenRe;
        wRe = nextWRe;
      }
    }
  }
}

export function analyzeSpectrum(
  xValues: number[],
  seriesValues: number[][]
): SpectrumResult {
  const N = 1024;
  if (xValues.length < 8 || seriesValues.length === 0) {
    return { freqs: [], magnitudesDb: [], magnitudesLinear: [] };
  }

  let dt = 1e-4;
  const magnitudesDb: number[][] = [];
  const magnitudesLinear: number[][] = [];

  seriesValues.forEach((vals) => {
    const resampled = computeUniformResample(xValues, vals, N);
    dt = resampled.dt;
    const samples = resampled.samples;
    // 去直流均值
    let mean = 0;
    for (let i = 0; i < N; i++) mean += samples[i];
    mean /= N;

    const re = new Float64Array(N);
    const im = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
      re[i] = (samples[i] - mean) * hann;
      im[i] = 0;
    }
    radix2FFT(re, im);

    const halfBins = Math.min(256, N / 2);
    const lin: number[] = [];
    const db: number[] = [];
    for (let k = 1; k < halfBins; k++) {
      // Hann 窗幅值补偿系数 * 2 * 2 / N
      const mag = (4 * Math.hypot(re[k], im[k])) / N;
      lin.push(mag);
      db.push(20 * Math.log10(Math.max(mag, 1e-6)));
    }
    magnitudesLinear.push(lin);
    magnitudesDb.push(db);
  });

  const df = 1 / (N * dt);
  const halfBins = magnitudesLinear[0]?.length ?? 0;
  const freqs: number[] = [];
  for (let k = 1; k <= halfBins; k++) {
    freqs.push(k * df);
  }

  // 对最后一个（通常为输出信号 v(out)）估算基波频率与总谐波失真 THD
  const primaryLin = magnitudesLinear[magnitudesLinear.length - 1] ?? [];
  let peakBin = 0;
  let peakMag = 0;
  for (let i = 1; i < primaryLin.length; i++) {
    if (primaryLin[i] > peakMag) {
      peakMag = primaryLin[i];
      peakBin = i;
    }
  }

  let thdPercent: number | undefined;
  let fundamentalHz: number | undefined;
  if (peakBin >= 1 && peakMag > 1e-4) {
    // 合并基波旁瓣能量 (peakBin-1 .. peakBin+1)
    const fundPower =
      (primaryLin[peakBin - 1] ?? 0) ** 2 +
      primaryLin[peakBin] ** 2 +
      (primaryLin[peakBin + 1] ?? 0) ** 2;
    const k0 = peakBin + 1; // 1-based bin index
    fundamentalHz = k0 * df;

    let harmPower = 0;
    for (let h = 2; h <= 7; h++) {
      const hc = h * k0 - 1;
      if (hc >= 1 && hc < primaryLin.length - 1) {
        harmPower +=
          primaryLin[hc - 1] ** 2 +
          primaryLin[hc] ** 2 +
          primaryLin[hc + 1] ** 2;
      }
    }
    thdPercent = fundPower > 0 ? Math.sqrt(harmPower / fundPower) * 100 : 0;
  }

  return {
    freqs,
    magnitudesDb,
    magnitudesLinear,
    thdPercent,
    fundamentalHz,
  };
}
