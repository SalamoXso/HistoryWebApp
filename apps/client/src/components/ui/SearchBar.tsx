import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaSpinner, FaTimes } from 'react-icons/fa';
import { useTimelineStore } from '../../store/timelineStore';
import { wikiService } from '../../services/wikipediaService';
import dayjs from 'dayjs';

// Color palette for topics
const topicColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#FF8A5C', '#A29BFE', '#FD79A8', '#00B894',
  '#E17055', '#6C5CE7', '#00CEC9', '#FDCB6E', '#E84393'
];

export const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { 
    topics, 
    addTopic, 
    addEvent, 
    setActiveTopic, 
    setCurrentDate,
    events 
  } = useTimelineStore();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Close search results on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowResults(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    console.log('Searching for:', query);
    setIsSearching(true);
    setShowResults(true);

    try {
      const results = await wikiService.searchTopic(query.trim());
      console.log('Search results:', results.length);
      setSearchResults(results.slice(0, 20));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

 const handleAddTopic = (topicName: string, eventsData: any[]) => {
  console.log('Adding topic:', topicName, 'with', eventsData.length, 'events');
  
  if (topics.some(t => t.name.toLowerCase() === topicName.toLowerCase())) {
    alert('This topic is already added!');
    return;
  }

  if (eventsData.length === 0) {
    alert('No events found for this topic. Try a different search term.');
    return;
  }

  // Generate a color for the topic
  const colorIndex = topics.length % topicColors.length;
  const color = topicColors[colorIndex];

  const topicId = `topic-${Date.now()}`;
  const topicEvents = eventsData.map((e, idx) => {
    // Ensure coordinates are set
    let lat = e.lat || 36.7538;
    let lng = e.lng || 3.0588;
    
    // If locationName is provided, try to get better coordinates
    if (e.locationName) {
      const coords = getCoordinatesForLocation(e.locationName);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    }
    
    return {
      ...e,
      id: `${topicId}-${idx}-${Date.now()}`,
      topicId: topicId,
      date: e.date || new Date().toISOString().split('T')[0],
      lat: lat,
      lng: lng,
      // Ensure description is clean
      description: e.description ? e.description.replace(/<[^>]*>/g, '').substring(0, 300) : 'No description available'
    };
  });

  const newTopic = {
    id: topicId,
    name: topicName,
    description: `Historical events related to ${topicName}`,
    events: topicEvents,
    color: color,
    active: true
  };

  // Add topic to store
  addTopic(newTopic);

  // Add ALL events to the timeline
  topicEvents.forEach(event => {
    addEvent(event);
  });

  // Set active topic
  setActiveTopic(topicId);

  // Find the earliest date and set it
  const dates = topicEvents.map(e => dayjs(e.date));
  const validDates = dates.filter(d => d.isValid());
  if (validDates.length > 0) {
    const minDate = dayjs.min(validDates);
    if (minDate) {
      setCurrentDate(minDate.format('YYYY-MM-DD'));
    }
  }

  // Clear search
  setQuery('');
  setSearchResults([]);
  setShowResults(false);

  const count = topicEvents.length;
  console.log(`✅ Added "${topicName}" with ${count} historical events!`);
  alert(`✅ Added "${topicName}" with ${count} historical events!`);
};

// Helper function to get coordinates for location
const getCoordinatesForLocation = (locationName: string): { lat: number; lng: number } | null => {
  const locationMap: Record<string, { lat: number; lng: number }> = {
    'Algiers': { lat: 36.7538, lng: 3.0588 },
    'Alger': { lat: 36.7538, lng: 3.0588 },
    'Oran': { lat: 35.6971, lng: -0.6308 },
    'Constantine': { lat: 36.3650, lng: 6.6147 },
    'Annaba': { lat: 36.9027, lng: 7.7572 },
    'Blida': { lat: 36.4700, lng: 2.8300 },
    'Tlemcen': { lat: 34.8800, lng: -1.3200 },
    'Skikda': { lat: 36.8833, lng: 6.9000 },
    'Setif': { lat: 36.1900, lng: 5.4100 },
    'Batna': { lat: 35.5600, lng: 6.1700 },
    'Bejaia': { lat: 36.7500, lng: 5.0800 },
    'Paris': { lat: 48.8566, lng: 2.3522 },
    'Evian': { lat: 46.3203, lng: 6.4779 },
  };

  for (const [key, coords] of Object.entries(locationMap)) {
    if (locationName.toLowerCase().includes(key.toLowerCase())) {
      return coords;
    }
  }
  return null;
};

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      'battle': '⚔️ Battle',
      'political': '🏛️ Political',
      'treaty': '📜 Treaty',
      'massacre': '💀 Massacre',
      'military': '🎖️ Military',
      'historical': '📚 Historical',
      'diplomatic': '🤝 Diplomatic',
      'cultural': '🎭 Cultural',
      'economic': '💰 Economic',
      'protest': '✊ Protest'
    };
    return labels[category] || '📖 History';
  };

  const getGroupedResults = () => {
    const grouped = searchResults.reduce((acc, event) => {
      const date = event.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(event);
      return acc;
    }, {} as Record<string, any[]>);
    return grouped;
  };

  const groupedResults = getGroupedResults();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    if (value.length > 2) {
      debounceTimeout.current = setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleSearch(fakeEvent);
      }, 500);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleEventClick = (event: any) => {
    alert(`📜 ${event.title}\n\n${event.description || 'No description available'}\n\n📅 ${event.date}\n📍 ${event.locationName || 'Algeria'}`);
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <form onSubmit={handleSearch} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search historical topics... (Ctrl+K)"
          className={`
            w-full px-4 py-2 pr-10 
            bg-cinema-black/80 backdrop-blur-sm 
            border border-amber-400/20 rounded-lg
            text-amber-200 placeholder-amber-400/30
            focus:outline-none focus:border-amber-400/50
            transition-all duration-300
            text-sm font-mono
          `}
        />
        {isSearching ? (
          <FaSpinner className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400/40 animate-spin" />
        ) : query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSearchResults([]);
              setShowResults(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400/20 hover:text-amber-400/40 transition-colors"
          >
            <FaTimes size={12} />
          </button>
        )}
      </form>

      {showResults && (searchResults.length > 0 || isSearching) && (
        <div className="absolute left-0 right-0 mt-2 bg-cinema-black/95 backdrop-blur-xl border border-amber-400/20 rounded-lg shadow-2xl max-h-96 overflow-y-auto z-50">
          {isSearching ? (
            <div className="p-4 text-center text-amber-400/40">
              <FaSpinner className="inline animate-spin mr-2" />
              Searching...
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center text-amber-400/40">
              No events found for "{query}". Try a different search term.
            </div>
          ) : (
            <div className="p-2">
              <div className="text-amber-400/30 text-xs font-mono px-2 py-1 flex items-center justify-between sticky top-0 bg-cinema-black/90 backdrop-blur-sm z-10">
                <span>{searchResults.length} events found</span>
                <span className="text-amber-400/20 text-[9px]">Click event for details</span>
              </div>
              
              <div className="space-y-2">
                {Object.entries(groupedResults).map(([date, events]) => (
                  <div key={date} className="mb-2">
                    <div className="text-amber-400/40 text-[10px] font-mono px-2 py-1 border-b border-amber-400/10">
                      {dayjs(date).format('MMMM D, YYYY')}
                    </div>
                    {events.slice(0, 5).map((event, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 hover:bg-amber-400/5 rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-amber-200 text-sm font-medium truncate">
                              {event.title}
                            </div>
                            <div className="text-amber-400/50 text-xs truncate">
                              {event.description}
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0">
                            <span className="text-[10px] px-2 py-1 rounded-full bg-amber-400/10 text-amber-400/60 border border-amber-400/10">
                              {getCategoryLabel(event.category)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {events.length > 5 && (
                      <div className="text-amber-400/20 text-xs px-3 py-1">
                        + {events.length - 5} more events
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Topic Button - ALWAYS visible at bottom */}
              <div className="sticky bottom-0 bg-cinema-black/95 backdrop-blur-sm pt-2 pb-1 border-t border-amber-400/10 mt-2">
                <button
                  onClick={() => handleAddTopic(query, searchResults)}
                  className="w-full px-4 py-2.5 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 rounded-lg text-amber-300 font-cinema text-sm transition-colors"
                >
                  + Add "{query}" as Category ({searchResults.length} events)
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};