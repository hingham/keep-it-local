import Image from "next/image";
import { Service, Event } from "@/types/events";
import { useState } from "react";
import { formatDate, formatTime, parsePostgreSQLArray } from '@/lib/utils';

function OwnerIcon() {
  return (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function WebsiteIcon() {
  return (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-3a5 5 0 00-10 0v3m3-3a5 5 0 010-10" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function TimeIcon() {
  return (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export function Detail({ svg, children }: { svg: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center text-gray-600 dark:text-gray-400">
      <div className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400">{svg}</div>
      <div>{children}</div>
    </div>
  );
}

export function ItemDetails({ item }: { item: Service | Event }) {
  const [isSharing, setIsSharing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleShare = async () => {
    if (!item) return;

    const shareData = {
      title: item.title,
      text: `Check out this item in ${item.neighborhood}: ${item.title}`,
      url: window.location.href,
    };

    setIsSharing(true);

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy URL to clipboard
        await navigator.clipboard.writeText(window.location.href);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Parse categories and date_list if they are PostgreSQL arrays (Event-specific)
  const categories = 'categories' in item && typeof item.categories === 'string'
    ? parsePostgreSQLArray(item.categories)
    : 'categories' in item ? item.categories : null;

  const dateList = 'date_list' in item && item.date_list
    ? (typeof item.date_list === 'string'
      ? parsePostgreSQLArray(item.date_list)
      : item.date_list)
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Image */}
      <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg">
        <Image
          src={item.imageurl || '/placeholder-item.jpg'}
          alt={item.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Details */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {item.title}
          </h1>

          {/* Share Button */}
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSharing ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sharing...
              </>
            ) : copySuccess ? (
              <>
                <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share
              </>
            )}
          </button>
        </div>

        <div className="space-y-3">
          {/* Service-specific details */}
          {'owner' in item && (
            <>
              <Detail svg={<OwnerIcon />}>
                <span>Offered by {item.owner}</span>
              </Detail>
              
              <Detail svg={<LocationIcon />}>
                <span>{item.neighborhood}, {item.city}, {item.state}</span>
              </Detail>

              <Detail svg={<CalendarIcon />}>
                <span>Listed on {formatDate(item.created_at)}</span>
              </Detail>
            </>
          )}


          {/* Service contact details */}
          {'contact_email' in item && item.contact_email && (
            <Detail svg={<EmailIcon />}>
              <a href={`mailto:${item.contact_email}`} className="text-blue-600 hover:underline">
                {item.contact_email}
              </a>
            </Detail>
          )}

          {'contact_number' in item && item.contact_number && (
            <Detail svg={<PhoneIcon />}>
              <a href={`tel:${item.contact_number}`} className="text-blue-600 hover:underline">
                {item.contact_number}
              </a>
            </Detail>
          )}

          {/* Event-specific details */}
          {'date' in item && (
            <Detail svg={<CalendarIcon />}>
              <span>
                {formatDate(item.date)}
                {item.recurring && ' (Recurring)'}
              </span>
            </Detail>
          )}

          {'time' in item && (
            <Detail svg={<TimeIcon />}>
              <span>{item.time ? formatTime(item.time) : 'Time TBD'}</span>
            </Detail>
          )}

          {'location' in item && (
            <Detail svg={<LocationIcon />}>
              <span>{item.location}</span>
            </Detail>
          )}

          {/* Website (for both Events and Services) */}
          {item.website && (
            <Detail svg={<WebsiteIcon />}>
              <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {item.website}
              </a>
            </Detail>
          )}
        </div>

        {/* Categories and Additional Info */}
        <div className="mt-6 space-y-4">
          {/* Categories */}
          {categories && categories.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category: string, index: number) => (
                  <span
                    key={index}
                    className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium px-3 py-1 rounded-full"
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recurring Dates */}
          {'recurring' in item && item.recurring && dateList && dateList.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Upcoming Dates
              </h3>
              <ul className="space-y-1">
                {dateList.slice(0, 5).map((date: string, index: number) => (
                  <li key={index} className="text-gray-600 dark:text-gray-400">
                    {formatDate(date)}
                  </li>
                ))}
                {dateList.length > 5 && (
                  <li className="text-gray-500 dark:text-gray-500 text-sm">
                    ... and {dateList.length - 5} more dates
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}