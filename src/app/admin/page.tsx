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
import { AdminEvent, AdminService } from "@/types/events";
import Header from "@/components/Header/header";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import Loading from "@/components/Loading/loading";
import QRCodeButton from "@/components/QRCodeButton/QRCodeButton";

export default function AdminPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [services, setServices] = useState<AdminService[]>([]);
  const [contentType, setContentType] = useState<'events' | 'services'>('events');
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [savedApiKey, setSavedApiKey] = useState<boolean>(false);

  const unsetApiKey = () => {
    setApiKey('');
    setSavedApiKey(false);
    setEvents([]);
    setServices([]);
    setError(null);
  }

  const fetchUnverifiedContent = async (type: 'events' | 'services' = contentType) => {
    setSavedApiKey(true);
    console.log(`Fetching unverified ${type}...`);
    try {
      setLoading(true);
      const response = await fetch(`/api/${type}?verified=false`, {
        headers: {
          'x-api-key': apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${type}`);
      }

      const data = await response.json();
      if (type === 'events') {
        setEvents(data);
      } else {
        setServices(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnverifiedEvents = async () => {
    await fetchUnverifiedContent('events');
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

  const handleVerifyService = async (serviceId: number) => {
    try {
      setUpdating(serviceId);
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ verified: true })
      });

      if (!response.ok) {
        throw new Error('Failed to verify service');
      }

      // Remove the verified service from the list
      setServices(prevServices => prevServices.filter(service => service.id !== serviceId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to verify service');
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleContentType = (type: 'events' | 'services') => {
    setContentType(type);
    if (savedApiKey) {
      fetchUnverifiedContent(type);
    }
  };

  const breadcrumbItems = [
    { label: 'The Local Board', href: '/' },
    { label: 'Admin' }
  ];

  if (savedApiKey == false) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Breadcrumb items={breadcrumbItems} />
        <div className="container mx-auto px-4 py-8">
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
      <Loading message={`Loading unverified ${contentType}...`} />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Breadcrumb items={breadcrumbItems} />
        <div className="container mx-auto px-4 py-8">
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
      <Breadcrumb items={breadcrumbItems} />
      <div className="container mx-auto px-4 py-8">

        <Header
          title="Content Moderation"
          subtitle={`${contentType === 'events' ? events.length : services.length} unverified ${contentType} pending review`}
        />

        {/* Content Type Toggle */}
        <div className="mb-6">
          <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handleToggleContentType('events')}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
                contentType === 'events'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Events ({events.length})
            </button>
            <button
              onClick={() => handleToggleContentType('services')}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
                contentType === 'services'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Services ({services.length})
            </button>
          </div>
        </div>

        {contentType === 'events' ? (
          events.length === 0 ? (
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
                    {/* AdminEvent Image */}
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

                    {/* AdminEvent Details */}
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
          )
        ) : (
          services.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-xl text-gray-600 dark:text-gray-400">
                🎉 All services are verified! No pending reviews.
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {services.map((service) => (
                <div key={service.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* AdminService Image */}
                    {service.imageurl && (
                      <div className="flex-shrink-0">
                        <Image
                          src={service.imageurl}
                          alt={service.title}
                          width={192}
                          height={128}
                          className="w-full md:w-48 h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* AdminService Details */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {service.title}
                          </h3>

                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <div><strong>Owner:</strong> {service.owner}</div>
                            <div><strong>Neighborhood:</strong> {service.neighborhood}, {service.city}, {service.state}</div>
                            {service.contact_number && <div><strong>Phone:</strong> {service.contact_number}</div>}
                            {service.contact_email && <div><strong>Email:</strong> {service.contact_email}</div>}
                            {service.website && (
                              <div>
                                <strong>Website:</strong>
                                <a href={service.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                  {service.website}
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Categories */}
                          {service.categories && service.categories.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {service.categories.map((category, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full"
                                >
                                  {category}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Description */}
                          {service.description && (
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                              {service.description}
                            </p>
                          )}

                          {/* Metadata */}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <div>Service ID: {service.id}</div>
                            <div>Created: {new Date(service.created_at).toLocaleString()}</div>
                            {service.internal_creator_contact && (
                              <div>Contact: {service.internal_creator_contact}</div>
                            )}
                          </div>
                        </div>

                        {/* Verification Button */}
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => handleVerifyService(service.id)}
                            disabled={updating === service.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updating === service.id ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Verifying...
                              </div>
                            ) : (
                              '✓ Verify Service'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => fetchUnverifiedContent(contentType)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh {contentType === 'events' ? 'Events' : 'Services'}
          </button>
        </div>
      </div>
    </div >
  );
}

