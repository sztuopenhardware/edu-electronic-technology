import type { ChapterGroup } from '../types';
import { SPICE_MODELS } from '../spiceModels';
import { calcBodeMetrics, calcWaveStats, formatEng } from '../utils/format';

export const CH1_TO_CH3: ChapterGroup[] = [
  {
    id: 'ch1',
    shortTitle: '第1章 绪论',
    fullTitle: '第1章 绪论：信号频谱与放大电路模型',
    hoursInfo: '大纲第1章 · 信号与频谱 / 放大器四端模型',
    ideologyTitle: '我国模拟电子技术发展历程与科技自立自强',
    ideologyContent:
      '回顾黄昆、王守武等老一辈半导体科学家的奠基贡献。模拟前端芯片是通信、医疗仪器、工业控制感知物理世界的桥梁，精准掌握信号与放大基本指标是突破高端模拟芯片的基础。',
    cases: [
      {
        id: 'ch1-signal-spectrum',
        chapterId: 'ch1',
        code: '1.1',
        title: '信号、信号频谱及奇次谐波合成演示',
        subtitle: '观察正弦基波叠加3次、5次、7次谐波逼近方波的时域波形与FFT频谱分布',
        badge: '理解掌握',
        syllabusSection: '1.(2) 信号、信号频谱及类型',
        objectives: [
          '理解模拟信号在时域与频域中的双重表达方式',
          '观察傅里叶级数奇次谐波叠加形成近似方波的物理过程',
          '掌握利用示波器与频谱仪（FFT）辨识基波及高次谐波分量',
        ],
        principleSummary:
          '任何周期非正弦电信号均可分解为直流分量、基波与无穷多高次谐波正弦量之和。对称方波仅含奇次谐波，其幅值按 1, 1/3, 1/5, 1/7 规律衰减。',
        keyFormulaLatex:
          'v(t) = V_m \\left( \\sin\\omega_0 t + \\frac{k_3}{3}\\sin 3\\omega_0 t + \\frac{k_5}{5}\\sin 5\\omega_0 t + \\frac{k_7}{7}\\sin 7\\omega_0 t \\right)',
        experimentTips: [
          '将三、五、七次谐波权重全部调为 0%，此时仅剩纯净单频正弦基波；切换上方【FFT 频谱】视图可见单一谱线。',
          '逐步将各次奇次谐波权重拉至 100%，观察合成电压 v(out) 如何逐渐变陡并逼近理想方波。',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran', 'fft'],
        params: [
          { key: 'f0', label: '基波频率 f0', unit: 'Hz', min: 200, max: 2000, step: 100, defaultValue: 1000 },
          { key: 'vm', label: '基波幅值 Vm', unit: 'V', min: 0.5, max: 5, step: 0.5, defaultValue: 2.0 },
          { key: 'h3', label: '3次谐波权重', unit: '%', min: 0, max: 100, step: 10, defaultValue: 100 },
          { key: 'h5', label: '5次谐波权重', unit: '%', min: 0, max: 100, step: 10, defaultValue: 100 },
          { key: 'h7', label: '7次谐波权重', unit: '%', min: 0, max: 100, step: 10, defaultValue: 100 },
        ],
        traces: [
          { expr: 'v(fund)', label: '基波分量 v(fund)', color: '#38bdf8', unit: 'V', dashed: true },
          { expr: 'v(out)', label: '合成信号 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p) => {
          const a3 = ((p.vm / 3) * p.h3) / 100;
          const a5 = ((p.vm / 5) * p.h5) / 100;
          const a7 = ((p.vm / 7) * p.h7) / 100;
          const tStop = 3 / p.f0;
          const tStep = tStop / 500;
          return `Ch1 Signal and Spectrum Synthesis
V1 fund 0 SIN(0 ${p.vm} ${p.f0})
V3 n3 fund SIN(0 ${a3.toFixed(4)} ${3 * p.f0})
V5 n5 n3 SIN(0 ${a5.toFixed(4)} ${5 * p.f0})
V7 out n5 SIN(0 ${a7.toFixed(4)} ${7 * p.f0})
Rload out 0 10k
.tran ${tStep.toExponential(3)} ${tStop.toExponential(3)}
.end`;
        },
        computeMetrics: (p, sim) => {
          const outStats = calcWaveStats(sim?.series[1]?.values ?? []);
          return [
            { label: '基波频率 f0', value: `${p.f0} Hz`, hint: '最高7次谐波 ' + 7 * p.f0 + ' Hz' },
            { label: '合成信号峰峰值', value: formatEng(outStats.vpp, 'V', 2), highlight: true },
            { label: '合成信号有效值', value: formatEng(outStats.vRms, 'V', 2) },
          ];
        },
      },
      {
        id: 'ch1-amp-model',
        chapterId: 'ch1',
        code: '1.2',
        title: '电压放大电路模型及主要性能指标（Av, Ri, Ro）',
        subtitle: '仿真信号源内阻 Rs、输入电阻 Ri、输出电阻 Ro 与负载 RL 对实际放大倍数的两级分压影响',
        badge: '核心掌握',
        syllabusSection: '1.(3) 放大电路模型及主要性能指标',
        objectives: [
          '掌握电压放大模型的四大核心指标：Avo（开路电压增益）、Ri（输入电阻）、Ro（输出电阻）、BW（通频带）',
          '定量理解输入分压 Ri/(Rs+Ri) 与输出带载分压 RL/(Ro+RL) 的物理意义',
          '掌握工程中“高输入电阻、低输出电阻”的设计准则',
        ],
        principleSummary:
          '电压放大器可等效为含输入电阻 Ri、受控电压源 Avo·Vi 和输出电阻 Ro 的双口网络。当信号源有内阻 Rs 且接有负载 RL 时，输入端与输出端各发生一次电阻分压。',
        keyFormulaLatex:
          'A_{vs} = \\frac{V_o}{V_s} = \\frac{R_i}{R_s + R_i} \\cdot A_{vo} \\cdot \\frac{R_L}{R_o + R_L}',
        experimentTips: [
          '增大信号源内阻 Rs 或减小放大器输入电阻 Ri，观察净输入电压 v(in) 的衰减现象。',
          '减小负载电阻 RL 或增大输出电阻 Ro，验证输出电压 v(out) 跌落（带载能力下降）。',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran', 'ac'],
        params: [
          { key: 'rs', label: '信号源内阻 Rs', unit: 'kΩ', min: 0.1, max: 20, step: 0.5, defaultValue: 2 },
          { key: 'ri', label: '输入电阻 Ri', unit: 'kΩ', min: 1, max: 50, step: 1, defaultValue: 18 },
          { key: 'avo', label: '开路电压增益 Avo', unit: '倍', min: 5, max: 100, step: 5, defaultValue: 20 },
          { key: 'ro', label: '输出电阻 Ro', unit: 'kΩ', min: 0.1, max: 10, step: 0.2, defaultValue: 1 },
          { key: 'rl', label: '负载电阻 RL', unit: 'kΩ', min: 0.5, max: 50, step: 0.5, defaultValue: 9 },
        ],
        traces: [
          { expr: 'v(vs)', label: '源电动势 v(vs)', color: '#94a3b8', unit: 'V', dashed: true },
          { expr: 'v(in)', label: '放大器输入端 v(in)', color: '#38bdf8', unit: 'V' },
          { expr: 'v(out)', label: '负载输出电压 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p, mode) => {
          const analysis =
            mode === 'ac' ? '.ac dec 30 10 10Meg' : '.tran 10u 3m';
          return `Ch1 Voltage Amplifier Equivalent Model
Vs vs 0 SIN(0 0.1 1k) AC 1
Rs vs in ${p.rs}k
Ri in 0 ${p.ri}k
Eamp int_o 0 in 0 ${p.avo}
Ro int_o out ${p.ro}k
Cp out 0 159p
RL out 0 ${p.rl}k
${analysis}
.end`;
        },
        computeMetrics: (p, sim) => {
          const inAtten = p.ri / (p.rs + p.ri);
          const outAtten = p.rl / (p.ro + p.rl);
          const avActual = p.avo * outAtten;
          const avsActual = inAtten * avActual;
          const voStats = calcWaveStats(sim?.series[2]?.values ?? []);
          return [
            { label: '输入耦合效率 Ri/(Rs+Ri)', value: `${(inAtten * 100).toFixed(1)}%` },
            { label: '有载电压增益 Av = Vo/Vi', value: `${avActual.toFixed(2)} 倍`, highlight: true },
            { label: '源电压增益 Avs = Vo/Vs', value: `${avsActual.toFixed(2)} 倍` },
            { label: '实测输出峰峰值 Vo(pp)', value: formatEng(voStats.vpp, 'V', 2) },
          ];
        },
      },
    ],
  },
  {
    id: 'ch2',
    shortTitle: '第2章 运算放大器',
    fullTitle: '第2章 运算放大器及其基本线性应用电路',
    hoursInfo: '大纲第2章 · 理想运放 / 虚短虚断 / 比例加减微积分 / 仪用ECG',
    ideologyTitle: '“精神虚断”——屏蔽浮躁，潜心攻关',
    ideologyContent:
      '理想运放线性工作时具有“虚断”（输入端几乎不索取外部电流）和“虚短”（精准跟随动态目标）的特性，启示工程研发应修炼内功、屏蔽外界浮躁干扰、潜心精确处理核心问题。',
    cases: [
      {
        id: 'ch2-opamp-transfer',
        chapterId: 'ch2',
        code: '2.1',
        title: '集成运算放大器电压传输特性与饱和限幅',
        subtitle: '观测开环/高增益下极窄的线性放大区与受限于 ±VCC 电源轨的正负饱和区',
        badge: '核心掌握',
        syllabusSection: '2.(1)(2) 集成运放传输特性与理想运放模型',
        objectives: [
          '理解集成运放电压传输特性曲线的线性区与正、负饱和区',
          '观察无负反馈（或增益过高）时微弱输入引起运放饱和削顶的现象',
        ],
        principleSummary:
          '实际运放开环差模增益高达 10^5，电源电压为 ±VCC 时，仅当差模输入 |Vid| < VCC/Aod（约百微伏级）时工作在线性区，超出即进入正/负饱和限幅状态。',
        keyFormulaLatex: 'V_o = \\mathrm{clip}\\big(A_d (V_+ - V_-),\\; -V_{OM},\\; +V_{OM}\\big)',
        experimentTips: [
          '切换至【直流扫描 (.dc)】或【X-Y 传输曲线】，直观查看输出电压随输入电压变化的 S 型陡峭传输曲线。',
          '调大输入信号幅值或闭环增益，观察正负电源轨 ±VCC 造成的削波饱和。',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran', 'xy', 'dc'],
        xyAxes: { xExpr: 'v(in)', yExpr: 'v(out)', xLabel: '输入电压 v(in)', yLabel: '输出电压 v(out)' },
        params: [
          { key: 'vinAmp', label: '输入正弦幅值 Vim', unit: 'V', min: 0.2, max: 3.0, step: 0.2, defaultValue: 1.2 },
          { key: 'gain', label: '设定放大倍数', unit: '倍', min: 2, max: 30, step: 2, defaultValue: 12 },
          { key: 'vcc', label: '双电源电压 ±VCC', unit: 'V', min: 5, max: 15, step: 1, defaultValue: 12 },
        ],
        traces: [
          { expr: 'v(in)', label: '输入信号 v(in)', color: '#38bdf8', unit: 'V' },
          { expr: 'v(out)', label: '运放输出 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p, mode) => {
          const rf = (p.gain - 1) * 10;
          const cmd =
            mode === 'dc' ? '.dc Vin -3 3 0.03' : '.tran 15u 3m';
          return `Ch2 OpAmp Transfer Characteristic
${SPICE_MODELS.OPAMP_SUBCKT}
VCC vcc 0 ${p.vcc}
VEE vee 0 -${p.vcc}
Vin in 0 SIN(0 ${p.vinAmp} 1k)
Xop in vn vcc vee out OPAMP_STD
R1 vn 0 10k
Rf out vn ${Math.max(rf, 0.1)}k
RL out 0 10k
${cmd}
.end`;
        },
        computeMetrics: (p, sim) => {
          const vo = calcWaveStats(sim?.series[1]?.values ?? []);
          const idealPeak = p.vinAmp * p.gain;
          const clipped = idealPeak > p.vcc - 0.6;
          return [
            { label: '理论不失真峰值', value: `${idealPeak.toFixed(2)} V` },
            { label: '实测输出峰值 Vmax', value: `${vo.vMax.toFixed(2)} V`, highlight: true },
            { label: '工作区状态判别', value: clipped ? '已进入饱和限幅区' : '线性放大区', highlight: clipped },
          ];
        },
      },
      {
        id: 'ch2-inv-amp',
        chapterId: 'ch2',
        code: '2.2',
        title: '反相比例运算电路与“虚短/虚断”定量验证',
        subtitle: '实时监测反相输入端虚地电位 v(vn)≈0V 及比例增益 Av = -Rf / R1',
        badge: '核心掌握',
        syllabusSection: '2.(3) 基本线性运放电路：反相放大与虚短虚断',
        objectives: [
          '掌握深度负反馈下“虚短”（V- ≈ V+ = 0，即虚地）与“虚断”（I- ≈ I+ ≈ 0）成立条件',
          '熟练推导并验证反相比例运算公式 Vo = -(Rf/R1)·Vi 与输入电阻 Ri = R1',
        ],
        principleSummary:
          '同相端接地（V+ = 0），深度电压并联负反馈迫使反相端电位 V- ≈ 0V（虚地）。由虚断知流过 R1 的电流全部流经 Rf，故闭环增益仅取决于外部电阻比值且相位反相 180°。',
        keyFormulaLatex:
          'A_{vf} = \\frac{V_o}{V_i} = -\\frac{R_f}{R_1}, \\quad V_- \\approx V_+ = 0\\text{ V (虚地)}, \\quad R_i \\approx R_1',
        experimentTips: [
          '将鼠标移到示波器波形上查看黄色通道 v(vn)：尽管输入输出达数伏，反相端电位始终维持在微伏级（虚地）！',
          '调节 Rf 与 R1 比值，观察输出波形反相放大倍数与理论值的精确吻合。',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran', 'ac', 'xy'],
        xyAxes: { xExpr: 'v(in)', yExpr: 'v(out)', xLabel: 'v(in)', yLabel: 'v(out)' },
        params: [
          { key: 'vin', label: '输入正弦峰值 Vim', unit: 'V', min: 0.2, max: 2.5, step: 0.1, defaultValue: 1.0 },
          { key: 'r1', label: '输入电阻 R1', unit: 'kΩ', min: 2, max: 50, step: 2, defaultValue: 10 },
          { key: 'rf', label: '反馈电阻 Rf', unit: 'kΩ', min: 5, max: 100, step: 5, defaultValue: 50 },
          { key: 'rl', label: '负载电阻 RL', unit: 'kΩ', min: 1, max: 50, step: 1, defaultValue: 10 },
        ],
        traces: [
          { expr: 'v(in)', label: '输入电压 v(in)', color: '#38bdf8', unit: 'V' },
          { expr: 'v(vn)', label: '反相端虚地电位 v(vn)', color: '#fbbf24', unit: 'V', dashed: true },
          { expr: 'v(out)', label: '输出电压 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p, mode) => {
          const analysis =
            mode === 'ac' ? '.ac dec 30 10 10Meg' : '.tran 15u 3m';
          return `Ch2 Inverting Amplifier
${SPICE_MODELS.OPAMP_SUBCKT}
VCC vcc 0 15
VEE vee 0 -15
Vin in 0 SIN(0 ${p.vin} 1k) AC 1
R1 in vn ${p.r1}k
Rf vn out ${p.rf}k
Rp vp 0 ${(p.r1 * p.rf) / (p.r1 + p.rf)}k
Xop vp vn vcc vee out OPAMP_STD
RL out 0 ${p.rl}k
${analysis}
.end`;
        },
        computeMetrics: (p, sim) => {
          const vi = calcWaveStats(sim?.series[0]?.values ?? []);
          const vn = calcWaveStats(sim?.series[1]?.values ?? []);
          const vo = calcWaveStats(sim?.series[2]?.values ?? []);
          const theoGain = -p.rf / p.r1;
          const measGain = vi.vpp > 1e-6 ? -(vo.vpp / vi.vpp) : 0;
          return [
            { label: '理论电压增益 -Rf/R1', value: `${theoGain.toFixed(2)} 倍` },
            { label: 'Ngspice 实测增益', value: `${measGain.toFixed(2)} 倍`, highlight: true },
            { label: '虚地端残余幅值 Vn(pp)', value: formatEng(vn.vpp, 'V', 2), hint: '验证 V- ≈ 0V' },
            { label: '等效输入电阻 Ri', value: `${p.r1.toFixed(1)} kΩ` },
          ];
        },
      },
      {
        id: 'ch2-noninv-amp',
        chapterId: 'ch2',
        code: '2.3',
        title: '同相比例运算电路与电压跟随器',
        subtitle: '验证 V- ≈ V+ 虚短跟随特性、同相放大 Av = 1 + Rf/R1 与极高输入阻抗缓冲作用',
        badge: '核心掌握',
        syllabusSection: '2.(3) 同相放大器与电压跟随器',
        objectives: [
          '掌握同相比例放大电路增益表达式 Av = 1 + Rf/R1 及极高输入阻抗特点',
          '理解当 Rf = 0（或 R1 → ∞）时退化为单位增益电压跟随器，实现前后级阻抗隔离',
        ],
        principleSummary:
          '输入信号直接加至运放同相端，深度电压串联负反馈令 V- ≈ V+ = Vi，输出与输入同相，闭环电压增益恒大于或等于 1。当设 Rf = 0 时即为电压跟随器（Av = 1）。',
        keyFormulaLatex: 'A_{vf} = 1 + \\frac{R_f}{R_1}, \\quad \\text{电压跟随器 }(R_f=0): V_o = V_i',
        experimentTips: [
          '将反馈电阻 Rf 拖至 0 kΩ，此时电路变为【电压跟随器】，即使调大信号源内阻 Rs、减小负载 RL，输出仍精准跟随源电动势！',
          '对比反相端 v(vn) 与同相端 v(in) 曲线——两者几乎完全重合，直观展示“虚短”但非“虚地”（共模电压等于 Vi）。',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran', 'ac'],
        params: [
          { key: 'vin', label: '源信号幅值 Vsm', unit: 'V', min: 0.2, max: 3.0, step: 0.2, defaultValue: 1.0 },
          { key: 'r1', label: '接地电阻 R1', unit: 'kΩ', min: 2, max: 50, step: 2, defaultValue: 10 },
          { key: 'rf', label: '反馈电阻 Rf (0=跟随器)', unit: 'kΩ', min: 0, max: 80, step: 5, defaultValue: 30 },
          { key: 'rs', label: '信号源内阻 Rs', unit: 'kΩ', min: 0.1, max: 100, step: 5, defaultValue: 10 },
        ],
        traces: [
          { expr: 'v(in)', label: '同相端电压 v(in)', color: '#38bdf8', unit: 'V' },
          { expr: 'v(vn)', label: '反相端电压 v(vn)', color: '#fbbf24', unit: 'V', dashed: true },
          { expr: 'v(out)', label: '输出电压 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p, mode) => {
          const rfVal = Math.max(p.rf, 0.001);
          const analysis =
            mode === 'ac' ? '.ac dec 30 10 10Meg' : '.tran 15u 3m';
          return `Ch2 Non-Inverting Amplifier and Voltage Follower
${SPICE_MODELS.OPAMP_SUBCKT}
VCC vcc 0 15
VEE vee 0 -15
Vs vs 0 SIN(0 ${p.vin} 1k) AC 1
Rs vs in ${p.rs}k
Xop in vn vcc vee out OPAMP_STD
R1 vn 0 ${p.r1}k
Rf out vn ${rfVal}k
RL out 0 5k
${analysis}
.end`;
        },
        computeMetrics: (p, sim) => {
          const vi = calcWaveStats(sim?.series[0]?.values ?? []);
          const vo = calcWaveStats(sim?.series[2]?.values ?? []);
          const theo = 1 + p.rf / p.r1;
          const meas = vi.vpp > 1e-6 ? vo.vpp / vi.vpp : 0;
          return [
            { label: '电路模式', value: p.rf === 0 ? '电压跟随器 (Buffer)' : '同相比例放大器' },
            { label: '理论增益 1 + Rf/R1', value: `${theo.toFixed(2)} 倍` },
            { label: '实测电压增益 Vo/Vi', value: `${meas.toFixed(2)} 倍`, highlight: true },
          ];
        },
      },
      {
        id: 'ch2-add-sub',
        chapterId: 'ch2',
        code: '2.4',
        title: '加法与减法（差分比例）运算电路',
        subtitle: '一键切换反相求和电路与单运放减法器，验证多路信号线性叠加与做差运算',
        badge: '核心掌握',
        syllabusSection: '2.(3) 加法、减法运算电路',
        objectives: [
          '掌握利用虚地电流叠加原理构建反相求和电路',
          '掌握利用叠加定理与电阻对称匹配条件分析减法（差分）运算电路',
        ],
        principleSummary:
          '反相求和将各支路输入电流在虚地节点汇总流入反馈电阻 Rf；单运放减法器则同时利用反相端与同相端分压，实现两路不同频率或直流偏置信号的精确加减合成。',
        keyFormulaLatex:
          '\\text{求和: } V_o = -R_f\\left(\\frac{V_{i1}}{R_1}+\\frac{V_{i2}}{R_2}\\right) \\quad \\text{减法: } V_o = \\frac{R_f}{R_1}(V_{i2}-V_{i1})',
        experimentTips: [
          '在【反相求和】模式下，两路分别为 1kHz 低频正弦与 5kHz 高频正弦，观察输出信号如何将两路按权重混合叠加。',
          '切换为【单运放减法器】并将 V1、V2 设为相同信号，观察输出几乎抵消为 0V（共模抑制能力）。',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran'],
        params: [
          {
            key: 'topology',
            label: '运算电路类型',
            unit: '',
            min: 0,
            max: 1,
            step: 1,
            defaultValue: 0,
            options: [
              { label: '反相求和加法器', value: 0 },
              { label: '单运放差分减法器', value: 1 },
            ],
          },
          { key: 'v1Amp', label: '信号1幅值 V1m (1kHz)', unit: 'V', min: 0.2, max: 3, step: 0.2, defaultValue: 1.5 },
          { key: 'v2Amp', label: '信号2幅值 V2m (4kHz)', unit: 'V', min: 0, max: 3, step: 0.2, defaultValue: 0.8 },
          { key: 'r1', label: '输入电阻 R1=R2', unit: 'kΩ', min: 5, max: 30, step: 5, defaultValue: 10 },
          { key: 'rf', label: '反馈电阻 Rf', unit: 'kΩ', min: 5, max: 50, step: 5, defaultValue: 20 },
        ],
        traces: [
          { expr: 'v(in1)', label: '输入通道1 v(in1)', color: '#38bdf8', unit: 'V' },
          { expr: 'v(in2)', label: '输入通道2 v(in2)', color: '#fbbf24', unit: 'V', dashed: true },
          { expr: 'v(out)', label: '运算输出 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p) => {
          if (p.topology === 0) {
            return `Ch2 Inverting Summing Amplifier
${SPICE_MODELS.OPAMP_SUBCKT}
VCC vcc 0 15
VEE vee 0 -15
V1 in1 0 SIN(0 ${p.v1Amp} 1k)
V2 in2 0 SIN(0 ${p.v2Amp} 4k)
R1 in1 vn ${p.r1}k
R2 in2 vn ${p.r1}k
Rf vn out ${p.rf}k
Xop 0 vn vcc vee out OPAMP_STD
RL out 0 10k
.tran 10u 3m
.end`;
          }
          return `Ch2 Difference Subtractor Amplifier
${SPICE_MODELS.OPAMP_SUBCKT}
VCC vcc 0 15
VEE vee 0 -15
V1 in1 0 SIN(0 ${p.v1Amp} 1k)
V2 in2 0 SIN(0 ${p.v2Amp} 4k)
R1 in1 vn ${p.r1}k
Rf vn out ${p.rf}k
R2 in2 vp ${p.r1}k
R3 vp 0 ${p.rf}k
Xop vp vn vcc vee out OPAMP_STD
RL out 0 10k
.tran 10u 3m
.end`;
        },
        computeMetrics: (p, sim) => {
          const vo = calcWaveStats(sim?.series[2]?.values ?? []);
          const ratio = p.rf / p.r1;
          return [
            { label: '当前拓扑', value: p.topology === 0 ? '反相加法器' : '差分减法器' },
            { label: '比例权重系数 Rf/R1', value: `${ratio.toFixed(2)}` },
            { label: '合成输出峰峰值 Vo(pp)', value: formatEng(vo.vpp, 'V', 2), highlight: true },
          ];
        },
      },
      {
        id: 'ch2-int-diff',
        chapterId: 'ch2',
        code: '2.5',
        title: '积分与微分运算电路（方波→三角波 / 尖峰脉冲）',
        subtitle: '在方波激励下直观验证积分器输出线性斜坡三角波、微分器提取跳变沿脉冲',
        badge: '核心掌握',
        syllabusSection: '2.(3) 微分、积分运算电路',
        objectives: [
          '掌握积分电路将方波转换为三角波、将正弦波移相 90° 的时频域关系',
          '掌握实用微分电路提取边沿速率变化的原理及防高频自激小电阻的作用',
        ],
        principleSummary:
          '将反相放大器的反馈电阻换为电容 Cf 即构成积分器，恒定输入电流对电容恒流充放电产生线性三角波；互换 R、C 位置则构成微分器，输出正比于输入电压变化率 dv/dt。',
        keyFormulaLatex:
          '\\text{积分: } v_o(t) = -\\frac{1}{R_1 C_f}\\int v_i(t)\\,dt \\qquad \\text{微分: } v_o(t) = -R_f C_1 \\frac{dv_i(t)}{dt}',
        experimentTips: [
          '在【积分运算电路】下减小 R1 或 Cf，观察三角波斜率变陡、幅值增大！',
          '切换至【微分运算电路】，观察方波每次上升/下降沿瞬间产生的负向与正向微分尖峰脉冲。',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran', 'ac'],
        params: [
          {
            key: 'modeType',
            label: '电路模式选择',
            unit: '',
            min: 0,
            max: 1,
            step: 1,
            defaultValue: 0,
            options: [
              { label: '反相积分器 (方波→三角波)', value: 0 },
              { label: '实用微分器 (方波→尖峰脉冲)', value: 1 },
            ],
          },
          { key: 'rKohm', label: '主电阻 R', unit: 'kΩ', min: 2, max: 30, step: 2, defaultValue: 10 },
          { key: 'cNf', label: '电容 C', unit: 'nF', min: 10, max: 100, step: 10, defaultValue: 50 },
          { key: 'freq', label: '输入方波频率', unit: 'Hz', min: 250, max: 2000, step: 250, defaultValue: 500 },
        ],
        traces: [
          { expr: 'v(in)', label: '输入方波 v(in)', color: '#38bdf8', unit: 'V', dashed: true },
          { expr: 'v(out)', label: '运算输出 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p, mode) => {
          const period = 1 / p.freq;
          const half = period / 2;
          const tr = period * 0.015;
          const tStop = 3.5 * period;
          const tStep = tStop / 500;
          const analysis =
            mode === 'ac'
              ? '.ac dec 30 10 100k'
              : `.tran ${tStep.toExponential(3)} ${tStop.toExponential(3)}`;

          if (p.modeType === 0) {
            // 实用积分器（并联 1Meg 直流泄放电阻防止初始积分漂移饱和）
            return `Ch2 Practical Integrator
${SPICE_MODELS.OPAMP_FAST_SUBCKT}
VCC vcc 0 15
VEE vee 0 -15
Vin in 0 PULSE(-2 2 0 ${tr} ${tr} ${half - tr} ${period}) AC 1
R1 in vn ${p.rKohm}k
Cf vn out ${p.cNf}n
Rdc vn out 500k
Xop 0 vn vcc vee out OPAMP_FAST
RL out 0 10k
${analysis}
.end`;
          }
          // 实用微分器（输入串小电阻抑制高频过冲振荡）
          return `Ch2 Practical Differentiator
${SPICE_MODELS.OPAMP_FAST_SUBCKT}
VCC vcc 0 15
VEE vee 0 -15
Vin in 0 PULSE(-1.5 1.5 0 ${tr * 2} ${tr * 2} ${half - tr * 2} ${period}) AC 1
Rs in c_in 470
C1 c_in vn ${p.cNf * 0.2}n
Rf vn out ${p.rKohm}k
Cf vn out 20p
Xop 0 vn vcc vee out OPAMP_FAST
RL out 0 10k
${analysis}
.end`;
        },
        computeMetrics: (p, sim) => {
          const tauMs = p.rKohm * p.cNf * 1e-3; // kΩ * nF = μs -> *1e-3 = ms
          const vo = calcWaveStats(sim?.series[1]?.values ?? []);
          return [
            { label: '时间常数 τ = R·C', value: `${(tauMs * 1000).toFixed(0)} μs` },
            { label: '特征转折频率 1/(2πRC)', value: formatEng(1 / (2 * Math.PI * p.rKohm * 1e3 * p.cNf * 1e-9), 'Hz', 1) },
            { label: '输出信号峰峰值 Vo(pp)', value: formatEng(vo.vpp, 'V', 2), highlight: true },
          ];
        },
      },
      {
        id: 'ch2-inst-ecg',
        chapterId: 'ch2',
        code: '2.6',
        title: 'AI项目实践：三运放仪用放大器与心电图(ECG)抗工频干扰前端',
        subtitle: '从强 50Hz 工频共模干扰中提取毫伏级模拟心电 QRS 波差分生理电信号',
        badge: 'AI项目实践',
        syllabusSection: '2.(3) 仪用放大器 + AI项目实践：心电图的测试电路设计',
        objectives: [
          '掌握三运放仪用放大器（Instrumentation Amplifier）前级缓冲差模放大 + 后级差分减法的结构优势',
          '理解极高输入阻抗与高共模抑制比（CMRR）在人体心电微弱信号检测中的关键作用',
        ],
        principleSummary:
          '人体皮肤电极采集的心电信号仅数毫伏，却常伴随高达数百毫伏的 50Hz 市电共模干扰。三运放仪用放大器第一级对差模信号放大 (1+2R1/Rg) 倍而对共模信号仅 1 倍跟随，第二级差分电桥彻底抵消共模干扰！',
        keyFormulaLatex:
          'A_d = \\left(1 + \\frac{2R_1}{R_g}\\right)\\frac{R_3}{R_2}, \\quad V_o = A_d (V_{ecg+} - V_{ecg-})',
        experimentTips: [
          '观察蓝色通道 v(vp)：2mV 的心电脉冲完全淹没在 500mV 的 50Hz 正弦工频干扰中！',
          '观察绿色输出通道 v(out)：经三运放仪用放大器共模抑制与差模放大后，清晰的周期性心电 R 波脉冲被完美还原！调节 Rg 可无损改变总增益。',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran'],
        params: [
          { key: 'rg', label: '增益设定电阻 Rg', unit: 'kΩ', min: 0.2, max: 5.0, step: 0.2, defaultValue: 0.5 },
          { key: 'vcm', label: '50Hz 工频共模干扰幅值', unit: 'V', min: 0, max: 1.5, step: 0.1, defaultValue: 0.6 },
          { key: 'vecgMv', label: '模拟心电 R 波差分峰值', unit: 'mV', min: 2, max: 20, step: 2, defaultValue: 10 },
        ],
        traces: [
          { expr: 'v(vp)', label: '电极单端输入(含50Hz共模干扰) v(vp)', color: '#38bdf8', unit: 'V', dashed: true },
          { expr: 'v(out)', label: '仪用放大提取心电输出 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p) => {
          const halfDiff = (p.vecgMv * 1e-3) / 2;
          return `Ch2 AI Project ECG Instrumentation Amplifier
${SPICE_MODELS.OPAMP_SUBCKT}
VCC vcc 0 12
VEE vee 0 -12
* 50Hz common-mode mains hum + synthetic periodic ECG R-wave pulse
Vcm cm 0 SIN(0 ${p.vcm} 50)
Ediffp vp cm VALUE = { ${halfDiff} * (exp(-pow((time-0.015)/0.0025, 2)) + exp(-pow((time-0.055)/0.0025, 2)) - 0.22*exp(-pow((time-0.025)/0.005, 2)) - 0.22*exp(-pow((time-0.065)/0.005, 2))) }
Ediffn vn cm VALUE = { -${halfDiff} * (exp(-pow((time-0.015)/0.0025, 2)) + exp(-pow((time-0.055)/0.0025, 2)) - 0.22*exp(-pow((time-0.025)/0.005, 2)) - 0.22*exp(-pow((time-0.065)/0.005, 2))) }
* Stage 1: Dual Non-inverting Input Buffers with shared Rg
Xop1 vp n1 vcc vee vo1 OPAMP_STD
Xop2 vn n2 vcc vee vo2 OPAMP_STD
Rg n1 n2 ${p.rg}k
R1a vo1 n1 25k
R1b vo2 n2 25k
* Stage 2: Precision Unity Difference Subtractor
R2a vo1 sub_n 20k
R3a sub_n out 40k
R2b vo2 sub_p 20k
R3b sub_p 0 40k
Xop3 sub_p sub_n vcc vee out OPAMP_STD
RL out 0 10k
.tran 150u 80m
.end`;
        },
        computeMetrics: (p, sim) => {
          const ad = (1 + 50 / p.rg) * 2;
          const vo = calcWaveStats(sim?.series[1]?.values ?? []);
          return [
            { label: '差模总增益 Ad', value: `${ad.toFixed(1)} 倍 (${(20 * Math.log10(ad)).toFixed(1)} dB)`, highlight: true },
            { label: '输入工频共模干扰', value: `${(p.vcm * 1000).toFixed(0)} mV (50 Hz)` },
            { label: '心电输出峰值 Vmax', value: formatEng(vo.vMax, 'V', 2), hint: '50Hz共模已被对称抵消' },
          ];
        },
      },
    ],
  },
  {
    id: 'ch3',
    shortTitle: '第3章 二极管及基本电路',
    fullTitle: '第3章 半导体二极管及其基本应用电路',
    hoursInfo: '大纲第3章 · PN结 / 伏安特性 / 限幅钳位 / 稳压管 / 全波整流',
    ideologyTitle: '单向导电性与跨越死区导通阈值的定力',
    ideologyContent:
      '二极管面对反向偏置坚守微小漏电的关断定力，而在正向激励跨过死区阈值电压后展现低阻畅通特性——恰如求学与科研需坚守原则方向、积累突破关键瓶颈。',
    cases: [
      {
        id: 'ch3-diode-iv',
        chapterId: 'ch3',
        code: '3.1',
        title: 'PN结与不同材料二极管伏安特性曲线对比（硅/锗/肖特基/LED）',
        subtitle: '直流扫描对比硅管(~0.7V)、锗管(~0.3V)、肖特基管(~0.25V)与发光二极管(~1.9V)导通压降',
        badge: '核心掌握',
        syllabusSection: '3.(1)(2)(3) PN结单向导电性、二极管伏安特性及四种正向模型',
        objectives: [
          '掌握普通二极管指数型伏安特性方程与开启电压（死区电压）、正向导通压降',
          '对比理解理想模型、恒压降模型（0.7V）、折线模型和小信号微变电阻 rd = VT/ID 的适用条件',
        ],
        principleSummary:
          'PN结电流遵循肖克利指数方程 I = IS(e^(V/nVT) - 1)。禁带宽度与反向饱和电流 IS 决定了不同器件的开启门槛：肖特基管与锗管导通压降最低，硅管约 0.65~0.75V，LED 高达 1.8~3V。',
        keyFormulaLatex:
          'i_D = I_S \\left(e^{\\frac{v_D}{n V_T}} - 1\\right), \\quad r_d = \\frac{dv_D}{di_D} \\approx \\frac{V_T}{I_{DQ}} \\; (V_T \\approx 26\\text{ mV})',
        experimentTips: [
          '切换四种半导体材料类型，观察直流扫描曲线拐点（死区开启电压）在横轴上的明显平移！',
          '切换至【时域示波器 (.tran)】可对比正弦激励下的半波导通死区失真。',
        ],
        defaultViewMode: 'dc',
        availableViewModes: ['dc', 'tran'],
        params: [
          {
            key: 'diodeType',
            label: '二极管器件选型',
            unit: '',
            min: 0,
            max: 3,
            step: 1,
            defaultValue: 0,
            options: [
              { label: '1N4148 硅二极管 (~0.7V)', value: 0 },
              { label: '1N5819 肖特基管 (~0.25V)', value: 1 },
              { label: '锗检波二极管 (~0.3V)', value: 2 },
              { label: '红光 LED 发光管 (~1.9V)', value: 3 },
            ],
          },
          { key: 'rLim', label: '串联限流电阻 R', unit: 'Ω', min: 50, max: 1000, step: 50, defaultValue: 200 },
        ],
        traces: [
          { expr: 'i(vmeas)', label: '正向电流 iD (mA)', color: '#34d399', unit: 'mA', scale: 1000 },
        ],
        buildNetlist: (p, mode) => {
          const models = ['D_SI', 'D_SCHOTTKY', 'D_GE', 'D_LED'];
          const mName = models[p.diodeType] ?? 'D_SI';
          if (mode === 'dc') {
            const vMax = p.diodeType === 3 ? 2.6 : 1.1;
            return `Ch3 Diode IV Curve Sweep
${SPICE_MODELS.DIODES}
Vd vd_src 0 0
Vmeas vd_src anode 0
Rser anode d_in 1
D1 d_in 0 ${mName}
.dc Vd -0.5 ${vMax} 0.015
.end`;
          }
          return `Ch3 Diode Half-Wave Conduction
${SPICE_MODELS.DIODES}
Vs vs 0 SIN(0 3.0 1k)
R1 vs n1 ${p.rLim}
Vmeas n1 anode 0
D1 anode 0 ${mName}
.tran 15u 3m
.end`;
        },
        computeMetrics: (p) => {
          const names = ['硅 PN 结二极管', '肖特基势垒二极管', '锗点接触二极管', 'GaAsP 发光二极管'];
          const vons = ['≈ 0.68 V', '≈ 0.26 V', '≈ 0.32 V', '≈ 1.85 V'];
          return [
            { label: '当前半导体类型', value: names[p.diodeType] ?? '' },
            { label: '典型正向压降 VF', value: vons[p.diodeType] ?? '', highlight: true },
            { label: '常温热电压 VT', value: '25.85 mV (300 K)' },
          ];
        },
      },
      {
        id: 'ch3-clipper-clamper',
        chapterId: 'ch3',
        code: '3.2',
        title: '二极管基本应用电路：双向限幅器与直流钳位器',
        subtitle: '一键切换双向电平削波限幅与电容-二极管顶部/底部直流恢复钳位电路',
        badge: '核心掌握',
        syllabusSection: '3.(4) 二极管基本电路及其分析方法（限幅与钳位）',
        objectives: [
          '熟练运用恒压降模型分析双向限幅电路的上下限幅电平 ±(Vref + VD)',
          '理解二极管钳位电路利用电容充放电建立直流偏置、平移波形而不改变峰峰值的机理',
        ],
        principleSummary:
          '限幅电路在输入超过阈值时令二极管导通，将输出钳制在固定电位以保护后级；钳位电路通过大时间常数 RC 与二极管单向快充慢放，将交流信号底部或顶部锁定在参考电位附近。',
        keyFormulaLatex:
          '\\text{双向限幅: } V_{o} \\in [-V_{ref}-0.7,\\; +V_{ref}+0.7] \\qquad \\text{底部钳位: } V_{o,\\min} \\approx -0.7\\text{ V}',
        experimentTips: [
          '在【双向限幅器】下改变参考偏压 Vref，观察正弦波上下削平位置随之线性移动。',
          '切换至【正钳位器（底部钳零）】，观察正负对称的输入正弦波整体向上平移，总峰峰值保持不变！',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran', 'xy'],
        xyAxes: { xExpr: 'v(in)', yExpr: 'v(out)', xLabel: 'v(in)', yLabel: 'v(out)' },
        params: [
          {
            key: 'circuitKind',
            label: '应用电路功能',
            unit: '',
            min: 0,
            max: 1,
            step: 1,
            defaultValue: 0,
            options: [
              { label: '双向偏置限幅削波电路', value: 0 },
              { label: '二极管底部直流钳位电路', value: 1 },
            ],
          },
          { key: 'vinAmp', label: '输入正弦峰值 Vim', unit: 'V', min: 2, max: 10, step: 0.5, defaultValue: 6 },
          { key: 'vref', label: '参考偏置电压 Vref', unit: 'V', min: 0, max: 5, step: 0.5, defaultValue: 2.0 },
        ],
        traces: [
          { expr: 'v(in)', label: '输入波形 v(in)', color: '#38bdf8', unit: 'V', dashed: true },
          { expr: 'v(out)', label: '处理后输出 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p) => {
          if (p.circuitKind === 0) {
            return `Ch3 Dual Diode Clipper
${SPICE_MODELS.DIODES}
Vin in 0 SIN(0 ${p.vinAmp} 1k)
Rs in out 2k
D1 out vp D_SI
Vp vp 0 ${p.vref}
D2 vn out D_SI
Vn vn 0 -${p.vref}
RL out 0 100k
.tran 15u 3m
.end`;
          }
          return `Ch3 Diode Positive Clamper
${SPICE_MODELS.DIODES}
Vin in 0 SIN(0 ${p.vinAmp} 1k)
Cclamp in out 2.2u
Dclamp vn out D_SI
Vref vn 0 ${p.vref}
RL out 0 100k
.tran 20u 5m
.end`;
        },
        computeMetrics: (p, sim) => {
          const vi = calcWaveStats(sim?.series[0]?.values ?? []);
          const vo = calcWaveStats(sim?.series[1]?.values ?? []);
          return [
            { label: '输入峰峰值 Vi(pp)', value: formatEng(vi.vpp, 'V', 2) },
            { label: '输出最高电平 Vmax', value: formatEng(vo.vMax, 'V', 2), highlight: true },
            { label: '输出最低电平 Vmin', value: formatEng(vo.vMin, 'V', 2), highlight: true },
            { label: '输出直流均值 Vavg', value: formatEng(vo.vAvg, 'V', 2) },
          ];
        },
      },
      {
        id: 'ch3-zener-reg',
        chapterId: 'ch3',
        code: '3.3',
        title: '特殊二极管：齐纳稳压管反向击穿特性与并联稳压电路',
        subtitle: '仿真 5.1V / 6.2V 齐纳稳压二极管在电网波动与负载变化下的反向击穿稳压作用',
        badge: '核心掌握',
        syllabusSection: '3.(5) 特殊二极管：齐纳二极管结构、特性及基本应用',
        objectives: [
          '理解齐纳二极管工作在反向电击穿区时“电流大幅变化而端电压基本恒定”的稳压机理',
          '掌握并联稳压电路限流电阻 Rs 的选取条件（保证 IZmin < IZ < IZmax）',
        ],
        principleSummary:
          '当未稳压直流电源叠加上下波动纹波时，串联限流电阻 Rs 吸收大部分电压波动，处于反向击穿区的齐纳管通过自身电流 IZ 的自动增减维持负载端输出电压近似恒等于 VZ。',
        keyFormulaLatex:
          'I_R = I_Z + I_L = \\frac{V_I - V_Z}{R_s}, \\quad V_O \\approx V_Z \\;(\\text{当 } I_Z > I_{Z\\min})',
        experimentTips: [
          '减小负载电阻 RL（加重负载）：当 RL 过小导致分压低于 VZ 时，稳压管退出反向击穿区，稳压立即失效！',
          '切换至【直流扫描 (.dc)】可完整查看正向 0.7V 导通与反向 -5.1V 陡峭齐纳击穿的完整双向伏安曲线。',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran', 'dc'],
        params: [
          { key: 'vinDc', label: '输入直流电压 VI', unit: 'V', min: 4, max: 16, step: 0.5, defaultValue: 10 },
          { key: 'ripple', label: '输入电网纹波幅值', unit: 'V', min: 0.2, max: 3.0, step: 0.2, defaultValue: 1.5 },
          { key: 'rs', label: '限流电阻 Rs', unit: 'Ω', min: 100, max: 1000, step: 50, defaultValue: 250 },
          { key: 'rl', label: '负载电阻 RL', unit: 'Ω', min: 150, max: 2000, step: 50, defaultValue: 1000 },
        ],
        traces: [
          { expr: 'v(in)', label: '含纹波输入电压 v(in)', color: '#38bdf8', unit: 'V', dashed: true },
          { expr: 'v(out)', label: '齐纳稳压输出 v(out)', color: '#34d399', unit: 'V' },
          { expr: 'i(vzmeas)', label: '齐纳管反向电流 iZ (mA)', color: '#fbbf24', unit: 'mA', scale: 1000, axis: 'right' },
        ],
        buildNetlist: (p, mode) => {
          if (mode === 'dc') {
            return `Ch3 Zener Full Bidirectional IV Curve
${SPICE_MODELS.ZENERS}
Vs in 0 0
Rs in out 50
Vzmeas 0 z_an 0
Dz z_an out DZ_5V1
.dc Vs -8 2 0.05
.end`;
          }
          return `Ch3 Zener Shunt Voltage Regulator
${SPICE_MODELS.ZENERS}
Vin in 0 SIN(${p.vinDc} ${p.ripple} 100)
Rs in out ${p.rs}
Vzmeas 0 z_an 0
Dz z_an out DZ_5V1
RL out 0 ${p.rl}
.tran 150u 30m
.end`;
        },
        computeMetrics: (p, sim) => {
          const vi = calcWaveStats(sim?.series[0]?.values ?? []);
          const vo = calcWaveStats(sim?.series[1]?.values ?? []);
          const iz = calcWaveStats(sim?.series[2]?.values ?? []);
          const thevV = (p.vinDc * p.rl) / (p.rs + p.rl);
          return [
            { label: '戴维南开路分压', value: `${thevV.toFixed(2)} V`, hint: thevV < 5.1 ? '低于5.1V，脱开稳压!' : '大于VZ，正常击穿稳压' },
            { label: '输出平均稳压值 VO', value: formatEng(vo.vAvg, 'V', 2), highlight: true },
            { label: '输入纹波 → 输出纹波', value: `${formatEng(vi.vpp, 'V', 2)} → ${formatEng(vo.vpp, 'V', 2)}` },
            { label: '稳压管平均电流 IZ', value: `${iz.vAvg.toFixed(2)} mA` },
          ];
        },
      },
      {
        id: 'ch3-charger-rectifier',
        chapterId: 'ch3',
        code: '3.4',
        title: 'AI项目实践：手机充电器前端二极管桥式全波整流电路',
        subtitle: '对比硅整流桥与低压降肖特基整流桥的正负半周交替导通路径与转换效率',
        badge: 'AI项目实践',
        syllabusSection: 'AI项目实践：手机充电器内部电路（如何用二极管实现全波整流）',
        objectives: [
          '掌握四个二极管组成的单相桥式全波整流电路在正、负半周的导通对管路径',
          '理解每个半周串联两个二极管压降（2VD）对低压充电效率的影响及肖特基整流优势',
        ],
        principleSummary:
          '交流输入正半周 D1、D3 导通，负半周 D2、D4 导通，负载 RL 上始终流过同一方向的脉动直流电流，脉动基频翻倍为 2f（100Hz）。改用肖特基二极管可显著降低整流热损耗。',
        keyFormulaLatex:
          'V_{O(\\text{avg})} \\approx \\frac{2(V_m - 2V_D)}{\\pi} \\approx 0.9 V_2 - 1.4\\text{ V}',
        experimentTips: [
          '将滤波电容设为 0 μF 观察纯全波整流“馒头波”及过零处的 2VD 死区凹槽。',
          '对比【普通硅整流桥】与【肖特基快恢复桥】，观察低压输入时输出电压峰值的显著提升！',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran', 'fft'],
        params: [
          { key: 'vm', label: '变压器次级峰值 Vm', unit: 'V', min: 5, max: 15, step: 1, defaultValue: 9 },
          {
            key: 'bridgeType',
            label: '整流桥器件选型',
            unit: '',
            min: 0,
            max: 1,
            step: 1,
            defaultValue: 0,
            options: [
              { label: '普通硅整流桥 (2VD≈1.4V)', value: 0 },
              { label: '肖特基高效整流桥 (2VD≈0.5V)', value: 1 },
            ],
          },
          { key: 'cFilterUf', label: '后端储能电容 C (0=无滤波)', unit: 'μF', min: 0, max: 220, step: 20, defaultValue: 0 },
          { key: 'rl', label: '充电等效负载 RL', unit: 'kΩ', min: 0.1, max: 2, step: 0.1, defaultValue: 0.5 },
        ],
        traces: [
          { expr: 'v(ac_diff)', label: '次级交流输入 v(ac)', color: '#38bdf8', unit: 'V', dashed: true },
          { expr: 'v(out)', label: '整流输出直流 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p) => {
          const dMod = p.bridgeType === 1 ? 'D_SCHOTTKY' : 'D_SI';
          const capLine =
            p.cFilterUf > 0 ? `Cfilt out 0 ${p.cFilterUf}u` : `* No filter cap`;
          return `Ch3 AI Project Phone Charger Full-Wave Bridge Rectifier
${SPICE_MODELS.DIODES}
Vac ac_p ac_n SIN(0 ${p.vm} 50)
Eprobe ac_diff 0 ac_p ac_n 1
Rp_dum ac_diff 0 1Meg
Rs_sec ac_p b1 0.5
* Full-wave diode bridge (ground reference at DC minus = 0)
D1 b1 out ${dMod}
D2 ac_n out ${dMod}
D3 0 b1 ${dMod}
D4 0 ac_n ${dMod}
Rbleed ac_n 0 10Meg
${capLine}
RL out 0 ${p.rl}k
.tran 200u 50m
.end`;
        },
        computeMetrics: (p, sim) => {
          const vo = calcWaveStats(sim?.series[1]?.values ?? []);
          return [
            { label: '次级交流有效值 V2', value: `${(p.vm / Math.SQRT2).toFixed(2)} Vrms` },
            { label: '整流输出平均值 VO(dc)', value: formatEng(vo.vAvg, 'V', 2), highlight: true },
            { label: '输出最高峰值 Vmax', value: formatEng(vo.vMax, 'V', 2) },
            { label: '输出脉动峰峰值 Vripple', value: formatEng(vo.vpp, 'V', 2) },
          ];
        },
      },
    ],
  },
];
