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
    <div className="p-8 pb-20 w-full">

        <SiteHeader>
          <h2 className="text-2xl sm:text-4xl font-semibold text-text-primary mb-4">
            {city.charAt(0).toUpperCase() + city.slice(1)}
          </h2>
        </SiteHeader>

        {/* Site Body */}

        {/* Neighborhoods Section */}
        <div className="w-full">
          {loading ? (
            <Loading message="Loading neighborhoods..." / >
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Neighborhoods Grid */}
              <div className="flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 place-items-stretch gap-6">
                  <div className="sm:col-span-3 p-2 shadow-md border-b-gray-50">
                    {/* React image zoom seems more like what I would want here... */}
                    {/* <Image
                      src="/seattle_neighborhood_map.png"
                      alt="Seattle Neighborhood Map"
                      width={500}
                      height={400}
                      className="w-full h-auto rounded-lg"
                    /> */}
                    <SeattleSVG />
                    {/* <iframe src="https://www.google.com/maps/d/embed?mid=1tMniSyvjOYyQk2mvNP4HuJgvpQ3eFzw&ehbc=2E312F" width="500" height="750"></iframe> */}
                  </div>

                  {Object.entries(groupedNeighborhoods).map(([macroNeighborhood, neighborhoods]) => (
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
                      {/* Looks very busy with this so commenting out for now */}
                      {/* <ul className="space-y-2">
                        {neighborhoods.map((neighborhood) => (
                          <li key={neighborhood.id} className="text-text-secondary">
                            <Link
                              href={`/neighborhoods/${encodeURIComponent(neighborhood.id)}`}
                              className="block hover:bg-primary/10 md:p-2 rounded transition-colors"
                            >
                              <div className="font-medium text-primary hover:text-primary-dark hover:underline">
                                {neighborhood.neighborhood}
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul> */}
                    </div>
                  ))}
                </div>
              </div>

              {/* Seattle Map - Goal is to have a clickable svg file here */}

            </div>
          )}
        </div>
    </div>
  );
}
