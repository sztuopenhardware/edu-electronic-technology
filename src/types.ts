export type AnalysisMode = 'tran' | 'ac' | 'dc' | 'fft' | 'xy';

export type CaseBadge = '核心掌握' | '理解掌握' | 'AI项目实践' | '必做实验';

export interface ParamOption {
  label: string;
  value: number;
}

export interface CircuitParam {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  options?: ParamOption[]; // If provided, renders segmented buttons / select instead of slider
  description?: string;
}

export interface PlotTraceConfig {
  expr: string; // Ngspice vector name, e.g. 'v(in)', 'v(out)', 'i(vmeas)'
  label: string;
  color: string;
  unit?: 'V' | 'mA' | 'uA' | 'A' | 'dB' | 'deg';
  scale?: number; // e.g., 1000 to display A as mA, or -1 to invert current source sense
  axis?: 'left' | 'right';
  dashed?: boolean;
}

export interface SweepFamilyConfig {
  paramKey: string;
  values: number[];
  unitLabel: string;
  formatLabel: (v: number) => string;
}

export interface MetricReadout {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}

export interface SimulationOutput {
  rawType: 'tran' | 'ac' | 'dc';
  xValues: number[];
  xLabel: string;
  xUnit: string;
  logX?: boolean;
  series: {
    name: string;
    expr: string;
    values: number[];
    phaseValues?: number[]; // For AC analysis (degrees)
    color: string;
    unit: string;
    axis?: 'left' | 'right';
    dashed?: boolean;
  }[];
  ngspiceLog: string[];
  simTimeMs: number;
}

export type SchematicId =
  | 'ch1-signal-spectrum'
  | 'ch1-amp-model'
  | 'ch2-opamp-transfer'
  | 'ch2-inv-amp'
  | 'ch2-noninv-amp'
  | 'ch2-add-sub'
  | 'ch2-int-diff'
  | 'ch2-inst-ecg'
  | 'ch3-diode-iv'
  | 'ch3-clipper-clamper'
  | 'ch3-zener-reg'
  | 'ch3-charger-rectifier'
  | 'ch4-mosfet-iv'
  | 'ch4-mosfet-cs'
  | 'ch4-mosfet-cd-cg'
  | 'ch4-jfet-amp'
  | 'ch4-mosfet-pwm-led'
  | 'ch5-bjt-iv'
  | 'ch5-bjt-ce'
  | 'ch5-bjt-q-temp'
  | 'ch5-bjt-cc-cb'
  | 'ch5-multistage'
  | 'ch5-sound-lamp'
  | 'ch6-rc-bode'
  | 'ch6-bjt-freq'
  | 'ch6-mos-cascode-freq'
  | 'ch7-current-mirror'
  | 'ch7-diff-amp'
  | 'ch7-ocl-output'
  | 'ch7-opamp-protection'
  | 'ch8-feedback-four'
  | 'ch8-feedback-improve'
  | 'ch8-deep-feedback'
  | 'ch8-stability-comp'
  | 'ch9-active-filter'
  | 'ch9-wien-osc'
  | 'ch9-comparator'
  | 'ch9-square-triangle'
  | 'ch10-bridge-filter'
  | 'ch10-series-reg'
  | 'ch10-3term-reg'
  | 'lab1-instruments'
  | 'lab2-opamp-math'
  | 'lab3-ce-static'
  | 'lab4-ce-dynamic'
  | 'lab5-emitter-follower'
  | 'lab6-comparators';

export interface CircuitCase {
  id: SchematicId;
  chapterId: string;
  code: string; // e.g., "2.2" or "实验四"
  title: string;
  subtitle: string;
  badge: CaseBadge;
  syllabusSection: string;
  objectives: string[];
  principleSummary: string;
  keyFormulaLatex: string;
  experimentTips: string[];
  defaultViewMode: AnalysisMode;
  availableViewModes: AnalysisMode[];
  xyAxes?: { xExpr: string; yExpr: string; xLabel: string; yLabel: string };
  params: CircuitParam[];
  traces: PlotTraceConfig[];
  sweepFamily?: SweepFamilyConfig; // For BJT / MOSFET curve tracer families
  buildNetlist: (p: Record<string, number>, mode: AnalysisMode) => string;
  computeMetrics?: (
    p: Record<string, number>,
    sim: SimulationOutput | null,
    mode: AnalysisMode
  ) => MetricReadout[];
}

export interface ChapterGroup {
  id: string;
  shortTitle: string;
  fullTitle: string;
  hoursInfo: string;
  ideologyTitle?: string;
  ideologyContent?: string;
  cases: CircuitCase[];
}
