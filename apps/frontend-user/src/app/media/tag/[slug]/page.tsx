import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { client } from '@/lib/microcms/client';
import { Article, Tag } from '@/lib/microcms/types';
import { ArticleCard } from '@/components/media/ArticleCard';
import { SiteHeader } from '@/components/site-header';
import { Footer } from '@/components/footer';
import { Breadcrumbs } from '@/components/media/Breadcrumbs';
import { Tag as TagIcon } from 'lucide-react';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const tag = await getTag(params.slug);

  if (!tag) {
    return {
      title: 'Not Found | Healthle',
      description: 'タグが見つかりませんでした。',
    };
  }

  return {
    title: `${tag.title}の記事一覧 | Healthle`,
    description: tag.description || `${tag.title}に関する記事一覧です。`,
  };
}

async function getTag(slug: string) {
  try {
    const response = await client.getList<Tag>({
      endpoint: 'tags',
      queries: {
        filters: `slug[equals]${slug}`,
      },
    });
    return response.contents[0];
  } catch (error) {
    return null;
  }
}

async function getTagArticles(tagId: string) {
  const response = await client.getList<Article>({
    endpoint: 'articles',
    queries: {
      filters: `tags[contains]${tagId}`,
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

const tagColors: Record<string, string> = {
  症状: '#E53E3E',
  原因: '#DD6B20',
  解決策: '#38A169',
};

export default async function TagPage({
  params,
}: {
  params: { slug: string };
}) {
  const tag = await getTag(params.slug);

  if (!tag) {
    notFound();
  }

  const articles = await getTagArticles(tag.id);
  const tagColor = tag.type ? tagColors[tag.type] : '#4C9A84';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'タグ一覧', href: '/media/tag' },
              { label: tag.title },
            ]}
          />

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <TagIcon className="w-8 h-8" style={{ color: tagColor }} />
              <h1 className="text-3xl font-bold text-[#333333]">
                {tag.title}の記事一覧
              </h1>
            </div>
            {tag.description && (
              <p className="text-gray-600">{tag.description}</p>
            )}
            {tag.type && (
              <p className="mt-2 text-sm" style={{ color: tagColor }}>
                タイプ: {tag.type}
              </p>
            )}
          </div>

          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-12">
              このタグの記事はまだありません。
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
} 