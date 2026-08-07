import { create } from 'zustand';

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
  topicId?: string;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  events: HistoricalEvent[];
  color: string;
  active: boolean;
}

export interface TimelineState {
  currentDate: string;
  selectedEvent?: string;
  viewMode: 'timeline' | 'calendar' | 'search';
  playbackSpeed: number;
  isPlaying: boolean;
  events: HistoricalEvent[];
  topics: Topic[];
  activeTopicId?: string;
}

export interface MapState {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  isFlying: boolean;
  targetEvent?: string;
}

interface TimelineStore extends TimelineState {
  setCurrentDate: (date: string) => void;
  setSelectedEvent: (eventId: string | undefined) => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  addEvent: (event: HistoricalEvent) => void;
  clearEvents: () => void;
  addTopic: (topic: Topic) => void;
  removeTopic: (topicId: string) => void;
  toggleTopic: (topicId: string) => void;
  setActiveTopic: (topicId: string | undefined) => void;
  clearTopics: () => void;
}

export const useTimelineStore = create<TimelineStore>((set) => ({
  currentDate: '1954-11-01',
  selectedEvent: undefined,
  viewMode: 'timeline',
  playbackSpeed: 1,
  isPlaying: false,
  events: [],
  topics: [],
  activeTopicId: undefined,
  
  setCurrentDate: (date) => set({ currentDate: date }),
  setSelectedEvent: (eventId) => set({ selectedEvent: eventId }),
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  addEvent: (event) => set((state) => ({ 
    events: [...state.events, event] 
  })),
  clearEvents: () => set({ events: [] }),
  addTopic: (topic) => set((state) => ({ 
    topics: [...state.topics, topic] 
  })),
  removeTopic: (topicId) => set((state) => ({ 
    topics: state.topics.filter(t => t.id !== topicId) 
  })),
  toggleTopic: (topicId) => set((state) => ({
    topics: state.topics.map(t => 
      t.id === topicId ? { ...t, active: !t.active } : t
    )
  })),
  setActiveTopic: (topicId) => set({ activeTopicId: topicId }),
  clearTopics: () => set({ topics: [] }),
}));

interface MapStore extends MapState {
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setPitch: (pitch: number) => void;
  setBearing: (bearing: number) => void;
  flyToEvent: (eventId: string) => void;
  setIsFlying: (isFlying: boolean) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  center: [1.6596, 28.0339],
  zoom: 4,
  pitch: 45,
  bearing: 0,
  isFlying: false,
  targetEvent: undefined,
  
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setPitch: (pitch) => set({ pitch }),
  setBearing: (bearing) => set({ bearing }),
  setIsFlying: (isFlying) => set({ isFlying }),
  flyToEvent: (eventId) => set({ 
    targetEvent: eventId, 
    isFlying: true 
  }),
}));