
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface Resource {
  id: string;
  title: string;
  subject: string;
  grade: string;
  type: 'Lesson' | 'Game' | 'Song' | 'Worksheet';
  source: 'Community' | 'External';
  description: string;
  thumbnail: string;
  externalUrl?: string;
  topic: string;
}

const PLACEHOLDER_RESOURCES: Resource[] = [
  {
    id: '1',
    title: 'Phonics Adventure: The Letter A',
    subject: 'Phonics',
    grade: 'K',
    type: 'Lesson',
    source: 'Community',
    description: 'An interactive journey through the world of the letter A with catchy songs and games.',
    thumbnail: 'https://picsum.photos/seed/phonics/400/250',
    topic: 'Alphabet'
  },
  {
    id: '2',
    title: 'Math Wizards: Addition 1-10',
    subject: 'Math',
    grade: '1',
    type: 'Game',
    source: 'External',
    description: 'A fun external game that helps students master basic addition through play.',
    thumbnail: 'https://picsum.photos/seed/math/400/250',
    externalUrl: 'https://example.com/math-game',
    topic: 'Addition'
  },
  {
    id: '3',
    title: 'Science Explorers: Plant Life Cycle',
    subject: 'Science',
    grade: '2',
    type: 'Worksheet',
    source: 'Community',
    description: 'A comprehensive worksheet set for learning about how plants grow from seeds.',
    thumbnail: 'https://picsum.photos/seed/science/400/250',
    topic: 'Biology'
  },
  {
    id: '4',
    title: 'The Solar System Song',
    subject: 'Science',
    grade: '3',
    type: 'Song',
    source: 'External',
    description: 'A catchy song that teaches the names and order of the planets in our solar system.',
    thumbnail: 'https://picsum.photos/seed/space/400/250',
    externalUrl: 'https://example.com/space-song',
    topic: 'Astronomy'
  },
  {
    id: '5',
    title: 'Reading Comprehension: Mystery at the Zoo',
    subject: 'Reading',
    grade: '4',
    type: 'Lesson',
    source: 'Community',
    description: 'A mystery-themed reading lesson that focuses on inference and main idea.',
    thumbnail: 'https://picsum.photos/seed/reading/400/250',
    topic: 'Comprehension'
  },
  {
    id: '6',
    title: 'History Heroes: Ancient Egypt',
    subject: 'History',
    grade: '5',
    type: 'Game',
    source: 'External',
    description: 'Explore the pyramids and learn about pharaohs in this interactive history game.',
    thumbnail: 'https://picsum.photos/seed/history/400/250',
    externalUrl: 'https://example.com/history-game',
    topic: 'Ancient Civilizations'
  }
];

interface PublicLibraryProps {
  onBack: () => void;
  onLogin: () => void;
  isLoggedIn: boolean;
  onAddResource?: (resource: Resource, subjectId: string) => void;
  subjectsList?: { id: string, title: string }[];
  hideNavbar?: boolean;
  buttonText?: string;
}

const PublicLibrary: React.FC<PublicLibraryProps> = ({ 
  onBack, 
  onLogin, 
  isLoggedIn, 
  onAddResource, 
  subjectsList,
  hideNavbar = false,
  buttonText = "Save"
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [assigningResourceId, setAssigningResourceId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredResources = useMemo(() => {
    return PLACEHOLDER_RESOURCES.filter(res => {
      const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           res.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGrade = gradeFilter === 'All' || res.grade === gradeFilter;
      const matchesSubject = subjectFilter === 'All' || res.subject === subjectFilter;
      const matchesType = typeFilter === 'All' || res.type === typeFilter;
      const matchesSource = sourceFilter === 'All' || res.source === sourceFilter;
      
      return matchesSearch && matchesGrade && matchesSubject && matchesType && matchesSource;
    });
  }, [searchQuery, gradeFilter, subjectFilter, typeFilter, sourceFilter]);

  const grades = ['All', 'K', '1', '2', '3', '4', '5'];
  const subjects = ['All', 'Phonics', 'Math', 'Science', 'Reading', 'History', 'Art', 'Music', 'Health'];
  const types = ['All', 'Lesson', 'Game', 'Song', 'Worksheet'];
  const sources = ['All', 'Community', 'External'];

  return (
    <div className={`${hideNavbar ? '' : 'min-h-screen'} bg-[#F0F9FF] font-['Fredoka'] pb-20`}>
      {/* Navbar */}
      {!hideNavbar && (
        <nav className="bg-white/80 backdrop-blur-md border-b border-blue-100 py-4 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-xl hover:bg-slate-50 transition-all active:scale-90"
            >
              ⬅️
            </button>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Public Library 📚</h1>
          </div>
          {!isLoggedIn && (
            <button 
              onClick={onLogin}
              className="bg-blue-500 text-white px-6 py-2 rounded-full font-bold transition-all shadow-md border-b-4 border-blue-700 hover:bg-blue-600 active:translate-y-1 active:border-b-0"
            >
              Join today to Save
            </button>
          )}
        </nav>
      )}

      {/* Success Message Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-8 py-4 rounded-full font-bold shadow-2xl flex items-center gap-3"
          >
            <span>✅</span> {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filters */}
      <section className={`max-w-7xl mx-auto px-6 ${hideNavbar ? 'pt-4' : 'pt-12'} pb-8`}>
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border-b-[12px] border-blue-100 mb-12">
          <div className="flex flex-col gap-6">
            {/* Search Bar */}
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
              <input 
                type="text"
                placeholder="Search for lessons, games, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg font-medium focus:outline-none focus:border-blue-400 transition-all"
              />
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Grade Level</label>
                <select 
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-400 transition-all appearance-none cursor-pointer"
                >
                  {grades.map(g => <option key={g} value={g}>{g === 'All' ? 'All Grades' : `Grade ${g}`}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                <select 
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-400 transition-all appearance-none cursor-pointer"
                >
                  {subjects.map(s => <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Resource Type</label>
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-400 transition-all appearance-none cursor-pointer"
                >
                  {types.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Source</label>
                <select 
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-400 transition-all appearance-none cursor-pointer"
                >
                  {sources.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sources' : s}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredResources.map((res) => (
              <motion.div 
                key={res.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`bg-white rounded-[2.5rem] shadow-xl border-b-8 overflow-hidden flex flex-col group hover:-translate-y-2 transition-all ${assigningResourceId === res.id ? 'ring-4 ring-blue-500 border-blue-500' : 'border-slate-100'}`}
              >
                {/* Thumbnail */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={res.thumbnail} 
                    alt={res.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest text-white shadow-lg ${
                      res.source === 'Community' ? 'bg-purple-500' : 'bg-blue-500'
                    }`}>
                      {res.source === 'Community' ? '👥 Community' : '🌐 External'}
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[11px] font-black uppercase tracking-widest text-slate-700 shadow-sm">
                      {res.type}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">{res.subject}</span>
                    <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md">Grade {res.grade}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3 line-clamp-1">{res.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2 flex-1">
                    {res.description}
                  </p>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        if (res.source === 'External' && res.externalUrl) {
                          window.open(res.externalUrl, '_blank');
                        } else {
                          // For community lessons, show a read-only preview
                          alert('Opening read-only preview for: ' + res.title);
                        }
                      }}
                      className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => {
                        if (!isLoggedIn) {
                          onLogin();
                        } else if (subjectsList && subjectsList.length > 0) {
                          setAssigningResourceId(res.id);
                          // Scroll to top of filters section to show assignment options
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                          alert('Please create a classroom first!');
                        }
                      }}
                      className="flex-1 bg-blue-500 text-white font-bold py-3 rounded-2xl shadow-md border-b-4 border-blue-700 hover:bg-blue-600 active:translate-y-1 active:border-b-0 transition-all"
                    >
                      {buttonText}
                    </button>
                  </div>
                </div>

                {/* Assignment Overlay */}
                <AnimatePresence>
                  {assigningResourceId === res.id && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-30 bg-white/95 backdrop-blur-sm p-6 flex flex-col"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider">Add to Classroom</h4>
                        <button onClick={() => setAssigningResourceId(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {subjectsList?.map(sub => (
                          <button 
                            key={sub.id}
                            onClick={() => {
                              onAddResource?.(res, sub.id);
                              setAssigningResourceId(null);
                              setSuccessMessage("Successfully Added!");
                              setTimeout(() => setSuccessMessage(null), 3000);
                            }}
                            className="w-full p-3 rounded-xl border-2 transition-all text-left font-bold text-sm flex items-center justify-between group border-slate-100 hover:border-blue-400 hover:bg-blue-50 text-slate-700"
                          >
                            <span>{sub.title}</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">➕</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-slate-800">No resources found</h3>
            <p className="text-slate-500">Try adjusting your filters or search query!</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default PublicLibrary;
