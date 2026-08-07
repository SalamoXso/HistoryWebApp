import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { RotatingTimeline } from '../timeline/RotatingTimeline';
import { ChronicleMap } from '../map/ChronicleMap';
import { AIAgentPanel } from '../ai/AIAgentPanel';
import { useTimelineStore } from '../../store/timelineStore';

// Import the data - if it fails, we'll use fallback
let historicalEventsData: any[] = [];
try {
  const data = require('../data/events.json');
  historicalEventsData = data.default || data;
  console.log('Loaded events from JSON:', historicalEventsData.length);
} catch (e) {
  console.warn('No events.json found, using empty data');
  historicalEventsData = [];
}

export const MainLayout: React.FC = () => {
  const { addEvent, clearEvents, events } = useTimelineStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load historical events
    clearEvents();
    
    if (historicalEventsData.length > 0) {
      console.log('Loading events:', historicalEventsData.length);
      historicalEventsData.forEach((event: any) => {
        addEvent({
          ...event,
          sources: event.sources || [],
          participants: event.participants || []
        });
      });
    }
    
    setLoading(false);
  }, []);

  console.log('Current events in store:', events.length);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-cinema-black flex items-center justify-center">
        <div className="text-amber-400/70 font-cinema text-xl animate-pulse">
          Loading Chronicle Engine...
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-cinema-black overflow-hidden">
      {/* Retro Overlays */}
      <div className="retro-overlay" />
      <div className="scanline" />
      <div className="vignette" />
      
      {/* Main Map */}
      <div className="absolute inset-0">
        <ChronicleMap />
      </div>
      
      {/* UI Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Sidebar */}
        <div className="absolute top-0 left-0 h-full pointer-events-auto z-20">
          <Sidebar />
        </div>
        
        {/* Bottom Timeline */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-auto z-20">
          <RotatingTimeline />
        </div>

        {/* AI Agent Panel */}
        <AIAgentPanel />
      </div>
    </div>
  );
};