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
    <div className="pt-12 mb-6 bg-gray-100">
      <nav className="px-6 flex items-center space-x-2 text-text-500 dark:text-gray-400 text-xl">
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            {index > 0 && <span>/</span>}
            {item.href ? (
              <Link
                href={item.href}
                className={"link"}
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 dark:text-gray-100">{item.label}</span>
            )}
          </div>
        ))}
      </nav>
      <hr className="border-gray-300 dark:border-gray-700 mt-2" />
    </div>
  );
}

