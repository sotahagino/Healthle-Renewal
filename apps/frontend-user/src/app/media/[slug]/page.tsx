import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { client } from '@/lib/microcms/client';
import { Article, FaqItem, ReferenceItem } from '@/lib/microcms/types';
import { SiteHeader } from '@/components/site-header';
import { Footer } from '@/components/footer';
import { Breadcrumbs } from '@/components/media/Breadcrumbs';
import { format } from 'date-fns';
import { Tag } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await getArticle(params.slug);

  if (!article) {
    return {
      title: 'Not Found | Healthle',
      description: '記事が見つかりませんでした。',
    };
  }

  return {
    title: `${article.title} | Healthle`,
    description: article.description,
  };
}

async function getArticle(slug: string) {
  try {
    const response = await client.getList<Article>({
      endpoint: 'articles',
      queries: {
        filters: `slug[equals]${slug}`,
      },
    });
    return response.contents[0];
  } catch (error) {
    return null;
  }
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getArticle(params.slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'ホーム', href: '/' },
              { label: '健康・医療情報', href: '/media' },
              { label: article.category.title, href: `/media/category/${article.category.slug}` },
              { label: article.title },
            ]}
          />

          <article className="bg-white rounded-lg shadow-lg p-6 md:p-8 mt-8">
            {article.eyecatch && (
              <div className="mb-8">
                <img
                  src={article.eyecatch.url}
                  alt={article.title}
                  className="w-full h-auto rounded-lg"
                />
              </div>
            )}

            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <Link
                  href={`/media/category/${article.category.slug}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#4C9A84] text-white hover:bg-[#3D7A6A] transition-colors"
                >
                  {article.category.title}
                </Link>
                {article.tags?.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/media/tag/${tag.slug}`}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border border-gray-300 hover:bg-gray-100 transition-colors"
                  >
                    <Tag className="w-3 h-3" />
                    {tag.title}
                  </Link>
                ))}
              </div>

              <h1 className="text-3xl font-bold text-[#333333] mb-4">
                {article.title}
              </h1>

              <div className="flex items-center justify-between text-gray-600 text-sm mb-6">
                <div className="flex items-center gap-2">
                  <span>執筆：{article.author_name}</span>
                </div>
                <time dateTime={article.publishedAt}>
                  {format(new Date(article.publishedAt), 'yyyy/MM/dd')}
                </time>
              </div>

              <p className="text-gray-600 mb-8">{article.description}</p>
            </div>

            <div
              className="prose prose-lg max-w-none prose-headings:text-[#333333] prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-700 prose-p:leading-relaxed prose-ul:text-gray-700 prose-strong:text-[#333333] prose-blockquote:border-l-4 prose-blockquote:border-[#4C9A84] prose-blockquote:pl-4 prose-blockquote:text-gray-600"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {article.faq && article.faq.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-[#333333] mb-6">
                  よくある質問
                </h2>
                <div className="space-y-6">
                  {article.faq.map((faq: FaqItem, index: number) => (
                    <div
                      key={faq.fieldId}
                      className="bg-gray-50 rounded-lg p-6"
                    >
                      <h3 className="text-lg font-bold text-[#333333] mb-3">
                        Q{index + 1}. {faq.question.replace(/Q\d+\.\s*|Q\d+\s+/g, '').trim()}
                      </h3>
                      <div 
                        className="text-gray-600 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: `<span class="font-semibold">A${index + 1}.</span> ${faq.answer
                            .replace(/^A\d+\.\s*A\d+\.\s*/, '')
                            .replace(/^A\d+\.\s*/, '')
                            .replace(/A\d+\./g, '')
                            .replace(/<[^>]*>|&nbsp;/g, '')
                            .trim()}`
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {article.references && article.references.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-[#333333] mb-6">
                  参考文献
                </h2>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  {article.references.map((ref: ReferenceItem, index: number) => (
                    <li key={index}>
                      {ref.text}
                      {ref.doi && (
                        <span className="ml-2">
                          DOI：
                          <a
                            href={`https://doi.org/${ref.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#4C9A84] hover:underline"
                          >
                            {ref.doi}
                          </a>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
} 