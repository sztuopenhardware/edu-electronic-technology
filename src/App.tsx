import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Code2,
  Cpu,
  FlaskConical,
  Layers,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  X,
} from 'lucide-react';
import { ALL_CASES, CURRICULUM_CHAPTERS } from './curriculum';
import type { AnalysisMode, CircuitCase, SimulationOutput } from './types';
import { executeCircuitSimulation, getSpiceEngine } from './services/spiceEngine';
import { SchematicView } from './components/SchematicView';
import { WaveformViewer } from './components/WaveformViewer';
import { MathFormula } from './components/MathFormula';

const MODE_LABELS: Record<AnalysisMode, string> = {
  tran: '时域示波器 (.tran)',
  ac: '幅频/相频波特图 (.ac)',
  dc: '直流特性扫描 (.dc)',
  xy: 'X-Y 传输/滞回曲线',
  fft: 'FFT 谐波频谱分析',
};

function getInitialCaseFromHash(): CircuitCase {
  const hash = window.location.hash;
  const match = hash.match(/case=([a-z0-9-]+)/i);
  if (match) {
    const found = ALL_CASES.find((c) => c.id === match[1]);
    if (found) return found;
  }
  // 默认打开极具代表性的第2章反相比例运算或第1章首案例
  return ALL_CASES[0];
}

function buildDefaultParams(c: CircuitCase): Record<string, number> {
  const obj: Record<string, number> = {};
  for (const p of c.params) {
    obj[p.key] = p.defaultValue;
  }
  return obj;
}

export const App: React.FC = () => {
  const initialCase = useMemo(() => getInitialCaseFromHash(), []);
  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    initialCase.chapterId
  );
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCase.id);
  const [params, setParams] = useState<Record<string, number>>(() =>
    buildDefaultParams(initialCase)
  );
  const [viewMode, setViewMode] = useState<AnalysisMode>(
    initialCase.defaultViewMode
  );

  const [engineReady, setEngineReady] = useState<boolean>(false);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simOutput, setSimOutput] = useState<SimulationOutput | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  // SPICE 原始网表在线查看与自定义编辑模式
  const [showNetlistPanel, setShowNetlistPanel] = useState<boolean>(false);
  const [customNetlist, setCustomNetlist] = useState<string>('');
  const [isCustomNetlistDirty, setIsCustomNetlistDirty] =
    useState<boolean>(false);
  const [showSyllabusModal, setShowSyllabusModal] = useState<boolean>(false);

  const currentChapter = useMemo(
    () =>
      CURRICULUM_CHAPTERS.find((ch) => ch.id === selectedChapterId) ??
      CURRICULUM_CHAPTERS[0],
    [selectedChapterId]
  );

  const currentCase = useMemo(
    () =>
      ALL_CASES.find((c) => c.id === selectedCaseId) ?? currentChapter.cases[0],
    [selectedCaseId, currentChapter]
  );

  // 预热初始化 Ngspice WebAssembly 内核
  useEffect(() => {
    getSpiceEngine()
      .then(() => setEngineReady(true))
      .catch((err) =>
        setEngineError(
          err instanceof Error ? err.message : 'Ngspice WASM 加载失败'
        )
      );
  }, []);

  // 切换案例时的统一状态重置逻辑
  const selectCase = useCallback((targetCase: CircuitCase) => {
    setSelectedChapterId(targetCase.chapterId);
    setSelectedCaseId(targetCase.id);
    const nextParams = buildDefaultParams(targetCase);
    setParams(nextParams);
    setViewMode(targetCase.defaultViewMode);
    setIsCustomNetlistDirty(false);
    setSimError(null);
    window.history.replaceState(null, '', `#case=${targetCase.id}`);
  }, []);

  // 切换章节下拉菜单时自动选中该章第 1 个教学案例
  const handleChapterChange = (newChapterId: string) => {
    const ch = CURRICULUM_CHAPTERS.find((item) => item.id === newChapterId);
    if (ch && ch.cases.length > 0) {
      selectCase(ch.cases[0]);
    }
  };

  // 切换本章案例下拉菜单
  const handleCaseChange = (newCaseId: string) => {
    const found = ALL_CASES.find((c) => c.id === newCaseId);
    if (found) {
      selectCase(found);
    }
  };

  // 前后案例快捷翻页
  const currentGlobalIndex = useMemo(
    () => ALL_CASES.findIndex((c) => c.id === currentCase.id),
    [currentCase.id]
  );

  const generatedNetlist = useMemo(
    () => currentCase.buildNetlist(params, viewMode),
    [currentCase, params, viewMode]
  );

  useEffect(() => {
    if (!isCustomNetlistDirty) {
      setCustomNetlist(generatedNetlist);
    }
  }, [generatedNetlist, isCustomNetlistDirty]);

  // 防抖触发 Ngspice WASM 实时仿真
  const runCounterRef = useRef(0);
  const triggerSimulation = useCallback(
    async (netlistToRun: string, useSweepFamily: boolean) => {
      const ticket = ++runCounterRef.current;
      setIsSimulating(true);
      setSimError(null);
      try {
        const res = await executeCircuitSimulation(
          netlistToRun,
          currentCase.traces,
          viewMode,
          useSweepFamily ? currentCase.sweepFamily : undefined,
          params,
          currentCase.buildNetlist
        );
        if (ticket === runCounterRef.current) {
          setSimOutput(res);
          setEngineReady(true);
        }
      } catch (err) {
        if (ticket === runCounterRef.current) {
          setSimError(
            err instanceof Error ? err.message : 'SPICE 仿真运行出错'
          );
        }
      } finally {
        if (ticket === runCounterRef.current) {
          setIsSimulating(false);
        }
      }
    },
    [currentCase, params, viewMode]
  );

  useEffect(() => {
    if (isCustomNetlistDirty) return;
    const timer = window.setTimeout(() => {
      triggerSimulation(generatedNetlist, true);
    }, 60);
    return () => window.clearTimeout(timer);
  }, [generatedNetlist, isCustomNetlistDirty, triggerSimulation]);

  const metrics = useMemo(() => {
    if (!currentCase.computeMetrics) return [];
    return currentCase.computeMetrics(params, simOutput, viewMode);
  }, [currentCase, params, simOutput, viewMode]);

  const badgeClass = (badge: CircuitCase['badge']) => {
    switch (badge) {
      case 'AI项目实践':
        return 'badge-ai';
      case '必做实验':
        return 'badge-lab';
      case '核心掌握':
        return 'badge-core';
      default:
        return 'badge-comp';
    }
  };

  return (
    <div className="app-shell">
      {/* ============ 顶部导航与章节下拉选择栏 ============ */}
      <header className="top-header">
        <div className="brand-area">
          <div className="brand-icon">
            <Cpu size={22} />
          </div>
          <div>
            <div className="brand-title-row">
              <h1>《模拟电子技术A》交互式仿真教学平台</h1>
              <span
                className={`wasm-status ${
                  engineError ? 'err' : engineReady ? 'ok' : 'loading'
                }`}
              >
                <span className="status-dot" />
                {engineError
                  ? 'WASM 异常'
                  : engineReady
                  ? 'Ngspice WASM 已就绪'
                  : '正在加载 Ngspice...'}
              </span>
            </div>
            <p className="brand-sub">
              课程代码 SG00383 · 康华光《电子技术基础—模拟部分（第七版）》全章节覆盖 · 纯浏览器端 SPICE 实时电路求解
            </p>
          </div>
        </div>

        {/* 章节下拉菜单 + 案例下拉菜单（严格对标用户要求的按章节下拉选择） */}
        <div className="dropdown-nav-bar">
          <div className="select-group">
            <label htmlFor="chapter-dropdown">
              <Layers size={14} />
              <span>选择章节</span>
            </label>
            <select
              id="chapter-dropdown"
              className="nav-select chapter-select"
              value={selectedChapterId}
              onChange={(e) => handleChapterChange(e.target.value)}
            >
              {CURRICULUM_CHAPTERS.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.shortTitle}（{ch.cases.length}个案例）
                </option>
              ))}
            </select>
          </div>

          <div className="select-group case-select-group">
            <label htmlFor="case-dropdown">
              <FlaskConical size={14} />
              <span>本章仿真案例</span>
            </label>
            <select
              id="case-dropdown"
              className="nav-select case-select"
              value={currentCase.id}
              onChange={(e) => handleCaseChange(e.target.value)}
            >
              {currentChapter.cases.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.code}] {c.title}
                  {c.badge === 'AI项目实践'
                    ? ' ★AI实践'
                    : c.badge === '必做实验'
                    ? ' ★实验'
                    : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="nav-actions">
            <button
              type="button"
              className="icon-btn"
              disabled={currentGlobalIndex <= 0}
              onClick={() =>
                currentGlobalIndex > 0 &&
                selectCase(ALL_CASES[currentGlobalIndex - 1])
              }
              title="上一教学案例"
            >
              <ChevronLeft size={17} />
            </button>
            <span className="case-counter">
              {currentGlobalIndex + 1} / {ALL_CASES.length}
            </span>
            <button
              type="button"
              className="icon-btn"
              disabled={currentGlobalIndex >= ALL_CASES.length - 1}
              onClick={() =>
                currentGlobalIndex < ALL_CASES.length - 1 &&
                selectCase(ALL_CASES[currentGlobalIndex + 1])
              }
              title="下一教学案例"
            >
              <ChevronRight size={17} />
            </button>

            <button
              type="button"
              className="outline-btn"
              onClick={() => setShowSyllabusModal(true)}
            >
              <BookOpen size={15} />
              <span>教学大纲全览</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============ 当前案例标题横幅 ============ */}
      <section className="case-hero">
        <div className="case-hero-left">
          <div className="case-breadcrumbs">
            <span className="chapter-tag">{currentChapter.shortTitle}</span>
            <span className={`case-badge ${badgeClass(currentCase.badge)}`}>
              {currentCase.badge}
            </span>
            <span className="syllabus-ref">
              大纲对应：{currentCase.syllabusSection}
            </span>
          </div>
          <h2>
            <span className="case-code">{currentCase.code}</span>{' '}
            {currentCase.title}
          </h2>
          <p className="case-subtitle">{currentCase.subtitle}</p>
        </div>

        <div className="case-hero-actions">
          <button
            type="button"
            className={`outline-btn ${showNetlistPanel ? 'active' : ''}`}
            onClick={() => setShowNetlistPanel((v) => !v)}
          >
            <Code2 size={15} />
            <span>{showNetlistPanel ? '收起 SPICE 网表' : '查看/编辑 SPICE 网表'}</span>
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={() =>
              triggerSimulation(
                isCustomNetlistDirty ? customNetlist : generatedNetlist,
                !isCustomNetlistDirty
              )
            }
            disabled={isSimulating}
          >
            <Play size={15} />
            <span>{isSimulating ? '仿真计算中...' : '立即运行 Ngspice'}</span>
          </button>
        </div>
      </section>

      {/* ============ 主实验工作区：左控制原理台 + 右虚拟仪器与理论讲义 ============ */}
      <main className="workbench-grid">
        {/* 左侧栏：电路拓扑图 + 交互参数调节器 + SPICE 网表编辑器 */}
        <div className="left-column">
          <div className="panel-card">
            <div className="panel-header">
              <h3>
                <Activity size={16} />
                <span>电路仿真拓扑原理图（动态参数标注）</span>
              </h3>
              <span className="panel-hint">探针节点与示波器通道实时对应</span>
            </div>
            <SchematicView id={currentCase.id} params={params} />
          </div>

          <div className="panel-card">
            <div className="panel-header">
              <h3>
                <Sliders size={16} />
                <span>电路元件与信号源交互调节台</span>
              </h3>
              <button
                type="button"
                className="text-reset-btn"
                onClick={() => {
                  setParams(buildDefaultParams(currentCase));
                  setIsCustomNetlistDirty(false);
                }}
              >
                <RotateCcw size={13} />
                <span>重置默认参数</span>
              </button>
            </div>

            <div className="params-list">
              {currentCase.params.map((param) => {
                const val = params[param.key] ?? param.defaultValue;
                if (param.options && param.options.length > 0) {
                  return (
                    <div key={param.key} className="param-item">
                      <div className="param-label-row">
                        <span className="param-name">{param.label}</span>
                      </div>
                      <div className="segmented-options">
                        {param.options.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            className={`seg-btn ${
                              val === opt.value ? 'selected' : ''
                            }`}
                            onClick={() => {
                              setIsCustomNetlistDirty(false);
                              setParams((prev) => ({
                                ...prev,
                                [param.key]: opt.value,
                              }));
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={param.key} className="param-item">
                    <div className="param-label-row">
                      <span className="param-name">{param.label}</span>
                      <strong className="param-val">
                        {val} {param.unit}
                      </strong>
                    </div>
                    <input
                      type="range"
                      className="param-slider"
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      value={val}
                      onChange={(e) => {
                        const num = parseFloat(e.target.value);
                        setIsCustomNetlistDirty(false);
                        setParams((prev) => ({ ...prev, [param.key]: num }));
                      }}
                    />
                    <div className="param-minmax">
                      <span>
                        {param.min} {param.unit}
                      </span>
                      <span>
                        {param.max} {param.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 可选展开的在线 Ngspice 网表编辑器与日志输出 */}
          {showNetlistPanel && (
            <div className="panel-card netlist-card">
              <div className="panel-header">
                <h3>
                  <Code2 size={16} />
                  <span>Ngspice SPICE 原始网表在线实验台</span>
                </h3>
                <div className="netlist-actions">
                  {isCustomNetlistDirty && (
                    <button
                      type="button"
                      className="text-reset-btn"
                      onClick={() => {
                        setIsCustomNetlistDirty(false);
                        setCustomNetlist(generatedNetlist);
                      }}
                    >
                      恢复滑块联动网表
                    </button>
                  )}
                  <button
                    type="button"
                    className="mini-run-btn"
                    onClick={() => triggerSimulation(customNetlist, false)}
                  >
                    运行自定义网表
                  </button>
                </div>
              </div>
              <textarea
                className="netlist-editor"
                value={customNetlist}
                onChange={(e) => {
                  setCustomNetlist(e.target.value);
                  setIsCustomNetlistDirty(true);
                }}
                spellCheck={false}
                rows={12}
              />
              {simOutput && simOutput.ngspiceLog.length > 0 && (
                <details className="spice-log-details">
                  <summary>查看 Ngspice 内核输出日志</summary>
                  <pre className="spice-log-pre">
                    {simOutput.ngspiceLog.join('\n')}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>

        {/* 右侧栏：虚拟仪器示波器/波特图 + 万用表特征指标 + 理论公式与实验引导 */}
        <div className="right-column">
          <div className="panel-card scope-panel">
            <div className="mode-tabs-bar">
              <div className="mode-tabs">
                {currentCase.availableViewModes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`mode-tab ${viewMode === m ? 'active' : ''}`}
                    onClick={() => {
                      setIsCustomNetlistDirty(false);
                      setViewMode(m);
                    }}
                  >
                    {MODE_LABELS[m]}
                  </button>
                ))}
              </div>
              <span className="cursor-tip">移动鼠标至屏幕可实时读取十字探针坐标值</span>
            </div>

            {simError && <div className="sim-error-banner">{simError}</div>}

            <WaveformViewer
              sim={simOutput}
              mode={viewMode}
              xyAxes={currentCase.xyAxes}
              isRunning={isSimulating}
            />

            {/* 数字万用表与理论对照指标栏 */}
            {metrics.length > 0 && (
              <div className="metrics-grid">
                {metrics.map((m) => (
                  <div
                    key={m.label}
                    className={`metric-card ${m.highlight ? 'highlight' : ''}`}
                  >
                    <div className="metric-label">{m.label}</div>
                    <div className="metric-value">{m.value}</div>
                    {m.hint && <div className="metric-hint">{m.hint}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 教学原理、核心公式与实验互动指导区 */}
          <div className="theory-grid">
            <div className="panel-card">
              <div className="panel-header">
                <h3>
                  <BookOpen size={16} />
                  <span>电路原理剖析与核心公式</span>
                </h3>
              </div>
              <p className="principle-text">{currentCase.principleSummary}</p>
              <MathFormula latex={currentCase.keyFormulaLatex} />

              <div className="objectives-box">
                <h4>大纲学习目标要求（OBE）</h4>
                <ul>
                  {currentCase.objectives.map((obj, idx) => (
                    <li key={idx}>{obj}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h3>
                  <Sparkles size={16} />
                  <span>交互仿真探究任务与思政导读</span>
                </h3>
              </div>
              <div className="tips-box">
                <h4>动手探究实验建议</h4>
                <ol>
                  {currentCase.experimentTips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ol>
              </div>

              {currentChapter.ideologyTitle && (
                <div className="ideology-card">
                  <div className="ideology-tag">课程思政与工程哲学融入点</div>
                  <h5>{currentChapter.ideologyTitle}</h5>
                  <p>{currentChapter.ideologyContent}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ============ 课程教学大纲全章节案例矩阵弹窗 ============ */}
      {showSyllabusModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowSyllabusModal(false)}
        >
          <div
            className="syllabus-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>《模拟电子技术A》(SG00383) 教学大纲仿真案例全览</h2>
                <p>
                  覆盖全部 10 章课堂讲授内容 + 5 项 AI 项目实践 + 6 项必做课内实验（共{' '}
                  {ALL_CASES.length} 个实时 Ngspice WASM 交互仿真案例）
                </p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowSyllabusModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {CURRICULUM_CHAPTERS.map((ch) => (
                <div key={ch.id} className="modal-chapter-block">
                  <div className="modal-ch-header">
                    <h3>{ch.fullTitle}</h3>
                    <span>{ch.hoursInfo}</span>
                  </div>
                  <div className="modal-case-list">
                    {ch.cases.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`modal-case-btn ${
                          c.id === currentCase.id ? 'current' : ''
                        }`}
                        onClick={() => {
                          selectCase(c);
                          setShowSyllabusModal(false);
                        }}
                      >
                        <div className="modal-case-top">
                          <span className="code">{c.code}</span>
                          <span className={`case-badge ${badgeClass(c.badge)}`}>
                            {c.badge}
                          </span>
                        </div>
                        <div className="modal-case-title">{c.title}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
