'use client';

import { Article } from '@/lib/microcms/types';
import { SiteHeader } from '@/components/site-header';
import { Footer } from '@/components/footer';
import { Breadcrumbs } from '@/components/media/Breadcrumbs';
import { useEffect, useState } from 'react';
import { client } from '@/lib/microcms/client';
import dynamic from 'next/dynamic';

const ArticleContent = dynamic(() => import('./ArticleContent'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded-2xl" />,
});

interface ArticlePageProps {
  initialArticle: Article;
  slug: string;
}

export default function ArticlePage({ initialArticle, slug }: ArticlePageProps) {
  const [article, setArticle] = useState<Article>(initialArticle);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      setIsLoading(true);
      try {
        const response = await client.getList<Article>({
          endpoint: 'articles',
          queries: {
            filters: `slug[equals]${slug}`,
          },
        });
        if (response.contents[0]) {
          setArticle(response.contents[0]);
        }
      } catch (error) {
        console.error('Failed to fetch article:', error);
      }
      setIsLoading(false);
    };

    fetchArticle();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
        <SiteHeader />
        <main className="flex-grow container mx-auto px-4 py-8 md:py-12 mt-16">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse bg-gray-200 h-96 rounded-2xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="overflow-hidden">
            <div className="text-[10px] sm:text-xs whitespace-nowrap overflow-x-auto pb-2">
              <Breadcrumbs
                items={[
                  { label: 'ホーム', href: '/' },
                  { label: '健康・医療情報', href: '/media' },
                  { 
                    label: article.category.title.length > 10 
                      ? `${article.category.title.slice(0, 10)}...` 
                      : article.category.title, 
                    href: `/media/category/${article.category.slug}` 
                  },
                  { 
                    label: article.title.length > 20 
                      ? `${article.title.slice(0, 20)}...` 
                      : article.title 
                  },
                ]}
              />
            </div>
          </div>
          <ArticleContent article={article} />
        </div>
      </main>
      <Footer />
    </div>
  );
} 