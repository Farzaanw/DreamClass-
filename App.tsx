
import React, { useState, useEffect, useMemo } from 'react';
import { User, SubjectId, Concept, Subject, ClassroomDesign, AppMode, MaterialFile, Song, Game } from './types';
import { SUBJECTS, WALL_COLORS, FLOOR_COLORS } from './constants';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ClassroomView from './components/ClassroomView';
import ConceptDashboard from './components/ConceptDashboard';
import ClassroomDesigner from './components/ClassroomDesigner';

type View = 'landing' | 'auth' | 'mode-selection' | 'dashboard' | 'designer-select' | 'designer' | 'classroom' | 'concept';

const RainbowLogo: React.FC<{ size?: string }> = ({ size = "text-4xl" }) => {
  const letters = "Teachly".split("");
  const colors = [
    "text-blue-500", "text-green-500", "text-yellow-500", "text-orange-500", "text-red-500",
    "text-purple-500", "text-indigo-500"
  ];
  return (
    <h1 className={`${size} font-bold tracking-tight flex items-center gap-0.5 drop-shadow-md select-none whitespace-nowrap`}>
      {letters.map((l, i) => (
        <span key={i} className={colors[i % colors.length]}>{l}</span>
      ))}
    </h1>
  );
};

const FeatureCard: React.FC<{ icon: string, title: string, desc: string, color: string }> = ({ icon, title, desc, color }) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-b-8 border-slate-100 hover:-translate-y-2 transition-all flex flex-col items-center text-center">
    <div className={`w-20 h-20 ${color} rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-inner`}>
      {icon}
    </div>
    <h3 className="text-2xl font-bold text-slate-800 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

const StepCard: React.FC<{ num: string, title: string, desc: string, color: string, icon: string }> = ({ num, title, desc, color, icon }) => (
  <div className={`relative p-8 pt-12 bg-white rounded-[3rem] shadow-xl border-b-[12px] ${color} text-center transform hover:scale-105 transition-all`}>
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center font-bold text-2xl shadow-lg ring-4 ring-slate-50">
      {icon}
    </div>
    <div className="mb-2 text-xs font-black uppercase tracking-widest opacity-30">Step {num}</div>
    <h3 className="text-2xl font-bold text-slate-800 mb-4">{title}</h3>
    <p className="text-slate-600 font-medium leading-relaxed">{desc}</p>
  </div>
);

const ExampleCard: React.FC<{ emoji: string, title: string, color: string }> = ({ emoji, title, color }) => (
  <div className="flex-shrink-0 w-64 snap-center p-8 bg-white rounded-[2.5rem] shadow-xl border-b-8 border-slate-100 flex flex-col items-center justify-center text-center transform hover:scale-105 transition-transform duration-300 min-h-[220px]">
    <div className={`w-28 h-28 ${color} rounded-full flex items-center justify-center text-6xl mb-6 shadow-inner`}>
      {emoji}
    </div>
    <h4 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h4>
  </div>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('landing');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');
  const [appMode, setAppMode] = useState<AppMode | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [designingSubjectId, setDesigningSubjectId] = useState<SubjectId | null>(null);

  const allSubjects = useMemo(() => {
    if (!currentUser) return SUBJECTS;
    const custom = currentUser.customSubjects || [];
    const hidden = currentUser.hiddenSubjectIds || [];
    const subjectMap = new Map<string, Subject>();
    SUBJECTS.forEach(s => subjectMap.set(s.id, s));
    custom.forEach(s => subjectMap.set(s.id, s));
    return Array.from(subjectMap.values()).filter(s => !hidden.includes(s.id));
  }, [currentUser]);

  useEffect(() => {
    const saved = localStorage.getItem('dreamclass_user');
    if (saved) {
      setCurrentUser(JSON.parse(saved));
      setCurrentView('mode-selection');
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('mode-selection');
    localStorage.setItem('dreamclass_user', JSON.stringify(user));
  };

  const handleModeSelect = (mode: AppMode) => {
    setAppMode(mode);
    setCurrentView('dashboard');
  };

  const handleBackToModeSelect = () => {
    setCurrentView('mode-selection');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAppMode(null);
    setCurrentView('landing');
    localStorage.removeItem('dreamclass_user');
  };

  const persistUser = (updatedUser: User) => {
    try {
      setCurrentUser(updatedUser);
      localStorage.setItem('dreamclass_user', JSON.stringify(updatedUser));
      const accountsData = localStorage.getItem('dreamclass_accounts');
      if (accountsData) {
        const accounts: User[] = JSON.parse(accountsData);
        const updatedAccounts = accounts.map(acc => 
          acc.id === updatedUser.id ? { ...acc, ...updatedUser, password: acc.password } : acc
        );
        localStorage.setItem('dreamclass_accounts', JSON.stringify(updatedAccounts));
      }
    } catch (e) {
      console.error("Storage error:", e);
      alert("Uh oh! Your magic storage is full. Try deleting some old whiteboards from History to make room for new ones! 📦✨");
    }
  };

  const updateClassroom = (subjectId: SubjectId, design: ClassroomDesign) => {
    if (!currentUser) return;
    const updatedUser = { 
      ...currentUser, 
      classroomDesigns: {
        ...currentUser.classroomDesigns,
        [subjectId]: {
          ...design,
          whiteboards: design.whiteboards || [],
          conceptBoards: design.conceptBoards || {}
        }
      } 
    };
    persistUser(updatedUser);
  };

  const handleAddSubject = (subjectData: { name: string, description: string, concepts: Concept[], icon: string }) => {
    if (!currentUser || !subjectData.name.trim()) return;
    const newId = `custom-${Date.now()}`;
    const colors = ['bg-pink-400', 'bg-orange-400', 'bg-indigo-400', 'bg-teal-400', 'bg-rose-400'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newSubject: Subject = {
      id: newId,
      title: subjectData.name,
      description: subjectData.description,
      color: randomColor,
      concepts: subjectData.concepts,
      icon: subjectData.icon
    };
    const updatedUser = {
      ...currentUser,
      customSubjects: [...(currentUser.customSubjects || []), newSubject],
      classroomDesigns: {
        ...currentUser.classroomDesigns,
        [newId]: {
          wallColor: WALL_COLORS[0],
          floorColor: FLOOR_COLORS[0],
          posterUrls: [],
          ambientMusic: 'none',
          whiteboards: [],
          conceptBoards: {}
        }
      }
    };
    persistUser(updatedUser);
  };

  const handleEditSubject = (subjectId: string, updatedData: { name: string, description: string, concepts: Concept[], icon: string }) => {
    if (!currentUser) return;
    const existing = allSubjects.find(s => s.id === subjectId);
    if (!existing) return;
    const updatedSubject: Subject = {
      ...existing,
      title: updatedData.name,
      description: updatedData.description,
      concepts: updatedData.concepts,
      icon: updatedData.icon
    };
    const otherCustom = (currentUser.customSubjects || []).filter(s => s.id !== subjectId);
    persistUser({
      ...currentUser,
      customSubjects: [...otherCustom, updatedSubject]
    });
  };

  const handleDeleteSubject = (subjectId: SubjectId) => {
    if (!currentUser) return;
    
    const updatedHidden = Array.from(new Set([...(currentUser.hiddenSubjectIds || []), subjectId]));
    const updatedCustomSubjects = (currentUser.customSubjects || []).filter(s => s.id !== subjectId);
    const updatedDesigns = { ...currentUser.classroomDesigns };
    delete updatedDesigns[subjectId];
    
    const updatedUser: User = {
      ...currentUser,
      customSubjects: updatedCustomSubjects,
      hiddenSubjectIds: updatedHidden,
      classroomDesigns: updatedDesigns
    };
    
    persistUser(updatedUser);
  };

  const handleUpdateMaterials = (materials: MaterialFile[]) => {
    if (!currentUser) return;
    persistUser({
      ...currentUser,
      materials
    });
  };

  const handleUpdateSongs = (songs: Song[]) => {
    if (!currentUser) return;
    persistUser({
      ...currentUser,
      songs
    });
  };

  const handleUpdateGames = (games: Game[]) => {
    if (!currentUser) return;
    persistUser({
      ...currentUser,
      games
    });
  };

  const handleUpdateCalendarData = (calendarData: any) => {
    if (!currentUser) return;
    persistUser({
      ...currentUser,
      calendarData
    });
  };

  const navigateToSubject = (subjectId: SubjectId) => {
    const subject = allSubjects.find(s => s.id === subjectId) || null;
    setSelectedSubject(subject);
    if (appMode === 'teacher' && subject && subject.concepts.length > 0) {
      setSelectedConcept(subject.concepts[0]);
      setCurrentView('concept');
    } else {
      setCurrentView('classroom');
    }
  };

  const startDesigning = (subjectId: SubjectId) => {
    setDesigningSubjectId(subjectId);
    setCurrentView('designer');
  };

  const navigateToConcept = (concept: Concept) => {
    setSelectedConcept(concept);
    setCurrentView('concept');
  };

  const goToAuth = (mode: 'login' | 'signup') => {
    setAuthInitialMode(mode);
    setCurrentView('auth');
    window.scrollTo(0, 0);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] font-['Fredoka'] selection:bg-blue-100 selection:text-blue-900">
      {/* Visual Mode Overlay: Teacher (Blue Tint) vs Classroom (Clear) */}
      {currentUser && appMode && (
        <div 
          className={`pointer-events-none fixed inset-0 z-[9999] transition-colors duration-700 ${
            appMode === 'teacher' ? 'bg-blue-500/10' : 'bg-transparent'
          }`}
          aria-hidden="true"
        />
      )}

      {currentView === 'landing' && (
        <div className="flex flex-col">
          {/* Landing Header */}
          <header className="fixed top-0 left-0 right-0 z-[100] bg-white/70 backdrop-blur-lg border-b border-gray-100 py-4 px-6 sm:px-12 flex items-center justify-between">
            <div className="flex items-center gap-10">
              <div onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="cursor-pointer">
                <RainbowLogo size="text-2xl sm:text-3xl" />
              </div>
              <nav className="hidden lg:flex items-center gap-8">
                <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-gray-500 font-bold hover:text-blue-500 transition-colors text-sm uppercase tracking-wider">Home</button>
                <button onClick={() => scrollToSection('features-section')} className="text-gray-500 font-bold hover:text-blue-500 transition-colors text-sm uppercase tracking-wider">Features</button>
                <button onClick={() => scrollToSection('how-it-works-section')} className="text-gray-500 font-bold hover:text-blue-500 transition-colors text-sm uppercase tracking-wider">How it Works</button>
                <button onClick={() => scrollToSection('ai-section')} className="text-gray-500 font-bold hover:text-blue-500 transition-colors text-sm uppercase tracking-wider">AI & Tools</button>
                <button onClick={() => scrollToSection('customization-section')} className="text-gray-500 font-bold hover:text-blue-500 transition-colors text-sm uppercase tracking-wider">Customization</button>
              </nav>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <button onClick={() => goToAuth('login')} className="text-blue-600 px-4 sm:px-6 py-2 rounded-full font-bold transition-all hover:bg-blue-50 text-sm sm:text-base">Log In</button>
              <button onClick={() => goToAuth('signup')} className="bg-blue-500 text-white px-5 sm:px-8 py-2 rounded-full font-bold transition-all shadow-md border-b-4 border-blue-700 hover:bg-blue-600 active:translate-y-1 active:border-b-0 text-sm sm:text-base">Sign Up</button>
            </div>
          </header>

          {/* Hero Section */}
          <section className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden pt-20">
            <div className="absolute inset-0 pointer-events-none select-none text-center">
              <span className="absolute top-[15%] left-[10%] text-4xl animate-float opacity-20">✏️</span>
              <span className="absolute top-[25%] right-[15%] text-5xl animate-float-slow opacity-20">📚</span>
              <span className="absolute bottom-[20%] left-[20%] text-6xl animate-float opacity-20">🎨</span>
              <span className="absolute top-[40%] left-[5%] text-4xl animate-float-slow opacity-10">🎒</span>
              <span className="absolute bottom-[30%] right-[10%] text-5xl animate-float opacity-20">🧩</span>
            </div>
            
            <div className="text-center z-10 animate-fade-in-up px-4 max-w-5xl">
              <div className="mb-8 flex justify-center">
                <div className="w-24 h-24 bg-yellow-400 rounded-[2rem] flex items-center justify-center shadow-2xl border-b-8 border-yellow-600 animate-bounce-gentle">
                  <span className="text-5xl">🎒</span>
                </div>
              </div>
              <RainbowLogo size="text-6xl sm:text-8xl lg:text-9xl" />
              <p className="mt-8 text-xl sm:text-3xl font-medium text-slate-600 max-w-2xl mx-auto leading-relaxed">
                For teachers, made by teachers ❤️
              </p>
              
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
                <button onClick={() => goToAuth('signup')} className="w-full sm:w-auto bg-blue-500 text-white px-10 py-5 rounded-[2rem] text-2xl font-bold transition-all shadow-2xl border-b-8 border-blue-700 hover:scale-105 active:translate-y-2 active:border-b-0">
                  Join the Schoolhouse ✨
                </button>
              </div>
              
              <div className="mt-16 flex items-center justify-center gap-8 text-slate-400 font-bold uppercase tracking-widest text-sm opacity-60">
                <span>Safe for Kids</span>
                <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                <span>AI Enhanced</span>
                <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                <span>Free for Teachers</span>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features-section" className="py-32 px-6 sm:px-12 bg-white">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="text-4xl sm:text-6xl font-bold text-slate-800 mb-6 tracking-tight">Everything a Magic Classroom Needs</h2>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto">Teachly is more than just a whiteboard for teachers. It's a space that encourages engagement and fosters classroom collaboration.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                <FeatureCard 
                  icon="🎨" 
                  title="Classroom Designer" 
                  desc="Pick your wall colors, carpet textures, and even class pets. Create an environment that feels like home."
                  color="bg-orange-100 text-orange-600"
                />
                <FeatureCard 
                  icon="🪄" 
                  title="Magic Whiteboard" 
                  desc="Drag assets, draw with glow-markers, and manage multiple saved lesson states with the interactive board."
                  color="bg-blue-100 text-blue-600"
                />
                <FeatureCard 
                  icon="🤖" 
                  title="AI Teaching Assistant" 
                  desc="Powered by Gemini, your assistant helps come up with games, activity ideas, and even sings along to lyrics."
                  color="bg-purple-100 text-purple-600"
                />
                <FeatureCard 
                  icon="🎵" 
                  title="Classroom Jams" 
                  desc="Set the mood with ambient music and interactive sing-along lyrics to keep the energy high and fun."
                  color="bg-pink-100 text-pink-600"
                />
                <FeatureCard 
                  icon="📦" 
                  title="Magic Asset Drawer" 
                  desc="A bottomless box of letters, numbers, and stickers. Simply drag them onto the board for instant learning."
                  color="bg-green-100 text-green-600"
                />
                <FeatureCard 
                  icon="🏫" 
                  title="Teacher-Mode Control" 
                  desc="Easily add custom subjects and concepts to tailor the curriculum to your students' specific needs."
                  color="bg-yellow-100 text-yellow-600"
                />
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section id="how-it-works-section" className="py-32 px-6 sm:px-12 bg-gradient-to-b from-slate-50 to-blue-50">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-20">
                <span className="text-blue-500 font-bold uppercase tracking-widest text-sm mb-2 block">Playful Learning Journey</span>
                <h2 className="text-4xl sm:text-6xl font-bold text-slate-800 mb-6 tracking-tight">How Your Classroom Comes to Life 🌈</h2>
                <p className="text-lg text-slate-500 font-medium">Teachly offers three powerful ways to interact with your magical space.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <StepCard 
                  num="1" 
                  icon="🛠️"
                  title="Teacher Mode" 
                  color="border-purple-200"
                  desc="Create and prepare! Add your own subjects, pick the decorations, and prep your whiteboard tools before the bell rings." 
                />
                <StepCard 
                  num="2" 
                  icon="🎨"
                  title="Design Your Space" 
                  color="border-yellow-200"
                  desc="Start by building your dream classroom. Choose colors, wall patterns, and the perfect mascot to greet your students." 
                />
                <StepCard 
                  num="3" 
                  icon="👨‍🏫"
                  title="Classroom Mode" 
                  color="border-blue-200"
                  desc="Play and learn! Switch to the immersive full-screen view where students interact with your lessons, music, and AI pet." 
                />
              </div>
            </div>
          </section>

          {/* AI Section */}
          <section id="ai-section" className="py-32 px-6 sm:px-12 bg-white relative overflow-hidden">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-2/3 bg-blue-50 rounded-l-[10rem] opacity-40 -z-10"></div>
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1">
                <div className="w-20 h-20 bg-blue-500 rounded-3xl flex items-center justify-center text-4xl mb-8 shadow-xl text-white">🤖</div>
                <h2 className="text-4xl sm:text-6xl font-bold text-slate-800 mb-8 tracking-tight">Meet Your New Teaching Assistant</h2>
                <p className="text-xl text-slate-600 leading-relaxed mb-8">
                  Never run out of ideas again! Our built-in Assistant, powered by Gemini 3 Flash, can suggest interactive games based on what's currently on your board.
                </p>
                <ul className="space-y-4">
                  {['"Can you give me 3 games for counting apples?"', '"Help me teach the letter B with a story."', '"Let\'s sing a song about the solar system!"'].map((quote, i) => (
                    <li key={i} className="flex items-center gap-4 text-blue-600 font-bold italic">
                      <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs">✨</span>
                      {quote}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 bg-slate-900 p-8 rounded-[3rem] shadow-2xl border-t-[12px] border-slate-800 w-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-4">
                  <div className="bg-slate-800/50 p-4 rounded-2xl text-slate-300 text-sm italic">"I have 5 apples on the board, what game can we play?"</div>
                  <div className="bg-blue-600 p-4 rounded-2xl text-white text-sm font-bold">"Try the 'Magic Subtraction' game! Ask students to close their eyes while you erase one, then have them guess how many are left!"</div>
                  <div className="bg-slate-800/50 p-4 rounded-2xl text-slate-300 text-sm italic">"Great idea! Adding a fun sound effect now... 🔔"</div>
                </div>
              </div>
            </div>
          </section>

          {/* Customization Showroom */}
          <section id="customization-section" className="py-32 px-6 sm:px-12 bg-slate-50 overflow-hidden">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-20">
                <span className="text-green-500 font-bold uppercase tracking-widest text-sm mb-2 block">Unlimited Creativity</span>
                <h2 className="text-4xl sm:text-6xl font-bold text-slate-800 mb-6 tracking-tight">Your Classroom, Your Rules 🎨</h2>
                <p className="text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
                  Customize every corner of your room with your own themes, mascots, and custom subjects. See how other teachers are bringing their magic to life!
                </p>
              </div>

              {/* Carousel container */}
              <div className="relative group">
                <div className="flex overflow-x-auto gap-8 pb-12 snap-x snap-mandatory scroll-smooth hide-scrollbar px-4">
                  <ExampleCard emoji="🍪" title="Counting Cookies" color="bg-orange-100" />
                  <ExampleCard emoji="🦁" title="Phonics Jungle" color="bg-green-100" />
                  <ExampleCard emoji="🚀" title="Space Math Hub" color="bg-blue-100" />
                  <ExampleCard emoji="🏠" title="Lava Science" color="bg-red-100" />
                  <ExampleCard emoji="🏰" title="Medieval Phonics" color="bg-indigo-100" />
                  <ExampleCard emoji="🏠" title="Ocean Explorers" color="bg-cyan-100" />
                  <ExampleCard emoji="🧪" title="Chemistry Kids" color="bg-purple-100" />
                </div>
                {/* Visual fade indicators for mobile/desktop */}
                <div className="absolute left-0 top-0 bottom-12 w-20 bg-gradient-to-r from-slate-50 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute right-0 top-0 bottom-12 w-20 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>

              <div className="mt-12 text-center">
                <div className="inline-flex items-center gap-3 px-8 py-4 bg-white rounded-full shadow-lg border-2 border-slate-100">
                   <span className="text-2xl">✨</span>
                   <span className="font-bold text-slate-700">The only limit is your imagination!</span>
                </div>
              </div>
            </div>
          </section>

          {/* Customization Quote */}
          <section id="custom-section" className="py-24 px-6 sm:px-12 bg-blue-600 relative">
            <div className="max-w-4xl mx-auto text-center">
              <span className="text-white/60 font-bold uppercase tracking-widest text-sm mb-6 block">The Teacher's Heart</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-10 leading-tight">
                "Every child deserves a classroom that feels as magical as their imagination. Teachly helps teachers build that world."
              </h2>
              <div className="flex items-center justify-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full border-2 border-white/30 flex items-center justify-center text-2xl overflow-hidden">🍎</div>
                <div className="text-left">
                  <span className="text-white font-bold block text-lg">Amborse Commisariat</span>
                  <span className="text-white/60 font-medium">Preschool Teacher for Gems Academy</span>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-slate-900 text-slate-300 py-20 px-6 sm:px-12 border-t border-slate-800">
            <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
              <RainbowLogo size="text-3xl" />
              <p className="mt-6 text-slate-500 max-w-xl">
                Empowering the next generation of learners through high-fidelity, interactive digital teaching environments. Built with ❤️ for educators.
              </p>
              <div className="mt-8 flex gap-6">
                {['🐦', '📸', '👤'].map((icon, i) => (
                  <button key={i} className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 transition-all flex items-center justify-center text-2xl hover:scale-110 active:scale-95">{icon}</button>
                ))}
              </div>
            </div>
            <div className="max-w-6xl mx-auto mt-20 pt-8 border-t border-slate-800 text-center text-xs text-slate-600 font-bold uppercase tracking-widest">
              © 2025 Teachly Interactive. All Rights Reserved.
            </div>
          </footer>
        </div>
      )}

      {currentView === 'auth' && (
        <Auth onLogin={handleLogin} initialMode={authInitialMode} onBack={() => setCurrentView('landing')} />
      )}

      {currentUser && (
        <div className="relative">
          {currentView === 'mode-selection' && (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#F0F9FF] p-6 font-['Fredoka'] relative">
              <div className="absolute top-8 right-8">
                <button onClick={handleLogout} className="bg-white hover:bg-gray-100 text-gray-600 px-6 py-3 rounded-full font-bold transition-all shadow-md border-b-4 border-gray-200 hover:scale-105 active:translate-y-1 active:border-b-0">Logout 🚪</button>
              </div>
              <div className="mb-8 flex flex-col items-center gap-4 animate-fade-in"><RainbowLogo size="text-7xl" /></div>
              <div className="text-center mb-12 animate-fade-in px-4">
                <h2 className="text-4xl font-bold text-gray-800 mb-2">Welcome back, {currentUser.username}!</h2>
                <p className="text-xl text-gray-500">Choose your magic path for today ✨</p>
              </div>
              <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
                <button onClick={() => handleModeSelect('classroom')} className="group bg-white p-10 rounded-[3rem] shadow-xl border-b-[16px] border-blue-100 hover:border-blue-400 hover:-translate-y-2 transition-all flex flex-col items-center text-center">
                  <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center text-6xl mb-6 group-hover:scale-110 transition-transform">👨‍🏫</div>
                  <h3 className="text-3xl font-bold text-blue-600 mb-4">Classroom-Mode</h3>
                </button>
                <button onClick={() => handleModeSelect('teacher')} className="group bg-white p-10 rounded-[3rem] shadow-xl border-b-[16px] border-purple-100 hover:border-purple-400 hover:-translate-y-2 transition-all flex flex-col items-center text-center">
                  <div className="w-32 h-32 bg-purple-50 rounded-full flex items-center justify-center text-6xl mb-6 group-hover:scale-110 transition-transform">🛠️</div>
                  <h3 className="text-3xl font-bold text-purple-600 mb-4">Teacher-Mode</h3>
                </button>
              </div>
            </div>
          )}
          
          {currentView === 'dashboard' && appMode && (
            <Dashboard 
              user={currentUser} 
              appMode={appMode} 
              allSubjects={allSubjects} 
              onModeChange={setAppMode} 
              onLogout={handleLogout} 
              onBackToMode={handleBackToModeSelect} 
              onNavigateDesigner={() => setCurrentView('designer-select')} 
              onNavigateSubject={navigateToSubject} 
              onAddSubject={handleAddSubject} 
              onEditSubject={handleEditSubject} 
              onDeleteSubject={handleDeleteSubject} 
              onUpdateMaterials={handleUpdateMaterials}
              onUpdateSongs={handleUpdateSongs}
              onUpdateGames={handleUpdateGames}
              onUpdateCalendarData={handleUpdateCalendarData}
            />
          )}
          
          {currentView === 'designer-select' && (
            <div className="p-8 max-w-4xl mx-auto text-center font-['Fredoka']">
              <h2 className="text-4xl font-bold text-gray-800 mb-12 mt-12">Which classroom would you like to decorate? 🎨</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {allSubjects.map(s => (
                  <button key={s.id} onClick={() => startDesigning(s.id)} className={`${s.color} p-10 rounded-[2.5rem] shadow-lg text-white font-bold text-2xl hover:scale-105 transition-transform border-b-8 border-black/10`}>{s.title}</button>
                ))}
              </div>
              <button onClick={() => setCurrentView('dashboard')} className="mt-16 text-gray-500 font-bold text-xl hover:text-blue-500 transition-colors">← Back to Dashboard</button>
            </div>
          )}
          
          {currentView === 'designer' && designingSubjectId && (
            <ClassroomDesigner subjectTitle={allSubjects.find(s => s.id === designingSubjectId)?.title || ''} design={currentUser.classroomDesigns[designingSubjectId]} onSave={(design) => { updateClassroom(designingSubjectId, design); setCurrentView('dashboard'); }} onCancel={() => setCurrentView('dashboard')} />
          )}
          
          {currentView === 'classroom' && selectedSubject && (
            <ClassroomView subject={selectedSubject} design={currentUser.classroomDesigns[selectedSubject.id]} onBack={() => setCurrentView('dashboard')} onSelectConcept={navigateToConcept} />
          )}
          
          {currentView === 'concept' && selectedConcept && selectedSubject && (
            <ConceptDashboard 
              concept={selectedConcept} 
              design={currentUser.classroomDesigns[selectedSubject.id]} 
              subjectId={selectedSubject.id} 
              materials={currentUser.materials || []} 
              allSubjects={allSubjects} 
              onBack={() => {
                if (appMode === 'teacher') {
                  setCurrentView('dashboard');
                } else {
                  setCurrentView('classroom');
                }
              }} 
              onSaveDesign={(newDesign) => updateClassroom(selectedSubject.id, newDesign)} 
              onSelectConcept={(c) => setSelectedConcept(c)}
              userSongs={currentUser.songs || []}
              mode={appMode!}
            />
          )}
        </div>
      )}

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-20px) rotate(5deg); } }
        @keyframes float-slow { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-30px) rotate(-5deg); } }
        @keyframes fade-in-up { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes bounce-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 9s ease-in-out infinite; }
        .animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-bounce-gentle { animation: bounce-gentle 2.5s ease-in-out infinite; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
