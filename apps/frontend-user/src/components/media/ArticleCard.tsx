import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User } from 'lucide-react';
import type { Article } from '@/lib/microcms/types';

type ArticleCardProps = {
  article: Article;
};

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link href={`/media/${article.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow duration-200">
        <div className="relative aspect-video">
          {article.eyecatch ? (
            <Image
              src={article.eyecatch.url}
              alt={article.title}
              fill
              className="object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-t-lg" />
          )}
        </div>
        <CardContent className="p-4">
          <div className="mb-2">
            <Badge variant="secondary" className="mb-2">
              {article.category.title}
            </Badge>
          </div>
          <h3 className="text-lg font-bold mb-2 line-clamp-2">
            {article.title}
          </h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {article.description}
          </p>
        </CardContent>
        <CardFooter className="px-4 py-3 border-t flex justify-between text-[10px] text-gray-500">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {article.author?.name || '執筆者'}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(article.publishedAt).toLocaleDateString('ja-JP')}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
} 