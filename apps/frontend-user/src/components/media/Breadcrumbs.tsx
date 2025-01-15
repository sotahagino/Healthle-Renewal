import Link from 'next/link';
import { Home, ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="パンくずリスト" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm text-gray-600">
        <li className="flex items-center">
          <Link href="/" className="text-[#4C9A84] hover:text-[#3D7A6A]">
            <Home className="w-4 h-4" />
            <span className="sr-only">ホーム</span>
          </Link>
        </li>
        {items.slice(1).map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            {item.href ? (
              <Link
                href={item.href}
                className="text-[#4C9A84] hover:text-[#3D7A6A]"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-800">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
} 