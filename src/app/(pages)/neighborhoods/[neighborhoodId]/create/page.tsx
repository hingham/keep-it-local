'use client';

import { useState, useEffect, ReactElement } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { CreateEvent, CreateService, EventCategory, Neighborhood, ServiceCategory } from '@/types/events';

export default function CreateListingPage() {
  const neighborhoodId = useParams().neighborhoodId as string;
  const router = useRouter();
  const [listingType, setListingType] = useState<'event' | 'service'>('event');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Event form state
  const [eventData, setEventData] = useState<CreateEvent>({
    title: '',
    neighborhood_id: neighborhoodId ? parseInt(neighborhoodId) : 0,
    location: '',
    website: '',
    date: '',
    time: '',
    recurring: false,
    categories: [] as EventCategory[],
    description: '',
    imageurl: '',
    verified: false,
    delete_after: '',
    internal_creator_contact: '',
  });

  // Service form state
  const [serviceData, setServiceData] = useState<CreateService>({
    title: '',
    neighborhood_id: neighborhoodId ? parseInt(neighborhoodId) : 0,
    categories: [] as ServiceCategory[],
    imageurl: '',
    owner: '',
    website: '',
    contact_number: '',
    contact_email: '',
    description: '',
    delete_after: '',
    internal_creator_contact: '',
    verified: false,
  });

  useEffect(() => {
    const fetchNeighborhood = async () => {
      try {
        const response = await fetch(`/api/neighborhoods/${neighborhoodId}`);
        if (response.ok) {
          const data = await response.json();
          setNeighborhood(data);
        }
      } catch (error) {
        console.error('Error fetching neighborhood:', error);
      }
    };

    fetchNeighborhood();
  }, [neighborhoodId]);

  const handleRecurringChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const checked = (e.target as HTMLInputElement).checked;

    setEventData(prev => ({ ...prev, recurring: checked, date_list: [''] }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    const checked = (e.target as HTMLInputElement).checked;
    const finalValue = type === 'checkbox' ? checked : value;

    if (listingType === 'event') {
      setEventData(prev => ({ ...prev, [name]: finalValue }));
    } else {
      setServiceData(prev => ({ ...prev, [name]: finalValue }));
    }
  };


  const getInternalFormFields = (item: CreateEvent | CreateService): ReactElement => {
    return (
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Date to delete. Defaults to 3 weeks for services or event date.
            <input
              type="date"
              name="delete_after"
              value={item.delete_after}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
              placeholder="(555) 123-4567"
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Internal contact email. This will not be published or displayed anywhere. We use this email internally to send you a unique id for your posting. You can use this id to request the posting to be removed. The email provided will be deleted with the posting.
            <input
              required={true}
              type="email"
              name="internal_creator_contact"
              value={item.internal_creator_contact}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
              placeholder="test@example.com"
            />
          </label>
        </div>
      </div >
    )
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleCategoryToggle = (category: EventCategory) => {
    setEventData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };


  const updateSharedFormData = (item: CreateEvent | CreateService, formData: FormData) => {
    // Shared
    formData.append('neighborhood_id', neighborhoodId);

    formData.append('title', item.title);
    formData.append('description', item.description || item.title);
    formData.append('internal_creator_contact', item.internal_creator_contact || '');
    formData.append('verified', 'false');
    if (item.website) formData.append('website', item.website);
  }

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();

      // Add all event data to FormData
      formData.append('location', eventData.location);
      formData.append('date', eventData.date);
      formData.append('time', eventData.time);
      formData.append('date_list', JSON.stringify(eventData.date_list || []));

      console.log({ eventData })
      formData.append('recurring', String(eventData.recurring));
      formData.append('categories', JSON.stringify(eventData.categories));
      formData.append('delete_after', eventData.delete_after || eventData.date); // Default to 3 weeks from now

      updateSharedFormData(eventData, formData);

      if (eventData.website) formData.append('website', eventData.website);


      // Add image if selected
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await fetch('/api/events', {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        throw new Error('Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();

      // Add all service data to FormData
      formData.append('owner', serviceData.owner);
      if (serviceData.contact_number) formData.append('contact_number', serviceData.contact_number);
      if (serviceData.contact_email) formData.append('contact_email', serviceData.contact_email);
      formData.append('delete_after', serviceData.delete_after || new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()); // Default to 3 weeks from now

      updateSharedFormData(serviceData, formData);

      // Add image if selected
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await fetch('/api/services', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          // Return user to neighborhood page after successful item creation
          router.push(`/neighborhoods/${neighborhoodId}`);
        }, 2000);
      } else {
        throw new Error('Failed to create service');
      }
    } catch (error) {
      console.error('Error creating service:', error);
      alert('Failed to create service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbItems = [
    { label: neighborhood?.neighborhood || 'Unknown Neighborhood', href: `/neighborhoods/${neighborhoodId}` },
    { label: 'Create Listing' }
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">
            {listingType === 'event' ? 'Event' : 'Service'} Created Successfully!
          </h2>
          <p className="text-text-secondary mb-4">
            Your listing has been submitted for review and will be published once approved.
          </p>
          <p className="text-text-secondary">Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  function addAdditionalDates(): void {
    setEventData(prev => ({ ...prev, date_list: [...(prev.date_list || []), ''] }));
  }

  function handleDateListChange(e: React.ChangeEvent<HTMLInputElement>, index: number): void {
      setEventData(prev => {
        const newDateList = [...(prev.date_list || [])];
        newDateList[index] = e.target.value;
        return { ...prev, date_list: newDateList };
      });
  };

  function removeAdditionalDates(): void {
    setEventData(prev => {
      if (!prev.date_list || prev.date_list.length === 0) return prev;
      const newDateList = [...prev.date_list];
      newDateList.pop();
      return { ...prev, date_list: newDateList };
    });
  }
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={breadcrumbItems} />

        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-text mb-8">Create New Listing</h1>

          {/* Listing Type Toggle */}
          <div className="flex bg-surface rounded-lg p-1 mb-8">
            <button
              type="button"
              onClick={() => setListingType('event')}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${listingType === 'event'
                ? 'bg-secondary text-white'
                : 'text-text-secondary hover:text-text'
                }`}
            >
              Create Event
            </button>
            <button
              type="button"
              onClick={() => setListingType('service')}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${listingType === 'service'
                ? 'bg-secondary text-white'
                : 'text-text-secondary hover:text-text'
                }`}
            >
              Create Service
            </button>
          </div>

          {/* Image Upload Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-text mb-2">
              Upload Image (Optional)
            </label>

            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-text-secondary mb-2">Click to upload an image</p>
                  <p className="text-sm text-text-secondary">PNG, JPG, GIF up to 10MB</p>
                </label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-100 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Event Form */}
          {listingType === 'event' && (
            <form onSubmit={handleEventSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Event Title *
                  <input
                    type="text"
                    name="title"
                    required
                    value={eventData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                    placeholder="Enter event title"
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Location *
                  <input
                    type="text"
                    name="location"
                    required
                    value={eventData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                    placeholder="Enter event location"
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Website
                  <input
                    type="url"
                    name="website"
                    value={eventData.website}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                    placeholder="https://example.com"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Date *
                    <input
                      type="date"
                      name="date"
                      required
                      value={eventData.date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Time
                    <input
                      type="time"
                      name="time"
                      value={eventData.time}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(EventCategory).map(category => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategoryToggle(category)}
                      className={`px-4 py-2 rounded-full border transition-colors ${eventData.categories.includes(category)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-background text-text border-gray-300 dark:border-gray-600 hover:border-primary'
                        }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="recurring"
                    checked={eventData.recurring}
                    onChange={handleRecurringChange}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text">This is a recurring event</span>
                </label>
              </div>
              {eventData.recurring && (
                <div>
                  <div className="text-sm w-full bg-gray-100 p-2 rounded-md mb-1" onClick={addAdditionalDates}>
                    Add Additional Dates
                  </div>
                  <div className="text-sm w-full bg-gray-100 p-2 rounded-md mb-1" onClick={removeAdditionalDates}>
                    Remove Additional Dates
                  </div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Additional Dates
                    {eventData.date_list && eventData.date_list.length > 0 && (
                      eventData.date_list.map((date, index) => (
                        <input
                          key={index}
                          type="date"
                          name="recurrence_pattern"
                          value={date}
                          onChange={(e) => handleDateListChange(e, index)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                        />
                      ))
                    )}
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Description
                  <textarea
                    name="description"
                    value={eventData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                    placeholder="Describe your event..."
                  />
                </label>
              </div>
              {getInternalFormFields(eventData)}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary text-white py-3 px-4 rounded-md font-medium hover:bg-secondary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Event...' : 'Create Event'}
              </button>
            </form>
          )}

          {/* Service Form */}
          {listingType === 'service' && (
            <form onSubmit={handleServiceSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Service Title *
                  <input
                    type="text"
                    name="title"
                    required
                    value={serviceData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                    placeholder="Enter service title"
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Business/Owner Name *
                  <input
                    type="text"
                    name="owner"
                    required
                    value={serviceData.owner}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                    placeholder="Enter business or owner name"
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Website
                  <input
                    type="url"
                    name="website"
                    value={serviceData.website}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                    placeholder="https://example.com"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Contact Number
                    <input
                      type="tel"
                      name="contact_number"
                      value={serviceData.contact_number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                      placeholder="(555) 123-4567"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Contact Email
                    <input
                      type="email"
                      name="contact_email"
                      value={serviceData.contact_email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                      placeholder="contact@example.com"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Description
                  <textarea
                    name="description"
                    value={serviceData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                    placeholder="Describe your service..."
                  />
                </label>
              </div>
              {getInternalFormFields(serviceData)}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary text-white py-3 px-4 rounded-md font-medium hover:bg-secondary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Service...' : 'Create Service'}
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}
