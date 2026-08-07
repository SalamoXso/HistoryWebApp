import React, { useState, useEffect } from 'react';
import { useTimelineStore } from '../../store/timelineStore';

export const CinemaPopup: React.FC = () => {
  const { events, selectedEvent, topics, activeTopicId } = useTimelineStore();
  const [isVisible, setIsVisible] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const event = events.find(e => e.id === selectedEvent);
  const activeTopic = topics.find(t => t.id === activeTopicId);

  useEffect(() => {
    if (event) {
      setIsVisible(true);
      setIsTyping(true);
      setTypedText('');
      
      // Typewriter effect
      let index = 0;
      const text = event.description || 'No description available.';
      const interval = setInterval(() => {
        if (index < text.length) {
          setTypedText(prev => prev + text.charAt(index));
          index++;
        } else {
          setIsTyping(false);
          clearInterval(interval);
        }
      }, 25);

      return () => clearInterval(interval);
    } else {
      setIsVisible(false);
      setTypedText('');
    }
  }, [event]);

  if (!isVisible || !event) return null;

  // Get topic color
  const topicColor = activeTopic?.color || '#D4A373';

  return (
    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div 
        className="relative bg-black/95 border-4 rounded-lg p-6 max-w-2xl shadow-2xl"
        style={{ borderColor: `${topicColor}60` }}
      >
        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
          }}
        />
        
        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)'
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Retro title bar */}
          <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: `${topicColor}30` }}>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            <span className="text-amber-400/70 text-xs font-mono tracking-widest ml-2">
              {event.topicId ? activeTopic?.name || 'HISTORICAL RECORD' : 'HISTORICAL RECORD'} • {event.date}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-cinema mb-3 tracking-wide" style={{ color: topicColor }}>
            {event.title}
          </h3>

          {/* Category badge */}
          <div className="inline-block px-3 py-1 mb-3 border rounded-full" style={{ borderColor: `${topicColor}40` }}>
            <span className="text-xs uppercase tracking-wider font-mono" style={{ color: `${topicColor}80` }}>
              {event.category}
            </span>
          </div>

          {/* Description with typewriter effect */}
          <div className="relative">
            <p className="text-amber-200/90 text-sm leading-relaxed font-serif min-h-[60px]">
              {typedText}
              {isTyping && (
                <span className="inline-block w-0.5 h-4 ml-0.5 animate-pulse" style={{ backgroundColor: topicColor }} />
              )}
            </p>
          </div>

          {/* Location & participants */}
          <div className="mt-4 pt-3 border-t border-amber-700/20 text-xs text-amber-400/60 font-mono">
            <div>📍 {event.locationName || 'Algeria'}</div>
            {event.participants && event.participants.length > 0 && (
              <div className="mt-1">
                Participants: {event.participants.join(' • ')}
              </div>
            )}
          </div>
        </div>

        {/* Film grain overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }}
        />
      </div>
    </div>
  );
};