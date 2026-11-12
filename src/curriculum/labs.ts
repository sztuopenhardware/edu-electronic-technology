import type { ChapterGroup } from '../types';
import { SPICE_MODELS } from '../spiceModels';
import { calcWaveStats, formatEng } from '../utils/format';

export const LAB_CHAPTER: ChapterGroup = {
  id: 'labs',
  shortTitle: '课内实践（实验一 ~ 实验六）',
  fullTitle: '课内实践环节：模拟电子技术六大必做综合实验虚拟仿真台（18学时）',
  hoursInfo: '大纲(二) 课内实践必做实验 1~6 · 虚拟函数发生器 + 数字万用表 + 双踪示波器',
  ideologyTitle: '知行合一与工匠精神——严谨测试、实事求是处理实验数据',
  ideologyContent:
    '模拟电子实验强调理论计算与工程实测相互印证。掌握换算法测输入输出电阻、静态工作点联调及失真排查，培养求真务实、精益求精的卓越工程师素养。',
  cases: [
    {
      id: 'lab1-instruments',
      chapterId: 'labs',
      code: '实验一',
      title: '模电仪器和设备使用及预备实验（信号源/万用表/示波器联调）',
      subtitle: '仿真函数信号发生器（正弦/方波/三角波、偏置与幅频）及 RC 分压网络的有效值/峰峰值对照测量',
      badge: '必做实验',
      syllabusSection: '实验项目一：万用表、函数发生器、示波器的使用（3学时）',
      objectives: [
        '掌握函数发生器三种基本波形输出、频率、峰峰值 Vpp 与直流偏置 Voffset 的关系',
        '区分数字万用表交流有效值（RMS）读数与示波器峰峰值（Vpp）读数的换算系数（正弦 Vpp = 2√2·Vrms，三角波 Vpp = 2√3·Vrms，方波 Vpp = 2·Vrms）',
      ],
      principleSummary:
        '实验箱上函数信号发生器存在 50Ω 输出内阻，当接不同负载及耦合方式（AC隔直 vs DC直耦）时，需正确配合示波器与数字万用表完成基准校验。',
      keyFormulaLatex:
        'V_{\\text{rms,正弦}} = \\frac{V_m}{\\sqrt{2}} = \\frac{V_{pp}}{2\\sqrt{2}}, \\quad V_{\\text{rms,方波}} = V_m, \\quad V_{\\text{rms,三角}} = \\frac{V_m}{\\sqrt{3}}',
      experimentTips: [
        '切换【函数发生器波形】，核对下方虚拟万用表自动测算的 RMS 有效值与理论换算系数（0.707 / 1.000 / 0.577）是否一致！',
        '加入直流偏置 Voffset 后，对比【DC 直接耦合】与【AC 电容隔直耦合】通道的直流均值差异。',
      ],
      defaultViewMode: 'tran',
      availableViewModes: ['tran', 'fft'],
      params: [
        {
          key: 'waveShape',
          label: '函数发生器波形选择',
          unit: '',
          min: 0,
          max: 2,
          step: 1,
          defaultValue: 0,
          options: [
            { label: '正弦波 (Sine)', value: 0 },
            { label: '对称方波 (Square)', value: 1 },
            { label: '线性三角波 (Triangle)', value: 2 },
          ],
        },
        { key: 'ampV', label: '信号幅度峰值 Vm', unit: 'V', min: 0.5, max: 5.0, step: 0.5, defaultValue: 2.0 },
        { key: 'dcOff', label: '直流偏置电压 Voffset', unit: 'V', min: -2.0, max: 2.0, step: 0.5, defaultValue: 1.0 },
        { key: 'freqHz', label: '信号频率 f', unit: 'Hz', min: 200, max: 5000, step: 200, defaultValue: 1000 },
      ],
      traces: [
        { expr: 'v(in)', label: 'CH1 (DC耦合 含直流偏置)', color: '#38bdf8', unit: 'V' },
        { expr: 'v(out)', label: 'CH2 (AC电容隔直输出)', color: '#34d399', unit: 'V', dashed: true },
      ],
      buildNetlist: (p) => {
        const T = 1 / p.freqHz;
        const half = T / 2;
        const vLo = p.dcOff - p.ampV;
        const vHi = p.dcOff + p.ampV;
        let srcDef = `SIN(${p.dcOff} ${p.ampV} ${p.freqHz})`;
        if (p.waveShape === 1) {
          const tr = T * 0.008;
          srcDef = `PULSE(${vLo} ${vHi} 0 ${tr} ${tr} ${half - tr} ${T})`;
        } else if (p.waveShape === 2) {
          srcDef = `PULSE(${vLo} ${vHi} 0 ${half * 0.99} ${half * 0.99} ${T * 0.01} ${T})`;
        }
        const tStop = 4 * T;
        const tStep = tStop / 500;
        return `Lab 1 Instruments & AC/DC Coupling Calibration
Vgen vs 0 ${srcDef}
Rgen vs in 50
C_ac in out 10u
Rscope out 0 100k
.tran ${tStep.toExponential(3)} ${tStop.toExponential(3)}
.end`;
      },
      computeMetrics: (_p, sim) => {
        const ch1 = calcWaveStats(sim?.series[0]?.values ?? []);
        const ch2 = calcWaveStats(sim?.series[1]?.values ?? []);
        return [
          { label: 'CH1 示波器峰峰值 Vpp', value: formatEng(ch1.vpp, 'V', 2), highlight: true },
          { label: 'CH1 直流均值 (万用表DCV)', value: formatEng(ch1.vAvg, 'V', 2) },
          { label: 'CH2 纯交流有效值 (ACV RMS)', value: formatEng(ch2.vRms, 'V', 3), highlight: true },
        ];
      },
    },
    {
      id: 'lab2-opamp-math',
      chapterId: 'labs',
      code: '实验二',
      title: '比例求和运算电路综合实验（五大测试子项全覆盖）',
      subtitle: '涵盖大纲全部 5 个必测子电路：电压跟随、反相比例、同相比例、反相求和、双端加减运算',
      badge: '必做实验',
      syllabusSection: '实验项目二：比例求和运算电路（3学时）',
      objectives: [
        '独立完成电压跟随、反相比例、同相比例、反相求和及双端输入求和/求差放大电路的测试与误差分析',
        '记录理论计算值与仿真/实测数据表，分析电阻容差与运放失调的影响',
      ],
      principleSummary:
        '对应实验指导书实验二全部 5 项接线实验任务，可在保持信号源一致的前提下快速切换接线拓扑并采集实验报告所需的输入输出峰峰值与相位数据。',
      keyFormulaLatex:
        'V_{o1}=V_i,\\; V_{o2}=-\\frac{R_f}{R_1}V_i,\\; V_{o3}=\\left(1+\\frac{R_f}{R_1}\\right)V_i,\\; V_{o4}=-R_f\\!\\left(\\frac{V_{i1}}{R_1}+\\frac{V_{i2}}{R_2}\\right)',
      experimentTips: [
        '按实验报告顺序依次切换 5 个【实验测试子项】按钮，记录对应的输入 Vpp、输出 Vpp、相位关系与相对误差！',
      ],
      defaultViewMode: 'tran',
      availableViewModes: ['tran'],
      params: [
        {
          key: 'subTask',
          label: '实验二测试子项',
          unit: '',
          min: 0,
          max: 4,
          step: 1,
          defaultValue: 1,
          options: [
            { label: '(1) 电压跟随器', value: 0 },
            { label: '(2) 反相比例', value: 1 },
            { label: '(3) 同相比例', value: 2 },
            { label: '(4) 反相求和', value: 3 },
            { label: '(5) 双端输入加减', value: 4 },
          ],
        },
        { key: 'v1', label: '信号源 Vi1 幅值 (1kHz)', unit: 'V', min: 0.2, max: 2.0, step: 0.2, defaultValue: 1.0 },
        { key: 'v2', label: '信号源 Vi2 直流/同频幅值', unit: 'V', min: 0.2, max: 2.0, step: 0.2, defaultValue: 0.6 },
        { key: 'r1', label: '输入电阻 R1', unit: 'kΩ', min: 5, max: 20, step: 5, defaultValue: 10 },
        { key: 'rf', label: '反馈电阻 Rf', unit: 'kΩ', min: 10, max: 50, step: 10, defaultValue: 20 },
      ],
      traces: [
        { expr: 'v(in)', label: '主输入信号 v(in)', color: '#38bdf8', unit: 'V', dashed: true },
        { expr: 'v(out)', label: '运放实测输出 v(out)', color: '#34d399', unit: 'V' },
      ],
      buildNetlist: (p) => {
        const header = `Lab 2 OpAmp Math Circuits
${SPICE_MODELS.OPAMP_SUBCKT}
VCC vcc 0 12
VEE vee 0 -12
V1 in 0 SIN(0 ${p.v1} 1k)
V2 in2 0 SIN(0 ${p.v2} 1k)`;
        if (p.subTask === 0) {
          return `${header}
Xop in out vcc vee out OPAMP_STD
RL out 0 10k
.tran 15u 3m
.end`;
        }
        if (p.subTask === 1) {
          return `${header}
R1 in vn ${p.r1}k
Rf vn out ${p.rf}k
Rp vp 0 ${(p.r1 * p.rf) / (p.r1 + p.rf)}k
Xop vp vn vcc vee out OPAMP_STD
RL out 0 10k
.tran 15u 3m
.end`;
        }
        if (p.subTask === 2) {
          return `${header}
R1 vn 0 ${p.r1}k
Rf vn out ${p.rf}k
Xop in vn vcc vee out OPAMP_STD
RL out 0 10k
.tran 15u 3m
.end`;
        }
        if (p.subTask === 3) {
          return `${header}
R1 in vn ${p.r1}k
R2 in2 vn ${p.r1}k
Rf vn out ${p.rf}k
Xop 0 vn vcc vee out OPAMP_STD
RL out 0 10k
.tran 15u 3m
.end`;
        }
        return `${header}
R1 in vn ${p.r1}k
Rf vn out ${p.rf}k
R2 in2 vp ${p.r1}k
R3 vp 0 ${p.rf}k
Xop vp vn vcc vee out OPAMP_STD
RL out 0 10k
.tran 15u 3m
.end`;
      },
      computeMetrics: (p, sim) => {
        const vi = calcWaveStats(sim?.series[0]?.values ?? []);
        const vo = calcWaveStats(sim?.series[1]?.values ?? []);
        const k = p.rf / p.r1;
        const theoPeak = [
          p.v1,
          k * p.v1,
          (1 + k) * p.v1,
          k * (p.v1 + p.v2),
          Math.abs(k * (p.v2 - p.v1)),
        ][p.subTask];
        return [
          { label: '理论输出峰峰值 2·Vom', value: `${(2 * theoPeak).toFixed(3)} V` },
          { label: '实测输出峰峰值 Vo(pp)', value: `${vo.vpp.toFixed(3)} V`, highlight: true },
          { label: '实测输入峰峰值 Vi(pp)', value: `${vi.vpp.toFixed(3)} V` },
        ];
      },
    },
    {
      id: 'lab3-ce-static',
      chapterId: 'labs',
      code: '实验三',
      title: '单级交流放大电路（静态工作点调试与失真观察）',
      subtitle: '旋动实验箱上偏置电位器 Rw 连续调整 VB、VE、VC、VCEQ 与 ICQ，完成实验三静态数据表采集',
      badge: '必做实验',
      syllabusSection: '实验项目三：单级交流放大电路(静态工作)（3学时）',
      objectives: [
        '掌握实验箱上通过微调上偏置电位器 Rw 将静态集电极电流 ICQ 整定至指定值（如 1.5mA 或 2.0mA）的规范步骤',
        '学会间接测量法求 ICQ ≈ VE / Re（避免断开集电极支路串入电流表的繁琐操作）',
      ],
      principleSummary:
        '实验箱标准单管放大电路采用 Rb1 + 可调电位器 Rw 与下偏置 Rb2 分压。当输入端对地短路（或加小信号检验）时，用万用表直流电压挡分别测出 VB、VE、VC 对地电位，即可算出 VCEQ = VC - VE 及 ICQ ≈ VE / Re！',
      keyFormulaLatex:
        'V_{CEQ} = V_C - V_E, \\quad I_{CQ} \\approx I_{EQ} = \\frac{V_E}{R_e}, \\quad V_{BEQ} = V_B - V_E',
      experimentTips: [
        '实验任务实操：调节【实验箱偏置电位器 Rw】，尝试将下方万用表读数中的【静态电流 ICQ】精确调到 2.00 mA（误差 < ±0.05mA），记录此时的 VB、VE、VC、VCEQ！',
      ],
      defaultViewMode: 'tran',
      availableViewModes: ['tran'],
      params: [
        { key: 'rwKohm', label: '偏置可调电位器 Rw (0~100kΩ)', unit: 'kΩ', min: 5, max: 100, step: 2.5, defaultValue: 27.5 },
        { key: 'rc', label: '集电极电阻 Rc', unit: 'kΩ', min: 1.5, max: 5.1, step: 0.3, defaultValue: 2.4 },
        { key: 're', label: '发射极电阻 Re', unit: 'kΩ', min: 0.5, max: 2.0, step: 0.25, defaultValue: 1.0 },
        { key: 'vinMv', label: '检验正弦信号 Vim (0=纯静态调零)', unit: 'mV', min: 0, max: 40, step: 5, defaultValue: 15 },
      ],
      traces: [
        { expr: 'v(b)', label: '基极对地电压 v(B)', color: '#38bdf8', unit: 'V', dashed: true },
        { expr: 'v(e)', label: '发射极对地电压 v(E)', color: '#fbbf24', unit: 'V', dashed: true },
        { expr: 'v(c)', label: '集电极对地总电压 v(C)', color: '#34d399', unit: 'V' },
      ],
      buildNetlist: (p) => `Lab 3 Single-Stage BJT Amplifier Static Q-Point Tuning
${SPICE_MODELS.BJTS}
VCC vcc 0 12
Vin in 0 SIN(0 ${p.vinMv * 1e-3} 1k)
C1 in b 10u
* Rb1 fixed 10k + potentiometer Rw, Rb2 = 12k
Rb_up vcc b ${10 + p.rwKohm}k
Rb2 b 0 12k
Rc vcc c ${p.rc}k
Re e 0 ${p.re}k
Ce e 0 47u
Q1 c b e Q_NPN
C2 c out 10u
RL out 0 5.1k
.tran 15u 3m
.end`,
      computeMetrics: (p, sim) => {
        const vb = calcWaveStats(sim?.series[0]?.values ?? []).vAvg;
        const ve = calcWaveStats(sim?.series[1]?.values ?? []).vAvg;
        const vc = calcWaveStats(sim?.series[2]?.values ?? []).vAvg;
        const vceq = vc - ve;
        const icqMa = ve / p.re;
        return [
          { label: '万用表 DCV: VB / VE', value: `${vb.toFixed(2)} V / ${ve.toFixed(2)} V` },
          { label: '万用表 DCV: VC', value: `${vc.toFixed(2)} V` },
          { label: '管压降 VCEQ = VC - VE', value: `${vceq.toFixed(2)} V`, highlight: true },
          { label: '静态工作电流 ICQ ≈ VE/Re', value: `${icqMa.toFixed(2)} mA`, highlight: true },
        ];
      },
    },
    {
      id: 'lab4-ce-dynamic',
      chapterId: 'labs',
      code: '实验四',
      title: '单级交流放大电路（动态增益与换算法测输入电阻 Ri、输出电阻 Ro）',
      subtitle: '配备实验箱真实的“串联取样电阻 Rs 开关”与“负载 RL 投切开关”，按两步换算法实测 Ri 与 Ro',
      badge: '必做实验',
      syllabusSection: '实验项目四：单级交流放大电路(动态工作)（3学时）',
      objectives: [
        '掌握输入串联已知电阻 Rs 测量源电压 Vs 与净输入电压 Vi，利用 Ri = Vi / (Vs - Vi) · Rs 换算输入电阻的方法',
        '掌握测量空载输出电压 Vo(开路) 与带载输出电压 Vo(RL)，利用 Ro = (Vo0/VoL - 1) · RL 换算输出电阻的方法',
      ],
      principleSummary:
        '交流输入电阻 Ri 和输出电阻 Ro 无法用万用表欧姆挡直接带电测量！工程实验室标准做法是“分压换算法”：在输入端串入已知取样电阻测分压求 Ri；在输出端切换空载/有载两次幅值求 Ro！',
      keyFormulaLatex:
        'R_i = \\frac{V_i}{V_s - V_i} R_s, \\qquad R_o = \\left(\\frac{V_{o(\\text{空载})}}{V_{o(\\text{有载})}} - 1\\right) R_L',
      experimentTips: [
        '测 Ro 实操：先将【负载投切开关 K_RL】拨至“断开空载”记下输出峰峰值 Vo0；再拨回“接入 RL”记下 VoL，代入公式验证与下方自动换算值完全一致！',
        '测 Ri 实操：观察蓝色信号源 v(vs) 与黄色放大器输入端 v(in) 的峰峰值比值，直接算出动态输入电阻 Ri！',
      ],
      defaultViewMode: 'tran',
      availableViewModes: ['tran', 'ac'],
      params: [
        {
          key: 'loadSwitch',
          label: '负载投切开关 K_RL (测Ro用)',
          unit: '',
          min: 0,
          max: 1,
          step: 1,
          defaultValue: 1,
          options: [
            { label: '闭合接入负载 RL (有载)', value: 1 },
            { label: '断开负载 (空载测 Vo0)', value: 0 },
          ],
        },
        { key: 'rsTestKohm', label: '输入测试取样电阻 Rs', unit: 'kΩ', min: 0.5, max: 5.0, step: 0.5, defaultValue: 2.0 },
        { key: 'rcKohm', label: '集电极电阻 Rc (理论≈Ro)', unit: 'kΩ', min: 1.5, max: 5.1, step: 0.3, defaultValue: 2.4 },
        { key: 'rlKohm', label: '外接负载电阻 RL', unit: 'kΩ', min: 1.5, max: 5.1, step: 0.3, defaultValue: 2.4 },
      ],
      traces: [
        { expr: 'v(vs)', label: '信号源端 v(vs)', color: '#38bdf8', unit: 'V', dashed: true },
        { expr: 'v(in)', label: '放大器输入端 v(in)', color: '#fbbf24', unit: 'V' },
        { expr: 'v(out)', label: '放大器输出端 v(out)', color: '#34d399', unit: 'V' },
      ],
      buildNetlist: (p, mode) => {
        const rlVal = p.loadSwitch === 1 ? `${p.rlKohm}k` : '100Meg';
        const analysis =
          mode === 'ac' ? '.ac dec 30 10 50Meg' : '.tran 15u 3m';
        return `Lab 4 CE Dynamic Parameters Measurement (Av, Ri, Ro)
${SPICE_MODELS.BJTS}
VCC vcc 0 12
Vs vs 0 SIN(0 0.02 1k) AC 1
Rs vs in ${p.rsTestKohm}k
C1 in b 10u
Rb1 vcc b 36k
Rb2 b 0 12k
Rc vcc c ${p.rcKohm}k
Re e 0 1k
Ce e 0 47u
Q1 c b e Q_NPN
C2 c out 10u
RL out 0 ${rlVal}
${analysis}
.end`;
      },
      computeMetrics: (p, sim) => {
        const vs = calcWaveStats(sim?.series[0]?.values ?? []).vpp;
        const vi = calcWaveStats(sim?.series[1]?.values ?? []).vpp;
        const vo = calcWaveStats(sim?.series[2]?.values ?? []).vpp;
        const av = vi > 1e-6 ? -(vo / vi) : 0;
        const riMeas = vs > vi + 1e-6 ? (vi / (vs - vi)) * p.rsTestKohm : 0;
        return [
          { label: '当前负载状态', value: p.loadSwitch === 1 ? `有载 (RL=${p.rlKohm}kΩ)` : '空载 (RL断开)' },
          { label: '实测电压增益 Av = Vo/Vi', value: `${av.toFixed(1)} 倍`, highlight: true },
          { label: '换算法实测输入电阻 Ri', value: `${riMeas.toFixed(2)} kΩ`, highlight: true },
          { label: '输出峰峰值 Vo(pp)', value: formatEng(vo, 'V', 3), hint: `理论输出电阻 Ro≈Rc=${p.rcKohm}kΩ` },
        ];
      },
    },
    {
      id: 'lab5-emitter-follower',
      chapterId: 'labs',
      code: '实验五',
      title: '射极跟随器综合实验（高输入电阻 Ri 换算测量与低输出电阻 Ro 验证）',
      subtitle: '复现实验五全部测量步骤：直流工作点调试、Av≈1 验证、换算法实测高输入电阻 Ri 与几十欧级低输出电阻 Ro',
      badge: '必做实验',
      syllabusSection: '实验项目五：射极跟随器（3学时）',
      objectives: [
        '验证射极跟随器电压放大倍数略小于 1 但同相跟随、输入电阻高、输出电阻极低的阻抗变换特性',
        '熟练运用换算法测量射极跟随器的高输入电阻 Ri 及低输出电阻 Ro',
      ],
      principleSummary:
        '射极跟随器属于深度电压串联负反馈电路。其输入电阻随负载增大而提高，输出电阻仅为几十欧姆，即使切换重负载，输出幅度变化也微乎其微！',
      keyFormulaLatex:
        'A_v \\approx 1, \\quad R_i = R_b \\parallel [r_{be} + (1+\\beta)R_e\'], \\quad R_o = R_e \\parallel \\frac{R_s\'+r_{be}}{1+\\beta}',
      experimentTips: [
        '对比实验四（共射）与实验五（射极跟随器）：在实验五中切换【负载开关 K_RL】，观察输出电压几乎不跌落，证明其输出电阻 Ro 极小（几十欧量级）！',
      ],
      defaultViewMode: 'tran',
      availableViewModes: ['tran', 'ac'],
      params: [
        {
          key: 'loadSwitch',
          label: '输出负载开关 K_RL',
          unit: '',
          min: 0,
          max: 1,
          step: 1,
          defaultValue: 1,
          options: [
            { label: '接入负载 RL', value: 1 },
            { label: '断开负载 (空载测 Vo0)', value: 0 },
          ],
        },
        { key: 'rsTestKohm', label: '输入换算取样电阻 Rs', unit: 'kΩ', min: 2, max: 30, step: 2, defaultValue: 10 },
        { key: 'reKohm', label: '发射极偏置电阻 Re', unit: 'kΩ', min: 1, max: 5, step: 0.5, defaultValue: 2.4 },
        { key: 'rlKohm', label: '外接负载电阻 RL', unit: 'kΩ', min: 0.5, max: 5, step: 0.5, defaultValue: 1.0 },
      ],
      traces: [
        { expr: 'v(vs)', label: '信号源电动势 v(vs)', color: '#94a3b8', unit: 'V', dashed: true },
        { expr: 'v(in)', label: '跟随器输入端 v(in)', color: '#38bdf8', unit: 'V' },
        { expr: 'v(out)', label: '射极跟随输出 v(out)', color: '#34d399', unit: 'V' },
      ],
      buildNetlist: (p, mode) => {
        const rlVal = p.loadSwitch === 1 ? `${p.rlKohm}k` : '100Meg';
        const analysis =
          mode === 'ac' ? '.ac dec 30 10 100Meg' : '.tran 15u 3m';
        return `Lab 5 Emitter Follower Input & Output Impedance Measurement
${SPICE_MODELS.BJTS}
VCC vcc 0 12
Vs vs 0 SIN(0 1.0 1k) AC 1
Rs vs in ${p.rsTestKohm}k
C1 in b 10u
Rb vcc b 120k
Re e 0 ${p.reKohm}k
Q1 vcc b e Q_NPN
C2 e out 22u
RL out 0 ${rlVal}
${analysis}
.end`;
      },
      computeMetrics: (p, sim) => {
        const vs = calcWaveStats(sim?.series[0]?.values ?? []).vpp;
        const vi = calcWaveStats(sim?.series[1]?.values ?? []).vpp;
        const vo = calcWaveStats(sim?.series[2]?.values ?? []).vpp;
        const av = vi > 1e-6 ? vo / vi : 0;
        const riMeas = vs > vi + 1e-6 ? (vi / (vs - vi)) * p.rsTestKohm : 0;
        return [
          { label: '电压跟随增益 Av = Vo/Vi', value: `${av.toFixed(3)} 倍`, highlight: true },
          { label: '换算法实测高输入电阻 Ri', value: `${riMeas.toFixed(1)} kΩ`, highlight: true },
          { label: '输出端峰峰值 Vo(pp)', value: `${vo.toFixed(3)} V`, hint: '切换空载/有载算出 Ro≈30~80Ω' },
        ];
      },
    },
    {
      id: 'lab6-comparators',
      chapterId: 'labs',
      code: '实验六',
      title: '电压比较器综合实验（过零比较 / 反相滞回比较 / 同相滞回比较）',
      subtitle: '采用三角波扫描输入，完整覆盖实验六三大必做测试电路并在 X-Y 示波模式下直读门限与回差电压',
      badge: '必做实验',
      syllabusSection: '实验项目六：电压比较器（过零、反相滞回、同相滞回）（3学时）',
      objectives: [
        '独立测试过零比较器、反相输入滞回比较器与同相输入滞回比较器的时域波形和电压传输特性',
        '区分反相滞回（顺时针回环，输入过上阈值跳变至 -UZ）与同相滞回（逆时针回环，输入过上阈值跳变至 +UZ）的方向差异',
      ],
      principleSummary:
        '实验箱常用三角波作为比较器扫描激励信号，开启示波器 X-Y 模式后：通道1接三角波输入（X轴），通道2接比较器稳压限幅输出（Y轴），屏幕上直接呈现教科书级的传输回环曲线！',
      keyFormulaLatex:
        '\\text{反相滞回: } V_{T} = \\pm\\frac{R_1}{R_1+R_2}U_Z \\qquad \\text{同相滞回: } V_{T} = \\pm\\frac{R_1}{R_2}U_Z \\;(R_2 > R_1)',
      experimentTips: [
        '强烈推荐点击上方【X-Y 传输曲线】按钮，然后依次点击切换【(1)过零比较】【(2)反相滞回】【(3)同相滞回】，一眼看懂三者回环方向与门限宽度的本质区别！',
      ],
      defaultViewMode: 'xy',
      availableViewModes: ['xy', 'tran'],
      xyAxes: { xExpr: 'v(in)', yExpr: 'v(out)', xLabel: '三角波扫描输入 v(in)', yLabel: '比较器限幅输出 v(out)' },
      params: [
        {
          key: 'cmpType',
          label: '实验六比较器子电路',
          unit: '',
          min: 0,
          max: 2,
          step: 1,
          defaultValue: 1,
          options: [
            { label: '(1) 过零比较电路', value: 0 },
            { label: '(2) 反相滞回比较电路', value: 1 },
            { label: '(3) 同相滞回比较电路', value: 2 },
          ],
        },
        { key: 'r1Kohm', label: '电阻 R1', unit: 'kΩ', min: 2, max: 12, step: 2, defaultValue: 6 },
        { key: 'r2Kohm', label: '正反馈电阻 R2', unit: 'kΩ', min: 12, max: 30, step: 2, defaultValue: 18 },
        { key: 'vref', label: '参考偏置电压 Vref', unit: 'V', min: -2, max: 2, step: 0.5, defaultValue: 0 },
      ],
      traces: [
        { expr: 'v(in)', label: '三角波扫描输入 v(in)', color: '#38bdf8', unit: 'V', dashed: true },
        { expr: 'v(out)', label: '比较器输出 v(out)', color: '#34d399', unit: 'V' },
      ],
      buildNetlist: (p) => {
        const base = `Lab 6 Voltage Comparators Suite
${SPICE_MODELS.ZENERS}
${SPICE_MODELS.OPAMP_FAST_SUBCKT}
VCC vcc 0 12
VEE vee 0 -12
* Triangle wave input (-6V to +6V, 500Hz)
Vin in 0 PULSE(-6 6 0 0.99m 0.99m 0.02m 2m)
Vref ref 0 ${p.vref}`;
        if (p.cmpType === 0) {
          return `${base}
Xop ref in vcc vee raw OPAMP_FAST
Rlim raw out 500
Dz1 zm out DZ_5V1
Dz2 zm 0 DZ_5V1
.tran 10u 4m
.end`;
        }
        if (p.cmpType === 1) {
          return `${base}
R1 vp ref ${p.r1Kohm}k
R2 out vp ${p.r2Kohm}k
Xop vp in vcc vee raw OPAMP_FAST
Rlim raw out 500
Dz1 zm out DZ_5V1
Dz2 zm 0 DZ_5V1
.tran 10u 4m
.end`;
        }
        // 同相滞回比较器：in 经 R1 接同相端 vp，out 经 R2 接同相端 vp，反相端接 Vref
        return `${base}
R1 in vp ${p.r1Kohm}k
R2 out vp ${p.r2Kohm}k
Xop vp ref vcc vee raw OPAMP_FAST
Rlim raw out 500
Dz1 zm out DZ_5V1
Dz2 zm 0 DZ_5V1
.tran 10u 4m
.end`;
      },
      computeMetrics: (p, sim) => {
        const uz = 5.8;
        const vo = calcWaveStats(sim?.series[1]?.values ?? []);
        let vut = p.vref;
        let vlt = p.vref;
        if (p.cmpType === 1) {
          const d = (p.r1Kohm / (p.r1Kohm + p.r2Kohm)) * uz;
          vut = (p.r2Kohm / (p.r1Kohm + p.r2Kohm)) * p.vref + d;
          vlt = (p.r2Kohm / (p.r1Kohm + p.r2Kohm)) * p.vref - d;
        } else if (p.cmpType === 2) {
          const d = (p.r1Kohm / p.r2Kohm) * uz;
          vut = (1 + p.r1Kohm / p.r2Kohm) * p.vref + d;
          vlt = (1 + p.r1Kohm / p.r2Kohm) * p.vref - d;
        }
        return [
          { label: '上门限阈值 VUT', value: `${vut.toFixed(2)} V`, highlight: true },
          { label: '下门限阈值 VLT', value: `${vlt.toFixed(2)} V`, highlight: true },
          { label: '回差电压 ΔVT', value: `${(vut - vlt).toFixed(2)} V` },
          { label: '输出高低电平 ±UZ', value: `±${(vo.vpp / 2).toFixed(2)} V` },
        ];
      },
    },
  ],
};
