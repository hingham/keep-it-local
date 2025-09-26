'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Event } from '@/types/events';
import { ItemDetails } from '@/components/ItemDetails/itemDetails';
import ErrorComponent from '@/components/ErrorComponent/errorComponent';
import Back from '@/components/Breadcrumb/Back';

// Event Detail Component
function EventDetailComponent({ event, neighborhoodName, neighborhoodId }: { event: Event; neighborhoodName: string; neighborhoodId: string }) {
  const [isSharing, setIsSharing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleShare = async () => {
    if (!event) return;

    const shareData = {
      title: event.title,
      text: `Check out this event in ${neighborhoodName}: ${event.title}`,
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

  return (
    <div className="min-h-screen dark:bg-gray-900 w-full py-8 px-4 sm:px-6 lg:px-8">

        <Back
          title={event.title}
          returnToHref={`/neighborhoods/${encodeURIComponent(neighborhoodId)}/events`}
          returnToText="Events"
        />

        <ItemDetails item={event} />

    </div>
  );
}

// Main Page Component (Wrapper)
export default function NeighborhoodEventDetailPage() {
  const params = useParams();
  const neighborhoodId = params.neighborhoodId as string;
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsRes = await fetch(`/api/neighborhoods/${neighborhoodId}/events/${eventId}`);
        if (!eventsRes.ok) {
          throw new Error('Failed to fetch events');
        }
        const foundEvent: Event = await eventsRes.json();

        setEvent(foundEvent);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (eventId && neighborhoodId) {
      fetchData();
    }
  }, [eventId, neighborhoodId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading event...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <ErrorComponent message={error || 'Event not found'} returnTo={`/neighborhoods/${neighborhoodId}/events`} />
    );
  }

  return (
    <EventDetailComponent
      event={event}
      neighborhoodName={event.neighborhood}
      neighborhoodId={neighborhoodId}
    />
  );
}