import { Metadata } from 'next';
import { client } from '@/lib/microcms/client';
import { Author } from '@/lib/microcms/types';
import { SiteHeader } from '@/components/site-header';
import { Footer } from '@/components/footer';
import { Breadcrumbs } from '@/components/media/Breadcrumbs';
import Link from 'next/link';
import { Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';

export const metadata: Metadata = {
  title: '執筆者一覧 | Healthle',
  description: 'Healthleの記事を執筆している専門家の一覧です。',
};

export const fetchCache = 'force-no-store';
export const revalidate = 0;

async function getAuthors() {
  try {
    const response = await client.getList<Author>({
      endpoint: 'authors',
      queries: {
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

export default async function AuthorsPage() {
  const authors = await getAuthors();

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
                  { label: '執筆者一覧' },
                ]}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 mt-4">
            <h1 className="text-2xl md:text-3xl font-bold text-[#333333] mb-8 flex items-center gap-3">
              <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-gradient-to-br from-[#4C9A84] to-[#3D7A6A] rounded-xl shadow-md">
                <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-[#E6F3EF] rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-[#4C9A84] rounded-full" />
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 md:w-6 md:h-6 text-white"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              執筆者一覧
            </h1>

            <div className="grid gap-8 md:grid-cols-2">
              {authors.map((author) => (
                <Link
                  key={author.id}
                  href={`/media/authors/${author.slug}`}
                  className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4"
                >
                  <div className="flex gap-4">
                    {author.avatar && (
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden flex-shrink-0">
                        <img
                          src={author.avatar.url}
                          alt={author.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-grow">
                      <h2 className="text-lg font-bold text-[#333333] mb-1">
                        {author.name}
                      </h2>
                      {author.role && (
                        <p className="text-sm text-[#4C9A84] font-medium mb-2">
                          {author.role}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {author.profile}
                      </p>
                      {author.social && (
                        <div className="flex gap-3">
                          {author.social.twitter && (
                            <a
                              href={author.social.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-[#1DA1F2] transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Twitter className="w-4 h-4" />
                            </a>
                          )}
                          {author.social.facebook && (
                            <a
                              href={author.social.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-[#4267B2] transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Facebook className="w-4 h-4" />
                            </a>
                          )}
                          {author.social.instagram && (
                            <a
                              href={author.social.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-[#E4405F] transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Instagram className="w-4 h-4" />
                            </a>
                          )}
                          {author.social.linkedin && (
                            <a
                              href={author.social.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-[#0A66C2] transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Linkedin className="w-4 h-4" />
                            </a>
                          )}
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