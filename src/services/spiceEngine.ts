import type {
  AnalysisMode,
  PlotTraceConfig,
  SimulationOutput,
  SweepFamilyConfig,
} from '../types';
import type { Simulation, ResultType } from 'eecircuit-engine';

let simInstance: Simulation | null = null;
let initPromise: Promise<Simulation> | null = null;
let runQueue: Promise<unknown> = Promise.resolve();

/**
 * 懒加载并初始化 Ngspice WebAssembly 引擎单例
 */
export async function getSpiceEngine(): Promise<Simulation> {
  if (simInstance && simInstance.isInitialized()) {
    return simInstance;
  }
  if (!initPromise) {
    initPromise = (async () => {
      const mod = await import('eecircuit-engine');
      const sim = new mod.Simulation();
      await sim.start();
      simInstance = sim;
      return sim;
    })();
  }
  return initPromise;
}

/**
 * 相位连续展开（消除 -180° / +180° 跳变，便于波特图相频曲线教学观察）
 */
function unwrapPhaseDeg(phases: number[]): number[] {
  if (phases.length === 0) return [];
  const out = [phases[0]];
  let offset = 0;
  for (let i = 1; i < phases.length; i++) {
    const diff = phases[i] - phases[i - 1];
    if (diff > 180) offset -= 360;
    else if (diff < -180) offset += 360;
    out.push(phases[i] + offset);
  }
  return out;
}

/**
 * 串行调度一次底层 Ngspice 仿真，避免并发写入同一 WASM 内存实例
 */
function enqueueRawSim(
  netlist: string
): Promise<{ res: ResultType; info: string; errors: string[]; elapsed: number }> {
  const next = runQueue.then(async () => {
    const t0 = performance.now();
    const sim = await getSpiceEngine();
    sim.setNetList(netlist);
    const res = await sim.runSim();
    const info = sim.getInfo() || '';
    const errors = sim.getError() || [];
    const elapsed = performance.now() - t0;
    return { res, info, errors, elapsed };
  });
  // 确保队列自身不会因为单次异常而永久挂死
  runQueue = next.catch(() => undefined);
  return next;
}

/**
 * 执行电路仿真并将 Ngspice 原始向量解析为前端仪器显示结构
 */
export async function executeCircuitSimulation(
  netlist: string,
  traces: PlotTraceConfig[],
  mode: AnalysisMode,
  sweepFamily?: SweepFamilyConfig,
  baseParams?: Record<string, number>,
  buildNetlistFn?: (p: Record<string, number>, m: AnalysisMode) => string
): Promise<SimulationOutput> {
  // 多族特性曲线模式（如 BJT 不同 Ib 下的输出特性族、MOSFET 不同 Vgs 下的漏极特性族）
  if (
    mode === 'dc' &&
    sweepFamily &&
    baseParams &&
    buildNetlistFn &&
    traces.length > 0
  ) {
    const palette = [
      '#38bdf8',
      '#34d399',
      '#fbbf24',
      '#f87171',
      '#a78bfa',
      '#fb7185',
    ];
    let xValues: number[] = [];
    let xLabel = '扫描电压 / 电流';
    let xUnit = 'V';
    const series: SimulationOutput['series'] = [];
    const logs: string[] = [];
    let totalMs = 0;
    const primaryTrace = traces[0];

    for (let idx = 0; idx < sweepFamily.values.length; idx++) {
      const stepVal = sweepFamily.values[idx];
      const overridden = { ...baseParams, [sweepFamily.paramKey]: stepVal };
      const nl = buildNetlistFn(overridden, 'dc');
      const { res, info, errors, elapsed } = await enqueueRawSim(nl);
      totalMs += elapsed;
      if (idx === 0) {
        if (info) logs.push(info.trim());
        if (errors.length) logs.push(...errors);
      }

      if (res.dataType === 'real' && res.data.length > 0) {
        const xVec = res.data[0];
        if (idx === 0) {
          xValues = xVec.values;
          xUnit = xVec.type === 'current' ? 'A' : 'V';
          xLabel = `${xVec.name} (${xUnit})`;
        }
        const target = res.data.find(
          (d) => d.name.toLowerCase() === primaryTrace.expr.toLowerCase()
        );
        if (target) {
          const scale = primaryTrace.scale ?? 1;
          series.push({
            name: `${sweepFamily.formatLabel(stepVal)}`,
            expr: primaryTrace.expr,
            values: target.values.map((v) => v * scale),
            color: palette[idx % palette.length],
            unit: primaryTrace.unit ?? 'mA',
            axis: 'left',
          });
        }
      }
    }

    return {
      rawType: 'dc',
      xValues,
      xLabel,
      xUnit,
      series,
      ngspiceLog: logs,
      simTimeMs: totalMs,
    };
  }

  // 标准单次 Ngspice 仿真（.tran / .ac / .dc）
  const { res, info, errors, elapsed } = await enqueueRawSim(netlist);
  const logs: string[] = [];
  if (info.trim()) logs.push(info.trim());
  if (errors.length > 0) logs.push(...errors);

  if (!res.data || res.data.length === 0) {
    throw new Error(
      errors.length > 0
        ? `Ngspice 仿真报错：${errors.join('; ')}`
        : 'Ngspice 未返回仿真数据，请检查网表语法与分析指令（.tran / .ac / .dc）。'
    );
  }

  // AC 交流小信号频域仿真 (ComplexDataType)
  if (res.dataType === 'complex') {
    const freqVec = res.data[0];
    const xValues = freqVec.values.map((c) => c.real);

    const matchedSeries: SimulationOutput['series'] = [];
    for (const tr of traces) {
      const vec = res.data.find(
        (d) => d.name.toLowerCase() === tr.expr.toLowerCase()
      );
      if (!vec) continue;
      // 对 AC 模式，若绘制输出节点则计算相对 1V AC 激励的增益 dB 与相位 deg
      const magDb = vec.values.map((c) => {
        const mag = Math.hypot(c.real, c.img) * Math.abs(tr.scale ?? 1);
        return 20 * Math.log10(Math.max(mag, 1e-9));
      });
      const rawPhases = vec.values.map(
        (c) => (Math.atan2(c.img, c.real) * 180) / Math.PI
      );
      const phaseValues = unwrapPhaseDeg(rawPhases);
      matchedSeries.push({
        name: tr.label,
        expr: tr.expr,
        values: magDb,
        phaseValues,
        color: tr.color,
        unit: 'dB',
        axis: 'left',
        dashed: tr.dashed,
      });
    }

    // 若用户在自定义网表中改了节点名，自动回退展示所有电压向量
    if (matchedSeries.length === 0) {
      const fallbackColors = ['#38bdf8', '#34d399', '#fbbf24', '#f87171'];
      res.data.slice(1).forEach((vec, idx) => {
        if (vec.type === 'voltage') {
          matchedSeries.push({
            name: vec.name,
            expr: vec.name,
            values: vec.values.map((c) =>
              20 * Math.log10(Math.max(Math.hypot(c.real, c.img), 1e-9))
            ),
            phaseValues: unwrapPhaseDeg(
              vec.values.map((c) => (Math.atan2(c.img, c.real) * 180) / Math.PI)
            ),
            color: fallbackColors[idx % fallbackColors.length],
            unit: 'dB',
            axis: 'left',
          });
        }
      });
    }

    return {
      rawType: 'ac',
      xValues,
      xLabel: '频率 f',
      xUnit: 'Hz',
      logX: true,
      series: matchedSeries,
      ngspiceLog: logs,
      simTimeMs: elapsed,
    };
  }

  // RealDataType: .tran 瞬态分析 或 .dc 直流扫描
  const xVec = res.data[0];
  const isTime = xVec.name.toLowerCase() === 'time' || xVec.type === 'time';
  const rawType: 'tran' | 'dc' = isTime ? 'tran' : 'dc';
  const xUnit = isTime ? 's' : xVec.type === 'current' ? 'A' : 'V';
  const xLabel = isTime ? '时间 t' : `扫描量 ${xVec.name}`;

  const matchedSeries: SimulationOutput['series'] = [];
  for (const tr of traces) {
    const vec = res.data.find(
      (d) => d.name.toLowerCase() === tr.expr.toLowerCase()
    );
    if (!vec) continue;
    const scale = tr.scale ?? 1;
    matchedSeries.push({
      name: tr.label,
      expr: tr.expr,
      values: vec.values.map((v) => v * scale),
      color: tr.color,
      unit: tr.unit ?? (vec.type === 'current' ? 'A' : 'V'),
      axis: tr.axis ?? 'left',
      dashed: tr.dashed,
    });
  }

  // 自定义网表自动回退显示节点电压波形
  if (matchedSeries.length === 0) {
    const fallbackColors = ['#38bdf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa'];
    res.data.slice(1).forEach((vec, idx) => {
      if (vec.type === 'voltage' || res.data.length <= 4) {
        matchedSeries.push({
          name: vec.name,
          expr: vec.name,
          values: vec.values,
          color: fallbackColors[idx % fallbackColors.length],
          unit: vec.type === 'current' ? 'A' : 'V',
          axis: 'left',
        });
      }
    });
  }

  return {
    rawType,
    xValues: xVec.values,
    xLabel,
    xUnit,
    series: matchedSeries,
    ngspiceLog: logs,
    simTimeMs: elapsed,
  };
}
