'use client';

/**
 * AdminPage component for moderating unverified events.
 * Admin should review details to make sure posting is appropriate for viewers before making posting public.
 * Extension on this would be to have a automated agent review first and only notify human admin if certain flags are raised.
 *  - image check for appropriate content
 *  - check text for reasonable + appropriate content
 *  - lots of content moderation tools available via third party APIs
 * Admin page protected by x-api-key header. User must specify url to view page as it does not link directly from within main site.
*/

import { useState } from "react";
import Image from "next/image";
import { Event } from "@/types/events";
import Header from "@/components/Header/header";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import Loading from "@/components/Loading/loading";
import QRCodeButton from "@/components/QRCodeButton/QRCodeButton";

export default function AdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [savedApiKey, setSavedApiKey] = useState<boolean>(false);

  const unsetApiKey = () => {
    setApiKey('');
    setSavedApiKey(false);
    setEvents([]);
    setError(null);
  }

  const fetchUnverifiedEvents = async () => {
    setSavedApiKey(true);
    console.log('Using API Key:', savedApiKey, apiKey);
    try {
      setLoading(true);
      const response = await fetch('/api/events?verified=false', {
        headers: {
          'x-api-key': apiKey
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEvent = async (eventId: number) => {
    try {
      setUpdating(eventId);
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ verified: true })
      });

      if (!response.ok) {
        throw new Error('Failed to verify event');
      }

      // Remove the verified event from the list
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to verify event');
    } finally {
      setUpdating(null);
    }
  };

  const breadcrumbItems = [
    { label: 'Admin' }
  ];

  if (savedApiKey == '') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Breadcrumb items={breadcrumbItems} />
            <QRCodeButton />
          </div>
          <div className="text-center py-8 text-red-600">
            <div className="text-xl">Error: API key is not set. Please set the API_KEY environment variable.</div>
            <input
              type="text"
              placeholder="Enter API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-4 px-4 py-2 border rounded w-full max-w-md mx-auto"
            />
            <button
              onClick={fetchUnverifiedEvents}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <Loading message="Loading unverified events..." />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Breadcrumb items={breadcrumbItems} />
            <QRCodeButton />
          </div>
          <div className="text-center py-8 text-red-600">
            <div className="text-xl">Error: {error}</div>
            <button
              onClick={unsetApiKey}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Breadcrumb items={breadcrumbItems} />
          <QRCodeButton />
        </div>

        <Header
          title="Event Moderation"
          subtitle={`${events.length} unverified events pending review`}
        />

        {events.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-xl text-gray-600 dark:text-gray-400">
              🎉 All events are verified! No pending reviews.
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Event Image */}
                  {event.imageurl && (
                    <div className="flex-shrink-0">
                      <Image
                        src={event.imageurl}
                        alt={event.title}
                        width={192}
                        height={128}
                        className="w-full md:w-48 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* Event Details */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {event.title}
                        </h3>

                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <div><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</div>
                          {event.time && <div><strong>Time:</strong> {event.time}</div>}
                          <div><strong>Location:</strong> {event.location}</div>
                          <div><strong>Neighborhood:</strong> {event.neighborhood}, {event.city}, {event.state}</div>
                          {event.website && (
                            <div>
                              <strong>Website:</strong>
                              <a href={event.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                {event.website}
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Categories */}
                        {event.categories && event.categories.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {event.categories.map((category, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Description */}
                        {event.description && (
                          <p className="text-gray-700 dark:text-gray-300 mb-4">
                            {event.description}
                          </p>
                        )}

                        {/* Metadata */}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <div>Event ID: {event.id}</div>
                          <div>Created: {new Date(event.created_at).toLocaleString()}</div>
                          {event.internal_creator_contact && (
                            <div>Contact: {event.internal_creator_contact}</div>
                          )}
                        </div>
                      </div>

                      {/* Verification Button */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleVerifyEvent(event.id)}
                          disabled={updating === event.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updating === event.id ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Verifying...
                            </div>
                          ) : (
                            '✓ Verify Event'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchUnverifiedEvents}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh List
          </button>
        </div>
      </div>
    </div>
  );
}

