'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

// ─── localStorage keys ───
const LS_DESIGNS = 'xhs-cover-designs';
const LS_INPUT = 'xhs-cover-input';
const LS_CTYPE = 'xhs-cover-ctype';

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function saveToStorage(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

// ─── FONT — cross-platform Chinese font stack ───
const FONT_STACK = `"PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Source Han Sans SC", -apple-system, sans-serif`;
const FONT_STACK_SERIF = `"Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", "SimSun", serif`;

// ─── 2026 小红书设计色板 ───
const PALETTES: Record<string, { bg: string; bg2: string; title: string; subtitle: string; accent: string; accent2: string; name: string }> = {
  cream: {
    bg: '#F9F6F0', bg2: '#F0EBE3',
    title: '#3D3D3D', subtitle: '#8A8078',
    accent: '#C17A4B', accent2: '#8FA8B6',
    name: '奶油高级感',
  },
  dopamine: {
    bg: '#002FA7', bg2: '#FFF8F0',
    title: '#FFFFFF', subtitle: '#E8E0D8',
    accent: '#FF6B6B', accent2: '#FFF8F0',
    name: '多巴胺撞色',
  },
  chinoiserie: {
    bg: '#F7F5F0', bg2: '#EDE8DC',
    title: '#2F4F6F', subtitle: '#8A8A7F',
    accent: '#C23531', accent2: '#C8B578',
    name: '新中式',
  },
  dark: {
    bg: '#1A1A2E', bg2: '#2D2D3F',
    title: '#FFFFFF', subtitle: '#B8B8C7',
    accent: '#4FC3F7', accent2: '#98C1D9',
    name: '极简暗黑',
  },
  natural: {
    bg: '#F5F0E6', bg2: '#EDE6D8',
    title: '#4A6A4A', subtitle: '#8A8A7F',
    accent: '#7CB342', accent2: '#C17A4B',
    name: '自然温润',
  },
  journal: {
    bg: '#FCFAF2', bg2: '#F0EDE0',
    title: '#5D4037', subtitle: '#8D7A6E',
    accent: '#FF8A80', accent2: '#FFF5C2',
    name: '手账便签',
  },
};

interface CoverDesign {
  title: string;
  subtitle: string;
  palette: string;
  layout: string;
  style_note: string;
}

// ─── Canvas 渲染引擎 ───

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function renderCover(
  canvas: HTMLCanvasElement,
  design: CoverDesign,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = 750;
  const H = 1000;
  canvas.width = W;
  canvas.height = H;
  ctx.clearRect(0, 0, W, H);

  const p = PALETTES[design.palette] || PALETTES.cream;
  const layout = design.layout || 'magazine';
  const title = design.title || '封面标题';
  const subtitle = design.subtitle || '';

  // ── 1. 背景 ──
  drawBackground(ctx, W, H, p, layout);

  // ── 2. 装饰元素 ──
  drawDecorations(ctx, W, H, p, design);

  // ── 3. 标题 ──
  const fontSize = layout === 'magazine' || layout === 'minimal' ? Math.floor(W * 0.10) : Math.floor(W * 0.11);
  drawTitle(ctx, title, p, W, H, fontSize, layout);

  // ── 4. 副标题 ──
  if (subtitle) {
    drawSubtitle(ctx, subtitle, p, W, H, fontSize);
  }

  // ── 5. Footer ──
  drawFooter(ctx, W, H, p, design);
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  p: typeof PALETTES.cream,
  layout: string,
) {
  switch (layout) {
    case 'dopamine': {
      // Split background: left color block + right neutral
      const splitX = W * 0.55;
      ctx.fillStyle = p.bg;
      ctx.fillRect(0, 0, splitX, H);
      ctx.fillStyle = p.bg2;
      ctx.fillRect(splitX, 0, W - splitX, H);
      // Diagonal cut between colors
      ctx.beginPath();
      ctx.moveTo(splitX - 20, 0);
      ctx.lineTo(splitX + 20, H);
      ctx.strokeStyle = hexToRgba(p.title, 0.08);
      ctx.lineWidth = 1;
      ctx.stroke();
      break;
    }
    case 'chinoiserie': {
      // Xuan paper texture simulation (subtle noise gradient)
      ctx.fillStyle = p.bg;
      ctx.fillRect(0, 0, W, H);
      // Subtle vertical paper grain
      for (let i = 0; i < W; i += 3) {
        const alpha = Math.random() * 0.04;
        ctx.fillStyle = `rgba(0,0,0,${alpha})`;
        ctx.fillRect(i, 0, 1, H);
      }
      // Border frame
      ctx.strokeStyle = hexToRgba(p.title, 0.15);
      ctx.lineWidth = 1.5;
      const m = 30;
      ctx.strokeRect(m, m, W - m * 2, H - m * 2);
      break;
    }
    case 'dark': {
      // Dark background with subtle gradient
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, p.bg);
      grad.addColorStop(1, '#24243E');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      // Subtle grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(i * W / 5, 0);
        ctx.lineTo(i * W / 5, H);
        ctx.stroke();
      }
      break;
    }
    case 'journal': {
      // Notebook paper background
      ctx.fillStyle = p.bg;
      ctx.fillRect(0, 0, W, H);
      // Horizontal lines
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 0.5;
      for (let y = 60; y < H; y += 30) {
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(W - 40, y);
        ctx.stroke();
      }
      // Left red margin line
      ctx.strokeStyle = 'rgba(200,50,50,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, 0);
      ctx.lineTo(50, H);
      ctx.stroke();
      break;
    }
    case 'minimal': {
      // Clean cream background with thin frame
      ctx.fillStyle = p.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = hexToRgba(p.title, 0.08);
      ctx.lineWidth = 1;
      const m = 35;
      ctx.strokeRect(m, m, W - m * 2, H - m * 2);
      break;
    }
    default: { // magazine / natural
      // Cream gradient (magazine style)
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, p.bg);
      grad.addColorStop(0.5, p.bg2 || p.bg);
      grad.addColorStop(1, p.bg);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      // Subtle noise overlay at bottom for magazine feel
      break;
    }
  }
}

function drawDecorations(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  p: typeof PALETTES.cream,
  design: CoverDesign,
) {
  const layout = design.layout;

  switch (layout) {
    case 'dopamine': {
      // Color block accent
      ctx.fillStyle = hexToRgba(p.accent, 0.25);
      ctx.beginPath();
      ctx.arc(W * 0.88, H * 0.12, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hexToRgba(p.accent, 0.12);
      ctx.beginPath();
      ctx.arc(W * 0.1, H * 0.85, 40, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'chinoiserie': {
      // Seal stamp (red square with character)
      const sealSize = 50;
      const sealX = W - sealSize - 40;
      const sealY = 40;
      ctx.fillStyle = p.accent;
      ctx.fillRect(sealX, sealY, sealSize, sealSize);
      ctx.fillStyle = '#F7F5F0';
      ctx.font = `500 ${sealSize * 0.5}px ${FONT_STACK_SERIF}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('封', sealX + sealSize / 2, sealY + sealSize / 2);
      break;
    }
    case 'dark': {
      // Accent line
      ctx.fillStyle = p.accent;
      ctx.fillRect(W * 0.08, H * 0.13, W * 0.08, 3);
      // Bottom accent bar
      const barH = 1;
      ctx.fillStyle = hexToRgba(p.title, 0.08);
      ctx.fillRect(W * 0.08, H - 40, W * 0.84, barH);
      break;
    }
    case 'journal': {
      // Sticky note element
      const noteW = 300;
      const noteH = 180;
      const noteX = W - noteW - 50;
      const noteY = H * 0.65;
      // Sticky note shadow
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(noteX + 3, noteY + 3, noteW, noteH);
      // Sticky note body
      ctx.fillStyle = p.accent2;
      ctx.beginPath();
      ctx.roundRect(noteX, noteY, noteW, noteH, 4);
      ctx.fill();
      // Tape effect (top of sticky note)
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(noteX + noteW * 0.35, noteY - 8, noteW * 0.3, 16);
      // Text on sticky note
      ctx.fillStyle = hexToRgba(p.title, 0.15);
      ctx.font = `400 ${18}px ${FONT_STACK_SERIF}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✨ 小编推荐', noteX + noteW / 2, noteY + noteH * 0.45);
      ctx.fillText('点击收藏不迷路', noteX + noteW / 2, noteY + noteH * 0.72);
      break;
    }
    case 'minimal': {
      // Thin horizontal line
      ctx.strokeStyle = hexToRgba(p.title, 0.12);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W * 0.15, H * 0.68);
      ctx.lineTo(W * 0.85, H * 0.68);
      ctx.stroke();
      break;
    }
    default: {
      // Magazine: small accent mark top-left
      ctx.fillStyle = p.accent;
      ctx.fillRect(W * 0.08, H * 0.07, 3, 24);
      // Small label
      ctx.fillStyle = hexToRgba(p.accent, 0.1);
      ctx.fillRect(W * 0.08, H * 0.92, 80, 22);
      ctx.fillStyle = hexToRgba(p.accent, 0.7);
      ctx.font = `400 ${12}px ${FONT_STACK}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📖 推荐阅读', W * 0.08 + 40, H * 0.92 + 11);
      break;
    }
  }
}

function drawTitle(
  ctx: CanvasRenderingContext2D,
  title: string,
  p: typeof PALETTES.cream,
  W: number, H: number,
  fontSize: number,
  layout: string,
) {
  const maxWidth = layout === 'dopamine' ? W * 0.65 : W * 0.78;
  ctx.textBaseline = 'top';

  // Measure and wrap
  ctx.font = `bold ${fontSize}px ${FONT_STACK}`;
  
  let titleLines: string[] = [];
  let currentLine = '';
  let lineWidth = 0;
  
  for (const char of title) {
    const cw = ctx.measureText(char).width;
    if (lineWidth + cw > maxWidth && currentLine.length > 0) {
      titleLines.push(currentLine);
      currentLine = char;
      lineWidth = cw;
    } else {
      currentLine += char;
      lineWidth += cw;
    }
    if (titleLines.length >= 2) break;
  }
  if (currentLine && titleLines.length < 3) {
    titleLines.push(currentLine);
  }
  titleLines = titleLines.slice(0, 2);

  const lineH = fontSize * 1.25;
  const totalH = titleLines.length * lineH;
  
  // Position based on layout
  let startX: number;
  let startY: number;
  let align: CanvasTextAlign;

  switch (layout) {
    case 'dopamine':
      startX = W * 0.07;
      startY = H * 0.28;
      align = 'left';
      break;
    case 'chinoiserie':
      startX = W / 2;
      startY = H * 0.28;
      align = 'center';
      break;
    case 'dark':
      startX = W * 0.12;
      startY = H * 0.25;
      align = 'left';
      break;
    case 'journal':
      startX = W * 0.12;
      startY = H * 0.18;
      align = 'left';
      break;
    case 'minimal':
      startX = W / 2;
      startY = H * 0.25;
      align = 'center';
      break;
    default: // magazine
      startX = W * 0.12;
      startY = H * 0.25;
      align = 'left';
      break;
  }

  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.font = `bold ${fontSize}px ${FONT_STACK}`;

  // Tight tracking for big titles (negative letter spacing)
  if (layout === 'magazine' || layout === 'dark') {
    // Use smaller tracking by adjusting per-char width
  }

  titleLines.forEach((line, i) => {
    const y = startY + i * lineH;
    
    // Subtle shadow for readability on complex backgrounds
    if (layout === 'dark' || layout === 'dopamine') {
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;
    }
    
    ctx.fillStyle = p.title;
    
    if (layout === 'dopamine') {
      // Overlapping text across color boundary — use white with thin outline
      const letterSpacing = -2;
      let cx = startX;
      for (const char of line) {
        ctx.fillText(char, cx, y);
        cx += ctx.measureText(char).width + letterSpacing;
      }
    } else {
      ctx.fillText(line, startX, y);
    }
    
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // Underline decoration for magazine layout
    if (layout === 'magazine' && i === titleLines.length - 1) {
      const lineW = ctx.measureText(line).width;
      const uY = y + fontSize + 6;
      ctx.fillStyle = hexToRgba(p.accent, 0.4);
      ctx.fillRect(startX, uY, Math.min(lineW, W * 0.35), 4);
    }
  });

  // Return the line information for subtitle positioning (not needed externally, but useful)
}

function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  subtitle: string,
  p: typeof PALETTES.cream,
  W: number, H: number,
  titleFontSize: number,
) {
  const subSize = Math.floor(titleFontSize * 0.38);
  ctx.font = `500 ${subSize}px ${FONT_STACK}`;
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.fillStyle = p.subtitle;
  ctx.textAlign = 'left';
  ctx.fillText(subtitle, W * 0.12, H * 0.58);
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  p: typeof PALETTES.cream,
  design: CoverDesign,
) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
      ctx.font = `400 ${12}px ${FONT_STACK}`;
  ctx.fillStyle = hexToRgba(p.subtitle, 0.35);
  ctx.fillText(`xhs-cover  ⦁  ${PALETTES[design.palette]?.name || ''}`, W / 2, H * 0.97);
}

// ─── React Component ───

interface CoverCanvasProps {
  design: CoverDesign;
  onRender?: (dataUrl: string) => void;
}

function CoverCanvas({ design, onRender }: CoverCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgSrc, setImgSrc] = useState('');

  useEffect(() => {
    if (canvasRef.current) {
      renderCover(canvasRef.current, design);
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setImgSrc(dataUrl);
      onRender?.(dataUrl);
    }
  }, [design]);

  const download = useCallback(() => {
    const link = document.createElement('a');
    link.download = `xhs-cover-${design.palette}-${Date.now()}.png`;
    link.href = imgSrc;
    link.click();
  }, [imgSrc, design]);

  const pal = PALETTES[design.palette] || PALETTES.cream;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white">
        <canvas
          ref={canvasRef}
          width={750}
          height={1000}
          className="w-[225px] h-[300px] sm:w-[260px] sm:h-[347px] object-contain"
          style={{ display: 'none' }}
        />
        {imgSrc && (
          <img
            src={imgSrc}
            alt={design.style_note}
            className="w-[225px] h-[300px] sm:w-[260px] sm:h-[347px] object-contain"
          />
        )}
        {/* Design style badge */}
        <div
          className="absolute top-2 left-2 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] font-medium flex items-center gap-1.5 shadow-sm"
          style={{
            backgroundColor: hexToRgba(pal.bg, 0.75),
            color: pal.title,
          }}
        >
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ backgroundColor: pal.accent }}
          />
          {pal.name}
        </div>
      </div>
      <div className="text-xs text-gray-500 text-center max-w-[260px] leading-relaxed">
        {design.style_note}
      </div>
      <button
        onClick={download}
        className="w-full max-w-[180px] py-2 rounded-xl bg-[#FF2442] text-white text-xs font-medium
          hover:bg-[#e01e38] transition-colors active:scale-[0.98]"
      >
        ⬇️ 下载封面图
      </button>
    </div>
  );
}

// ─── Layout helpers ───

const LAYOUT_INFO: Record<string, { emoji: string; name: string }> = {
  magazine: { emoji: '📰', name: '杂志风' },
  dopamine: { emoji: '🎨', name: '撞色风' },
  chinoiserie: { emoji: '🍃', name: '新中式' },
  dark: { emoji: '🌙', name: '暗黑风' },
  natural: { emoji: '🌿', name: '自然风' },
  journal: { emoji: '📝', name: '便签风' },
  minimal: { emoji: '✨', name: '极简风' },
};

// ─── Main Page ───

const CONTENT_TYPES = [
  { value: '', label: '自动识别' },
  { value: '好物推荐', label: '🛍️ 好物' },
  { value: '穿搭分享', label: '👗 穿搭' },
  { value: '美妆护肤', label: '💄 美妆' },
  { value: '美食探店', label: '🍜 美食' },
  { value: '旅行攻略', label: '✈️ 旅行' },
  { value: '家居好物', label: '🏠 家居' },
];

export default function CoverPage() {
  const [input, setInput] = useState(loadFromStorage(LS_INPUT, ''));
  const [contentType, setContentType] = useState(loadFromStorage(LS_CTYPE, ''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [designs, setDesigns] = useState<CoverDesign[]>(loadFromStorage(LS_DESIGNS, []));
  const [activeTab, setActiveTab] = useState(0);
  const [dataUrls, setDataUrls] = useState<string[]>([]);
  const [mode, setMode] = useState<'text' | 'design'>('text');
  const [isFromStorage, setIsFromStorage] = useState(() => !!loadFromStorage(LS_DESIGNS, []).length);

  // Persist designs + input to localStorage on success
  useEffect(() => {
    if (designs.length > 0 && dataUrls.length === designs.length) {
      saveToStorage(LS_DESIGNS, designs);
      saveToStorage(LS_INPUT, input);
      saveToStorage(LS_CTYPE, contentType);
    }
  }, [dataUrls, designs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError('');
    setDesigns([]);
    setDataUrls([]);

    try {
      const res = await fetch('/api/cover/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: input.trim(),
          contentType: contentType.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '生成失败，请重试');
        return;
      }

      setDesigns(data.designs || []);
      setActiveTab(0);
    } catch {
      setError('网络异常，请检查连接后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRender = (index: number) => (dataUrl: string) => {
    setDataUrls(prev => {
      const next = [...prev];
      next[index] = dataUrl;
      return next;
    });
  };

  const downloadAll = () => {
    dataUrls.forEach((url, i) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.download = `xhs-cover-${i + 1}-${Date.now()}.png`;
        link.href = url;
        link.click();
      }, i * 300);
    });
  };

  const clearAll = () => {
    localStorage.removeItem(LS_DESIGNS);
    localStorage.removeItem(LS_INPUT);
    localStorage.removeItem(LS_CTYPE);
    setDesigns([]);
    setDataUrls([]);
    setInput('');
    setContentType('');
    setActiveTab(0);
    setIsFromStorage(false);
  };

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Hero */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 bg-[#FFF0F0] text-[#FF2442] text-xs font-medium px-4 py-1.5 rounded-full mb-4">
          🎨 2026 小红书封面趋势美学
        </div>
        <h1 className="text-[28px] font-bold text-gray-900 leading-tight">
          输入文案
        </h1>
        <h2 className="text-[28px] font-bold text-[#FF2442] leading-tight mt-1">
          30秒生成3版潮流封面 ✨
        </h2>
        <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
          告别Canva手动折腾<br/>奶油高级感 · 多巴胺撞色 · 新中式 · 暗黑风 · 自然温润 · 便签风
        </p>
      </div>

      {/* Trust / Feature row */}
      <div className="flex justify-center gap-5 mb-5 text-xs text-gray-400 flex-wrap">
        <span>⚡ 30秒出图</span>
        <span>🎨 7种高级风格</span>
        <span>🆓 每日免费5次</span>
        <span>⬇️ 一键下载PNG</span>
        <span>📐 3:4标准尺寸</span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="xhs-card mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            笔记内容 / 产品描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="粘贴你的小红书文案、产品名称，或者几句话描述...&#10;&#10;例如：&#10;一件能穿三个季节的百搭白衬衫，面料柔软不起皱，版型超显瘦&#10;&#10;或者：&#10;3分钟快手早餐食谱，不用开火的懒人必备"
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#FF2442] focus:ring-1 focus:ring-[#FF2442] outline-none resize-none text-sm transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            内容类型
          </label>
          <div className="flex flex-wrap gap-2">
            {CONTENT_TYPES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setContentType(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  contentType === opt.value
                    ? 'bg-[#FF2442] text-white border-[#FF2442]'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-full py-3 rounded-xl bg-[#FF2442] text-white font-medium text-sm
            hover:bg-[#e01e38] disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              AI正在设计封面...
            </span>
          ) : (
            '🎨 生成3版封面'
          )}
        </button>
      </form>

      {/* Loading */}
      {loading && (
        <div className="xhs-card text-center py-12">
          <div className="text-4xl mb-3 animate-bounce">🎨</div>
          <p className="text-gray-500 text-sm loading-pulse">
            AI正在设计3版不同风格的封面...
          </p>
          <p className="text-gray-400 text-xs mt-2">
            基于2026小红书流行趋势 · 7种风格可选
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="xhs-card border border-red-100 bg-red-50/50">
          <div className="flex items-start gap-3">
            <span className="text-xl">😅</span>
            <div>
              <p className="text-sm font-medium text-red-700">设计失败了</p>
              <p className="text-xs text-red-500 mt-1">{error}</p>
              <button
                onClick={() => { setError(''); handleSubmit({ preventDefault: () => {} } as React.FormEvent); }}
                className="mt-2 text-xs text-red-600 underline"
              >
                点击重试
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {designs.length > 0 && !loading && (
        <div className="fade-in space-y-4">
          {/* Style Tab Switcher */}
          <div className="flex items-center gap-1.5 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 overflow-x-auto">
            {designs.map((d, i) => {
              const info = LAYOUT_INFO[d.layout] || { emoji: '🎨', name: d.layout };
              return (
                <button
                  key={i}
                  onClick={() => setActiveTab(i)}
                  className={`flex-shrink-0 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                    activeTab === i
                      ? 'bg-[#FF2442] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {info.emoji} {info.name}
                </button>
              );
            })}
            {isFromStorage && (
              <button
                onClick={clearAll}
                className="ml-auto text-[10px] text-gray-300 hover:text-gray-500 px-2 py-1 transition-colors"
                title="清空上次记录"
              >
                ✕ 清除
              </button>
            )}
          </div>

          {/* Cover Display */}
          <div className="flex justify-center">
            {designs.map((d, i) => (
              <div key={i} className={i === activeTab ? 'block' : 'hidden'}>
                <CoverCanvas design={d} onRender={handleRender(i)} />
              </div>
            ))}
          </div>

          {/* Download All */}
          {dataUrls.length === 3 && (
            <div className="flex gap-3">
              <button
                onClick={downloadAll}
                className="flex-1 py-3 rounded-xl bg-[#FF2442] text-white text-sm font-medium
                  hover:bg-[#e01e38] transition-colors active:scale-[0.98]"
              >
                ⬇️ 下载全部3版
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm
                  text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
              >
                🔄 重新生成
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && designs.length === 0 && !error && (
        <div className="text-center py-10 text-gray-400">
          <div className="text-5xl mb-3">🎨</div>
          <p className="text-sm font-medium text-gray-600">30秒搞定小红书封面</p>
          <p className="text-xs mt-2 text-gray-400 max-w-xs mx-auto leading-relaxed">
            ① 粘贴文案 → ② 选内容类型 → ③ 下载封面<br/>
            <span className="text-[#FF2442]">比Canva快10倍，每天免费5次</span>
          </p>
          <div className="mt-6 flex justify-center gap-3 text-xs text-gray-300">
            <span>📰 杂志风</span>
            <span>🎨 撞色风</span>
            <span>🍃 新中式</span>
            <span>🌙 暗黑风</span>
            <span>🌿 自然风</span>
            <span>📝 便签风</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-8 space-y-2">
        <div className="text-xs text-gray-300">
          xhs-cover · 2026小红书封面趋势 · 文案+封面一站式创作 ✨
        </div>
        <div className="text-[10px] text-gray-200">
          每天免费5次 · 7种高级风格 · 和文案助手完美配合
        </div>
      </div>
    </main>
  );
}
