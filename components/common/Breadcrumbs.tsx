import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import BreadcrumbSEO from '@/components/seo/BreadcrumbSEO';
import { absoluteUrl } from '@/config/site';

export interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  const structuredItems = items.map((item, index) => ({
    name: item.name,
    url: absoluteUrl(item.href),
    position: index + 1,
  }));

  return (
    <>
      <BreadcrumbSEO items={structuredItems} />
      <nav aria-label="Breadcrumb" className={`text-sm ${className}`}>
        <ol className="flex flex-wrap items-center gap-1 text-gray-500">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-1">
                {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                {isLast ? (
                  <span className="font-medium text-gray-900" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.href} className="hover:text-purple-600 transition-colors">
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumbs;
