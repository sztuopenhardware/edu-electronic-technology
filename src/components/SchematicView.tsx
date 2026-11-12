import React from 'react';
import type { SchematicId } from '../types';

interface SchematicViewProps {
  id: SchematicId;
  params: Record<string, number>;
}

// ============ 基础电子符号 SVG 图元 ============
const Gnd: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g stroke="#94a3b8" strokeWidth="1.8" fill="none">
    <line x1={x} y1={y} x2={x} y2={y + 8} />
    <line x1={x - 10} y1={y + 8} x2={x + 10} y2={y + 8} />
    <line x1={x - 6} y1={y + 12} x2={x + 6} y2={y + 12} />
    <line x1={x - 2.5} y1={y + 16} x2={x + 2.5} y2={y + 16} />
  </g>
);

const VccBar: React.FC<{ x: number; y: number; label?: string }> = ({
  x,
  y,
  label = '+VCC',
}) => (
  <g>
    <line x1={x} y1={y} x2={x} y2={y - 10} stroke="#f87171" strokeWidth="1.8" />
    <line
      x1={x - 10}
      y1={y - 10}
      x2={x + 10}
      y2={y - 10}
      stroke="#f87171"
      strokeWidth="2.4"
    />
    <text
      x={x}
      y={y - 15}
      textAnchor="middle"
      fill="#fca5a5"
      fontSize="11"
      fontWeight="600"
    >
      {label}
    </text>
  </g>
);

const ResH: React.FC<{ x: number; y: number; label: string; val?: string }> = ({
  x,
  y,
  label,
  val,
}) => (
  <g>
    <rect
      x={x - 18}
      y={y - 6}
      width="36"
      height="12"
      rx="1.5"
      fill="#0f172a"
      stroke="#e2e8f0"
      strokeWidth="1.8"
    />
    <text x={x} y={y - 10} textAnchor="middle" fill="#cbd5e1" fontSize="11">
      {label}
    </text>
    {val && (
      <text x={x} y={y + 18} textAnchor="middle" fill="#38bdf8" fontSize="10.5">
        {val}
      </text>
    )}
  </g>
);

const ResV: React.FC<{ x: number; y: number; label: string; val?: string }> = ({
  x,
  y,
  label,
  val,
}) => (
  <g>
    <rect
      x={x - 6}
      y={y - 18}
      width="12"
      height="36"
      rx="1.5"
      fill="#0f172a"
      stroke="#e2e8f0"
      strokeWidth="1.8"
    />
    <text x={x + 11} y={y - 2} textAnchor="start" fill="#cbd5e1" fontSize="11">
      {label}
    </text>
    {val && (
      <text x={x + 11} y={y + 11} textAnchor="start" fill="#38bdf8" fontSize="10.5">
        {val}
      </text>
    )}
  </g>
);

const CapH: React.FC<{ x: number; y: number; label: string; val?: string }> = ({
  x,
  y,
  label,
  val,
}) => (
  <g>
    <line
      x1={x - 4}
      y1={y - 11}
      x2={x - 4}
      y2={y + 11}
      stroke="#fbbf24"
      strokeWidth="2.2"
    />
    <line
      x1={x + 4}
      y1={y - 11}
      x2={x + 4}
      y2={y + 11}
      stroke="#fbbf24"
      strokeWidth="2.2"
    />
    <text x={x} y={y - 15} textAnchor="middle" fill="#fde68a" fontSize="11">
      {label}
    </text>
    {val && (
      <text x={x} y={y + 23} textAnchor="middle" fill="#fbbf24" fontSize="10">
        {val}
      </text>
    )}
  </g>
);

const CapV: React.FC<{ x: number; y: number; label: string; val?: string }> = ({
  x,
  y,
  label,
  val,
}) => (
  <g>
    <line
      x1={x - 11}
      y1={y - 4}
      x2={x + 11}
      y2={y - 4}
      stroke="#fbbf24"
      strokeWidth="2.2"
    />
    <line
      x1={x - 11}
      y1={y + 4}
      x2={x + 11}
      y2={y + 4}
      stroke="#fbbf24"
      strokeWidth="2.2"
    />
    <text x={x + 14} y={y - 2} textAnchor="start" fill="#fde68a" fontSize="11">
      {label}
    </text>
    {val && (
      <text x={x + 14} y={y + 11} textAnchor="start" fill="#fbbf24" fontSize="10">
        {val}
      </text>
    )}
  </g>
);

const OpAmpSym: React.FC<{
  x: number;
  y: number;
  flipInputs?: boolean; // default: top='-', bottom='+'
  label?: string;
}> = ({ x, y, flipInputs = false, label = 'UO' }) => (
  <g>
    <polygon
      points={`${x - 32},${y - 34} ${x - 32},${y + 34} ${x + 34},${y}`}
      fill="#111c2d"
      stroke="#38bdf8"
      strokeWidth="2"
    />
    <text
      x={x - 24}
      y={y - 11}
      fill="#94a3b8"
      fontSize="14"
      fontWeight="bold"
    >
      {flipInputs ? '+' : '−'}
    </text>
    <text
      x={x - 24}
      y={y + 19}
      fill="#94a3b8"
      fontSize="14"
      fontWeight="bold"
    >
      {flipInputs ? '−' : '+'}
    </text>
    <text x={x - 8} y={y + 4} fill="#7dd3fc" fontSize="10" fontWeight="600">
      {label}
    </text>
  </g>
);

const BjtNpn: React.FC<{ x: number; y: number; label?: string }> = ({
  x,
  y,
  label = 'VT (NPN)',
}) => (
  <g>
    <circle
      cx={x}
      cy={y}
      r="22"
      fill="#111c2d"
      stroke="#34d399"
      strokeWidth="1.8"
    />
    <line x1={x - 8} y1={y - 12} x2={x - 8} y2={y + 12} stroke="#e2e8f0" strokeWidth="2.4" />
    <line x1={x - 22} y1={y} x2={x - 8} y2={y} stroke="#e2e8f0" strokeWidth="1.8" />
    <line x1={x - 8} y1={y - 6} x2={x + 10} y2={y - 18} stroke="#e2e8f0" strokeWidth="1.8" />
    <line x1={x - 8} y1={y + 6} x2={x + 10} y2={y + 18} stroke="#e2e8f0" strokeWidth="1.8" />
    {/* 发射极箭头 */}
    <polygon points={`${x + 10},${y + 18} ${x + 2},${y + 16} ${x + 7},${y + 10}`} fill="#34d399" />
    <text x={x + 26} y={y + 4} fill="#6ee7b7" fontSize="11" fontWeight="600">
      {label}
    </text>
  </g>
);

const MosfetN: React.FC<{ x: number; y: number; label?: string }> = ({
  x,
  y,
  label = 'M1 (NMOS)',
}) => (
  <g>
    <circle
      cx={x}
      cy={y}
      r="22"
      fill="#111c2d"
      stroke="#a78bfa"
      strokeWidth="1.8"
    />
    <line x1={x - 22} y1={y + 6} x2={x - 10} y2={y + 6} stroke="#e2e8f0" strokeWidth="1.8" />
    <line x1={x - 10} y1={y - 12} x2={x - 10} y2={y + 12} stroke="#a78bfa" strokeWidth="2" />
    <line x1={x - 5} y1={y - 13} x2={x - 5} y2={y + 13} stroke="#e2e8f0" strokeWidth="2.2" />
    <line x1={x - 5} y1={y - 10} x2={x + 10} y2={y - 10} stroke="#e2e8f0" strokeWidth="1.8" />
    <line x1={x + 10} y1={y - 10} x2={x + 10} y2={y - 22} stroke="#e2e8f0" strokeWidth="1.8" />
    <line x1={x - 5} y1={y + 10} x2={x + 10} y2={y + 10} stroke="#e2e8f0" strokeWidth="1.8" />
    <line x1={x + 10} y1={y + 10} x2={x + 10} y2={y + 22} stroke="#e2e8f0" strokeWidth="1.8" />
    <text x={x + 26} y={y + 4} fill="#c4b5fd" fontSize="11" fontWeight="600">
      {label}
    </text>
  </g>
);

const DiodeH: React.FC<{
  x: number;
  y: number;
  zener?: boolean;
  label?: string;
}> = ({ x, y, zener = false, label = 'VD' }) => (
  <g>
    <polygon
      points={`${x - 9},${y - 9} ${x - 9},${y + 9} ${x + 9},${y}`}
      fill="#1e293b"
      stroke="#f472b6"
      strokeWidth="1.8"
    />
    <line x1={x + 9} y1={y - 9} x2={x + 9} y2={y + 9} stroke="#f472b6" strokeWidth="2.2" />
    {zener && (
      <>
        <line x1={x + 9} y1={y - 9} x2={x + 13} y2={y - 12} stroke="#f472b6" strokeWidth="2" />
        <line x1={x + 9} y1={y + 9} x2={x + 5} y2={y + 12} stroke="#f472b6" strokeWidth="2" />
      </>
    )}
    <text x={x} y={y - 14} textAnchor="middle" fill="#fbcfe8" fontSize="11">
      {label}
    </text>
  </g>
);

const AcSource: React.FC<{ x: number; y: number; label?: string }> = ({
  x,
  y,
  label = 'ui',
}) => (
  <g>
    <circle
      cx={x}
      cy={y}
      r="16"
      fill="#111c2d"
      stroke="#38bdf8"
      strokeWidth="1.8"
    />
    <path
      d={`M ${x - 9} ${y} Q ${x - 4.5} ${y - 8}, ${x} ${y} T ${x + 9} ${y}`}
      fill="none"
      stroke="#38bdf8"
      strokeWidth="1.8"
    />
    <text x={x - 22} y={y + 4} textAnchor="end" fill="#7dd3fc" fontSize="11">
      {label}
    </text>
  </g>
);

const ProbeTag: React.FC<{
  x: number;
  y: number;
  text: string;
  color?: string;
}> = ({ x, y, text, color = '#34d399' }) => (
  <g>
    <circle cx={x} cy={y} r="3.5" fill={color} />
    <rect
      x={x + 6}
      y={y - 10}
      width={Math.max(36, text.length * 7.2 + 10)}
      height="18"
      rx="4"
      fill="rgba(15, 23, 42, 0.92)"
      stroke={color}
      strokeWidth="1.2"
    />
    <text
      x={x + 11}
      y={y + 3}
      fill={color}
      fontSize="10.5"
      fontWeight="600"
    >
      {text}
    </text>
  </g>
);

export const SchematicView: React.FC<SchematicViewProps> = ({ id, params }) => {
  // 按具体案例 ID 绘制标准原理图拓扑并联动实时元件参数
  const renderDiagram = () => {
    // 1. 运放反相 / 实验二比例求和类拓扑
    if (
      id === 'ch2-inv-amp' ||
      id === 'ch2-add-sub' ||
      id === 'lab2-opamp-math' ||
      id === 'ch8-deep-feedback'
    ) {
      const r1 = params.r1 ?? 10;
      const rf = params.rf ?? 50;
      return (
        <>
          <line x1="65" y1="111" x2="112" y2="111" stroke="#94a3b8" strokeWidth="1.8" />
          <line x1="65" y1="111" x2="65" y2="145" stroke="#94a3b8" strokeWidth="1.8" />
          <AcSource x={65} y={161} label="Vin" />
          <line x1="65" y1="177" x2="65" y2="205" stroke="#94a3b8" strokeWidth="1.8" />
          <Gnd x={65} y={205} />

          <ResH x={130} y={111} label="R1" val={`${r1}kΩ`} />
          <line x1="148" y1="111" x2="228" y2="111" stroke="#94a3b8" strokeWidth="1.8" />
          {/* 反馈支路 Rf */}
          <line x1="190" y1="111" x2="190" y2="52" stroke="#94a3b8" strokeWidth="1.8" />
          <line x1="190" y1="52" x2="242" y2="52" stroke="#94a3b8" strokeWidth="1.8" />
          <ResH x={260} y={52} label="Rf" val={`${rf}kΩ`} />
          <line x1="278" y1="52" x2="335" y2="52" stroke="#94a3b8" strokeWidth="1.8" />
          <line x1="335" y1="52" x2="335" y2="125" stroke="#94a3b8" strokeWidth="1.8" />

          <OpAmpSym x={260} y={125} label="OPAMP" />
          {/* 同相端接地 */}
          <line x1="205" y1="139" x2="228" y2="139" stroke="#94a3b8" strokeWidth="1.8" />
          <line x1="205" y1="139" x2="205" y2="188" stroke="#94a3b8" strokeWidth="1.8" />
          <Gnd x={205} y={188} />

          {/* 输出与负载 */}
          <line x1="294" y1="125" x2="395" y2="125" stroke="#94a3b8" strokeWidth="1.8" />
          <line x1="372" y1="125" x2="372" y2="152" stroke="#94a3b8" strokeWidth="1.8" />
          <ResV x={372} y={170} label="RL" val={`${params.rl ?? 10}kΩ`} />
          <line x1="372" y1="188" x2="372" y2="205" stroke="#94a3b8" strokeWidth="1.8" />
          <Gnd x={372} y={205} />

          <ProbeTag x={65} y={111} text="v(in)" color="#38bdf8" />
          <ProbeTag x={190} y={111} text="v(vn) 虚地" color="#fbbf24" />
          <ProbeTag x={395} y={125} text="v(out)" color="#34d399" />
        </>
      );
    }

    // 2. 同相比例放大 / 运放传输 / 有源滤波 / 文氏电桥 / 比较器 / 方波三角波
    if (
      id === 'ch2-noninv-amp' ||
      id === 'ch2-opamp-transfer' ||
      id === 'ch2-int-diff' ||
      id === 'ch2-inst-ecg' ||
      id === 'ch9-active-filter' ||
      id === 'ch9-wien-osc' ||
      id === 'ch9-comparator' ||
      id === 'ch9-square-triangle' ||
      id === 'lab6-comparators'
    ) {
      const isIntDiff = id === 'ch2-int-diff';
      const isWien = id === 'ch9-wien-osc';
      const isComp = id === 'ch9-comparator' || id === 'lab6-comparators';
      return (
        <>
          <line x1="70" y1="139" x2="228" y2="139" stroke="#94a3b8" strokeWidth="1.8" />
          <line x1="70" y1="139" x2="70" y2="160" stroke="#94a3b8" strokeWidth="1.8" />
          <AcSource x={70} y={176} label={isWien ? 'RC选频' : 'Vin'} />
          <line x1="70" y1="192" x2="70" y2="210" stroke="#94a3b8" strokeWidth="1.8" />
          <Gnd x={70} y={210} />

          <OpAmpSym x={260} y={125} flipInputs={isComp} label="OPAMP" />
          {/* 反馈网络 */}
          <line x1="185" y1="111" x2="228" y2="111" stroke="#94a3b8" strokeWidth="1.8" />
          <line x1="185" y1="111" x2="185" y2="55" stroke="#94a3b8" strokeWidth="1.8" />
          <line x1="185" y1="55" x2="245" y2="55" stroke="#94a3b8" strokeWidth="1.8" />
          {isIntDiff ? (
            <CapH x={260} y={55} label="Cf" val={`${params.cNf ?? 100}nF`} />
          ) : (
            <ResH
              x={260}
              y={55}
              label={isComp ? 'R_pos (正反馈)' : 'Rf'}
              val={`${params.rf ?? params.r2 ?? 20}kΩ`}
            />
          )}
          <line x1="275" y1="55" x2="340" y2="55" stroke="#94a3b8" strokeWidth="1.8" />
          <line x1="340" y1="55" x2="340" y2="125" stroke="#94a3b8" strokeWidth="1.8" />

          {/* R1 接地支路 */}
          <line x1="185" y1="111" x2="145" y2="111" stroke="#94a3b8" strokeWidth="1.8" />
          <line x1="145" y1="111" x2="145" y2="152" stroke="#94a3b8" strokeWidth="1.8" />
          <ResV x={145} y={170} label="R1" val={`${params.r1 ?? 10}kΩ`} />
          <line x1="145" y1="188" x2="145" y2="210" stroke="#94a3b8" strokeWidth="1.8" />
          <Gnd x={145} y={210} />

          <line x1="294" y1="125" x2="400" y2="125" stroke="#94a3b8" strokeWidth="1.8" />
          <ProbeTag x={95} y={139} text="v(in)" color="#38bdf8" />
          <ProbeTag x={400} y={125} text="v(out)" color="#34d399" />
        </>
      );
    }

    // 3. 二极管、稳压管与整流滤波稳压电源类拓扑
    if (
      id === 'ch3-diode-iv' ||
      id === 'ch3-clipper-clamper' ||
      id === 'ch3-zener-reg' ||
      id === 'ch3-charger-rectifier' ||
      id === 'ch10-bridge-filter' ||
      id === 'ch10-series-reg' ||
      id === 'ch10-3term-reg'
    ) {
      const isZener = id === 'ch3-zener-reg' || id === 'ch10-series-reg';
      const hasFilterCap =
        id === 'ch10-bridge-filter' ||
        id === 'ch3-charger-rectifier' ||
        id === 'ch10-3term-reg';
      return (
        <>
          <AcSource x={75} y={135} label="Vs" />
          <line x1="75" y1="119" x2="75" y2="85" stroke="#94a3b8" strokeWidth="1.8" />
          <line x1="75" y1="85" x2="132" y2="85" stroke="#94a3b8" strokeWidth="1.8" />
          <ResH x={150} y={85} label="Rs" val={`${params.rs ?? 100}Ω`} />
          <line x1="168" y1="85" x2="225" y2="85" stroke="#94a3b8" strokeWidth="1.8" />
          <DiodeH
            x={238}
            y={85}
            zener={isZener}
            label={isZener ? 'DZ 稳压' : hasFilterCap ? '整流桥 D1~D4' : 'VD'}
          />
          <line x1="250" y1="85" x2="395" y2="85" stroke="#94a3b8" strokeWidth="1.8" />

          {hasFilterCap && (
            <>
              <line x1="305" y1="85" x2="305" y2="131" stroke="#94a3b8" strokeWidth="1.8" />
              <CapV
                x={305}
                y={135}
                label="C_filter"
                val={`${params.cFilterUf ?? 47}μF`}
              />
              <line x1="305" y1="139" x2="305" y2="195" stroke="#94a3b8" strokeWidth="1.8" />
              <Gnd x={305} y={195} />
            </>
          )}

          <line x1="370" y1="85" x2="370" y2="117" stroke="#94a3b8" strokeWidth="1.8" />
          <ResV x={370} y={135} label="RL" val={`${params.rl ?? 1}kΩ`} />
          <line x1="370" y1="153" x2="370" y2="195" stroke="#94a3b8" strokeWidth="1.8" />
          <Gnd x={370} y={195} />

          <line x1="75" y1="151" x2="75" y2="195" stroke="#94a3b8" strokeWidth="1.8" />
          <Gnd x={75} y={195} />

          <ProbeTag x={95} y={85} text="v(in)" color="#38bdf8" />
          <ProbeTag x={395} y={85} text="v(out)" color="#34d399" />
        </>
      );
    }

    // 4. MOSFET / JFET 放大与开关调光拓扑
    if (
      id === 'ch4-mosfet-iv' ||
      id === 'ch4-mosfet-cs' ||
      id === 'ch4-mosfet-cd-cg' ||
      id === 'ch4-jfet-amp' ||
      id === 'ch4-mosfet-pwm-led' ||
      id === 'ch6-mos-cascode-freq'
    ) {
      return (
        <>
          <VccBar x={260} y={36} label={`+VDD (${params.vdd ?? 12}V)`} />
          <line x1="260" y1="36" x2="260" y2="52" stroke="#94a3b8" strokeWidth="1.8" />
          <ResV
            x={260}
            y={70}
            label={id === 'ch4-mosfet-pwm-led' ? 'LED + R限流' : 'Rd'}
            val={`${params.rd ?? 3}kΩ`}
          />
          <line x1="260" y1="88" x2="260" y2="103" stroke="#94a3b8" strokeWidth="1.8" />

          <MosfetN
            x={250}
            y={125}
            label={id === 'ch4-jfet-amp' ? 'J1 (JFET)' : 'M1 (NMOS)'}
          />

          {/* 栅极输入耦合 */}
          <AcSource x={70} y={155} label="vi" />
          <line x1="70" y1="139" x2="70" y2="131" stroke="#94a3b8" strokeWidth="1.8" />
          <line x1="70" y1="131" x2="126" y2="131" stroke="#94a3b8" strokeWidth="1.8" />
          <CapH x={130} y={131} label="C1" val="10μF" />
          <line x1="134" y1="131" x2="228" y2="131" stroke="#94a3b8" strokeWidth="1.8" />
          <line x1="70" y1="171" x2="70" y2="205" stroke="#94a3b8" strokeWidth="1.8" />
          <Gnd x={70} y={205} />

          {/* 栅极偏置 Rg */}
          <line x1="180" y1="131" x2="180" y2="155" stroke="#94a3b8" strokeWidth="1.8" />
          <ResV x={180} y={173} label="Rg" val="1MΩ" />
          <line x1="180" y1="191" x2="180" y2="205" stroke="#94a3b8" strokeWidth="1.8" />
          <Gnd x={180} y={205} />

          {/* 源极电阻 Rs */}
          <line x1="260" y1="147" x2="260" y2="160" stroke="#94a3b8" strokeWidth="1.8" />
          <ResV x={260} y={178} label="Rs" val={`${params.rs ?? 0.5}kΩ`} />
          <line x1="260" y1="196" x2="260" y2="205" stroke="#94a3b8" strokeWidth="1.8" />
          <Gnd x={260} y={205} />

          {/* 漏极耦合输出 */}
          <line x1="260" y1="96" x2="340" y2="96" stroke="#94a3b8" strokeWidth="1.8" />
          <CapH x={345} y={96} label="C2" val="10μF" />
          <line x1="350" y1="96" x2="405" y2="96" stroke="#94a3b8" strokeWidth="1.8" />

          <ProbeTag x={90} y={131} text="v(in)" color="#38bdf8" />
          <ProbeTag x={405} y={96} text="v(out)" color="#34d399" />
        </>
      );
    }

    // 5. RC 电路与第1章信号/放大模型拓扑
    if (
      id === 'ch1-signal-spectrum' ||
      id === 'ch1-amp-model' ||
      id === 'ch6-rc-bode' ||
      id === 'lab1-instruments'
    ) {
      return (
        <>
          <AcSource x={80} y={135} label="Vs" />
          <line x1="80" y1="119" x2="80" y2="90" stroke="#94a3b8" strokeWidth="1.8" />
          <line x1="80" y1="90" x2="152" y2="90" stroke="#94a3b8" strokeWidth="1.8" />
          <ResH
            x={170}
            y={90}
            label={id === 'ch1-amp-model' ? 'Rs (源内阻)' : 'R'}
            val={`${params.rs ?? params.rKohm ?? 1}kΩ`}
          />
          <line x1="188" y1="90" x2="395" y2="90" stroke="#94a3b8" strokeWidth="1.8" />

          <line x1="315" y1="90" x2="315" y2="131" stroke="#94a3b8" strokeWidth="1.8" />
          {id === 'ch6-rc-bode' ? (
            <CapV x={315} y={135} label="C" val={`${params.cNf ?? 100}nF`} />
          ) : (
            <ResV
              x={315}
              y={135}
              label="RL"
              val={`${params.rl ?? 10}kΩ`}
            />
          )}
          <line x1="315" y1="153" x2="315" y2="195" stroke="#94a3b8" strokeWidth="1.8" />
          <Gnd x={315} y={195} />

          <line x1="80" y1="151" x2="80" y2="195" stroke="#94a3b8" strokeWidth="1.8" />
          <Gnd x={80} y={195} />

          <ProbeTag x={102} y={90} text="v(in)" color="#38bdf8" />
          <ProbeTag x={395} y={90} text="v(out)" color="#34d399" />
        </>
      );
    }

    // 6. 默认核心拓扑：BJT 共射 / 分压偏置 / 射极跟随 / 差分 / 镜像电流源 / 负反馈放大电路
    return (
      <>
        <VccBar x={255} y={34} label={`+VCC (${params.vcc ?? 12}V)`} />
        {/* 分压偏置 Rb1 & Rb2 */}
        <line x1="255" y1="34" x2="170" y2="34" stroke="#94a3b8" strokeWidth="1.8" />
        <line x1="170" y1="34" x2="170" y2="52" stroke="#94a3b8" strokeWidth="1.8" />
        <ResV x={170} y={70} label="Rb1" val={`${params.rb ?? params.rb1 ?? 30}kΩ`} />
        <line x1="170" y1="88" x2="170" y2="125" stroke="#94a3b8" strokeWidth="1.8" />
        <line x1="170" y1="125" x2="223" y2="125" stroke="#94a3b8" strokeWidth="1.8" />

        <line x1="170" y1="125" x2="170" y2="152" stroke="#94a3b8" strokeWidth="1.8" />
        <ResV x={170} y={170} label="Rb2" val={`${params.rb2 ?? 10}kΩ`} />
        <line x1="170" y1="188" x2="170" y2="206" stroke="#94a3b8" strokeWidth="1.8" />
        <Gnd x={170} y={206} />

        {/* 集电极 Rc */}
        <line x1="255" y1="34" x2="255" y2="52" stroke="#94a3b8" strokeWidth="1.8" />
        <ResV x={255} y={70} label="Rc" val={`${params.rc ?? 3}kΩ`} />
        <line x1="255" y1="88" x2="255" y2="107" stroke="#94a3b8" strokeWidth="1.8" />

        <BjtNpn x={245} y={125} label="VT1" />

        {/* 发射极 Re + 旁路电容 Ce */}
        <line x1="255" y1="143" x2="255" y2="154" stroke="#94a3b8" strokeWidth="1.8" />
        <ResV x={255} y={172} label="Re" val={`${params.re ?? 1}kΩ`} />
        <line x1="255" y1="190" x2="255" y2="206" stroke="#94a3b8" strokeWidth="1.8" />
        <Gnd x={255} y={206} />

        <line x1="255" y1="148" x2="322" y2="148" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="322" y1="148" x2="322" y2="168" stroke="#94a3b8" strokeWidth="1.5" />
        <CapV x={322} y={172} label="Ce" val="47μF" />
        <line x1="322" y1="176" x2="322" y2="206" stroke="#94a3b8" strokeWidth="1.5" />
        <Gnd x={322} y={206} />

        {/* 输入源与耦合电容 C1 */}
        <AcSource x={62} y={155} label="ui" />
        <line x1="62" y1="139" x2="62" y2="125" stroke="#94a3b8" strokeWidth="1.8" />
        <line x1="62" y1="125" x2="112" y2="125" stroke="#94a3b8" strokeWidth="1.8" />
        <CapH x={116} y={125} label="C1" val="10μF" />
        <line x1="120" y1="125" x2="170" y2="125" stroke="#94a3b8" strokeWidth="1.8" />
        <line x1="62" y1="171" x2="62" y2="206" stroke="#94a3b8" strokeWidth="1.8" />
        <Gnd x={62} y={206} />

        {/* 输出耦合电容 C2 与负载 */}
        <line x1="255" y1="98" x2="348" y2="98" stroke="#94a3b8" strokeWidth="1.8" />
        <CapH x={352} y={98} label="C2" val="10μF" />
        <line x1="356" y1="98" x2="405" y2="98" stroke="#94a3b8" strokeWidth="1.8" />

        <ProbeTag x={78} y={125} text="v(in)" color="#38bdf8" />
        <ProbeTag x={405} y={98} text="v(out)" color="#34d399" />
      </>
    );
  };

  return (
    <div className="schematic-box">
      <svg
        viewBox="0 0 495 235"
        className="schematic-svg"
        role="img"
        aria-label="电路仿真拓扑原理图"
      >
        <defs>
          <pattern id="schemGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="rgba(148, 163, 184, 0.18)" />
          </pattern>
        </defs>
        <rect width="495" height="235" fill="url(#schemGrid)" rx="8" />
        {renderDiagram()}
      </svg>
    </div>
  );
};
