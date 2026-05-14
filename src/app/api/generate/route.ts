import { NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';

export async function POST(request: Request) {
  try {
    const { productDesc, targetAudience, keyPoints, tone } = await request.json();

    if (!productDesc) {
      return NextResponse.json({ error: '请填写产品描述' }, { status: 400 });
    }

    const systemPrompt = `你是一位小红书爆款文案写作专家。你有10年社交媒体营销经验，深谙小红书平台的用户心理和内容规则。

你的任务是根据用户提供的产品/服务信息，生成3版不同风格的小红书文案。

## 小红书文案黄金法则：
1. **标题**：吸引眼球，带emoji，带数字，制造好奇/痛点/反差
2. **正文结构**：
   - 开头Hook（1-2句）：痛点共鸣/惊人发现/个人故事
   - 正文（3-5段）：短段落（每段不超过3行），多使用emoji，口语化
   - 价值输出：具体使用场景、效果对比、省钱/省时/省心
   - 结尾引导：收藏/关注/评论区交流
3. **标签**：3-5个精准标签，包含大词+长尾词
4. **风格**：像朋友推荐，不做广告腔

## 输出格式（严格JSON数组）：
[
  {
    "title": "标题（带emoji）",
    "body": "正文（分段，每段用\\n\\n分隔）",
    "hashtags": "#标签1 #标签2 #标签3",
    "style_note": "这版文案的风格说明"
  }
]

生成3版不同风格的文案：第一版走心故事型、第二版干货教程型、第三版对比测评型。`;

    const userPrompt = `请为以下产品/服务生成3版小红书文案：

产品描述：${productDesc}
${targetAudience ? `目标受众：${targetAudience}` : ''}
${keyPoints ? `核心卖点：${keyPoints}` : ''}
${tone ? `语气偏好：${tone}` : ''}

请严格按照JSON数组格式输出。`;

    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 4000,
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

    // Parse the JSON from the response
    // The model might wrap it in markdown code blocks
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    let versions;
    try {
      versions = JSON.parse(jsonStr);
      // Ensure it's an array
      if (!Array.isArray(versions)) {
        versions = [versions];
      }
    } catch {
      // If JSON parsing fails, return the raw text
      return NextResponse.json({
        versions: [{
          title: 'AI生成结果',
          body: content,
          hashtags: '',
          style_note: '原始格式（解析异常）'
        }]
      });
    }

    // Validate and normalize each version
    const normalized = versions.map((v: any, i: number) => ({
      title: v.title || `版本 ${i + 1}`,
      body: v.body || v.content || '',
      hashtags: v.hashtags || v.tags || '',
      style_note: v.style_note || v.style || '',
    }));

    return NextResponse.json({ versions: normalized });
  } catch (error: any) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后再试' },
      { status: 500 }
    );
  }
}
