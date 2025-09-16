// Event category enum to match database enum
export enum EventCategory {
  FAMILY = 'family',
  MUSIC = 'music',
  FESTIVAL = 'festival',
  SALE = 'sale',
  OUTDOOR = 'outdoor',
  ACTIVE = 'active'
}

export enum ServiceCategory {
  LABOR = 'labor',
  HOME = 'home',
  HEALTH = 'health',
  SPECIALIZED = 'specialized skills',
  FITNESS = 'fitness',
  KIDS = 'kids'
}

// Type definitions for events
export interface Event {
  id: number;
  date: string;
  recurring: boolean;
  date_list?: string[];
  title: string;
  time: string;
  location: string;
  description?: string;
  website?: string;
  categories: EventCategory[];
  neighborhood_id: number;
  imageurl: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields from neighborhoods table
  neighborhood: string;
  city: string;
  state: string;
  macro_neighborhood: string;
}

/**
 * Create events need additional fields for internal purposes. These fields are not public due to the VIEW set on the table.
 */
export type CreateEvent = Omit<Event, 'id' | 'created_at' | 'updated_at' | 'neighborhood' | 'city' | 'state' | 'macro_neighborhood'> & {
  delete_after: string,
  internal_creator_contact: string;
  verified: boolean;
};

export interface AdminEvent extends Event {
  delete_after: string,
  internal_creator_contact: string;
  verified: boolean;
}

export interface AdminService extends Service {
  delete_after: string,
  internal_creator_contact: string;
  verified: boolean;
}

// Type definitions for services
export interface Service {
  categories: ServiceCategory[],
  id: number;
  title: string;
  owner: string;
  description?: string;
  website?: string;
  contact_number?: string;
  contact_email?: string;
  neighborhood_id: number;
  imageurl?: string;
  verified?: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields from neighborhoods table
  neighborhood: string;
  city: string;
  state: string;
  macro_neighborhood: string;
}


/**
 * Create services need additional fields for internal purposes. These fields are not public due to the VIEW set on the table.
 */
export type CreateService = Omit<Service, 'id' | 'created_at' | 'updated_at' | 'neighborhood' | 'city' | 'state' | 'macro_neighborhood'> & {
  delete_after: string;
  internal_creator_contact: string;
  verified: boolean,
};

// Type definitions for neighborhoods
export interface Neighborhood {
  id: number;
  neighborhood: string;
  city: string;
  city_id: number;
  state: string;
  macro_neighborhood?: string;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: number,
  city: string,
  state: string
}
