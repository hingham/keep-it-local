import Image from 'next/image';
import Link from 'next/link';
import { Service, Event} from '@/types/events';

interface CardGridProps {
  items: Service[] | Event[];
  getHref: (item: Service | Event) => string;
  getHeading: (item: Service | Event) => string;
  getDetails: (item: Service | Event) => string;
  emptyMessage: string;
  maxRows?: number;
}

function CardGrid({ items, getHref, getHeading, getDetails, emptyMessage, maxRows }: CardGridProps) {
  return (
    <div className={ maxRows ? 
      `grid grid-rows-[1fr_${maxRows - 1}] grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-hidden` :
      "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-hidden"}>
      {items.length > 0 ? (
        items.map((item) => (
          <Link 
            key={item.id} 
            href={getHref(item)}
            className="group cursor-pointer"
          >
            <div className="relative aspect-square overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
              <Image
                src={item.imageurl || '/placeholder-event.jpg'}
                alt={getHeading(item)}
                fill
                className="object-cover opacity-80 md:opacity-100 md:group-hover:opacity-80 transition-opacity duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              
              {/* Overlay with title on hover */}
              <div className="absolute inset-0 flex justify-center items-end">
                <div className="p-2 md:p-4 text-black bg-white opacity-85 md:opacity-0 md:group-hover:opacity-85 transition-opacity duration-300 w-full">
                  <h3 className="text-sm font-semibold md:text-lg">{getHeading(item)}</h3>
                  <p className="hidden md:block text-sm">{getDetails(item)}</p>
                </div>
              </div>
            </div>
          </Link>
        ))
      ) : (
        <div className="col-span-full text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            {emptyMessage}
          </div>
        </div>
      )}
    </div>
  );
}

export default CardGrid;
