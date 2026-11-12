/**
 * 教学标准 SPICE 器件与宏模型库（兼容 Ngspice WebAssembly）
 * 包含硅二极管、肖特基管、稳压二极管、NPN/PNP BJT、NMOS/PMOS、JFET 及教学通用运放宏模型
 */
export const SPICE_MODELS = {
  // 1N4148 硅开关二极管 + 1N5819 肖特基二极管 + 锗检波管
  DIODES: `
.model D_SI D(IS=2.52n RS=0.568 N=1.752 CJO=4p M=0.4 TT=20n BV=100 IBV=100u)
.model D_SCHOTTKY D(IS=31.7u RS=0.051 N=1.08 CJO=110p BV=40 IBV=1m)
.model D_GE D(IS=18u RS=1.5 N=1.35 CJO=2p BV=30 IBV=500u)
.model D_LED D(IS=1e-18 RS=3.5 N=2.1 CJO=15p)
.model D_VARACTOR D(IS=1f RS=1.0 CJO=85p VJ=0.75 M=0.48)
`.trim(),

  // 5.1V / 6.2V 齐纳稳压管
  ZENERS: `
.model DZ_5V1 D(IS=1.5n RS=1.2 N=1.5 BV=5.1 IBV=5m CJO=35p)
.model DZ_6V2 D(IS=1.2n RS=0.9 N=1.4 BV=6.2 IBV=5m CJO=30p)
`.trim(),

  // 2N2222 / 2N3904 NPN 三极管与 2N3906 PNP 三极管
  BJTS: `
.model Q_NPN NPN(IS=1e-14 BF=150 VAF=100 IKF=0.3 ISE=1e-15 NE=1.5 BR=4 RC=1 RE=0.2 RB=10 CJE=8p CJC=3.5p TF=0.35n)
.model Q_PNP PNP(IS=1e-14 BF=150 VAF=100 IKF=0.3 ISE=1e-15 NE=1.5 BR=4 RC=1 RE=0.2 RB=10 CJE=8p CJC=3.5p TF=0.4n)
`.trim(),

  // 教学增强型 NMOS / PMOS 与功率 NMOS
  MOSFETS: `
.model M_NMOS NMOS(LEVEL=1 VTO=1.5 KP=4m LAMBDA=0.02 CBD=3p CBS=3p CGSO=2n CGDO=2n)
.model M_PMOS PMOS(LEVEL=1 VTO=-1.5 KP=4m LAMBDA=0.02 CBD=3p CBS=3p CGSO=2n CGDO=2n)
.model M_POWER NMOS(LEVEL=1 VTO=2.0 KP=0.45 LAMBDA=0.005 RD=0.08 CGSO=5n CGDO=2n)
`.trim(),

  // 2N5457 N沟道结型场效应管 (JFET)
  JFETS: `
.model J_NJF NJF(VTO=-2.5 BETA=1.2m LAMBDA=0.01 RD=10 RS=10 CGS=4p CGD=1.5p)
`.trim(),

  // 通用双电源运算放大器宏模型 (含输入电阻2Meg, 开环增益100dB, 单极点GBW≈1MHz, 软限幅正负电源轨饱和)
  // 引脚顺序: 1:同相端(+) 2:反相端(-) 3:正电源(VCC) 4:负电源(VEE) 5:输出端(OUT)
  OPAMP_SUBCKT: `
.subckt OPAMP_STD inp inn vcc vee out
Rin inp inn 2Meg
Egain n_int 0 VALUE = { 1e5 * V(inp, inn) }
Rp1 n_int n_pole 10k
Cp1 n_pole 0 15.915n
Bclamp n_lim 0 V = (0.5*(V(vcc)+V(vee)) + 0.5*(V(vcc)-V(vee)-1.2)*tanh(V(n_pole)/(0.5*(V(vcc)-V(vee)-1.2)+0.01)))
Rout n_lim out 35
.ends OPAMP_STD
`.trim(),

  // 高速宽带运放宏模型（用于高频有源滤波、快速比较器与方波发生器，GBW≈20MHz）
  OPAMP_FAST_SUBCKT: `
.subckt OPAMP_FAST inp inn vcc vee out
Rin inp inn 10Meg
Egain n_int 0 VALUE = { 2e5 * V(inp, inn) }
Rp1 n_int n_pole 1k
Cp1 n_pole 0 1.59n
Bclamp n_lim 0 V = (0.5*(V(vcc)+V(vee)) + 0.5*(V(vcc)-V(vee)-1.0)*tanh(V(n_pole)/(0.5*(V(vcc)-V(vee)-1.0)+0.01)))
Rout n_lim out 15
.ends OPAMP_FAST
`.trim(),
};
