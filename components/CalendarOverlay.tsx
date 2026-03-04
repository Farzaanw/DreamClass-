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
  Plus
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  type: 'birthday' | 'weather' | 'sticky';
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

const STICKY_COLORS = [
  'bg-yellow-100 border-yellow-200',
  'bg-blue-100 border-blue-200',
  'bg-pink-100 border-pink-200',
  'bg-green-100 border-green-200',
  'bg-purple-100 border-purple-200',
];

const DraggableTool: React.FC<{ type: string, icon: string | React.ReactNode, label: string, color?: string }> = ({ type, icon, label, color }) => (
  <div 
    draggable
    onDragStart={(e) => {
      e.dataTransfer.setData('type', type);
      if (typeof icon === 'string') e.dataTransfer.setData('icon', icon);
      e.dataTransfer.setData('label', label);
    }}
    className={`flex flex-col items-center gap-1 p-3 rounded-2xl bg-white shadow-sm border-2 border-slate-100 cursor-grab active:cursor-grabbing hover:scale-105 transition-all hover:border-blue-200`}
  >
    <div className="text-4xl">{icon}</div>
    <span className="text-sm font-black uppercase tracking-widest text-slate-400">{label}</span>
  </div>
);

const CalendarOverlay: React.FC<CalendarOverlayProps> = ({ 
  calendarData, 
  onUpdateCalendarData, 
  onClose 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: string, events: CalendarEvent[] } | null>(null);
  const [isAddingBirthday, setIsAddingBirthday] = useState<{ date: string } | null>(null);
  const [isAddingSticky, setIsAddingSticky] = useState<{ date: string } | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [expandedSticky, setExpandedSticky] = useState<CalendarEvent | null>(null);
  const [activeWeatherEffect, setActiveWeatherEffect] = useState<string | null>(null);
  const [celebrationName, setCelebrationName] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [stickyText, setStickyText] = useState('');
  const [stickyColor, setStickyColor] = useState(STICKY_COLORS[0]);
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  const handleDrop = (dateStr: string, type: 'birthday' | 'weather' | 'sticky', extra?: any) => {
    if (type === 'birthday') {
      setIsAddingBirthday({ date: dateStr });
    } else if (type === 'sticky') {
      setIsAddingSticky({ date: dateStr });
    } else {
      handleAddEvent(dateStr, { type, ...extra });
      if (type === 'weather' && extra?.text) {
        triggerWeatherEffect(extra.text);
      }
    }
  };

  const triggerConfetti = (name: string) => {
    setCelebrationName(name);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF69B4', '#FFD700', '#00BFFF', '#32CD32', '#FF4500']
    });
    setTimeout(() => setCelebrationName(null), 4000);
  };

  const triggerWeatherEffect = (type: string) => {
    setActiveWeatherEffect(type);
    setTimeout(() => setActiveWeatherEffect(null), 5000);
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
          className={`min-h-[80px] sm:min-h-[110px] p-1.5 sm:p-2 border-2 rounded-2xl transition-all relative group overflow-hidden ${
            dragOverDate === dateStr 
              ? 'border-blue-500 bg-blue-100/50 ring-4 ring-blue-50 shadow-lg scale-[1.02] z-10' 
              : isToday 
                ? 'border-blue-400 bg-blue-50/50 shadow-inner' 
                : 'border-slate-100 bg-white hover:border-blue-200 hover:shadow-md'
          }`}
          onClick={() => setSelectedDayEvents({ date: dateStr, events: dayEvents })}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverDate(dateStr);
          }}
          onDragLeave={() => setDragOverDate(null)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverDate(null);
            const type = e.dataTransfer.getData('type') as any;
            const icon = e.dataTransfer.getData('icon');
            const label = e.dataTransfer.getData('label');
            if (type) {
              handleDrop(dateStr, type, type === 'weather' ? { icon, text: label } : {});
            }
          }}
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
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-8 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
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
                <p className="text-blue-100 font-bold text-base sm:text-lg">Interactive Classroom Calendar 🍎</p>
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
                    ))
                  )}
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
                <div className="text-6xl mb-8">📝</div>
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
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="absolute text-4xl animate-wind" style={{ top: `${Math.random() * 100}%`, animation: `wind-blow ${2 + Math.random() * 2}s linear infinite`, animationDelay: `${Math.random() * 2}s` }}>🍃</div>
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
