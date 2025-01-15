import { Metadata } from 'next';
import { client } from '@/lib/microcms/client';
import { Article } from '@/lib/microcms/types';
import { ArticleCard } from '@/components/media/ArticleCard';
import { SiteHeader } from '@/components/site-header';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'メディア記事一覧 | Healthle',
  description: '健康・医療に関する最新の情報をお届けします。',
};

export const revalidate = 60; // 1分ごとに再検証

async function getArticles() {
  const response = await client.getList<Article>({
    endpoint: 'articles',
    queries: {
      fields: [
        'id',
        'title',
        'description',
        'thumbnail',
        'category',
        'author',
        'publishedAt',
        'slug',
      ],
      orders: '-publishedAt',
    },
  });

  return response.contents;
}

export default async function MediaPage() {
  const articles = await getArticles();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-[#333333] mb-8">
            健康・医療情報
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 