'use client';

import Link from 'next/link';
import { client } from '@/lib/microcms/client';
import { Tag } from '@/lib/microcms/types';
import { SiteHeader } from '@/components/site-header';
import { Footer } from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/media/Breadcrumbs';
import { Tag as TagIcon } from 'lucide-react';

export const revalidate = 60;
export const dynamic = 'force-dynamic';

type TagType = 'symptom' | 'cause' | 'solution';

const TAG_TYPE_DISPLAY: Record<TagType, string> = {
  symptom: '症状',
  cause: '原因',
  solution: '解決策',
};

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

function isValidTagType(type: string | undefined): type is TagType {
  return type === 'symptom' || type === 'cause' || type === 'solution';
}

// タグをタイプごとにグループ化する関数
function organizeTags(tags: Tag[]) {
  const groupedTags: Record<TagType, Tag[]> = {
    symptom: [],
    cause: [],
    solution: [],
  };

  tags.forEach((tag) => {
    if (isValidTagType(tag.type)) {
      groupedTags[tag.type].push(tag);
    }
  });

  return groupedTags;
}

export default async function TagListPage() {
  const tags = await getTags();
  const groupedTags = organizeTags(tags);

  const tagTypes: { type: TagType; color: string; description: string }[] = [
    {
      type: 'symptom',
      color: '#E53E3E',
      description: '健康上の症状や不調に関連する記事を見つけることができます。',
    },
    {
      type: 'cause',
      color: '#DD6B20',
      description: '症状や健康問題の原因について解説している記事を見つけることができます。',
    },
    {
      type: 'solution',
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
                    {TAG_TYPE_DISPLAY[type]}
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