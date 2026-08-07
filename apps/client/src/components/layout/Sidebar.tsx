import React, { useState } from 'react';
import { 
  FaCalendarAlt, 
  FaSearch, 
  FaPlay, 
  FaPause, 
  FaTimes,
  FaList,
  FaCircle,
  FaTrash
} from 'react-icons/fa';
import { useTimelineStore } from '../../store/timelineStore';
import { SearchBar } from '../ui/SearchBar';
import dayjs from 'dayjs';

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const { 
    isPlaying, 
    togglePlayback, 
    currentDate, 
    setCurrentDate,
    topics,
    removeTopic,
    toggleTopic,
    activeTopicId,
    setActiveTopic,
    events  // <-- ADD THIS - it was missing!
  } = useTimelineStore();

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = dayjs(currentDate).year();
    const month = dayjs(currentDate).month();
    const firstDay = dayjs(`${year}-${String(month + 1).padStart(2, '0')}-01`);
    const daysInMonth = firstDay.daysInMonth();
    const startDayOfWeek = firstDay.day();
    
    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const calendarDays = generateCalendarDays();
  const currentMonth = dayjs(currentDate).format('MMMM YYYY');

  const handleDateSelect = (day: number) => {
    const date = dayjs(currentDate).date(day);
    setCurrentDate(date.format('YYYY-MM-DD'));
    setShowCalendar(false);
  };

  const changeMonth = (delta: number) => {
    const newDate = dayjs(currentDate).add(delta, 'month');
    setCurrentDate(newDate.format('YYYY-MM-DD'));
  };

  // Get color for topic
  const getTopicColor = (color: string) => {
    return color || '#FF6B6B';
  };

  return (
    <div className={`
      h-full transition-all duration-500 ease-in-out
      ${isOpen ? 'w-72' : 'w-16'}
      bg-cinema-black/95 backdrop-blur-md
      border-r border-amber-400/20
      flex flex-col py-4
      shadow-2xl shadow-black/50
      overflow-hidden
    `}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-3 border-b border-amber-400/10">
        {isOpen && (
          <span className="text-amber-300 font-cinema text-sm tracking-wider">
            CHRONICLE
          </span>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-amber-400/60 hover:text-amber-300 transition-colors text-xl font-mono ml-auto"
        >
          {isOpen ? '◀' : '▶'}
        </button>
      </div>

      {/* Search Bar */}
      {isOpen && (
        <div className="px-3 py-3 border-b border-amber-400/10">
          <SearchBar />
        </div>
      )}

      {/* Topics List */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-400/40 text-[10px] font-mono tracking-wider">
              TOPICS ({topics.length})
            </span>
          </div>

          {topics.length === 0 ? (
            <div className="text-amber-400/20 text-xs font-mono text-center py-8">
              No topics added yet.<br/>
              Search above to add one!
            </div>
          ) : (
            topics.map((topic) => (
              <div
                key={topic.id}
                className={`
                  flex items-center gap-2 px-2 py-1.5 rounded-lg mb-1
                  transition-all duration-200 cursor-pointer
                  ${topic.active ? 'bg-amber-400/10 border border-amber-400/20' : 'opacity-60'}
                  ${activeTopicId === topic.id ? 'ring-1 ring-amber-400/40' : ''}
                  hover:bg-amber-400/5
                `}
                onClick={() => {
                  console.log('Topic clicked:', topic.name);
                  setActiveTopic(topic.id);
                  toggleTopic(topic.id);
                  
                  // Find earliest event in this topic and jump to it
                  const topicEvents = events.filter(e => e.topicId === topic.id);
                  if (topicEvents.length > 0) {
                    const dates = topicEvents.map(e => dayjs(e.date));
                    const validDates = dates.filter(d => d.isValid());
                    if (validDates.length > 0) {
                      const minDate = dayjs.min(validDates);
                      if (minDate) {
                        setCurrentDate(minDate.format('YYYY-MM-DD'));
                      }
                    }
                  }
                }}
              >
                <FaCircle 
                  size={8} 
                  style={{ color: topic.color || '#FF6B6B' }}
                  className="flex-shrink-0"
                />
                <span className="text-amber-200/80 text-xs font-mono truncate flex-1">
                  {topic.name}
                </span>
                <span className="text-amber-400/20 text-[10px]">
                  {topic.events?.length || 0}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTopic(topic.id);
                  }}
                  className="text-amber-400/20 hover:text-red-400/60 transition-colors"
                >
                  <FaTrash size={10} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Bottom Controls */}
      <div className="mt-auto border-t border-amber-400/10 pt-3 px-4">
        <div className="flex items-center justify-around">
          {/* Calendar Button */}
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="text-amber-400/60 hover:text-amber-300 transition-colors relative"
          >
            <FaCalendarAlt size={16} />
            {showCalendar && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-cinema-black/95 backdrop-blur-xl border border-amber-400/30 rounded-lg p-4 w-64 shadow-2xl z-50">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="text-amber-400/60 hover:text-amber-300 transition-colors"
                  >
                    ◀
                  </button>
                  <div className="text-amber-300 font-cinema text-sm tracking-wider">
                    {currentMonth}
                  </div>
                  <button
                    onClick={() => changeMonth(1)}
                    className="text-amber-400/60 hover:text-amber-300 transition-colors"
                  >
                    ▶
                  </button>
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-0.5">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="text-center text-amber-400/30 text-[10px] font-mono py-0.5">
                      {day}
                    </div>
                  ))}
                  
                  {calendarDays.map((day, index) => (
                    <div key={index}>
                      {day !== null ? (
                        <button
                          onClick={() => handleDateSelect(day)}
                          className={`
                            w-full aspect-square flex items-center justify-center
                            text-xs font-mono rounded-full
                            transition-all duration-200
                            ${dayjs(currentDate).date() === day 
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                              : 'text-amber-400/60 hover:text-amber-300 hover:bg-amber-400/10'
                            }
                          `}
                        >
                          {day}
                        </button>
                      ) : (
                        <div className="w-full aspect-square" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Quick jumps */}
                <div className="mt-3 pt-3 border-t border-amber-400/10 flex gap-1 flex-wrap justify-center">
                  {['1954-11-01', '1956-09-30', '1962-03-18', '1962-07-05'].map((date) => (
                    <button
                      key={date}
                      onClick={() => {
                        setCurrentDate(date);
                        setShowCalendar(false);
                      }}
                      className="text-[9px] px-2 py-0.5 rounded border border-amber-400/20 text-amber-400/40 hover:text-amber-300 hover:border-amber-400/40 transition-colors"
                    >
                      {dayjs(date).format('MMM D')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlayback}
            className={`text-amber-400 hover:text-amber-300 transition-all p-2.5 rounded-full 
              border border-amber-400/30 hover:border-amber-400/60
              ${isPlaying ? 'bg-amber-400/10' : ''}
            `}
          >
            {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} />}
          </button>

          {/* Current Date */}
          {isOpen && (
            <span className="text-amber-400/30 text-[10px] font-mono">
              {dayjs(currentDate).format('MMM D, YYYY')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};