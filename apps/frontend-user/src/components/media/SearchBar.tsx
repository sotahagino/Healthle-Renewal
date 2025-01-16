'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/media/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <Input
          type="search"
          placeholder="キーワードで記事を検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-4 pr-12 py-2 rounded-lg border border-gray-300 focus:border-[#4C9A84] focus:ring-1 focus:ring-[#4C9A84]"
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="absolute right-2 text-gray-500 hover:text-[#4C9A84]"
        >
          <Search className="w-5 h-5" />
          <span className="sr-only">検索</span>
        </Button>
      </div>
    </form>
  );
} 