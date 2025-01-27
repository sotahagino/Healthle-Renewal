import { Metadata } from 'next';
import { notFound } from 'next/dist/client/components/not-found';
import { client } from '@/lib/microcms/client';
import { Author, Article } from '@/lib/microcms/types';
import { SiteHeader } from '@/components/site-header';
import { Footer } from '@/components/footer';
import { Breadcrumbs } from '@/components/media/Breadcrumbs';
import Link from 'next/link';
import { format } from 'date-fns';
import { Twitter, Facebook, Instagram, Linkedin, Tag } from 'lucide-react';

export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const author = await getAuthor(params.slug);

  if (!author) {
    return {
      title: 'Not Found | Healthle',
      description: '執筆者が見つかりませんでした。',
    };
  }

  return {
    title: `${author.name}の記事一覧 | Healthle`,
    description: `${author.name}のプロフィールと記事一覧をご覧いただけます。${author.role || ''}として活動中。`,
  };
}

async function getAuthor(slug: string) {
  try {
    const response = await client.getList<Author>({
      endpoint: 'authors',
      queries: {
        filters: `slug[equals]${slug}`,
      },
      customRequestInit: {
        cache: 'no-store',
      },
    });
    return response.contents[0];
  } catch (error) {
    return null;
  }
}

async function getAuthorArticles(authorId: string) {
  try {
    const response = await client.getList<Article>({
      endpoint: 'articles',
      queries: {
        filters: `author[equals]${authorId}`,
        orders: '-publishedAt',
      },
      customRequestInit: {
        cache: 'no-store',
      },
    });
    return response.contents;
  } catch (error) {
    return [];
  }
}

export default async function AuthorPage({
  params,
}: {
  params: { slug: string };
}) {
  const author = await getAuthor(params.slug);

  if (!author) {
    notFound();
  }

  const safeAuthor: NonNullable<typeof author> = author;
  const articles = await getAuthorArticles(safeAuthor.id);

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
                  { label: '執筆者一覧', href: '/media/authors' },
                  { label: safeAuthor.name },
                ]}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 mt-4">
            <div className="flex flex-col md:flex-row items-start gap-6 md:gap-10">
              {safeAuthor.avatar && (
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden flex-shrink-0">
                  <img
                    src={safeAuthor.avatar.url}
                    alt={safeAuthor.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="flex-grow">
                <h1 className="text-2xl md:text-3xl font-bold text-[#333333] mb-2">
                  {safeAuthor.name}
                </h1>
                {safeAuthor.role && (
                  <p className="text-[#4C9A84] font-medium mb-4">{safeAuthor.role}</p>
                )}
                {safeAuthor.qualification && (
                  <p className="text-gray-600 text-sm mb-4">{safeAuthor.qualification}</p>
                )}
                {safeAuthor.specialties && safeAuthor.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {safeAuthor.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-gray-700 whitespace-pre-wrap mb-6">
                  {safeAuthor.profile}
                </p>
                {safeAuthor.social && (
                  <div className="flex gap-4">
                    {safeAuthor.social.twitter && (
                      <a
                        href={safeAuthor.social.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-[#1DA1F2] transition-colors"
                      >
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                    {safeAuthor.social.facebook && (
                      <a
                        href={safeAuthor.social.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-[#4267B2] transition-colors"
                      >
                        <Facebook className="w-5 h-5" />
                      </a>
                    )}
                    {safeAuthor.social.instagram && (
                      <a
                        href={safeAuthor.social.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-[#E4405F] transition-colors"
                      >
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {safeAuthor.social.linkedin && (
                      <a
                        href={safeAuthor.social.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-[#0A66C2] transition-colors"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-bold text-[#333333] mb-6 flex items-center gap-2">
              <div className="relative w-8 h-8 flex items-center justify-center bg-gradient-to-br from-[#4C9A84] to-[#3D7A6A] rounded-lg shadow-md">
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#E6F3EF] rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#4C9A84] rounded-full" />
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 text-white"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <line x1="10" y1="9" x2="8" y2="9" />
                </svg>
              </div>
              執筆記事一覧
            </h2>
            <div className="grid gap-6">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/media/${article.slug}`}
                  className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 md:p-6"
                >
                  <div className="flex gap-4">
                    {article.eyecatch && (
                      <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-lg overflow-hidden">
                        <img
                          src={article.eyecatch.url}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <Link
                          href={`/media/category/${article.category.slug}`}
                          className="text-xs px-2 py-1 rounded-full bg-[#4C9A84] text-white hover:bg-[#3D7A6A]"
                        >
                          {article.category.title}
                        </Link>
                        <time className="text-xs text-gray-500">
                          {format(new Date(article.publishedAt), 'yyyy年MM月dd日')}
                        </time>
                      </div>
                      <h3 className="text-lg font-bold text-[#333333] mb-2 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {article.description}
                      </p>
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {article.tags.map((tag) => (
                            <Link
                              key={tag.id}
                              href={`/media/tag/${tag.slug}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border border-gray-300 text-gray-600 hover:bg-gray-50"
                            >
                              <Tag className="w-3 h-3" />
                              {tag.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 