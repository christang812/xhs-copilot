import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '小红书AI文案助手 - 一键生成爆款文案',
  description: '输入产品描述，AI自动生成3版小红书风格的营销文案，助力你的产品在小红书脱颖而出。',
  keywords: ['小红书', '文案', 'AI文案', '小红书营销', '内容创作', '爆款文案'],
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
