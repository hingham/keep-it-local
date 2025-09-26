'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { EventCategory, Neighborhood, Event } from '@/types/events';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import CardGrid from '@/components/CardGrid/cardGrid';
import ErrorComponent from '@/components/ErrorComponent/errorComponent';
import CategoryFilter from '@/components/CategoryFilter/categoryFilter';
import NewListingButton from '../../../../../components/NewListingButton/newListing';
import Header from '@/components/Header/header';

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


        // If there are no events this ensures neighborhood data is still fetched
        const neighborhoodRes = await fetch(`/api/neighborhoods/${neighborhoodId}`);
        if (!neighborhoodRes.ok) {
          throw new Error('Failed to fetch neighborhood');
        }
        const neighborhoodData: Neighborhood = await neighborhoodRes.json();

        setNeighborhood({
          id: neighborhoodData.id,
          neighborhood: neighborhoodData.neighborhood,
          city: neighborhoodData.city,
          state: neighborhoodData.state,
          macro_neighborhood: neighborhoodData.macro_neighborhood
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
    <div className="min-h-screen dark:bg-gray-900 flex flex-col">
      <Breadcrumb items={[
        { label: neighborhood.city.toUpperCase(), href: `/${neighborhood.city}` },
        { label: neighborhood.neighborhood, href: `/neighborhoods/${encodeURIComponent(neighborhoodId)}` },
        { label: 'Events' }
      ]} />
      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Header */}
        <Header
          title={'Local events in your neighborhood.'}
          subtitle={`${neighborhood.city}, ${neighborhood.state} • ${neighborhood.macro_neighborhood} • ${neighborhood.neighborhood}`}
        />

        {/* Header */}
        {/* <Header
          title={`${neighborhood.neighborhood} Events`}
        /> */}

        <CategoryFilter<EventCategory, Event>
          handleCategoryFilter={handleCategoryFilter}
          categoryEnum={EventCategory}
          selectedCategory={selectedCategory}
          items={events}
          filteredItems={filteredEvents}
        />

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
      {/* Create New Listing Button - Fixed at bottom */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg">
        <NewListingButton neighborhoodId={neighborhoodId} />
      </div>
    </div>
  );
}
