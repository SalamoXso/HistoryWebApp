import React, { useRef, useEffect } from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import dayjs from 'dayjs';

export const BottomTimeline: React.FC = () => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const { currentDate, setCurrentDate } = useTimelineStore();
  
  // Years of the Algerian Revolution
  const years = Array.from({ length: 9 }, (_, i) => 1954 + i);
  
  // Generate markers for each year
  const markers = years.map(year => ({
    year,
    label: year.toString(),
    position: ((year - 1954) / 8) * 100
  }));

  return (
    <div className="w-full bg-cinema-black/90 backdrop-blur-md border-t border-cinema-amber/20 py-4 px-8">
      {/* Timeline Track */}
      <div className="relative w-full h-16">
        {/* Timeline Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-cinema-amber/30 -translate-y-1/2" />
        
        {/* Progress Line */}
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-cinema-amber -translate-y-1/2 transition-all duration-300"
          style={{ 
            width: `${((dayjs(currentDate).year() - 1954) / 8) * 100}%` 
          }}
        />
        
        {/* Year Markers */}
        {markers.map(({ year, label, position }) => (
          <div
            key={year}
            className="absolute top-1/2 -translate-y-1/2 cursor-pointer group"
            style={{ left: `${position}%` }}
            onClick={() => setCurrentDate(`${year}-01-01`)}
          >
            <div className={`
              w-3 h-3 rounded-full border-2 
              ${year === dayjs(currentDate).year() 
                ? 'bg-cinema-amber border-cinema-gold' 
                : 'bg-cinema-dark border-cinema-amber/50'}
              transition-all duration-300
              group-hover:scale-125 group-hover:border-cinema-gold
            `} />
            <div className="absolute top-6 left-1/2 -translate-x-1/2 text-xs text-cinema-cream/70 font-display">
              {label}
            </div>
          </div>
        ))}
      </div>
      
      {/* Current Date Display */}
      <div className="text-center mt-4 font-cinema text-cinema-amber text-sm">
        {dayjs(currentDate).format('MMMM D, YYYY')}
      </div>
    </div>
  );
};