import type { ChapterGroup } from '../types';
import { SPICE_MODELS } from '../spiceModels';
import { calcBodeMetrics, calcWaveStats, formatEng } from '../utils/format';

export const CH7_TO_CH10: ChapterGroup[] = [
  {
    id: 'ch7',
    shortTitle: '第7章 集成运算放大电路',
    fullTitle: '第7章 模拟集成运算放大电路内部架构剖析',
    hoursInfo: '大纲第7章 · 镜像/微电流源 / 差分放大CMRR / OCL交越失真 / 保护电路',
    ideologyTitle: '系统思维与团队协同——四大核心模块各司其职',
    ideologyContent:
      '高性能集成运放由偏置电流源、差分输入级、高增益中间级和低阻互补输出级紧密协同构成，任一环节失效都会导致整体功能丧失。正如重大工程攻关离不开跨学科团队明确分工、同心协力。',
    cases: [
      {
        id: 'ch7-current-mirror',
        chapterId: 'ch7',
        code: '7.1',
        title: '集成电路电流源：基本镜像电流源、微电流源与 Cascode 电流源',
        subtitle: '直流扫描负载集电极电压 (0~12V)，同屏对比三种电流源的恒流平坦度与等效交流输出电阻 ro',
        badge: '核心掌握',
        syllabusSection: '7.(2) 电流源电路：基本镜像电流源、微电流源、Cascode电流源',
        objectives: [
          '掌握基本镜像电流源利用配对三极管 VBE 相等实现 IC2 ≈ IREF 电流复制的工作原理',
          '理解微电流源（Re射极负反馈获得微安级电流）与威尔逊/Cascode 电流源极大提高输出电阻作有源负载的价值',
        ],
        principleSummary:
          '集成芯片内难以制造大阻值高稳定电阻，故普遍采用晶体管电流源提供偏置并充当高阻有源负载。基本镜像电流源受厄尔利效应影响随 VCE 略微倾斜；Cascode 叠加电流源将交流输出电阻提高 β 倍，恒流曲线几乎完全水平！',
        keyFormulaLatex:
          'I_{REF} = \\frac{V_{CC}-V_{BE}}{R}, \\quad \\text{镜像: } I_O \\approx I_{REF}, \\quad \\text{微电流源: } I_O R_e = V_T \\ln\\frac{I_{REF}}{I_O}',
        experimentTips: [
          '观察三条恒流曲线：蓝色为【基本镜像电流源】（略带厄尔利上翘斜率），绿色为【Cascode 电流源】（高度水平，输出电阻极高），黄色为串联发射极电阻获得的【微电流源】！',
        ],
        defaultViewMode: 'dc',
        availableViewModes: ['dc'],
        params: [
          { key: 'rRefKohm', label: '基准设定电阻 Rref', unit: 'kΩ', min: 5, max: 30, step: 2.5, defaultValue: 11.3 },
          { key: 'reMicroOhm', label: '微电流源发射极电阻 Re', unit: 'kΩ', min: 1, max: 10, step: 1, defaultValue: 5 },
          { key: 'vaf', label: '晶体管厄尔利电压 VA', unit: 'V', min: 25, max: 120, step: 25, defaultValue: 50 },
        ],
        traces: [
          { expr: 'i(vm_basic)', label: '基本镜像电流源 IO1 (mA)', color: '#38bdf8', unit: 'mA', scale: 1000 },
          { expr: 'i(vm_cas)', label: 'Cascode 高阻电流源 IO2 (mA)', color: '#34d399', unit: 'mA', scale: 1000 },
          { expr: 'i(vm_widlar)', label: 'Widlar 微电流源 IO3 (mA)', color: '#fbbf24', unit: 'mA', scale: 1000 },
        ],
        buildNetlist: (p) => `Ch7 IC Current Sources Comparison
.model Q_IC NPN(IS=1e-14 BF=120 VAF=${p.vaf})
VCC vcc 0 12
Vload vload 0 0
* 1. Basic Current Mirror
Rref1 vcc c_ref1 ${p.rRefKohm}k
Qref1 c_ref1 c_ref1 0 Q_IC
Vm_basic vload c_out1 0
Qo1 c_out1 c_ref1 0 Q_IC
* 2. Cascode Current Mirror
Rref2 vcc c_top ${p.rRefKohm}k
Qref_top c_top c_top c_bot Q_IC
Qref_bot c_bot c_bot 0 Q_IC
Vm_cas vload c_cas_out 0
Qcas_top c_cas_out c_top c_cas_mid Q_IC
Qcas_bot c_cas_mid c_bot 0 Q_IC
* 3. Widlar Micro-Current Source
Vm_widlar vload c_wid 0
Qwid c_wid c_ref1 e_wid Q_IC
Re_wid e_wid 0 ${p.reMicroOhm}k
.dc Vload 0 12 0.1
.end`,
        computeMetrics: (p, sim) => {
          const iRef = (12 - 0.7) / p.rRefKohm;
          const basicMid = sim?.series[0]?.values[60] ?? 0;
          const casMid = sim?.series[1]?.values[60] ?? 0;
          const widMid = sim?.series[2]?.values[60] ?? 0;
          return [
            { label: '理论基准电流 IREF', value: `${iRef.toFixed(2)} mA` },
            { label: '基本镜像 / Cascode (6V)', value: `${basicMid.toFixed(2)} / ${casMid.toFixed(2)} mA`, highlight: true },
            { label: '微电流源输出 IO3', value: `${(widMid * 1000).toFixed(1)} μA` },
          ];
        },
      },
      {
        id: 'ch7-diff-amp',
        chapterId: 'ch7',
        code: '7.2',
        title: '长尾/恒流源差分放大电路（抑制温漂与共模抑制比 CMRR）',
        subtitle: '同时注入差模有用信号与大共模干扰，对比电阻长尾与恒流源尾对共模干扰的强力抑制',
        badge: '核心掌握',
        syllabusSection: '7.(3) 差分放大电路：对称抵消零漂、差模/共模信号与 CMRR',
        objectives: [
          '深刻理解对称差分电路利用两边静态漂移同步变化实现双端输出零点漂移抵消的原理',
          '掌握差模信号（大小相等、极性相反）与共模信号（大小相等、极性相同）的半电路分解法',
          '理解发射极恒流源等效电阻趋于无穷大，使单端输出共模增益 Ac → 0、CMRR 大幅提升的机理',
        ],
        principleSummary:
          '差分输入级是集成运放的“龙头”。差模激励时发射极公共点如同交流虚地，获得高差模增益 Ad；共模激励（及温度漂移）时两管电流同增同减，流经高阻尾电流源产生极强共模负反馈，彻底压制共模波动！',
        keyFormulaLatex:
          'A_d = -\\frac{\\beta R_c}{r_{be}}, \\quad A_{c(\\text{单端})} \\approx -\\frac{R_c}{2 R_{EE}}, \\quad K_{CMR} = 20\\lg\\left|\\frac{A_d}{A_c}\\right|',
        experimentTips: [
          '先选【普通电阻长尾 Re】并将共模干扰设为 1.0V，观察单端集电极输出 v(c2) 混有明显低频起伏！',
          '切换为【镜像恒流源尾电流】，观察单端输出中的共模波动瞬间消失，双端差分输出 v(diff_out) 更是一尘不染！',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran', 'ac'],
        params: [
          {
            key: 'tailType',
            label: '发射极偏置尾结构',
            unit: '',
            min: 0,
            max: 1,
            step: 1,
            defaultValue: 1,
            options: [
              { label: '镜像恒流源偏置 (极高 CMRR)', value: 1 },
              { label: '普通长尾电阻 Re=5kΩ', value: 0 },
            ],
          },
          { key: 'vdMv', label: '差模输入信号幅值 (2kHz)', unit: 'mV', min: 5, max: 40, step: 5, defaultValue: 15 },
          { key: 'vcV', label: '共模干扰幅值 (200Hz)', unit: 'V', min: 0, max: 2.0, step: 0.2, defaultValue: 1.0 },
        ],
        traces: [
          { expr: 'v(in1)', label: '输入端1 (差模+大共模干扰) v(in1)', color: '#38bdf8', unit: 'V', dashed: true },
          { expr: 'v(c2)', label: '单端集电极输出 v(c2)', color: '#fbbf24', unit: 'V' },
          { expr: 'v(diff_out)', label: '双端差分输出 v(c1)-v(c2)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p, mode) => {
          const tailNet =
            p.tailType === 1
              ? `Rref vcc c_mir 11.3k
Qmir1 c_mir c_mir vee Q_NPN
Qmir2 ee c_mir vee Q_NPN`
              : `Ree ee vee 5k`;
          const analysis =
            mode === 'ac' ? '.ac dec 30 10 50Meg' : '.tran 25u 10m';
          return `Ch7 Differential Amplifier CMRR Demo
${SPICE_MODELS.BJTS}
VCC vcc 0 12
VEE vee 0 -12
Vcm cm 0 SIN(0 ${p.vcV} 200)
Vd1 in1 cm SIN(0 ${p.vdMv * 1e-3} 2k) AC 0.5
Vd2 in2 cm SIN(0 -${p.vdMv * 1e-3} 2k) AC -0.5
Rc1 vcc c1 6k
Rc2 vcc c2 6k
Q1 c1 in1 ee Q_NPN
Q2 c2 in2 ee Q_NPN
${tailNet}
Ediff diff_out 0 c2 c1 1
Rdum diff_out 0 1Meg
${analysis}
.end`;
        },
        computeMetrics: (p, sim) => {
          const c2 = calcWaveStats(sim?.series[1]?.values ?? []);
          const diff = calcWaveStats(sim?.series[2]?.values ?? []);
          const adMeas = p.vdMv > 0 ? diff.vpp / (2 * p.vdMv * 1e-3) : 0;
          return [
            { label: '偏置电路方式', value: p.tailType === 1 ? '有源镜像恒流源' : '电阻长尾 Re = 5 kΩ' },
            { label: '双端差模增益 |Ad|', value: `${adMeas.toFixed(1)} 倍`, highlight: true },
            { label: '单端输出峰峰值', value: formatEng(c2.vpp, 'V', 2) },
            { label: '双端差分输出峰峰值', value: formatEng(diff.vpp, 'V', 2), hint: '对称抵消偶次谐波与共模温漂' },
          ];
        },
      },
      {
        id: 'ch7-ocl-output',
        chapterId: 'ch7',
        code: '7.3',
        title: 'OCL 互补对称功率输出级：乙类交越失真成因与甲乙类偏置消除',
        subtitle: '直观对比无静态偏置乙类互补输出过零死区“台阶”交越失真，与引入二极管偏置后的平滑甲乙类输出',
        badge: '核心掌握',
        syllabusSection: '7.(4) 互补输出级电路：NPN与PNP对称连接、交越失真及甲乙类消除',
        objectives: [
          '掌握无输出电容（OCL）双电源互补对称电路正半周 NPN 导通、负半周 PNP 导通的交替放大原理',
          '掌握交越失真产生的物理原因（|vi| < 0.7V 死区内两管均截止）及采用双二极管/VBE倍增电路建立甲乙类微导通偏置的消除方法',
        ],
        principleSummary:
          '纯乙类互补电路静态功耗为零，但输入过零附近 ±0.65V 范围内 NPN 与 PNP 均未开启，造成严重刺耳的奇次谐波【交越失真】。在两管基极间串入两只正向导通二极管（或 VBE 倍增管）预先垫高约 1.3V 偏压，使两管处于甲乙类微导通状态，即可彻底消除交越失真！',
        keyFormulaLatex:
          'V_{BB} = V_{B1} - V_{B2} \\approx 2 V_D \\approx 1.35\\text{ V} \\implies \\text{甲乙类微导通消除死区}',
        experimentTips: [
          '在默认【纯乙类（无偏置）】下清晰观察过零点处水平停滞的【交越失真台阶】，并点开【FFT 频谱】查看高企的 THD 谐波！',
          '一键切换为【甲乙类（双二极管偏置）】，观察输出正弦波瞬间恢复丝滑无失真，或切至【X-Y 传输曲线】观察过零死区折线的消失！',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran', 'xy', 'fft'],
        xyAxes: { xExpr: 'v(in)', yExpr: 'v(out)', xLabel: '输入 v(in)', yLabel: '互补输出 v(out)' },
        params: [
          {
            key: 'biasClass',
            label: '输出级偏置工作状态',
            unit: '',
            min: 0,
            max: 1,
            step: 1,
            defaultValue: 0,
            options: [
              { label: '乙类无偏置 (明显交越失真)', value: 0 },
              { label: '甲乙类双二极管偏置 (消除交越失真)', value: 1 },
            ],
          },
          { key: 'vinAmp', label: '输入正弦信号峰值', unit: 'V', min: 1.0, max: 6.0, step: 0.5, defaultValue: 2.5 },
          { key: 'rlOhm', label: '扬声器等效负载 RL', unit: 'Ω', min: 8, max: 200, step: 8, defaultValue: 32 },
        ],
        traces: [
          { expr: 'v(in)', label: '激励信号 v(in)', color: '#38bdf8', unit: 'V', dashed: true },
          { expr: 'v(out)', label: 'OCL 推挽输出 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p) => {
          if (p.biasClass === 0) {
            return `Ch7 Class-B OCL Output Stage with Crossover Distortion
${SPICE_MODELS.BJTS}
VCC vcc 0 12
VEE vee 0 -12
Vin in 0 SIN(0 ${p.vinAmp} 1k)
Qnpn vcc in out Q_NPN
Qpnp vee in out Q_PNP
RL out 0 ${p.rlOhm}
.tran 15u 3m
.end`;
          }
          return `Ch7 Class-AB OCL Output Stage Eliminating Crossover Distortion
${SPICE_MODELS.DIODES}
${SPICE_MODELS.BJTS}
VCC vcc 0 12
VEE vee 0 -12
Vin in 0 SIN(0 ${p.vinAmp} 1k)
Rbias_up vcc b_up 2.2k
D1 b_up b_mid D_SI
D2 b_mid b_dn D_SI
Rbias_dn b_dn vee 2.2k
Cin in b_mid 47u
Qnpn vcc b_up e_up Q_NPN
Qpnp vee b_dn e_dn Q_PNP
Re1 e_up out 0.5
Re2 out e_dn 0.5
RL out 0 ${p.rlOhm}
.tran 15u 3m
.end`;
        },
        computeMetrics: (p, sim) => {
          const vo = calcWaveStats(sim?.series[1]?.values ?? []);
          const pLoadMw = ((vo.vRms * vo.vRms) / p.rlOhm) * 1000;
          return [
            { label: '当前功放类别', value: p.biasClass === 0 ? '乙类 (Class B 含死区)' : '甲乙类 (Class AB 无死区)', highlight: true },
            { label: '输出峰峰值 Vo(pp)', value: formatEng(vo.vpp, 'V', 2) },
            { label: '负载平均输出功率 Po', value: `${pLoadMw.toFixed(1)} mW` },
          ];
        },
      },
      {
        id: 'ch7-opamp-protection',
        chapterId: 'ch7',
        code: '7.4',
        title: '集成运放安全保护电路（输入差模钳位保护 + 输出过流限流保护）',
        subtitle: '模拟输出端意外短路/过载时，采样电阻 Rsc 与限流三极管自动分流基极驱动、限制最大短路电流防烧毁',
        badge: '理解掌握',
        syllabusSection: '7.(5)(6) 集成运放保护电路与关键性能参数',
        objectives: [
          '掌握反向并联二极管限制输入差模过压防发射结反向击穿的原理',
          '掌握输出级串联采样小电阻 Rsc + 限流管 Qlim 在负载过流时自动钳制最大输出电流 Isc ≈ 0.7V/Rsc 的保护机制',
        ],
        principleSummary:
          '当输出端意外接上极小负载（甚至接近短路）时，若无保护，输出管功耗剧增瞬间烧毁。串联取样电阻 Rsc 在电流达到 VBE(on)/Rsc 时令保护管 Qlim 导通，抽走主推动电流，将输出电流安全封顶！',
        keyFormulaLatex:
          'I_{O,\\max} \\approx \\frac{V_{BE(\\text{lim})}}{R_{sc}} \\approx \\frac{0.68\\text{ V}}{R_{sc}}',
        experimentTips: [
          '将负载电阻 RL 调小至 20 Ω（模拟严重过载）：对比【开启过流保护】与【无保护反面案例】，观察电流峰值被安全限制在约 28 mA 而未飙升至数百毫安！',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran'],
        params: [
          {
            key: 'enableProt',
            label: '过流保护电路开关',
            unit: '',
            min: 0,
            max: 1,
            step: 1,
            defaultValue: 1,
            options: [
              { label: '启用 Rsc+Qlim 限流保护', value: 1 },
              { label: '拆除保护 (过流危险反面案例)', value: 0 },
            ],
          },
          { key: 'rscOhm', label: '限流采样电阻 Rsc', unit: 'Ω', min: 15, max: 50, step: 5, defaultValue: 25 },
          { key: 'rlOhm', label: '外部负载电阻 RL (越小越接近短路)', unit: 'Ω', min: 20, max: 500, step: 20, defaultValue: 40 },
        ],
        traces: [
          { expr: 'v(out)', label: '负载端电压 v(out)', color: '#34d399', unit: 'V' },
          { expr: 'i(vimeas)', label: '输出瞬态电流 iO (mA)', color: '#f87171', unit: 'mA', scale: 1000, axis: 'right' },
        ],
        buildNetlist: (p) => {
          const protElements =
            p.enableProt === 1
              ? `Qlim_n b_up e_up out_int Q_NPN
Qlim_p b_dn e_dn out_int Q_PNP`
              : `* Overcurrent transistors removed`;
          return `Ch7 OpAmp Input & Output Overcurrent Protection Circuit
${SPICE_MODELS.DIODES}
${SPICE_MODELS.BJTS}
VCC vcc 0 12
VEE vee 0 -12
Vin vs_s 0 SIN(0 4.0 1k)
R_in vs_s in 1k
* Input Differential Anti-parallel Diode Protection
Din1 in 0 D_SI
Din2 0 in D_SI
* High drive push-pull stage with current-sense Rsc
Ibias_up vcc b_up 3m
D1 b_up b_mid D_SI
D2 b_mid b_dn D_SI
Ibias_dn b_dn vee 3m
Edrive b_mid 0 in 0 1
Qmain_n vcc b_up e_up Q_NPN
Qmain_p vee b_dn e_dn Q_PNP
Rsc_n e_up out_int ${p.rscOhm}
Rsc_p out_int e_dn ${p.rscOhm}
${protElements}
Vimeas out_int out 0
RL out 0 ${p.rlOhm}
.tran 15u 3m
.end`;
        },
        computeMetrics: (p, sim) => {
          const io = calcWaveStats(sim?.series[1]?.values ?? []);
          const iMaxTheo = (0.68 / p.rscOhm) * 1000;
          return [
            { label: '设计保护限流阈值', value: `±${iMaxTheo.toFixed(1)} mA` },
            { label: '实测最大输出电流', value: `${io.vMax.toFixed(1)} mA`, highlight: true },
            { label: '安全评估', value: io.vMax > 65 ? '过流告警！管芯功耗超标' : '处于安全保护包络内', highlight: io.vMax > 65 },
          ];
        },
      },
    ],
  },
  {
    id: 'ch8',
    shortTitle: '第8章 反馈放大器',
    fullTitle: '第8章 负反馈放大电路四组态、性能改善与稳定性补偿',
    hoursInfo: '大纲第8章 · 四种负反馈组态 / 性能四大改善 / 深度估算 / 自激与补偿',
    ideologyTitle: '“吾日三省吾身”——修身与工程系统中的负反馈机制',
    ideologyContent:
      '曾子“吾日三省吾身”，本质上是将行为结果（输出）引回与初心准则（输入）对比，及时纠偏抑制失真，实现品格与系统的长期稳定——这与负反馈放大器牺牲部分表观开环增益以换取高稳定度、低失真、宽频带的工程哲学高度相通。',
    cases: [
      {
        id: 'ch8-feedback-four',
        chapterId: 'ch8',
        code: '8.1',
        title: '交流负反馈的四种基本组态判别与闭环特性对比',
        subtitle: '一键切换电压串联、电压并联、电流串联、电流并联四种组态，验证输出稳定对象（稳压 vs 稳流）',
        badge: '核心掌握',
        syllabusSection: '8.(1)(2) 反馈分类、判别方法与负反馈放大电路的四种组态',
        objectives: [
          '熟练运用“输出短路法”判别电压/电流反馈，运用“输入同点/异点比较”判别串联/并联反馈',
          '掌握电压负反馈稳定输出电压（降低 Ro）、电流负反馈稳定输出电流（提高 Ro）的本质区别',
        ],
        principleSummary:
          '改变负载电阻 RL 时：电压负反馈取样输出电压，使负载电压 Vo 保持稳定（趋近理想恒压源）；电流负反馈取样负载电流 iL，即使 RL 成倍变化，负载电流 iL 依然保持恒定（趋近理想受控恒流源）！',
        keyFormulaLatex:
          '\\text{电压串联: } V_o \\approx \\left(1+\\frac{R_f}{R_1}\\right)V_i \\qquad \\text{电流串联(V-I转换): } I_L \\approx \\frac{V_i}{R_{\\text{sense}}}',
        experimentTips: [
          '绝佳对比实验：先选【电压串联负反馈】并大幅改变负载 RL（500Ω ~ 5kΩ），观察绿色输出电压 v(out) 纹丝不动！',
          '再切换至【电流串联负反馈（V-I恒流源）】并改变负载 RL，观察黄色负载电流 iL 始终恒定不变，而端电压随 RL 成正比变化！',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran'],
        params: [
          {
            key: 'fbType',
            label: '负反馈组态选择',
            unit: '',
            min: 0,
            max: 3,
            step: 1,
            defaultValue: 0,
            options: [
              { label: '电压串联负反馈 (VCVS 稳压)', value: 0 },
              { label: '电压并联负反馈 (CCVS 互阻)', value: 1 },
              { label: '电流串联负反馈 (VCCS 稳流)', value: 2 },
              { label: '电流并联负反馈 (CCCS 电流放大)', value: 3 },
            ],
          },
          { key: 'rlOhm', label: '负载电阻 RL (拖动测试稳压/稳流)', unit: 'Ω', min: 300, max: 3000, step: 300, defaultValue: 1000 },
        ],
        traces: [
          { expr: 'v(in)', label: '输入激励 v(in)', color: '#38bdf8', unit: 'V', dashed: true },
          { expr: 'v(load_p)', label: '负载端电压 v(RL)', color: '#34d399', unit: 'V' },
          { expr: 'i(vlmeas)', label: '负载电流 iL (mA)', color: '#fbbf24', unit: 'mA', scale: 1000, axis: 'right' },
        ],
        buildNetlist: (p) => {
          if (p.fbType === 0) {
            return `Ch8 Series-Shunt Voltage-Series Feedback
${SPICE_MODELS.OPAMP_SUBCKT}
VCC vcc 0 15
VEE vee 0 -15
Vin in 0 SIN(0 1.0 1k)
Xop in vn vcc vee out OPAMP_STD
R1 vn 0 10k
Rf out vn 20k
Vlmeas out load_p 0
RL load_p 0 ${p.rlOhm}
.tran 15u 3m
.end`;
          }
          if (p.fbType === 1) {
            return `Ch8 Shunt-Shunt Voltage-Parallel Feedback
${SPICE_MODELS.OPAMP_SUBCKT}
VCC vcc 0 15
VEE vee 0 -15
Vin in 0 SIN(0 1.0 1k)
Rs in vn 10k
Rf vn out 30k
Xop 0 vn vcc vee out OPAMP_STD
Vlmeas out load_p 0
RL load_p 0 ${p.rlOhm}
.tran 15u 3m
.end`;
          }
          if (p.fbType === 2) {
            // 电流串联负反馈：负载浮地串入反馈回路，取样电阻 Rsense=250Ω 决定恒流 IL = Vin / Rsense
            return `Ch8 Series-Series Current-Series Feedback
${SPICE_MODELS.OPAMP_SUBCKT}
VCC vcc 0 15
VEE vee 0 -15
Vin in 0 SIN(0 0.75 1k)
Xop in fb_n vcc vee out OPAMP_STD
Vlmeas out load_p 0
RL load_p fb_n ${p.rlOhm}
Rsense fb_n 0 250
.tran 15u 3m
.end`;
          }
          // 电流并联负反馈
          return `Ch8 Shunt-Series Current-Parallel Feedback
${SPICE_MODELS.OPAMP_SUBCKT}
VCC vcc 0 15
VEE vee 0 -15
Vin in 0 SIN(0 1.0 1k)
Rin in vn 10k
Xop 0 vn vcc vee out OPAMP_STD
Vlmeas out load_p 0
RL load_p fb_node ${p.rlOhm}
Rsense fb_node 0 200
Rf vn fb_node 1.8k
.tran 15u 3m
.end`;
        },
        computeMetrics: (p, sim) => {
          const vl = calcWaveStats(sim?.series[1]?.values ?? []);
          const il = calcWaveStats(sim?.series[2]?.values ?? []);
          const names = ['电压串联 (高Ri, 低Ro)', '电压并联 (低Ri, 低Ro)', '电流串联 (高Ri, 高Ro)', '电流并联 (低Ri, 高Ro)'];
          return [
            { label: '阻抗改造规律', value: names[p.fbType] ?? '' },
            { label: '稳定输出对象', value: p.fbType <= 1 ? '稳定负载电压 Vo' : '稳定负载电流 iL', highlight: true },
            { label: '实测负载电压 Vpp', value: formatEng(vl.vpp, 'V', 2) },
            { label: '实测负载电流 Ipp', value: `${il.vpp.toFixed(2)} mA` },
          ];
        },
      },
      {
        id: 'ch8-feedback-improve',
        chapterId: 'ch8',
        code: '8.2',
        title: '负反馈对放大电路性能的改善（减小非线性失真 & 展宽通频带 1+AF 倍）',
        subtitle: '同屏对比相同输出幅度下无反馈开环放大器的严重失真/窄带宽，与引入负反馈后的高保真宽频响应',
        badge: '核心掌握',
        syllabusSection: '8.(3)(4) 负反馈一般表达式 Af = A/(1+AF) 及对性能的四大改善',
        objectives: [
          '理解反馈深度 (1 + AF) 在提高增益稳定性、减小非线性失真、抑制环内噪声、展宽频带中的核心定量因子作用',
          '验证增益带宽积恒定规律：闭环增益下降为 1/(1+AF)，上限截止频率展宽为 (1+AF)·fH',
        ],
        principleSummary:
          '非线性器件产生的谐波失真经过负反馈网络反相送回输入端产生预失真补偿，使闭环失真度下降为开环的 1/(1+AF)；同时在频域上将上限截止频率拓展 (1+AF) 倍！',
        keyFormulaLatex:
          'A_f = \\frac{A}{1 + A F}, \\quad \\mathrm{THD}_f \\approx \\frac{\\mathrm{THD}}{1+AF}, \\quad f_{Hf} = (1 + AF) f_H',
        experimentTips: [
          '在【时域示波器 (.tran)】与【FFT 频谱】下对比：开环支路出现明显上下不对称非线性失真，而引入负反馈支路输出纯净对称正弦波！',
          '点击上方【波特图 (.ac)】按钮：直观见证闭环曲线比开环曲线平坦且上限频率 fH 向高频大幅延伸！',
        ],
        defaultViewMode: 'ac',
        availableViewModes: ['ac', 'tran', 'fft'],
        params: [
          { key: 'fbFactorPct', label: '反馈系数 F (百分比)', unit: '%', min: 1, max: 20, step: 2, defaultValue: 9 },
          { key: 'openGain', label: '基本放大器开环增益 A', unit: '倍', min: 40, max: 200, step: 20, defaultValue: 100 },
        ],
        traces: [
          { expr: 'v(out_open)', label: '无反馈开环输出 v(out_open)', color: '#f87171', unit: 'V', dashed: true },
          { expr: 'v(out_closed)', label: '引入负反馈闭环输出 v(out_closed)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p, mode) => {
          const F = p.fbFactorPct / 100;
          const depth = 1 + p.openGain * F;
          const analysis =
            mode === 'ac' ? '.ac dec 35 10 50Meg' : '.tran 15u 3m';
          // 赋予输入补偿使时域对比时两者输出峰峰值同量级，凸显非线性平方项失真差异
          return `Ch8 Open-Loop vs Closed-Loop Nonlinear Distortion & Bandwidth
Vin_open in1 0 SIN(0 0.03 1k) AC 1
Bnl1 n1 0 V = ${p.openGain} * (V(in1) + 5.5 * V(in1) * V(in1))
Rp1 n1 out_open 1k
Cp1 out_open 0 15.9n

Vin_cl in2 0 SIN(0 ${(0.03 * depth).toFixed(4)} 1k) AC 1
Berr err 0 V = V(in2) - ${F} * V(out_closed)
Bnl2 n2 0 V = ${p.openGain} * (V(err) + 5.5 * V(err) * V(err))
Rp2 n2 out_closed 1k
Cp2 out_closed 0 15.9n
${analysis}
.end`;
        },
        computeMetrics: (p, sim) => {
          const F = p.fbFactorPct / 100;
          const depth = 1 + p.openGain * F;
          const af = p.openGain / depth;
          const bmOpen = calcBodeMetrics(sim, 0);
          const bmClosed = calcBodeMetrics(sim, 1);
          return [
            { label: '反馈深度 (1 + AF)', value: `${depth.toFixed(2)}`, highlight: true },
            { label: '理论闭环增益 Af', value: `${af.toFixed(2)} 倍 (${(20 * Math.log10(af)).toFixed(1)} dB)` },
            {
              label: '开环 fH → 闭环 fHf',
              value:
                bmOpen.fHighHz && bmClosed.fHighHz
                  ? `${formatEng(bmOpen.fHighHz, 'Hz', 1)} → ${formatEng(bmClosed.fHighHz, 'Hz', 1)}`
                  : `展宽 ${depth.toFixed(1)} 倍`,
              highlight: true,
            },
          ];
        },
      },
      {
        id: 'ch8-deep-feedback',
        chapterId: 'ch8',
        code: '8.3',
        title: '深度负反馈条件下的近似估算（1 + AF ≫ 1 时 Af ≈ 1/F）',
        subtitle: '剧烈改变基本放大器开环增益 A（如器件老化或更换三极管），验证闭环增益几乎恒等于 1/F',
        badge: '核心掌握',
        syllabusSection: '8.(5)(6) 在深度负反馈条件下的近似计算与负反馈放大器设计',
        objectives: [
          '掌握深度负反馈条件 |1 + AF| ≫ 1 下净输入量 Xi\' ≈ 0（广义虚短与虚断）的工程估算精髓',
          '验证当开环增益波动数倍时，闭环相对变化量仅为 dAf/Af = (1/(1+AF))·(dA/A)',
        ],
        principleSummary:
          '分立或集成器件的开环增益 A 受温度、批次与电源波动极大（可达 ±50%），但只要满足深度负反馈 AF ≫ 1，闭环增益 Af = A/(1+AF) ≈ 1/F 完全由高精度无源电阻网络决定！',
        keyFormulaLatex:
          '\\text{当 } |1 + AF| \\gg 1 \\text{ 时: } A_f \\approx \\frac{1}{F}, \\qquad \\frac{\\Delta A_f}{A_f} = \\frac{1}{1+AF}\\frac{\\Delta A}{A}',
        experimentTips: [
          '将【基本放大器开环增益 A】从 500 一路拖大到 50000（变化整整 100 倍！）：观察输出波形和实测闭环增益始终稳稳锁定在 1 + Rf/R1 = 10.0 倍附近！',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran'],
        params: [
          { key: 'openA', label: '基本放大器开环增益 A', unit: '倍', min: 100, max: 20000, step: 500, defaultValue: 2000 },
          { key: 'r1', label: '反馈分压电阻 R1', unit: 'kΩ', min: 2, max: 20, step: 2, defaultValue: 10 },
          { key: 'rf', label: '反馈电阻 Rf', unit: 'kΩ', min: 10, max: 150, step: 10, defaultValue: 90 },
        ],
        traces: [
          { expr: 'v(in)', label: '输入信号 v(in)', color: '#38bdf8', unit: 'V', dashed: true },
          { expr: 'v(out)', label: '闭环输出 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p) => `Ch8 Deep Negative Feedback Gain Approximation
Vin in 0 SIN(0 0.5 1k)
Eopen n_o 0 in vn ${p.openA}
Ro n_o out 50
Rf out vn ${p.rf}k
R1 vn 0 ${p.r1}k
RL out 0 10k
.tran 15u 3m
.end`,
        computeMetrics: (p, sim) => {
          const F = p.r1 / (p.r1 + p.rf);
          const depth = 1 + p.openA * F;
          const idealInvF = 1 / F;
          const vi = calcWaveStats(sim?.series[0]?.values ?? []);
          const vo = calcWaveStats(sim?.series[1]?.values ?? []);
          const measAf = vi.vpp > 1e-6 ? vo.vpp / vi.vpp : 0;
          const relErrPct = (Math.abs(measAf - idealInvF) / idealInvF) * 100;
          return [
            { label: '反馈深度 1 + AF', value: `${depth.toFixed(1)}` },
            { label: '深度近似值 1/F', value: `${idealInvF.toFixed(3)} 倍` },
            { label: 'Ngspice 实测闭环 Af', value: `${measAf.toFixed(3)} 倍`, highlight: true },
            { label: '近似相对误差', value: `${relErrPct.toFixed(3)} %`, highlight: true },
          ];
        },
      },
      {
        id: 'ch8-stability-comp',
        chapterId: 'ch8',
        code: '8.4',
        title: '负反馈放大器的稳定性分析：三级极点自激振铃与主极点电容相位补偿',
        subtitle: '观察高反馈深度下三级极点附加相移达 -180° 引发阶跃自激振荡，加入米勒/主极点补偿电容 Ccomp 后恢复平稳',
        badge: '理解掌握',
        syllabusSection: '8.(7) 负反馈放大电路的稳定性：自激振荡条件及相位补偿方法',
        objectives: [
          '理解三级及以上放大器在高频段附加相移可达 -180°，使负反馈在高频逆变为正反馈引发自激振荡的物理原因',
          '掌握巴克豪森自激判据 AF = -1、幅值裕度 Gm 与相位裕度 PM ≥ 45° 的工程稳定标准，以及主极点滞后电容补偿法',
        ],
        principleSummary:
          '三节 RC 高频极点最多产生 -270° 滞后相移。当环路增益在相移达到 -180° 的频率 f180 处仍大于 0dB（如反馈系数过大时），阶跃激励会激发剧烈振铃乃至持续等幅自激！接入主极点补偿电容 Ccomp 压低高频增益，即可恢复充足相位裕度。',
        keyFormulaLatex:
          '\\text{自激条件: } |\\dot{A}(jf_{180})\\dot{F}| \\ge 1, \\; \\varphi_A + \\varphi_F = -180^\\circ \\quad \\text{稳定判据: } \\mathrm{PM} \\ge 45^\\circ',
        experimentTips: [
          '将【主极点补偿电容 Ccomp】调小至 1 nF（欠补偿）：在时域阶跃响应下清晰观察剧烈的高频【振铃/自激振荡】！',
          '将【补偿电容 Ccomp】增大至 40 nF 以上：过冲与振铃彻底平息，阶跃响应平滑稳定！同时可切换【波特图 (.ac)】观察谐振尖峰的消失。',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran', 'ac'],
        params: [
          { key: 'cCompNf', label: '主极点补偿电容 Ccomp', unit: 'nF', min: 1, max: 80, step: 5, defaultValue: 2 },
          { key: 'fbRatio', label: '反馈网络分压比 F', unit: '%', min: 5, max: 50, step: 5, defaultValue: 25 },
        ],
        traces: [
          { expr: 'v(in)', label: '输入方波阶跃 v(in)', color: '#38bdf8', unit: 'V', dashed: true },
          { expr: 'v(out)', label: '三级负反馈闭环响应 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p, mode) => {
          const F = p.fbRatio / 100;
          const analysis =
            mode === 'ac'
              ? '.ac dec 40 10 10Meg'
              : '.tran 2u 1.2m';
          return `Ch8 Three-Pole Feedback Stability & Dominant-Pole Compensation
Vin in 0 PULSE(0 0.2 50u 2u 2u 600u 1.5m) AC 1
Bsum err 0 V = V(in) - ${F} * V(out)
* Pole 1 (Dominant pole adjustable via Ccomp)
E1 p1_s 0 err 0 4
R1 p1_s p1 1k
C1 p1 0 ${p.cCompNf}n
* Pole 2
E2 p2_s 0 p1 0 4
R2 p2_s p2 1k
C2 p2 0 4n
* Pole 3
E3 p3_s 0 p2 0 3
R3 p3_s n_lim 1k
C3 n_lim 0 4n
Bsat out 0 V = 10 * tanh(V(n_lim) / 10)
${analysis}
.end`;
        },
        computeMetrics: (p, sim) => {
          const vo = calcWaveStats(sim?.series[1]?.values ?? []);
          const steadyEst = (0.2 * 48) / (1 + 48 * (p.fbRatio / 100));
          const overshootPct =
            steadyEst > 1e-4
              ? Math.max(0, ((vo.vMax - steadyEst) / steadyEst) * 100)
              : 0;
          return [
            { label: '环路直流增益 A0·F', value: `${(48 * (p.fbRatio / 100)).toFixed(1)}` },
            { label: '阶跃过冲百分比', value: `${overshootPct.toFixed(1)} %`, highlight: overshootPct > 25 },
            {
              label: '系统稳定裕度评估',
              value: overshootPct > 35 ? '欠补偿（强烈振铃/临界自激）' : '相位补偿充足（稳定收敛）',
              highlight: true,
            },
          ];
        },
      },
    ],
  },
  {
    id: 'ch9',
    shortTitle: '第9章 滤波与波形产生电路',
    fullTitle: '第9章 信号处理（有源滤波/电压比较器）与信号产生（振荡）电路',
    hoursInfo: '大纲第9章 · 二阶有源滤波 / 文氏电桥正弦振荡 / 迟滞比较器 / 方波三角波',
    ideologyTitle: '电子系统的“心脏”——高稳定晶振与原子钟自主攻关',
    ideologyContent:
      '振荡器是通信基站、卫星导航与数字系统的时钟“心脏”。结合我国在北斗星载铷/氢原子钟及 5G 高稳晶振领域打破国外封锁的奋斗故事，激励学子在关键基础元器件上做出大文章。',
    cases: [
      {
        id: 'ch9-active-filter',
        chapterId: 'ch9',
        code: '9.1',
        title: '二阶有源滤波电路（Sallen-Key 低通 / 高通 / 带通 / 双T带阻陷波）',
        subtitle: '一键切换四类经典二阶有源滤波器，实时查看 -40dB/dec 波特图与混频干扰滤除时域波形',
        badge: '核心掌握',
        syllabusSection: '9.(1)(2)(3) 滤波器分类、一阶与二阶有源低通/高通/带通/带阻滤波电路',
        objectives: [
          '掌握有源滤波器相比无源 LC 滤波器无需电感、带负载能力强、可提供通带增益的优势',
          '掌握二阶 Sallen-Key 低通/高通（±40dB/dec）、有源带通与双 T 有源带阻（50Hz工频陷波）的幅频响应规律',
        ],
        principleSummary:
          '二阶有源滤波器利用 RC 网络引入双极点配合运放正/负反馈控制品质因数 Q：低通保留基波滤除高频噪声，高通滤除低频漂移，带通选出单一谐振频率，带阻则精准陷波剔除特定干扰频率！',
        keyFormulaLatex:
          'f_0 = \\frac{1}{2\\pi R C}, \\quad H_{\\text{LP}}(s) = \\frac{A_{vf} \\omega_0^2}{s^2 + \\frac{\\omega_0}{Q}s + \\omega_0^2}, \\quad Q = \\frac{1}{3 - A_{vf}}',
        experimentTips: [
          '依次切换【低通】【高通】【带通】【带阻陷波】四种滤波器，观察波特图曲线形状的标志性特征！',
          '切换至【时域示波器 (.tran)】：输入端同时混合了 300Hz 低频与 8kHz 高频两路正弦波，直接观察不同滤波器如何干净地保留一路、滤除另一路！',
        ],
        defaultViewMode: 'ac',
        availableViewModes: ['ac', 'tran'],
        params: [
          {
            key: 'filterType',
            label: '二阶有源滤波器类型',
            unit: '',
            min: 0,
            max: 3,
            step: 1,
            defaultValue: 0,
            options: [
              { label: '二阶有源低通 (LPF)', value: 0 },
              { label: '二阶有源高通 (HPF)', value: 1 },
              { label: '二阶有源带通 (BPF)', value: 2 },
              { label: '双T有源带阻陷波 (Notch)', value: 3 },
            ],
          },
          { key: 'rKohm', label: '选频电阻 R (决定特征频率 f0)', unit: 'kΩ', min: 2, max: 30, step: 2, defaultValue: 10 },
          { key: 'cNf', label: '选频电容 C', unit: 'nF', min: 5, max: 50, step: 5, defaultValue: 15.9 },
          { key: 'avf', label: '通带增益 Avf (决定品质因数Q)', unit: '倍', min: 1.0, max: 2.6, step: 0.2, defaultValue: 1.58 },
        ],
        traces: [
          { expr: 'v(in)', label: '混频输入信号 v(in)', color: '#38bdf8', unit: 'V', dashed: true },
          { expr: 'v(out)', label: '有源滤波输出 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p, mode) => {
          const rf = Math.max((p.avf - 1) * 10, 0.01);
          const f0 = 1 / (2 * Math.PI * p.rKohm * 1e3 * p.cNf * 1e-9);
          const analysis =
            mode === 'ac' ? '.ac dec 45 10 200k' : '.tran 15u 8m';
          // 时域输入：300Hz + f0 + 12kHz 混合信号
          const srcBlock = `Vlow n_l 0 SIN(0 0.8 300) AC 1
Vmid n_m n_l SIN(0 0.8 ${Math.round(f0)})
Vhigh in n_m SIN(0 0.8 12k)`;

          if (p.filterType === 0) {
            return `Ch9 Second-Order Sallen-Key Low-Pass Active Filter
${SPICE_MODELS.OPAMP_FAST_SUBCKT}
VCC vcc 0 15
VEE vee 0 -15
${srcBlock}
R1 in n1 ${p.rKohm}k
R2 n1 vp ${p.rKohm}k
C1 n1 out ${p.cNf}n
C2 vp 0 ${p.cNf}n
Xop vp vn vcc vee out OPAMP_FAST
Rg vn 0 10k
Rf out vn ${rf}k
${analysis}
.end`;
          }
          if (p.filterType === 1) {
            return `Ch9 Second-Order Sallen-Key High-Pass Active Filter
${SPICE_MODELS.OPAMP_FAST_SUBCKT}
VCC vcc 0 15
VEE vee 0 -15
${srcBlock}
C1 in n1 ${p.cNf}n
C2 n1 vp ${p.cNf}n
R1 n1 out ${p.rKohm}k
R2 vp 0 ${p.rKohm}k
Xop vp vn vcc vee out OPAMP_FAST
Rg vn 0 10k
Rf out vn ${rf}k
${analysis}
.end`;
          }
          if (p.filterType === 2) {
            return `Ch9 Second-Order Active Band-Pass Filter
${SPICE_MODELS.OPAMP_FAST_SUBCKT}
VCC vcc 0 15
VEE vee 0 -15
${srcBlock}
R1 in n1 ${p.rKohm}k
C1 n1 vp ${p.cNf}n
R2 vp 0 ${p.rKohm * 2}k
R3 n1 0 ${p.rKohm}k
C2 n1 out ${p.cNf}n
Xop vp vn vcc vee out OPAMP_FAST
Rg vn 0 10k
Rf out vn ${rf}k
${analysis}
.end`;
          }
          // Twin-T Active Notch Filter
          return `Ch9 Twin-T Active Band-Stop Notch Filter
${SPICE_MODELS.OPAMP_FAST_SUBCKT}
VCC vcc 0 15
VEE vee 0 -15
${srcBlock}
Rt1 in nt1 ${p.rKohm}k
Rt2 nt1 vp ${p.rKohm}k
Ct_shunt nt1 fb_b ${2 * p.cNf}n
Ct1 in nt2 ${p.cNf}n
Ct2 nt2 vp ${p.cNf}n
Rt_shunt nt2 fb_b ${p.rKohm / 2}k
Rbleed vp 0 50Meg
Xop1 vp out vcc vee out OPAMP_FAST
Rfb1 out fb_in 10k
Rfb2 fb_in 0 3.3k
Xop2 fb_in fb_b vcc vee fb_b OPAMP_FAST
${analysis}
.end`;
        },
        computeMetrics: (p, sim) => {
          const f0 = 1 / (2 * Math.PI * p.rKohm * 1e3 * p.cNf * 1e-9);
          const q = 1 / Math.max(3 - p.avf, 0.15);
          const bm = calcBodeMetrics(sim, 1);
          return [
            { label: '理论特征频率 f0', value: formatEng(f0, 'Hz', 2), highlight: true },
            { label: '设计品质因数 Q', value: q.toFixed(2), hint: p.avf >= 2.9 ? '接近自激临界 Avf=3' : '巴特沃斯最平坦 Q=0.707 (Avf=1.586)' },
            { label: '最大通带增益', value: `${bm.peakGainDb.toFixed(1)} dB` },
          ];
        },
      },
      {
        id: 'ch9-wien-osc',
        chapterId: 'ch9',
        code: '9.2',
        title: 'AI项目实践：RC 文氏电桥（Wien-Bridge）正弦波振荡电路起振与稳幅',
        subtitle: '完整呈现微弱扰动经正反馈选频网络指数增幅起振（Av > 3），再由非线性二极管自动稳幅为纯净正弦波的全过程',
        badge: 'AI项目实践',
        syllabusSection: '9.(4) 正弦波信号产生电路 + AI项目实践：波形发生电路设计（基于RC选频网络）',
        objectives: [
          '熟记正弦波振荡三大条件：相位平衡条件（φA + φF = 2nπ）、幅值平衡条件（|AF| = 1）与起振条件（|AF| > 1）',
          '掌握 RC 串并联（文氏桥）选频网络在 f0 = 1/(2πRC) 处相移为 0° 且反馈系数 Fmax = 1/3 的特性，故同相放大器起振条件为 Av > 3',
        ],
        principleSummary:
          '无外加信号源！闭合电源瞬间微弱噪声中包含丰富频率分量，唯有 f0 = 1/(2πRC) 分量经 RC 串并联正反馈网络零相移返回同相端。初始小信号时稳幅二极管未导通，增益 Av > 3 使振幅指数增长；振幅达数伏后二极管导通并入负反馈电阻，使平均增益自动回落至 3.00 实现低失真稳幅！',
        keyFormulaLatex:
          'f_0 = \\frac{1}{2\\pi R C}, \\quad \\dot{F}(jf_0) = \\frac{1}{3}\\angle 0^\\circ, \\quad \\text{起振条件: } A_{vf} = 1 + \\frac{R_f}{R_1} > 3',
        experimentTips: [
          '必做实验：将【负反馈电阻 Rf】调低至 18 kΩ（此时 Av = 1 + 18/10 = 2.8 < 3）：观察电路无法起振，扰动迅速衰减为 0！',
          '将 Rf 调至 22~26 kΩ（Av > 3）：清晰观看正弦波从零开始从小到大包络起振并最终平滑稳幅的壮观过程！',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran', 'fft'],
        params: [
          { key: 'rfKohm', label: '反馈电阻 Rf (R1=10k, 需>20k起振)', unit: 'kΩ', min: 16, max: 32, step: 1, defaultValue: 23 },
          { key: 'rOscKohm', label: 'RC 选频网络电阻 R', unit: 'kΩ', min: 2, max: 15, step: 1, defaultValue: 5 },
          { key: 'cOscNf', label: 'RC 选频网络电容 C', unit: 'nF', min: 10, max: 50, step: 5, defaultValue: 31.8 },
        ],
        traces: [
          { expr: 'v(vp)', label: '同相选频端 v(vp) [= 1/3 Vo]', color: '#38bdf8', unit: 'V', dashed: true },
          { expr: 'v(out)', label: '自激正弦振荡输出 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p) => {
          // Rf 拆分为线性段 Rf_lin 与二极管并联稳幅段 Rf_nl
          const rfLin = p.rfKohm * 0.72;
          const rfNl = p.rfKohm * 0.28;
          return `Ch9 AI Project Wien-Bridge RC Sine Wave Oscillator
${SPICE_MODELS.DIODES}
${SPICE_MODELS.OPAMP_FAST_SUBCKT}
VCC vcc 0 15
VEE vee 0 -15
* RC Series-Parallel Positive Feedback Frequency-Selective Network
Rs_w out w_mid ${p.rOscKohm}k
Cs_w w_mid vp ${p.cOscNf}n
Rp_w vp 0 ${p.rOscKohm}k
Cp_w vp 0 ${p.cOscNf}n
* Negative Feedback Network with Nonlinear Diode Amplitude Stabilization
R1 vn 0 10k
Rf_a vn n_lim ${rfLin.toFixed(2)}k
Rf_b n_lim out ${rfNl.toFixed(2)}k
R_shunt n_lim d_mid 3.5k
D_s1 d_mid out D_SI
D_s2 out d_mid D_SI
Xop vp vn vcc vee out OPAMP_FAST
* Tiny 5us power-on thermal noise kick to initiate oscillation
Istart 0 vp PULSE(0 40u 2u 1u 1u 5u 1)
.tran 25u 18m
.end`;
        },
        computeMetrics: (p, sim) => {
          const f0Theo = 1 / (2 * Math.PI * p.rOscKohm * 1e3 * p.cOscNf * 1e-9);
          const initAv = 1 + p.rfKohm / 10;
          const vo = calcWaveStats(sim?.series[1]?.values ?? []);
          return [
            { label: '理论振荡频率 f0', value: formatEng(f0Theo, 'Hz', 1), highlight: true },
            { label: '初始起振增益 Av0', value: `${initAv.toFixed(2)} 倍`, hint: initAv > 3.01 ? '满足 |AF|>1 起振' : 'Av<3 无法起振!' },
            { label: '稳态振荡峰峰值 Vo(pp)', value: formatEng(vo.vpp, 'V', 2), highlight: true },
          ];
        },
      },
      {
        id: 'ch9-comparator',
        chapterId: 'ch9',
        code: '9.3',
        title: '电压比较器：单门限比较器误翻转 vs 正反馈迟滞（施密特）比较器抗噪',
        subtitle: '在叠加高频毛刺干扰的正弦信号下，直观对比单门限比较器的抖动误触发与迟滞回差比较器的干净整形',
        badge: '核心掌握',
        syllabusSection: '9.(5) 运放非线性应用：单门限比较器与迟滞（双门限）电压比较器',
        objectives: [
          '区分运放非线性工作状态（开环或正反馈，输出仅 +UZ / -UZ 二值）与线性负反馈状态',
          '掌握迟滞比较器上下门限电压 VUT、VLT 及回差电压 ΔVT 的计算，理解正反馈加速跳变并抑制阈值附近干扰抖动的逻辑',
        ],
        principleSummary:
          '当输入信号在阈值附近缓慢过零且混有噪声毛刺时，单门限比较器会发生多次上下误翻转抖动；引入正反馈构成迟滞（施密特）比较器后，一旦向上越过上阈值 +VUT 翻转，必须回落至下阈值 -VLT 才会再次翻转，只要回差宽度 ΔVT 大于噪声峰峰值即可彻底免疫干扰！',
        keyFormulaLatex:
          'V_{UT} = +\\frac{R_1}{R_1+R_2}U_Z, \\quad V_{LT} = -\\frac{R_1}{R_1+R_2}U_Z, \\quad \\Delta V_T = V_{UT} - V_{LT} = \\frac{2 R_1}{R_1+R_2}U_Z',
        experimentTips: [
          '同屏震撼对比：红色虚线为【单门限过零比较器】（在过零点因噪声发生剧烈毛刺多次抖动），绿色实线为【正反馈迟滞比较器】（方波边沿干净利落无一处误翻转）！',
          '点击上方【X-Y 传输曲线】按钮：直接在屏幕上观察经典的矩形【迟滞回环传输特性曲线】！',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran', 'xy'],
        xyAxes: { xExpr: 'v(in)', yExpr: 'v(out)', xLabel: '输入电压 v(in)', yLabel: '迟滞比较器输出 v(out)' },
        params: [
          { key: 'r1Kohm', label: '正反馈分压电阻 R1', unit: 'kΩ', min: 1, max: 15, step: 1, defaultValue: 4 },
          { key: 'r2Kohm', label: '正反馈电阻 R2', unit: 'kΩ', min: 10, max: 50, step: 5, defaultValue: 20 },
          { key: 'noiseAmp', label: '叠加高频干扰噪声幅值', unit: 'V', min: 0, max: 1.5, step: 0.1, defaultValue: 0.6 },
        ],
        traces: [
          { expr: 'v(in)', label: '含噪输入信号 v(in)', color: '#38bdf8', unit: 'V' },
          { expr: 'v(out_zero)', label: '单门限比较输出 (过零抖动误翻转)', color: '#f87171', unit: 'V', dashed: true },
          { expr: 'v(out)', label: '正反馈迟滞比较输出 (抗噪整形)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p) => `Ch9 Single-Threshold vs Schmitt Hysteresis Comparator Noise Immunity
${SPICE_MODELS.ZENERS}
${SPICE_MODELS.OPAMP_FAST_SUBCKT}
VCC vcc 0 12
VEE vee 0 -12
Vsig s_clean 0 SIN(0 4.0 500)
Vnoise in s_clean SIN(0 ${p.noiseAmp} 14k)
* 1. Simple Zero-Crossing Comparator (inverting)
Xop_z 0 in vcc vee raw_z OPAMP_FAST
Rz_lim raw_z out_zero 500
Dz1 z_m1 out_zero DZ_5V1
Dz2 z_m1 0 DZ_5V1
* 2. Inverting Schmitt Trigger Comparator with Positive Feedback
R1 vp 0 ${p.r1Kohm}k
R2 out vp ${p.r2Kohm}k
Xop_h vp in vcc vee raw_h OPAMP_FAST
Rh_lim raw_h out 500
Dh1 z_m2 out DZ_5V1
Dh2 z_m2 0 DZ_5V1
.tran 8u 4m
.end`,
        computeMetrics: (p) => {
          const uz = 5.8; // 5.1V Zener + 0.7V forward diode
          const vut = (p.r1Kohm / (p.r1Kohm + p.r2Kohm)) * uz;
          const hyst = 2 * vut;
          return [
            { label: '双向稳压限幅电平 ±UZ', value: `±${uz.toFixed(1)} V` },
            { label: '上门限/下门限 ±VUT', value: `±${vut.toFixed(2)} V`, highlight: true },
            { label: '回差宽度 ΔVT', value: `${hyst.toFixed(2)} V`, hint: hyst > 2 * p.noiseAmp ? '大于噪声峰峰值，完全抗噪' : '回差小于噪声峰峰值，可能穿透!' },
          ];
        },
      },
      {
        id: 'ch9-square-triangle',
        chapterId: 'ch9',
        code: '9.4',
        title: '非正弦波发生电路：方波-三角波函数发生器联调',
        subtitle: '迟滞比较器与反相积分器闭环级联，同步观测 RC 充放电、方波跳变与线性三角波产生及频率参数映射',
        badge: '核心掌握',
        syllabusSection: '9.(5) 非正弦波信号产生电路：方波产生电路与方波-三角波转换',
        objectives: [
          '掌握“同相迟滞比较器 + 反相积分器”闭环自激产生高精度方波与对称三角波的电路构成',
          '熟练分析 RC 积分时间常数与电阻比值对振荡频率 f 及三角波幅值 Vtri 的定量控制规律',
        ],
        principleSummary:
          '第一级同相迟滞比较器输出稳压方波 ±UZ，直接驱动第二级反相积分器产生线性下降/上升的三角波；三角波输出回馈至迟滞比较器输入端，一旦触及上下阈值即触发比较器翻转，周而复始无需任何外部信号源！',
        keyFormulaLatex:
          'V_{\\text{tri},m} = \\frac{R_1}{R_2} U_Z, \\qquad f = \\frac{R_2}{4 R_1 R C}',
        experimentTips: [
          '观察绿色【方波输出】与黄色【三角波输出】的精确时序对应：方波处于正半周 +UZ 时，反相积分器恒流反向充电产生线性下降斜坡；触及下阈值瞬间方波立刻跳变为 -UZ！',
          '调节积分电阻 Rint 或积分电容 Cint，实时验证频率与 1/(R·C) 成正比！',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran', 'fft'],
        params: [
          { key: 'rIntKohm', label: '积分电阻 R', unit: 'kΩ', min: 5, max: 30, step: 2.5, defaultValue: 10 },
          { key: 'cIntNf', label: '积分电容 C', unit: 'nF', min: 10, max: 50, step: 5, defaultValue: 20 },
          { key: 'r2Kohm', label: '迟滞比例电阻 R2 (R1=10k)', unit: 'kΩ', min: 12, max: 30, step: 2, defaultValue: 20 },
        ],
        traces: [
          { expr: 'v(sq)', label: '比较器方波输出 v(sq)', color: '#34d399', unit: 'V' },
          { expr: 'v(tri)', label: '积分器三角波输出 v(tri)', color: '#fbbf24', unit: 'V' },
        ],
        buildNetlist: (p) => `Ch9 Square-Triangle Function Generator
${SPICE_MODELS.ZENERS}
${SPICE_MODELS.OPAMP_FAST_SUBCKT}
VCC vcc 0 12
VEE vee 0 -12
* Non-inverting Schmitt Trigger (R1 between tri and vp, R2 between sq and vp)
R1 tri vp 10k
R2 sq vp ${p.r2Kohm}k
Xcomp vp 0 vcc vee cmp_raw OPAMP_FAST
Rlim cmp_raw sq 500
Dz1 zm sq DZ_5V1
Dz2 zm 0 DZ_5V1
* Inverting Integrator (sq -> tri)
Rint sq vn_int ${p.rIntKohm}k
Cint vn_int tri ${p.cIntNf}n
Xint 0 vn_int vcc vee tri OPAMP_FAST
* Startup perturbation pulse
Iinit 0 vp PULSE(0 100u 1u 1u 1u 10u 1)
.tran 15u 5m
.end`,
        computeMetrics: (p, sim) => {
          const uz = 5.8;
          const vTriPeakTheo = (10 / p.r2Kohm) * uz;
          const fTheo = p.r2Kohm / (4 * 10 * p.rIntKohm * 1e3 * p.cIntNf * 1e-9);
          const sq = calcWaveStats(sim?.series[0]?.values ?? []);
          const tri = calcWaveStats(sim?.series[1]?.values ?? []);
          return [
            { label: '理论振荡频率 f', value: formatEng(fTheo, 'Hz', 1), highlight: true },
            { label: '方波实测峰峰值', value: formatEng(sq.vpp, 'V', 2) },
            { label: '三角波实测峰峰值', value: formatEng(tri.vpp, 'V', 2), hint: `理论 ±${vTriPeakTheo.toFixed(2)}V` },
          ];
        },
      },
    ],
  },
  {
    id: 'ch10',
    shortTitle: '第10章 直流稳压电源',
    fullTitle: '第10章 小功率直流稳压电源：整流、滤波与线性/三端集成稳压',
    hoursInfo: '大纲第10章 · 单相桥式整流滤波 / 串联反馈稳压 / 三端集成稳压器',
    cases: [
      {
        id: 'ch10-bridge-filter',
        chapterId: 'ch10',
        code: '10.1',
        title: '单相桥式整流与电容滤波电路（放电常数 RC 与二极管导通角/冲击电流）',
        subtitle: '调节滤波电容 C 与负载 RL，验证 VO ≈ 1.2V2 经验公式，并观测电容越大二极管导通角越小、尖峰充电电流越大的工程现象',
        badge: '核心掌握',
        syllabusSection: '10.(1) 小功率单相桥式整流、电容滤波电路组成、工作原理及参数计算',
        objectives: [
          '掌握桥式整流电容滤波在满足 R_L·C ≥ (3~5)·T/2 条件下的输出直流平均电压估算 VO ≈ 1.2 V2',
          '理解滤波电容越大纹波越小，但二极管导通时间越短、浪涌峰值电流越大的器件选型约束',
        ],
        principleSummary:
          '接入并联滤波电容后，交流电压高于电容电压时二极管导通对电容快充；交流电压回落时二极管反偏截止，电容向负载 RL 缓慢指数放电维持输出电压平滑！',
        keyFormulaLatex:
          'R_L C \\ge (3 \\sim 5)\\frac{T}{2} \\implies V_{O(\\text{avg})} \\approx 1.2 V_2 \\;(\\text{空载峰值 } \\sqrt{2}V_2)',
        experimentTips: [
          '增大【滤波电容 C】从 10 μF 到 470 μF：观察绿色输出电压纹波显著变平，同时注意黄色通道【二极管瞬态充电电流尖峰】变得更窄更高！',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran'],
        params: [
          { key: 'v2Rms', label: '变压器次级有效值 V2', unit: 'Vrms', min: 6, max: 18, step: 2, defaultValue: 12 },
          { key: 'cFilterUf', label: '滤波电解电容 C', unit: 'μF', min: 10, max: 470, step: 30, defaultValue: 100 },
          { key: 'rl', label: '负载电阻 RL', unit: 'kΩ', min: 0.2, max: 2.0, step: 0.2, defaultValue: 0.5 },
        ],
        traces: [
          { expr: 'v(ac_diff)', label: '次级交流电压 v2(t)', color: '#38bdf8', unit: 'V', dashed: true },
          { expr: 'v(out)', label: '电容滤波直流输出 v(out)', color: '#34d399', unit: 'V' },
          { expr: 'i(vd1_m)', label: '二极管 D1 冲击充电电流 (mA)', color: '#fbbf24', unit: 'mA', scale: 1000, axis: 'right' },
        ],
        buildNetlist: (p) => {
          const vm = p.v2Rms * Math.SQRT2;
          return `Ch10 Bridge Rectifier with Capacitor Filter
${SPICE_MODELS.DIODES}
Vac ac_p ac_n SIN(0 ${vm.toFixed(3)} 50)
Eprobe ac_diff 0 ac_p ac_n 1
Rdum ac_diff 0 1Meg
Rs_xfmr ac_p b1 1.2
Vd1_m b1 d1_a 0
D1 d1_a out D_SI
D2 ac_n out D_SI
D3 0 b1 D_SI
D4 0 ac_n D_SI
Rbleed ac_n 0 10Meg
Cfilt out 0 ${p.cFilterUf}u
RL out 0 ${p.rl}k
.tran 200u 60m
.end`;
        },
        computeMetrics: (p, sim) => {
          const vo = calcWaveStats(sim?.series[1]?.values ?? []);
          const id1 = calcWaveStats(sim?.series[2]?.values ?? []);
          const rcMs = p.rl * p.cFilterUf; // kΩ * μF = ms
          return [
            { label: '放电时间常数 RL·C', value: `${rcMs.toFixed(1)} ms`, hint: rcMs >= 30 ? '满足 ≥ 3*(T/2)=30ms' : '小于30ms，纹波较大' },
            { label: '经验估算 1.2·V2', value: `${(1.2 * p.v2Rms).toFixed(2)} V` },
            { label: '实测直流平均值 VO', value: formatEng(vo.vAvg, 'V', 2), highlight: true },
            { label: '纹波峰峰值 / D1峰值电流', value: `${formatEng(vo.vpp, 'V', 2)} / ${id1.vMax.toFixed(0)} mA` },
          ];
        },
      },
      {
        id: 'ch10-series-reg',
        chapterId: 'ch10',
        code: '10.2',
        title: '串联反馈式线性稳压电路（基准 + 比较放大 + 调整管 + 取样网络）',
        subtitle: '调节取样电位器连续改变稳压输出值 VO = (1 + R1/R2)·VZ，验证其对未稳压输入大纹波的抑制过程',
        badge: '核心掌握',
        syllabusSection: '10.(2) 串联反馈式稳压电路组成、稳压物理过程及输出电压调节范围计算',
        objectives: [
          '熟记串联型稳压电源四大组成部分：调整管 T、基准电压源 UZ、取样电阻网络（R1、R2）、比较放大器 A',
          '掌握稳压负反馈链：VI↑(或IL↓) → VO↑ → Vn↑ → Vb↓ → VCE↑ → VO↓，以及输出电压公式 VO = (1 + R1/R2)·UZ',
        ],
        principleSummary:
          '串联型稳压电路本质上是一个带功率射极跟随调整管的电压串联负反馈放大器，以稳压管提供的高稳定 UZ 为同相端基准输入，调整管集射电压 VCE 自动吸收一切电网波动与负载压降变化！',
        keyFormulaLatex:
          'V_O = \\left(1 + \\frac{R_1}{R_2}\\right) V_Z, \\qquad V_{CE} = V_I - V_O > V_{CE(\\text{sat})}',
        experimentTips: [
          '调节【上取样电阻 R1】，观察绿色稳压输出线按公式 (1 + R1/R2)*5.1V 精准升降，且输入端 3Vpp 的大幅电网纹波被彻底抚平！',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran'],
        params: [
          { key: 'vinMean', label: '整流后未稳压输入 VI', unit: 'V', min: 10, max: 22, step: 1, defaultValue: 16 },
          { key: 'r1Kohm', label: '上取样电阻 R1', unit: 'kΩ', min: 2, max: 18, step: 1, defaultValue: 7.5 },
          { key: 'r2Kohm', label: '下取样电阻 R2', unit: 'kΩ', min: 5, max: 15, step: 1, defaultValue: 10 },
          { key: 'rlOhm', label: '终端负载电阻 RL', unit: 'Ω', min: 100, max: 1000, step: 100, defaultValue: 200 },
        ],
        traces: [
          { expr: 'v(in)', label: '未稳压波动输入 v(in)', color: '#38bdf8', unit: 'V', dashed: true },
          { expr: 'v(vz)', label: '基准稳压管电压 v(VZ)', color: '#fbbf24', unit: 'V', dashed: true },
          { expr: 'v(out)', label: '串联反馈稳压输出 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p) => `Ch10 Series-Pass Feedback Linear Voltage Regulator
${SPICE_MODELS.ZENERS}
${SPICE_MODELS.BJTS}
${SPICE_MODELS.OPAMP_SUBCKT}
Vin in 0 SIN(${p.vinMean} 1.6 100)
* Zener Reference UZ ≈ 5.1V
Rz in vz 1.5k
Dz 0 vz DZ_5V1
* Error Amplifier + Darlington Series Pass Transistor
Xerr vz fb in 0 b_pass OPAMP_STD
Qpass1 in b_pass b_drv Q_NPN
Qpass2 in b_drv out Q_NPN
* Voltage Divider Sampling Network
R1 out fb ${p.r1Kohm}k
R2 fb 0 ${p.r2Kohm}k
Cout out 0 22u
RL out 0 ${p.rlOhm}
.tran 200u 30m
.end`,
        computeMetrics: (p, sim) => {
          const vi = calcWaveStats(sim?.series[0]?.values ?? []);
          const vz = calcWaveStats(sim?.series[1]?.values ?? []);
          const vo = calcWaveStats(sim?.series[2]?.values ?? []);
          const theoVo = (1 + p.r1Kohm / p.r2Kohm) * vz.vAvg;
          const psrrDb =
            vo.vpp > 1e-6 ? 20 * Math.log10(vi.vpp / vo.vpp) : 80;
          return [
            { label: '理论输出 (1+R1/R2)·VZ', value: `${theoVo.toFixed(2)} V` },
            { label: '实测稳压输出 VO', value: `${vo.vAvg.toFixed(2)} V`, highlight: true },
            { label: '输出残余纹波 Vpp', value: formatEng(vo.vpp, 'V', 2), hint: `纹波抑制比 ≈ ${psrrDb.toFixed(0)} dB` },
          ];
        },
      },
      {
        id: 'ch10-3term-reg',
        chapterId: 'ch10',
        code: '10.3',
        title: '三端集成稳压器典型应用（7805 固定输出 & LM317 可调输出电源全链路）',
        subtitle: '从交流市电降压、桥式整流、大电容滤波到三端集成稳压器输出 1.25V ~ 15V 可调精密直流电源完整系统仿真',
        badge: '核心掌握',
        syllabusSection: '10.(3) 三端集成稳压器的种类（78XX/79XX/LM317）及典型应用电路实例',
        objectives: [
          '掌握固定式三端稳压器（W7805/7812）与可调式三端稳压器（LM317 基准 Vref = 1.25V）的外围接线及退耦电容作用',
          '熟记 LM317 输出电压设计公式 VO = 1.25·(1 + R2/R1) 及最小压差 Dropout（VI - VO ≥ 2.5V）要求',
        ],
        principleSummary:
          '本案例构建了教材第10章完整的直流稳压电源终极工程框图：【交流变压器 → 桥式整流 → 电容滤波 C1 → 三端稳压器 → 防自激高频电容 C2】。LM317 在 OUT 与 ADJ 引脚之间恒定维持 1.25V 基准电压。',
        keyFormulaLatex:
          'V_O = 1.25\\text{ V} \\times \\left(1 + \\frac{R_{\\text{adj}}}{R_1}\\right) + I_{\\text{adj}} R_{\\text{adj}} \\approx 1.25\\left(1 + \\frac{R_{\\text{adj}}}{240\\,\\Omega}\\right)',
        experimentTips: [
          '完整观测直流稳压电源三级波形变换：蓝色虚线为整流滤波后的脉动粗直流 v(rect)，绿色实线为经三端稳压器稳压后的精密水平直流线 v(out)！',
          '拖动【调压电阻 Radj】从 0 Ω 到 2400 Ω，可将输出电源从 1.25V 无级调至 13.75V（注意若超出输入波谷电压会出现低压差跌落纹波！）。',
        ],
        defaultViewMode: 'tran',
        availableViewModes: ['tran'],
        params: [
          { key: 'rAdjOhm', label: 'LM317 调压电位器 Radj (R1=240Ω)', unit: 'Ω', min: 0, max: 2400, step: 120, defaultValue: 720 },
          { key: 'v2Rms', label: '变压器次级交流有效值 V2', unit: 'Vrms', min: 9, max: 18, step: 1, defaultValue: 14 },
          { key: 'c1Uf', label: '前端主滤波电容 C1', unit: 'μF', min: 100, max: 1000, step: 100, defaultValue: 470 },
        ],
        traces: [
          { expr: 'v(rect)', label: '整流滤波后粗直流 v(rect)', color: '#38bdf8', unit: 'V', dashed: true },
          { expr: 'v(out)', label: '三端稳压精密直流输出 v(out)', color: '#34d399', unit: 'V' },
        ],
        buildNetlist: (p) => {
          const vm = p.v2Rms * Math.SQRT2;
          const rAdjSafe = Math.max(p.rAdjOhm, 1);
          return `Ch10 Complete AC-to-DC Power Supply with LM317 3-Terminal Regulator
${SPICE_MODELS.DIODES}
${SPICE_MODELS.BJTS}
${SPICE_MODELS.OPAMP_SUBCKT}
* 1. AC Secondary + Bridge Rectifier + Filter Cap C1
Vac ac_p ac_n SIN(0 ${vm.toFixed(2)} 50)
Rs_sec ac_p b1 1.0
D1 b1 rect D_SI
D2 ac_n rect D_SI
D3 0 b1 D_SI
D4 0 ac_n D_SI
Rbleed ac_n 0 10Meg
C1 rect 0 ${p.c1Uf}u
* 2. Behavioral Macro-model of LM317 (Vref = 1.25V between OUT and ADJ, dropout ~ 2V)
B_targ targ 0 V = min(V(rect) - 1.8, V(adj) + 1.25)
Xreg targ out rect 0 b_pass OPAMP_STD
Qpass rect b_pass out Q_NPN
* 3. External Programming Resistors R1=240, Radj & Output Bypass C2
R1 out adj 240
Radj adj 0 ${rAdjSafe}
C2 out 0 10u
RL out 0 250
.tran 250u 60m
.end`;
        },
        computeMetrics: (p, sim) => {
          const vRect = calcWaveStats(sim?.series[0]?.values ?? []);
          const vOut = calcWaveStats(sim?.series[1]?.values ?? []);
          const theoVo = 1.25 * (1 + p.rAdjOhm / 240);
          const dropoutOk = vRect.vMin - theoVo >= 1.85;
          return [
            { label: '理论设定输出 VO', value: `${theoVo.toFixed(2)} V`, hint: p.rAdjOhm === 720 ? '恰对应 5.00V (同7805)' : '1.25*(1+Radj/240)' },
            { label: '实测稳压输出 VO', value: `${vOut.vAvg.toFixed(2)} V`, highlight: true },
            { label: '前端最低波谷电压', value: `${vRect.vMin.toFixed(2)} V`, hint: dropoutOk ? '满足最小压差要求' : '压差不足，波谷处失稳!' },
            { label: '输出残余纹波 Vpp', value: formatEng(vOut.vpp, 'V', 2) },
          ];
        },
      },
    ],
  },
];
