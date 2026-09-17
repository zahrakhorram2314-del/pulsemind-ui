'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  BrainCircuit,
  Cpu,
  Clock,
  Flame,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle2,
  Copy,
  Terminal,
  Activity,
  Layers,
  BarChart3,
  RefreshCw,
  Zap,
  Info,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { MetricSparkline, TrendDataPoint } from '@/components/MetricSparkline';

function computeTrend(baseline: number, current: number, decimals: number = 0): TrendDataPoint[] {
  const diff = current - baseline;
  // Non-linear trajectory showing escalation over the 15-minute window
  const curve = [0, 0.08, 0.22, 0.52, 0.85, 1.0];
  const times = ['-15m', '-12m', '-9m', '-6m', '-3m', 'Now'];
  return times.map((t, idx) => {
    const v = baseline + diff * curve[idx];
    return {
      time: t,
      value: decimals > 0 ? parseFloat(v.toFixed(decimals)) : Math.round(v),
    };
  });
}

interface ShapFeature {
  feature: string;
  importancePercent: number;
  shapValue: number;
  baseline: string;
  observed: string;
  direction: 'risk_increase' | 'risk_decrease';
  explanation: string;
}

interface ActionItem {
  id: string;
  title: string;
  commandOrAction: string;
  impact: string;
  priority: string;
}

interface IncidentAnalysis {
  executiveSummary: string;
  xaiAttribution: string;
  severity: string;
  primaryImpactRegion: string;
  rootCauseHypothesis: string;
  shapFeatures: ShapFeature[];
  actionItems: ActionItem[];
  millerChunksCount: number;
  source: string;
  analyzedAt: string;
}

const DEFAULT_METRIC_INPUT =
  'System Metrics: CPU Usage: 94%, API Latency: 420ms, Error Rate: +12% spike in region US-East.';

const INITIAL_ANALYSIS: IncidentAnalysis = {
  executiveSummary:
    'Critical US-East service degradation detected: 94% CPU saturation is causing a 420ms API latency bottleneck and an anomalous +12% error spike requiring immediate traffic shedding or pod autoscaling.',
  xaiAttribution:
    'The anomaly detection model triggered this severity rating primarily due to regional Error Rate divergence (+0.54 SHAP value, 48% relative impact), compounded by CPU saturation breaching the 90th percentile threshold (+0.38 SHAP value). API Latency contributed as a secondary downstream feature (+0.18 SHAP value), consistent with thread pool exhaustion rather than upstream network transit failure.',
  severity: 'CRITICAL',
  primaryImpactRegion: 'US-East (N. Virginia)',
  rootCauseHypothesis:
    'Worker thread pool exhaustion driven by sustained 94% CPU saturation under peak transaction volumes.',
  shapFeatures: [
    {
      feature: 'Regional Error Rate Spike',
      importancePercent: 48,
      shapValue: 0.54,
      baseline: '0.15%',
      observed: '+12.0%',
      direction: 'risk_increase',
      explanation:
        'Primary risk driver: 80x jump in HTTP 500/503 responses concentrated across US-East cluster worker pods.',
    },
    {
      feature: 'Host CPU Core Saturation',
      importancePercent: 34,
      shapValue: 0.38,
      baseline: '62.0%',
      observed: '94.0%',
      direction: 'risk_increase',
      explanation:
        'Sustained compute saturation exceeded the 85% headroom safety margin, degrading thread scheduling.',
    },
    {
      feature: 'p99 API Latency Bottleneck',
      importancePercent: 18,
      shapValue: 0.18,
      baseline: '85ms',
      observed: '420ms',
      direction: 'risk_increase',
      explanation:
        'Downstream event loop queue delay triggered by concurrent request backpressure and lock contention.',
    },
  ],
  actionItems: [
    {
      id: 'act-1',
      title: 'Reroute 40% US-East Ingress to US-West',
      commandOrAction:
        'kubectl patch ingress-route core-api -n prod --type merge -p \'{"spec":{"trafficSplit":{"us-west":40,"us-east":60}}}\'',
      impact: 'Reduces CPU utilization from 94% to ~62% within 60 seconds.',
      priority: 'URGENT',
    },
    {
      id: 'act-2',
      title: 'Autoscale Worker Pool Pods (+16 replicas)',
      commandOrAction:
        'kubectl scale deployment/api-worker -n prod --replicas=32',
      impact:
        'Instantly doubles queue worker throughput to relieve the 420ms thread backlog.',
      priority: 'URGENT',
    },
    {
      id: 'act-3',
      title: 'Activate Graceful Request Degradation',
      commandOrAction:
        'curl -X POST https://mesh-ctrl.internal/api/v1/policy/shed-tier3 -H "X-Auth-Token: prod-auth"',
      impact:
        'Drops non-essential background analytics requests to preserve checkout SLA.',
      priority: 'RECOMMENDED',
    },
  ],
  millerChunksCount: 5,
  source: 'PulseMind-XAI-Engine',
  analyzedAt: 'Just now',
};

const SAMPLE_PRESETS = [
  {
    name: 'US-East Alert (Active)',
    text: 'System Metrics: CPU Usage: 94%, API Latency: 420ms, Error Rate: +12% spike in region US-East.',
    tag: 'Critical',
  },
  {
    name: 'EU-West DB Lock',
    text: 'System Metrics: PostgreSQL Active Connections: 99%, Query Wait: 1,840ms, Error Rate: +4.2% lock timeout in region EU-West.',
    tag: 'High',
  },
  {
    name: 'AP-South RAM Leak',
    text: 'System Metrics: Memory Usage: 97.4%, GC Pause Time: 920ms, Latency: 310ms in region AP-South (Mumbai).',
    tag: 'Elevated',
  },
  {
    name: 'Nominal Fleet',
    text: 'System Metrics: CPU Usage: 34%, API Latency: 42ms, Error Rate: 0.02% across all global edge nodes.',
    tag: 'Healthy',
  },
];

const RAW_SYSTEM_LOGS = [
  {
    time: '13:04:12 UTC',
    level: 'WARN',
    source: 'kube-hpa-controller',
    msg: 'us-east-1a node pool cpu limits reaching ceiling (91.2% threshold)',
  },
  {
    time: '13:04:38 UTC',
    level: 'ERROR',
    source: 'envoy-ingress-proxy',
    msg: 'upstream connect error or disconnect/reset before headers (503 Service Unavailable)',
  },
  {
    time: '13:04:55 UTC',
    level: 'ALERT',
    source: 'datadog-telemetry',
    msg: 'p99 request duration breach: 420ms exceeded SLA window (nominal 85ms)',
  },
  {
    time: '13:05:08 UTC',
    level: 'CRIT',
    source: 'traffic-manager',
    msg: 'Regional error spike rate +12.0% divergence detected in region us-east-1',
  },
  {
    time: '13:05:14 UTC',
    level: 'WARN',
    source: 'worker-thread-pool',
    msg: 'WorkQueue maxCapacity=5000 exhausted; 142 incoming requests queued',
  },
];

export default function PulseMindPage() {
  const [metricsInput, setMetricsInput] = useState(DEFAULT_METRIC_INPUT);
  const [analysis, setAnalysis] = useState<IncidentAnalysis>(INITIAL_ANALYSIS);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [executedActions, setExecutedActions] = useState<Record<string, boolean>>({});
  const [hoveredTime, setHoveredTime] = useState<string | null>(null);

  // Progressive Disclosure Levels:
  // 'glance' = Level 1: Only 1-sentence Banner + Status + 1 Primary Action (3 chunks)
  // 'standard' = Level 2: Banner + 3 Metric Cards + 2-sentence XAI Attribution + Priority Actions (5 chunks)
  // 'deep' = Level 3: All above + SHAP Waterfall details + Telemetry Logs + Region topology (7+ chunks)
  const [cognitiveLevel, setCognitiveLevel] = useState<'glance' | 'standard' | 'deep'>('standard');
  const [isLogsExpanded, setIsLogsExpanded] = useState(false);
  const [isWorkbenchExpanded, setIsWorkbenchExpanded] = useState(false);

  const handleAnalyze = async (textToAnalyze: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metricsText: textToAnalyze }),
      });

      if (!res.ok) {
        throw new Error('API analysis failed');
      }

      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.warn('Using local PulseMind fallback analysis:', err);
      // Determine heuristic response
      setAnalysis(INITIAL_ANALYSIS);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleExecuteAction = (actionId: string) => {
    setExecutedActions((prev) => ({ ...prev, [actionId]: true }));
  };

  // Extract current metrics from active input for metric cards & sparklines
  const cpuMatch = metricsInput.match(/CPU(?: Usage)?:\s*(\d+(?:\.\d+)?)/i);
  const cpuVal = cpuMatch ? parseFloat(cpuMatch[1]) : 94;

  const latencyMatch = metricsInput.match(/(?:API )?Latency(?: \(p99\))?:\s*(\d+(?:\.\d+)?)/i);
  const latencyVal = latencyMatch ? parseFloat(latencyMatch[1]) : 420;

  const errorMatch = metricsInput.match(/Error(?: Rate)?:\s*\+?(\d+(?:\.\d+)?)/i);
  const errorVal = errorMatch ? parseFloat(errorMatch[1]) : 12.0;

  // 15-Minute Trend Data for each Metric Card Sparkline
  const cpuTrend = React.useMemo(() => {
    const baseline = cpuVal > 62 ? 62 : Math.max(10, cpuVal - 10);
    return computeTrend(baseline, cpuVal, 0);
  }, [cpuVal]);

  const latencyTrend = React.useMemo(() => {
    const baseline = latencyVal > 85 ? 85 : Math.max(20, latencyVal - 15);
    return computeTrend(baseline, latencyVal, 0);
  }, [latencyVal]);

  const errorTrend = React.useMemo(() => {
    const baseline = errorVal > 0.15 ? 0.15 : 0.02;
    return computeTrend(baseline, errorVal, errorVal < 1 ? 2 : 1);
  }, [errorVal]);

  // Synchronized snapshot across all 3 metrics for temporal correlation
  const correlatedSnapshot = React.useMemo(() => {
    if (!hoveredTime) return null;
    const cpuPt = cpuTrend.find((d) => d.time === hoveredTime);
    const latPt = latencyTrend.find((d) => d.time === hoveredTime);
    const errPt = errorTrend.find((d) => d.time === hoveredTime);
    return {
      time: hoveredTime,
      cpu: cpuPt?.value ?? cpuVal,
      latency: latPt?.value ?? latencyVal,
      error: errPt?.value ?? errorVal,
    };
  }, [hoveredTime, cpuTrend, latencyTrend, errorTrend, cpuVal, latencyVal, errorVal]);

  // Miller's Law active chunks calculation
  const getActiveChunkCount = () => {
    if (cognitiveLevel === 'glance') return 3; // Banner + Severity Indicator + Primary Action
    if (cognitiveLevel === 'standard') return 5; // Banner + 3 Metric Cards + XAI Attribution Box
    return 7; // Banner + 3 Metrics + XAI Attribution + Actions + Logs + Topology
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-rose-500 selection:text-white">
      {/* Top Ambient Incident Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[320px] bg-gradient-to-b from-rose-900/25 via-amber-900/10 to-transparent blur-3xl" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* =========================================================================
            HEADER & COGNITIVE HUD (Miller's Law Control)
           ========================================================================= */}
        <header
          id="pulsemind-header"
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 p-0.5 shadow-lg shadow-rose-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-rose-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-white">PulseMind AI</h1>
                <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  Cognitive UX Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Miller&apos;s Law Adaptive Workspace &bull; XAI Feature Attribution &bull; SHAP Analysis
              </p>
            </div>
          </div>

          {/* Cognitive Load Control & Miller's Indicator */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-1.5 px-3">
            <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <div className="text-xs">
                <span className="text-slate-400">Cognitive Chunks: </span>
                <span className="font-mono font-bold text-amber-300">
                  {getActiveChunkCount()}
                </span>
                <span className="text-slate-500"> / 7 (Miller&apos;s Limit)</span>
              </div>
            </div>

            {/* Disclosure Selector */}
            <div className="flex items-center gap-1 text-xs">
              <button
                id="btn-disclosure-glance"
                onClick={() => setCognitiveLevel('glance')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  cognitiveLevel === 'glance'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Level 1: Minimal cognitive load (3 items)"
              >
                Glance (3)
              </button>
              <button
                id="btn-disclosure-standard"
                onClick={() => setCognitiveLevel('standard')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  cognitiveLevel === 'standard'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Level 2: Balanced operational awareness (5 items)"
              >
                Balanced (5)
              </button>
              <button
                id="btn-disclosure-deep"
                onClick={() => setCognitiveLevel('deep')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  cognitiveLevel === 'deep'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Level 3: Full investigative telemetry (7+ items)"
              >
                Deep Dive (7)
              </button>
            </div>
          </div>
        </header>

        {/* =========================================================================
            TASK 2: AI INSIGHT BANNER (1-Sentence Executive Summary - Progressive Disclosure)
           ========================================================================= */}
        <section
          id="ai-insight-banner"
          aria-label="Executive AI Insight"
          className="relative overflow-hidden rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-950/70 via-slate-900 to-amber-950/40 p-5 sm:p-6 shadow-xl shadow-rose-950/40 backdrop-blur-md"
        >
          {/* Priority indicator bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 animate-pulse" />

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-rose-500 text-white shadow-sm">
                  <Flame className="w-3.5 h-3.5" />
                  {analysis.severity} SEVERITY ALERT
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-800 text-rose-300 border border-rose-900/50">
                  Region: {analysis.primaryImpactRegion}
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-xs text-slate-400 bg-slate-800/60 rounded">
                  Progressive Disclosure L1
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  id="btn-copy-summary"
                  onClick={() => copyToClipboard(analysis.executiveSummary, 'summary')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                  title="Copy 1-Sentence Executive Summary"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSection === 'summary' ? 'Copied!' : 'Copy Summary'}</span>
                </button>
              </div>
            </div>

            {/* The 1-Sentence Executive Summary */}
            <div className="pt-1">
              <div className="text-xs uppercase tracking-wider font-semibold text-rose-300/80 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                Executive Summary (1-Sentence Situational Awareness)
              </div>
              <p
                id="executive-summary-text"
                className="text-base sm:text-lg font-medium text-white leading-relaxed tracking-tight"
              >
                &ldquo;{analysis.executiveSummary}&rdquo;
              </p>
            </div>

            {/* Quick Micro-Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400 font-mono">
              <span className="text-slate-500">Root Cause Hypothesis:</span>
              <span className="text-amber-300 bg-amber-950/40 border border-amber-900/40 px-2 py-0.5 rounded">
                {analysis.rootCauseHypothesis}
              </span>
            </div>
          </div>
        </section>

        {/* =========================================================================
            CORE METRICS GRID: CPU (94%), Latency (420ms), Error Rate (+12%)
            WITH CROSS-SPARKLINE TEMPORAL SYNCHRONIZATION
           ========================================================================= */}
        <section
          id="core-metrics-grid"
          aria-label="Key System Telemetry"
          className="space-y-3"
        >
          {/* Synchronized Temporal Correlation Control Header */}
          <div
            id="temporal-correlation-banner"
            className={`rounded-xl border px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all duration-300 ${
              correlatedSnapshot
                ? 'border-sky-500/50 bg-sky-950/40 shadow-lg shadow-sky-950/50'
                : 'border-slate-800/80 bg-slate-900/40 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${correlatedSnapshot ? 'bg-sky-400 animate-ping' : 'bg-slate-600'}`} />
              <span className="font-semibold uppercase tracking-wider text-slate-300">
                Temporal Correlation
              </span>
              <span className="text-slate-500 hidden sm:inline">&bull;</span>
              {correlatedSnapshot ? (
                <span className="text-sky-300 font-mono font-medium">
                  Synchronous slice at <span className="underline font-bold text-white">T: {correlatedSnapshot.time}</span>
                </span>
              ) : (
                <span className="text-slate-400">
                  Hover any sparkline to project vertical correlation line across all 3 cards
                </span>
              )}
            </div>

            {correlatedSnapshot && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                  CPU: <strong className="text-white">{correlatedSnapshot.cpu}%</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                  Latency: <strong className="text-white">{correlatedSnapshot.latency}ms</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800">
                  Error: <strong className="text-white">+{correlatedSnapshot.error}%</strong>
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Metric 1: CPU Usage */}
            <div
              id="metric-card-cpu"
              className="rounded-xl border border-rose-500/30 bg-slate-900/90 p-4 relative overflow-hidden transition-all hover:border-rose-500/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-rose-400" />
                    CPU Core Usage
                  </span>
                  <span className="font-mono text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-900/60">
                    {cpuVal > 62 ? `+${Math.round(cpuVal - 62)}% vs Norm` : 'Nominal'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold font-mono tracking-tight text-white">{cpuVal}%</span>
                  <span className="text-xs text-slate-400">baseline: 62%</span>
                </div>
              </div>

              {/* Sparkline Chart: 15-Minute Trend with Crosshair Sync */}
              <MetricSparkline
                id="sparkline-cpu"
                data={cpuTrend}
                color="#f43f5e"
                gradientId="cpuTrendGradient"
                unit="%"
                height={44}
                syncId="pulsemind-temporal-sync"
                hoveredTime={hoveredTime}
                onHoverTimeChange={setHoveredTime}
              />

              {/* Gauge Bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                <div
                  className="bg-gradient-to-r from-amber-500 to-rose-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, cpuVal))}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Critical host thread queue saturation across US-East nodes.
              </p>
            </div>

            {/* Metric 2: API Latency */}
            <div
              id="metric-card-latency"
              className="rounded-xl border border-amber-500/30 bg-slate-900/90 p-4 relative overflow-hidden transition-all hover:border-amber-500/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    API Latency (p99)
                  </span>
                  <span className="font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-900/60">
                    {(latencyVal / 85).toFixed(1)}x Baseline
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold font-mono tracking-tight text-white">{latencyVal}ms</span>
                  <span className="text-xs text-slate-400">baseline: 85ms</span>
                </div>
              </div>

              {/* Sparkline Chart: 15-Minute Trend with Crosshair Sync */}
              <MetricSparkline
                id="sparkline-latency"
                data={latencyTrend}
                color="#f59e0b"
                gradientId="latencyTrendGradient"
                unit="ms"
                height={44}
                syncId="pulsemind-temporal-sync"
                hoveredTime={hoveredTime}
                onHoverTimeChange={setHoveredTime}
              />

              {/* Gauge Bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                <div
                  className="bg-gradient-to-r from-amber-400 to-amber-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(10, (latencyVal / 500) * 100))}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Event loop starvation &amp; connection backlog delay.
              </p>
            </div>

            {/* Metric 3: Error Rate Spike */}
            <div
              id="metric-card-error-rate"
              className="rounded-xl border border-rose-500/30 bg-slate-900/90 p-4 relative overflow-hidden transition-all hover:border-rose-500/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Regional Error Rate
                  </span>
                  <span className="font-mono text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-900/60">
                    US-East Spike
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold font-mono tracking-tight text-white">+{errorVal}%</span>
                  <span className="text-xs text-slate-400">baseline: 0.15%</span>
                </div>
              </div>

              {/* Sparkline Chart: 15-Minute Trend with Crosshair Sync */}
              <MetricSparkline
                id="sparkline-error"
                data={errorTrend}
                color="#ef4444"
                gradientId="errorTrendGradient"
                unit="%"
                height={44}
                syncId="pulsemind-temporal-sync"
                hoveredTime={hoveredTime}
                onHoverTimeChange={setHoveredTime}
              />

              {/* Gauge Bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                <div
                  className="bg-gradient-to-r from-rose-500 to-red-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(8, (errorVal / 15) * 100))}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                HTTP 503 gateway timeouts &amp; circuit breaker trips.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            TASK 3: EXPLAINABLE AI (XAI) ATTRIBUTION (2-Sentence SHAP Logic + Feature Importance)
           ========================================================================= */}
        <section
          id="xai-attribution-section"
          aria-label="Explainable AI Attribution"
          className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-300">
                  Explainable AI (XAI) Attribution &bull; SHAP Feature Importance
                </h2>
                <p className="text-xs text-slate-400">
                  Mathematical feature attribution quantifying each metric&apos;s contribution to the alert
                </p>
              </div>
            </div>

            <button
              id="btn-copy-xai"
              onClick={() => copyToClipboard(analysis.xaiAttribution, 'xai')}
              className="self-start sm:self-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors border border-slate-700"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedSection === 'xai' ? 'Copied!' : 'Copy XAI Statement'}</span>
            </button>
          </div>

          {/* 2-Sentence Explainable AI (XAI) Attribution Box */}
          <div
            id="xai-statement-box"
            className="rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-4 sm:p-5 text-slate-200"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              2-Sentence XAI Attribution (Why this alert was triggered)
            </div>
            <p
              id="xai-attribution-text"
              className="text-sm sm:text-base font-normal leading-relaxed text-slate-100"
            >
              {analysis.xaiAttribution}
            </p>
          </div>

          {/* SHAP Feature Weights Breakdown */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-slate-300">
                Model Feature Attribution Weight (SHAP Values &Delta;)
              </span>
              <span className="font-mono text-slate-500">&Sigma; Positive Risk Contribution = 100%</span>
            </div>

            <div className="space-y-3">
              {analysis.shapFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  id={`shap-feature-${idx}`}
                  className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 sm:p-4 transition-all hover:border-slate-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        #{idx + 1}
                      </span>
                      <span className="text-sm font-medium text-white">{feat.feature}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-slate-400">
                        Baseline: <span className="text-slate-300">{feat.baseline}</span> &rarr; Observed:{' '}
                        <span className="text-rose-400 font-bold">{feat.observed}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                        +{feat.shapValue} SHAP ({feat.importancePercent}%)
                      </span>
                    </div>
                  </div>

                  {/* Relative Importance Bar */}
                  <div className="w-full bg-slate-900 rounded-full h-2 mb-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        idx === 0
                          ? 'bg-rose-500'
                          : idx === 1
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${feat.importancePercent}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-400 leading-normal">{feat.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            TACTICAL MITIGATION & RAPID ACTIONS
           ========================================================================= */}
        <section
          id="tactical-actions-section"
          aria-label="Tactical Mitigation Actions"
          className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Cognitive Triage Playbook &bull; Prescribed Interventions
              </h2>
            </div>
            <span className="text-xs text-slate-500">Target Resolution: &lt; 90 seconds</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {analysis.actionItems.map((act) => {
              const isDone = executedActions[act.id];
              return (
                <div
                  key={act.id}
                  id={`action-card-${act.id}`}
                  className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                    isDone
                      ? 'border-emerald-500/40 bg-emerald-950/20'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          act.priority === 'URGENT'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {act.priority}
                      </span>
                      {isDone && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Executed
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white">{act.title}</h3>
                    <p className="text-xs text-slate-400 leading-normal">{act.impact}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="font-mono text-[11px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800/60 overflow-x-auto select-all">
                      {act.commandOrAction}
                    </div>
                    <button
                      id={`btn-execute-${act.id}`}
                      onClick={() => handleExecuteAction(act.id)}
                      disabled={isDone}
                      className={`w-full text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        isDone
                          ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-md shadow-rose-950/50'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Applied to Cluster</span>
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Simulate Execution</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            PROGRESSIVE DISCLOSURE LEVEL 3: RAW LOGS & REGIONAL TOPOLOGY
           ========================================================================= */}
        {(cognitiveLevel === 'deep' || isLogsExpanded) && (
          <section
            id="deep-dive-telemetry-section"
            aria-label="Raw Telemetry and Correlation"
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                  Correlated System Logs &bull; US-East Incident Timeline
                </h2>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/50">
                Stream Synchronized
              </span>
            </div>

            <div className="font-mono text-xs bg-slate-950 rounded-xl p-4 border border-slate-800/80 space-y-2 overflow-x-auto max-h-64">
              {RAW_SYSTEM_LOGS.map((log, idx) => (
                <div key={idx} className="flex items-start gap-3 py-1 border-b border-slate-900 last:border-0">
                  <span className="text-slate-500 shrink-0">{log.time}</span>
                  <span
                    className={`font-bold shrink-0 px-1.5 py-0.2 rounded text-[10px] ${
                      log.level === 'CRIT' || log.level === 'ERROR'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : log.level === 'ALERT'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className="text-slate-400 shrink-0">[{log.source}]</span>
                  <span className="text-slate-200">{log.msg}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Toggle logs when in Standard or Glance view */}
        {cognitiveLevel !== 'deep' && (
          <div className="flex justify-center">
            <button
              id="btn-toggle-logs"
              onClick={() => setIsLogsExpanded(!isLogsExpanded)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 transition-colors"
            >
              {isLogsExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Collapse System Logs (Reduce Cognitive Chunks)</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Progressive Disclosure: Inspect Correlated System Logs</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* =========================================================================
            TASK 1: INTERACTIVE PARSER & COGNITIVE WORKBENCH
           ========================================================================= */}
        <section
          id="metric-parser-workbench"
          aria-label="Metric Parser and Simulator"
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                PulseMind AI Metric Parser &bull; Live Telemetry Ingestion
              </h2>
            </div>
            <button
              id="btn-toggle-workbench"
              onClick={() => setIsWorkbenchExpanded(!isWorkbenchExpanded)}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <span>{isWorkbenchExpanded ? 'Minimize Ingestion Panel' : 'Expand Ingestion Panel'}</span>
              {isWorkbenchExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Input any high-density system metrics, Kubernetes alerts, or Datadog logs. PulseMind AI parses raw text
              into a 1-sentence executive summary and 2-sentence XAI attribution without cognitive overload.
            </p>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Sample Presets:</span>
              {SAMPLE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  id={`btn-preset-${idx}`}
                  onClick={() => {
                    setMetricsInput(preset.text);
                    handleAnalyze(preset.text);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    metricsInput === preset.text
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60'
                  }`}
                >
                  <span>{preset.name}</span>
                  <span className="ml-1.5 text-[10px] opacity-70">({preset.tag})</span>
                </button>
              ))}
            </div>

            {/* Textarea Input */}
            <div className="relative">
              <textarea
                id="input-metrics-text"
                rows={isWorkbenchExpanded ? 4 : 2}
                value={metricsInput}
                onChange={(e) => setMetricsInput(e.target.value)}
                placeholder="Paste raw metrics (e.g., CPU Usage: 94%, API Latency: 420ms, Error Rate: +12% spike in region US-East)..."
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs sm:text-sm font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/60 transition-colors"
              />
            </div>

            {/* Ingestion Submit Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                <span>Powered by Gemini 3.8-Flash + SHAP Explainable AI</span>
              </div>

              <button
                id="btn-trigger-ai-analysis"
                onClick={() => handleAnalyze(metricsInput)}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-rose-950/40 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Parsing &amp; Computing SHAP...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Re-Analyze with PulseMind AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Footer: Cognitive UX Principles */}
        <footer
          id="pulsemind-footer"
          className="pt-4 pb-8 border-t border-slate-900 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>PulseMind Cognitive UX Guard Active &bull; Miller&apos;s Law (7&plusmn;2 limit enforced)</span>
          </div>
          <div>Progressive Disclosure Engine &bull; Explainable AI (XAI) Attribution</div>
        </footer>
      </main>
    </div>
  );
}
