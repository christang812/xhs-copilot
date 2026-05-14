'use client';

import { useState } from 'react';

interface Version {
  title: string;
  body: string;
  hashtags: string;
  style_note: string;
}

export default function Home() {
  const [productDesc, setProductDesc] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [tone, setTone] = useState('');
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [dailyCount, setDailyCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productDesc.trim()) return;

    setLoading(true);
    setError('');
    setVersions([]);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productDesc: productDesc.trim(),
          targetAudience: targetAudience.trim(),
          keyPoints: keyPoints.trim(),
          tone: tone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '生成失败，请重试');
        return;
      }

      setVersions(data.versions || []);
      setDailyCount(c => c + 1);
      setActiveTab(0);
    } catch {
      setError('网络异常，请检查连接后重试');
    } finally {
      setLoading(false);
    }
  };

  const copyAll = (v: Version) => {
    const text = `📝 ${v.title}\n\n${v.body}\n\n${v.hashtags}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(activeTab);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const remaining = Math.max(0, 5 - dailyCount);

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">✍️</div>
        <h1 className="text-2xl font-bold text-gray-900">
          小红书AI文案助手
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          输入产品描述，AI一键生成3版爆款文案
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="xhs-card mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            产品/服务描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={productDesc}
            onChange={(e) => setProductDesc(e.target.value)}
            placeholder="例如：一款AI智能翻译耳机，支持100种语言实时翻译，续航8小时，仅重28克..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#FF2442] focus:ring-1 focus:ring-[#FF2442] outline-none resize-none text-sm transition-colors"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              目标受众
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="如：职场白领、宝妈、学生..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF2442] focus:ring-1 focus:ring-[#FF2442] outline-none text-sm transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              语气偏好
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF2442] focus:ring-1 focus:ring-[#FF2442] outline-none text-sm transition-colors bg-white"
            >
              <option value="">自动选择</option>
              <option value="亲切温暖">亲切温暖</option>
              <option value="专业干练">专业干练</option>
              <option value="幽默风趣">幽默风趣</option>
              <option value="真诚走心">真诚走心</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            核心卖点（可选）
          </label>
          <input
            type="text"
            value={keyPoints}
            onChange={(e) => setKeyPoints(e.target.value)}
            placeholder="如：价格优势、独家功能、限时优惠..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF2442] focus:ring-1 focus:ring-[#FF2442] outline-none text-sm transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !productDesc.trim()}
          className="w-full py-3 rounded-xl bg-[#FF2442] text-white font-medium text-sm
            hover:bg-[#e01e38] disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              正在生成...
            </span>
          ) : (
            `✨ 生成3版文案 ${dailyCount > 0 ? `(今日剩余${remaining}次)` : ''}`
          )}
        </button>
      </form>

      {/* Daily Limit Notice */}
      {dailyCount > 0 && (
        <p className="text-xs text-gray-400 text-center -mt-4 mb-6">
          今日已用 {dailyCount}/5 次
        </p>
      )}

      {/* Loading State */}
      {loading && (
        <div className="xhs-card text-center py-12">
          <div className="text-4xl mb-3 animate-bounce">✍️</div>
          <p className="text-gray-500 text-sm loading-pulse">
            AI正在为您创作3版不同风格的文案...
          </p>
          <p className="text-gray-400 text-xs mt-2">
            走心故事型 · 干货教程型 · 对比测评型
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="xhs-card border border-red-100 bg-red-50/50">
          <div className="flex items-start gap-3">
            <span className="text-xl">😅</span>
            <div>
              <p className="text-sm font-medium text-red-700">生成失败了</p>
              <p className="text-xs text-red-500 mt-1">{error}</p>
              <button
                onClick={handleSubmit}
                className="mt-2 text-xs text-red-600 underline"
              >
                点击重试
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {versions.length > 0 && !loading && (
        <div className="fade-in space-y-4">
          {/* Tab Switcher */}
          <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
            {versions.map((v, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                  activeTab === i
                    ? 'bg-[#FF2442] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {['💝 走心', '📚 干货', '🔍 测评'][i] || `版本${i + 1}`}
              </button>
            ))}
          </div>

          {/* Version Card */}
          {versions.map((v, i) => (
            <div
              key={i}
              className={`xhs-card fade-in ${i === activeTab ? 'block' : 'hidden'}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Style Badge */}
              {v.style_note && (
                <div className="inline-block px-3 py-1 bg-[#FFF0F0] text-[#FF2442] text-xs rounded-full mb-3">
                  {v.style_note}
                </div>
              )}

              {/* Title */}
              <h2 className="text-lg font-bold text-gray-900 leading-snug mb-3">
                {v.title}
              </h2>

              {/* Body */}
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-4 space-y-2">
                {v.body.split('\n\n').map((paragraph, pi) => (
                  <p key={pi}>{paragraph}</p>
                ))}
              </div>

              {/* Hashtags */}
              {v.hashtags && (
                <div className="text-sm text-[#FF2442] mb-4">
                  {v.hashtags}
                </div>
              )}

              {/* Copy Button */}
              <button
                onClick={() => copyAll(v)}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium
                  text-gray-600 hover:bg-gray-50 hover:border-gray-300
                  transition-colors active:scale-[0.98]"
              >
                {copiedIndex === i ? '✅ 已复制到剪贴板' : '📋 复制全部'}
              </button>
            </div>
          ))}

          {/* Regenerate */}
          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm
              text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
          >
            🔄 重新生成
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && versions.length === 0 && !error && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-4">📱</div>
          <p className="text-sm">填入产品信息，让AI为你写文案</p>
          <p className="text-xs mt-2">已为1000+产品生成小红书爆款文案 ✨</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-8 text-xs text-gray-300">
        小红书AI文案助手 · 让好产品被更多人看见
      </div>
    </main>
  );
}
