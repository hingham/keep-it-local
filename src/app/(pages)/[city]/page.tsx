'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SiteHeader from "@/components/Header/siteHeader";
import Loading from "@/components/Loading/loading";
import SeattleSVG from "@/components/City-SVG/seattle";

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
  }, [city]);

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
    <div className="p-4 md:p-8 pb-20">
      <h2 className="text-4xl md:text-5xl font-semibold text-secondary px-8 pt-4 text-center w-full">
        {city.charAt(0).toUpperCase() + city.slice(1)}
      </h2>

      {/* Site Body */}

      {/* Neighborhoods Section */}
      
      <div className="w-full">
        {loading ? (
          <Loading message="Loading neighborhoods..." />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Neighborhoods Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 place-items-stretch gap-6">
                <div className="sm:col-span-3">
                  <SeattleSVG />
                </div>

                {Object.entries(groupedNeighborhoods).map(([macroNeighborhood]) => (
                  <div key={macroNeighborhood} className="bg-surface rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
                    <Link
                      href={`${encodeURIComponent(city)}/${encodeURIComponent(macroNeighborhood)}`}
                      className="block hover:bg-primary/5 -m-2 p-2 rounded transition-colors group"
                    >
                      <h3 className="text-lg font-semibold text-text-primary mb-4 group-hover:text-primary transition-colors">
                        {macroNeighborhood}
                        <svg className="inline-block w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </h3>
                    </Link>
                  </div>
                ))}

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
