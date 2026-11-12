import type { ChapterGroup } from '../types';
import { SPICE_MODELS } from '../spiceModels';
import { calcBodeMetrics, calcWaveStats, formatEng } from '../utils/format';

export const CH4_TO_CH6: ChapterGroup[] = [
  {
    id: 'ch4',
    shortTitle: '第4章 场效应管及放大电路',
    fullTitle: '第4章 场效应三极管（MOSFET / JFET）及其放大与开关电路',
    hoursInfo: '大纲第4章 · MOSFET特性 / 共源共漏共栅 / JFET / LED调光台灯',
    ideologyTitle: '后摩尔时代中国芯片发展之路与超越摩尔器件创新',
    ideologyContent:
      'MOSFET 是现代超大规模集成电路的核心基石。结合国内在先进工艺与第三代宽禁带半导体（GaN/SiC）、GAA/FinFET 架构的攻关历程，激发探索前沿器件结构、突破芯片制造瓶颈的创新精神。',
    cases: [
      {
        id: 'ch4-mosfet-iv',
        chapterId: 'ch4',
        code: '4.1',
        title: '增强型 MOSFET 输出特性曲线族与转移特性',
        subtitle: '多栅压扫描展示可变电阻区（线性区）、恒流饱和区与沟道长度调制效应',
        badge: '核心掌握',
        syllabusSection: '4.(1) 金属-氧化物-半导体场效应管（MOSFET）V-I特性与大信号方程',
        objectives: [
          '掌握增强型 NMOS 开启电压 Vth（VTO）、可变电阻区与饱和恒流区的判据 VDS ≥ VGS - Vth',
          '理解饱和区平方律转移特性 ID = ½·KP·(VGS - Vth)²(1 + λVDS) 及跨导 gm 的物理含义',
        ],
        principleSummary:
          '当栅源电压 VGS < Vth 时沟道未反型（截止区）；VGS > Vth 后，随漏源电压 VDS 增大，漏极预夹断前呈受控可变电阻特性，夹断后进入恒流饱和区（放大工作区）。',
        keyFormulaLatex:
          'I_D = \\frac{1}{2}\\mu_n C_{ox}\\frac{W}{L}(V_{GS}-V_{th})^2(1+\\lambda V_{DS}), \\quad g_m = \\frac{\\partial I_D}{\\partial V_{GS}} = \\sqrt{2 K_P I_{DQ}}',
        experimentTips: [
          '在默认【多族输出特性曲线】下观察 5 条不同 VGS 对应的 ID-VDS 曲线：过原点的陡升段为可变电阻区，右侧微倾平坦段为饱和恒流区！',
          '调节沟道调制系数或跨导参数，直观感受器件参数对漏极饱和电流的平方律放大效应。',
        ],
        defaultViewMode: 'dc',
        availableViewModes: ['dc'],
        params: [
          { key: 'vto', label: '开启阈值电压 Vth', unit: 'V', min: 1.0, max: 2.5, step: 0.25, defaultValue: 1.5 },
          { key: 'kpMa', label: '跨导参数 KP', unit: 'mA/V²', min: 1, max: 8, step: 1, defaultValue: 4 },
          { key: 'vgsStep', label: '单步扫描栅压 (内部族覆盖)', unit: 'V', min: 1.5, max: 4.0, step: 0.5, defaultValue: 3.0 },
        ],
        sweepFamily: {
          paramKey: 'vgsStep',
          values: [1.8, 2.2, 2.6, 3.0, 3.4],
          unitLabel: 'V',
          formatLabel: (v) => `VGS = ${v.toFixed(1)} V`,
        },
        traces: [
          { expr: 'i(vdmeas)', label: '漏极电流 ID (mA)', color: '#38bdf8', unit: 'mA', scale: 1000 },
        ],
        buildNetlist: (p) => `Ch4 NMOS Output Characteristic Family
.model M_CUSTOM NMOS(LEVEL=1 VTO=${p.vto} KP=${p.kpMa}m LAMBDA=0.025)
Vds vds_src 0 0
Vdmeas vds_src d 0
Vgs g 0 ${p.vgsStep}
M1 d g 0 0 M_CUSTOM
.dc Vds 0 10 0.1
.end`,
        computeMetrics: (p) => {
          const idAt3V =
            p.vgsStep > p.vto
              ? 0.5 * p.kpMa * Math.pow(p.vgsStep - p.vto, 2)
              : 0;
          const gm = p.vgsStep > p.vto ? p.kpMa * (p.vgsStep - p.vto) : 0;
          return [
            { label: '开启电压 Vth', value: `${p.vto.toFixed(2)} V` },
            { label: 'VGS=3.0V 理论饱和 ID', value: `${(0.5 * p.kpMa * Math.max(0, 3 - p.vto) ** 2).toFixed(2)} mA`, highlight: true },
            { label: '参考点跨导 gm', value: `${gm.toFixed(2)} mS`, hint: `当前组理论 ID≈${idAt3V.toFixed(2)}mA` },
          ];
        },
      },
      {
        id: 'ch4-mosfet-cs',
        chapterId: 'ch4',
        code: '4.2',
        title: 'MOSFET 基本共源极（CS）放大电路分析',
        subtitle: '分压自偏置共源极放大器的静态工作点 Q、小信号反相放大增益及源极负反馈电阻作用',
        badge: '核心掌握',
        syllabusSection: '4.(2) MOSFET 基本共源极放大电路（Q点、图解法与小信号模型）',
        objectives: [
          '掌握分压偏置共源极放大电路静态工作点（VGSQ、IDQ、VDSQ）的设置与饱和区条件',
          '掌握小信号电压增益 Av = -gm·(Rd // RL) 及极高栅极输入电阻的特点',
        ],
        principleSummary:
          '栅极几乎无直流电流（IG=0），由 Rg1、Rg2 分压提供稳定栅极电位，源极电阻 Rs 稳定直流工作点 IDQ，旁路电容 Cs 消除交流退化以获得高反相电压增益。',
        keyFormulaLatex:
          'A_v = -g_m (R_d \\parallel R_L \\parallel r_{ds}), \\quad R_i = R_{g1} \\parallel R_{g2}, \\quad R_o \\approx R_d',
        experimentTips: [
          '切换【源极旁路电容 Cs】开关：断开 Cs 后，交流负反馈令增益下降为 -Rd/Rs，但波形非线性失真明显减小！',
          '过度调大漏极电阻 Rd，观察漏源电压 VDSQ 过低导致进入可变电阻区产生底部削波失真。',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran', 'ac', 'fft'],
        params: [
          { key: 'vdd', label: '电源电压 VDD', unit: 'V', min: 9, max: 18, step: 1, defaultValue: 12 },
          { key: 'rd', label: '漏极电阻 Rd', unit: 'kΩ', min: 1, max: 8, step: 0.5, defaultValue: 3.5 },
          { key: 'rs', label: '源极电阻 Rs', unit: 'kΩ', min: 0.3, max: 3, step: 0.1, defaultValue: 1.0 },
          {
            key: 'bypassCs',
            label: '源极旁路电容 Cs',
            unit: '',
            min: 0,
            max: 1,
            step: 1,
            defaultValue: 1,
            options: [
              { label: '接入 Cs (高增益)', value: 1 },
              { label: '断开 Cs (源极负反馈)', value: 0 },
            ],
          },
          { key: 'vinMv', label: '输入正弦峰值 Vim', unit: 'mV', min: 20, max: 300, step: 20, defaultValue: 80 },
        ],
        traces: [
          { expr: 'v(in)', label: '输入信号 v(in)', color: '#38bdf8', unit: 'V' },
          { expr: 'v(out)', label: '漏极耦合输出 v(out)', color: '#34d399', unit: 'V' },
          { expr: 'v(d)', label: '漏极总电压 v(D) [含直流Q点]', color: '#fbbf24', unit: 'V', dashed: true },
        ],
        buildNetlist: (p, mode) => {
          const csLine = p.bypassCs === 1 ? 'Cs s 0 47u' : '* Cs disconnected';
          const analysis =
            mode === 'ac' ? '.ac dec 30 10 50Meg' : '.tran 15u 3m';
          return `Ch4 Common-Source MOSFET Amplifier
${SPICE_MODELS.MOSFETS}
VDD vdd 0 ${p.vdd}
Vin in 0 SIN(0 ${p.vinMv * 1e-3} 1k) AC 1
C1 in g 10u
Rg1 vdd g 800k
Rg2 g 0 400k
Rd vdd d ${p.rd}k
Rs s 0 ${p.rs}k
${csLine}
M1 d g s 0 M_NMOS
C2 d out 10u
RL out 0 10k
${analysis}
.end`;
        },
        computeMetrics: (_p, sim) => {
          const vi = calcWaveStats(sim?.series[0]?.values ?? []);
          const vo = calcWaveStats(sim?.series[1]?.values ?? []);
          const vd = calcWaveStats(sim?.series[2]?.values ?? []);
          const gain = vi.vpp > 1e-6 ? -(vo.vpp / vi.vpp) : 0;
          return [
            { label: '静态漏极电位 VDQ', value: `${vd.vAvg.toFixed(2)} V` },
            { label: '实测交流电压增益 Av', value: `${gain.toFixed(2)} 倍`, highlight: true },
            { label: '输出交流峰峰值 Vo(pp)', value: formatEng(vo.vpp, 'V', 2) },
          ];
        },
      },
      {
        id: 'ch4-mosfet-cd-cg',
        chapterId: 'ch4',
        code: '4.3',
        title: '共漏极（源极跟随器 CD）与共栅极（CG）放大组态对比',
        subtitle: '一键对比共源(CS)、共漏(CD)、共栅(CG)三种 FET 放大组态的增益、相位与带载特性',
        badge: '核心掌握',
        syllabusSection: '4.(3)(7) 共漏极和共栅极放大电路；三种组态与放大器件性能比较',
        objectives: [
          '掌握共漏极（源极跟随器）同相电压增益略小于 1、输入电阻极高、输出电阻低（≈1/gm）的缓冲特性',
          '掌握共栅极放大电路同相电压放大、输入电阻低（≈1/gm）、高频宽带无密勒倍增效应的特点',
        ],
        principleSummary:
          '类似 BJT 的三种组态，MOSFET 共源极（CS）兼具电压与电流放大且反相；共漏极（CD）用作高阻输入低阻输出缓冲级；共栅极（CG）用作高频宽带放大与电流缓冲。',
        keyFormulaLatex:
          'A_{v,\\text{CD}} = \\frac{g_m R_s\'}{1 + g_m R_s\'} < 1, \\qquad A_{v,\\text{CG}} = +g_m (R_d \\parallel R_L), \\quad R_{i,\\text{CG}} \\approx \\frac{1}{g_m}',
        experimentTips: [
          '依次切换【共源 CS】【共漏 CD】【共栅 CG】三种组态，重点对比输出与输入的相位关系（反相 vs 同相）以及带重负载 RL 时的幅值变化！',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran', 'ac'],
        params: [
          {
            key: 'config',
            label: '场效应管组态选择',
            unit: '',
            min: 0,
            max: 2,
            step: 1,
            defaultValue: 1,
            options: [
              { label: '共源极 (CS 反相放大)', value: 0 },
              { label: '共漏极 (CD 源极跟随器)', value: 1 },
              { label: '共栅极 (CG 同相高频放大)', value: 2 },
            ],
          },
          { key: 'rl', label: '外接负载电阻 RL', unit: 'kΩ', min: 0.5, max: 20, step: 0.5, defaultValue: 5 },
          { key: 'vinMv', label: '信号源幅值 Vsm', unit: 'mV', min: 50, max: 400, step: 50, defaultValue: 150 },
        ],
        traces: [
          { expr: 'v(in)', label: '输入端信号 v(in)', color: '#38bdf8', unit: 'V' },
          { expr: 'v(out)', label: '负载端输出 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p, mode) => {
          const analysis =
            mode === 'ac' ? '.ac dec 30 10 100Meg' : '.tran 15u 3m';
          if (p.config === 0) {
            return `Ch4 CS Mode
${SPICE_MODELS.MOSFETS}
VDD vdd 0 12
Vin in 0 SIN(0 ${p.vinMv * 1e-3} 1k) AC 1
C1 in g 10u
Rg1 vdd g 800k
Rg2 g 0 400k
Rd vdd d 3.3k
Rs s 0 1k
Cs s 0 47u
M1 d g s 0 M_NMOS
C2 d out 10u
RL out 0 ${p.rl}k
${analysis}
.end`;
          }
          if (p.config === 1) {
            return `Ch4 CD Source Follower Mode
${SPICE_MODELS.MOSFETS}
VDD vdd 0 12
Vin in 0 SIN(0 ${p.vinMv * 1e-3} 1k) AC 1
C1 in g 10u
Rg1 vdd g 600k
Rg2 g 0 600k
Rs s 0 2k
M1 vdd g s 0 M_NMOS
C2 s out 10u
RL out 0 ${p.rl}k
${analysis}
.end`;
          }
          return `Ch4 CG Common Gate Mode
${SPICE_MODELS.MOSFETS}
VDD vdd 0 12
Vin vs_src 0 SIN(0 ${p.vinMv * 1e-3} 1k) AC 1
Rsig vs_src in 50
C1 in s 22u
Rg1 vdd g 800k
Rg2 g 0 400k
Cg g 0 22u
Rd vdd d 3.3k
Rs s 0 1k
M1 d g s 0 M_NMOS
C2 d out 10u
RL out 0 ${p.rl}k
${analysis}
.end`;
        },
        computeMetrics: (p, sim) => {
          const vi = calcWaveStats(sim?.series[0]?.values ?? []);
          const vo = calcWaveStats(sim?.series[1]?.values ?? []);
          const ratio = vi.vpp > 1e-6 ? vo.vpp / vi.vpp : 0;
          const phaseDesc = ['反相 (-180°)', '同相 (0° 电压跟随)', '同相 (0° 宽带放大)'];
          return [
            { label: '相位关系', value: phaseDesc[p.config] ?? '' },
            { label: '实测增益幅值 |Av|', value: `${ratio.toFixed(2)} 倍`, highlight: true },
            { label: '输出峰峰值 Vo(pp)', value: formatEng(vo.vpp, 'V', 2) },
          ];
        },
      },
      {
        id: 'ch4-jfet-amp',
        chapterId: 'ch4',
        code: '4.4',
        title: '结型场效应管（JFET）自给偏压共源放大电路',
        subtitle: '验证耗尽型 N 沟道 JFET 负栅源偏置机理（VGSQ = -IDQ·Rs < 0）及极低噪声高输入阻抗放大',
        badge: '理解掌握',
        syllabusSection: '4.(5)(6) 结型场效应管（JFET）与 GaAs MESFET 特性及应用',
        objectives: [
          '理解耗尽型 JFET 栅源 PN 结必须反偏（N沟道 VGS ≤ 0）以维持高输入阻抗的工作条件',
          '掌握无需双电源或分压电阻的自给偏压（Self-Bias）电路构成原理',
        ],
        principleSummary:
          'N 沟道 JFET 在 VGS = 0 时已存在导电沟道（IDSS），栅极通过大电阻 Rg 接地（VG = 0），源极电流流过 Rs 自动抬高源极电位 VS = ID·Rs > 0，从而自然形成负的栅源偏压 VGS = -ID·Rs。',
        keyFormulaLatex:
          'I_D = I_{DSS}\\left(1 - \\frac{V_{GS}}{V_P}\\right)^2, \\quad V_{GSQ} = -I_{DQ} R_s \\; (V_P < V_{GSQ} < 0)',
        experimentTips: [
          '观察静态偏置读数：栅极为 0V，而源极自动建立正电位，使得 PN 结处于反向偏置！',
          '调节自偏压电阻 Rs，观察静态电流 IDQ 与交流增益的联动变化。',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran', 'ac'],
        params: [
          { key: 'rd', label: '漏极电阻 Rd', unit: 'kΩ', min: 1, max: 6, step: 0.5, defaultValue: 3.0 },
          { key: 'rs', label: '自偏压源极电阻 Rs', unit: 'Ω', min: 200, max: 1500, step: 100, defaultValue: 500 },
          { key: 'vinMv', label: '输入正弦幅值 Vim', unit: 'mV', min: 50, max: 400, step: 50, defaultValue: 150 },
        ],
        traces: [
          { expr: 'v(in)', label: '输入信号 v(in)', color: '#38bdf8', unit: 'V' },
          { expr: 'v(s)', label: '源极自偏压电位 v(s)', color: '#fbbf24', unit: 'V', dashed: true },
          { expr: 'v(out)', label: '放大输出电压 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p, mode) => {
          const analysis =
            mode === 'ac' ? '.ac dec 30 10 50Meg' : '.tran 15u 3m';
          return `Ch4 JFET Self-Biased CS Amplifier
${SPICE_MODELS.JFETS}
VDD vdd 0 15
Vin in 0 SIN(0 ${p.vinMv * 1e-3} 1k) AC 1
C1 in g 4.7u
Rg g 0 1Meg
Rd vdd d ${p.rd}k
Rs s 0 ${p.rs}
Cs s 0 47u
J1 d g s J_NJF
C2 d out 4.7u
RL out 0 10k
${analysis}
.end`;
        },
        computeMetrics: (p, sim) => {
          const vi = calcWaveStats(sim?.series[0]?.values ?? []);
          const vs = calcWaveStats(sim?.series[1]?.values ?? []);
          const vo = calcWaveStats(sim?.series[2]?.values ?? []);
          const vgsq = -vs.vAvg;
          const idqMa = (vs.vAvg / p.rs) * 1000;
          const av = vi.vpp > 1e-6 ? -(vo.vpp / vi.vpp) : 0;
          return [
            { label: '自给负栅压 VGSQ', value: `${vgsq.toFixed(2)} V`, hint: '夹断电压 VP = -2.5V' },
            { label: '静态漏极电流 IDQ', value: `${idqMa.toFixed(2)} mA` },
            { label: '实测电压增益 Av', value: `${av.toFixed(2)} 倍`, highlight: true },
          ];
        },
      },
      {
        id: 'ch4-mosfet-pwm-led',
        chapterId: 'ch4',
        code: '4.5',
        title: 'AI项目实践：基于 MOSFET 大信号开关作用的 LED PWM 调光台灯',
        subtitle: '调节 PWM 脉宽占空比控制功率 NMOS 在截止区与低阻可变电阻区间高速切换实现高效无级调光',
        badge: 'AI项目实践',
        syllabusSection: '4.(4) MOSFET大信号开关应用 + AI项目实践：LED调光台灯的电路设计',
        objectives: [
          '掌握 MOSFET 作为电子开关工作在截止区（VGS=0）与深可变电阻导通区（RDS(on)极小）的低功耗原理',
          '掌握脉宽调制（PWM）占空比 D 与 LED 平均发光电流的线性控制关系',
        ],
        principleSummary:
          '若用线性可变电阻调光会消耗大量发热功率；而利用功率 MOSFET 高速开关进行 PWM 调光，管子要么无电流（截止），要么压降极低（深导通），平均电流正比于占空比 D 且开关效率接近 98%！',
        keyFormulaLatex:
          'I_{\\text{LED,avg}} = D \\cdot \\frac{V_{DD} - V_{\\text{LED}} - I_{\\text{on}} R_{DS(\\text{on})}}{R_{\\text{lim}}}, \\quad D = \\frac{t_{\\text{on}}}{T}',
        experimentTips: [
          '拖动【PWM 调光占空比 D】从 10% 到 90%：观察下方自动测算的【LED 平均驱动电流】随之精准线性增长！',
          '观察漏极电压 v(d)：导通期间 MOSFET 漏源压降仅几十毫伏，验证其极低的导通损耗。',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran'],
        params: [
          { key: 'duty', label: 'PWM 调光占空比 D', unit: '%', min: 10, max: 90, step: 10, defaultValue: 50 },
          { key: 'freqKhz', label: 'PWM 开关频率', unit: 'kHz', min: 1, max: 10, step: 1, defaultValue: 2 },
          { key: 'rLim', label: 'LED 限流电阻 Rlim', unit: 'Ω', min: 15, max: 100, step: 5, defaultValue: 30 },
        ],
        traces: [
          { expr: 'v(g)', label: '栅极 PWM 驱动 v(g)', color: '#38bdf8', unit: 'V', dashed: true },
          { expr: 'v(d)', label: 'MOSFET 漏极开关电压 v(d)', color: '#fbbf24', unit: 'V' },
          { expr: 'i(vled_m)', label: 'LED 瞬态电流 iLED (mA)', color: '#34d399', unit: 'mA', scale: 1000, axis: 'right' },
        ],
        buildNetlist: (p) => {
          const T = 1 / (p.freqKhz * 1e3);
          const ton = T * (p.duty / 100);
          const tr = T * 0.01;
          const tStop = 3 * T;
          const tStep = tStop / 450;
          return `Ch4 AI Project MOSFET PWM LED Dimming Lamp
${SPICE_MODELS.DIODES}
${SPICE_MODELS.MOSFETS}
VDD vdd 0 12
Vpwm pwm_s 0 PULSE(0 5 0 ${tr} ${tr} ${ton} ${T})
Rg pwm_s g 22
Rlim vdd n_led ${p.rLim}
Vled_m n_led led_a 0
* 3 high-brightness white/red LEDs in series
Dled1 led_a l1 D_LED
Dled2 l1 l2 D_LED
Dled3 l2 d D_LED
Msw d g 0 0 M_POWER
.tran ${tStep.toExponential(3)} ${tStop.toExponential(3)}
.end`;
        },
        computeMetrics: (p, sim) => {
          const iLed = calcWaveStats(sim?.series[2]?.values ?? []);
          return [
            { label: '当前 PWM 占空比', value: `${p.duty}% (${p.freqKhz} kHz)` },
            { label: 'LED 平均发光电流', value: `${iLed.vAvg.toFixed(1)} mA`, highlight: true },
            { label: 'LED 导通峰值电流', value: `${iLed.vMax.toFixed(1)} mA` },
          ];
        },
      },
    ],
  },
  {
    id: 'ch5',
    shortTitle: '第5章 双极型三极管(BJT)',
    fullTitle: '第5章 双极结型三极管（BJT）及基本与多级放大电路',
    hoursInfo: '大纲第5章 · BJT特性 / 共射失真 / Q点温漂稳定 / 共集共基 / 多级 / 声控灯',
    ideologyTitle: '“微变等效”抓主要矛盾与“静态工作点稳定是发展前提”',
    ideologyContent:
      '利用微变等效模型将非线性三极管在小信号下合理线性化，体现“从复杂工程问题中抓主要矛盾”的科学辩证法；而设置稳定合适的静态工作点 Q 才能不失真放大动态信号，恰如稳健根基是一切创新与发展的基石。',
    cases: [
      {
        id: 'ch5-bjt-iv',
        chapterId: 'ch5',
        code: '5.1',
        title: 'BJT 输出特性曲线族（截止区 / 放大区 / 饱和区）图示仪',
        subtitle: '五级基极电流 IB 台阶扫描，直观展示 β 电流控制作用、饱和压降 VCE(sat) 与厄尔利效应',
        badge: '核心掌握',
        syllabusSection: '5.(1)(3) 半导体三极管电流分配关系、输出特性三个区划分及特点',
        objectives: [
          '熟记三极管放大条件（发射结正偏、集电结反偏）及三区特征',
          '从曲线族上读取共射直流电流放大系数 β = ΔIC / ΔIB 与饱和临界压降 VCE(sat) ≈ 0.2~0.3V',
        ],
        principleSummary:
          '当 VCE < 0.3V 时集电结亦正偏，IC 受 VCE 强烈限制（饱和区）；当 VCE > 0.7V 后集电结反偏收集绝大部分扩散电子，IC ≈ β·IB 基本平行于横轴（线性放大区），略微上翘源于基区宽度调制（Early电压 VAF）。',
        keyFormulaLatex:
          'I_C = \\beta I_B \\left(1 + \\frac{V_{CE}}{V_A}\\right), \\quad I_E = I_B + I_C = (1+\\beta)I_B',
        experimentTips: [
          '观察左侧 VCE < 0.3V 处五条曲线汇拢重叠的区域即为【饱和区】；右侧近似水平等距展开的区域即为【放大区】！',
          '改变电流放大倍数 β 或早期电压 VA，观察曲线间距及斜率（输出电阻 rce ≈ VA/IC）的变化。',
        ],
        defaultViewMode: 'dc',
        availableViewModes: ['dc'],
        params: [
          { key: 'bf', label: '共射电流放大系数 β (BF)', unit: '倍', min: 50, max: 250, step: 25, defaultValue: 150 },
          { key: 'vaf', label: '厄尔利电压 VA (Early)', unit: 'V', min: 30, max: 150, step: 30, defaultValue: 100 },
          { key: 'ibUa', label: '基极阶梯电流基准 IB', unit: 'μA', min: 10, max: 50, step: 10, defaultValue: 20 },
        ],
        sweepFamily: {
          paramKey: 'ibUa',
          values: [10, 20, 30, 40, 50],
          unitLabel: 'μA',
          formatLabel: (v) => `IB = ${v} μA`,
        },
        traces: [
          { expr: 'i(vcmeas)', label: '集电极电流 IC (mA)', color: '#38bdf8', unit: 'mA', scale: 1000 },
        ],
        buildNetlist: (p) => `Ch5 NPN Output Characteristic Curve Tracer
.model Q_CURVE NPN(IS=1e-14 BF=${p.bf} VAF=${p.vaf})
Vce vce_s 0 0
Vcmeas vce_s c 0
Ib 0 b ${p.ibUa}u
Q1 c b 0 Q_CURVE
.dc Vce 0 12 0.1
.end`,
        computeMetrics: (p) => [
          { label: '设定电流增益 β', value: `${p.bf} 倍` },
          { label: 'IB=30μA 放大区 IC', value: `${((30 * p.bf) / 1000).toFixed(2)} mA`, highlight: true },
          { label: '微变输出电阻 rce (4.5mA)', value: `${(p.vaf / 4.5).toFixed(1)} kΩ` },
        ],
      },
      {
        id: 'ch5-bjt-ce',
        chapterId: 'ch5',
        code: '5.2',
        title: '基本共射极放大电路：Q点调节与截止失真/饱和失真动态演示',
        subtitle: '调节基极偏置电阻 Rb 实时复现正常不失真放大、顶部削平（截止失真）与底部削平（饱和失真）',
        badge: '核心掌握',
        syllabusSection: '5.(2)(3) 基本共射放大电路组成、图解分析法与非线性失真判别',
        objectives: [
          '掌握共射极放大电路小信号指标计算：Av = -β(Rc // RL) / rbe，Ri = Rb // rbe，Ro = Rc',
          '深刻区分 NPN 共射电路的【截止失真（Q点偏低→输出顶部削平）】与【饱和失真（Q点偏高→输出底部削平）】',
        ],
        principleSummary:
          '共射放大电路输出与输入反相。若 Rb 过大导致静态基极电流 IBQ 过小（Q点靠近截止区），输入负半周使三极管截止，集电极输出正半周顶部被削平（截止失真）；反之 Rb 过小使 Q 点靠近饱和区，输入正半周令管子饱和，集电极输出负半周底部被削平（饱和失真）！',
        keyFormulaLatex:
          'r_{be} = r_{bb\'} + (1+\\beta)\\frac{26\\text{ mV}}{I_{EQ}(\\text{mA})}, \\quad A_v = -\\frac{\\beta (R_c \\parallel R_L)}{r_{be}}',
        experimentTips: [
          '经典必考实验：将 Rb 拉大到 900 kΩ 观察输出波形【顶部削平（截止失真）】；再将 Rb 调小到 120 kΩ 观察输出波形【底部削平（饱和失真）】！',
          '切换至【FFT 频谱】模式，观察出现截止/饱和失真时 THD（总谐波失真度）从 <2% 飙升至 >20%！',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran', 'fft', 'ac'],
        params: [
          { key: 'rb', label: '基极偏置电阻 Rb', unit: 'kΩ', min: 100, max: 1000, step: 20, defaultValue: 360 },
          { key: 'rc', label: '集电极电阻 Rc', unit: 'kΩ', min: 1, max: 6, step: 0.5, defaultValue: 3.0 },
          { key: 'rl', label: '负载电阻 RL', unit: 'kΩ', min: 1, max: 20, step: 1, defaultValue: 6.0 },
          { key: 'vinMv', label: '输入正弦峰值 Vim', unit: 'mV', min: 5, max: 60, step: 5, defaultValue: 25 },
        ],
        traces: [
          { expr: 'v(in)', label: '输入小信号 v(in)', color: '#38bdf8', unit: 'V' },
          { expr: 'v(c)', label: '集电极总电压 v(C) [含VCEQ]', color: '#fbbf24', unit: 'V', dashed: true },
          { expr: 'v(out)', label: '耦合输出交流电压 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p, mode) => {
          const analysis =
            mode === 'ac' ? '.ac dec 30 10 50Meg' : '.tran 15u 3m';
          return `Ch5 Basic Common-Emitter Amplifier & Q-Point Distortion
${SPICE_MODELS.BJTS}
VCC vcc 0 12
Vin in 0 SIN(0 ${p.vinMv * 1e-3} 1k) AC 1
C1 in b 10u
Rb vcc b ${p.rb}k
Rc vcc c ${p.rc}k
Q1 c b 0 Q_NPN
C2 c out 10u
RL out 0 ${p.rl}k
${analysis}
.end`;
        },
        computeMetrics: (p, sim) => {
          const vi = calcWaveStats(sim?.series[0]?.values ?? []);
          const vc = calcWaveStats(sim?.series[1]?.values ?? []);
          const vo = calcWaveStats(sim?.series[2]?.values ?? []);
          const ibqUa = ((12 - 0.7) / p.rb) * 1000;
          const icqMa = Math.min(0.15 * ibqUa, 12 / p.rc);
          const vceq = vc.vAvg;
          const state =
            vceq < 1.5
              ? 'Q点过高（易饱和底部削波）'
              : vceq > 10.2
              ? 'Q点过低（易截止顶部削波）'
              : 'Q点适中（线性放大区）';
          const av = vi.vpp > 1e-6 ? -(vo.vpp / vi.vpp) : 0;
          return [
            { label: '静态集射电压 VCEQ', value: `${vceq.toFixed(2)} V`, hint: `估算 ICQ≈${icqMa.toFixed(2)}mA` },
            { label: '工作点状态诊断', value: state, highlight: vceq < 1.5 || vceq > 10.2 },
            { label: '实测电压增益 Av', value: `${av.toFixed(1)} 倍`, highlight: true },
          ];
        },
      },
      {
        id: 'ch5-bjt-q-temp',
        chapterId: 'ch5',
        code: '5.3',
        title: '分压式射极偏置电路：温度漂移抑制与静态工作点稳定物理过程',
        subtitle: '调节芯片结温 T (0°C ~ 100°C)，同屏对比固定偏置电路 Q 点剧烈漂移与射极直流负反馈的自动稳流作用',
        badge: '核心掌握',
        syllabusSection: '5.(4) 放大电路的静态工作点稳定问题（温度影响与射极偏置电路）',
        objectives: [
          '理解温度升高导致 VBE 下降（-2mV/°C）、β 增大、ICBO 剧增，从而令固定偏置电路 Q 点上移饱和的机理',
          '掌握分压式射极偏置稳定环路：T↑ → IC↑ → VE↑ → VBE=(VB-VE)↓ → IB↓ → IC↓',
          '掌握稳定条件 I1 ≫ IBQ 且 VB ≫ VBE，以及发射极旁路电容 Ce 兼顾直流稳 Q 与交流高增益的作用',
        ],
        principleSummary:
          '将同一芯片内完全相同的两只三极管置于同一环境温度 `.temp` 下：支路1采用固定基极偏置，温度升至 90°C 时集电极迅速跌入饱和失真；支路2采用 Rb1-Rb2 分压 + Re 射极直流负反馈，VCEQ 坚如磐石！',
        keyFormulaLatex:
          'V_B \\approx \\frac{R_{b2}}{R_{b1}+R_{b2}}V_{CC}, \\quad I_{EQ} = \\frac{V_B - V_{BE}}{R_e} \\quad (T\\uparrow \\Rightarrow I_C\\uparrow \\Rightarrow V_E\\uparrow \\Rightarrow V_{BE}\\downarrow \\Rightarrow I_C\\downarrow)',
        experimentTips: [
          '拖动【环境温度 Temp】从 25°C 升高到 95°C：观察红色虚线（固定偏置输出）发生严重底部饱和削波，而绿色实线（分压射极偏置输出）始终保持完美正弦放大！',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran'],
        params: [
          { key: 'tempC', label: '芯片工作温度 Temp', unit: '°C', min: 0, max: 100, step: 10, defaultValue: 25 },
          { key: 're', label: '射极直流反馈电阻 Re', unit: 'kΩ', min: 0.5, max: 2.5, step: 0.5, defaultValue: 1.5 },
          {
            key: 'hasCe',
            label: '射极交流旁路电容 Ce',
            unit: '',
            min: 0,
            max: 1,
            step: 1,
            defaultValue: 1,
            options: [
              { label: '并联 Ce (高交流增益)', value: 1 },
              { label: '不接 Ce (交直流均负反馈)', value: 0 },
            ],
          },
          { key: 'vinMv', label: '输入信号峰值 Vim', unit: 'mV', min: 5, max: 35, step: 5, defaultValue: 15 },
        ],
        traces: [
          { expr: 'v(c_fix)', label: '固定偏置集电极电压 v(C_fix)', color: '#f87171', unit: 'V', dashed: true },
          { expr: 'v(c_stab)', label: '分压射极偏置集电极电压 v(C_stab)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p) => {
          const ceLine = p.hasCe === 1 ? 'Ce e_stab 0 47u' : '* Ce open';
          return `Ch5 Thermal Stability Comparison: Fixed Bias vs Voltage-Divider Emitter Bias
.temp ${p.tempC}
.model Q_TEMP NPN(IS=1e-14 BF=150 VAF=100 XTB=1.8 EG=1.11)
VCC vcc 0 12
Vin in 0 SIN(0 ${p.vinMv * 1e-3} 1k)
* Circuit A: Unstabilized Fixed Base Bias
C1a in b_fix 10u
Rb_fix vcc b_fix 560k
Rc_fix vcc c_fix 3.6k
Qa c_fix b_fix 0 Q_TEMP
* Circuit B: Voltage-Divider Emitter-Feedback Bias
C1b in b_stab 10u
Rb1 vcc b_stab 33k
Rb2 b_stab 0 12k
Rc_stab vcc c_stab 3.6k
Re e_stab 0 ${p.re}k
${ceLine}
Qb c_stab b_stab e_stab Q_TEMP
.tran 15u 3m
.end`;
        },
        computeMetrics: (p, sim) => {
          const cFix = calcWaveStats(sim?.series[0]?.values ?? []);
          const cStab = calcWaveStats(sim?.series[1]?.values ?? []);
          return [
            { label: '当前芯片结温', value: `${p.tempC} °C` },
            { label: '固定偏置 VCEQ (易漂移)', value: `${cFix.vAvg.toFixed(2)} V`, highlight: cFix.vAvg < 1.5 },
            { label: '分压偏置 VCQ (高稳定)', value: `${cStab.vAvg.toFixed(2)} V`, highlight: true },
            { label: '分压偏置交流输出 Vpp', value: formatEng(cStab.vpp, 'V', 2) },
          ];
        },
      },
      {
        id: 'ch5-bjt-cc-cb',
        chapterId: 'ch5',
        code: '5.4',
        title: '共集电极（射极跟随器 CC）与共基极（CB）放大电路',
        subtitle: '对比验证共集高输入阻抗/低输出阻抗电压跟随特性与共基极低输入阻抗宽频带特性',
        badge: '核心掌握',
        syllabusSection: '5.(5) 共集电极电路与共基极电路组成、Q点及性能指标计算',
        objectives: [
          '掌握共集电极电路（射极跟随器）Av ≈ 1、Ri = Rb // [rbe + (1+β)RL]、Ro ≈ Re // [(Rs\'+rbe)/(1+β)] 的计算',
          '掌握共基极电路电流跟随（α≈1）、高电压增益（同相）、极佳高频性能的特点与应用场景',
        ],
        principleSummary:
          '共集电极电路以集电极为交流公共地，从发射极输出，输入电阻被放大 (1+β) 倍而输出电阻缩小为 1/(1+β)，是理想的多级输入/输出缓冲级；共基极电路以基极为交流地，无密勒电容倍增，最适合高频放大。',
        keyFormulaLatex:
          'A_{v,\\text{CC}} = \\frac{(1+\\beta)R_e\'}{r_{be}+(1+\\beta)R_e\'} \\approx 1, \\quad R_{o,\\text{CC}} = R_e \\parallel \\frac{R_s\'+r_{be}}{1+\\beta}',
        experimentTips: [
          '在【共集电极（射极跟随器）】模式下将负载 RL 减小至 200 Ω（重负载），观察输出仍能稳健跟随输入波形且同相！',
          '切换至【共基极放大器】并点击【波特图 (.ac)】，可验证其上限截止频率高达数十 MHz！',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran', 'ac'],
        params: [
          {
            key: 'bjtMode',
            label: 'BJT 放大组态',
            unit: '',
            min: 0,
            max: 1,
            step: 1,
            defaultValue: 0,
            options: [
              { label: '共集电极 (CC 射极跟随器)', value: 0 },
              { label: '共基极 (CB 同相宽带放大)', value: 1 },
            ],
          },
          { key: 'rlOhm', label: '外接负载 RL', unit: 'Ω', min: 200, max: 5000, step: 200, defaultValue: 1000 },
          { key: 'rsOhm', label: '信号源内阻 Rs', unit: 'Ω', min: 50, max: 2000, step: 100, defaultValue: 300 },
        ],
        traces: [
          { expr: 'v(in)', label: '放大器输入端 v(in)', color: '#38bdf8', unit: 'V' },
          { expr: 'v(out)', label: '负载输出电压 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p, mode) => {
          const analysis =
            mode === 'ac' ? '.ac dec 30 10 200Meg' : '.tran 15u 3m';
          if (p.bjtMode === 0) {
            return `Ch5 Common-Collector Emitter Follower
${SPICE_MODELS.BJTS}
VCC vcc 0 12
Vs vs 0 SIN(0 0.8 1k) AC 1
Rs vs in ${p.rsOhm}
C1 in b 10u
Rb1 vcc b 30k
Rb2 b 0 30k
Re e 0 2k
Q1 vcc b e Q_NPN
C2 e out 22u
RL out 0 ${p.rlOhm}
${analysis}
.end`;
          }
          return `Ch5 Common-Base Amplifier
${SPICE_MODELS.BJTS}
VCC vcc 0 12
Vs vs 0 SIN(0 0.02 1k) AC 1
Rs vs in ${p.rsOhm}
C1 in e 22u
Rb1 vcc b 33k
Rb2 b 0 12k
Cb b 0 22u
Rc vcc c 3k
Re e 0 1.5k
Q1 c b e Q_NPN
C2 c out 10u
RL out 0 ${p.rlOhm}
${analysis}
.end`;
        },
        computeMetrics: (p, sim) => {
          const vi = calcWaveStats(sim?.series[0]?.values ?? []);
          const vo = calcWaveStats(sim?.series[1]?.values ?? []);
          const av = vi.vpp > 1e-6 ? vo.vpp / vi.vpp : 0;
          return [
            { label: '当前电路组态', value: p.bjtMode === 0 ? '共集电极 (射极跟随器)' : '共基极放大器' },
            { label: '输入输出相位差', value: '0° (同相)' },
            { label: '实测有载增益 Vo/Vi', value: `${av.toFixed(3)} 倍`, highlight: true },
          ];
        },
      },
      {
        id: 'ch5-multistage',
        chapterId: 'ch5',
        code: '5.5',
        title: '多级放大电路（共射-共集 CE-CC 级联组合）',
        subtitle: '对比单级共射带重负载时的增益骤降，验证第二级接入射极跟随器后的带载增益飞跃',
        badge: '核心掌握',
        syllabusSection: '5.(6) 多级放大电路耦合方式、前后级互连负载效应及性能计算',
        objectives: [
          '理解多级放大电路后级输入电阻即为前级交流负载电阻（RL1 = Ri2）的级间耦合规律',
          '掌握 CE（主电压放大）+ CC（高阻隔离缓冲输出）组合发挥各自优势的工程设计方法',
        ],
        principleSummary:
          '单级共射输出电阻 Ro = Rc 较高（数千欧），若直接驱动 300Ω 低阻扬声器或长线负载，电压增益会暴跌 90%！在后级级联一级共集射极跟随器后，前级看到的负载变为数十千欧的 Ri2，总带载能力提升近十倍！',
        keyFormulaLatex:
          'A_v = A_{v1} \\cdot A_{v2}, \\quad R_{L1} = R_{i2} = R_{b2} \\parallel [r_{be2}+(1+\\beta_2)(R_{e2}\\parallel R_L)]',
        experimentTips: [
          '当负载 RL = 300 Ω 时，切换【级联结构】对比单级 CE 与两级 CE+CC：观察输出波形幅值相差近 8 倍！',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran', 'ac'],
        params: [
          {
            key: 'useBuffer',
            label: '后级 CC 缓冲级开关',
            unit: '',
            min: 0,
            max: 1,
            step: 1,
            defaultValue: 1,
            options: [
              { label: '两级 CE + CC 组合放大', value: 1 },
              { label: '仅单级 CE 直接带载', value: 0 },
            ],
          },
          { key: 'rlOhm', label: '终端重负载电阻 RL', unit: 'Ω', min: 200, max: 3000, step: 100, defaultValue: 300 },
          { key: 'vinMv', label: '输入信号峰值 Vim', unit: 'mV', min: 5, max: 30, step: 5, defaultValue: 15 },
        ],
        traces: [
          { expr: 'v(in)', label: '微弱输入 v(in)', color: '#38bdf8', unit: 'V' },
          { expr: 'v(c1)', label: '第一级集电极 v(c1)', color: '#fbbf24', unit: 'V', dashed: true },
          { expr: 'v(out)', label: '终端负载输出 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p, mode) => {
          const analysis =
            mode === 'ac' ? '.ac dec 30 10 50Meg' : '.tran 15u 3m';
          if (p.useBuffer === 0) {
            return `Ch5 Single-Stage CE Driving Heavy Load Directly
${SPICE_MODELS.BJTS}
VCC vcc 0 12
Vin in 0 SIN(0 ${p.vinMv * 1e-3} 1k) AC 1
C1 in b1 10u
Rb1 vcc b1 33k
Rb2 b1 0 10k
Rc1 vcc c1 3.3k
Re1 e1 0 1.2k
Ce1 e1 0 47u
Q1 c1 b1 e1 Q_NPN
Cout c1 out 22u
RL out 0 ${p.rlOhm}
${analysis}
.end`;
          }
          return `Ch5 Two-Stage CE + CC Direct/RC Coupled Amplifier
${SPICE_MODELS.BJTS}
VCC vcc 0 12
Vin in 0 SIN(0 ${p.vinMv * 1e-3} 1k) AC 1
* Stage 1: Common-Emitter Voltage Gain Stage
C1 in b1 10u
Rb1 vcc b1 33k
Rb2 b1 0 10k
Rc1 vcc c1 3.3k
Re1 e1 0 1.2k
Ce1 e1 0 47u
Q1 c1 b1 e1 Q_NPN
* Direct coupling into Stage 2: Emitter Follower Buffer
Re2 e2 0 1.5k
Q2 vcc c1 e2 Q_NPN
Cout e2 out 47u
RL out 0 ${p.rlOhm}
${analysis}
.end`;
        },
        computeMetrics: (p, sim) => {
          const vi = calcWaveStats(sim?.series[0]?.values ?? []);
          const vo = calcWaveStats(sim?.series[2]?.values ?? []);
          const gain = vi.vpp > 1e-6 ? vo.vpp / vi.vpp : 0;
          return [
            { label: '级联架构', value: p.useBuffer === 1 ? 'CE + CC 两级直接耦合' : '单级 CE 直接带载' },
            { label: '终端负载 RL', value: `${p.rlOhm} Ω` },
            { label: '总有载电压增益 |Av|', value: `${gain.toFixed(1)} 倍`, highlight: true },
            { label: '负载端峰峰值 Vo(pp)', value: formatEng(vo.vpp, 'V', 2) },
          ];
        },
      },
      {
        id: 'ch5-sound-lamp',
        chapterId: 'ch5',
        code: '5.6',
        title: 'AI项目实践：楼道声控延时照明灯电路设计（BJT放大+包络检波延时）',
        subtitle: '模拟拍手声波信号经驻极体话筒前置 BJT 共射高倍放大、倍压检波给 RC 延时电容充电点亮楼道灯',
        badge: 'AI项目实践',
        syllabusSection: 'AI项目实践：楼道声控灯的电路设计（BJT 的放大电路为基础）',
        objectives: [
          '综合运用 BJT 分压共射小信号放大、二极管峰值包络检波与 BJT 达林顿开关延时驱动',
          '掌握声音触发灵敏度（前置增益）与 RC 熄灯延时时间常数的工程整定方法',
        ],
        principleSummary:
          '在 t = 5ms 处模拟一阵短暂的拍手声波脉冲串（毫伏级）：第一级 BJT 共射放大器将其放大数十倍后，经二极管向延时电容 Cdelay 快速充电抬高后级驱动管基极电位，使照明灯立刻点亮并在声音消失后维持延时导通！',
        keyFormulaLatex:
          't_{\\text{hold}} \\propto R_{\\text{discharge}} \\cdot C_{\\text{delay}}, \\quad V_{\\text{trig}} = |A_{v1}| \\cdot V_{\\text{mic}} > V_{D} + V_{BE(\\text{on})}',
        experimentTips: [
          '将【拍手声音强度】调低至 5 mV：信号放大后不足以跨过检波与驱动阈值，楼道灯保持熄灭（防轻微环境噪音误触发）！',
          '调大声音强度至 25 mV 并调节【延时电容 Cdelay】，观察蓝色突发声波结束后，绿色照明灯电流持续点亮的时间长短变化！',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran'],
        params: [
          { key: 'micMv', label: '拍手声波拾音幅值', unit: 'mV', min: 4, max: 40, step: 4, defaultValue: 24 },
          { key: 'cDelayUf', label: 'RC 延时电容 Cdelay', unit: 'μF', min: 0.2, max: 2.0, step: 0.2, defaultValue: 0.6 },
        ],
        traces: [
          { expr: 'v(c1)', label: '前置BJT放大声波包络 v(c1)', color: '#38bdf8', unit: 'V', dashed: true },
          { expr: 'v(v_env)', label: '延时电容电压 v(Cdelay)', color: '#fbbf24', unit: 'V' },
          { expr: 'i(vlamp)', label: '楼道灯驱动电流 iLamp (mA)', color: '#34d399', unit: 'mA', scale: 1000, axis: 'right' },
        ],
        buildNetlist: (p) => `Ch5 AI Project Sound-Activated Corridor Delay Lamp
${SPICE_MODELS.DIODES}
${SPICE_MODELS.BJTS}
VCC vcc 0 12
* Clapping acoustic burst between t=4ms and t=12ms (2kHz carrier)
Bmic mic 0 V = (time > 4m && time < 12m) ? (${p.micMv * 1e-3} * sin(2*3.14159*2000*time)) : 0
C_in mic b1 4.7u
Rb1 vcc b1 36k
Rb2 b1 0 10k
Rc1 vcc c1 4.7k
Re1 e1 0 1k
Ce1 e1 0 47u
Qamp c1 b1 e1 Q_NPN
* Coupling & Voltage-Doubler Envelope Detector charging Delay Capacitor
C_coup c1 det_n 2.2u
D_clamp 0 det_n D_SI
D_peak det_n v_env D_SI
Cdelay v_env 0 ${p.cDelayUf}u
Rdis v_env 0 35k
* Darlington Driver Stage switching Corridor LED Lamp
Rb_drv v_env b2 4.7k
Qdrv1 vcc b2 e2 Q_NPN
Qdrv2 c_lamp e2 0 Q_NPN
Rlamp vcc lamp_p 120
Vlamp lamp_p l_an 0
Dlamp l_an c_lamp D_LED
.tran 150u 60m
.end`,
        computeMetrics: (p, sim) => {
          const iLamp = calcWaveStats(sim?.series[2]?.values ?? []);
          const peakCurrent = Math.max(...(sim?.series[2]?.values ?? [0]));
          return [
            { label: '拍手拾音峰值', value: `${p.micMv} mV (持续 8 ms)` },
            { label: '灯具点亮状态', value: peakCurrent > 15 ? '已触发点亮并延时维持' : '未达触发阈值（防误触）', highlight: true },
            { label: '照明灯峰值电流', value: `${peakCurrent.toFixed(1)} mA` },
          ];
        },
      },
    ],
  },
  {
    id: 'ch6',
    shortTitle: '第6章 频率响应',
    fullTitle: '第6章 放大电路的频率响应与波特图（Bode Plot）分析',
    hoursInfo: '大纲第6章 · RC频响 / 波特图 / 混合π高频模型 / 密勒效应 / 全频段频响',
    cases: [
      {
        id: 'ch6-rc-bode',
        chapterId: 'ch6',
        code: '6.1',
        title: '单时间常数 RC 低通与高通电路频率响应（波特图基础）',
        subtitle: '观测 -3dB 截止频率 f0 = 1/(2πRC)、±20 dB/十倍频渐近斜率与 ±45° 相移规律',
        badge: '核心掌握',
        syllabusSection: '6.(1) 频率响应概述：幅频特性、相频特性与波特图',
        objectives: [
          '理解高通网络决定放大器下限频率 fL、低通网络决定上限频率 fH 的物理本质',
          '熟记单极点系统在转折频率处增益下降 3.01 dB（幅值变为 0.707 倍）、相移 ±45°、高频/低频渐近斜率 ±20 dB/dec',
        ],
        principleSummary:
          '电路中的级间耦合电容构成高通环节（阻断低频），而晶体管结电容与分布电容构成低通环节（衰减高频）。波特图采用对数频率横轴与分贝（dB）纵轴，将乘除传递函数化为折线渐近相加。',
        keyFormulaLatex:
          'f_c = \\frac{1}{2\\pi R C}, \\quad |H(jf_c)| = \\frac{1}{\\sqrt{2}} \\; (-3.01\\text{ dB}), \\quad \\varphi(f_c) = \\mp 45^\\circ',
        experimentTips: [
          '移动鼠标到波特图上的黄色圆点标记处，直接验证增益比通带下降 3.01 dB 且相位恰为 -45°（低通）或 +45°（高通）！',
          '切换至【时域示波器 (.tran)】可对比该频率正弦波通过 RC 网络后的幅度衰减与相位超前/滞后。',
        ],
        defaultViewMode: 'ac',
        availableViewModes: ['ac', 'tran'],
        params: [
          {
            key: 'rcType',
            label: 'RC 网络类型',
            unit: '',
            min: 0,
            max: 1,
            step: 1,
            defaultValue: 0,
            options: [
              { label: '一阶 RC 低通网络 (模拟高频极电容)', value: 0 },
              { label: '一阶 RC 高通网络 (模拟耦合隔直电容)', value: 1 },
            ],
          },
          { key: 'rKohm', label: '电阻 R', unit: 'kΩ', min: 0.5, max: 20, step: 0.5, defaultValue: 1.59 },
          { key: 'cNf', label: '电容 C', unit: 'nF', min: 10, max: 500, step: 10, defaultValue: 100 },
        ],
        traces: [
          { expr: 'v(out)', label: '频率响应 H(jf)', color: '#38bdf8', unit: 'V' },
        ],
        buildNetlist: (p, mode) => {
          const analysis =
            mode === 'ac' ? '.ac dec 40 1 10Meg' : '.tran 10u 3m';
          if (p.rcType === 0) {
            return `Ch6 First-Order RC Low-Pass Bode Plot
Vin in 0 SIN(0 1 1k) AC 1
R1 in out ${p.rKohm}k
C1 out 0 ${p.cNf}n
${analysis}
.end`;
          }
          return `Ch6 First-Order RC High-Pass Bode Plot
Vin in 0 SIN(0 1 1k) AC 1
C1 in out ${p.cNf}n
R1 out 0 ${p.rKohm}k
${analysis}
.end`;
        },
        computeMetrics: (p, sim) => {
          const fcTheo = 1 / (2 * Math.PI * p.rKohm * 1e3 * p.cNf * 1e-9);
          const bm = calcBodeMetrics(sim, 0);
          const measFc = p.rcType === 0 ? bm.fHighHz : bm.fLowHz;
          return [
            { label: '理论转折频率 fc', value: formatEng(fcTheo, 'Hz', 2) },
            { label: 'Ngspice 实测 -3dB 频率', value: measFc ? formatEng(measFc, 'Hz', 2) : '--', highlight: true },
            { label: '阻带滚降斜率', value: p.rcType === 0 ? '-20 dB/十倍频' : '+20 dB/十倍频' },
          ];
        },
      },
      {
        id: 'ch6-bjt-freq',
        chapterId: 'ch6',
        code: '6.2',
        title: '单管共射(BJT)放大电路完整频率响应（混合π模型与密勒效应）',
        subtitle: '全频段 (1Hz ~ 100MHz) 波特图：调节耦合电容观察低频段 fL，调节集电结电容 Cμ 观察高频密勒倍增效应 fH',
        badge: '核心掌握',
        syllabusSection: '6.(2)(4) 晶体管高频混合π等效模型、密勒定理与单管共射频率响应',
        objectives: [
          '掌握混合 π 高频等效模型（rbb\'、rb\'e、Cπ、Cμ、gm）物理成因',
          '掌握密勒（Miller）电容倍增效应 C_M = (1 + gm·RL\')·Cμ 为何成为限制共射放大器上限频率 fH 的主导因素',
          '能够分析低频段（耦合电容 C1、C2 与旁路电容 Ce）、中频平坦段与高频滚降段构成的完整带通波特图',
        ],
        principleSummary:
          '跨接在反相高增益基极与集电极之间的集电结电容 Cμ（仅数皮法），经密勒效应折算到输入端被放大 (1 + |Av|) 倍（可达数百皮法），与 rbb\'+Rs\' 形成主导高频极点 fH！而低频截止 fL 主要由发射极旁路电容 Ce 决定。',
        keyFormulaLatex:
          'C_{\\pi}\' = C_{\\pi} + (1 + g_m R_L\') C_{\\mu}, \\qquad f_H \\approx \\frac{1}{2\\pi (R_s\' \\parallel r_{b\'e}) C_{\\pi}\'}',
        experimentTips: [
          '增大【集电结电容 Cμ】从 2 pF 到 20 pF：尽管仅增加十余皮法，经密勒放大百倍后上限截止频率 fH 显著左移下降！',
          '减小【射极旁路电容 Ce】从 47 μF 到 2 μF：观察下限截止频率 fL 大幅右移，低频增益出现台阶衰减！',
        ],
        defaultViewMode: 'ac',
        availableViewModes: ['ac', 'tran'],
        params: [
          { key: 'ceUf', label: '射极旁路电容 Ce (决定fL)', unit: 'μF', min: 1, max: 100, step: 5, defaultValue: 22 },
          { key: 'cmuPf', label: '集电结电容 Cμ (密勒效应)', unit: 'pF', min: 2, max: 25, step: 2, defaultValue: 4 },
          { key: 'rsOhm', label: '信号源内阻 Rs', unit: 'Ω', min: 50, max: 3000, step: 150, defaultValue: 600 },
        ],
        traces: [
          { expr: 'v(out)', label: '共射全频段电压增益 Av(jf)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p, mode) => {
          const analysis =
            mode === 'ac' ? '.ac dec 35 1 200Meg' : '.tran 10u 3m';
          return `Ch6 Single-Stage BJT Full Frequency Response
.model Q_HF NPN(IS=1e-14 BF=150 VAF=100 RB=40 CJE=12p CJC=${p.cmuPf}p TF=0.35n)
VCC vcc 0 12
Vs vs 0 SIN(0 0.015 10k) AC 1
Rs vs in ${p.rsOhm}
C1 in b 4.7u
Rb1 vcc b 33k
Rb2 b 0 10k
Rc vcc c 3k
Re e 0 1.2k
Ce e 0 ${p.ceUf}u
Q1 c b e Q_HF
C2 c out 4.7u
RL out 0 6k
${analysis}
.end`;
        },
        computeMetrics: (_p, sim) => {
          const bm = calcBodeMetrics(sim, 0);
          const bw =
            bm.fHighHz && bm.fLowHz ? bm.fHighHz - bm.fLowHz : bm.fHighHz;
          return [
            { label: '中频电压增益 Avm', value: `${bm.peakGainDb.toFixed(1)} dB (${Math.pow(10, bm.peakGainDb / 20).toFixed(1)}倍)`, highlight: true },
            { label: '下限截止频率 fL', value: bm.fLowHz ? formatEng(bm.fLowHz, 'Hz', 2) : '--' },
            { label: '上限截止频率 fH', value: bm.fHighHz ? formatEng(bm.fHighHz, 'Hz', 2) : '--', highlight: true },
            { label: '通频带 BW = fH - fL', value: bw ? formatEng(bw, 'Hz', 2) : '--' },
          ];
        },
      },
      {
        id: 'ch6-mos-cascode-freq',
        chapterId: 'ch6',
        code: '6.3',
        title: '场效应管高频模型：普通共源(CS) vs 共源-共栅(Cascode)宽带频响对比',
        subtitle: '同屏对比两条波特图曲线，直观见证共源共栅（Cascode）结构消除栅漏电容 Cgd 密勒效应、大幅拓展带宽',
        badge: '理解掌握',
        syllabusSection: '6.(3) 场效应管的高频等效模型与宽带放大技术',
        objectives: [
          '理解 MOSFET 高频模型中栅源电容 Cgs 与栅漏跨接电容 Cgd 的影响',
          '掌握共源-共栅（CS-CG Cascode）将第一级漏极交流增益降至 ≈ -1，从而消除 Cgd 密勒倍增以换取数倍高频带宽提升的原理',
        ],
        principleSummary:
          '在高源内阻下，普通共源放大器的栅漏电容 Cgd 承受 (1 + gm·Rd) 倍密勒放大，导致高频急剧滚降；而在 M1 漏极上方叠接一只共栅管 M2（Cascode），M1 漏极负载仅为 1/gm2，密勒系数从数十倍骤降至 2 倍，中频增益不变而上限频率 fH 跃升数倍！',
        keyFormulaLatex:
          'A_{v,\\text{M1}} \\approx -\\frac{g_{m1}}{g_{m2}} = -1 \\implies C_{\\text{Miller}} = (1 - A_{v,\\text{M1}})C_{gd} \\approx 2 C_{gd}',
        experimentTips: [
          '对比图中蓝色虚线（普通单管 CS）与绿色实线（Cascode 共源共栅）：两者低中频增益几乎相等，但 Cascode 的高频 -3dB 带宽拓展了近 5~8 倍！',
        ],
        defaultViewMode: 'ac',
        availableViewModes: ['ac'],
        params: [
          { key: 'cgdPf', label: '栅漏交叠电容 Cgd', unit: 'pF', min: 1, max: 10, step: 1, defaultValue: 3 },
          { key: 'rsKohm', label: '信号源内阻 Rs', unit: 'kΩ', min: 0.5, max: 10, step: 0.5, defaultValue: 3.0 },
          { key: 'rdKohm', label: '漏极负载电阻 Rd', unit: 'kΩ', min: 1, max: 6, step: 0.5, defaultValue: 3.5 },
        ],
        traces: [
          { expr: 'v(out_cs)', label: '普通共源放大器 CS (受密勒限制)', color: '#38bdf8', unit: 'V', dashed: true },
          { expr: 'v(out_cas)', label: '共源-共栅 Cascode (抑制密勒效应)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p) => `Ch6 MOSFET CS vs Cascode High-Frequency Miller Comparison
.model M_HF NMOS(LEVEL=1 VTO=1.4 KP=5m LAMBDA=0.02 CBS=2p CBD=2p)
VDD vdd 0 12
Vac vs 0 AC 1
* Branch 1: Standard Common-Source
Rs1 vs g1 ${p.rsKohm}k
Cgs1 g1 0 4p
Cgd1 g1 out_cs ${p.cgdPf}p
Vbias1 g1_dc 0 2.6
Rbias1 g1_dc g1 500k
Rd1 vdd out_cs ${p.rdKohm}k
M1 out_cs g1 0 0 M_HF
* Branch 2: Cascode (CS + CG)
Rs2 vs g2 ${p.rsKohm}k
Cgs2 g2 0 4p
Cgd2 g2 d_mid ${p.cgdPf}p
Rbias2 g1_dc g2 500k
Vcas g_cas 0 5.5
Rd2 vdd out_cas ${p.rdKohm}k
M2_bot d_mid g2 0 0 M_HF
M2_top out_cas g_cas d_mid 0 M_HF
.ac dec 35 100 500Meg
.end`,
        computeMetrics: (_p, sim) => {
          const bmCs = calcBodeMetrics(sim, 0);
          const bmCas = calcBodeMetrics(sim, 1);
          const boost =
            bmCas.fHighHz && bmCs.fHighHz ? bmCas.fHighHz / bmCs.fHighHz : 1;
          return [
            { label: '普通 CS 上限频率 fH1', value: bmCs.fHighHz ? formatEng(bmCs.fHighHz, 'Hz', 2) : '--' },
            { label: 'Cascode 上限频率 fH2', value: bmCas.fHighHz ? formatEng(bmCas.fHighHz, 'Hz', 2) : '--', highlight: true },
            { label: '高频带宽扩展倍数', value: `${boost.toFixed(1)} 倍`, highlight: true },
          ];
        },
      },
    ],
  },
];
