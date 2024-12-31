import { Suspense } from 'react';
import { ThanksContent } from '@/components/thanks-content';
import { SiteHeader } from '@/components/site-header';
import { Loader2 } from 'lucide-react';

export default function ThanksPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8">
        <Suspense
          fallback={
            <div className="flex justify-center items-center min-h-[60vh]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          }
        >
          <ThanksContent />
        </Suspense>
      </main>
    </div>
  );
} 