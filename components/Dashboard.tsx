
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, SubjectId, AppMode, Subject, Concept, MaterialFile, Song, Game } from '../types';
import CalendarOverlay from './CalendarOverlay';

const RainbowLogo: React.FC<{ size?: string }> = ({ size = "text-3xl" }) => {
  const letters = "Teachly".split("");
  const colors = [
    "text-blue-500", "text-green-500", "text-yellow-500", "text-orange-500", "text-red-500",
    "text-purple-500", "text-indigo-500"
  ];
  return (
    <span className={`${size} font-bold tracking-tight flex items-center gap-0.5`}>
      {letters.map((l, i) => (
        <span key={i} className={colors[i % colors.length]}>{l}</span>
      ))}
    </span>
  );
};

interface DashboardProps {
  user: User;
  appMode: AppMode;
  allSubjects: Subject[];
  onModeChange: (mode: AppMode) => void;
  onLogout: () => void;
  onBackToMode: () => void;
  onNavigateDesigner: () => void;
  onNavigateSubject: (id: SubjectId) => void;
  onAddSubject: (subjectData: { name: string, description: string, concepts: Concept[], icon: string }) => void;
  onEditSubject: (id: string, subjectData: { name: string, description: string, concepts: Concept[], icon: string }) => void;
  onDeleteSubject: (id: SubjectId) => void;
  onUpdateMaterials: (materials: MaterialFile[]) => void;
  onUpdateSongs: (songs: Song[]) => void;
  onUpdateGames: (games: Game[]) => void;
  onUpdateCalendarData: (calendarData: any) => void;
}

const EMOJI_OPTIONS = ['🍎', '➕', '🔬', '🚀', '🎨', '🧩', '🎸', '🦁', '🌿', '🪐', '🧠', '🔤', '🔢', '🧪', '🌍', '📐', '🎭', '🏀', '☀️', '💡'];

const PUBLIC_SONG_POOL: Song[] = [
  { id: 'p1', title: 'Twinkle, Twinkle Little Star', icon: '⭐', category: 'Quiet Time', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'p2', title: 'The Alphabet Song', icon: '🔤', category: 'Learning', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'p3', title: 'Mary Had a Little Lamb', icon: '🐑', category: 'Nursery Rhymes', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 'p4', title: 'Baa Baa Black Sheep', icon: '🖤', category: 'Nursery Rhymes', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 'p5', title: 'Old MacDonald Had a Farm', icon: '🚜', category: 'Nursery Rhymes', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  { id: 'p6', title: 'Wheels on the Bus', icon: '🚌', category: 'Movement', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
  { id: 'p7', title: 'If You’re Happy and You Know It', icon: '👏', category: 'Movement', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
  { id: 'p8', title: 'Head, Shoulders, Knees, and Toes', icon: '🤸', category: 'Movement', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  { id: 'p9', title: 'London Bridge is Falling Down', icon: '🌉', category: 'Nursery Rhymes', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' },
  { id: 'p10', title: 'Ring Around the Rosie', icon: '🌹', category: 'Movement', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
];

const PUBLIC_GAME_POOL: Game[] = [
  { id: 'g1', title: 'Memory Match', icon: '🧩', category: 'Logic', description: 'Find the matching pairs of cards!', url: '#' },
  { id: 'g2', title: 'Math Race', icon: '🏎️', category: 'Math', description: 'Solve equations to speed up your car!', url: '#' },
  { id: 'g3', title: 'Word Search', icon: '🔍', category: 'Literacy', description: 'Find all the hidden words in the grid.', url: '#' },
  { id: 'g4', title: 'Color Sort', icon: '🎨', category: 'Logic', description: 'Sort objects by their color.', url: '#' },
  { id: 'g5', title: 'Animal Sounds', icon: '🦁', category: 'Science', description: 'Match the animal to the sound it makes.', url: '#' },
  { id: 'g6', title: 'Shape Sorter', icon: '📐', category: 'Math', description: 'Drag the shapes into the correct holes.', url: '#' },
  { id: 'g7', title: 'Phonics Pop', icon: '🎈', category: 'Literacy', description: 'Pop the balloons with the correct letter sounds.', url: '#' },
  { id: 'g8', title: 'Pattern Maker', icon: '✨', category: 'Logic', description: 'Complete the pattern to win!', url: '#' },
];

const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  appMode, 
  allSubjects,
  onModeChange, 
  onLogout, 
  onBackToMode, 
  onNavigateDesigner, 
  onNavigateSubject,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onUpdateMaterials,
  onUpdateSongs,
  onUpdateGames,
  onUpdateCalendarData
}) => {
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [view, setView] = useState<'overview' | 'materials' | 'songs' | 'games'>('overview');
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSubjectForUpload, setActiveSubjectForUpload] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<MaterialFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  // Songs State
  const [activeSongCategory, setActiveSongCategory] = useState<string>('All');
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [showAddSongPanel, setShowAddSongPanel] = useState(false);
  const [songToAssign, setSongToAssign] = useState<Song | null>(null);
  const [previewingSongUrl, setPreviewingSongUrl] = useState<string | null>(null);
  const songAudioRef = useRef<HTMLAudioElement | null>(null);

  // Games State
  const [activeGameCategory, setActiveGameCategory] = useState<string>('All');
  const [gameSearchQuery, setGameSearchQuery] = useState('');
  const [showAddGamePanel, setShowAddGamePanel] = useState(false);
  const [gameToAssign, setGameToAssign] = useState<Game | null>(null);

  // Subject Edit State
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('⭐');
  const [concepts, setConcepts] = useState<{ title: string; icon: string; description: string }[]>([
    { title: '', icon: '✨', description: '' }
  ]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    let url: string | null = null;
    if (previewMaterial && previewMaterial.content) {
      if (previewMaterial.content.startsWith('data:')) {
        try {
          const parts = previewMaterial.content.split(',');
          const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        } catch (e) {
          console.error("Manual blob conversion failed:", e);
          setPreviewUrl(previewMaterial.content);
        }
      } else {
        fetch(previewMaterial.content)
          .then(res => res.blob())
          .then(blob => {
            url = URL.createObjectURL(blob);
            setPreviewUrl(url);
          })
          .catch(err => {
            console.error("Failed to generate preview blob:", err);
            setPreviewUrl(previewMaterial.content || null);
          });
      }
    } else {
      setPreviewUrl(null);
    }
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [previewMaterial]);

  // Clean up song audio and handle "Stop on action"
  useEffect(() => {
    const stopAudio = () => {
      if (songAudioRef.current) {
        songAudioRef.current.pause();
        setPreviewingSongUrl(null);
      }
    };

    return () => {
      stopAudio();
    };
  }, []);

  // Stop audio whenever any significant state change occurs (New Action)
  useEffect(() => {
    if (songAudioRef.current) {
      songAudioRef.current.pause();
      setPreviewingSongUrl(null);
    }
  }, [view, showAddSongPanel, songToAssign, activeSongCategory, appMode]);

  const handleOpenEdit = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setNewName(subject.title);
    setNewDesc(subject.description || '');
    setNewIcon(subject.icon || '⭐');
    setConcepts(subject.concepts.map(c => ({
      title: c.title,
      icon: c.icon,
      description: c.description
    })));
    setShowSubjectModal(true);
  };

  const handleCreateOrUpdateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const formattedConcepts: Concept[] = concepts
      .filter(c => c.title.trim() !== '')
      .map((c, i) => ({
        id: `concept-${Date.now()}-${i}`,
        title: c.title,
        icon: c.icon || '📚',
        description: c.description || `Learning about ${c.title}`,
        suggestedItems: [c.title, c.icon]
      }));

    if (editingSubjectId) {
      onEditSubject(editingSubjectId, {
        name: newName,
        description: newDesc,
        concepts: formattedConcepts,
        icon: newIcon
      });
    } else {
      onAddSubject({
        name: newName,
        description: newDesc,
        concepts: formattedConcepts,
        icon: newIcon
      });
    }

    handleCloseSubjectModal();
  };

  const handleCloseSubjectModal = () => {
    setNewName('');
    setNewDesc('');
    setNewIcon('⭐');
    setConcepts([{ title: '', icon: '✨', description: '' }]);
    setEditingSubjectId(null);
    setShowSubjectModal(false);
  };

  const triggerFileUpload = (subjectId: string) => {
    setActiveSubjectForUpload(subjectId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const generateThumbnail = async (file: File, type: 'pdf' | 'slides' | 'video'): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (type === 'video') {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(file);
        video.muted = true;
        video.playsInline = true;
        video.onloadedmetadata = () => { video.currentTime = 0.5; };
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 160;
          canvas.height = 120;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          URL.revokeObjectURL(video.src);
          resolve(dataUrl);
        };
        video.onerror = () => {
          URL.revokeObjectURL(video.src);
          resolve(undefined);
        };
      } else {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = type === 'pdf' ? '#ef4444' : '#f97316';
          ctx.fillRect(0, 0, canvas.width, 30);
          ctx.fillStyle = '#e2e8f0';
          for (let i = 0; i < 5; i++) {
            ctx.fillRect(20, 50 + i * 20, canvas.width - 40, 10);
          }
          ctx.fillStyle = '#1e293b';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(file.name.substring(0, 12), 20, 160);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve(undefined);
        }
      }
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeSubjectForUpload) return;
    setIsProcessing(true);
    const newMaterials: MaterialFile[] = [];
    for (const file of Array.from(files) as File[]) {
      let type: 'pdf' | 'slides' | 'video' = 'pdf';
      const name = file.name.toLowerCase();
      if (name.endsWith('.pdf')) type = 'pdf';
      else if (name.endsWith('.mp4') || name.endsWith('.webm') || name.endsWith('.mov') || file.type.startsWith('video/')) type = 'video';
      else if (name.endsWith('.ppt') || name.endsWith('.pptx') || name.endsWith('.key') || file.type.includes('presentation')) type = 'slides';
      const thumbnail = await generateThumbnail(file, type);
      const content = await readFileAsDataURL(file);
      newMaterials.push({ id: Math.random().toString(36).substr(2, 9), name: file.name, type: type, subjectId: activeSubjectForUpload!, timestamp: Date.now(), thumbnailUrl: thumbnail, content: content });
    }
    const currentMaterials = user.materials || [];
    onUpdateMaterials([...currentMaterials, ...newMaterials]);
    setToast(`Successfully added ${newMaterials.length} file(s)! 🎉`);
    e.target.value = '';
    setActiveSubjectForUpload(null);
    setIsProcessing(false);
  };

  const handleDeleteMaterial = (id: string) => {
    if (confirm("Delete this material?")) {
      const updated = (user.materials || []).filter(m => m.id !== id);
      onUpdateMaterials(updated);
      setToast("Material deleted. 🗑️");
      if (previewMaterial?.id === id) setPreviewMaterial(null);
    }
  };

  // Song Library Logic
  const handlePreviewSong = (url: string) => {
    if (previewingSongUrl === url) {
      songAudioRef.current?.pause();
      setPreviewingSongUrl(null);
    } else {
      if (songAudioRef.current) songAudioRef.current.pause();
      const audio = new Audio(url);
      audio.play();
      songAudioRef.current = audio;
      setPreviewingSongUrl(url);
      audio.onended = () => setPreviewingSongUrl(null);
    }
  };

  const handleToggleSongSubject = (songId: string, subjectId: string) => {
    const currentSongs = user.songs || [];
    const songIndex = currentSongs.findIndex(s => s.id === songId);
    
    if (songIndex === -1) {
      const publicSong = PUBLIC_SONG_POOL.find(s => s.id === songId);
      if (publicSong) {
        onUpdateSongs([...currentSongs, { ...publicSong, assignedSubjectIds: [subjectId] }]);
      }
      return;
    }

    const song = currentSongs[songIndex];
    const assignedIds = song.assignedSubjectIds || [];
    const newAssignedIds = assignedIds.includes(subjectId)
      ? assignedIds.filter(id => id !== subjectId)
      : [...assignedIds, subjectId];

    const updatedSongs = [...currentSongs];
    updatedSongs[songIndex] = { ...song, assignedSubjectIds: newAssignedIds };
    onUpdateSongs(updatedSongs);
  };

  const handleDeleteSong = (id: string) => {
    if (confirm("Delete this song from your library?")) {
      const updated = (user.songs || []).filter(s => s.id !== id);
      onUpdateSongs(updated);
      setToast("Song deleted. 🗑️");
    }
  };

  // Games Library Logic
  const handleToggleGameSubject = (gameId: string, subjectId: string) => {
    const currentGames = user.games || [];
    const gameIndex = currentGames.findIndex(g => g.id === gameId);
    
    if (gameIndex === -1) {
      const publicGame = PUBLIC_GAME_POOL.find(g => g.id === gameId);
      if (publicGame) {
        onUpdateGames([...currentGames, { ...publicGame, assignedSubjectIds: [subjectId] }]);
      }
      return;
    }

    const game = currentGames[gameIndex];
    const assignedIds = game.assignedSubjectIds || [];
    const newAssignedIds = assignedIds.includes(subjectId)
      ? assignedIds.filter(id => id !== subjectId)
      : [...assignedIds, subjectId];

    const updatedGames = [...currentGames];
    updatedGames[gameIndex] = { ...game, assignedSubjectIds: newAssignedIds };
    onUpdateGames(updatedGames);
  };

  const handleDeleteGame = (id: string) => {
    if (confirm("Delete this game from your library?")) {
      const updated = (user.games || []).filter(g => g.id !== id);
      onUpdateGames(updated);
      setToast("Game deleted. 🗑️");
    }
  };

  const filteredPublicSongs = useMemo(() => {
    return PUBLIC_SONG_POOL.filter(s => {
      const matchesSearch = s.title.toLowerCase().includes(songSearchQuery.toLowerCase());
      const matchesCategory = activeSongCategory === 'All' || s.category === activeSongCategory;
      return matchesSearch && matchesCategory;
    });
  }, [songSearchQuery, activeSongCategory]);

  const filteredPublicGames = useMemo(() => {
    return PUBLIC_GAME_POOL.filter(g => {
      const matchesSearch = g.title.toLowerCase().includes(gameSearchQuery.toLowerCase());
      const matchesCategory = activeGameCategory === 'All' || g.category === activeGameCategory;
      return matchesSearch && matchesCategory;
    });
  }, [gameSearchQuery, activeGameCategory]);

  const addConceptField = () => {
    setConcepts([...concepts, { title: '', icon: '✨', description: '' }]);
  };

  const updateConcept = (index: number, field: string, value: string) => {
    const updated = [...concepts];
    updated[index] = { ...updated[index], [field]: value };
    setConcepts(updated);
  };

  const removeConcept = (index: number) => {
    if (concepts.length > 1) {
      setConcepts(concepts.filter((_, i) => i !== index));
    }
  };

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'pdf': return '📄';
      case 'slides': return '📊';
      case 'video': return '🎬';
      default: return '📁';
    }
  };

  if (view === 'materials') {
    return (
      <div className="p-8 max-w-6xl mx-auto font-['Fredoka'] relative min-h-[80vh]">
        <input type="file" ref={fileInputRef} className="hidden" multiple accept=".pdf,.ppt,.pptx,.key,.mp4,.webm,.mov,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,video/*" onChange={handleFileChange} />
        {isProcessing && (
          <div className="fixed inset-0 z-[300] bg-white/60 backdrop-blur-md flex items-center justify-center">
             <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 animate-pulse border-4 border-blue-400">
                <div className="text-6xl animate-spin">⚙️</div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight text-center">Magically processing your files...<br/><span className="text-blue-500">Creating thumbnails ✨</span></h2>
             </div>
          </div>
        )}
        {toast && (
          <div className="fixed top-24 right-8 z-[200] bg-white border-4 border-blue-400 px-8 py-4 rounded-[2rem] shadow-2xl font-black text-blue-600 animate-bounce-gentle flex items-center gap-3">
             <span className="text-2xl">✨</span> {toast}
          </div>
        )}
        {previewMaterial && (
          <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-lg flex items-center justify-center p-6 animate-fade-in" onClick={() => setPreviewMaterial(null)}>
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative animate-zoom-in" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{getFileIcon(previewMaterial.type)}</div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 truncate max-w-md">{previewMaterial.name}</h3>
                    <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">{previewMaterial.type} Viewer</p>
                  </div>
                </div>
                <button onClick={() => setPreviewMaterial(null)} className="w-12 h-12 bg-white rounded-2xl shadow border-2 border-slate-100 flex items-center justify-center text-xl hover:bg-rose-50 hover:text-rose-500 transition-all">✕</button>
              </div>
              <div className="flex-1 bg-slate-100 overflow-hidden flex items-center justify-center">
                {previewMaterial.type === 'video' ? (
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    {previewUrl ? <video src={previewUrl} controls className="max-w-full max-h-full shadow-2xl" autoPlay /> : <p className="text-white font-black">Video content unavailable.</p>}
                  </div>
                ) : (
                  previewUrl ? <iframe src={previewUrl} className="w-full h-full border-none bg-white" title={previewMaterial.name} allow="autoplay" /> : <div className="text-center p-12"><div className="text-8xl mb-6 opacity-20">📄</div><p className="text-slate-500 font-black">Content missing. Try re-uploading.</p></div>
                )}
              </div>
              <div className="p-4 text-center bg-white border-t border-slate-50"><p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Teaching Resource Preview: {previewMaterial.name}</p></div>
            </div>
          </div>
        )}
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('overview')} className="w-12 h-12 bg-white rounded-2xl shadow border-2 border-slate-100 flex items-center justify-center text-xl hover:bg-slate-50 transition-all active:scale-90">⬅️</button>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Classroom Material 📚</h1>
          </div>
        </header>
        <div className="mb-8 p-1.5 bg-slate-100 rounded-[1.5rem] inline-flex shadow-inner">
          <button className="px-8 py-2.5 bg-white rounded-xl shadow-sm font-black text-blue-500 transition-all">My Material</button>
          <button className="px-8 py-2.5 rounded-xl font-black text-slate-400 cursor-not-allowed opacity-50" title="Coming Soon">Public Library</button>
        </div>
        <div className="space-y-12">
          {allSubjects.map(subject => {
            const subjectMaterials = (user.materials || []).filter(m => m.subjectId === subject.id);
            return (
              <div key={subject.id} className="bg-white/50 p-8 rounded-[3rem] border-2 border-slate-100/50 hover:bg-white transition-colors duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border-2 border-slate-50 flex items-center justify-center text-4xl">{subject.icon || '⭐'}</div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-700 tracking-tight">{subject.title}</h3>
                      <div className="flex items-center gap-2 mt-1"><span className="bg-slate-200 text-slate-500 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">{subjectMaterials.length} Resources</span></div>
                    </div>
                  </div>
                  <button onClick={() => triggerFileUpload(subject.id)} className="flex items-center justify-center gap-3 bg-blue-500 text-white px-8 py-3.5 rounded-[1.5rem] font-black border-b-6 border-blue-700 shadow-lg hover:scale-105 active:translate-y-1 active:border-b-0 transition-all text-sm group">
                    <span className="text-xl group-hover:rotate-12 transition-transform">➕</span><span>Add {subject.title} Files</span>
                  </button>
                </div>
                {subjectMaterials.length === 0 ? (
                  <div className="bg-white/40 border-4 border-dashed border-slate-100 p-16 rounded-[2.5rem] text-center text-slate-400 font-bold"><div className="text-6xl mb-6 opacity-20">📁</div><p className="text-lg">No files here yet!</p><p className="text-sm opacity-60">Click the button above to upload PDFs, Slides, or Videos.</p></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {subjectMaterials.map(mat => (
                      <div key={mat.id} onClick={() => setPreviewMaterial(mat)} className="bg-white rounded-[2.5rem] shadow-sm border-2 border-slate-100 relative group hover:shadow-2xl hover:-translate-y-2 transition-all overflow-hidden flex flex-col h-[240px] cursor-pointer">
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteMaterial(mat.id); }} className="absolute top-2 right-2 w-10 h-10 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg flex items-center justify-center z-20 border-4 border-white" title="Delete Material">✕</button>
                        <div className="flex-1 bg-slate-50 relative overflow-hidden flex items-center justify-center">
                          {mat.thumbnailUrl ? <img src={mat.thumbnailUrl} alt={mat.name} className="w-full h-full object-cover" /> : <div className="text-7xl group-hover:scale-110 transition-transform">{getFileIcon(mat.type)}</div>}
                          <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/20 transition-colors flex items-center justify-center"><div className="w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-xl opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all">🔍</div></div>
                          <div className="absolute bottom-2 left-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm"><span>{getFileIcon(mat.type)}</span><span className="text-slate-600">{mat.type}</span></div>
                        </div>
                        <div className="p-4 bg-white border-t border-slate-100"><h4 className="font-black text-slate-800 truncate text-sm px-1" title={mat.name}>{mat.name}</h4><div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 ml-1">Uploaded {new Date(mat.timestamp).toLocaleDateString()}</div></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === 'songs') {
    return (
      <div className="p-8 max-w-6xl mx-auto font-['Fredoka'] relative min-h-[80vh] animate-fade-in">
        {toast && (
          <div className="fixed top-24 right-8 z-[200] bg-white border-4 border-pink-400 px-8 py-4 rounded-[2rem] shadow-2xl font-black text-pink-600 animate-bounce-gentle flex items-center gap-3">
             <span className="text-2xl">🎵</span> {toast}
          </div>
        )}

        {/* ONE-STEP Assignment Overlay */}
        {songToAssign && (
          <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setSongToAssign(null)}>
             <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-lg animate-zoom-in border-[12px] border-pink-100" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center mb-8">
                   <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center text-5xl mb-4 shadow-inner">
                    {songToAssign.icon}
                   </div>
                   <h3 className="text-2xl font-black text-slate-800 tracking-tight">Assign "{songToAssign.title}"</h3>
                   <p className="text-slate-400 font-bold text-sm">Where should we sing this? 🎶</p>
                </div>
                <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar p-1">
                   {allSubjects.map(sub => {
                     const isAssigned = (user.songs?.find(s => s.id === songToAssign.id)?.assignedSubjectIds || []).includes(sub.id);
                     return (
                       <button 
                         key={sub.id} 
                         onClick={() => handleToggleSongSubject(songToAssign.id, sub.id)}
                         className={`p-4 rounded-3xl border-4 transition-all flex items-center gap-3 text-left group/sub ${isAssigned ? 'border-pink-400 bg-pink-50 shadow-md scale-[1.02]' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
                       >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-3xl shadow-sm ${isAssigned ? 'bg-white' : 'bg-white'}`}>
                            {sub.icon}
                          </div>
                          <div className="flex-1">
                            <div className="font-black text-xs text-slate-800 truncate max-w-[80px]">{sub.title}</div>
                            <div className={`text-[9px] font-bold uppercase tracking-wider ${isAssigned ? 'text-pink-500' : 'text-slate-400'}`}>
                              {isAssigned ? 'Assigned ✅' : 'Assign'}
                            </div>
                          </div>
                       </button>
                     );
                   })}
                </div>
                <button 
                  onClick={() => {
                    setSongToAssign(null);
                    setToast("Assignments saved! ✨");
                  }} 
                  className="w-full mt-10 bg-pink-500 text-white font-black py-4 rounded-3xl shadow-xl hover:scale-105 active:scale-95 transition-all border-b-6 border-pink-700"
                >
                  Done 🎵
                </button>
             </div>
          </div>
        )}

        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
            {!showAddSongPanel && (
              <button onClick={() => setView('overview')} className="w-12 h-12 bg-white rounded-2xl shadow border-2 border-slate-100 flex items-center justify-center text-xl hover:bg-slate-50 transition-all active:scale-90">⬅️</button>
            )}
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Songs Library 🎶</h1>
              <p className="text-slate-400 font-bold text-sm tracking-wide">Add songs to specific classrooms to bring the vibes</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddSongPanel(!showAddSongPanel)}
            className="bg-pink-500 text-white px-8 py-4 rounded-[2rem] font-black border-b-6 border-pink-700 shadow-lg hover:scale-105 active:translate-y-1 active:border-b-0 transition-all text-sm group flex items-center gap-3"
          >
            <span className="text-xl group-hover:rotate-12 transition-transform">{showAddSongPanel ? '🔙' : '➕'}</span>
            <span>{showAddSongPanel ? 'Back to Library' : 'Add New Song'}</span>
          </button>
        </header>

        {showAddSongPanel ? (
          <div className="bg-white/80 p-10 rounded-[4rem] border-4 border-dashed border-pink-100 animate-zoom-in">
            <div className="max-w-3xl mx-auto mb-12">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search for a song..." 
                  className="w-full px-10 py-5 rounded-[2.5rem] border-4 border-pink-50 bg-white focus:border-pink-300 focus:outline-none text-xl font-bold text-slate-700 shadow-inner"
                  value={songSearchQuery}
                  onChange={(e) => setSongSearchQuery(e.target.value)}
                />
                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl opacity-40">🔍</span>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                {['All', 'Nursery Rhymes', 'Movement', 'Learning', 'Quiet Time'].map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setActiveSongCategory(cat)}
                    className={`px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all ${activeSongCategory === cat ? 'bg-pink-500 text-white shadow-lg scale-110' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <p className="text-center mt-6 text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">Source: IMSLP Open Music Library</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredPublicSongs.length === 0 ? (
                <div className="col-span-full text-center py-20 opacity-30">
                  <div className="text-8xl mb-6">🏜️</div>
                  <h3 className="text-2xl font-black">No songs found...</h3>
                </div>
              ) : (
                filteredPublicSongs.map(song => {
                  const isInLibrary = (user.songs || []).some(s => s.id === song.id);
                  return (
                    <div key={song.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-2 border-slate-50 flex flex-col items-center text-center group hover:shadow-2xl hover:-translate-y-2 transition-all">
                      <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner group-hover:scale-110 transition-transform">{song.icon}</div>
                      <h4 className="text-lg font-black text-slate-800 mb-6 leading-tight">{song.title}</h4>
                      <div className="flex gap-2 w-full mt-auto">
                        <button 
                          onClick={() => handlePreviewSong(song.url)}
                          className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${previewingSongUrl === song.url ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          {previewingSongUrl === song.url ? '⏸️ Stop' : '▶️ Preview'}
                        </button>
                        <button 
                          onClick={() => setSongToAssign(song)}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all shadow-lg ${isInLibrary ? 'bg-pink-100 text-pink-500' : 'bg-pink-500 text-white hover:bg-pink-600'}`}
                        >
                          {isInLibrary ? '⚙️' : '➕'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            <section>
              <h2 className="text-2xl font-black text-slate-700 mb-8 flex items-center gap-3">
                <span className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-xl">🏠</span>
                My Classroom Songs
              </h2>
              {(!user.songs || user.songs.length === 0) ? (
                <div 
                  onClick={() => setShowAddSongPanel(true)}
                  className="bg-white/50 border-4 border-dashed border-slate-100 p-20 rounded-[4rem] text-center text-slate-400 font-bold hover:border-pink-300 hover:bg-white transition-all cursor-pointer group"
                >
                  <div className="text-7xl mb-6 opacity-20 group-hover:scale-110 transition-transform">🎸</div>
                  <p className="text-xl">Your classroom is quiet!</p>
                  <p className="text-sm opacity-60 mt-2">Click here to search for songs and assign them to your subjects.</p>
                </div>
              ) : (
                <div className="space-y-12">
                   {allSubjects.map(subject => {
                     const subjectSongs = (user.songs || []).filter(s => (s.assignedSubjectIds || []).includes(subject.id));
                     return (
                       <div key={subject.id} className="bg-white/40 p-8 rounded-[3.5rem] border-2 border-slate-100/50 hover:bg-white transition-colors duration-500 group/subject">
                          <div className="flex items-center justify-between mb-8">
                             <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border-2 border-slate-50 flex items-center justify-center text-3xl">{subject.icon}</div>
                                <div>
                                   <h3 className="text-xl font-black text-slate-700 tracking-tight">{subject.title} Songs</h3>
                                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{subjectSongs.length} Songs Assigned</p>
                                </div>
                             </div>
                             <button onClick={() => setShowAddSongPanel(true)} className="opacity-0 group-hover/subject:opacity-100 transition-opacity bg-slate-100 text-slate-500 px-6 py-2 rounded-2xl font-black text-xs hover:bg-pink-50 hover:text-pink-500 shadow-sm border border-slate-200">+ Add More</button>
                          </div>

                          {subjectSongs.length === 0 ? (
                            <div className="py-12 border-2 border-dashed border-slate-100/10 rounded-[2.5rem] text-center bg-slate-400/5">
                               <p className="text-slate-300 font-bold text-sm italic">No songs assigned to this classroom yet.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                               {subjectSongs.map(song => (
                                 <div key={song.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-2 border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all flex flex-col items-center text-center group relative">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setSongToAssign(song); }}
                                      className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full text-slate-400 flex items-center justify-center hover:bg-pink-50 hover:text-pink-500 shadow-sm border border-slate-100 transition-all z-10"
                                      title="Manage Subjects"
                                    >
                                      ⚙️
                                    </button>
                                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner group-hover:scale-110 transition-transform">{song.icon}</div>
                                    <h4 className="text-base font-black text-slate-800 mb-6 line-clamp-1">{song.title}</h4>
                                    <button 
                                      onClick={() => handlePreviewSong(song.url)}
                                      className={`w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${previewingSongUrl === song.url ? 'bg-amber-400 text-white' : 'bg-pink-500 text-white shadow-sm hover:bg-pink-600'}`}
                                    >
                                      {previewingSongUrl === song.url ? '⏸️ Stop' : '▶️ Play'}
                                    </button>
                                 </div>
                               ))}
                            </div>
                          )}
                       </div>
                     );
                   })}

                   {/* Unassigned Songs Section - SUBTLE OPACITY AS REQUESTED */}
                   {(() => {
                     const unassignedSongs = (user.songs || []).filter(s => (!s.assignedSubjectIds || s.assignedSubjectIds.length === 0));
                     if (unassignedSongs.length === 0) return null;
                     return (
                       <div className="bg-slate-400/10 p-8 rounded-[3.5rem] border-2 border-dashed border-slate-200 transition-all hover:bg-slate-400/15">
                          <div className="flex items-center gap-4 mb-8 opacity-60">
                             <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border-2 border-slate-100 flex items-center justify-center text-3xl">📦</div>
                             <div>
                                <h3 className="text-xl font-black text-slate-500 tracking-tight">Unassigned Songs</h3>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">In your collection but not in a classroom</p>
                             </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                               {unassignedSongs.map(song => (
                                 <div key={song.id} className="bg-white/80 p-6 rounded-[2.5rem] shadow-sm border-2 border-slate-100 flex flex-col items-center text-center group relative hover:bg-white transition-all">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setSongToAssign(song); }}
                                      className="absolute top-3 right-11 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full text-slate-400 flex items-center justify-center hover:bg-pink-50 hover:text-pink-500 shadow-sm border border-slate-100 transition-all z-10"
                                      title="Manage Subjects"
                                    >
                                      ⚙️
                                    </button>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); handleDeleteSong(song.id); }}
                                      className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white shadow-sm border border-slate-100 transition-all z-10"
                                    >
                                      ✕
                                    </button>
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner group-hover:scale-110 transition-transform">{song.icon}</div>
                                    <h4 className="text-base font-black text-slate-800 mb-6 line-clamp-1">{song.title}</h4>
                                    <button 
                                      onClick={() => setSongToAssign(song)}
                                      className="w-full mt-4 py-3 bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all border-b-4 border-blue-700 active:border-b-0"
                                    >
                                      Assign to Classroom
                                    </button>
                                 </div>
                               ))}
                            </div>
                       </div>
                     );
                   })()}
                </div>
              )}
            </section>

            <section className="bg-slate-400/5 p-12 rounded-[4rem]">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-700 flex items-center gap-3">
                  <span className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">🌟</span>
                  Suggested for Early Learning
                </h2>
                <button onClick={() => setShowAddSongPanel(true)} className="text-blue-500 font-black hover:underline">View All →</button>
              </div>
              <div className="flex overflow-x-auto gap-6 pb-8 hide-scrollbar">
                {PUBLIC_SONG_POOL.filter(s => s.category === 'Learning' || s.category === 'Nursery Rhymes').map(song => (
                  <div key={song.id} className="flex-shrink-0 w-64 bg-white p-6 rounded-[2.5rem] shadow-sm border-2 border-slate-100 hover:shadow-xl transition-all flex flex-col items-center text-center">
                    <div className="text-5xl mb-4">{song.icon}</div>
                    <h4 className="font-black text-slate-800 mb-6 line-clamp-1">{song.title}</h4>
                    <button 
                      onClick={() => setSongToAssign(song)}
                      className="mt-auto bg-blue-500 text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform border-b-4 border-blue-700"
                    >
                      Assign Song
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    );
  }

  if (view === 'games') {
    return (
      <div className="p-8 max-w-6xl mx-auto font-['Fredoka'] relative min-h-[80vh] animate-fade-in">
        {toast && (
          <div className="fixed top-24 right-8 z-[200] bg-white border-4 border-emerald-400 px-8 py-4 rounded-[2rem] shadow-2xl font-black text-emerald-600 animate-bounce-gentle flex items-center gap-3">
             <span className="text-2xl">🎮</span> {toast}
          </div>
        )}

        {/* ONE-STEP Assignment Overlay */}
        {gameToAssign && (
          <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setGameToAssign(null)}>
             <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-lg animate-zoom-in border-[12px] border-emerald-100" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center mb-8">
                   <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-5xl mb-4 shadow-inner">
                    {gameToAssign.icon}
                   </div>
                   <h3 className="text-2xl font-black text-slate-800 tracking-tight">Assign "{gameToAssign.title}"</h3>
                   <p className="text-slate-400 font-bold text-sm">Where should we play this? 🎮</p>
                </div>
                <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar p-1">
                   {allSubjects.map(sub => {
                     const isAssigned = (user.games?.find(g => g.id === gameToAssign.id)?.assignedSubjectIds || []).includes(sub.id);
                     return (
                       <button 
                         key={sub.id} 
                         onClick={() => handleToggleGameSubject(gameToAssign.id, sub.id)}
                         className={`p-4 rounded-3xl border-4 transition-all flex items-center gap-3 text-left group/sub ${isAssigned ? 'border-emerald-400 bg-emerald-50 shadow-md scale-[1.02]' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
                       >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-3xl shadow-sm ${isAssigned ? 'bg-white' : 'bg-white'}`}>
                            {sub.icon}
                          </div>
                          <div className="flex-1">
                            <div className="font-black text-xs text-slate-800 truncate max-w-[80px]">{sub.title}</div>
                            <div className={`text-[9px] font-bold uppercase tracking-wider ${isAssigned ? 'text-emerald-500' : 'text-slate-400'}`}>
                              {isAssigned ? 'Assigned ✅' : 'Assign'}
                            </div>
                          </div>
                       </button>
                     );
                   })}
                </div>
                <button 
                  onClick={() => {
                    setGameToAssign(null);
                    setToast("Assignments saved! ✨");
                  }} 
                  className="w-full mt-10 bg-emerald-500 text-white font-black py-4 rounded-3xl shadow-xl hover:scale-105 active:scale-95 transition-all border-b-6 border-emerald-700"
                >
                  Done 🎮
                </button>
             </div>
          </div>
        )}

        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
            {!showAddGamePanel && (
              <button onClick={() => setView('overview')} className="w-12 h-12 bg-white rounded-2xl shadow border-2 border-slate-100 flex items-center justify-center text-xl hover:bg-slate-50 transition-all active:scale-90">⬅️</button>
            )}
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Games Library 🎮</h1>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
               <input 
                 type="text" 
                 placeholder="Search games..." 
                 className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-100 focus:border-emerald-400 outline-none font-bold text-sm"
                 value={gameSearchQuery}
                 onChange={(e) => setGameSearchQuery(e.target.value)}
               />
             </div>
             <button 
               onClick={() => setShowAddGamePanel(!showAddGamePanel)}
               className={`px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 ${showAddGamePanel ? 'bg-slate-100 text-slate-500' : 'bg-emerald-500 text-white shadow-lg border-b-4 border-emerald-700 hover:scale-105'}`}
             >
               {showAddGamePanel ? 'Back to Library' : 'Add Games'}
             </button>
          </div>
        </header>

        {showAddGamePanel ? (
          <div className="animate-fade-in">
             <div className="mb-10 flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
                {['All', 'Logic', 'Math', 'Literacy', 'Science'].map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setActiveGameCategory(cat)}
                    className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeGameCategory === cat ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50 border-2 border-slate-50'}`}
                  >
                    {cat}
                  </button>
                ))}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPublicGames.map(game => {
                  const isAdded = (user.games || []).some(g => g.id === game.id);
                  return (
                    <div key={game.id} className="bg-white p-8 rounded-[3rem] shadow-xl border-2 border-slate-50 flex flex-col items-center text-center group hover:border-emerald-200 transition-all relative overflow-hidden">
                       <div className="absolute top-4 right-4">
                          {isAdded && <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">In Library</span>}
                       </div>
                       <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-5xl mb-6 group-hover:scale-110 transition-transform shadow-inner">
                         {game.icon}
                       </div>
                       <h4 className="text-2xl font-black text-slate-800 mb-2">{game.title}</h4>
                       <p className="text-slate-400 text-sm font-bold mb-6">{game.description}</p>
                       <button 
                         onClick={() => {
                           if (!isAdded) {
                             onUpdateGames([...(user.games || []), { ...game, assignedSubjectIds: [] }]);
                             setToast(`Added ${game.title} to your library! ✨`);
                           } else {
                             handleDeleteGame(game.id);
                           }
                         }}
                         className={`w-full py-4 rounded-3xl font-black text-sm transition-all border-b-6 ${isAdded ? 'bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-100' : 'bg-emerald-500 text-white border-emerald-700 hover:scale-105'}`}
                       >
                         {isAdded ? 'Remove from Library' : 'Add to Library'}
                       </button>
                    </div>
                  );
                })}
             </div>
          </div>
        ) : (
          <div className="space-y-12 animate-fade-in">
            <section>
              <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-8 ml-2">My Games Library</h3>
              {(user.games || []).length === 0 ? (
                <div className="bg-white/50 border-4 border-dashed border-slate-100 p-20 rounded-[4rem] text-center">
                   <div className="text-8xl mb-6 opacity-20">🎮</div>
                   <h4 className="text-2xl font-black text-slate-300 mb-2">Your library is empty!</h4>
                   <p className="text-slate-400 font-bold mb-8">Click "Add Games" to explore interactive activities.</p>
                   <button onClick={() => setShowAddGamePanel(true)} className="bg-emerald-500 text-white px-10 py-4 rounded-3xl font-black shadow-xl border-b-6 border-emerald-700 hover:scale-105 transition-all">Browse Games</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {(user.games || []).map(game => (
                    <div key={game.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border-2 border-slate-50 flex flex-col items-center text-center group hover:-translate-y-2 transition-all relative">
                      <button onClick={() => handleDeleteGame(game.id)} className="absolute top-2 right-2 w-8 h-8 bg-rose-50 text-rose-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs">✕</button>
                      <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center text-4xl mb-4 shadow-inner group-hover:rotate-6 transition-transform">
                        {game.icon}
                      </div>
                      <h4 className="font-black text-slate-800 mb-6 line-clamp-1">{game.title}</h4>
                      <button 
                        onClick={() => setGameToAssign(game)}
                        className="mt-auto bg-blue-500 text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform border-b-4 border-blue-700"
                      >
                        Assign Game
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto font-['Fredoka']">
      <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="flex items-center gap-8">
          <button onClick={onBackToMode} title="Return to Mode Select" className="group flex items-center gap-3 hover:scale-105 transition-transform">
            <div className="w-14 h-14 bg-yellow-400 rounded-3xl flex items-center justify-center shadow-xl border-b-4 border-yellow-600 group-hover:rotate-12 transition-transform"><span className="text-3xl">🎒</span></div>
            <RainbowLogo size="text-4xl" />
          </button>
          <div className="h-12 w-px bg-gray-200 hidden md:block"></div>
          <div className="hidden sm:block"><h1 className="text-2xl font-bold text-gray-800">Hi, {user.username}! 🍎</h1><p className="text-gray-500 text-sm">Welcome to your Teachly dashboard.</p></div>
        </div>
        <div className="bg-gray-100 p-1.5 rounded-full flex relative shadow-inner border border-gray-200 w-64 h-14">
          <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 shadow-sm ${appMode === 'classroom' ? 'left-1 bg-blue-500' : 'left-[calc(50%+2px)] bg-purple-500'}`} />
          <button onClick={() => onModeChange('classroom')} className={`flex-1 flex items-center justify-center gap-2 z-10 transition-colors duration-300 font-bold text-sm ${appMode === 'classroom' ? 'text-white' : 'text-gray-500'}`}><span className="text-xl">👨‍🏫</span>Classroom</button>
          <button onClick={() => onModeChange('teacher')} className={`flex-1 flex items-center justify-center gap-2 z-10 transition-colors duration-300 font-bold text-sm ${appMode === 'teacher' ? 'text-white' : 'text-gray-500'}`}><span className="text-xl">🛠️</span>Teacher</button>
        </div>
        <div className="flex gap-4">
          <button onClick={onLogout} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-full font-medium transition-colors border-b-4 border-gray-300">Logout</button>
        </div>
      </header>
      
      <AnimatePresence>
        {showCalendar && (
          <CalendarOverlay 
            calendarData={user.calendarData || { events: {} }}
            onUpdateCalendarData={onUpdateCalendarData}
            onClose={() => setShowCalendar(false)}
          />
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-3 gap-8">
        <div onClick={appMode === 'teacher' ? onNavigateDesigner : undefined} className={`col-span-full md:col-span-2 p-10 rounded-[3rem] text-white shadow-xl transition-all relative overflow-hidden border-b-[12px] ${appMode === 'classroom' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 border-cyan-800/30' : 'bg-gradient-to-r from-purple-500 to-indigo-600 border-indigo-800/30 cursor-pointer hover:scale-[1.01]'}`}>
          <div className="relative z-10"><h2 className="text-4xl font-bold mb-3">{appMode === 'classroom' ? 'Ready for Lessons?' : 'Decorate Your Classrooms'}</h2><p className="text-white/90 max-w-md text-lg">{appMode === 'classroom' ? 'Select a subject below to jump into an interactive session with your students.' : 'Customize colors, stickers, and music to create the perfect magic learning environment.'}</p></div>
          <div className="absolute right-[-30px] bottom-[-30px] text-[12rem] opacity-20 transform -rotate-12 select-none pointer-events-none">{appMode === 'classroom' ? '🎓' : '🏫'}</div>
        </div>

        {appMode === 'classroom' && (
          <div 
            onClick={() => setShowCalendar(true)} 
            className="bg-white p-10 rounded-[3rem] shadow-xl border-b-[12px] border-blue-100 hover:border-blue-400 hover:-translate-y-2 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
          >
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-5xl mb-6 group-hover:scale-110 transition-transform shadow-inner">📅</div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Classroom Calendar</h3>
            <p className="text-slate-400 text-sm font-bold">Birthdays, weather, and more!</p>
          </div>
        )}

        {appMode === 'teacher' && (
          <div onClick={() => setView('materials')} className="bg-white p-10 rounded-[3rem] shadow-xl border-b-[12px] border-slate-100 hover:border-blue-400 hover:-translate-y-2 transition-all flex flex-col items-center text-center group cursor-pointer">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-5xl mb-6 group-hover:scale-110 transition-transform shadow-inner">📚</div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Classroom Material</h3>
            <p className="text-slate-400 text-sm font-bold">Manage your slides, PDFs, and videos.</p>
          </div>
        )}

        <h3 className="col-span-full text-2xl font-bold text-gray-700 mt-6 mb-2 ml-2 tracking-tight">{appMode === 'classroom' ? 'Select a Subject' : 'Manage Subject Material'}</h3>

        {allSubjects.map((subject) => (
          <div key={subject.id} className="relative group">
            {appMode === 'teacher' && (
              <div className="absolute -top-3 -right-3 flex gap-2 z-10">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleOpenEdit(subject); }} 
                  className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 border-4 border-white transform transition-all hover:scale-110 active:scale-95"
                >
                  ✏️
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if(window.confirm(`Are you sure you want to delete ${subject.title}?`)) { 
                      onDeleteSubject(subject.id); 
                    } 
                  }} 
                  className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 border-4 border-white transform transition-all hover:scale-110 active:scale-95"
                >
                  🗑️
                </button>
              </div>
            )}
            <div onClick={() => onNavigateSubject(subject.id)} className={`${subject.color} p-8 rounded-[2.5rem] shadow-lg cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col items-center text-center border-b-8 border-black/10 h-full`}>
              <div className="bg-white/30 w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner group-hover:scale-110 transition-transform">{subject.icon || '⭐'}</div>
              <h4 className="text-2xl font-bold text-white mb-2">{subject.title}</h4>
              <p className="text-white/80 text-sm font-medium line-clamp-3">{subject.description || 'Start interactive lesson.'}</p>
            </div>
          </div>
        ))}

        {appMode === 'teacher' && (
          <div onClick={() => { handleCloseSubjectModal(); setShowSubjectModal(true); }} className="bg-white border-4 border-dashed border-gray-200 p-8 rounded-[2.5rem] shadow-sm cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center text-center group h-full min-h-[220px]">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-4xl mb-4 group-hover:scale-110 group-hover:bg-blue-100 transition-all">➕</div>
            <h4 className="text-xl font-bold text-gray-400 group-hover:text-blue-500">Add New Subject</h4>
          </div>
        )}

        {appMode === 'teacher' && (
          <>
            <h3 className="col-span-full text-2xl font-bold text-gray-700 mt-12 mb-2 ml-2 tracking-tight">Songs Library 🎵</h3>
            <div 
              onClick={() => setView('songs')} 
              className="col-span-full bg-white p-10 rounded-[3rem] shadow-xl border-b-[12px] border-slate-100 hover:border-pink-400 hover:-translate-y-2 transition-all flex flex-col md:flex-row items-center gap-10 group cursor-pointer relative overflow-hidden"
            >
               <div className="absolute right-[-40px] top-[-40px] text-[10rem] opacity-5 transform rotate-12 group-hover:rotate-45 transition-transform duration-700">🎵</div>
               <div className="w-32 h-32 bg-pink-50 rounded-full flex items-center justify-center text-6xl group-hover:scale-110 transition-transform shadow-inner flex-shrink-0">🎸</div>
               <div className="text-center md:text-left flex-1">
                 <h4 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Songs Library</h4>
                 <p className="text-slate-500 text-lg font-medium leading-relaxed">Songs for circle time, movement, and learning</p>
                 <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-3">
                    <span className="bg-pink-100 text-pink-600 px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm border border-pink-200">Interactive Sing-alongs</span>
                    <span className="bg-blue-100 text-blue-600 px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm border border-blue-200">Lyrics Mode</span>
                    <span className="bg-yellow-100 text-yellow-600 px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm border border-yellow-200">Movement Break Jams</span>
                 </div>
               </div>
               <div className="hidden lg:flex items-center justify-center bg-pink-500 text-white w-14 h-14 rounded-2xl shadow-lg animate-bounce group-hover:animate-none">✨</div>
            </div>

            <h3 className="col-span-full text-2xl font-bold text-gray-700 mt-12 mb-2 ml-2 tracking-tight">Games Library 🎮</h3>
            <div 
              onClick={() => setView('games')} 
              className="col-span-full bg-white p-10 rounded-[3rem] shadow-xl border-b-[12px] border-slate-100 hover:border-emerald-400 hover:-translate-y-2 transition-all flex flex-col md:flex-row items-center gap-10 group cursor-pointer relative overflow-hidden"
            >
               <div className="absolute right-[-40px] top-[-40px] text-[10rem] opacity-5 transform rotate-12 group-hover:rotate-45 transition-transform duration-700">🎮</div>
               <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center text-6xl group-hover:scale-110 transition-transform shadow-inner flex-shrink-0">🧩</div>
               <div className="text-center md:text-left flex-1">
                 <h4 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Games Library</h4>
                 <p className="text-slate-500 text-lg font-medium leading-relaxed">Interactive games for logic, math, and literacy</p>
                 <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-3">
                    <span className="bg-emerald-100 text-emerald-600 px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm border border-emerald-200">Logic Puzzles</span>
                    <span className="bg-blue-100 text-blue-600 px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm border border-blue-200">Math Challenges</span>
                    <span className="bg-orange-100 text-orange-600 px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm border border-orange-200">Literacy Quests</span>
                 </div>
               </div>
               <div className="hidden lg:flex items-center justify-center bg-emerald-500 text-white w-14 h-14 rounded-2xl shadow-lg animate-bounce group-hover:animate-none">✨</div>
            </div>
          </>
        )}
      </div>

      {showSubjectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onClick={handleCloseSubjectModal}>
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 max-h-[90vh] overflow-y-auto relative animate-zoom-in" onClick={e => e.stopPropagation()}>
            <button onClick={handleCloseSubjectModal} className="absolute top-8 right-8 text-3xl text-gray-300 hover:text-red-500">✕</button>
            <div className="text-center mb-8"><h3 className="text-3xl font-bold text-gray-800">{editingSubjectId ? 'Edit Subject' : 'New Subject'}</h3></div>
            <form onSubmit={handleCreateOrUpdateSubject} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 ml-4">ICON</label>
                <div className="flex flex-wrap gap-2 p-4 bg-blue-50 rounded-3xl justify-center">
                  {EMOJI_OPTIONS.map(emoji => (
                    <button key={emoji} type="button" onClick={() => setNewIcon(emoji)} className={`text-2xl p-2 rounded-xl ${newIcon === emoji ? 'bg-white shadow-md border-2 border-blue-400' : 'opacity-50'}`}>{emoji}</button>
                  ))}
                </div>
              </div>
              <input type="text" placeholder="Subject Name" className="w-full px-8 py-4 rounded-3xl border-4 border-blue-50 bg-white focus:border-blue-300 focus:outline-none text-lg font-bold text-black" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              <textarea placeholder="Description" className="w-full px-8 py-4 rounded-3xl border-4 border-blue-50 bg-white focus:border-blue-300 focus:outline-none text-lg font-bold min-h-[100px] text-black" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
              <div className="space-y-4">
                <div className="flex justify-between items-center px-4"><label className="text-sm font-bold text-gray-500">CONCEPTS</label><button type="button" onClick={addConceptField} className="text-blue-500 font-bold text-sm">+ Add</button></div>
                {concepts.map((concept, idx) => (
                  <div key={idx} className="flex gap-3">
                    <input type="text" className="w-16 px-2 py-4 rounded-2xl border-4 border-blue-50 bg-white text-center text-xl text-black" value={concept.icon} onChange={(e) => updateConcept(idx, 'icon', e.target.value)} />
                    <input type="text" placeholder="Concept Title" className="flex-1 px-6 py-4 rounded-2xl border-4 border-blue-50 bg-white focus:border-blue-300 focus:outline-none text-lg font-bold text-black" value={concept.title} onChange={(e) => updateConcept(idx, 'title', e.target.value)} required />
                    {concepts.length > 1 && <button type="button" onClick={() => removeConcept(idx)} className="w-12 bg-red-50 text-red-400 rounded-2xl">✕</button>}
                  </div>
                ))}
              </div>
              <button type="submit" className="w-full bg-blue-500 text-white font-bold py-5 rounded-[2.5rem] text-2xl shadow-xl border-b-8 border-blue-700">{editingSubjectId ? 'Update Room' : 'Create Room'}</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoom-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes bounce-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-zoom-in { animation: zoom-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-bounce-gentle { animation: bounce-gentle 1s ease-in-out infinite; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fecdd3; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Dashboard;
