import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useTimelineStore } from '../../store/timelineStore';
import dayjs from 'dayjs';

interface MapMarkersProps {
  map: maplibregl.Map | null;
}

export const MapMarkers: React.FC<MapMarkersProps> = ({ map }) => {
  const { events, currentDate, setSelectedEvent, topics, activeTopicId } = useTimelineStore();
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  // Get active topic color
  const getActiveColor = () => {
    const activeTopic = topics.find(t => t.id === activeTopicId);
    return activeTopic?.color || '#FF6B6B';
  };

  // Filter events - show events within 30 days of current date
  const getEventsForDate = () => {
    const current = dayjs(currentDate);
    
    // Filter by active topic if selected
    let filteredEvents = events;
    if (activeTopicId) {
      filteredEvents = events.filter(event => event.topicId === activeTopicId);
    }
    
    return filteredEvents.filter(event => {
      const eventDate = dayjs(event.date);
      const diffDays = Math.abs(eventDate.diff(current, 'day'));
      return diffDays <= 30;
    });
  };

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Get events for current date
    const visibleEvents = getEventsForDate();
    const activeColor = getActiveColor();

    visibleEvents.forEach(event => {
      // Create custom marker element with retro styling
      const el = document.createElement('div');
      
      // Check if event belongs to active topic
      const isActiveTopic = event.topicId === activeTopicId;
      
      // Pulse animation dot with vintage style
      el.className = `
        relative w-5 h-5 cursor-pointer
        before:absolute before:inset-0 before:rounded-full before:animate-ping
        after:absolute after:inset-1 after:rounded-full after:border-2
        hover:scale-125 transition-transform duration-300
        ${event.importance >= 9 ? 'w-7 h-7' : ''}
        ${hoveredEvent === event.id ? 'scale-150 z-10' : ''}
      `;
      
      // Set colors based on topic
      const mainColor = isActiveTopic ? activeColor : '#FCD34D';
      el.style.boxShadow = `0 0 20px ${mainColor}40, inset 0 0 10px ${mainColor}20`;
      
      // Style the inner dot
      const style = document.createElement('style');
      style.textContent = `
        .marker-${event.id}::after {
          background: ${mainColor}CC;
          border-color: ${mainColor}80;
        }
        .marker-${event.id}::before {
          background: ${mainColor}40;
        }
      `;
      el.appendChild(style);
      el.className += ` marker-${event.id}`;
      
      el.title = event.title;

      // Hover events
      el.addEventListener('mouseenter', () => {
        setHoveredEvent(event.id);
        setSelectedEvent(event.id);
      });
      
      el.addEventListener('mouseleave', () => {
        setHoveredEvent(null);
        setSelectedEvent(undefined);
      });

      // Click to zoom to event
      el.addEventListener('click', () => {
        map.flyTo({
          center: [event.lng, event.lat],
          zoom: 12,
          pitch: 60,
          duration: 2000,
          essential: true
        });
      });

      // Create marker
      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'bottom'
      })
        .setLngLat([event.lng, event.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Cleanup
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [map, events, currentDate, hoveredEvent, setSelectedEvent, topics, activeTopicId]);

  return null;
};