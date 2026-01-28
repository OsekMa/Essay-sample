
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ESSAY_CATEGORIES } from '../constants';
import Breadcrumbs from '../components/Breadcrumbs';

type SampleIndexFile = {
  source: string;
  generatedAt: string;
  files: Array<{
    path: string;
    bytes: number;
    ext: string;
    name: string;
  }>;
};

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const getFileTypeLabel = (ext: string) => {
  const lower = (ext || '').toLowerCase();
  if (lower === '.pdf') return 'PDF';
  if (lower === '.doc' || lower === '.docx') return 'DOCX';
  return lower.replace('.', '').toUpperCase();
};

const Card: React.FC<{ title: string; subtitle?: string; rightSlot?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  subtitle,
  rightSlot,
  children,
}) => {
  return (
    <section className="bg-white border rounded-3xl overflow-hidden">
      <div className="px-6 py-5 border-b bg-slate-50 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          {subtitle ? <p className="text-xs text-slate-500 truncate mt-1">{subtitle}</p> : null}
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
      <div className="p-6 md:p-8">{children}</div>
    </section>
  );
};

type MindNode = {
  id: string;
  label: string;
  level: number;
  children: MindNode[];
};

const renderPrettyMarkdown = (raw: string | null) => {
  if (!raw) return null;

  const lines = raw.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (!listBuffer.length) return;
    const items = listBuffer.slice();
    listBuffer = [];
    blocks.push(
      <ul key={`list-${blocks.length}`} className="list-disc pl-6 space-y-1 text-slate-700">
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>,
    );
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      return;
    }

    // headings
    if (line.startsWith('# ')) {
      flushList();
      blocks.push(
        <h4 key={`h1-${index}`} className="text-xl font-bold text-slate-900 mt-2">
          {line.slice(2)}
        </h4>,
      );
      return;
    }
    if (line.startsWith('## ')) {
      flushList();
      blocks.push(
        <h5 key={`h2-${index}`} className="text-base font-bold text-slate-900 mt-4">
          {line.slice(3)}
        </h5>,
      );
      return;
    }
    if (line.startsWith('### ')) {
      flushList();
      blocks.push(
        <h6 key={`h3-${index}`} className="text-sm font-bold text-slate-900 mt-3">
          {line.slice(4)}
        </h6>,
      );
      return;
    }

    // lists
    if (line.startsWith('- ')) {
      listBuffer.push(line.slice(2));
      return;
    }

    // paragraph
    flushList();
    blocks.push(
      <p key={`p-${index}`} className="text-slate-700 leading-relaxed">
        {line}
      </p>,
    );
  });

  flushList();
  return <div className="space-y-3">{blocks}</div>;
};

const parseStrategyToTree = (raw: string | null): MindNode | null => {
  if (!raw) return null;
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;

  const root: MindNode = { id: 'root', label: '写作策略', level: 0, children: [] };
  const stack: MindNode[] = [root];
  let autoId = 0;

  for (const line of lines) {
    let level: number | null = null;
    let label = line;

    if (line.startsWith('# ')) {
      level = 1;
      label = line.slice(2).trim();
    } else if (line.startsWith('## ')) {
      level = 2;
      label = line.slice(3).trim();
    } else if (line.startsWith('### ')) {
      level = 3;
      label = line.slice(4).trim();
    } else if (line.startsWith('- ')) {
      // treat bullet as a leaf under current stack top
      level = stack[stack.length - 1]?.level + 1;
      label = line.slice(2).trim();
    }

    if (level === null) continue;

    while (stack.length && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1] ?? root;
    const node: MindNode = { id: `n${autoId++}`, label, level, children: [] };
    parent.children.push(node);
    stack.push(node);
  }

  // If the first line is a H1, use it as root label
  const first = lines[0];
  if (first.startsWith('# ')) root.label = first.slice(2).trim();
  return root;
};

const flattenTree = (node: MindNode) => {
  const nodes: Array<{ node: MindNode; depth: number }> = [];
  const edges: Array<{ from: string; to: string }> = [];
  const walk = (n: MindNode, depth: number) => {
    nodes.push({ node: n, depth });
    for (const c of n.children) {
      edges.push({ from: n.id, to: c.id });
      walk(c, depth + 1);
    }
  };
  walk(node, 0);
  return { nodes, edges };
};

const MindMap: React.FC<{ tree: MindNode }> = ({ tree }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const draggingRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  const layout = useMemo(() => {
    const { nodes, edges } = flattenTree(tree);

    // Tidy-ish layout: y determined by subtree leaf order (prevents stacking/overlap)
    const positions = new Map<string, { x: number; y: number; w: number; h: number; depth: number }>();
    const linesById = new Map<string, string[]>();

    const colWidth = 300;
    const levelGapX = 80; // extra spacing between columns for long labels
    const rowGapY = 18;

    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

    const splitToLines = (label: string, maxChars: number) => {
      // keep full text; wrap by words when possible, fallback to char wrap
      const words = label.split(/\s+/).filter(Boolean);
      if (!words.length) return [''];
      const lines: string[] = [];
      let current = '';
      for (const w of words) {
        const next = current ? `${current} ${w}` : w;
        if (next.length <= maxChars) {
          current = next;
        } else {
          if (current) lines.push(current);
          // if a single word is too long, hard wrap it
          if (w.length > maxChars) {
            for (let i = 0; i < w.length; i += maxChars) {
              lines.push(w.slice(i, i + maxChars));
            }
            current = '';
          } else {
            current = w;
          }
        }
      }
      if (current) lines.push(current);
      return lines;
    };

    const sizeForNode = (label: string, depth: number) => {
      // approximate width based on character count; then wrap into lines and set height
      const base = depth === 0 ? 320 : 300;
      const w = clamp(base + Math.max(0, label.length - 18) * 6, depth === 0 ? 320 : 300, 620);
      const maxChars = Math.max(16, Math.floor((w - 32) / 7)); // ~7px per char at 13px font
      const lines = splitToLines(label, maxChars);
      const lineH = 16;
      const padY = 14;
      const h = padY * 2 + lines.length * lineH;
      return { w, h, lines };
    };

    let leafIndex = 0;
    const calc = (n: MindNode, depth: number): number => {
      const { w, h, lines } = sizeForNode(n.label, depth);
      const x = depth * (colWidth + levelGapX);
      linesById.set(n.id, lines);

      if (!n.children.length) {
        // stack leaf nodes vertically without overlap using their own height
        const y = leafIndex;
        leafIndex += h + rowGapY;
        positions.set(n.id, { x, y, w, h, depth });
        return y + h / 2;
      }

      const childCenters = n.children.map((c) => calc(c, depth + 1));
      const center = (childCenters[0] + childCenters[childCenters.length - 1]) / 2;
      positions.set(n.id, { x, y: center - h / 2, w, h, depth });
      return center;
    };

    calc(tree, 0);

    // Compute bounds
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of positions.values()) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + p.w);
      maxY = Math.max(maxY, p.y + p.h);
    }
    const contentW = Math.max(1, maxX - minX);
    const contentH = Math.max(1, maxY - minY);

    return { nodes, edges, positions, linesById, bounds: { minX, minY, maxX, maxY, contentW, contentH } };
  }, [tree]);

  // Fit-to-view on first render / tree change
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const pad = 24;
    const fit = Math.min((width - pad * 2) / layout.bounds.contentW, (height - pad * 2) / layout.bounds.contentH, 1);
    const initialZoom = Number.isFinite(fit) && fit > 0 ? fit : 1;
    setZoom(initialZoom);

    // center content
    const contentPxW = layout.bounds.contentW * initialZoom;
    const contentPxH = layout.bounds.contentH * initialZoom;
    setPan({
      x: (width - contentPxW) / 2 - layout.bounds.minX * initialZoom,
      y: (height - contentPxH) / 2 - layout.bounds.minY * initialZoom,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree]);

  const clampZoom = (z: number) => Math.max(0.4, Math.min(2.6, z));
  const zoomIn = () => setZoom((z) => clampZoom(z * 1.15));
  const zoomOut = () => setZoom((z) => clampZoom(z / 1.15));
  const resetView = () => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const pad = 24;
    const fit = Math.min((width - pad * 2) / layout.bounds.contentW, (height - pad * 2) / layout.bounds.contentH, 1);
    const initialZoom = Number.isFinite(fit) && fit > 0 ? fit : 1;
    setZoom(initialZoom);
    const contentPxW = layout.bounds.contentW * initialZoom;
    const contentPxH = layout.bounds.contentH * initialZoom;
    setPan({
      x: (width - contentPxW) / 2 - layout.bounds.minX * initialZoom,
      y: (height - contentPxH) / 2 - layout.bounds.minY * initialZoom,
    });
  };

  const onWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const nextZoom = clampZoom(zoom * (e.deltaY > 0 ? 0.92 : 1.08));
    const scale = nextZoom / zoom;
    setZoom(nextZoom);
    setPan((p) => ({
      x: mouseX - (mouseX - p.x) * scale,
      y: mouseY - (mouseY - p.y) * scale,
    }));
  };

  const onMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    draggingRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  };
  const onMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!draggingRef.current) return;
    const d = draggingRef.current;
    setPan({ x: d.panX + (e.clientX - d.startX), y: d.panY + (e.clientY - d.startY) });
  };
  const endDrag = () => {
    draggingRef.current = null;
  };

  return (
    <div className="w-full rounded-3xl border bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
        <div className="text-xs text-slate-500">滚轮缩放 · 拖拽平移</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            className="text-xs font-bold px-3 py-2 rounded-xl border bg-white hover:bg-slate-50"
          >
            -
          </button>
          <button
            type="button"
            onClick={zoomIn}
            className="text-xs font-bold px-3 py-2 rounded-xl border bg-white hover:bg-slate-50"
          >
            +
          </button>
          <button
            type="button"
            onClick={resetView}
            className="text-xs font-bold px-3 py-2 rounded-xl border bg-white hover:bg-slate-50"
          >
            适配
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative h-[520px] md:h-[620px] overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      >
        <svg width="100%" height="100%" className="block select-none">
          <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
            {/* edges */}
            {layout.edges.map((e) => {
              const from = layout.positions.get(e.from);
              const to = layout.positions.get(e.to);
              if (!from || !to) return null;
              const x1 = from.x + from.w;
              const y1 = from.y + from.h / 2;
              const x2 = to.x;
              const y2 = to.y + to.h / 2;
              const dx = Math.max(60, (x2 - x1) * 0.5);
              return (
                <path
                  key={`${e.from}-${e.to}`}
                  d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                />
              );
            })}

            {/* nodes */}
            {layout.nodes.map(({ node, depth }) => {
              const p = layout.positions.get(node.id);
              if (!p) return null;
              const isRoot = depth === 0;
              const lines = layout.linesById.get(node.id) ?? [node.label];
              const lineH = 16;
              return (
                <g key={node.id}>
                  <rect
                    x={p.x}
                    y={p.y}
                    rx="16"
                    ry="16"
                    width={p.w}
                    height={p.h}
                    fill={isRoot ? '#2563EB' : '#FFFFFF'}
                    stroke={isRoot ? '#1D4ED8' : '#E2E8F0'}
                  />
                  <text
                    x={p.x + 16}
                    y={p.y + 22}
                    fill={isRoot ? '#FFFFFF' : '#0F172A'}
                    fontSize="13"
                    fontWeight={isRoot ? 700 : 600}
                  >
                    {lines.map((line, i) => (
                      <tspan key={i} x={p.x + 16} dy={i === 0 ? 0 : lineH}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};

const parseFaq = (raw: string | null) => {
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items: Array<{ q: string; a: string }> = [];
  let currentQ: string | null = null;
  let currentA: string | null = null;

  const flush = () => {
    if (currentQ && currentA) items.push({ q: currentQ, a: currentA });
    currentQ = null;
    currentA = null;
  };

  for (const line of lines) {
    if (line.toLowerCase() === 'faq') continue;
    if (line.startsWith('Q:')) {
      flush();
      currentQ = line.slice(2).trim();
      continue;
    }
    if (line.startsWith('A:')) {
      currentA = line.slice(2).trim();
      continue;
    }
    // fallback: append
    if (currentA) currentA += ` ${line}`;
  }
  flush();
  return items;
};

const splitBodyAndReferences = (raw: string | null) => {
  if (!raw) return { title: null as string | null, body: null as string | null, refs: [] as string[] };
  const lines = raw.split(/\r?\n/);
  const firstNonEmptyIdx = lines.findIndex((l) => l.trim().length > 0);
  const titleLine = firstNonEmptyIdx >= 0 ? lines[firstNonEmptyIdx].trim() : null;

  const refIdx = lines.findIndex((l) => l.trim().toLowerCase() === 'references');
  if (refIdx === -1) {
    return { title: titleLine, body: raw, refs: [] };
  }
  const body = lines.slice(0, refIdx).join('\n').trim();
  const refs = lines
    .slice(refIdx + 1)
    .map((l) => l.trim())
    .filter(Boolean);
  return { title: titleLine, body, refs };
};

const Level4_Topic: React.FC = () => {
  const { categorySlug, workSlug, topicSlug } = useParams<{ categorySlug: string; workSlug: string; topicSlug: string }>();
  const [mdContents, setMdContents] = useState<Record<string, string>>({});
  const [strategyView, setStrategyView] = useState<'mindmap' | 'list'>('mindmap');
  const [sampleIndex, setSampleIndex] = useState<SampleIndexFile | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);

  const category = ESSAY_CATEGORIES.find(c => c.slug === categorySlug);
  const work = category?.works.find(w => w.slug === workSlug);
  const topic = work?.topics.find(t => t.slug === topicSlug);

  useEffect(() => {
    if (topic) {
      loadSampleContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic?.id]);

  const loadText = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.text();
  };

  const loadSampleContent = async () => {
    setLoadingSample(true);
    setSampleError(null);
    try {
      const indexRes = await fetch('/essay-sample/index.json', { cache: 'no-store' });
      if (!indexRes.ok) throw new Error(`index.json: ${indexRes.status} ${indexRes.statusText}`);
      const index = (await indexRes.json()) as SampleIndexFile;
      setSampleIndex(index);

      const mdFiles = (index.files || []).filter((f) => (f.ext || '').toLowerCase() === '.md');
      const pairs = await Promise.all(
        mdFiles.map(async (f) => {
          const text = await loadText(`/essay-sample/${f.path}`);
          return [f.path, text] as const;
        }),
      );
      setMdContents(Object.fromEntries(pairs));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSampleError(
        `无法加载桌面样本数据（public/essay-sample）。请先运行 npm run dev（会自动同步），或手动执行 npm run sync:sample。错误：${msg}`,
      );
      setSampleIndex(null);
      setMdContents({});
    } finally {
      setLoadingSample(false);
    }
  };

  if (!topic || !work || !category) return <div className="text-center py-20 text-slate-500">Topic not found</div>;

  const attachments =
    sampleIndex?.files?.filter((f) => {
      const ext = (f.ext || '').toLowerCase();
      return ext === '.pdf' || ext === '.docx' || ext === '.doc';
    }) ?? [];

  const mdPaths = Object.keys(mdContents);
  const summaryPath = mdPaths.find((p) => p.toLowerCase() === 'summary.md') ?? null;
  const strategyPath = mdPaths.find((p) => p.toLowerCase() === 'writing_strategy.md') ?? null;
  const faqPath = mdPaths.find((p) => p.toLowerCase() === 'faq.md' || p.toLowerCase().includes('faq')) ?? null;
  const bodyPath =
    mdPaths.find(
      (p) =>
        p !== summaryPath &&
        p !== strategyPath &&
        p !== faqPath &&
        p.toLowerCase().endsWith('.md'),
    ) ?? null;

  const faqItems = parseFaq(faqPath ? mdContents[faqPath] : null);
  const bodySplit = splitBodyAndReferences(bodyPath ? mdContents[bodyPath] : null);
  const bodyRefs = bodySplit.refs;
  const refPdfs =
    (sampleIndex?.files || []).filter((f) => f.ext === '.pdf' && (f.path || '').toLowerCase().startsWith('references/')) ?? [];

  const strategyTree = parseStrategyToTree(strategyPath ? mdContents[strategyPath] : null);

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <Breadcrumbs items={[
        { label: category.title, path: `/essay-example/${category.slug}` },
        { label: work.title, path: `/essay-example/${category.slug}/${work.slug}` },
        { label: 'Current Topic', path: '#' }
      ]} />

      <article className="bg-white border rounded-3xl p-8 md:p-12 shadow-sm">
        <header className="mb-10 border-b pb-10">
          <h1 className="text-3xl md:text-4xl font-bold serif mb-6 leading-tight">
            {topic.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Expert Verified
            </div>
            <span>•</span>
            <span>8 min read</span>
            <span>•</span>
            <span>Updated March 2024</span>
          </div>
        </header>

        <section className="prose prose-slate max-w-none mb-12">
          <p className="text-xl text-slate-600 italic leading-relaxed mb-8">
            "{topic.excerpt}"
          </p>
          
          <div className="bg-slate-50 p-6 rounded-2xl border mb-10">
             <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
               <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               Analysis Focus
             </h3>
             <p className="text-slate-600 text-sm">
               This essay explores the intersection of {topic.keywords.join(', ')} within {work.title}. It examines how {work.author} uses these elements to reinforce the primary themes of the novel.
             </p>
          </div>

          <h2 className="text-2xl font-bold mb-4">Sample Introduction Snippet</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            In the glittering world of West Egg, {work.author} presents a visual landscape where colors carry the weight of character aspirations and moral decay. Central to Jay Gatsby's obsessive pursuit of the past is the pulsating green light, a beckoning beacon that stands across the bay on Daisy Buchanan’s dock. This light serves as more than just a navigational marker; it is the physical manifestation of Gatsby’s "extraordinary gift for hope," embodying both the enchantment of the future and the impossibility of reclaiming a lost history...
          </p>
        </section>

        <div className="border-t pt-10 mt-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">Sample</span> Results & Materials
            </h2>
            <button 
              onClick={loadSampleContent}
              disabled={loadingSample}
              className="text-xs bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg font-bold transition disabled:opacity-50"
            >
              {loadingSample ? 'Loading...' : 'Refresh Sample'}
            </button>
          </div>

          {loadingSample ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-3/4"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
              <div className="h-4 bg-slate-100 rounded w-5/6"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {sampleError ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-6 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap">
                  {sampleError}
                </div>
              ) : (
                <>
                  {/* 1) 写作策略 */}
                  <Card
                    title="写作策略"
                    subtitle="从桌面 essay sample 读取并排版"
                    rightSlot={
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setStrategyView('mindmap')}
                          className={`text-xs font-bold px-3 py-2 rounded-xl border transition ${
                            strategyView === 'mindmap'
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          思维导图
                        </button>
                        <button
                          type="button"
                          onClick={() => setStrategyView('list')}
                          className={`text-xs font-bold px-3 py-2 rounded-xl border transition ${
                            strategyView === 'list'
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          列表
                        </button>
                        {sampleIndex?.generatedAt ? (
                          <span className="text-xs text-slate-500 ml-2 hidden md:inline">
                            同步时间 {new Date(sampleIndex.generatedAt).toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                    }
                  >
                    {!strategyPath ? (
                      <p className="text-sm text-slate-600">未找到 `writing_strategy.md`。</p>
                    ) : strategyView === 'mindmap' ? (
                      strategyTree ? (
                        <MindMap tree={strategyTree} />
                      ) : (
                        <p className="text-sm text-slate-600">写作策略内容为空，无法生成思维导图。</p>
                      )
                    ) : (
                      renderPrettyMarkdown(mdContents[strategyPath] ?? null)
                    )}
                  </Card>

                  {/* 2) 概览 */}
                  <Card title="概览">
                    {summaryPath ? (
                      renderPrettyMarkdown(mdContents[summaryPath] ?? null)
                    ) : (
                      <p className="text-sm text-slate-600">未找到 `Summary.md`。</p>
                    )}
                  </Card>

                  {/* 3) 论文正文 */}
                  <Card title="论文正文" subtitle={bodySplit.title ?? undefined}>
                    {bodyPath ? (
                      <div className="bg-slate-100 rounded-3xl p-4 md:p-6">
                        <div className="mx-auto max-w-[820px] bg-white rounded-2xl shadow-sm border">
                          {/* faux PDF header */}
                          <div className="px-8 pt-10 pb-6 border-b">
                            <h2 className="text-2xl font-bold text-slate-900 text-center leading-tight">
                              {bodySplit.title ?? '论文正文'}
                            </h2>
                            <p className="text-center text-xs text-slate-500 mt-3">
                              Paper-style layout (PDF-like)
                            </p>
                          </div>
                          {/* faux PDF body */}
                          <div className="px-8 md:px-12 py-10">
                            <div className="text-[15px] leading-7 text-slate-800 font-serif">
                              {/* paragraphs with indentation */}
                              {(bodySplit.body ?? '')
                                .split(/\r?\n/)
                                .map((l) => l.trim())
                                .filter(Boolean)
                                .map((p, idx) => (
                                  <p key={idx} className="mb-4 indent-8">
                                    {p}
                                  </p>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">未找到论文正文的 MD 文件。</p>
                    )}
                  </Card>

                  {/* 4) FAQ */}
                  <Card title="FAQ">
                    {faqItems.length ? (
                      <div className="space-y-3">
                        {faqItems.map((it, idx) => (
                          <details key={idx} className="rounded-2xl border bg-slate-50 px-5 py-4">
                            <summary className="cursor-pointer font-semibold text-slate-900">
                              {it.q}
                            </summary>
                            <p className="mt-3 text-slate-700 leading-relaxed">{it.a}</p>
                          </details>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">未找到 `FAQ.md` 或内容格式不符合 Q:/A:。</p>
                    )}
                  </Card>

                  {/* 5) 参考文献（正文里的 References + PDF 列表） */}
                  <Card title="参考文献">
                    <div className="space-y-6">
                      {bodyRefs.length ? (
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-3">引用条目</h4>
                          <ul className="space-y-2 text-sm text-slate-700 list-disc pl-6">
                            {bodyRefs.map((r, idx) => (
                              <li key={idx}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600">正文未包含 References 段落。</p>
                      )}

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-3">PDF 下载</h4>
                        {refPdfs.length ? (
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {refPdfs.map((f) => (
                              <li key={f.path} className="rounded-2xl border bg-slate-50 p-4 hover:bg-slate-100 transition">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-900 truncate">{f.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{f.path}</p>
                                  </div>
                                  <span className="text-xs text-slate-500 shrink-0">{formatBytes(f.bytes)}</span>
                                </div>
                                <div className="mt-3">
                                  <a
                                    href={`/essay-sample/${f.path}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
                                  >
                                    打开/下载
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8L10 18" />
                                    </svg>
                                  </a>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-600">未找到 references/ 下的 PDF。</p>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* 其他附件（doc/docx）保留一个紧凑下载区 */}
                  {attachments.filter((a) => a.ext !== '.pdf').length ? (
                    <Card title="其他附件下载">
                      <ul className="space-y-3 text-sm">
                        {attachments
                          .filter((a) => a.ext !== '.pdf')
                          .map((f) => (
                            <li
                              key={f.path}
                              className="flex items-center justify-between gap-4 rounded-2xl border bg-slate-50 px-5 py-4 hover:bg-slate-100 transition"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 text-xs font-bold">
                                  {getFileTypeLabel(f.ext)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900 truncate">{f.name}</p>
                                  <p className="text-xs text-slate-500 truncate">{f.path}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs text-slate-500">{formatBytes(f.bytes)}</span>
                                <a
                                  href={`/essay-sample/${f.path}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 text-white px-4 py-2 text-xs font-bold hover:bg-blue-700 transition"
                                >
                                  下载
                                </a>
                              </div>
                            </li>
                          ))}
                      </ul>
                    </Card>
                  ) : null}
                </>
              )}
            </div>
          )}
        </div>
      </article>

      <div className="mt-12 flex flex-col md:flex-row gap-6">
        <div className="flex-grow bg-blue-600 text-white p-8 rounded-3xl">
          <h3 className="text-xl font-bold mb-4">Need help writing this?</h3>
          <p className="text-blue-100 mb-6">Our AI essay writer can help you expand this outline into a full draft, citing specific quotes from {work.title}.</p>
          <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg">
            Start Writing with AI
          </button>
        </div>
        <div className="w-full md:w-80 bg-white border p-6 rounded-3xl">
          <h4 className="font-bold mb-4">Related Topics</h4>
          <ul className="space-y-4">
            {work.topics.filter(t => t.id !== topic.id).map(t => (
              <li key={t.id}>
                <a href={`#/essay-example/${category.slug}/${work.slug}/${t.slug}`} className="text-sm text-slate-600 hover:text-blue-600 flex gap-2 items-start">
                  <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0"></div>
                  {t.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Level4_Topic;
