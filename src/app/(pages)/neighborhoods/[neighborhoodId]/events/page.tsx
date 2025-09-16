'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { EventCategory, Neighborhood, Event } from '@/types/events';
import Header from '@/components/Header/header';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import CardGrid from '@/components/CardGrid/cardGrid';
import ErrorComponent from '@/components/ErrorComponent/errorComponent';
import CategoryFilter from '@/components/CategoryFilter/categoryFilter';

export default function NeighborhoodEventsPage() {
  const params = useParams();
  const neighborhoodId = decodeURIComponent(params.neighborhoodId as string);

  const [neighborhood, setNeighborhood] = useState<Pick<Neighborhood, 'id' | 'neighborhood' | 'city' | 'state' | 'macro_neighborhood'> | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {

        // fetch events for this specific neighborhood
        const eventsRes = await fetch(`/api/neighborhoods/${neighborhoodId}/events`);
        if (!eventsRes.ok) {
          throw new Error('Failed to fetch events');
        }

        const eventsData = await eventsRes.json();

        setNeighborhood({
          id: eventsData[0]?.neighborhood_id || 0,
          neighborhood: eventsData[0]?.neighborhood || '',
          city: eventsData[0]?.city || '',
          state: eventsData[0]?.state || '',
          macro_neighborhood: eventsData[0]?.macro_neighborhood || ''
        });
        setEvents(eventsData);
        setFilteredEvents(eventsData); // Initialize filtered events with all events
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (neighborhoodId) {
      fetchData();
    }
  }, [neighborhoodId]);

  // Filter events when category selection changes
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter(event => {
        // Handle both array and string categories
        const categories = Array.isArray(event.categories)
          ? event.categories
          : typeof event.categories === 'string'
            ? [event.categories]
            : [];
        return categories.includes(selectedCategory as EventCategory);
      });
      setFilteredEvents(filtered);
    }
  }, [selectedCategory, events]);

  const handleCategoryFilter = (category: EventCategory | 'all') => {
    setSelectedCategory(category);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading events...</div>
      </div>
    );
  }

  if (error || !neighborhood) {
    return <ErrorComponent message={error || 'Neighborhood not found'} returnTo={`/cities`} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[
          { label: neighborhood.city.toUpperCase(), href: `/${neighborhood.city}` },
          { label: neighborhood.neighborhood, href: `/neighborhoods/${encodeURIComponent(neighborhoodId)}` },
          { label: 'Events' }
        ]} />

        {/* Header */}
        <Header
          title={`Events in ${neighborhood.neighborhood}`}
          subtitle={`${neighborhood.city}, ${neighborhood.state} • ${neighborhood.macro_neighborhood}`}
        />

        <CategoryFilter<EventCategory, Event>
          handleCategoryFilter={handleCategoryFilter}
          categoryEnum={EventCategory}
          selectedCategory={selectedCategory}
          items={events}
          filteredItems={filteredEvents}
        />

        {/* Category Filter Buttons */}
        {/* <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleCategoryFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              All Events ({events.length})
            </button>

            {Object.values(EventCategory).map((category) => {
              const categoryCount = events.filter(e => {
                const categories = Array.isArray(e.categories) ? e.categories : [e.categories];
                return categories.includes(category);
              }).length;

              // Define colors for each category
              const getCategoryColor = () => {
                return 'bg-blue-600';
              };

              // Capitalize first letter for display
              const displayName = category.charAt(0).toUpperCase() + category.slice(1);

              return (
                <button
                  key={category}
                  onClick={() => handleCategoryFilter(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${selectedCategory === category
                      ? `${getCategoryColor()} text-white shadow-md`
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                  {displayName} ({categoryCount})
                </button>
              );
            })}
          </div>

          {selectedCategory !== 'all' && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredEvents.length} {selectedCategory} events
            </div>
          )}
        </div> */}

        {/* Events Grid */}
        <CardGrid
          items={filteredEvents}
          getHref={(event) => `/neighborhoods/${encodeURIComponent(neighborhoodId)}/events/${event.id}`}
          getHeading={(event) => event.title || ''}
          getDetails={(event) => {
            if ('location' in event && typeof event.location === 'string') {
              return event.location;
            }
            return '';
          }}
          emptyMessage={
            selectedCategory === 'all'
              ? `No events found in ${neighborhood.neighborhood}`
              : `No ${selectedCategory} events found in ${neighborhood.neighborhood}`
          }
        />
      </div>
    </div>
  );
}
