import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import dayjs from 'dayjs';
import { FaPlay, FaPause, FaStepBackward, FaStepForward } from 'react-icons/fa';

export const RotatingTimeline: React.FC = () => {
  const { currentDate, setCurrentDate, isPlaying, togglePlayback, events } = useTimelineStore();
  const [isDragging, setIsDragging] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(-1);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartIndex = useRef(0);
  const animationRef = useRef<number>();
  const visibleDatesRef = useRef<any[]>([]);

  // Generate dates - only around events with a reasonable range
  const generateTimelineDates = useCallback(() => {
    let dates = [];
    
    if (events.length === 0) {
      // If no events, show a 10-year range around current date
      const center = dayjs(currentDate);
      const start = center.subtract(5, 'year');
      const end = center.add(5, 'year');
      let current = start;
      while (current.isBefore(end) || current.isSame(end)) {
        dates.push(current.clone());
        current = current.add(1, 'day');
      }
      return dates;
    }

    // Find min and max dates from events
    let minDate = dayjs(events[0].date);
    let maxDate = dayjs(events[0].date);
    
    events.forEach(event => {
      const eventDate = dayjs(event.date);
      if (eventDate.isBefore(minDate)) minDate = eventDate;
      if (eventDate.isAfter(maxDate)) maxDate = eventDate;
    });

    // Add padding (2 years before and after) to reduce lag
    const start = minDate.subtract(2, 'year');
    const end = maxDate.add(2, 'year');
    
    let current = start;
    while (current.isBefore(end) || current.isSame(end)) {
      dates.push(current.clone());
      current = current.add(1, 'day');
    }
    return dates;
  }, [events, currentDate]);

  const timelineDates = generateTimelineDates();
  const totalDates = timelineDates.length;

  // Get years from the timeline range (with step of 5 for performance)
  const getVisibleYears = useCallback(() => {
    if (timelineDates.length === 0) return [];
    
    const years = new Set<number>();
    // Only add every 5th year to reduce the number of items
    timelineDates.forEach((date, index) => {
      if (index % 365 === 0) { // Only add one per year
        years.add(date.year());
      }
    });
    
    // Ensure current year is always included
    years.add(dayjs(currentDate).year());
    
    return Array.from(years).sort((a, b) => a - b);
  }, [timelineDates, currentDate]);

  const visibleYears = getVisibleYears();

  // Find index of current date
  const getCurrentIndex = useCallback(() => {
    if (timelineDates.length === 0) return 0;
    
    let minDiff = Infinity;
    let minIndex = 0;
    timelineDates.forEach((date, index) => {
      const diff = Math.abs(date.diff(dayjs(currentDate), 'day'));
      if (diff < minDiff) {
        minDiff = diff;
        minIndex = index;
      }
    });
    return minIndex;
  }, [currentDate, timelineDates]);

  const currentIndex = getCurrentIndex();
  const currentYear = dayjs(currentDate).year();

  // Initialize audio context on user interaction
  const initAudio = useCallback(() => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
      return ctx;
    }
    return audioContext;
  }, [audioContext]);

  // Play click sound - only when audio context is initialized
  const playClickSound = useCallback(() => {
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.02);
      
      gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.03);
      
      const oscillator2 = ctx.createOscillator();
      const gainNode2 = ctx.createGain();
      oscillator2.connect(gainNode2);
      gainNode2.connect(ctx.destination);
      
      oscillator2.type = 'square';
      oscillator2.frequency.setValueAtTime(200, ctx.currentTime + 0.005);
      oscillator2.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.015);
      
      gainNode2.gain.setValueAtTime(0.04, ctx.currentTime + 0.005);
      gainNode2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
      
      oscillator2.start(ctx.currentTime + 0.005);
      oscillator2.stop(ctx.currentTime + 0.02);
    } catch (e) {
      // Silently fail
    }
  }, [initAudio]);

  // Play sound when date changes
  useEffect(() => {
    if (lastSelectedIndex !== currentIndex && lastSelectedIndex !== -1) {
      playClickSound();
    }
    setLastSelectedIndex(currentIndex);
  }, [currentIndex, playClickSound]);

  // Auto-play animation
  useEffect(() => {
    if (isPlaying && totalDates > 0) {
      let lastTime = performance.now();
      const speed = 3;

      const animate = (time: number) => {
        const delta = (time - lastTime) / 1000;
        lastTime = time;

        const newIndex = (currentIndex + delta * speed) % totalDates;
        const roundedIndex = Math.floor(newIndex);
        
        if (roundedIndex < totalDates && roundedIndex !== currentIndex) {
          const newDate = timelineDates[roundedIndex];
          if (newDate) {
            setCurrentDate(newDate.format('YYYY-MM-DD'));
          }
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, currentIndex, totalDates, timelineDates, setCurrentDate]);

  // Mouse wheel - scroll through days
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    // Initialize audio on first interaction
    initAudio();
    
    if (totalDates === 0) return;
    
    const direction = e.deltaY > 0 ? 1 : -1;
    const steps = Math.min(Math.abs(Math.round(e.deltaY / 30)), 3);
    const adjustedDirection = direction * (steps || 1);
    
    let newIndex = (currentIndex + adjustedDirection) % totalDates;
    if (newIndex < 0) newIndex = totalDates + newIndex;
    
    const newDate = timelineDates[newIndex];
    if (newDate) {
      setCurrentDate(newDate.format('YYYY-MM-DD'));
    }
  }, [currentIndex, totalDates, timelineDates, setCurrentDate, initAudio]);

  // Jump to specific year
  const jumpToYear = useCallback((year: number) => {
    // Find the first date in that year
    const yearDates = timelineDates.filter(d => d.year() === year);
    if (yearDates.length > 0) {
      // Go to the middle of the year for better visual
      const midIndex = Math.floor(yearDates.length / 2);
      setCurrentDate(yearDates[midIndex].format('YYYY-MM-DD'));
    }
  }, [timelineDates, setCurrentDate]);

  // Mouse wheel on year selector
  const handleYearWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    initAudio();
    const direction = e.deltaY > 0 ? 1 : -1;
    const currentYearIndex = visibleYears.indexOf(currentYear);
    if (currentYearIndex === -1) return;
    
    const newIndex = Math.min(Math.max(currentYearIndex + direction, 0), visibleYears.length - 1);
    jumpToYear(visibleYears[newIndex]);
  }, [visibleYears, currentYear, jumpToYear, initAudio]);

  // Mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    initAudio();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartIndex.current = currentIndex;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || totalDates === 0) return;
    
    const deltaX = e.clientX - dragStartX.current;
    const pixelsPerIndex = 25;
    const indexOffset = Math.round(deltaX / pixelsPerIndex);
    
    let newIndex = (dragStartIndex.current - indexOffset) % totalDates;
    if (newIndex < 0) newIndex = totalDates + newIndex;
    
    if (newIndex < totalDates && newIndex !== currentIndex) {
      const newDate = timelineDates[newIndex];
      if (newDate) {
        setCurrentDate(newDate.format('YYYY-MM-DD'));
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Generate visible dates - only render what's visible
  const getVisibleDates = () => {
    if (totalDates === 0) return [];
    
    const visible: { date: dayjs.Dayjs; index: number; position: number }[] = [];
    const range = 25; // Reduced range for performance
    const centerIndex = currentIndex;
    
    for (let i = -range; i <= range; i++) {
      let index = (centerIndex + i) % totalDates;
      if (index < 0) index = totalDates + index;
      const position = i * 80;
      visible.push({
        date: timelineDates[index],
        index: index,
        position: position
      });
    }
    return visible;
  };

  const visibleDates = getVisibleDates();

  if (totalDates === 0) {
    return (
      <div className="w-full bg-cinema-black/95 backdrop-blur-md border-t border-amber-400/20 py-8 px-8 text-center">
        <div className="text-amber-400/40 text-sm font-mono">
          No events loaded. Search and add a topic to start exploring history!
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative" style={{ position: 'relative', paddingRight: '70px' }}>
      {/* Main Timeline */}
      <div 
        ref={containerRef}
        className="w-full bg-cinema-black/95 backdrop-blur-md border-t border-amber-400/20 py-4 px-8 select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', position: 'relative' }}
      >
        <div className="relative w-full h-40 overflow-hidden">
          <div className="absolute inset-0 flex items-center">
            <div className="relative w-full h-28 bg-gradient-to-b from-cinema-dark/80 to-cinema-black/90 rounded-full border-2 border-amber-500/20 shadow-2xl shadow-black/50">
              
              <div className="absolute inset-0 rounded-full border border-amber-400/10" style={{ margin: '4px' }} />
              <div className="absolute inset-0 rounded-full border border-amber-400/5" style={{ margin: '10px' }} />
              
              <div 
                ref={contentRef}
                className="absolute inset-0 rounded-full overflow-hidden"
              >
                {visibleDates.map(({ date, index, position }) => {
                  const isCurrent = index === currentIndex;
                  const isYear = date.date() === 1 && date.month() === 0;
                  const isMonth = date.date() === 1;
                  
                  const distance = Math.abs(position);
                  const opacity = Math.max(0.2, 1 - (distance / 1200));
                  
                  return (
                    <div
                      key={`${index}-${position}`}
                      className="absolute top-0 h-full flex flex-col items-center"
                      style={{ 
                        left: `calc(50% + ${position}px)`,
                        width: '80px',
                        minWidth: '80px',
                        transform: 'translateX(-50%)',
                        opacity: opacity
                      }}
                    >
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 flex items-end">
                        <div 
                          className={`
                            w-0.5
                            ${isYear ? 'h-4 bg-amber-400/60' : ''}
                            ${isMonth && !isYear ? 'h-3 bg-amber-400/40' : ''}
                            ${!isMonth && !isYear ? 'h-2 bg-amber-400/20' : ''}
                            ${isCurrent ? 'bg-amber-300 shadow-lg shadow-amber-500/50 h-5' : ''}
                            transition-all duration-300
                          `}
                        />
                      </div>

                      {isYear && (
                        <div 
                          className={`
                            absolute top-5 left-1/2 -translate-x-1/2 
                            text-[10px] font-mono whitespace-nowrap
                            ${isCurrent ? 'text-amber-300 font-bold' : 'text-amber-400/50'}
                            transition-all duration-300
                          `}
                        >
                          {date.format('YYYY')}
                        </div>
                      )}

                      {isMonth && !isYear && Math.abs(position) < 400 && (
                        <div 
                          className={`
                            absolute top-5 left-1/2 -translate-x-1/2 
                            text-[7px] font-mono
                            ${isCurrent ? 'text-amber-300' : 'text-amber-400/30'}
                            transition-all duration-300
                          `}
                        >
                          {date.format('MMM')}
                        </div>
                      )}

                      {isCurrent && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[8px] text-amber-400/40 font-mono">
                          {date.format('D')}
                        </div>
                      )}

                      {isCurrent && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2">
                          <div className="w-0 h-0 
                            border-l-[6px] border-l-transparent 
                            border-r-[6px] border-r-transparent 
                            border-t-[8px] border-t-amber-400/80"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                <div className="w-0 h-0 
                  border-l-[8px] border-l-transparent 
                  border-r-[8px] border-r-transparent 
                  border-t-[12px] border-t-amber-400/80
                  drop-shadow-lg"
                />
              </div>

              <div className="absolute left-1/2 bottom-3 -translate-x-1/2 z-10 pointer-events-none">
                <div className="bg-cinema-black/80 backdrop-blur-sm px-4 py-1 rounded-full border border-amber-400/20">
                  <span className="text-amber-300 font-cinema text-sm tracking-wider">
                    {dayjs(currentDate).format('MMMM D, YYYY')}
                  </span>
                </div>
              </div>

              <div className="absolute inset-0 rounded-full pointer-events-none opacity-5 overflow-hidden">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-1/2 top-0 w-0.5 h-2 -ml-0.5"
                    style={{ 
                      transform: `rotate(${i * 9}deg)`,
                      transformOrigin: 'center bottom',
                      background: i % 2 === 0 ? 'rgba(212,163,115,0.3)' : 'transparent'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-cinema-black to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-cinema-black to-transparent pointer-events-none" />
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-cinema-black to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-cinema-black to-transparent pointer-events-none" />
        </div>

        <div className="flex items-center justify-center gap-4 mt-1">
          <button
            onClick={() => {
              initAudio();
              if (totalDates === 0) return;
              let newIndex = (currentIndex - 1) % totalDates;
              if (newIndex < 0) newIndex = totalDates + newIndex;
              const newDate = timelineDates[newIndex];
              if (newDate) setCurrentDate(newDate.format('YYYY-MM-DD'));
            }}
            className="text-amber-400/40 hover:text-amber-300 transition-colors p-2"
          >
            <FaStepBackward size={12} />
          </button>

          <button
            onClick={() => {
              initAudio();
              togglePlayback();
            }}
            className={`
              text-amber-400 hover:text-amber-300 transition-all p-2.5 rounded-full 
              border border-amber-400/30 hover:border-amber-400/60
              ${isPlaying ? 'bg-amber-400/10' : ''}
            `}
          >
            {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} />}
          </button>

          <button
            onClick={() => {
              initAudio();
              if (totalDates === 0) return;
              let newIndex = (currentIndex + 1) % totalDates;
              if (newIndex < 0) newIndex = totalDates + newIndex;
              const newDate = timelineDates[newIndex];
              if (newDate) setCurrentDate(newDate.format('YYYY-MM-DD'));
            }}
            className="text-amber-400/40 hover:text-amber-300 transition-colors p-2"
          >
            <FaStepForward size={12} />
          </button>

          <div className="text-amber-400/20 text-[10px] font-mono ml-4 flex items-center gap-2">
            <span>Scroll</span>
            <span className="w-4 h-px bg-amber-400/20" />
            <span>Drag</span>
          </div>
        </div>
      </div>

     // Year Selector - Fixed position on the right
<div 
  style={{
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '50px',
    height: '260px',
    zIndex: 100,
    pointerEvents: 'auto',
    backgroundColor: 'rgba(10,10,10,0.92)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(212,163,115,0.2)',
    borderRadius: '8px',
    padding: '4px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.9)',
    display: 'flex',
    flexDirection: 'column'
  }}
  onWheel={handleYearWheel}
>
  <div style={{
    color: 'rgba(212,163,115,0.3)',
    fontSize: '6px',
    fontFamily: 'monospace',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    textAlign: 'center',
    flexShrink: 0,
    paddingBottom: '2px',
    borderBottom: '1px solid rgba(212,163,115,0.05)',
    marginBottom: '2px'
  }}>
    Year
  </div>

  <button
    onClick={(e) => {
      e.stopPropagation();
      initAudio();
      const currentYearIndex = visibleYears.indexOf(currentYear);
      if (currentYearIndex > 0) {
        jumpToYear(visibleYears[currentYearIndex - 1]);
      }
    }}
    style={{
      color: 'rgba(212,163,115,0.5)',
      padding: '2px',
      cursor: 'pointer',
      background: 'transparent',
      border: 'none',
      fontSize: '10px',
      flexShrink: 0
    }}
  >
    ▲
  </button>

  <div style={{
    flex: 1,
    overflowY: 'auto',
    width: '100%',
    margin: '1px 0',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(212,163,115,0.2) transparent'
  }}
  className="year-scroll"
  >
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1px'
    }}>
      {visibleYears.map((year) => {
        const isCurrent = year === currentYear;
        return (
          <button
            key={year}
            onClick={(e) => {
              e.stopPropagation();
              initAudio();
              jumpToYear(year);
            }}
            style={{
              width: '100%',
              textAlign: 'center',
              padding: '2px 0',
              borderRadius: '3px',
              fontSize: '9px',
              fontFamily: 'monospace',
              background: isCurrent ? 'rgba(251,191,36,0.15)' : 'transparent',
              border: isCurrent ? '1px solid rgba(251,191,36,0.3)' : '1px solid transparent',
              cursor: 'pointer',
              color: isCurrent ? '#fbbf24' : '#a8885a',
              fontWeight: isCurrent ? 'bold' : 'normal',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!isCurrent) {
                e.currentTarget.style.color = '#d4a373';
                e.currentTarget.style.backgroundColor = 'rgba(212,163,115,0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isCurrent) {
                e.currentTarget.style.color = '#a8885a';
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {year}
          </button>
        );
      })}
    </div>
  </div>

  <button
    onClick={(e) => {
      e.stopPropagation();
      initAudio();
      const currentYearIndex = visibleYears.indexOf(currentYear);
      if (currentYearIndex < visibleYears.length - 1 && currentYearIndex !== -1) {
        jumpToYear(visibleYears[currentYearIndex + 1]);
      }
    }}
    style={{
      color: 'rgba(212,163,115,0.5)',
      padding: '2px',
      cursor: 'pointer',
      background: 'transparent',
      border: 'none',
      fontSize: '10px',
      flexShrink: 0
    }}
  >
    ▼
  </button>
</div>
    </div>
  );
};