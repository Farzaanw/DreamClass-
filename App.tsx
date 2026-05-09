
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pencil, Star, Dog } from 'lucide-react';
import { User, SubjectId, Concept, Subject, ClassroomDesign, AppMode, MaterialFile, Song, Game, Whiteboard } from './types';
import { SUBJECTS, WALL_COLORS, FLOOR_COLORS } from './constants';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ClassroomView from './components/ClassroomView';
import ConceptDashboard from './components/ConceptDashboard';
import ClassroomDesigner from './components/ClassroomDesigner';
import PublicLibrary, { Resource } from './components/PublicLibrary';
import { supabase } from './lib/supabase';

type View = 'landing' | 'auth' | 'mode-selection' | 'dashboard' | 'designer-select' | 'designer' | 'classroom' | 'concept' | 'public-library';

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

const CursorTrail: React.FC<{ x: number, y: number, type: string, color: string }> = ({ x, y, type, color }) => {
  const [particles, setParticles] = useState<any[]>([]);
  const lastPos = useRef({ x, y });

  useEffect(() => {
    if (type === 'none') {
      setParticles([]);
      return;
    }

    const dist = Math.hypot(x - lastPos.current.x, y - lastPos.current.y);
    if (dist > 10) {
      const newParticle = {
        id: Math.random(),
        x,
        y,
        size: Math.random() * 10 + 10,
        rotation: Math.random() * 360,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40,
      };
      setParticles(prev => [...prev.slice(-15), newParticle]);
      lastPos.current = { x, y };
    }
  }, [x, y, type]);

  const removeParticle = (id: number) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  };

  const getParticleContent = (p: any) => {
    switch (type) {
      case 'rainbow':
        const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#8b00ff'];
        return <div className="rounded-full" style={{ width: p.size, height: p.size, backgroundColor: colors[Math.floor(p.id * colors.length) % colors.length] }} />;
      case 'sparkle':
        return <span className="text-yellow-400" style={{ fontSize: p.size }}>✨</span>;
      case 'bubble':
        return <div className="rounded-full border-2 border-blue-300 bg-blue-100/30" style={{ width: p.size, height: p.size }} />;
      case 'flower':
        return <span style={{ fontSize: p.size }}>🌸</span>;
      case 'rocket':
        return <span style={{ fontSize: p.size, transform: `rotate(${p.rotation}deg)` }}>🚀</span>;
      case 'music':
        return <span className="text-purple-500" style={{ fontSize: p.size }}>🎵</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ 
              x: p.x, 
              y: p.y, 
              opacity: 1, 
              scale: 0.5,
              rotate: p.rotation 
            }}
            animate={{ 
              x: p.x + p.vx, 
              y: type === 'music' || type === 'bubble' ? p.y - 100 : p.y + p.vy,
              opacity: 0,
              scale: 1.5,
              rotate: p.rotation + 90
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.8, 
              ease: "easeOut" 
            }}
            onAnimationComplete={() => removeParticle(p.id)}
            className="absolute"
            style={{
              left: 0,
              top: 0,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {getParticleContent(p)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const CursorFollower: React.FC<{ style: any }> = ({ style }) => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);
    };
    const handleMouseLeave = () => setVisible(false);
    const handleMouseEnter = () => setVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [visible]);

  const getColor = () => {
    switch (style.color) {
      case 'red': return '#ef4444';
      case 'blue': return '#3b82f6';
      case 'green': return '#22c55e';
      case 'purple': return '#a855f7';
      default: return '#000000';
    }
  };

  const getSize = () => {
    switch (style.size) {
      case 'large': return 48;
      case 'extra-large': return 72;
      default: return 24;
    }
  };

  const getIcon = () => {
    const size = getSize();
    const color = getColor();
    
    if (style.style === 'crosshair') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <line x1="12" y1="2" x2="12" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
    }
    
    if (style.style === 'pencil') {
      return <Pencil size={size} color={color} fill={color} strokeWidth={2.5} />;
    }

    if (style.style === 'star') {
      return <Star size={size} fill={color} color={color} />;
    }

    // Default Arrow
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="white" strokeWidth="1">
        <path d="M7 2l12 11.2-5.8.8 3.3 7.3-2.2 1-3.2-7.4L7 19V2z" />
      </svg>
    );
  };

  const getOffset = () => {
    if (style.style === 'crosshair') return `translate(-50%, -50%)`;
    if (style.style === 'star') return `translate(-50%, -50%)`;
    if (style.style === 'pencil') return `translate(0, -100%)`; // Tip is at bottom-left
    // Default Arrow: Tip is at (7, 2) in a 24x24 grid
    return `translate(-29%, -8%)`; // -7/24 ≈ -29%, -2/24 ≈ -8%
  };

  if (!visible) return null;

  return (
    <>
      <CursorTrail x={pos.x} y={pos.y} type={style.trail || 'none'} color={getColor()} />
      <div 
        className={`fixed pointer-events-none z-[10000] transition-transform duration-75 ease-out ${style.animation === 'pulsing' ? 'animate-cursor-pulse' : ''} ${style.animation === 'glowing' ? 'animate-cursor-glow' : ''}`}
        style={{ 
          left: pos.x, 
          top: pos.y, 
          transform: getOffset(),
          color: getColor()
        }}
      >
        {getIcon()}
      </div>
    </>
  );
};

const DEFAULT_DESIGN: ClassroomDesign = {
  wallColor: '#fbbf24', // Warm honey
  floorColor: '#92400e', // Wood floor
  posterUrls: [],
  ambientMusic: 'none',
  whiteboards: [],
  conceptBoards: {},
  mascot: 'none',
  shelves: []
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('landing');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [appMode, setAppMode] = useState<AppMode | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [designingSubjectId, setDesigningSubjectId] = useState<SubjectId | null>(null);
  const [dashboardInitialView, setDashboardInitialView] = useState<'overview' | 'materials' | 'songs' | 'games'>('overview');
  const [dashboardInitialSubjectId, setDashboardInitialSubjectId] = useState<string | null>(null);
  const [materialsOpenedFromConcept, setMaterialsOpenedFromConcept] = useState(false);
  const [cursorStyle, setCursorStyle] = useState(() => {
    const saved = localStorage.getItem('teachly_cursor_style');
    return saved ? JSON.parse(saved) : {
      color: 'default',
      size: 'normal',
      style: 'arrow',
      animation: 'none',
      trail: 'none'
    };
  });

  useEffect(() => {
    localStorage.setItem('teachly_cursor_style', JSON.stringify(cursorStyle));
  }, [cursorStyle]);

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
    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserData(session.user.id);
      }
    });

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
        setCurrentView('auth');
      }

      if (session) {
        fetchUserData(session.user.id);
      } else {
        setCurrentUser(null);
        setCurrentView('landing');
        setRecoveryMode(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // 1. Get current session metadata as a fallback for the name
      const { data: { session } } = await supabase.auth.getSession();
      const metaName = session?.user?.user_metadata?.username || 'Teacher';
      const userEmail = session?.user?.email || '';

      // 2. Fetch profile (remove .single() to avoid 406 noise)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId);

      if (profileError) throw profileError;

      let profile = profiles && profiles.length > 0 ? profiles[0] : null;

      // 3. Self-Healing: If profile is missing, create it now
      if (!profile && session) {
        console.log('Profile missing, creating self-healing profile for:', userId);
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: metaName,
            email: userEmail,
            hidden_subject_ids: [],
            progress: {}
          })
          .select()
          .single();
        
        if (!createError) {
          profile = newProfile;
        }
      }

      // 4. Fetch subjects
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', userId);

      if (subjectsError) throw subjectsError;

      // 5. Fetch classroom designs
      const { data: designs, error: designsError } = await supabase
        .from('classroom_designs')
        .select('*')
        .eq('user_id', userId);

      if (designsError) throw designsError;

      // Map designs to the Record format
      const designMap: Record<string, ClassroomDesign> = {};
      designs?.forEach(d => {
        const designData = d.design_data || {};
        designMap[d.subject_id] = {
          ...designData,
          whiteboards: Array.isArray(designData.whiteboards) ? designData.whiteboards : [],
          conceptBoards: designData.conceptBoards || {}
        };
      });

      // 6. Fetch whiteboards
      const { data: whiteboards, error: whiteboardsError } = await supabase
        .from('whiteboards')
        .select('*')
        .eq('user_id', userId);

      if (whiteboardsError) throw whiteboardsError;

      whiteboards?.forEach(w => {
        if (designMap[w.subject_id]) {
          const board: Whiteboard = {
            ...w.data,
            id: w.id,
            conceptId: w.concept_id,
            name: w.name,
            drawingData: w.drawing_data,
            timestamp: w.timestamp
          };
          
          if (w.concept_id) {
            designMap[w.subject_id].conceptBoards![w.concept_id] = board;
          }
          designMap[w.subject_id].whiteboards!.push(board);
        }
      });

      // Always set the user, even if data is still thin
      setCurrentUser({
        id: userId,
        username: profile?.username || metaName,
        email: profile?.email || userEmail,
        customSubjects: (subjects || []).map(s => ({
          id: s.id,
          title: s.title,
          description: s.description,
          color: s.color,
          icon: s.icon,
          concepts: s.concepts
        })),
        hiddenSubjectIds: profile?.hidden_subject_ids || [],
        classroomDesigns: designMap,
        progress: profile?.progress || {},
        calendarData: profile?.calendar_data,
        materials: profile?.materials || [],
        songs: profile?.songs || [],
        games: profile?.games || []
      });
      setCurrentView('mode-selection');
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const handleLogin = (user: User) => {
    // Auth.tsx handles the Supabase login, which triggers fetchUserData
    // This local call is kept for immediate UI feedback if needed
    setCurrentUser(user);
    setCurrentView('mode-selection');
  };

  const handleModeSelect = useCallback((mode: AppMode) => {
    setAppMode(mode);
    if (mode === 'teacher') {
      setCursorStyle({
        color: 'default',
        size: 'normal',
        style: 'arrow',
        animation: 'none',
        trail: 'none'
      });
    }
    setDashboardInitialView('overview');
    setDashboardInitialSubjectId(null);
    setMaterialsOpenedFromConcept(false);
    setCurrentView('dashboard');
  }, []);

  const handleModeChange = useCallback((mode: AppMode) => {
    setAppMode(mode);
    if (mode === 'teacher') {
      setCursorStyle({
        color: 'default',
        size: 'normal',
        style: 'arrow',
        animation: 'none',
        trail: 'none'
      });
    }
  }, []);

  const handleBackToModeSelect = useCallback(() => {
    setDashboardInitialView('overview');
    setDashboardInitialSubjectId(null);
    setCurrentView('mode-selection');
  }, []);

  const handleDeleteWhiteboard = useCallback(async (boardId: string) => {
    if (!currentUser) return;

    // 1. Delete from Supabase
    const { error } = await supabase
      .from('whiteboards')
      .delete()
      .eq('id', boardId)
      .eq('user_id', currentUser.id);

    if (error) {
      console.error('Error deleting whiteboard from Supabase:', error);
      return;
    }

    // 2. Update local state
    setCurrentUser(prev => {
      if (!prev) return null;
      const newDesigns = { ...prev.classroomDesigns };
      Object.keys(newDesigns).forEach(subId => {
        const d = newDesigns[subId];
        if (d.whiteboards) {
          newDesigns[subId] = {
            ...d,
            whiteboards: d.whiteboards.filter(b => b.id !== boardId),
            conceptBoards: d.conceptBoards
              ? Object.fromEntries(
                  Object.entries(d.conceptBoards as Record<string, Whiteboard>).filter(([_, b]) => b.id !== boardId)
                )
              : d.conceptBoards
          };
        }
      });
      return { ...prev, classroomDesigns: newDesigns };
    });
  }, [currentUser]);

  const persistUser = useCallback(async (updatedUser: Partial<User>) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      return { ...prev, ...updatedUser };
    });

    if (currentUser) {
      const { error } = await supabase
        .from('profiles')
        .update({
          hidden_subject_ids: updatedUser.hiddenSubjectIds,
          progress: updatedUser.progress,
          calendar_data: updatedUser.calendarData,
        })
        .eq('id', currentUser.id);
      
      if (error) console.error('Error persisting user profile:', error);
    }
  }, [currentUser]);

  const updateClassroom = useCallback(async (subjectId: SubjectId, design: ClassroomDesign) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      return { 
        ...prev, 
        classroomDesigns: {
          ...prev.classroomDesigns,
          [subjectId]: {
            ...design,
            whiteboards: design.whiteboards || [],
            conceptBoards: design.conceptBoards || {}
          }
        } 
      };
    });

    if (currentUser) {
      // Exclude whiteboards from the design_data blob as they live in their own table
      const { whiteboards, ...designData } = design;
      
      const { error } = await supabase
        .from('classroom_designs')
        .upsert({
          user_id: currentUser.id,
          subject_id: subjectId,
          design_data: designData
        }, { onConflict: 'user_id,subject_id' });

      if (error) console.error('Error updating classroom design:', error);
    }
  }, [currentUser]);

  // persistence logic moved to individual action handlers for Supabase efficiency
  useEffect(() => {
    if (currentUser) {
      // We still sync cursor style to localStorage as it's a browser preference
      localStorage.setItem('teachly_cursor_style', JSON.stringify(cursorStyle));
    }
  }, [currentUser, cursorStyle]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setAppMode(null);
    setCurrentView('landing');
    localStorage.removeItem('dreamclass_user');
  }, []);

  const handleSaveDesign = useCallback((newDesign: ClassroomDesign) => {
    if (selectedSubject) {
      updateClassroom(selectedSubject.id, newDesign);
    }
  }, [selectedSubject, updateClassroom]);

  const handleAddSubject = useCallback(async (subjectData: { name: string, description: string, concepts: Concept[], icon: string }) => {
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

    // 1. Update local state
    const updatedUser = {
      ...currentUser,
      customSubjects: [...(currentUser.customSubjects || []), newSubject],
    };
    setCurrentUser(updatedUser);

    // 2. Push to Supabase
    const { error: subjectError } = await supabase
      .from('subjects')
      .insert({
        id: newId,
        user_id: currentUser.id,
        title: subjectData.name,
        description: subjectData.description,
        color: randomColor,
        icon: subjectData.icon,
        concepts: subjectData.concepts
      });

    if (subjectError) {
      console.error('Error adding subject to Supabase:', subjectError);
      return;
    }

    // Initialize design for this subject
    const initialDesign: ClassroomDesign = {
      wallColor: WALL_COLORS[0],
      floorColor: FLOOR_COLORS[0],
      posterUrls: [],
      ambientMusic: 'none',
      whiteboards: [],
      conceptBoards: {}
    };

    const { error: designError } = await supabase
      .from('classroom_designs')
      .insert({
        user_id: currentUser.id,
        subject_id: newId,
        design_data: {
          wallColor: WALL_COLORS[0],
          floorColor: FLOOR_COLORS[0],
          posterUrls: [],
          ambientMusic: 'none'
        }
      });

    if (designError) console.error('Error initializing subject design:', designError);
  }, [currentUser]);

  const handleEditSubject = useCallback(async (subjectId: string, updatedData: { name: string, description: string, concepts: Concept[], icon: string }) => {
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
    
    // 1. Update local state
    const otherCustom = (currentUser.customSubjects || []).filter(s => s.id !== subjectId);
    setCurrentUser({
      ...currentUser,
      customSubjects: [...otherCustom, updatedSubject]
    });

    // 2. Push to Supabase
    const { error } = await supabase
      .from('subjects')
      .update({
        title: updatedData.name,
        description: updatedData.description,
        concepts: updatedData.concepts,
        icon: updatedData.icon
      })
      .eq('id', subjectId)
      .eq('user_id', currentUser.id);

    if (error) console.error('Error updating subject in Supabase:', error);
  }, [currentUser, allSubjects]);

  const handleDeleteSubject = useCallback(async (subjectId: SubjectId) => {
    if (!currentUser) return;
    
    const updatedHidden = Array.from(new Set([...(currentUser.hiddenSubjectIds || []), subjectId]));
    const updatedCustomSubjects = (currentUser.customSubjects || []).filter(s => s.id !== subjectId);
    const updatedDesigns = { ...currentUser.classroomDesigns };
    delete updatedDesigns[subjectId];
    
    // 1. Update local state
    setCurrentUser({
      ...currentUser,
      customSubjects: updatedCustomSubjects,
      hiddenSubjectIds: updatedHidden,
      classroomDesigns: updatedDesigns
    });

    // 2. Push to Supabase
    // If it's a custom subject, we can delete it entirely
    if (subjectId.startsWith('custom-')) {
      const { error: deleteError } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId)
        .eq('user_id', currentUser.id);
      
      if (deleteError) console.error('Error deleting subject from Supabase:', deleteError);

      // Clean up whiteboards associated with this subject
      const { error: whiteboardDeleteError } = await supabase
        .from('whiteboards')
        .delete()
        .eq('subject_id', subjectId)
        .eq('user_id', currentUser.id);
      
      if (whiteboardDeleteError) console.error('Error deleting orphaned whiteboards:', whiteboardDeleteError);
    } else {
      // If it's a built-in subject, we just hide it (it stays in hidden_subject_ids)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ hidden_subject_ids: updatedHidden })
        .eq('id', currentUser.id);
      
      if (profileError) console.error('Error hiding subject in Supabase:', profileError);
    }

    // Also remove the classroom design persistence
    const { error: designError } = await supabase
      .from('classroom_designs')
      .delete()
      .eq('subject_id', subjectId)
      .eq('user_id', currentUser.id);

    if (designError) console.error('Error removing subject design persistence:', designError);
  }, [currentUser]);

  const handleUpdateMaterials = useCallback(async (materials: MaterialFile[]) => {
    if (!currentUser) return;
    
    // 1. Update local state
    setCurrentUser({
      ...currentUser,
      materials
    });

    // 2. Push to Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ materials })
      .eq('id', currentUser.id);

    if (error) console.error('Error updating materials in Supabase:', error);
  }, [currentUser]);

  const handleUpdateSongs = useCallback(async (songs: Song[]) => {
    if (!currentUser) return;
    
    // 1. Update local state
    setCurrentUser({
      ...currentUser,
      songs
    });

    // 2. Push to Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ songs })
      .eq('id', currentUser.id);

    if (error) console.error('Error updating songs in Supabase:', error);
  }, [currentUser]);

  const handleUpdateGames = useCallback(async (games: Game[]) => {
    if (!currentUser) return;
    
    // 1. Update local state
    setCurrentUser({
      ...currentUser,
      games
    });

    // 2. Push to Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ games })
      .eq('id', currentUser.id);

    if (error) console.error('Error updating games in Supabase:', error);
  }, [currentUser]);

  const handleUpdateCalendarData = useCallback(async (calendarData: any) => {
    if (!currentUser) return;
    
    // 1. Update local state
    setCurrentUser({
      ...currentUser,
      calendarData
    });

    // 2. Push to Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ calendar_data: calendarData })
      .eq('id', currentUser.id);

    if (error) console.error('Error updating calendar data in Supabase:', error);
  }, [currentUser]);

  const handleAddResourceToClassroom = useCallback((resource: Resource, subjectId: string) => {
    if (!currentUser) return;
    
    const typeMap: Record<string, 'pdf' | 'slides' | 'video'> = {
      'Lesson': 'slides',
      'Game': 'video',
      'Song': 'video',
      'Worksheet': 'pdf'
    };

    const newMaterial: MaterialFile = {
      id: `lib-${resource.id}-${Date.now()}`,
      name: resource.title,
      type: typeMap[resource.type] || 'pdf',
      subjectId: subjectId,
      timestamp: Date.now(),
      thumbnailUrl: resource.thumbnail,
      content: resource.externalUrl || '#'
    };

    const currentMaterials = currentUser.materials || [];
    persistUser({
      ...currentUser,
      materials: [...currentMaterials, newMaterial]
    });
    
    // Using a custom toast would be better, but for now we'll just log it
    console.log(`Successfully added "${resource.title}" to your classroom! 🎉`);
  }, [currentUser, persistUser]);

  const navigateToSubject = useCallback((subjectId: SubjectId) => {
    const subject = allSubjects.find(s => s.id === subjectId) || null;
    setSelectedSubject(subject);
    if (appMode === 'teacher' && subject && subject.concepts.length > 0) {
      setSelectedConcept(subject.concepts[0]);
      setCurrentView('concept');
    } else {
      setCurrentView('classroom');
    }
  }, [allSubjects, appMode]);

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
    <div className={`min-h-screen bg-[#F0F9FF] font-['Fredoka'] selection:bg-blue-100 selection:text-blue-900 ${currentUser && (cursorStyle.style !== 'arrow' || cursorStyle.color !== 'default' || cursorStyle.size !== 'normal' || cursorStyle.animation !== 'none') ? 'custom-cursor-active' : ''}`}>
      {/* Custom Cursor Element */}
      {currentUser && (cursorStyle.style !== 'arrow' || cursorStyle.color !== 'default' || cursorStyle.size !== 'normal' || cursorStyle.animation !== 'none') && (
        <CursorFollower style={cursorStyle} />
      )}
      {/* Visual Mode Overlay: Teacher (Blue Tint) vs Classroom (Clear) */}
      {currentUser && appMode && (
        <div 
          className={`pointer-events-none fixed inset-0 z-[9999] transition-colors duration-700 ${
            appMode === 'teacher' ? 'bg-blue-500/15' : 'bg-transparent'
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
                <button onClick={() => setCurrentView('public-library')} className="text-blue-500 font-black hover:text-blue-600 transition-colors text-sm uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  Public Library
                </button>
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
                For teachers, designed by teachers ❤️
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
          <section id="features-section" className="py-32 bg-white relative overflow-hidden">
            <style>{`
              @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee {
                animation: marquee 40s linear infinite;
              }
              .animate-marquee:hover {
                animation-play-state: paused;
              }
            `}</style>
            <div className="max-w-6xl mx-auto px-6 sm:px-12 mb-20 text-center">
              <h2 className="text-4xl sm:text-6xl font-bold text-slate-800 mb-6 tracking-tight">Everything a Magic Classroom Needs</h2>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto">Teachly is more than just a whiteboard for teachers. It's a space that encourages engagement and fosters classroom collaboration.</p>
            </div>
            
            <div className="relative w-full flex overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
              
              <div className="flex w-max animate-marquee gap-8 px-4 py-8">
                {[
                  ...[
                    { icon: '🎨', title: 'Classroom Designer', desc: 'Pick your wall colors, carpet textures, and even class pets to design your ideal classroom environment.', color: 'bg-orange-100 text-orange-600' },
                    { icon: '🪄', title: 'Magic Whiteboard', desc: 'Drag assets, draw with glow-markers, and manage multiple saved lesson states with the interactive board.', color: 'bg-blue-100 text-blue-600' },
                    { icon: '🎵', title: 'Classroom Jams', desc: 'Set the mood with ambient music and interactive sing-along lyrics to keep the energy high and fun.', color: 'bg-pink-100 text-pink-600' },
                    { icon: '📦', title: 'Magic Asset Drawer', desc: 'An infinite supply of letters, numbers, and more. Simply drag them onto the board for instant, interactive learning.', color: 'bg-green-100 text-green-600' },
                    { icon: '🎮', title: 'Game Zone', desc: 'Browse a curated library of online, educational games designed to make learning an engaging adventure.', color: 'bg-purple-100 text-purple-600' },
                    { icon: '📚', title: 'Public Library', desc: 'Share your lesson plans or use ones created by other teachers to enhance your curriculum.', color: 'bg-amber-100 text-amber-600' },
                    { icon: '🏆', title: 'Reward Badges', desc: 'Motivate students by easily handing out fun, animated badges for their achievements and participation.', color: 'bg-yellow-100 text-yellow-600' },
                    { icon: '⏰', title: 'Fun Timers', desc: 'Keep activities on track with visual, playful countdown timers featuring rockets and floating balloons.', color: 'bg-red-100 text-red-600' }
                  ],
                  ...[
                    { icon: '🎨', title: 'Classroom Designer', desc: 'Pick your wall colors, carpet textures, and even class pets to design your ideal classroom environment.', color: 'bg-orange-100 text-orange-600' },
                    { icon: '🪄', title: 'Magic Whiteboard', desc: 'Drag assets, draw with glow-markers, and manage multiple saved lesson states with the interactive board.', color: 'bg-blue-100 text-blue-600' },
                    { icon: '🎵', title: 'Classroom Jams', desc: 'Set the mood with ambient music and interactive sing-along lyrics to keep the energy high and fun.', color: 'bg-pink-100 text-pink-600' },
                    { icon: '📦', title: 'Magic Asset Drawer', desc: 'An infinite supply of letters, numbers, and more. Simply drag them onto the board for instant, interactive learning.', color: 'bg-green-100 text-green-600' },
                    { icon: '🎮', title: 'Game Zone', desc: 'Browse a curated library of online, educational games designed to make learning an engaging adventure.', color: 'bg-purple-100 text-purple-600' },
                    { icon: '📚', title: 'Public Library', desc: 'Share your lesson plans or use ones created by other teachers to enhance your curriculum.', color: 'bg-amber-100 text-amber-600' },
                    { icon: '🏆', title: 'Reward Badges', desc: 'Motivate students by easily handing out fun, animated badges for their achievements and participation.', color: 'bg-yellow-100 text-yellow-600' },
                    { icon: '⏰', title: 'Fun Timers', desc: 'Keep activities on track with visual, playful countdown timers featuring rockets and floating balloons.', color: 'bg-red-100 text-red-600' }
                  ]
                ].map((feature, index) => (
                  <div key={index} className="w-[350px] flex-shrink-0 [&>div]:h-full">
                    <FeatureCard icon={feature.icon} title={feature.title} desc={feature.desc} color={feature.color} />
                  </div>
                ))}
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
                  desc="Play and learn! Switch to the immersive full-screen, whiteboard view where students interact with your lessons." 
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
              <div className="relative w-full flex overflow-hidden group">
                <style>{`
                  .animate-marquee-customization {
                    animation: marquee 30s linear infinite;
                  }
                  .animate-marquee-customization:hover {
                    animation-play-state: paused;
                  }
                `}</style>
                <div className="absolute left-0 top-0 bottom-12 w-16 sm:w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-12 w-16 sm:w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>
                
                <div className="flex w-max animate-marquee-customization gap-8 pb-12 pt-4 px-4">
                  {[...Array(2)].map((_, i) => (
                    <React.Fragment key={i}>
                      <ExampleCard emoji="🍪" title="Counting Cookies" color="bg-orange-100" />
                      <ExampleCard emoji="🦁" title="Phonics Jungle" color="bg-green-100" />
                      <ExampleCard emoji="🚀" title="Space Math Hub" color="bg-blue-100" />
                      <ExampleCard emoji="🌋" title="Lava Science" color="bg-red-100" />
                      <ExampleCard emoji="🏰" title="Medieval Phonics" color="bg-indigo-100" />
                      <ExampleCard emoji="🌊" title="Ocean Explorers" color="bg-cyan-100" />
                      <ExampleCard emoji="🧪" title="Chemistry Kids" color="bg-purple-100" />
                      <ExampleCard emoji="🦖" title="Dino History" color="bg-amber-100" />
                      <ExampleCard emoji="🌻" title="Botany Gardens" color="bg-emerald-100" />
                    </React.Fragment>
                  ))}
                </div>
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
          <section id="custom-section" className="py-24 px-6 sm:px-12 bg-blue-500 relative">
            <div className="max-w-4xl mx-auto text-center">
              <span className="text-white/60 font-bold uppercase tracking-widest text-sm mb-6 block">The Teacher's Heart</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-10 leading-tight">
                "Every child deserves a classroom that feels as magical as their imagination. Teachly helps teachers build that world."
              </h2>
              <div className="flex items-center justify-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full border-2 border-white/30 flex items-center justify-center text-2xl overflow-hidden">🍎</div>
                <div className="text-left">
                  <span className="text-white font-bold block text-lg">Ambrose Commisariat</span>
                  <span className="text-white/60 font-medium">Preschool Teacher for Gems Academy</span>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-slate-900 text-slate-300 py-10 px-6 sm:px-12 border-t border-slate-800">
            {/* <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
              <RainbowLogo size="text-3xl" />
              <p className="mt-6 text-slate-500 max-w-xl">
                Empowering the next generation of learners through high-fidelity, interactive digital teaching environments. Built with ❤️ for educators.
              </p>
            </div> */}
            <div className="mt-8 flex gap-6 justify-center">
                {['🐦', '📸', '👤'].map((icon, i) => (
                  <button key={i} className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 transition-all flex items-center justify-center text-2xl hover:scale-110 active:scale-95">{icon}</button>
                ))}
            </div>
            <div className="max-w-6xl mx-auto mt-10 pt-8 border-t border-slate-800 text-center text-xs text-slate-600 font-bold uppercase tracking-widest">
              © 2025 Teachly Interactive. All Rights Reserved.
            </div>
          </footer>
        </div>
      )}

      {currentView === 'auth' && (
        <Auth 
          onLogin={handleLogin} 
          initialMode={authInitialMode} 
          isRecovering={recoveryMode}
          onPasswordUpdated={() => {
            setRecoveryMode(false);
            setCurrentView('landing');
          }}
          onBack={() => setCurrentView('landing')} 
        />
      )}

      {currentView === 'public-library' && (
        <PublicLibrary 
          onBack={() => {
            if (currentUser && appMode) {
              setCurrentView('dashboard');
            } else {
              setCurrentView('landing');
            }
          }} 
          onLogin={() => goToAuth('login')}
          isLoggedIn={!!currentUser}
          onAddResource={handleAddResourceToClassroom}
          subjectsList={allSubjects.map(s => ({ id: s.id, title: s.title }))}
        />
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
                  <h2 className="text-xl text-gray-500 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 ease-out font-medium max-w-[280px]">
                    <span className="inline-block animate-pulse mr-1">✨</span>
                    Welcome to the classroom — everything your teacher shares, all in one, magical place.
                  </h2>
                </button>
                <button onClick={() => handleModeSelect('teacher')} className="group bg-white p-10 rounded-[3rem] shadow-xl border-b-[16px] border-purple-100 hover:border-purple-400 hover:-translate-y-2 transition-all flex flex-col items-center text-center">
                  <div className="w-32 h-32 bg-purple-50 rounded-full flex items-center justify-center text-6xl mb-6 group-hover:scale-110 transition-transform">🛠️</div>
                  <h3 className="text-3xl font-bold text-purple-600 mb-4">Teacher-Mode</h3>
                  <h2 className="text-xl text-gray-400 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 ease-out font-medium max-w-[280px]">
                    <span className="inline-block animate-pulse mr-1">🪄</span>
                    Welcome to Teacher Mode — create, edit, and prepare what your students will see live in class.
                  </h2>
                </button>
              </div>
            </div>
          )}
          
          {currentView === 'dashboard' && appMode && (
            <Dashboard 
              user={currentUser} 
              appMode={appMode} 
              allSubjects={allSubjects} 
              onModeChange={handleModeChange} 
              onLogout={handleLogout} 
              onBackToMode={handleBackToModeSelect} 
              onNavigateDesigner={() => setCurrentView('designer-select')} 
              onNavigateSubject={navigateToSubject} 
              onAddSubject={handleAddSubject} 
              onEditSubject={handleEditSubject} 
              onDeleteSubject={handleDeleteSubject} 
              onDeleteWhiteboard={handleDeleteWhiteboard}
              onUpdateMaterials={handleUpdateMaterials}
              onUpdateSongs={handleUpdateSongs}
              onUpdateGames={handleUpdateGames}
              onUpdateCalendarData={handleUpdateCalendarData}
              onAddResourceToClassroom={handleAddResourceToClassroom}
              materialsOpenedFromConcept={materialsOpenedFromConcept}
              onReturnToConceptFromMaterials={() => {
                setMaterialsOpenedFromConcept(false);
                setCurrentView('concept');
              }}
              initialView={dashboardInitialView}
              initialSubjectId={dashboardInitialSubjectId || undefined}
              cursorStyle={cursorStyle}
              onCursorStyleChange={setCursorStyle}
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
            <ClassroomDesigner subjectTitle={allSubjects.find(s => s.id === designingSubjectId)?.title || ''} design={currentUser.classroomDesigns[designingSubjectId] || DEFAULT_DESIGN} onSave={(design) => { updateClassroom(designingSubjectId, design); setCurrentView('dashboard'); }} onCancel={() => setCurrentView('dashboard')} />
          )}
          
          {currentView === 'classroom' && selectedSubject && (
            <ClassroomView subject={selectedSubject} design={currentUser.classroomDesigns[selectedSubject.id] || DEFAULT_DESIGN} onBack={() => setCurrentView('dashboard')} onSelectConcept={navigateToConcept} />
          )}
          
          {currentView === 'concept' && selectedConcept && selectedSubject && (
            <ConceptDashboard 
              concept={selectedConcept} 
              design={currentUser.classroomDesigns[selectedSubject.id] || DEFAULT_DESIGN} 
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
              onSaveDesign={handleSaveDesign} 
              onDeleteWhiteboard={handleDeleteWhiteboard}
              onSelectConcept={(c) => setSelectedConcept(c)}
              onUpdateMaterials={handleUpdateMaterials}
              onNavigateToMaterials={(subId) => {
                setDashboardInitialView('materials');
                setDashboardInitialSubjectId(subId);
                setMaterialsOpenedFromConcept(true);
                setCurrentView('dashboard');
              }}
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
        
        .custom-cursor-active, .custom-cursor-active * {
          cursor: none !important;
        }

        @keyframes cursor-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        @keyframes cursor-glow {
          0%, 100% { filter: drop-shadow(0 0 5px currentColor); }
          50% { filter: drop-shadow(0 0 15px currentColor); }
        }

        .animate-cursor-pulse {
          animation: cursor-pulse 1s ease-in-out infinite;
        }

        .animate-cursor-glow {
          animation: cursor-glow 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
