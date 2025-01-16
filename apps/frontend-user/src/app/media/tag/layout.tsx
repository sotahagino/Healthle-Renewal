import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'タグ一覧 | Healthle',
  description: '健康・医療に関する記事をタグ別に閲覧できます。',
};

export default function TagLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 