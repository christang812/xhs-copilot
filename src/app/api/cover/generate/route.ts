import { NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';

const PALETTES = [
  {
    id: 'cream', name: '奶油高级感',
    bg: '#F9F6F0', bg2: '#F0EBE3',
    title: '#3D3D3D', subtitle: '#8A8078',
    accent: '#C17A4B', accent2: '#8FA8B6',
    desc: '低对比暖色调，舒适感强，适合好物推荐/生活方式/家居',
  },
  {
    id: 'dopamine', name: '多巴胺撞色',
    bg: '#002FA7', bg2: '#FFF8F0',
    title: '#FFFFFF', subtitle: '#E8E0D8',
    accent: '#FF6B6B', accent2: '#FFF8F0',
    desc: '高饱和主色+中性辅色，大胆吸睛，适合穿搭/美妆/年轻向内容',
  },
  {
    id: 'chinoiserie', name: '新中式',
    bg: '#F7F5F0', bg2: '#EDE8DC',
    title: '#2F4F6F', subtitle: '#8A8A7F',
    accent: '#C23531', accent2: '#C8B578',
    desc: '东方色彩+现代排版，留白大气，适合文化/护肤/茶饮/旅行',
  },
  {
    id: 'dark', name: '极简暗黑',
    bg: '#1A1A2E', bg2: '#2D2D3F',
    title: '#FFFFFF', subtitle: '#B8B8C7',
    accent: '#4FC3F7', accent2: '#98C1D9',
    desc: '深色背景+霓虹强调色，科技感强，适合数码/效率/男性向内容',
  },
  {
    id: 'natural', name: '自然温润',
    bg: '#F5F0E6', bg2: '#EDE6D8',
    title: '#4A6A4A', subtitle: '#8A8A7F',
    accent: '#7CB342', accent2: '#C17A4B',
    desc: '大地色系暖调，自然舒适，适合美食/旅行/日常分享',
  },
  {
    id: 'journal', name: '手账便签',
    bg: '#FCFAF2', bg2: '#F0EDE0',
    title: '#5D4037', subtitle: '#8D7A6E',
    accent: '#FF8A80', accent2: '#FFF5C2',
    desc: '笔记本纹理背景+便签元素，人情味足，适合学习/阅读/日常',
  },
];

const LAYOUTS = [
  { id: 'magazine', name: '杂志风', desc: '杂志化栅格排版，信息层级清晰，留白充分' },
  { id: 'dopamine', name: '撞色风', desc: '双色块分割，对比强烈，视觉冲击力强' },
  { id: 'chinoiserie', name: '新中式', desc: '宣纸纹理+印章点缀，东方美学当代化' },
  { id: 'dark', name: '暗黑风', desc: '深色底+霓虹强调色，科技感/高级感' },
  { id: 'journal', name: '便签风', desc: '手账本+便签纸，有温度的人情味设计' },
  { id: 'minimal', name: '极简风', desc: '最大留白+细线装饰，极致高级感' },
];

const SYSTEM_PROMPT = `你是一位小红书封面设计专家，精通2025-2026年最新审美趋势。

## 2026小红书封面核心设计原则
1. **大字标题主义** — 标题占画面50-70%，超粗黑体，只放1-2行核心文案
2. **舒适感配色** — 奶油色/低对比/哑光质感，避免荧光色和纯色铺满
3. **杂志化排版** — 信息分层清晰，留白≥20%，拒绝"填满"
4. **人情味回归** — 手写感/便签元素加分的不要错过
5. **差异化设计** — 避免Canva模板感，每版风格应有明显区别

## 色板库（6种风格）
${PALETTES.map(p => `- ${p.name}(${p.id}): ${p.desc}`).join('\n')}

## 版式类型（7种）
${LAYOUTS.map(l => `- ${l.name}(${l.id}): ${l.desc}`).join('\n')}

## 避雷清单（绝对不能出现的设计）
- ❌ 荧光渐变大面积铺满
- ❌ 白色描边文字
- ❌ 超过3个emoji堆砌
- ❌ 标题超过12个字
- ❌ 3D字效/立体文字阴影
- ❌ 不留白的塞满排版
- ❌ 饱和度>90%的正红/正绿大面积使用

## 输出格式（严格JSON数组，3个元素，风格必须完全不同）：
[
  {
    "title": "封面标题（6-12字，带emoji或数字，有吸引力）",
    "subtitle": "副标题（2-8字补充说明，可不带）",
    "palette": "从色板库选一个id（每版不同）",
    "layout": "从版式类型选一个id（每版不同）",
    "style_note": "这版封面的设计风格说明（15字以内）"
  }
]

确保3版封面的色板、版式、风格都不同。第一版选最适合用户内容的主流风格，第二版选反差风格，第三版选大胆风格。`;

export async function POST(request: Request) {
  try {
    const { input, contentType } = await request.json();

    if (!input?.trim()) {
      return NextResponse.json({ error: '请输入内容' }, { status: 400 });
    }

    const userPrompt = `请为以下内容设计3版小红书封面：

内容：${input}
${contentType ? `内容类型：${contentType}` : ''}

要求：
1. 3版封面使用不同的色板和版式
2. 标题紧扣内容核心，有吸引力
3. 每版都有明确的设计定位
4. 避雷清单中的问题绝对不能出现

输出严格的JSON数组。`;

    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.85,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      return NextResponse.json(
        { error: `AI服务异常 (${response.status})` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'AI返回为空' }, { status: 502 });
    }

    // Parse JSON
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    let designs;
    try {
      designs = JSON.parse(jsonStr);
      if (!Array.isArray(designs)) {
        designs = [designs];
      }
    } catch {
      // Fallback: return 3 diverse default designs
      return NextResponse.json({
        designs: [
          {
            title: '✨ 好物推荐',
            subtitle: '必入清单',
            palette: 'cream',
            layout: 'magazine',
            style_note: '奶油高级感·杂志风',
          },
          {
            title: '🔥 热门测评',
            subtitle: '不踩雷指南',
            palette: 'dopamine',
            layout: 'dopamine',
            style_note: '多巴胺撞色·吸睛',
          },
          {
            title: '📖 深度干货',
            subtitle: '建议收藏',
            palette: 'chinoiserie',
            layout: 'chinoiserie',
            style_note: '新中式·东方美学',
          },
        ]
      });
    }

    // Normalize — ensure we only use valid palettes and layouts
    const validPaletteIds = PALETTES.map(p => p.id);
    const validLayoutIds = LAYOUTS.map(l => l.id);

    const normalized = designs.slice(0, 3).map((d: any, i: number) => ({
      title: (d.title || `封面版本 ${i + 1}`).slice(0, 20),
      subtitle: (d.subtitle || '').slice(0, 15),
      palette: validPaletteIds.includes(d.palette) ? d.palette : validPaletteIds[i % validPaletteIds.length],
      layout: validLayoutIds.includes(d.layout) ? d.layout : validLayoutIds[i % validLayoutIds.length],
      style_note: (d.style_note || '小红书爆款封面风格').slice(0, 25),
    }));

    return NextResponse.json({ designs: normalized, input });
  } catch (error: any) {
    console.error('Cover API error:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后再试' },
      { status: 500 }
    );
  }
}
