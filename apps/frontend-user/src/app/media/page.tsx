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
        'eyecatch',
        'category',
        'author_name',
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] via-white to-[#F7FDFB]">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-[#333333] mb-4">
              健康・医療情報
            </h1>
            <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
              健康的な生活をサポートする信頼できる情報をお届けします。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#4C9A84]/10 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#4C9A84]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-[#333333]">信頼性の高い情報</h2>
              </div>
              <p className="text-sm text-gray-600">医学論文などの科学的根拠に基づいた情報をご提供します。</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#4C9A84]/10 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#4C9A84]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-[#333333]">最新の情報</h2>
              </div>
              <p className="text-sm text-gray-600">定期的に更新される最新の医療情報と健康に関する知識をお届けします。</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#4C9A84]/10 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#4C9A84]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-[#333333]">実践的なアドバイス</h2>
              </div>
              <p className="text-sm text-gray-600">日常生活に取り入れやすい健康管理のヒントと実践的なアドバイスを提供します。</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#333333] mb-6">最新の記事</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 