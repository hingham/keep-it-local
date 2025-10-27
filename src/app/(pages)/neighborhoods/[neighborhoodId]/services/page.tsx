'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header/header';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import CardGrid from '@/components/CardGrid/cardGrid';
import { Service, Neighborhood, ServiceCategory } from '@/types/events';
import ErrorComponent from '@/components/ErrorComponent/errorComponent';
import CategoryFilter from '@/components/CategoryFilter/categoryFilter';
import NewListingButton from '../../../../../components/NewListingButton/newListing';
import Loading from '@/components/Loading/loading';

export default function NeighborhoodServicesPage() {
  const params = useParams();
  const neighborhoodId = decodeURIComponent(params.neighborhoodId as string);
  const [neighborhood, setNeighborhood] = useState<
    Pick<Neighborhood, 'id' | 'neighborhood' | 'city' | 'state' | 'macro_neighborhood'>
  >({ id: 0, neighborhood: '', city: '', state: '', macro_neighborhood: '' });
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Now fetch services for this specific neighborhood
        const servicesRes = await fetch(`/api/public/services?neighborhood_id=${neighborhoodId}`);
        if (!servicesRes.ok) {
          throw new Error('Failed to fetch services');
        }

        const servicesData = await servicesRes.json();

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

  const handleCategoryFilter = (category: ServiceCategory | 'all') => {
    setSelectedCategory(category);
  };

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredServices(services);
    } else {
      const filtered = services.filter(service => {
        const categories = Array.isArray(service.categories)
          ? service.categories
          : [service.categories];
        return categories.includes(selectedCategory as ServiceCategory);
      });
      setFilteredServices(filtered);
    }
  }, [selectedCategory, services]);

  if (loading) {
    return (
      <Loading message="Loading services..." />
    )
  }

  if (error || !services) {
    return (
      <ErrorComponent message={error || 'Services not found'} returnTo={`/cities`} />
    );
  }

  return (
    <div className="min-h-screen dark:bg-gray-900 flex flex-col">
      <Breadcrumb items={[
        { label: neighborhood.city.toUpperCase(), href: `/${neighborhood.city}` },
        { label: neighborhood.neighborhood, href: `/neighborhoods/${encodeURIComponent(neighborhoodId)}` },
        { label: 'Services' }
      ]} />
      <div className="container mx-auto py-8 flex-1">

        {/* Header */}
        <Header
          title={'Your neighbors have skills. These local services are available to help.'}
          subtitle={`${neighborhood.city}, ${neighborhood.state} • ${neighborhood.macro_neighborhood} • ${neighborhood.neighborhood}`}
        />

        <CategoryFilter<ServiceCategory, Service>
          handleCategoryFilter={handleCategoryFilter}
          categoryEnum={ServiceCategory}
          selectedCategory={selectedCategory}
          items={services}
          filteredItems={filteredServices}
        />

        {/* Services Grid */}
        <CardGrid
          items={services}
          getHref={(service) => `/neighborhoods/${encodeURIComponent(neighborhoodId)}/services/${service.id}`}
          getHeading={(service) => (service as Service).title || ''}
          getDetails={(service) => (service as Service).owner || ''}
          emptyMessage={`No services found in ${neighborhood.neighborhood}`}
        />
      </div>

      {/* Create New Listing Button - Fixed at bottom */}
        <NewListingButton neighborhoodId={neighborhoodId} />
    </div>
  );
}
