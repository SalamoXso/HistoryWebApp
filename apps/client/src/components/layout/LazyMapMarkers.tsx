import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useTimelineStore } from '../../store/timelineStore';
import dayjs from 'dayjs';

interface LazyMapMarkersProps {
  map: maplibregl.Map | null;
}

export const LazyMapMarkers: React.FC<LazyMapMarkersProps> = ({ map }) => {
  const { events, currentDate, setSelectedEvent, topics, activeTopicId } = useTimelineStore();
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get active topic color
  const getActiveColor = () => {
    const activeTopic = topics.find(t => t.id === activeTopicId);
    return activeTopic?.color || '#FF6B6B';
  };

  // Get events for current date - show ALL events for the topic
  const getEventsForDate = () => {
    const current = dayjs(currentDate);
    
    let filteredEvents = events;
    if (activeTopicId) {
      filteredEvents = events.filter(event => event.topicId === activeTopicId);
    }
    
    // If no active topic, show all events
    if (filteredEvents.length === 0) {
      return [];
    }
    
    // Show events within 1 year of current date
    return filteredEvents.filter(event => {
      const eventDate = dayjs(event.date);
      const diffDays = Math.abs(eventDate.diff(current, 'day'));
      return diffDays <= 365;
    }).slice(0, 50); // Max 50 markers
  };

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const visibleEvents = getEventsForDate();
    const activeColor = getActiveColor();

    console.log('Rendering markers for events:', visibleEvents.length);

    if (visibleEvents.length === 0) {
      console.log('No events to display');
      return;
    }

    visibleEvents.forEach((event) => {
      // Skip events without coordinates
      if (!event.lat || !event.lng) {
        console.warn('Event missing coordinates:', event.title);
        return;
      }

      // Create marker element
      const el = document.createElement('div');
      
      const isActiveTopic = event.topicId === activeTopicId;
      const mainColor = isActiveTopic ? activeColor : '#FCD34D';
      
      // Size based on importance
      const size = event.importance > 7 ? '12px' : '8px';
      
      el.style.cssText = `
        width: ${size};
        height: ${size};
        border-radius: 50%;
        background: ${mainColor};
        box-shadow: 0 0 15px ${mainColor}60, 0 0 30px ${mainColor}30;
        border: 2px solid ${mainColor}80;
        transition: all 0.3s ease;
        cursor: pointer;
        pointer-events: all;
        position: relative;
      `;
      
      el.title = event.title || 'Historical event';

      // Hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(2)';
        el.style.boxShadow = `0 0 30px ${mainColor}80, 0 0 60px ${mainColor}40`;
        setHoveredEvent(event.id);
        setSelectedEvent(event.id);
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = `0 0 15px ${mainColor}60, 0 0 30px ${mainColor}30`;
        setHoveredEvent(null);
        setSelectedEvent(undefined);
      });

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (map) {
          map.flyTo({
            center: [event.lng, event.lat],
            zoom: 10,
            pitch: 45,
            duration: 1500,
            essential: true
          });
        }
      });

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'center'
      })
        .setLngLat([event.lng, event.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [map, events, currentDate, hoveredEvent, setSelectedEvent, topics, activeTopicId]);

  return null;
};