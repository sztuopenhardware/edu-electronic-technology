import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AnalysisMode, SimulationOutput } from '../types';
import { analyzeSpectrum } from '../utils/fft';
import { calcBodeMetrics, calcWaveStats, formatEng } from '../utils/format';

interface WaveformViewerProps {
  sim: SimulationOutput | null;
  mode: AnalysisMode;
  xyAxes?: { xExpr: string; yExpr: string; xLabel: string; yLabel: string };
  isRunning: boolean;
}

export const WaveformViewer: React.FC<WaveformViewerProps> = ({
  sim,
  mode,
  xyAxes,
  isRunning,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [hiddenTraces, setHiddenTraces] = useState<Record<string, boolean>>({});
  const [showPhase, setShowPhase] = useState<boolean>(true);
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({
    w: 760,
    h: 360,
  });

  // 切换案例后恢复全部通道可见
  useEffect(() => {
    setHiddenTraces({});
  }, [sim?.xLabel]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(320, Math.floor(entry.contentRect.width));
        setCanvasSize({ w, h: 350 });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const spectrum = useMemo(() => {
    if (mode !== 'fft' || !sim || sim.rawType !== 'tran') return null;
    return analyzeSpectrum(
      sim.xValues,
      sim.series.map((s) => s.values)
    );
  }, [mode, sim]);

  const bodeMetrics = useMemo(() => {
    if (!sim || sim.rawType !== 'ac') return null;
    return calcBodeMetrics(sim, 0);
  }, [sim]);

  // Hover 读数信息引用
  const hoverReadoutRef = useRef<{
    xText: string;
    items: { name: string; color: string; valText: string }[];
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const { w, h } = canvasSize;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // 1. 绘制示波器深色荧光屏背景
    ctx.fillStyle = '#090f1a';
    ctx.fillRect(0, 0, w, h);

    const padL = 64;
    const padR = 62;
    const padT = 24;
    const padB = 40;
    const plotW = Math.max(80, w - padL - padR);
    const plotH = Math.max(80, h - padT - padB);

    // 外框与刻度网格
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.13)';
    ctx.lineWidth = 1;
    const gridCols = 10;
    const gridRows = 8;
    for (let i = 0; i <= gridCols; i++) {
      const gx = padL + (plotW * i) / gridCols;
      ctx.beginPath();
      ctx.moveTo(gx, padT);
      ctx.lineTo(gx, padT + plotH);
      ctx.stroke();
    }
    for (let j = 0; j <= gridRows; j++) {
      const gy = padT + (plotH * j) / gridRows;
      ctx.beginPath();
      ctx.moveTo(padL, gy);
      ctx.lineTo(padL + plotW, gy);
      ctx.stroke();
    }

    // 中心十字准星刻度线
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH / 2);
    ctx.lineTo(padL + plotW, padT + plotH / 2);
    ctx.moveTo(padL + plotW / 2, padT);
    ctx.lineTo(padL + plotW / 2, padT + plotH);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.38)';
    ctx.strokeRect(padL, padT, plotW, plotH);

    if (!sim || sim.xValues.length === 0 || sim.series.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        isRunning ? '正在调用 Ngspice WASM 引擎求解电路矩阵...' : '暂无波形数据',
        padL + plotW / 2,
        padT + plotH / 2
      );
      hoverReadoutRef.current = null;
      return;
    }

    // ============ 模式 A: XY 传输特性 / 迟滞回环模式 ============
    if (mode === 'xy' && sim.rawType === 'tran') {
      const xTarget =
        sim.series.find(
          (s) => xyAxes && s.expr.toLowerCase() === xyAxes.xExpr.toLowerCase()
        ) ?? sim.series[0];
      const yTarget =
        sim.series.find(
          (s) => xyAxes && s.expr.toLowerCase() === xyAxes.yExpr.toLowerCase()
        ) ??
        sim.series[sim.series.length - 1];

      const xs = xTarget.values;
      const ys = yTarget.values;
      let xMin = Math.min(...xs);
      let xMax = Math.max(...xs);
      let yMin = Math.min(...ys);
      let yMax = Math.max(...ys);
      const xMargin = Math.max((xMax - xMin) * 0.1, 0.2);
      const yMargin = Math.max((yMax - yMin) * 0.12, 0.2);
      xMin -= xMargin;
      xMax += xMargin;
      yMin -= yMargin;
      yMax += yMargin;

      const mapX = (v: number) => padL + ((v - xMin) / (xMax - xMin)) * plotW;
      const mapY = (v: number) =>
        padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

      // 零轴辅助线
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.28)';
      ctx.setLineDash([4, 4]);
      if (xMin < 0 && xMax > 0) {
        const zx = mapX(0);
        ctx.beginPath();
        ctx.moveTo(zx, padT);
        ctx.lineTo(zx, padT + plotH);
        ctx.stroke();
      }
      if (yMin < 0 && yMax > 0) {
        const zy = mapY(0);
        ctx.beginPath();
        ctx.moveTo(padL, zy);
        ctx.lineTo(padL + plotW, zy);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // 绘制 XY 轨迹（跳过前 15% 初始上电瞬态）
      const startIdx = Math.floor(xs.length * 0.15);
      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, padT, plotW, plotH);
      ctx.clip();
      ctx.strokeStyle = yTarget.color || '#34d399';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let i = startIdx; i < xs.length; i++) {
        const px = mapX(xs[i]);
        const py = mapY(ys[i]);
        if (i === startIdx) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      // 坐标轴刻度文字
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px ui-monospace, SFMono-Regular, Consolas, monospace';
      ctx.textAlign = 'center';
      for (let i = 0; i <= 5; i++) {
        const val = xMin + ((xMax - xMin) * i) / 5;
        ctx.fillText(
          formatEng(val, xTarget.unit, 2),
          padL + (plotW * i) / 5,
          padT + plotH + 18
        );
      }
      ctx.fillText(
        xyAxes?.xLabel ?? `${xTarget.name} (${xTarget.unit})`,
        padL + plotW / 2,
        padT + plotH + 34
      );
      ctx.textAlign = 'right';
      for (let j = 0; j <= 4; j++) {
        const val = yMin + ((yMax - yMin) * j) / 4;
        ctx.fillText(
          formatEng(val, yTarget.unit, 2),
          padL - 8,
          padT + plotH - (plotH * j) / 4 + 4
        );
      }
      hoverReadoutRef.current = null;
      return;
    }

    // ============ 模式 B: FFT 频谱分析仪模式 ============
    if (mode === 'fft' && spectrum && spectrum.freqs.length > 0) {
      // 聚焦前 60 个有效频率分量以便清晰观察基波与各次谐波谱线
      const maxBins = Math.min(spectrum.freqs.length, 64);
      const freqs = spectrum.freqs.slice(0, maxBins);
      const fMax = freqs[freqs.length - 1];
      const yMin = -80;
      const yMax = 20;

      const mapX = (f: number) => padL + (f / fMax) * plotW;
      const mapY = (db: number) =>
        padT + plotH - ((Math.max(yMin, Math.min(yMax, db)) - yMin) / (yMax - yMin)) * plotH;

      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, padT, plotW, plotH);
      ctx.clip();

      sim.series.forEach((s, sIdx) => {
        if (hiddenTraces[s.name]) return;
        const dbs = spectrum.magnitudesDb[sIdx]?.slice(0, maxBins) ?? [];
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < dbs.length; i++) {
          const px = mapX(freqs[i]);
          const py = mapY(dbs[i]);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      });
      ctx.restore();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px ui-monospace, SFMono-Regular, Consolas, monospace';
      ctx.textAlign = 'center';
      for (let i = 0; i <= 5; i++) {
        const fVal = (fMax * i) / 5;
        ctx.fillText(formatEng(fVal, 'Hz', 1), padL + (plotW * i) / 5, padT + plotH + 18);
      }
      ctx.fillText('频率 f (Hz) — Hann 窗 FFT 谐波频谱', padL + plotW / 2, padT + plotH + 34);

      ctx.textAlign = 'right';
      for (let j = 0; j <= 5; j++) {
        const dbVal = yMin + ((yMax - yMin) * j) / 5;
        ctx.fillText(`${dbVal.toFixed(0)} dBV`, padL - 8, padT + plotH - (plotH * j) / 5 + 4);
      }
      hoverReadoutRef.current = null;
      return;
    }

    // ============ 模式 C: 标准 .tran / .ac / .dc 绘图模式 ============
    const visibleSeries = sim.series.filter((s) => !hiddenTraces[s.name]);
    const isLogX = Boolean(sim.logX && sim.xValues[0] > 0);
    const xRawMin = sim.xValues[0];
    const xRawMax = sim.xValues[sim.xValues.length - 1];
    const logMin = isLogX ? Math.log10(Math.max(xRawMin, 1e-3)) : 0;
    const logMax = isLogX ? Math.log10(Math.max(xRawMax, 1e-2)) : 1;

    const mapX = (x: number) => {
      if (isLogX) {
        const lx = Math.log10(Math.max(x, 1e-6));
        return padL + ((lx - logMin) / Math.max(logMax - logMin, 1e-9)) * plotW;
      }
      return (
        padL +
        ((x - xRawMin) / Math.max(xRawMax - xRawMin, 1e-15)) * plotW
      );
    };

    // 左右 Y 轴独立量程计算
    const leftGroup = visibleSeries.filter((s) => (s.axis ?? 'left') === 'left');
    const rightGroup = visibleSeries.filter((s) => s.axis === 'right');

    const computeBounds = (valsList: number[][], fallbackSpan = 1) => {
      if (valsList.length === 0) return { min: -1, max: 1 };
      let min = Infinity;
      let max = -Infinity;
      for (const arr of valsList) {
        for (const v of arr) {
          if (Number.isFinite(v)) {
            if (v < min) min = v;
            if (v > max) max = v;
          }
        }
      }
      if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: -1, max: 1 };
      const span = max - min;
      if (span < 1e-9) {
        const pad = Math.max(Math.abs(max) * 0.2, fallbackSpan);
        return { min: min - pad, max: max + pad };
      }
      return { min: min - span * 0.12, max: max + span * 0.12 };
    };

    const leftBounds = computeBounds(
      leftGroup.map((s) => s.values),
      sim.rawType === 'ac' ? 6 : 0.5
    );

    // AC 模式下右轴显示相位曲线 (°)
    const hasAcPhase =
      sim.rawType === 'ac' &&
      showPhase &&
      visibleSeries.some((s) => s.phaseValues && s.phaseValues.length > 0);

    const rightBounds = hasAcPhase
      ? computeBounds(
          visibleSeries
            .map((s) => s.phaseValues ?? [])
            .filter((a) => a.length > 0),
          45
        )
      : rightGroup.length > 0
      ? computeBounds(rightGroup.map((s) => s.values), 0.5)
      : null;

    const mapLeftY = (v: number) =>
      padT +
      plotH -
      ((v - leftBounds.min) / (leftBounds.max - leftBounds.min)) * plotH;

    const mapRightY = (v: number) =>
      rightBounds
        ? padT +
          plotH -
          ((v - rightBounds.min) / (rightBounds.max - rightBounds.min)) * plotH
        : padT + plotH / 2;

    // 对数频率网格线 (AC 波特图)
    if (isLogX) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      const dStart = Math.floor(logMin);
      const dEnd = Math.ceil(logMax);
      for (let d = dStart; d <= dEnd; d++) {
        for (let m = 1; m <= 9; m++) {
          const f = m * Math.pow(10, d);
          if (f < xRawMin || f > xRawMax) continue;
          const px = mapX(f);
          ctx.beginPath();
          ctx.lineWidth = m === 1 ? 1.2 : 0.6;
          ctx.moveTo(px, padT);
          ctx.lineTo(px, padT + plotH);
          ctx.stroke();
        }
      }
    }

    // 0V / 0dB 基准线
    if (leftBounds.min < 0 && leftBounds.max > 0) {
      const zeroY = mapLeftY(0);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, zeroY);
      ctx.lineTo(padL + plotW, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // AC 波特图自动标注 -3dB 截止线与 fL / fH 标记点
    if (sim.rawType === 'ac' && bodeMetrics && visibleSeries.length > 0) {
      const y3db = mapLeftY(bodeMetrics.peakGainDb - 3.0103);
      if (y3db >= padT && y3db <= padT + plotH) {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(padL, y3db);
        ctx.lineTo(padL + plotW, y3db);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#fbbf24';
        ctx.font = '10px ui-monospace, SFMono-Regular, Consolas, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(
          `-3dB (${(bodeMetrics.peakGainDb - 3.01).toFixed(1)} dB)`,
          padL + 6,
          y3db - 5
        );

        const drawCutoffDot = (freq: number | null, tag: string) => {
          if (!freq) return;
          const cx = mapX(freq);
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(cx, y3db, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillText(`${tag}=${formatEng(freq, 'Hz', 2)}`, cx + 6, y3db + 13);
        };
        drawCutoffDot(bodeMetrics.fLowHz, 'fL');
        drawCutoffDot(bodeMetrics.fHighHz, 'fH');
      }
    }

    // 绘制曲线主体
    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT, plotW, plotH);
    ctx.clip();

    visibleSeries.forEach((s) => {
      const yMapper = s.axis === 'right' ? mapRightY : mapLeftY;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.2;
      ctx.setLineDash(s.dashed ? [6, 4] : []);
      ctx.beginPath();
      for (let i = 0; i < sim.xValues.length; i++) {
        const px = mapX(sim.xValues[i]);
        const py = yMapper(s.values[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // 若是 AC 模式同时绘制虚线相频特性曲线
      if (hasAcPhase && s.phaseValues && s.phaseValues.length === sim.xValues.length) {
        ctx.strokeStyle = s.color;
        ctx.globalAlpha = 0.65;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (let i = 0; i < sim.xValues.length; i++) {
          const px = mapX(sim.xValues[i]);
          const py = mapRightY(s.phaseValues[i]);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });
    ctx.setLineDash([]);
    ctx.restore();

    // X 轴标签与刻度
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px ui-monospace, SFMono-Regular, Consolas, monospace';
    ctx.textAlign = 'center';
    if (isLogX) {
      const dStart = Math.ceil(logMin);
      const dEnd = Math.floor(logMax);
      for (let d = dStart; d <= dEnd; d++) {
        const f = Math.pow(10, d);
        ctx.fillText(formatEng(f, 'Hz', 0), mapX(f), padT + plotH + 18);
      }
    } else {
      for (let i = 0; i <= 5; i++) {
        const xv = xRawMin + ((xRawMax - xRawMin) * i) / 5;
        ctx.fillText(
          formatEng(xv, sim.xUnit, 2),
          padL + (plotW * i) / 5,
          padT + plotH + 18
        );
      }
    }
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(
      `${sim.xLabel} (${sim.xUnit})`,
      padL + plotW / 2,
      padT + plotH + 34
    );

    // 左 Y 轴刻度
    const leftUnit = leftGroup[0]?.unit ?? 'V';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    for (let j = 0; j <= 4; j++) {
      const yv = leftBounds.min + ((leftBounds.max - leftBounds.min) * j) / 4;
      ctx.fillText(
        formatEng(yv, leftUnit, 2),
        padL - 6,
        padT + plotH - (plotH * j) / 4 + 4
      );
    }

    // 右 Y 轴刻度（相频相位 ° 或 支路电流 mA）
    if (rightBounds) {
      const rightUnit = hasAcPhase ? '°' : rightGroup[0]?.unit ?? 'mA';
      ctx.fillStyle = hasAcPhase ? '#cbd5e1' : rightGroup[0]?.color ?? '#94a3b8';
      ctx.textAlign = 'left';
      for (let j = 0; j <= 4; j++) {
        const yv =
          rightBounds.min + ((rightBounds.max - rightBounds.min) * j) / 4;
        ctx.fillText(
          formatEng(yv, rightUnit, 1),
          padL + plotW + 6,
          padT + plotH - (plotH * j) / 4 + 4
        );
      }
    }

    // 交互十字光标探针与即时数值读数
    if (
      hoverPos &&
      hoverPos.x >= padL &&
      hoverPos.x <= padL + plotW &&
      hoverPos.y >= padT &&
      hoverPos.y <= padT + plotH
    ) {
      const ratio = (hoverPos.x - padL) / plotW;
      const targetX = isLogX
        ? Math.pow(10, logMin + ratio * (logMax - logMin))
        : xRawMin + ratio * (xRawMax - xRawMin);

      // 二分查找最接近的采样点下标
      let lo = 0;
      let hi = sim.xValues.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (sim.xValues[mid] < targetX) lo = mid + 1;
        else hi = mid;
      }
      const idx =
        lo > 0 &&
        Math.abs(sim.xValues[lo - 1] - targetX) <
          Math.abs(sim.xValues[lo] - targetX)
          ? lo - 1
          : lo;

      const snapX = mapX(sim.xValues[idx]);
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(snapX, padT);
      ctx.lineTo(snapX, padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      const items: { name: string; color: string; valText: string }[] = [];
      visibleSeries.forEach((s) => {
        const v = s.values[idx];
        const yMapper = s.axis === 'right' ? mapRightY : mapLeftY;
        const py = yMapper(v);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(snapX, py, 4, 0, Math.PI * 2);
        ctx.fill();

        let valText = formatEng(v, s.unit, 2);
        if (hasAcPhase && s.phaseValues) {
          valText += ` ∠ ${s.phaseValues[idx].toFixed(1)}°`;
        }
        items.push({ name: s.name, color: s.color, valText });
      });

      hoverReadoutRef.current = {
        xText: `${sim.xLabel}: ${formatEng(sim.xValues[idx], sim.xUnit, 3)}`,
        items,
      };
    } else {
      hoverReadoutRef.current = null;
    }
  }, [sim, mode, xyAxes, hoverPos, hiddenTraces, showPhase, canvasSize, spectrum, bodeMetrics, isRunning]);

  return (
    <div className="waveform-card" ref={containerRef}>
      {/* 通道控制栏 */}
      <div className="scope-toolbar">
        <div className="scope-channels">
          {sim?.series.map((s) => {
            const hidden = Boolean(hiddenTraces[s.name]);
            return (
              <button
                key={s.name}
                type="button"
                className={`channel-pill ${hidden ? 'muted' : ''}`}
                onClick={() =>
                  setHiddenTraces((prev) => ({ ...prev, [s.name]: !prev[s.name] }))
                }
                title="点击显示/隐藏该波形通道"
              >
                <span
                  className="channel-dot"
                  style={{ backgroundColor: hidden ? '#475569' : s.color }}
                />
                <span>{s.name}</span>
              </button>
            );
          })}
        </div>

        <div className="scope-meta">
          {sim?.rawType === 'ac' && mode === 'ac' && (
            <label className="phase-toggle">
              <input
                type="checkbox"
                checked={showPhase}
                onChange={(e) => setShowPhase(e.target.checked)}
              />
              <span>叠加相频虚线 (°)</span>
            </label>
          )}
          {mode === 'fft' && spectrum?.thdPercent !== undefined && (
            <span className="thd-badge">
              基波 {formatEng(spectrum.fundamentalHz ?? 0, 'Hz', 1)} | 总谐波失真 THD ≈{' '}
              {spectrum.thdPercent.toFixed(2)}%
            </span>
          )}
          {sim && (
            <span className="sim-latency">
              Ngspice WASM: {sim.simTimeMs.toFixed(1)} ms
            </span>
          )}
        </div>
      </div>

      {/* 荧光屏画布 */}
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          style={{ width: `${canvasSize.w}px`, height: `${canvasSize.h}px` }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }}
          onMouseLeave={() => setHoverPos(null)}
        />
        {hoverPos && hoverReadoutRef.current && (
          <div className="cursor-readout">
            <div className="cursor-x">{hoverReadoutRef.current.xText}</div>
            {hoverReadoutRef.current.items.map((it) => (
              <div key={it.name} className="cursor-item">
                <span className="dot" style={{ background: it.color }} />
                <span className="name">{it.name}:</span>
                <strong>{it.valText}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 自动数字万用表 / 示波器特征量统计条 */}
      {sim && sim.rawType === 'tran' && mode === 'tran' && (
        <div className="wave-stats-strip">
          {sim.series.slice(0, 3).map((s) => {
            const st = calcWaveStats(s.values);
            return (
              <div key={s.name} className="wave-stat-box">
                <div className="stat-title" style={{ color: s.color }}>
                  {s.name}
                </div>
                <div className="stat-vals">
                  <span>Vpp: {formatEng(st.vpp, s.unit, 2)}</span>
                  <span>均值(DC): {formatEng(st.vAvg, s.unit, 2)}</span>
                  <span>RMS: {formatEng(st.vRms, s.unit, 2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sim && sim.rawType === 'ac' && mode === 'ac' && bodeMetrics && (
        <div className="wave-stats-strip">
          <div className="wave-stat-box">
            <div className="stat-title" style={{ color: '#38bdf8' }}>
              波特图自动频响测量
            </div>
            <div className="stat-vals">
              <span>最大增益: {bodeMetrics.peakGainDb.toFixed(2)} dB</span>
              <span>
                下限频率 fL:{' '}
                {bodeMetrics.fLowHz
                  ? formatEng(bodeMetrics.fLowHz, 'Hz', 2)
                  : 'DC (0 Hz)'}
              </span>
              <span>
                上限频率 fH:{' '}
                {bodeMetrics.fHighHz
                  ? formatEng(bodeMetrics.fHighHz, 'Hz', 2)
                  : '> 扫描上限'}
              </span>
              {bodeMetrics.phaseMarginDeg !== null && (
                <span>相位裕度 PM: {bodeMetrics.phaseMarginDeg.toFixed(1)}°</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
