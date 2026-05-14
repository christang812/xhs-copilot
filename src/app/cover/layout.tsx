import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '小红书AI封面生成器 - 30秒生成3版潮流封面',
  description: '免费AI封面生成工具，支持奶油高级感、多巴胺撞色、新中式、暗黑风、自然温润、手账便签7种风格。粘贴文案一键生成小红书封面，3:4标准尺寸PNG下载。告别Canva手动折腾！',
  keywords: ['小红书封面', '封面生成', 'AI封面', '小红书封面模板', '封面设计', 'AI设计', '封面制作', 'xhs-cover', '小红书封面工具', '封面在线生成'],
  openGraph: {
    title: '小红书AI封面生成器 - 30秒生成3版潮流封面',
    description: '7种2026小红书趋势风格 · 粘贴文案即可生成 · 一键下载PNG',
    type: 'website',
  },
};
export default function CoverLayout({ children }: { children: React.ReactNode }) {
  return children;
}
