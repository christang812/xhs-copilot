import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '小红书AI文案助手 - 输入产品，3秒生成3版爆款文案',
  description: '告别绞尽脑汁写文案！AI自动生成走心故事型、干货教程型、对比测评型3版小红书风格文案。30秒出稿，一键复制发布。电商卖家、自媒体博主、实体店主都在用。',
  keywords: ['小红书文案', 'AI写文案', '小红书营销', '爆款文案', '文案生成', '内容创作', 'AI工具'],
  openGraph: {
    title: '小红书AI文案助手 - 3秒生成3版爆款文案',
    description: '输入产品信息，AI自动生成3版小红书风格文案。每天免费使用5次。',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
