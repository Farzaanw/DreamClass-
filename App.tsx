
import React, { useState, useEffect, useMemo } from 'react';
import { User, SubjectId, Concept, Subject, ClassroomDesign, AppMode } from './types';
import { SUBJECTS, WALL_COLORS, FLOOR_COLORS } from './constants';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ClassroomView from './components/ClassroomView';
import ConceptDashboard from './components/ConceptDashboard';
import ClassroomDesigner from './components/ClassroomDesigner';

type View = 'landing' | 'auth' | 'mode-selection' | 'dashboard' | 'designer-select' | 'designer' | 'classroom' | 'concept';

const RainbowLogo: React.FC<{ size?: string }> = ({ size = "text-4xl" }) => {
  const letters = "DreamClass".split("");
  const colors = [
    "text-blue-500", "text-green-500", "text-yellow-500", "text-orange-500", "text-red-500",
    "text-purple-500", "text-indigo-500", "text-pink-500", "text-teal-500", "text-cyan-500"
  ];
  return (
    <h1 className={`${size} font-bold tracking-tight flex items-center gap-0.5 drop-shadow-md select-none whitespace-nowrap`}>
      {letters.map((l, i) => (
        <span key={i} className={colors[i % colors.length]}>{l}</span>
      ))}
    </h1>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('landing');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');
  const [appMode, setAppMode] = useState<AppMode | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [designingSubjectId, setDesigningSubjectId] = useState<SubjectId | null>(null);

  // Derived subject list - Single source of truth
  const allSubjects = useMemo(() => {
    if (!currentUser) return SUBJECTS;
    const custom = currentUser.customSubjects || [];
    const hidden = currentUser.hiddenSubjectIds || [];
    
    const subjectMap = new Map<string, Subject>();
    // Start with default subjects
    SUBJECTS.forEach(s => subjectMap.set(s.id, s));
    // Override or add with custom subjects
    custom.forEach(s => subjectMap.set(s.id, s));
    
    // Filter out hidden ones
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
    setCurrentUser(updatedUser);
    localStorage.setItem('dreamclass_user', JSON.stringify(updatedUser));

    const accountsData = localStorage.getItem('dreamclass_accounts');
    if (accountsData) {
      const accounts: User[] = JSON.parse(accountsData);
      const updatedAccounts = accounts.map(acc => 
        acc.id === updatedUser.id ? updatedUser : acc
      );
      localStorage.setItem('dreamclass_accounts', JSON.stringify(updatedAccounts));
    }
  };

  const updateClassroom = (subjectId: SubjectId, design: ClassroomDesign) => {
    if (!currentUser) return;
    const updatedUser = { 
      ...currentUser, 
      classroomDesigns: {
        ...currentUser.classroomDesigns,
        [subjectId]: design
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
          ambientMusic: 'none'
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
    
    // Explicitly update hidden list and remove from custom list
    const updatedHidden = Array.from(new Set([...(currentUser.hiddenSubjectIds || []), subjectId]));
    const updatedCustomSubjects = (currentUser.customSubjects || []).filter(s => s.id !== subjectId);
    
    const updatedDesigns = { ...currentUser.classroomDesigns };
    delete updatedDesigns[subjectId];

    persistUser({
      ...currentUser,
      customSubjects: updatedCustomSubjects,
      hiddenSubjectIds: updatedHidden,
      classroomDesigns: updatedDesigns
    });
  };

  const navigateToSubject = (subjectId: SubjectId) => {
    const subject = allSubjects.find(s => s.id === subjectId) || null;
    setSelectedSubject(subject);
    setCurrentView('classroom');
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
      const offset = 80; // Account for sticky header
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

  const customizationCards = [
    { color: 'bg-yellow-100', emoji: '🍎', text: 'Preschool Phonics' },
    { color: 'bg-green-100', emoji: '🦖', text: 'Dino Science' },
    { color: 'bg-rose-100', emoji: '💖', text: 'Social-Emotional Room' },
    { color: 'bg-blue-100', emoji: '🚀', text: 'Space Explorers' },
    { color: 'bg-orange-100', emoji: '➕', text: 'Magic Math' },
    { color: 'bg-purple-100', emoji: '🎭', text: 'Creative Arts' },
    { color: 'bg-teal-100', emoji: '🌿', text: 'Nature Studies' },
    { color: 'bg-indigo-100', emoji: '🔭', text: 'Night Sky Lab' }
  ];

  return (
    <div className="min-h-screen bg-[#F0F9FF] font-['Fredoka'] selection:bg-blue-100 selection:text-blue-900">
      {currentView === 'landing' && (
        <div className="flex flex-col">
          {/* Main Navigation Header */}
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
                <button onClick={() => scrollToSection('custom-section')} className="text-gray-500 font-bold hover:text-blue-500 transition-colors text-sm uppercase tracking-wider">Customization</button>
              </nav>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4">
              <button onClick={() => goToAuth('login')} className="text-blue-600 px-4 sm:px-6 py-2 rounded-full font-bold transition-all hover:bg-blue-50 text-sm sm:text-base">Log In</button>
              <button onClick={() => goToAuth('signup')} className="bg-blue-500 text-white px-5 sm:px-8 py-2 rounded-full font-bold transition-all shadow-md border-b-4 border-blue-700 hover:bg-blue-600 active:translate-y-1 active:border-b-0 text-sm sm:text-base">Sign Up</button>
            </div>
          </header>

          {/* Hero Section */}
          <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden pt-20">
            <div className="absolute inset-0 pointer-events-none select-none">
              <span className="absolute top-[15%] left-[10%] text-4xl sm:text-6xl animate-float opacity-20">✏️</span>
              <span className="absolute top-[25%] right-[15%] text-5xl sm:text-7xl animate-float-slow opacity-20">📚</span>
              <span className="absolute bottom-[20%] left-[20%] text-6xl sm:text-8xl animate-float-slow opacity-20" style={{ animationDelay: '1s' }}>🎨</span>
              <span className="absolute bottom-[15%] right-[10%] text-4xl sm:text-6xl animate-float opacity-20" style={{ animationDelay: '0.5s' }}>🔬</span>
            </div>

            <div className="text-center z-10 animate-fade-in-up px-4">
              <div className="mb-4 sm:mb-6 flex justify-center">
                <div className="w-20 h-20 sm:w-28 sm:h-28 bg-yellow-400 rounded-[1.5rem] sm:rounded-[2.5rem] flex items-center justify-center shadow-2xl border-b-8 border-yellow-600 animate-bounce-gentle">
                  <span className="text-4xl sm:text-6xl">🎒</span>
                </div>
              </div>
              <RainbowLogo size="text-5xl sm:text-7xl lg:text-8xl" />
              <p className="mt-4 sm:mt-6 text-lg sm:text-2xl font-medium text-gray-500 italic">For teachers, made by teachers <span className="text-rose-500 not-italic">❤️</span></p>
              <div className="mt-8 sm:mt-12 flex flex-col items-center gap-6">
                <button onClick={() => goToAuth('signup')} className="bg-blue-500 text-white px-8 sm:px-12 py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] text-xl sm:text-2xl font-bold transition-all shadow-2xl border-b-8 border-blue-700 hover:scale-105 active:translate-y-2 active:border-b-0">Get Started ✨</button>
                <div className="animate-bounce mt-4 sm:mt-8"><span className="text-gray-300 text-3xl sm:text-4xl">↓</span></div>
              </div>
            </div>
          </div>

          {/* Section 1: Features (Adventure) */}
          <section id="features-section" className="py-16 sm:py-24 px-6 bg-white flex flex-col items-center text-center">
            <div className="max-w-4xl">
              <h2 className="text-3xl sm:text-5xl font-bold text-gray-800 mb-6 sm:mb-8 tracking-tight">Turning Every Lesson Into an Adventure 🚀</h2>
              <p className="text-base sm:text-xl text-gray-500 leading-relaxed mb-8 sm:mb-12">DreamClass is the first interactive teaching platform designed specifically for the unique energy of the elementary classroom. We bridge the gap between traditional instruction and immersive digital play, helping teachers build <b>Magic Rooms</b> that breathe life into Phonics, Math, Science, and beyond.</p>
              <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
                <div className="p-6 sm:p-8 bg-blue-50 rounded-[2rem] sm:rounded-[3rem] border-b-8 border-blue-100">
                  <div className="text-4xl sm:text-5xl mb-4">🧠</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-blue-600 mb-2">Engage</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">Visual, auditory, and kinesthetic learning combined.</p>
                </div>
                <div className="p-8 bg-purple-50 rounded-[2rem] sm:rounded-[3rem] border-b-8 border-purple-100">
                  <div className="text-5xl mb-4">🛠️</div>
                  <h3 className="text-2xl font-bold text-purple-600 mb-2">Customize</h3>
                  <p className="text-gray-600 text-sm">Every classroom is as unique as your teaching style.</p>
                </div>
                <div className="p-8 bg-green-50 rounded-[2rem] sm:rounded-[3rem] border-b-8 border-green-100">
                  <div className="text-5xl mb-4">✨</div>
                  <h3 className="text-2xl font-bold text-green-600 mb-2">Empower</h3>
                  <p className="text-gray-600 text-sm">AI-assisted pedagogy to save hours of lesson planning.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: How It Works (Modes) */}
          <section id="how-it-works-section" className="py-16 sm:py-24 px-6 bg-[#F8FAFC]">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-12 sm:mb-16 px-4">Designed for Teachers, Loved by Students</h2>
              
              <div id="classroom-mode" className="grid lg:grid-cols-2 gap-12 sm:gap-16 items-center mb-16 sm:mb-24">
                <div className="px-4">
                  <span className="text-blue-500 font-bold uppercase tracking-widest text-xs sm:text-sm">Classroom Mode</span>
                  <h3 className="text-3xl sm:text-4xl font-bold text-gray-800 mt-2 mb-4 sm:mb-6">Real-Time Interaction</h3>
                  <p className="text-base sm:text-lg text-gray-500 mb-6 sm:mb-8">Step into an immersive 3D environment where learning happens through discovery. Use the multi-modal whiteboard to interact with the AI assistant who knows exactly what you're teaching.</p>
                  <ul className="space-y-3 sm:space-y-4">
                    <li className="flex items-center gap-3 font-medium text-gray-700 text-sm sm:text-base"><span className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">✓</span> Interactive Whiteboard Tools</li>
                    <li className="flex items-center gap-3 font-medium text-gray-700 text-sm sm:text-base"><span className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">✓</span> Voice-Activated AI Assistant</li>
                    <li className="flex items-center gap-3 font-medium text-gray-700 text-sm sm:text-base"><span className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">✓</span> Subject-Specific Learning Environments</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-[2rem] sm:rounded-[4rem] shadow-2xl border-8 border-blue-50">
                   <div className="aspect-video bg-blue-400 rounded-[1.5rem] sm:rounded-[3rem] flex items-center justify-center text-white overflow-hidden relative">
                      <div className="z-10 text-center px-4">
                         <div className="text-5xl sm:text-8xl mb-2 sm:mb-4">👨‍🏫</div>
                         <div className="font-bold text-lg sm:text-2xl uppercase tracking-widest">Interactive Lab</div>
                      </div>
                   </div>
                </div>
              </div>

              <div id="teacher-mode" className="grid lg:grid-cols-2 gap-12 sm:gap-16 items-center">
                <div className="bg-white p-4 rounded-[2rem] sm:rounded-[4rem] shadow-2xl border-8 border-purple-50">
                   <div className="aspect-video bg-purple-400 rounded-[1.5rem] sm:rounded-[3rem] flex items-center justify-center text-white overflow-hidden relative">
                      <div className="z-10 flex gap-2 sm:gap-4">
                         <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl">🐱</div>
                         <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl">🌈</div>
                         <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl">🎵</div>
                      </div>
                   </div>
                </div>
                <div className="px-4">
                  <span className="text-purple-500 font-bold uppercase tracking-widest text-xs sm:text-sm">Teacher Mode</span>
                  <h3 className="text-3xl sm:text-4xl font-bold text-gray-800 mt-2 mb-4 sm:mb-6">Total Creative Control</h3>
                  <p className="text-base sm:text-lg text-gray-500 mb-6 sm:mb-8">Become the architect of your own school. Choose colors, mascots, music, and interact with the classroom items to build unforgettable experiences.</p>
                  <ul className="space-y-3 sm:space-y-4">
                    <li className="flex items-center gap-3 font-medium text-gray-700 text-sm sm:text-base"><span className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-500">✓</span> 100+ Room Customization Options</li>
                    <li className="flex items-center gap-3 font-medium text-gray-700 text-sm sm:text-base"><span className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-500">✓</span> Custom Subject Creator</li>
                    <li className="flex items-center gap-3 font-medium text-gray-700 text-sm sm:text-base"><span className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-500">✓</span> Library of Educational Music</li>
                    <li className="flex items-center gap-3 font-medium text-gray-700 text-sm sm:text-base"><span className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-500">✓</span> Classroom building and interactive dashboard editing</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: AI & Tools */}
          <section id="ai-section" className="py-16 sm:py-24 px-6 bg-white overflow-hidden">
            <div className="max-w-6xl mx-auto flex flex-col items-center">
              <div className="text-center mb-12 sm:mb-16 px-4">
                <span className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full font-bold uppercase tracking-widest text-xs mb-4 inline-block">The Future of Education</span>
                <h2 className="text-3xl sm:text-5xl font-bold text-gray-800 tracking-tight">Meet Your AI Teaching Assistant 🤖</h2>
                <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-gray-500 max-w-3xl mx-auto">DreamClass integrates cutting-edge AI to act as a co-teacher, helping you create engaging environments and activities that adapt to your students' needs in real-time.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 sm:gap-8 w-full px-4">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 sm:p-10 rounded-[2rem] sm:rounded-[4rem] border-2 border-indigo-100 shadow-sm transition-transform hover:scale-[1.02]">
                  <h4 className="text-xl sm:text-2xl font-bold text-indigo-700 mb-4 flex items-center gap-3"><span className="text-3xl">🎲</span> Instant Activity Lab</h4>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">Stuck for ideas? Our AI analyzes the objects on your board and suggests 3 interactive games tailored to your current concept. Whether it's "Emoji Math Tag" or "Phoneme Scavenger Hunt," you're never more than a click away from fun.</p>
                </div>
                <div className="bg-gradient-to-br from-teal-50 to-green-50 p-6 sm:p-10 rounded-[2rem] sm:rounded-[4rem] border-2 border-teal-100 shadow-sm transition-transform hover:scale-[1.02]">
                  <h4 className="text-xl sm:text-2xl font-bold text-teal-700 mb-4 flex items-center gap-3"><span className="text-3xl">🧩</span> Dynamic Scaffolding</h4>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">Our AI monitors classroom interaction to provide real-time hints and positive reinforcement. If students struggle with a concept, the AI offers a simpler analogy or visual aid to bridge the gap without teacher intervention.</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 sm:p-10 rounded-[2rem] sm:rounded-[4rem] border-2 border-purple-100 shadow-sm transition-transform hover:scale-[1.02]">
                  <h4 className="text-xl sm:text-2xl font-bold text-purple-700 mb-4 flex items-center gap-3"><span className="text-3xl">✍️</span> Content Co-Pilot</h4>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">Creating custom subjects is easier than ever. Simply name your topic, and the AI suggests a full curriculum of concepts, icons, and descriptions that align with elementary standards while staying fun and accessible.</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 sm:p-10 rounded-[2rem] sm:rounded-[4rem] border-2 border-orange-100 shadow-sm transition-transform hover:scale-[1.02]">
                  <h4 className="text-xl sm:text-2xl font-bold text-orange-700 mb-4 flex items-center gap-3"><span className="text-3xl">🎙️</span> Voice Command Lab</h4>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">Experience truly hands-free teaching. Use voice commands to add items to the board, change room settings, or ask the AI to explain a complex topic using a "5-year-old friendly" analogy. Perfect for group discussions!</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Customization */}
          <section id="custom-section" className="py-16 sm:py-24 px-6 bg-[#F8FAFC] text-center overflow-hidden border-b border-gray-100">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">Endless Customization 🎨</h2>
            <p className="text-gray-500 text-lg sm:text-xl mb-12 sm:mb-16">See how other teachers are building their magic rooms.</p>
            <div className="flex gap-8 animate-scroll whitespace-nowrap">
               {[...customizationCards, ...customizationCards].map((card, i) => (
                 <div key={i} className={`${card.color} inline-flex flex-col items-center justify-center w-64 h-80 sm:w-80 sm:h-96 rounded-[2rem] sm:rounded-[3.5rem] p-6 sm:p-10 shadow-lg border-b-8 border-black/5 transform hover:-translate-y-4 transition-transform`}>
                    <div className="text-6xl sm:text-8xl mb-4">{card.emoji}</div>
                    <div className="font-bold text-lg sm:text-2xl text-black/60 whitespace-normal">{card.text}</div>
                 </div>
               ))}
            </div>
          </section>

          {/* Quote Section (Ambrose Commissariat) */}
          <section className="py-16 sm:py-24 px-6 bg-blue-600 text-white text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-5xl font-bold mb-6 sm:mb-8">Foster Engagement Every Day</h2>
              <p className="text-lg sm:text-2xl text-blue-100 leading-relaxed mb-8 sm:mb-12 italic">"Since using DreamClass, my students don't just sit and watch—they interact. The AI Assistant scaffolds their learning in real-time, providing immediate feedback that keeps their confidence high and their curiosity peaked."</p>
              <div className="font-bold text-base sm:text-xl uppercase tracking-widest">— Ambrose Commissariat, Preschool Teacher @ Gems Academy</div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-gray-900 text-gray-400 py-12 sm:py-16 px-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="col-span-2">
                <RainbowLogo size="text-3xl sm:text-4xl" />
                <p className="mt-4 max-w-sm text-sm sm:text-base">The magic lab for elementary learning. Designed to make teaching easier and learning unforgettable.</p>
                {/* Contact Emojis */}
                <div className="flex gap-4 mt-6 text-2xl sm:text-3xl">
                  <button onClick={() => alert('Contact: support@dreamclass.edu')} className="hover:scale-125 transition-transform" title="Email Support">📧</button>
                  <button onClick={() => alert('Visit our Twitter/X')} className="hover:scale-125 transition-transform" title="Twitter">🐦</button>
                  <button onClick={() => alert('Chat with us!')} className="hover:scale-125 transition-transform" title="Live Chat">💬</button>
                </div>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4 sm:mb-6 uppercase tracking-widest text-xs sm:text-sm">Platform</h4>
                <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base">
                  <li onClick={() => scrollToSection('features-section')} className="hover:text-white cursor-pointer transition-colors">Features</li>
                  <li onClick={() => scrollToSection('how-it-works-section')} className="hover:text-white cursor-pointer transition-colors">How it Works</li>
                  <li onClick={() => scrollToSection('ai-section')} className="hover:text-white cursor-pointer transition-colors">AI & Tools</li>
                  <li onClick={() => scrollToSection('custom-section')} className="hover:text-white cursor-pointer transition-colors">Customize</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4 sm:mb-6 uppercase tracking-widest text-xs sm:text-sm">Company</h4>
                <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base">
                  <li className="hover:text-white cursor-pointer transition-colors">About Us</li>
                  <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
                </ul>
              </div>
            </div>
            <div className="max-w-6xl mx-auto mt-12 sm:mt-16 pt-8 border-t border-gray-800 text-center text-xs sm:text-sm font-medium">
              DreamClass © 2025 • Made with ❤️ for Teachers Everywhere
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
                  <p className="text-gray-500 text-lg leading-relaxed">Ready to teach? Jump straight into interactive lessons and games with your students.</p>
                </button>
                <button onClick={() => handleModeSelect('teacher')} className="group bg-white p-10 rounded-[3rem] shadow-xl border-b-[16px] border-purple-100 hover:border-purple-400 hover:-translate-y-2 transition-all flex flex-col items-center text-center">
                  <div className="w-32 h-32 bg-purple-50 rounded-full flex items-center justify-center text-6xl mb-6 group-hover:scale-110 transition-transform">🛠️</div>
                  <h3 className="text-3xl font-bold text-purple-600 mb-4">Teacher-Mode</h3>
                  <p className="text-gray-500 text-lg leading-relaxed">Time to build! Edit your materials, create new subjects, and design interactive activities.</p>
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
            <ConceptDashboard concept={selectedConcept} design={currentUser.classroomDesigns[selectedSubject.id]} onBack={() => setCurrentView('classroom')} />
          )}
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } }
        @keyframes float-slow { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-30px) rotate(-10deg); } }
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes bounce-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-scroll { animation: scroll 40s linear infinite; width: max-content; }
        .animate-bounce-gentle { animation: bounce-gentle 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default App;
