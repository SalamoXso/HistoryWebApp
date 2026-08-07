// Make sure all types are exported
export interface HistoricalEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  lat: number;
  lng: number;
  importance: number;
  category: EventCategory;
  photos?: string[];
  videos?: string[];
  description: string;
  narration: string;
  sources: Source[];
  participants: string[];
  locationName?: string;
}

export interface Source {
  title: string;
  url: string;
  retrieved: string;
  type: 'wikipedia' | 'archive' | 'book' | 'government' | 'other';
  verified?: boolean;
}

export type EventCategory = 
  | 'battle' 
  | 'political' 
  | 'military' 
  | 'civilian' 
  | 'diplomatic' 
  | 'cultural' 
  | 'economic'
  | 'protest'
  | 'massacre'
  | 'treaty';

export interface Person {
  id: string;
  name: string;
  birth?: string;
  death?: string;
  summary: string;
  role: string[];
  events: string[];
  photos?: string[];
}

export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'city' | 'village' | 'mountain' | 'coast' | 'border' | 'other';
  events: string[];
}

export interface TimelineState {
  currentDate: string;
  selectedEvent?: string;
  viewMode: 'timeline' | 'calendar' | 'search';
  playbackSpeed: number;
  isPlaying: boolean;
  events: HistoricalEvent[];
}

export interface MapState {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  isFlying: boolean;
  targetEvent?: string;
}

export interface NarratorState {
  isSpeaking: boolean;
  currentText: string;
  voice?: string;
  rate: number;
  pitch: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}