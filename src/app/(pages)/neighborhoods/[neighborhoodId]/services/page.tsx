'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/Header/header';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import CardGrid from '@/components/CardGrid/cardGrid';
import { Service, Neighborhood, ServiceCategory } from '@/types/events';
import ErrorComponent from '@/components/ErrorComponent/errorComponent';
import CategoryFilter from '@/components/CategoryFilter/categoryFilter';

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
        const servicesRes = await fetch(`/api/neighborhoods/${neighborhoodId}/services`);
        if (!servicesRes.ok) {
          throw new Error('Failed to fetch services');
        }

        const servicesData = await servicesRes.json();

        setNeighborhood({
          id: services[0]?.neighborhood_id || 0,
          neighborhood: services[0]?.neighborhood || '',
          city: services[0]?.city || '',
          state: services[0]?.state || '',
          macro_neighborhood: services[0]?.macro_neighborhood || ''
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
  }, [neighborhoodId, services]);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading services...</div>
      </div>
    );
  }

  if (error || !services) {
    return (
      <ErrorComponent message={error || 'Services not found'} returnTo={`/cities`} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[
          { label: neighborhood.city.toUpperCase(), href: `/${neighborhood.city}` },
          { label: neighborhood.neighborhood, href: `/neighborhoods/${encodeURIComponent(neighborhoodId)}` },
          { label: 'Services' }
        ]} />

        {/* Header */}
        <Header
          title={`Services in ${neighborhood.neighborhood}`}
          subtitle={`${neighborhood.city}, ${neighborhood.state} • ${neighborhood.macro_neighborhood}`}
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
    </div>
  );
}
