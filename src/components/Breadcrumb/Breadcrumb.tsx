import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string; // If href is provided, it's clickable; if not, it's the current page
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="mb-6">
      <nav className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            {index > 0 && <span>/</span>}
            {item.href ? (
              <Link 
                href={item.href} 
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 dark:text-gray-100">{item.label}</span>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}

