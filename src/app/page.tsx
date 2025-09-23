'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import SiteHeader from "@/components/Header/siteHeader";

interface City {
  id: number;
  city: string;
  state: string;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch('/api/cities');
        if (response.ok) {
          const data = await response.json();
          setCities(data);
        }
      } catch (error) {
        console.error('Failed to fetch cities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, []);

  // Group cities by state
  const groupedCities = cities.reduce((acc, city) => {
    const state = city.state;
    if (!acc[state]) {
      acc[state] = [];
    }
    acc[state].push(city);
    return acc;
  }, {} as Record<string, City[]>);
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <main className="flex-1 flex flex-col gap-[32px] items-center sm:items-start p-8 pb-20 gap-16 sm:p-20">
        <SiteHeader />

        {/* Site Body */}
        <div className="w-full max-w-4xl mx-auto">

          {/* Cities Section */}
          <div className="w-full">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-text-secondary">Loading cities...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 place-items-stretch gap-6">
                {Object.entries(groupedCities).map(([state, cities]) => (
                  <div key={state} className="bg-surface rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">
                      {state}
                    </h3>
                    <ul className="space-y-2">
                      {cities.map((city) => (
                        <li key={city.id} className="text-text-secondary">
                          <Link
                            href={`/${encodeURIComponent(city.city.toLowerCase())}`}
                            className="block hover:bg-primary/10 p-2 rounded transition-colors"
                          >
                            <div className="font-medium text-primary hover:text-primary-dark hover:underline">
                              {city.city}
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

      <Footer />
    </div>
  );
}
