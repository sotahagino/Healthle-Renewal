import { Metadata } from 'next';
import { client } from '@/lib/microcms/client';
import { Article } from '@/lib/microcms/types';
import { ArticleCard } from '@/components/media/ArticleCard';
import { SiteHeader } from '@/components/site-header';
import { Footer } from '@/components/footer';
import { Breadcrumbs } from '@/components/media/Breadcrumbs';
import { SearchBar } from '@/components/media/SearchBar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: '記事検索 | Healthle',
  description: '健康・医療に関する記事を検索できます。',
};

export const revalidate = 60;

const ITEMS_PER_PAGE = 12;

async function searchArticles(query: string, page: number = 1) {
  const response = await client.getList<Article>({
    endpoint: 'articles',
    queries: {
      q: query,
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
      limit: ITEMS_PER_PAGE,
      offset: (page - 1) * ITEMS_PER_PAGE,
    },
  });

  return {
    articles: response.contents,
    totalCount: response.totalCount,
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const query = searchParams.q || '';
  const currentPage = Number(searchParams.page) || 1;
  
  const { articles, totalCount } = query
    ? await searchArticles(query, currentPage)
    : { articles: [], totalCount: 0 };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const PaginationButton = ({
    page,
    current,
    query,
  }: {
    page: number;
    current: number;
    query: string;
  }) => (
    <Button
      variant={page === current ? 'default' : 'outline'}
      size="sm"
      asChild
      className={page === current ? 'bg-[#4C9A84]' : ''}
    >
      <a href={`/media/search?q=${encodeURIComponent(query)}&page=${page}`}>
        {page}
      </a>
    </Button>
  );

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      buttons.push(
        <PaginationButton key={1} page={1} current={currentPage} query={query} />
      );
      if (startPage > 2) {
        buttons.push(<span key="start-ellipsis">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <PaginationButton
          key={i}
          page={i}
          current={currentPage}
          query={query}
        />
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="end-ellipsis">...</span>);
      }
      buttons.push(
        <PaginationButton
          key={totalPages}
          page={totalPages}
          current={currentPage}
          query={query}
        />
      );
    }

    return buttons;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs
            items={[
              { label: '記事検索' },
            ]}
          />

          <div className="mb-12">
            <h1 className="text-3xl font-bold text-[#333333] mb-8 text-center">
              記事検索
            </h1>
            <SearchBar />
          </div>

          {query && (
            <div className="mb-8">
              <p className="text-gray-600">
                「{query}」の検索結果: {totalCount}件
              </p>
            </div>
          )}

          {articles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  {currentPage > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="gap-1"
                    >
                      <a
                        href={`/media/search?q=${encodeURIComponent(
                          query
                        )}&page=${currentPage - 1}`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        前へ
                      </a>
                    </Button>
                  )}

                  <div className="flex items-center gap-2">
                    {renderPaginationButtons()}
                  </div>

                  {currentPage < totalPages && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="gap-1"
                    >
                      <a
                        href={`/media/search?q=${encodeURIComponent(
                          query
                        )}&page=${currentPage + 1}`}
                      >
                        次へ
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : query ? (
            <p className="text-center text-gray-600 py-12">
              検索結果が見つかりませんでした。別のキーワードをお試しください。
            </p>
          ) : (
            <p className="text-center text-gray-600 py-12">
              キーワードを入力して記事を検索してください。
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
} 