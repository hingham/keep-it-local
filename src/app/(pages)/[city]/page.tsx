'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import { useParams } from "next/navigation";

interface Neighborhood {
  id: number;
  neighborhood: string;
  city: string;
  state: string;
  macro_neighborhood: string;
  created_at: string;
}

export default function City() {
  const params = useParams();
  const city = decodeURIComponent(params.city as string);

  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNeighborhoods = async () => {
      try {
        const response = await fetch('/api/neighborhoods');
        if (response.ok) {
          const data = await response.json();
          const filteredData = data.filter((n: Neighborhood) => n.city.toLowerCase() === city.toLowerCase());
          setNeighborhoods(filteredData);
        }
      } catch (error) {
        console.error('Failed to fetch neighborhoods:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNeighborhoods();
  }, []);

  // Group neighborhoods by macro_neighborhood
  const groupedNeighborhoods = neighborhoods.reduce((acc, neighborhood) => {
    const macroNeighborhood = neighborhood.macro_neighborhood || 'Other';
    if (!acc[macroNeighborhood]) {
      acc[macroNeighborhood] = [];
    }
    acc[macroNeighborhood].push(neighborhood);
    return acc;
  }, {} as Record<string, Neighborhood[]>);
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <main className="flex-1 flex flex-col gap-[32px] items-center sm:items-start p-8 pb-20 gap-16 sm:p-20">
        <div className="w-full max-w-4xl mx-auto">
          
          <div className="text-center mx-auto">

            <Link href="/" className="text-sm text-primary hover:underline mb-4 inline-block">
              <h1 className="text-4xl sm:text-6xl font-bold text-text-primary mb-4">
                Keep it Local
              </h1>
            </Link>

            <p className="text-lg text-text-secondary max-w-2xl mb-6">
              Supporting local businesses and communities through technology
            </p>
          </div>

          {/* Site Body */}

          {/* Neighborhoods Section */}
          <div className="w-full">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-text-secondary">Loading neighborhoods...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 place-items-stretch gap-6">
                {Object.entries(groupedNeighborhoods).map(([macroNeighborhood, neighborhoods]) => (
                  <div key={macroNeighborhood} className="bg-surface rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">
                      {macroNeighborhood}
                    </h3>
                    <ul className="space-y-2">
                      {neighborhoods.map((neighborhood) => (
                        <li key={neighborhood.id} className="text-text-secondary">
                          <Link
                            href={`/neighborhoods/${encodeURIComponent(neighborhood.id)}`}
                            className="block hover:bg-primary/10 p-2 rounded transition-colors"
                          >
                            <div className="font-medium text-primary hover:text-primary-dark hover:underline">
                              {neighborhood.neighborhood}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Create New Listing Button - Fixed at bottom */}
      <div className="sticky bottom-0 bg-background border-t border-gray-200 dark:border-gray-700 p-4 mt-auto">
        <div className="max-w-4xl mx-auto text-left">
          <Link
            href={`/${city}/create`}
            className="inline-flex items-center px-6 py-3 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition-colors font-medium"
          >
            + Create New Listing
          </Link>
        </div>
      </div>

      <Footer />
    </div >
  );
}
