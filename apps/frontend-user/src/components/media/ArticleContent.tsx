'use client';

import { Article, FaqItem, ReferenceItem } from '@/lib/microcms/types';
import { format } from 'date-fns';
import { Tag } from 'lucide-react';
import Link from 'next/link';
import { FC, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ArticleContentProps {
  article: Article;
}

const ArticleContent: FC<ArticleContentProps> = ({ article: initialArticle }) => {
  const [article, setArticle] = useState(initialArticle);
  const router = useRouter();

  useEffect(() => {
    setArticle(initialArticle);
  }, [initialArticle]);

  return (
    <article className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-10 mt-4 sm:mt-6 md:mt-8 transition-shadow hover:shadow-xl">
      {article.eyecatch && (
        <div className="mb-6 sm:mb-8 overflow-hidden rounded-xl">
          <img
            src={article.eyecatch.url}
            alt={article.title}
            className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div className="mb-6 sm:mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <Link
            href={`/media/category/${article.category.slug}`}
            className="inline-flex items-center px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium bg-[#4C9A84] text-white hover:bg-[#3D7A6A] transition-all transform hover:-translate-y-0.5"
          >
            {article.category.title.length > 10 
              ? `${article.category.title.slice(0, 10)}...` 
              : article.category.title}
          </Link>
          {article.tags?.map((tag) => (
            <Link
              key={tag.id}
              href={`/media/tag/${tag.slug}`}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all transform hover:-translate-y-0.5"
            >
              <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {tag.title.length > 8 ? `${tag.title.slice(0, 8)}...` : tag.title}
            </Link>
          ))}
        </div>

        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-[#333333] mb-4 sm:mb-6 leading-tight line-clamp-2 sm:line-clamp-none">
          {article.title}
        </h1>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm mb-4 sm:mb-6 space-y-2 sm:space-y-0">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">{article.author_name}</span>
          </div>
          <time dateTime={article.publishedAt} className="text-gray-600">
            {format(new Date(article.publishedAt), 'yyyy年MM月dd日')}
          </time>
        </div>

        <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 bg-gray-50 p-4 sm:p-6 rounded-xl">
          {article.description}
        </p>
      </div>

      <div
        className="prose prose-sm sm:prose-base md:prose-lg max-w-none prose-headings:text-[#333333] prose-headings:font-bold prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-8 sm:prose-h2:mt-12 prose-h2:mb-4 sm:prose-h2:mb-6 prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mt-6 sm:prose-h3:mt-8 prose-h3:mb-3 sm:prose-h3:mb-4 prose-p:text-gray-700 prose-p:leading-relaxed prose-ul:text-gray-700 prose-strong:text-[#333333] prose-blockquote:border-l-4 prose-blockquote:border-[#4C9A84] prose-blockquote:pl-4 sm:prose-blockquote:pl-6 prose-blockquote:text-gray-600 prose-blockquote:bg-gray-50 prose-blockquote:py-2 prose-blockquote:rounded-r-lg prose-a:text-[#4C9A84] prose-a:no-underline hover:prose-a:underline"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {article.faq && article.faq.length > 0 && (
        <div className="mt-12 sm:mt-16">
          <h2 className="text-xl sm:text-2xl font-bold text-[#333333] mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
            <span className="p-1.5 sm:p-2 bg-[#4C9A84] text-white rounded-lg">Q&A</span>
            よくある質問
          </h2>
          <div className="space-y-4 sm:space-y-6">
            {article.faq.map((faq: FaqItem, index: number) => (
              <div
                key={faq.fieldId}
                className="bg-gray-50 rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="text-base sm:text-lg font-bold text-[#333333] mb-3 sm:mb-4 flex items-start gap-2 sm:gap-3">
                  <span className="text-[#4C9A84]">Q{index + 1}.</span>
                  <span className="flex-1">{faq.question.replace(/Q\d+\.\s*|Q\d+\s+/g, '').trim()}</span>
                </h3>
                <div 
                  className="text-gray-600 prose prose-sm max-w-none pl-6 sm:pl-8"
                  dangerouslySetInnerHTML={{
                    __html: `<span class="font-semibold text-[#4C9A84]">A${index + 1}.</span> ${faq.answer
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
        <div className="mt-12 sm:mt-16">
          <h2 className="text-xl sm:text-2xl font-bold text-[#333333] mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
            <span className="p-1.5 sm:p-2 bg-[#4C9A84] text-white rounded-lg">📚</span>
            参考文献
          </h2>
          <ul className="list-none space-y-3 sm:space-y-4 text-gray-600 bg-gray-50 p-4 sm:p-6 rounded-xl text-sm sm:text-base">
            {article.references.map((ref: ReferenceItem, index: number) => (
              <li key={index} className="flex items-start gap-2 sm:gap-3">
                <span className="text-[#4C9A84] font-medium">[{index + 1}]</span>
                <div>
                  {ref.title}
                  {ref.doi && (
                    <div className="mt-2">
                      <span className="font-medium">DOI：</span>
                      <a
                        href={`https://doi.org/${ref.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#4C9A84] hover:underline inline-flex items-center gap-1 break-all"
                      >
                        {ref.doi}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export default ArticleContent; 