import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    <div className="text-3xl">{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
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
  const [studentName, setStudentName] = useState('');
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const events = calendarData?.events || {};

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

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
    } else {
      handleAddEvent(dateStr, { type, ...extra });
    }
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
          className={`min-h-[80px] sm:min-h-[110px] p-1.5 sm:p-2 border-2 rounded-2xl transition-all relative group overflow-hidden ${isToday ? 'border-blue-400 bg-blue-50/50 shadow-inner' : 'border-slate-100 bg-white hover:border-blue-200 hover:shadow-md'}`}
          onClick={() => setSelectedDayEvents({ date: dateStr, events: dayEvents })}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('type') as any;
            const icon = e.dataTransfer.getData('icon');
            const label = e.dataTransfer.getData('label');
            if (type) {
              handleDrop(dateStr, type, type === 'weather' ? { icon, text: label } : {});
            }
          }}
        >
          <span className={`text-xs sm:text-sm font-black ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>{d}</span>
          
          <div className="flex flex-wrap gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
            {dayEvents.map(event => (
              <div key={event.id} className="relative">
                {event.type === 'birthday' && (
                  <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center text-xs shadow-sm border border-pink-200 animate-bounce-gentle" title={`Birthday: ${event.studentName}`}>
                    🎂
                  </div>
                )}
                {event.type === 'weather' && (
                  <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-xs shadow-sm border border-blue-100" title={event.text}>
                    {event.icon}
                  </div>
                )}
                {event.type === 'sticky' && (
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[8px] shadow-sm border ${event.color || STICKY_COLORS[0]}`} title={event.text}>
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
        <div className="w-full md:w-48 bg-slate-50 p-6 border-b-4 md:border-b-0 md:border-r-4 border-slate-100 flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto hide-scrollbar">
          <h3 className="hidden md:block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Calendar Tools</h3>
          <DraggableTool type="birthday" icon="🎂" label="Birthday" />
          <DraggableTool type="sticky" icon="📝" label="Sticky Note" />
          <div className="hidden md:block h-px bg-slate-200 my-2"></div>
          {WEATHER_ICONS.map(w => (
            <DraggableTool key={w.label} type="weather" icon={w.icon} label={w.label} />
          ))}
          <div className="mt-auto hidden md:block p-4 bg-blue-50 rounded-2xl text-[10px] font-bold text-blue-600 italic">
            Drag tools onto any day to add them!
          </div>
        </div>

        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-blue-500 text-white flex justify-between items-center border-b-8 border-blue-700">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-inner">📅</div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">{monthName} {year}</h2>
                <p className="text-blue-100 font-bold text-[10px] sm:text-xs">Interactive Classroom Calendar 🍎</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
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
                <div key={day} className="text-center font-black text-slate-400 text-[9px] sm:text-[10px] uppercase tracking-widest py-2">{day}</div>
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
                  <h3 className="text-2xl font-black text-slate-800">Events for {selectedDayEvents.date}</h3>
                  <button onClick={() => setSelectedDayEvents(null)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={24} /></button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedDayEvents.events.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 font-bold italic">No events scheduled for this day.</div>
                  ) : (
                    selectedDayEvents.events.map(event => (
                      <div key={event.id} className={`p-4 rounded-2xl border-2 flex items-center gap-4 group ${event.type === 'birthday' ? 'bg-pink-50 border-pink-100' : event.type === 'sticky' ? 'bg-yellow-50 border-yellow-100' : 'bg-blue-50 border-blue-100'}`}>
                        <div className="text-3xl">{event.type === 'birthday' ? '🎂' : event.type === 'sticky' ? '📝' : event.icon}</div>
                        <div className="flex-1">
                          {event.type === 'birthday' && <div className="font-black text-pink-600">Birthday: {event.studentName}</div>}
                          {event.type === 'weather' && <div className="font-black text-blue-600">{event.text}</div>}
                          {event.type === 'sticky' && (
                            <textarea 
                              className="w-full bg-transparent border-none focus:ring-0 font-bold text-slate-700 resize-none"
                              value={event.text}
                              placeholder="Type a note..."
                              onChange={(e) => handleUpdateStickyText(selectedDayEvents.date, event.id, e.target.value)}
                              rows={2}
                            />
                          )}
                        </div>
                        <button 
                          onClick={() => handleRemoveEvent(selectedDayEvents.date, event.id)}
                          className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-all p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                   <button 
                     onClick={() => setIsAddingBirthday({ date: selectedDayEvents.date })}
                     className="bg-pink-500 text-white font-black py-3 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                   >
                     🎂 Birthday
                   </button>
                   <button 
                     onClick={() => handleAddEvent(selectedDayEvents.date, { type: 'sticky', text: '', color: STICKY_COLORS[0] })}
                     className="bg-yellow-400 text-white font-black py-3 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                   >
                     📝 Note
                   </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Birthday Name Modal */}
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
                <p className="text-slate-400 font-bold text-sm mb-6">Enter the student's name below.</p>
                <input 
                  type="text" 
                  autoFocus
                  className="w-full px-6 py-4 rounded-2xl border-4 border-pink-50 focus:border-pink-300 outline-none font-black text-lg mb-6"
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
                  <button onClick={() => setIsAddingBirthday(null)} className="flex-1 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-colors">Cancel</button>
                  <button 
                    onClick={() => {
                      if (studentName.trim()) {
                        handleAddEvent(isAddingBirthday.date, { type: 'birthday', studentName: studentName.trim() });
                        setStudentName('');
                        setIsAddingBirthday(null);
                      }
                    }}
                    className="flex-1 bg-pink-500 text-white font-black py-4 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    Add 🎂
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        @keyframes bounce-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .animate-bounce-gentle { animation: bounce-gentle 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default CalendarOverlay;
