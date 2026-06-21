import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Cake, 
  Sun, 
  Cloud, 
  CloudRain, 
  Snowflake, 
  StickyNote, 
  Trash2,
  Plus,
  Pencil
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  type: 'birthday' | 'weather' | 'sticky' | 'holiday' | 'conference';
  icon?: string;
  text?: string;
  studentName?: string;
  color?: string;
}

interface CalendarOverlayProps {
  calendarData: { events: Record<string, CalendarEvent[]> };
  onUpdateCalendarData: (data: { events: Record<string, CalendarEvent[]> }) => void;
  onClose: () => void;
}

const WEATHER_ICONS = [
  { icon: '☀️', label: 'Sunny', color: 'text-yellow-500' },
  { icon: '☁️', label: 'Cloudy', color: 'text-slate-400' },
  { icon: '🌧️', label: 'Rainy', color: 'text-blue-400' },
  { icon: '❄️', label: 'Snowy', color: 'text-cyan-300' },
  { icon: '⛈️', label: 'Stormy', color: 'text-indigo-600' },
  { icon: '🌬️', label: 'Windy', color: 'text-teal-400' },
];

const HOLIDAYS = [
  { icon: '🎆', label: "New Year's Day" },
  { icon: '🕊️', label: 'MLK Day' },
  { icon: '❤️', label: "Valentine's Day" },
  { icon: '🍀', label: "St. Patrick's Day" },
  { icon: '🐣', label: 'Easter' },
  { icon: '🎖️', label: 'Memorial Day' },
  { icon: '🇺🇸', label: 'Independence Day' },
  { icon: '🛠️', label: 'Labor Day' },
  { icon: '🎃', label: 'Halloween' },
  { icon: '🎖️', label: "Veterans Day" },
  { icon: '🦃', label: 'Thanksgiving' },
  { icon: '🎄', label: 'Christmas' },
];

const STICKY_COLORS = [
  'bg-yellow-100 border-yellow-200',
  'bg-blue-100 border-blue-200',
  'bg-pink-100 border-pink-200',
  'bg-green-100 border-green-200',
  'bg-purple-100 border-purple-200',
];

const WEATHER_SOUNDS: Record<string, string> = {
  Sunny: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  Rainy: 'https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3',
  Stormy: 'https://assets.mixkit.co/active_storage/sfx/2438/2438-preview.mp3',
  Windy: 'https://assets.mixkit.co/active_storage/sfx/1173/1173-preview.mp3',
  Snowy: 'https://assets.mixkit.co/active_storage/sfx/2533/2533-preview.mp3',
};

const CalendarOverlay: React.FC<CalendarOverlayProps> = ({ 
  calendarData, 
  onUpdateCalendarData, 
  onClose 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: string, events: CalendarEvent[] } | null>(null);
  const [isAddingBirthday, setIsAddingBirthday] = useState<{ date: string } | null>(null);
  const [isAddingSticky, setIsAddingSticky] = useState<{ date: string } | null>(null);
  const [isAddingHoliday, setIsAddingHoliday] = useState<{ date: string } | null>(null);
  const [isAddingConference, setIsAddingConference] = useState<{ date: string } | null>(null);
  const [isEditingSticky, setIsEditingSticky] = useState<{ date: string, event: CalendarEvent } | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [dragging, setDragging] = useState<null | { type: string; icon: string | React.ReactNode; label: string; color?: string; offsetX: number; offsetY: number; x: number; y: number }>(null);
  const [expandedSticky, setExpandedSticky] = useState<CalendarEvent | null>(null);
  const [activeWeatherEffect, setActiveWeatherEffect] = useState<string | null>(null);
  const [celebrationName, setCelebrationName] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [stickyText, setStickyText] = useState('');
  const [stickyColor, setStickyColor] = useState(STICKY_COLORS[0]);
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const calendarGhostRef = useRef<HTMLDivElement>(null);
  const weatherAudioRef = useRef<HTMLAudioElement | null>(null);

  const events = calendarData?.events || {};

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const handleAddEvent = (dateStr: string, event: Omit<CalendarEvent, 'id'>) => {
    const newEvent = { ...event, id: Math.random().toString(36).substr(2, 9) };
    const dayEvents = events[dateStr] || [];
    const updatedEvents = {
      ...events,
      [dateStr]: [...dayEvents, newEvent]
    };
    onUpdateCalendarData({ events: updatedEvents });
  };

  const handleRemoveEvent = (dateStr: string, eventId: string) => {
    const dayEvents = events[dateStr] || [];
    const updatedEvents = {
      ...events,
      [dateStr]: dayEvents.filter(e => e.id !== eventId)
    };
    onUpdateCalendarData({ events: updatedEvents });
  };

  const handleUpdateStickyText = (dateStr: string, eventId: string, text: string) => {
    const dayEvents = events[dateStr] || [];
    const updatedEvents = {
      ...events,
      [dateStr]: dayEvents.map(e => e.id === eventId ? { ...e, text } : e)
    };
    onUpdateCalendarData({ events: updatedEvents });
  };

  const handleUpdateEvent = (dateStr: string, eventId: string, updates: Partial<CalendarEvent>) => {
    const dayEvents = events[dateStr] || [];
    const updatedEvents = {
      ...events,
      [dateStr]: dayEvents.map(e => e.id === eventId ? { ...e, ...updates } : e)
    };
    onUpdateCalendarData({ events: updatedEvents });
  };

  const handleDrop = (dateStr: string, type: 'birthday' | 'weather' | 'sticky' | 'holiday' | 'conference', extra?: any) => {
    if (type === 'birthday') {
      setIsAddingBirthday({ date: dateStr });
    } else if (type === 'sticky') {
      setIsAddingSticky({ date: dateStr });
    } else if (type === 'holiday') {
      setIsAddingHoliday({ date: dateStr });
    } else if (type === 'conference') {
      setIsAddingConference({ date: dateStr });
    } else {
      handleAddEvent(dateStr, { type, ...extra });
      if (type === 'weather' && extra?.text) {
        triggerWeatherEffect(extra.text);
      }
    }
  };

  const DraggableTool: React.FC<{ type: string, icon: string | React.ReactNode, label: string, color?: string }> = ({ type, icon, label, color }) => {
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      setDragging({ type, icon, label, color, offsetX, offsetY, x: e.clientX, y: e.clientY });
      const move = (ev: PointerEvent) => {
        setDragging(d => d ? { ...d, x: ev.clientX, y: ev.clientY } : null);
      };
      const up = (ev: PointerEvent) => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        const target = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
        const dayEl = target?.closest('[data-date]') as HTMLElement | null;
        if (dayEl) {
          const dateStr = dayEl.getAttribute('data-date')!;
          handleDrop(dateStr, type as any, type === 'weather' ? { icon, text: label } : {});
        }
        setDragging(null);
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    };
  
    return (
      <div
        onPointerDown={handlePointerDown}
        className={`flex flex-col items-center gap-1 p-3 rounded-2xl bg-white shadow-sm border-2 border-slate-100 cursor-grab active:cursor-grabbing hover:scale-105 transition-all hover:border-blue-200 touch-none`}
      >
        <div className="text-4xl">{icon}</div>
        <span className="text-sm font-black uppercase tracking-widest text-slate-400">{label}</span>
      </div>
    );
  };

  const triggerConfetti = (name: string) => {
    setCelebrationName(name);
    
    // Add celebration sound
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Celebration audio failed:', e));

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF69B4', '#FFD700', '#00BFFF', '#32CD32', '#FF4500']
    });
    setTimeout(() => setCelebrationName(null), 4000);
  };

  const triggerWeatherEffect = (type: string) => {
    if (weatherAudioRef.current) {
      weatherAudioRef.current.pause();
      weatherAudioRef.current = null;
    }

    setActiveWeatherEffect(type);
    
    const soundUrl = WEATHER_SOUNDS[type];
    if (soundUrl) {
      const audio = new Audio(soundUrl);
      audio.volume = 0.4;
      audio.play().catch(e => console.log('Audio play failed:', e));
      weatherAudioRef.current = audio;
    }

    const duration = 6000;
    setTimeout(() => {
      setActiveWeatherEffect(null);
      if (weatherAudioRef.current) {
        weatherAudioRef.current.pause();
        weatherAudioRef.current = null;
      }
    }, duration);
  };

  const renderCalendar = () => {
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const calendarDays = [];

    for (let i = 0; i < startDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[110px] bg-slate-50/50 border border-slate-100 rounded-xl" />);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = events[dateStr] || [];
      const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

      calendarDays.push(
        <div 
          key={d} 
          ref={el => dayRefs.current[dateStr] = el}
          data-date={dateStr}
          className={`min-h-[80px] sm:min-h-[110px] p-1.5 sm:p-2 border-2 rounded-2xl transition-all relative group overflow-hidden ${
            dragOverDate === dateStr 
              ? 'border-blue-500 bg-blue-100/50 ring-4 ring-blue-50 shadow-lg scale-[1.02] z-10' 
              : isToday 
                ? 'border-blue-400 bg-blue-50/50 shadow-inner' 
                : 'border-slate-100 bg-white hover:border-blue-200 hover:shadow-md'
          } touch-none`}
          onClick={() => setSelectedDayEvents({ date: dateStr, events: dayEvents })}
          onPointerEnter={() => setDragOverDate(dateStr)}
          onPointerLeave={() => setDragOverDate(null)}
        >
          <span className={`text-sm sm:text-base font-black ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>{d}</span>
          
          <div className="flex flex-wrap gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
            {dayEvents.map(event => (
              <div key={event.id} className="relative">
                {event.type === 'birthday' && (
                  <div className="w-7 h-7 bg-pink-500 rounded-full flex items-center justify-center text-xs shadow-lg border-2 border-white animate-bounce-gentle z-20" title={`Birthday: ${event.studentName}`}>
                    🎂
                  </div>
                )}
                {event.type === 'holiday' && (
                  <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-xs shadow-lg border-2 border-white z-20" title={event.text}>
                    {event.icon}
                  </div>
                )}
                {event.type === 'conference' && (
                  <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-xs shadow-lg border-2 border-white z-20" title="Parent-Teacher Conference">
                    🏫
                  </div>
                )}
                {event.type === 'weather' && (
                  <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-xs shadow-sm border border-blue-100" title={event.text}>
                    {event.icon}
                  </div>
                )}
                {event.type === 'sticky' && (
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs shadow-sm border ${event.color || STICKY_COLORS[0]}`} title={event.text}>
                    📝
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return calendarDays;
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-8 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] border-[12px] border-blue-50"
        onClick={e => e.stopPropagation()}
      >
        {/* Sidebar Tools */}
        <div className="w-full md:w-56 bg-slate-50 p-6 border-b-4 md:border-b-0 md:border-r-4 border-slate-100 flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto hide-scrollbar">
          <h3 className="hidden md:block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Calendar Tools</h3>
          <DraggableTool type="birthday" icon="🎂" label="Birthday" />
          <DraggableTool type="holiday" icon="🎆" label="Holiday" />
          <DraggableTool type="conference" icon="🏫" label="Conference" />
          <DraggableTool type="sticky" icon="📝" label="Sticky Note" />
          <div className="hidden md:block h-px bg-slate-200 my-2"></div>
          {WEATHER_ICONS.map(w => (
            <DraggableTool key={w.label} type="weather" icon={w.icon} label={w.label} />
          ))}
          <div className="mt-auto hidden md:block p-4 bg-blue-50 rounded-2xl text-sm font-bold text-blue-600 italic">
            Drag tools onto any day to add them!
          </div>
        </div>

        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-blue-500 text-white flex justify-between items-center border-b-8 border-blue-700">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-inner">📅</div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{monthName} {year}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={goToToday}
                className="px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-black uppercase tracking-widest transition-all active:scale-95"
              >
                Today
              </button>
              <div className="flex bg-blue-600 rounded-2xl p-1 shadow-inner">
                <button onClick={prevMonth} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-xl transition-colors"><ChevronLeft size={18} /></button>
                <button onClick={nextMonth} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-xl transition-colors"><ChevronRight size={18} /></button>
              </div>
              <button onClick={onClose} className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-rose-500 rounded-xl flex items-center justify-center transition-all active:scale-90"><X size={18} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-black text-slate-400 text-sm sm:text-base uppercase tracking-widest py-2">{day}</div>
              ))}
              {renderCalendar()}
            </div>
          </div>
        </div>


        {/* Day Details Modal */}
        <AnimatePresence>
          {selectedDayEvents && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedDayEvents(null)}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border-8 border-blue-50"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-slate-800">
                    {new Date(selectedDayEvents.date + 'T00:00:00').toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <button onClick={() => setSelectedDayEvents(null)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={24} /></button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedDayEvents.events.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 font-bold italic text-lg">No events scheduled for this day.</div>
                  ) : (
                    selectedDayEvents.events.map(event => (
                      <div key={event.id} className={`p-5 rounded-2xl border-2 flex items-center gap-4 group cursor-pointer transition-all hover:scale-[1.02] ${event.type === 'birthday' ? 'bg-pink-50 border-pink-100' : event.type === 'sticky' ? (event.color || STICKY_COLORS[0]) : 'bg-blue-50 border-blue-100'}`}>
                        <div className="flex-1" onClick={() => {
                          if (event.type === 'birthday') triggerConfetti(event.studentName || '');
                          if (event.type === 'weather') triggerWeatherEffect(event.text || '');
                          if (event.type === 'sticky') setExpandedSticky(event);
                        }}>
                          {event.type === 'birthday' && <div className="font-black text-black text-lg">{event.studentName} 🎉</div>}
                          {event.type === 'holiday' && (
                            <div className="flex items-center gap-4">
                              <span className="text-3xl">{event.icon}</span>
                              <div className="font-black text-orange-600 text-lg">{event.text}</div>
                            </div>
                          )}
                          {event.type === 'conference' && (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-4">
                                <span className="text-3xl">{event.icon}</span>
                                <div className="font-black text-indigo-600 text-lg">{event.text}</div>
                              </div>
                              {event.studentName && (
                                <div className="text-black font-bold ml-12">Student: {event.studentName}</div>
                              )}
                            </div>
                          )}
                          {event.type === 'weather' && (
                            <div className="flex items-center gap-4">
                              <span className="text-3xl">{event.icon}</span>
                              <div className="font-black text-blue-600 text-lg">{event.text}</div>
                            </div>
                          )}
                          {event.type === 'sticky' && (
                            <div className="font-bold text-slate-700 whitespace-pre-wrap text-lg line-clamp-2">{event.text}</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {event.type === 'sticky' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setStickyText(event.text || '');
                                setStickyColor(event.color || STICKY_COLORS[0]);
                                setIsEditingSticky({ date: selectedDayEvents.date, event });
                              }}
                              className="opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-600 transition-all p-2"
                            >
                              <Pencil size={22} />
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveEvent(selectedDayEvents.date, event.id);
                              setSelectedDayEvents({
                                ...selectedDayEvents,
                                events: selectedDayEvents.events.filter(e => e.id !== event.id)
                              });
                            }}
                            className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-all p-2"
                          >
                            <Trash2 size={22} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAddingHoliday && (
            <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddingHoliday(null)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border-8 border-orange-100"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-2xl font-black text-slate-800 mb-6 text-center">Select a Holiday 🎆</h3>
                <div className="grid grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
                  {HOLIDAYS.map(h => (
                    <button 
                      key={h.label}
                      onClick={() => {
                        handleAddEvent(isAddingHoliday.date, { type: 'holiday', icon: h.icon, text: h.label });
                        setIsAddingHoliday(null);
                      }}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-orange-50 hover:bg-orange-100 border-2 border-transparent hover:border-orange-200 transition-all group"
                    >
                      <span className="text-4xl group-hover:scale-110 transition-transform">{h.icon}</span>
                      <span className="text-[11px] font-black uppercase tracking-tighter text-orange-600 text-center leading-tight">{h.label}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setIsAddingHoliday(null)} className="w-full mt-6 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-colors text-lg">Cancel</button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAddingConference && (
            <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddingConference(null)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border-8 border-indigo-100"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-2xl font-black text-slate-800 mb-6 text-center">Parent-Teacher Conference 🏫</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Student Name (Optional)</label>
                    <input 
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Enter student name..."
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-4 border-slate-100 focus:border-indigo-300 outline-none font-bold text-lg"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => setIsAddingConference(null)}
                      className="flex-1 py-4 rounded-2xl font-black text-slate-400 bg-slate-100 hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        handleAddEvent(isAddingConference.date, { 
                          type: 'conference', 
                          icon: '🏫', 
                          text: 'Parent-Teacher Conference',
                          studentName: studentName.trim() || undefined
                        });
                        setStudentName('');
                        setIsAddingConference(null);
                      }}
                      className="flex-1 py-4 rounded-2xl font-black text-white bg-indigo-500 hover:bg-indigo-600 shadow-xl shadow-indigo-200 transition-all"
                    >
                      Add Event
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isEditingSticky && (
            <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditingSticky(null)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 border-8 ${stickyColor}`}
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-2xl font-black text-slate-800 mb-6 text-center">Edit Sticky Note 📝</h3>
                <div className="flex justify-center gap-3 mb-6">
                  {STICKY_COLORS.map(color => (
                    <button 
                      key={color}
                      onClick={() => setStickyColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${color} ${stickyColor === color ? 'ring-2 ring-blue-400 scale-110' : 'opacity-60 hover:opacity-100'}`}
                    />
                  ))}
                </div>
                <textarea 
                  value={stickyText}
                  onChange={(e) => setStickyText(e.target.value)}
                  placeholder="Type your note here..."
                  className="w-full h-40 p-6 rounded-2xl bg-white/50 border-4 border-white/20 focus:border-white/40 outline-none font-bold text-lg resize-none placeholder:text-slate-400"
                  autoFocus
                />
                <div className="flex gap-4 mt-6">
                  <button 
                    onClick={() => setIsEditingSticky(null)}
                    className="flex-1 py-4 rounded-2xl font-black text-slate-500 bg-white/30 hover:bg-white/50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      if (stickyText.trim()) {
                        handleUpdateStickyText(isEditingSticky.date, isEditingSticky.event.id, stickyText.trim());
                        // Also update color if it changed
                        handleUpdateEvent(isEditingSticky.date, isEditingSticky.event.id, { color: stickyColor });
                        
                        // Update selectedDayEvents to reflect changes in the list
                        if (selectedDayEvents) {
                          setSelectedDayEvents({
                            ...selectedDayEvents,
                            events: selectedDayEvents.events.map(e => 
                              e.id === isEditingSticky.event.id 
                                ? { ...e, text: stickyText.trim(), color: stickyColor } 
                                : e
                            )
                          });
                        }
                        
                        setStickyText('');
                        setIsEditingSticky(null);
                      }
                    }}
                    className="flex-1 py-4 rounded-2xl font-black text-white bg-slate-800 hover:bg-slate-900 shadow-xl transition-all"
                  >
                    Update
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Sticky Note Modal */}
        <AnimatePresence>
          {isAddingSticky && (
            <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddingSticky(null)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 border-8 ${stickyColor}`}
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-2xl font-black text-slate-800 mb-2">Add a Note 📝</h3>
                <div className="flex gap-2 mb-6">
                  {STICKY_COLORS.map(color => (
                    <button 
                      key={color}
                      onClick={() => setStickyColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${color} ${stickyColor === color ? 'ring-2 ring-blue-400 scale-110' : 'opacity-60 hover:opacity-100'}`}
                    />
                  ))}
                </div>
                <textarea 
                  autoFocus
                  className="w-full px-6 py-4 rounded-2xl bg-white/50 border-4 border-black/5 focus:border-black/10 outline-none font-bold text-lg mb-6 resize-none"
                  placeholder="What's the note?"
                  rows={4}
                  value={stickyText}
                  onChange={e => setStickyText(e.target.value)}
                />
                <div className="flex gap-4">
                  <button onClick={() => setIsAddingSticky(null)} className="flex-1 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-colors">Cancel</button>
                  <button 
                    onClick={() => {
                      if (stickyText.trim()) {
                        handleAddEvent(isAddingSticky.date, { type: 'sticky', text: stickyText.trim(), color: stickyColor });
                        setStickyText('');
                        setIsAddingSticky(null);
                      }
                    }}
                    className="flex-1 bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    Save Note
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isAddingBirthday && (
            <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddingBirthday(null)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 border-8 border-pink-100"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-2xl font-black text-slate-800 mb-2">Whose birthday? 🎂</h3>
                <p className="text-slate-400 font-bold text-lg mb-6">Enter the student's name below.</p>
                <input 
                  type="text" 
                  autoFocus
                  className="w-full px-6 py-4 rounded-2xl border-4 border-pink-50 focus:border-pink-300 outline-none font-black text-xl mb-6"
                  placeholder="Student Name"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && studentName.trim()) {
                      handleAddEvent(isAddingBirthday.date, { type: 'birthday', studentName: studentName.trim() });
                      setStudentName('');
                      setIsAddingBirthday(null);
                    }
                  }}
                />
                <div className="flex gap-4">
                  <button onClick={() => setIsAddingBirthday(null)} className="flex-1 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-colors text-lg">Cancel</button>
                  <button 
                    onClick={() => {
                      if (studentName.trim()) {
                        handleAddEvent(isAddingBirthday.date, { type: 'birthday', studentName: studentName.trim() });
                        setStudentName('');
                        setIsAddingBirthday(null);
                      }
                    }}
                    className="flex-1 bg-pink-500 text-white font-black py-4 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-lg"
                  >
                    Add 🎂
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Expanded Sticky Note */}
        <AnimatePresence>
          {expandedSticky && (
            <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setExpandedSticky(null)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                className={`w-full max-w-lg aspect-square rounded-3xl shadow-2xl p-12 flex flex-col items-center justify-center text-center relative border-8 ${expandedSticky.color || STICKY_COLORS[0]}`}
                onClick={e => e.stopPropagation()}
              >
                <button onClick={() => setExpandedSticky(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X size={32} /></button>
                <div className="text-3xl font-black text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {expandedSticky.text}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Weather Effects Overlay */}
        <AnimatePresence>
          {activeWeatherEffect && (
            <div className="fixed inset-0 z-[900] pointer-events-none overflow-hidden">
              {activeWeatherEffect === 'Rainy' && (
                <div className="absolute inset-0 bg-blue-900/10 animate-rain">
                  {[...Array(50)].map((_, i) => (
                    <div key={i} className="absolute w-0.5 h-8 bg-blue-400/40 rounded-full" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animation: `rain-drop ${0.5 + Math.random()}s linear infinite` }} />
                  ))}
                </div>
              )}
              {activeWeatherEffect === 'Cloudy' && (
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(12)].map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute text-[12rem] opacity-60" 
                      style={{ 
                        top: `${-10 + Math.random() * 90}%`, 
                        left: '-400px',
                        animation: `cloud-move ${4 + Math.random() * 2}s linear forwards`,
                        animationDelay: `${Math.random() * 0.5}s`
                      }}
                    >
                      ☁️
                    </div>
                  ))}
                </div>
              )}
              {activeWeatherEffect === 'Snowy' && (
                <div className="absolute inset-0">
                  {[...Array(50)].map((_, i) => (
                    <div key={i} className="absolute text-white animate-snow" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, fontSize: `${10 + Math.random() * 20}px`, animation: `snow-fall ${3 + Math.random() * 5}s linear infinite` }}>❄️</div>
                  ))}
                </div>
              )}
              {activeWeatherEffect === 'Stormy' && (
                <div className="absolute inset-0 bg-slate-900/20 animate-lightning">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute w-1.5 bg-blue-200 shadow-[0_0_30px_rgba(0,191,255,1)]"
                      style={{ 
                        left: `${10 + Math.random() * 80}%`, 
                        top: '-100px',
                        height: '120vh',
                        transform: `rotate(${Math.random() * 10 - 5}deg)`,
                        animation: `lightning-bolt ${0.5 + Math.random() * 1}s infinite`,
                        animationDelay: `${Math.random() * 0.5}s`
                      }}
                    />
                  ))}
                </div>
              )}
              {activeWeatherEffect === 'Sunny' && (
                <div className="absolute inset-0 bg-yellow-400/10 animate-sun-glow flex items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ 
                      scale: [0, 1.2, 1.1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 0.8, times: [0, 0.6, 1] }}
                    className="text-[18rem] sm:text-[25rem] drop-shadow-[0_0_60px_rgba(255,220,0,0.6)] filter"
                  >
                    🌞
                  </motion.div>
                </div>
              )}
              {activeWeatherEffect === 'Windy' && (
                <div className="absolute inset-0 overflow-hidden">
                  {/* Breeze lines */}
                  {[...Array(15)].map((_, i) => (
                    <motion.div
                      key={`breeze-${i}`}
                      initial={{ x: "-20vw", opacity: 0, y: `${Math.random() * 100}%` }}
                      animate={{ 
                        x: ["-20vw", "120vw"],
                        opacity: [0, 0.2, 0.2, 0],
                        y: [
                          `${Math.random() * 100}%`, 
                          `${Math.random() * 100}%`, 
                          `${Math.random() * 100}%`, 
                          `${Math.random() * 100}%`
                        ]
                      }}
                      transition={{ 
                        duration: 3 + Math.random() * 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: Math.random() * 2
                      }}
                      className="absolute h-1 w-64 bg-white/30 blur-sm rounded-full"
                    />
                  ))}
                  {/* Whirling leaves */}
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={`leaf-${i}`}
                      initial={{ 
                        x: "-10vw", 
                        y: `${Math.random() * 100}%`,
                        rotate: 0,
                        scale: 0.5 + Math.random() * 0.7
                      }}
                      animate={{ 
                        x: "110vw",
                        y: [
                          `${Math.random() * 100}%`, 
                          `${Math.random() * 100}%`, 
                          `${Math.random() * 100}%`, 
                          `${Math.random() * 100}%`
                        ],
                        rotate: [0, 360, 720, 1080],
                      }}
                      transition={{ 
                        duration: 4 + Math.random() * 4,
                        repeat: Infinity,
                        ease: "linear",
                        delay: Math.random() * 3
                      }}
                      className="absolute text-4xl drop-shadow-sm"
                    >
                      🍃
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </AnimatePresence>

        {/* Birthday Celebration Overlay */}
        <AnimatePresence>
          {celebrationName && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, scale: 0.5, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.5, y: -100 }}
                className="bg-white/90 backdrop-blur-md px-12 py-8 rounded-[3rem] shadow-2xl border-8 border-pink-400 text-center"
              >
                <div className="text-6xl mb-4">🎂✨</div>
                <h2 className="text-5xl font-black text-pink-600 mb-2">Happy Birthday!</h2>
                <div className="text-7xl font-black text-black uppercase tracking-tighter">
                  {celebrationName}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        @keyframes bounce-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes rain-drop { from { transform: translateY(-100vh); } to { transform: translateY(100vh); } }
        @keyframes snow-fall { from { transform: translateY(-100vh) rotate(0deg); } to { transform: translateY(100vh) rotate(360deg); } }
        @keyframes lightning { 0%, 85%, 90%, 95%, 100% { background-color: transparent; } 88%, 92%, 98% { background-color: rgba(255,255,255,0.4); } }
        @keyframes lightning-bolt { 0%, 94%, 100% { opacity: 0; } 95%, 98% { opacity: 1; } }
        @keyframes cloud-move { from { transform: translateX(0); } to { transform: translateX(150vw); } }
        @keyframes sun-glow { 0%, 100% { background-color: rgba(255,220,0,0.05); } 50% { background-color: rgba(255,220,0,0.15); } }
        @keyframes wind-blow { from { transform: translateX(-100vw); } to { transform: translateX(100vw); } }
        
        .animate-bounce-gentle { animation: bounce-gentle 2s ease-in-out infinite; }
        .animate-lightning { animation: lightning 4s infinite; }
        .animate-sun-glow { animation: sun-glow 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default CalendarOverlay;
