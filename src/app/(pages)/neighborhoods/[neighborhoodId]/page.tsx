'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { Neighborhood, Event, Service } from '@/types/events';
import CardGrid from '@/components/CardGrid/cardGrid';
import ErrorComponent from '@/components/ErrorComponent/errorComponent';
import NewListingButton from './events/newListing';

export default function NeighborhoodPage() {
  const params = useParams();
  const neighborhoodId = decodeURIComponent(params.neighborhoodId as string);
  console.log('Neighborhood ID:', neighborhoodId);
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First fetch neighborhoods to find the neighborhood by id
        const neighborhoodRes = await fetch(`/api/neighborhoods/${neighborhoodId}`);
        if (!neighborhoodRes.ok) {
          throw new Error('Failed to fetch neighborhoods');
        }

        const foundNeighborhood: Neighborhood = await neighborhoodRes.json();

        if (!foundNeighborhood) {
          throw new Error('Neighborhood not found');
        }

        // Now fetch events and services for this specific neighborhood
        const [eventsRes, servicesRes] = await Promise.all([
          fetch(`/api/neighborhoods/${foundNeighborhood.id}/events`),
          fetch(`/api/neighborhoods/${foundNeighborhood.id}/services`)
        ]);

        if (!eventsRes.ok || !servicesRes.ok) {
          throw new Error('Failed to fetch events or services');
        }

        const [eventsData, servicesData] = await Promise.all([
          eventsRes.json(),
          servicesRes.json()
        ]);

        setNeighborhood(foundNeighborhood);
        setEvents(eventsData);
        setServices(servicesData);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading neighborhood...</div>
      </div>
    );
  }

  if (error || !neighborhood) {
    return <ErrorComponent message={error || 'Neighborhood not found'} returnTo='/' />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between">
            <Breadcrumb items={[
              { label: neighborhood.city.toUpperCase(), href: `/${encodeURIComponent(neighborhood.city.toLowerCase())}` },
              { label: neighborhood.neighborhood }
            ]} />
            {/* <QRCodeButton /> */}
          </div>

          {/* Header */}
          {/* <Header
            title={neighborhood.neighborhood}
            subtitle={`${neighborhood.city}, ${neighborhood.state} • ${neighborhood.macro_neighborhood}`}
          /> */}

          {/* Content Sections */}
          <div className="space-y-12 pb-20">
            {/* Events Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <Link
                  href={`/neighborhoods/${encodeURIComponent(neighborhoodId)}/events`}
                  className="group link"
                >
                  <h2 className="text-xl md:text-2xl font-bold transition-colors duration-200 cursor-pointer">
                    Upcoming Events
                    <svg className="inline-block w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </h2>
                </Link>
              </div>
              <CardGrid
                maxRows={1}
                items={events.slice(0, 4)}
                getHref={(event) => `/neighborhoods/${encodeURIComponent(neighborhoodId)}/events/${event.id}`}
                getHeading={(event) => event.title || ''}
                getDetails={(event) => {
                  if ('location' in event && typeof event.location === 'string') {
                    return event.location;
                  }
                  return '';
                }}
                emptyMessage={
                  `No events found in ${neighborhood.neighborhood}`
                }
              />
            </div>

            {/* Services Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <Link
                  href={`/neighborhoods/${encodeURIComponent(neighborhoodId)}/services`}
                  className="group link"
                >
                  <h2 className="text-xl md:text-2xl font-bold transition-colors duration-200">
                    Local Services
                    <svg className="inline-block w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </h2>
                </Link>
              </div>
              <CardGrid
                maxRows={1}
                items={services.slice(0, 4)}
                getHref={(service) => `/neighborhoods/${encodeURIComponent(neighborhoodId)}/services/${service.id}`}
                getHeading={(service) => (service as Service).title || ''}
                getDetails={(service) => (service as Service).owner || ''}
                emptyMessage={`No services found in ${neighborhood.neighborhood}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Create New Listing Button - Fixed at bottom */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg">
        <NewListingButton neighborhoodId={neighborhoodId} />
      </div>
    </div>
  );
}
