import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { client } from '@/lib/microcms/client';
import { Article, Category } from '@/lib/microcms/types';
import { ArticleCard } from '@/components/media/ArticleCard';
import { SiteHeader } from '@/components/site-header';
import { Footer } from '@/components/footer';
import { Breadcrumbs } from '@/components/media/Breadcrumbs';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const category = await getCategory(params.slug);

  if (!category) {
    return {
      title: 'Not Found | Healthle',
      description: 'カテゴリーが見つかりませんでした。',
    };
  }

  return {
    title: `${category.title}の記事一覧 | Healthle`,
    description: category.description || `${category.title}に関する記事一覧です。`,
  };
}

async function getCategory(slug: string) {
  try {
    const response = await client.getList<Category>({
      endpoint: 'categories',
      queries: {
        filters: `slug[equals]${slug}`,
      },
    });
    return response.contents[0];
  } catch (error) {
    return null;
  }
}

async function getCategoryArticles(categoryId: string) {
  const response = await client.getList<Article>({
    endpoint: 'articles',
    queries: {
      filters: `category[equals]${categoryId}`,
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

async function getChildCategories(parentId: string) {
  const response = await client.getList<Category>({
    endpoint: 'categories',
    queries: {
      filters: `parent_category[equals]${parentId}`,
      fields: ['id', 'title', 'slug', 'description'],
    },
  });

  return response.contents;
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const category = await getCategory(params.slug);

  if (!category) {
    notFound();
  }

  const [articles, childCategories] = await Promise.all([
    getCategoryArticles(category.id),
    getChildCategories(category.id),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'カテゴリー一覧', href: '/media/category' },
              { label: category.title },
            ]}
          />

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#333333] mb-4">
              {category.title}の記事一覧
            </h1>
            {category.description && (
              <p className="text-gray-600">{category.description}</p>
            )}
          </div>

          {childCategories.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-bold text-[#333333] mb-4">
                サブカテゴリー
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {childCategories.map((child) => (
                  <a
                    key={child.id}
                    href={`/media/category/${child.slug}`}
                    className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-bold text-[#333333]">{child.title}</h3>
                    {child.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {child.description}
                      </p>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-12">
              このカテゴリーの記事はまだありません。
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
} 