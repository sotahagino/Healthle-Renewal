import { Metadata } from 'next';
import Link from 'next/link';
import { client } from '@/lib/microcms/client';
import { Category } from '@/lib/microcms/types';
import { SiteHeader } from '@/components/site-header';
import { Footer } from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/media/Breadcrumbs';
import { ArrowRight, FolderOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'カテゴリー一覧 | Healthle',
  description: '健康・医療に関する記事をカテゴリー別に閲覧できます。',
};

export const revalidate = 60;

async function getCategories() {
  const response = await client.getList<Category>({
    endpoint: 'categories',
    queries: {
      fields: ['id', 'title', 'slug', 'description', 'parent_category'],
      orders: 'title',
    },
  });

  return response.contents;
}

// 親カテゴリーと子カテゴリーを整理する関数
function organizeCategories(categories: Category[]) {
  const parentCategories = categories.filter(cat => !cat.parent_category);
  const childCategories = categories.filter(cat => cat.parent_category);

  // 親カテゴリーごとに子カテゴリーをグループ化
  return parentCategories.map(parent => ({
    ...parent,
    children: childCategories.filter(
      child => child.parent_category?.id === parent.id
    ),
  }));
}

export default async function CategoryListPage() {
  const categories = await getCategories();
  const organizedCategories = organizeCategories(categories);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs items={[{ label: 'カテゴリー一覧' }]} />

          <h1 className="text-3xl font-bold text-[#333333] mb-8">
            カテゴリー一覧
          </h1>

          <div className="space-y-8">
            {organizedCategories.map((category) => (
              <div key={category.id}>
                <Link href={`/media/category/${category.slug}`}>
                  <Card className="hover:shadow-lg transition-shadow duration-200 mb-4">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FolderOpen className="w-6 h-6 text-[#4C9A84]" />
                          <div>
                            <h2 className="text-xl font-bold text-[#333333]">
                              {category.title}
                            </h2>
                            {category.description && (
                              <p className="text-gray-600 mt-1">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-[#4C9A84]" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {category.children && category.children.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    {category.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/media/category/${child.slug}`}
                        className="block"
                      >
                        <Card className="hover:shadow-md transition-shadow duration-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium text-[#333333]">
                                  {child.title}
                                </h3>
                                {child.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {child.description}
                                  </p>
                                )}
                              </div>
                              <ArrowRight className="w-4 h-4 text-[#4C9A84]" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 