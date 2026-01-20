
import React, { useState, useEffect } from 'react';
import { User, SubjectId, Concept, Subject, ClassroomDesign, AppMode } from './types';
import { SUBJECTS, WALL_COLORS, FLOOR_COLORS } from './constants';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ClassroomView from './components/ClassroomView';
import ConceptDashboard from './components/ConceptDashboard';
import ClassroomDesigner from './components/ClassroomDesigner';

type View = 'auth' | 'mode-selection' | 'dashboard' | 'designer-select' | 'designer' | 'classroom' | 'concept';

const RainbowLogo: React.FC<{ size?: string }> = ({ size = "text-4xl" }) => {
  const letters = "DreamClass".split("");
  const colors = [
    "text-blue-500", "text-green-500", "text-yellow-500", "text-orange-500", "text-red-500",
    "text-purple-500", "text-indigo-500", "text-pink-500", "text-teal-500", "text-cyan-500"
  ];
  return (
    <h1 className={`${size} font-bold tracking-tight flex items-center gap-0.5 drop-shadow-md select-none`}>
      {letters.map((l, i) => (
        <span key={i} className={colors[i % colors.length]}>{l}</span>
      ))}
    </h1>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('auth');
  const [appMode, setAppMode] = useState<AppMode | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [designingSubjectId, setDesigningSubjectId] = useState<SubjectId | null>(null);

  // Combine fixed subjects with user-created ones
  const getAllSubjects = (): Subject[] => {
    if (!currentUser) return SUBJECTS;
    return [...SUBJECTS, ...(currentUser.customSubjects || [])];
  };

  // Load from local storage on mount
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
    setCurrentView('auth');
    localStorage.removeItem('dreamclass_user');
  };

  const persistUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('dreamclass_user', JSON.stringify(updatedUser));

    // Update persisted accounts list
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

  const handleAddSubject = (subjectData: { name: string, description: string, concepts: Concept[] }) => {
    if (!currentUser || !subjectData.name.trim()) return;

    const newId = `custom-${Date.now()}`;
    const colors = ['bg-pink-400', 'bg-orange-400', 'bg-indigo-400', 'bg-teal-400', 'bg-rose-400'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newSubject: Subject = {
      id: newId,
      title: subjectData.name,
      description: subjectData.description,
      color: randomColor,
      concepts: subjectData.concepts
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

  const handleDeleteSubject = (subjectId: SubjectId) => {
    if (!currentUser) return;
    
    // Only allow deleting custom subjects for now to protect core curricula
    const updatedCustomSubjects = (currentUser.customSubjects || []).filter(s => s.id !== subjectId);
    
    // Clean up associated classroom designs
    const updatedDesigns = { ...currentUser.classroomDesigns };
    delete updatedDesigns[subjectId];

    const updatedUser = {
      ...currentUser,
      customSubjects: updatedCustomSubjects,
      classroomDesigns: updatedDesigns
    };

    persistUser(updatedUser);
  };

  const navigateToSubject = (subjectId: SubjectId) => {
    const subject = getAllSubjects().find(s => s.id === subjectId) || null;
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

  const allSubjects = getAllSubjects();

  return (
    <div className="min-h-screen">
      {currentView === 'auth' && <Auth onLogin={handleLogin} />}
      
      {currentUser && (
        <div className="relative">
          {currentView === 'mode-selection' && (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#F0F9FF] p-6 font-['Fredoka'] relative">
              <div className="absolute top-8 right-8">
                <button 
                  onClick={handleLogout}
                  className="bg-white hover:bg-gray-100 text-gray-600 px-6 py-3 rounded-full font-bold transition-all shadow-md border-b-4 border-gray-200 hover:scale-105 active:translate-y-1 active:border-b-0"
                >
                  Logout 🚪
                </button>
              </div>

              <div className="mb-8 flex flex-col items-center gap-4 animate-fade-in">
                <div className="w-24 h-24 bg-yellow-400 rounded-[2.5rem] flex items-center justify-center shadow-2xl border-b-8 border-yellow-600">
                  <span className="text-5xl">🎒</span>
                </div>
                <RainbowLogo size="text-7xl" />
              </div>

              <div className="text-center mb-12 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <h2 className="text-4xl font-bold text-gray-800 mb-2">Welcome back, {currentUser.username}!</h2>
                <p className="text-xl text-gray-500">Choose your magic path for today ✨</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
                <button 
                  onClick={() => handleModeSelect('classroom')}
                  className="group bg-white p-10 rounded-[3rem] shadow-xl border-b-[16px] border-blue-100 hover:border-blue-400 hover:-translate-y-2 transition-all flex flex-col items-center text-center"
                >
                  <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center text-6xl mb-6 group-hover:scale-110 transition-transform">
                    👨‍🏫
                  </div>
                  <h3 className="text-3xl font-bold text-blue-600 mb-4">Classroom-Mode</h3>
                  <p className="text-gray-500 text-lg leading-relaxed">
                    Ready to teach? Jump straight into interactive lessons and games with your students.
                  </p>
                </button>

                <button 
                  onClick={() => handleModeSelect('teacher')}
                  className="group bg-white p-10 rounded-[3rem] shadow-xl border-b-[16px] border-purple-100 hover:border-purple-400 hover:-translate-y-2 transition-all flex flex-col items-center text-center"
                >
                  <div className="w-32 h-32 bg-purple-50 rounded-full flex items-center justify-center text-6xl mb-6 group-hover:scale-110 transition-transform">
                    🛠️
                  </div>
                  <h3 className="text-3xl font-bold text-purple-600 mb-4">Teacher-Mode</h3>
                  <p className="text-gray-500 text-lg leading-relaxed">
                    Time to build! Edit your materials, create new subjects, and design interactive activities.
                  </p>
                </button>
              </div>
            </div>
          )}

          {currentView === 'dashboard' && appMode && (
            <Dashboard 
              user={currentUser} 
              appMode={appMode}
              onModeChange={setAppMode}
              onLogout={handleLogout} 
              onBackToMode={handleBackToModeSelect}
              onNavigateDesigner={() => setCurrentView('designer-select')}
              onNavigateSubject={navigateToSubject}
              onAddSubject={handleAddSubject}
              onDeleteSubject={handleDeleteSubject}
            />
          )}

          {currentView === 'designer-select' && (
            <div className="p-8 max-w-4xl mx-auto text-center font-['Fredoka']">
              <h2 className="text-4xl font-bold text-gray-800 mb-12 mt-12">Which classroom would you like to decorate? 🎨</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {allSubjects.map(s => (
                  <button
                    key={s.id}
                    onClick={() => startDesigning(s.id)}
                    className={`${s.color} p-10 rounded-[2.5rem] shadow-lg text-white font-bold text-2xl hover:scale-105 transition-transform border-b-8 border-black/10`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setCurrentView('dashboard')}
                className="mt-16 text-gray-500 font-bold text-xl hover:text-blue-500 transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>
          )}

          {currentView === 'designer' && designingSubjectId && (
            <ClassroomDesigner 
              subjectTitle={allSubjects.find(s => s.id === designingSubjectId)?.title || ''}
              design={currentUser.classroomDesigns[designingSubjectId]} 
              onSave={(design) => {
                updateClassroom(designingSubjectId, design);
                setCurrentView('dashboard');
              }}
              onCancel={() => setCurrentView('dashboard')}
            />
          )}

          {currentView === 'classroom' && selectedSubject && (
            <ClassroomView 
              subject={selectedSubject} 
              design={currentUser.classroomDesigns[selectedSubject.id]}
              onBack={() => setCurrentView('dashboard')}
              onSelectConcept={navigateToConcept}
            />
          )}

          {currentView === 'concept' && selectedConcept && selectedSubject && (
            <ConceptDashboard 
              concept={selectedConcept}
              design={currentUser.classroomDesigns[selectedSubject.id]}
              onBack={() => setCurrentView('classroom')}
            />
          )}
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;
