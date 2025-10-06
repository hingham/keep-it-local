'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { Neighborhood, Event, Service } from '@/types/events';
import CardGrid from '@/components/CardGrid/cardGrid';
import ErrorComponent from '@/components/ErrorComponent/errorComponent';

export default function MacroNeighborhoodPage() {
  const params = useParams();
  const macroNeighborhood = decodeURIComponent(params.macroNeighborhood as string).replace(/_/g, ' ');
  const city = decodeURIComponent(params.city as string)

  // const city = searchParams.get('city') || '';

  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all neighborhoods in this macro-neighborhood
        // TODO this should at least be filtered by city in the future
        const neighborhoodsRes = await fetch('/api/neighborhoods');
        if (!neighborhoodsRes.ok) {
          throw new Error('Failed to fetch neighborhoods');
        }

        const allNeighborhoods: Neighborhood[] = await neighborhoodsRes.json();
        
        const macroNeighborhoods = allNeighborhoods.filter(
          n => n.macro_neighborhood === macroNeighborhood &&
            n.city.toLowerCase() === city.toLowerCase()
        );

        if (macroNeighborhoods.length === 0) {
          throw new Error('Macro-neighborhood not found');
        }

        setNeighborhoods(macroNeighborhoods);

        // Get all neighborhood IDs for fetching events and services
        const neighborhoodIds = macroNeighborhoods.map(n => n.id);

        // Fetch all events and services for these neighborhoods
        // TODO: This should be updated to get events from public_events database in the future
        const [eventsRes, servicesRes] = await Promise.all([
          fetch('/api/events?verified=true'),
          fetch('/api/services?verified=true')
        ]);

        if (!eventsRes.ok || !servicesRes.ok) {
          throw new Error('Failed to fetch events or services');
        }

        const [allEvents, allServices] = await Promise.all([
          eventsRes.json(),
          servicesRes.json()
        ]);

        // Filter events and services by neighborhood IDs
        const filteredEvents = allEvents.filter((event: Event) =>
          neighborhoodIds.includes(event.neighborhood_id)
        );
        const filteredServices = allServices.filter((service: Service) =>
          neighborhoodIds.includes(service.neighborhood_id)
        );

        setEvents(filteredEvents);
        setServices(filteredServices);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (macroNeighborhood && city) {
      fetchData();
    }
  }, [macroNeighborhood, city]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading macro-neighborhood...</div>
      </div>
    );
  }

  if (error || neighborhoods.length === 0) {
    return <ErrorComponent message={error || 'Macro-neighborhood not found'} returnTo={city ? `/${city}` : '/'} />;
  }

  const firstNeighborhood = neighborhoods[0];
  const neighborhoodNames = neighborhoods.map(n => n.neighborhood).join(', ');

  return (
    <div>
        <div className="w-full mx-auto">
          <Breadcrumb items={[
            { label: firstNeighborhood.city.toUpperCase(), href: `/${encodeURIComponent(firstNeighborhood.city.toLowerCase())}` },
            { label: macroNeighborhood }
          ]} />
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-text-secondary text-sm md:text-base">
                {macroNeighborhood} • {firstNeighborhood.city}, {firstNeighborhood.state} • {neighborhoods.length} neighborhood{neighborhoods.length !== 1 ? 's' : ''}
              </p>
              <p className="text-text-secondary text-xs md:text-sm mt-1">
                {neighborhoodNames}
              </p>
            </div>
          </div>


          {/* Content Sections */}
          <div className="space-y-12">
            {/* Events Section */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-6">
                Upcoming Events ({events.length})
              </h2>

              <CardGrid
                items={events}
                getHref={(event) => {
                  const neighborhood = neighborhoods.find(n => n.id === event.neighborhood_id);
                  return `/neighborhoods/${neighborhood?.id}/events/${event.id}`;
                }}
                getHeading={(event) => event.title || ''}
                getDetails={(event) => {
                  if ('location' in event && typeof event.location === 'string') {
                    return event.location;
                  }
                  return '';
                }}
                emptyMessage={
                  `No events found in ${macroNeighborhood}`
                }
              />
            </div>

            {/* Services Section */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-6">
                Local Services ({services.length})
              </h2>
              <CardGrid
                items={services}
                getHref={(service) => {
                  const neighborhood = neighborhoods.find(n => n.id === service.neighborhood_id);
                  return `/neighborhoods/${neighborhood?.id}/services/${service.id}`;
                }}
                getHeading={(service) => service.title || ''}
                getDetails={(service) => (service as Service).owner || ''}
                emptyMessage={`No services found in ${macroNeighborhood}`}
              />
            </div>

            {/* Neighborhoods List */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-6">
                Neighborhoods in {macroNeighborhood}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {neighborhoods.map((neighborhood) => (
                  <a
                    key={neighborhood.id}
                    href={`/neighborhoods/${neighborhood.id}`}
                    className="block p-4 bg-surface rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-primary/5 transition-colors group"
                  >
                    <h3 className="font-medium text-primary group-hover:text-primary-dark">
                      {neighborhood.neighborhood}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                      {neighborhood.city}, {neighborhood.state}
                    </p>
                  </a>
                ))}
              </div>
            </div>
            <p className="text-s text-text-light bg-secondary dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
              * To add an event or service, first select a local neighborhood from the list above.
            </p>

          </div>

        </div>
      {/* <Footer /> */}
    </div>
  );
}
