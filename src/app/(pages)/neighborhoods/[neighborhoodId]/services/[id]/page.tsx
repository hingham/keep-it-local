'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Service } from '@/types/events';
import ErrorComponent from '@/components/ErrorComponent/errorComponent';
import { ItemDetails } from '@/components/ItemDetails/itemDetails';
import Back from '@/components/Breadcrumb/Back';

export default function NeighborhoodServiceDetailPage() {
  const params = useParams();
  const neighborhoodId = decodeURIComponent(params.neighborhoodId as string);
  const serviceId = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const serviceRes = await fetch(`/api/neighborhoods/${neighborhoodId}/services/${serviceId}`);

        if (!serviceRes.ok) {
          throw new Error('Failed to fetch service');
        }

        const foundService: Service = await serviceRes.json();

        if (!foundService) {
          throw new Error('Service not found');
        }

        setService(foundService);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (serviceId && neighborhoodId) {
      fetchData();
    }
  }, [serviceId, neighborhoodId]);

   if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading service...</div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <ErrorComponent message={error || 'Service not found'} returnTo={`/neighborhoods/${encodeURIComponent(neighborhoodId)}/services`} />
    );
  }

  return (
    <div className="min-h-screen w-full">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <Back
          title={service.title}
          returnToHref={`/neighborhoods/${encodeURIComponent(neighborhoodId)}/services`}
          returnToText="Services"
        />

      <ItemDetails item={service} /> 
      </div>
    </div>
  );
}
