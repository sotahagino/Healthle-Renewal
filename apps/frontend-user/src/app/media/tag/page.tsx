import { Metadata } from 'next';
import Link from 'next/link';
import { client } from '@/lib/microcms/client';
import { Tag } from '@/lib/microcms/types';
import { SiteHeader } from '@/components/site-header';
import { Footer } from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/media/Breadcrumbs';
import { Tag as TagIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'タグ一覧 | Healthle',
  description: '健康・医療に関する記事をタグ別に閲覧できます。',
};

export const revalidate = 60;

type TagType = '症状' | '原因' | '解決策';

async function getTags() {
  const response = await client.getList<Tag>({
    endpoint: 'tags',
    queries: {
      fields: ['id', 'title', 'slug', 'description', 'type'],
      orders: 'title',
    },
  });

  return response.contents;
}

// タグをタイプごとにグループ化する関数
function organizeTags(tags: Tag[]) {
  const groupedTags: Record<TagType, Tag[]> = {
    症状: [],
    原因: [],
    解決策: [],
  };

  tags.forEach((tag) => {
    if (tag.type) {
      groupedTags[tag.type as TagType].push(tag);
    }
  });

  return groupedTags;
}

export default async function TagListPage() {
  const tags = await getTags();
  const groupedTags = organizeTags(tags);

  const tagTypes: { type: TagType; color: string; description: string }[] = [
    {
      type: '症状',
      color: '#E53E3E',
      description: '健康上の症状や不調に関連する記事を見つけることができます。',
    },
    {
      type: '原因',
      color: '#DD6B20',
      description: '症状や健康問題の原因について解説している記事を見つけることができます。',
    },
    {
      type: '解決策',
      color: '#38A169',
      description: '健康問題の解決策や改善方法について解説している記事を見つけることができます。',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs items={[{ label: 'タグ一覧' }]} />

          <h1 className="text-3xl font-bold text-[#333333] mb-8">
            タグ一覧
          </h1>

          <div className="space-y-12">
            {tagTypes.map(({ type, color, description }) => (
              <div key={type}>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold" style={{ color }}>
                    {type}
                  </h2>
                  <p className="text-gray-600 mt-2">{description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedTags[type].map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/media/tag/${tag.slug}`}
                      className="block"
                    >
                      <Card className="hover:shadow-lg transition-shadow duration-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <TagIcon
                              className="w-5 h-5"
                              style={{ color }}
                            />
                            <div>
                              <h3 className="font-bold text-[#333333]">
                                {tag.title}
                              </h3>
                              {tag.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {tag.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 