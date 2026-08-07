// This will hold all historical events
export interface HistoricalEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  lat: number;
  lng: number;
  importance: number;
  category: string;
  photos?: string[];
  videos?: string[];
  description: string;
  narration: string;
  sources: any[];
  participants: string[];
  locationName?: string;
}

// Import the JSON directly
import rawEvents from './events.json';

export const historicalEvents: HistoricalEvent[] = rawEvents.map((event: any) => ({
  ...event,
  sources: event.sources || [],
  participants: event.participants || []
}));

export default historicalEvents;