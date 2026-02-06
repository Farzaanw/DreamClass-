
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Concept, ClassroomDesign, BoardItem, Whiteboard, MaterialFile, Subject, Song } from '../types';
import { STICKERS, VC_WORDS, CV_WORDS, REGULAR_SIGHT_WORDS, IRREGULAR_SIGHT_WORDS, CONSONANT_DIGRAPHS, VOWEL_DIGRAPHS } from '../constants';

interface ConceptDashboardProps {
  concept: Concept;
  design: ClassroomDesign;
  subjectId: string;
  materials: MaterialFile[];
  allSubjects: Subject[];
  onBack: () => void;
  onSaveDesign: (design: ClassroomDesign) => void;
  userSongs?: Song[]; // Songs added by the user
}

const MARKER_COLORS = [
  { name: 'Blue', value: '#2563eb' },
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Purple', value: '#a855f7' }
];

const HIGHLIGHTER_COLORS = [
  { name: 'Yellow', value: 'rgba(234, 179, 8, 0.4)' },
  { name: 'Pink', value: 'rgba(236, 72, 153, 0.4)' },
  { name: 'Green', value: 'rgba(34, 197, 94, 0.4)' },
  { name: 'Blue', value: 'rgba(59, 130, 246, 0.4)' }
];

const getFileIcon = (type: string) => {
  switch(type) {
    case 'pdf': return '📄';
    case 'slides': return '📊';
    case 'video': return '🎬';
    default: return '📁';
  }
};

const ConceptDashboard: React.FC<ConceptDashboardProps> = ({ concept, design, subjectId, materials, allSubjects, onBack, onSaveDesign, userSongs = [] }) => {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [undoStack, setUndoStack] = useState<{ items: BoardItem[], drawing: string | null }[]>([]);
  
  const [activeTool, setActiveTool] = useState<'select' | 'marker' | 'highlighter' | 'eraser'>('select');
  const [markerColor, setMarkerColor] = useState(MARKER_COLORS[0].value);
  const [highlighterColor, setHighlightColor] = useState(HIGHLIGHTER_COLORS[0].value);
  const [showColorPicker, setShowColorPicker] = useState<'marker' | 'highlighter' | null>(null);
  
  const [boardBg, setBoardBg] = useState<'plain' | 'lined' | 'grid'>('plain');
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<MaterialFile | null>(null);
  const [materialUrl, setMaterialUrl] = useState<string | null>(null);
  const [materialPos, setMaterialPos] = useState({ x: 50, y: 50 });
  const isDraggingMaterial = useRef(false);
  const [animatingItemId, setAnimatingItemId] = useState<string | null>(null);

  // Active Song States
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [songPlaying, setSongPlaying] = useState(false);
  const songAudioRef = useRef<HTMLAudioElement | null>(null);

  const categories = useMemo(() => {
    const commonTail = [
      { id: 'STICKERS', label: 'Stickers', icon: '✨' },
      { id: 'GAMES', label: 'Games', icon: '🎮' },
      { id: 'SONGS', label: 'Songs', icon: '🎵' },
      { id: 'HISTORY', label: 'History', icon: '🕰️' }
    ];

    if (subjectId === 'phonics') {
      return [
        { id: 'UPPER', label: 'ABC', icon: '🅰️' },
        { id: 'LOWER', label: 'abc', icon: '🔡' },
        { id: 'BLENDS', label: 'Blends', icon: '🔗' },
        { id: 'SIGHT', label: 'Sight', icon: '👁️' },
        { id: 'DIGRAPHS', label: 'Digraph', icon: '🔈' },
        ...commonTail
      ];
    }
    if (subjectId === 'math') {
      return [
        { id: 'NUMBERS', label: '123', icon: '🔢' },
        { id: 'SHAPES', label: 'Shapes', icon: '📐' },
        ...commonTail
      ];
    }
    if (subjectId === 'science') {
      return [
        { id: 'LETTERS', label: 'ABC', icon: '🅰️' },
        { id: 'SHAPES', label: 'Shapes', icon: '📐' },
        ...commonTail
      ];
    }
    return [
      { id: 'LETTERS', label: 'ABC', icon: '🅰️' },
      { id: 'NUMBERS', label: '123', icon: '🔢' },
      { id: 'SHAPES', label: 'Shapes', icon: '📐' },
      ...commonTail
    ];
  }, [subjectId]);

  const [activeCategoryId, setActiveCategoryId] = useState<string>(categories[0].id);

  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const isPanningRef = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = 2000; 
      canvas.height = 2000;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        contextRef.current = ctx;

        const savedState = design.conceptBoards?.[concept.id];
        if (savedState) {
          setItems(savedState.items || []);
          setBoardBg(savedState.bg || 'plain');
          if (savedState.viewport) setViewport(savedState.viewport);
          
          if (savedState.drawingData) {
            const img = new Image();
            img.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
            };
            img.src = savedState.drawingData;
          }
        }
      }
    }
  }, [concept.id]);

  useEffect(() => {
    let url: string | null = null;
    if (activeMaterial && activeMaterial.content) {
      fetch(activeMaterial.content)
        .then(res => res.blob())
        .then(blob => {
          url = URL.createObjectURL(blob);
          setMaterialUrl(url);
        })
        .catch(err => {
          console.error("Failed to generate blob:", err);
          setMaterialUrl(activeMaterial.content || null);
        });
    } else {
      setMaterialUrl(null);
    }
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [activeMaterial]);

  // Handle Song Audio
  useEffect(() => {
    return () => {
      if (songAudioRef.current) {
        songAudioRef.current.pause();
        songAudioRef.current = null;
      }
    };
  }, []);

  const handlePlaySong = (song: Song) => {
    if (activeSong?.id === song.id && songPlaying) {
      songAudioRef.current?.pause();
      setSongPlaying(false);
    } else {
      if (songAudioRef.current) songAudioRef.current.pause();
      const audio = new Audio(song.url);
      audio.play();
      songAudioRef.current = audio;
      setActiveSong(song);
      setSongPlaying(true);
      audio.onended = () => setSongPlaying(false);
    }
  };

  const saveToUndoStack = () => {
    const drawingSnapshot = canvasRef.current ? canvasRef.current.toDataURL('image/png') : null;
    setUndoStack(prev => [...prev, { items: [...items], drawing: drawingSnapshot }].slice(-30));
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    setItems(previousState.items);
    if (contextRef.current && canvasRef.current) {
      const ctx = contextRef.current;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      if (previousState.drawing) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = previousState.drawing;
      }
    }
    setUndoStack(prev => prev.slice(0, -1));
    setSelectedItemId(null);
  };

  const restoreBoardState = (board: Whiteboard) => {
    saveToUndoStack();
    setItems(board.items || []);
    setBoardBg(board.bg || 'plain');
    if (board.viewport) setViewport(board.viewport);
    if (contextRef.current && canvasRef.current) {
      const ctx = contextRef.current;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      if (board.drawingData) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = board.drawingData;
      }
    }
    setSelectedItemId(null);
  };

  const deleteFromHistory = (boardId: string) => {
    if (confirm("Delete this saved board from history?")) {
      const updatedWhiteboards = (design.whiteboards || []).filter(b => b.id !== boardId);
      const updatedConceptBoards = { ...(design.conceptBoards || {}) };
      Object.keys(updatedConceptBoards).forEach(key => {
        if (updatedConceptBoards[key].id === boardId) delete updatedConceptBoards[key];
      });
      onSaveDesign({ ...design, whiteboards: updatedWhiteboards, conceptBoards: updatedConceptBoards });
    }
  };

  const screenToWorld = (sx: number, sy: number) => ({
    wx: (sx - viewport.x) / viewport.zoom,
    wy: (sy - viewport.y) / viewport.zoom
  });

  const startInteraction = (getEvent: any) => {
    if (isDraggingMaterial.current) return;
    const nativeEvent = getEvent.nativeEvent || getEvent;
    const coords = getScreenCoordinates(nativeEvent);
    if (activeTool === 'select') {
      isPanningRef.current = true;
      lastPanPos.current = { x: coords.sx, y: coords.sy };
      if (getEvent.target === getEvent.currentTarget) setSelectedItemId(null);
    } else {
      if (!contextRef.current) return;
      saveToUndoStack();
      const worldCoords = screenToWorld(coords.sx, coords.sy);
      const ctx = contextRef.current;
      if (activeTool === 'marker') {
        ctx.strokeStyle = markerColor;
        ctx.lineWidth = 6 / viewport.zoom;
        ctx.globalCompositeOperation = 'source-over';
      } else if (activeTool === 'highlighter') {
        ctx.strokeStyle = highlighterColor;
        ctx.lineWidth = 25 / viewport.zoom;
        ctx.globalCompositeOperation = 'source-over';
      } else if (activeTool === 'eraser') {
        ctx.lineWidth = 50 / viewport.zoom;
        ctx.globalCompositeOperation = 'destination-out';
      }
      ctx.beginPath();
      ctx.moveTo(worldCoords.wx, worldCoords.wy);
      isDrawingRef.current = true;
    }
  };

  const performInteraction = (getEvent: any) => {
    const nativeEvent = getEvent.nativeEvent || getEvent;
    if (nativeEvent.type === 'mousemove' && !(nativeEvent.buttons & 1)) {
        if (isDrawingRef.current) stopInteraction();
        return;
    }
    const coords = getScreenCoordinates(nativeEvent);
    if (isPanningRef.current) {
      const dx = coords.sx - lastPanPos.current.x;
      const dy = coords.sy - lastPanPos.current.y;
      setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastPanPos.current = { x: coords.sx, y: coords.sy };
    } else if (isDrawingRef.current && contextRef.current) {
      const worldCoords = screenToWorld(coords.sx, coords.sy);
      contextRef.current.lineTo(worldCoords.wx, worldCoords.wy);
      contextRef.current.stroke();
    }
  };

  const stopInteraction = () => {
    if (isDrawingRef.current && contextRef.current) contextRef.current.closePath();
    isPanningRef.current = false;
    isDrawingRef.current = false;
  };

  const handleZoomAt = (screenCoords: { sx: number, sy: number }, factor: number) => {
    setViewport(prev => {
      const newZoom = Math.min(Math.max(prev.zoom * factor, 0.1), 5);
      const worldPos = { x: (screenCoords.sx - prev.x) / prev.zoom, y: (screenCoords.sy - prev.y) / prev.zoom };
      return { zoom: newZoom, x: screenCoords.sx - worldPos.x * newZoom, y: screenCoords.sy - worldPos.y * newZoom };
    });
  };

  const getScreenCoordinates = (event: any) => {
    const rect = canvasRef.current?.closest('main')?.getBoundingClientRect() || { left: 0, top: 0 };
    if (event.touches && event.touches.length > 0) return { sx: event.touches[0].clientX - rect.left, sy: event.touches[0].clientY - rect.top };
    return { sx: (event.clientX || event.pageX) - rect.left, sy: (event.clientY || event.pageY) - rect.top };
  };

  const addItem = (content: string, type: BoardItem['type'] = 'emoji', screenX?: number, screenY?: number) => {
    saveToUndoStack();
    const worldPos = screenToWorld(screenX !== undefined ? screenX : window.innerWidth / 2, screenY !== undefined ? screenY : window.innerHeight / 2);
    const newItem: BoardItem = { id: Math.random().toString(36).substr(2, 9), content, type, x: worldPos.wx, y: worldPos.wy, scale: 1, rotation: 0 };
    setItems(prev => [...prev, newItem]);
    setSelectedItemId(newItem.id);
    setAnimatingItemId(newItem.id);
    setTimeout(() => setAnimatingItemId(null), 1000);
  };

  const removeItem = (id: string) => {
    saveToUndoStack();
    setItems(prev => prev.filter(item => item.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  const handleDragStartAsset = (e: React.DragEvent, content: string, type: BoardItem['type']) => {
    e.dataTransfer.setData('content', content);
    e.dataTransfer.setData('type', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnBoard = (e: React.DragEvent) => {
    e.preventDefault();
    const content = e.dataTransfer.getData('content');
    const type = e.dataTransfer.getData('type') as BoardItem['type'];
    const rect = e.currentTarget.getBoundingClientRect();
    if (content) addItem(content, type, e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleItemMouseDown = (e: React.MouseEvent, item: BoardItem) => {
    if (activeTool === 'select' && !isPanningRef.current) {
        e.stopPropagation();
        setSelectedItemId(item.id);
        setAnimatingItemId(item.id);
        setTimeout(() => setAnimatingItemId(null), 600);
        saveToUndoStack();
        const startX = e.clientX, startY = e.clientY, initialX = item.x, initialY = item.y;
        const handleMouseMove = (mv: MouseEvent) => {
          setItems(prev => prev.map(it => it.id === item.id ? { ...it, x: initialX + (mv.clientX - startX) / viewport.zoom, y: initialY + (mv.clientY - startY) / viewport.zoom } : it));
        };
        const handleMouseUp = () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, item: BoardItem) => {
    e.stopPropagation();
    saveToUndoStack();
    const startX = e.clientX, initialScale = item.scale;
    const handleMouseMove = (mv: MouseEvent) => {
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, scale: Math.max(0.2, initialScale * (1 + (mv.clientX - startX) / (100 * viewport.zoom))) } : it));
    };
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleSaveBoard = () => {
    const name = prompt("Name this lesson board:", `Lesson ${new Date().toLocaleTimeString()}`);
    if (name === null) return false;
    const newBoard: Whiteboard = { id: Math.random().toString(36).substr(2, 9), conceptId: concept.id, name: name || `Lesson ${new Date().toLocaleTimeString()}`, timestamp: Date.now(), items: [...items], bg: boardBg, drawingData: canvasRef.current?.toDataURL('image/png'), viewport: { ...viewport } };
    onSaveDesign({ ...design, whiteboards: [...(design.whiteboards || []), newBoard], conceptBoards: { ...(design.conceptBoards || {}), [concept.id]: newBoard } });
    alert("Board submitted! You can find it in the History sidebar anytime. ✨");
    return true;
  };

  const handleClearEverything = () => {
    if (confirm("Do you want to save your current whiteboard before starting a new one?")) {
      if (!handleSaveBoard()) return;
    }
    setItems([]);
    if (contextRef.current) contextRef.current.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    setViewport({ x: 0, y: 0, zoom: 1 });
    setUndoStack([]);
    setSelectedItemId(null);
    const updatedConceptBoards = { ...(design.conceptBoards || {}) };
    delete updatedConceptBoards[concept.id];
    onSaveDesign({ ...design, conceptBoards: updatedConceptBoards });
  };

  const handleMaterialMouseDown = (e: React.MouseEvent) => {
    isDraggingMaterial.current = true;
    const startX = e.clientX, startY = e.clientY, initialX = materialPos.x, initialY = materialPos.y;
    const onMouseMove = (mv: MouseEvent) => setMaterialPos({ x: initialX + (mv.clientX - startX), y: initialY + (mv.clientY - startY) });
    const onMouseUp = () => { isDraggingMaterial.current = false; window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const renderCategoryContent = () => {
    const stickerBaseClass = "w-full aspect-square bg-white rounded-2xl shadow-sm border-2 border-slate-100 font-black text-slate-900 text-3xl flex items-center justify-center hover:scale-110 hover:border-blue-200 active:scale-95 transition-all cursor-pointer overflow-hidden p-2 m-0.5";
    const letterBaseClass = stickerBaseClass.replace('text-3xl', 'text-2xl');
    const wordBaseClass = "col-span-2 bg-white rounded-2xl shadow-sm border-2 border-slate-100 font-bold text-slate-800 text-sm py-4 px-3 flex items-center justify-center hover:scale-105 hover:border-blue-200 active:scale-95 transition-all cursor-pointer text-center truncate min-h-[56px]";
    const headerClass = "col-span-4 mt-8 mb-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b-2 border-slate-50 pb-2 flex items-center gap-2";

    if (activeCategoryId === 'UPPER') return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => <button key={l} draggable onDragStart={(e) => handleDragStartAsset(e, l, 'text')} onClick={() => addItem(l, 'text')} className={letterBaseClass}>{l}</button>);
    if (activeCategoryId === 'LOWER') return "abcdefghijklmnopqrstuvwxyz".split("").map(l => <button key={l} draggable onDragStart={(e) => handleDragStartAsset(e, l, 'text')} onClick={() => addItem(l, 'text')} className={letterBaseClass}>{l}</button>);
    if (activeCategoryId === 'BLENDS') return <>{[{label: 'Vowel-First (VC)', words: VC_WORDS}, {label: 'Consonant-First (CV)', words: CV_WORDS}].map(g => <React.Fragment key={g.label}><div className={headerClass}><span>{g.label}</span></div>{g.words.map(w => <button key={w} draggable onDragStart={(e) => handleDragStartAsset(e, w, 'text')} onClick={() => addItem(w, 'text')} className={wordBaseClass}>{w}</button>)}</React.Fragment>)}</>;
    if (activeCategoryId === 'SIGHT') return <>{[{label: 'Phonics Words', words: REGULAR_SIGHT_WORDS}, {label: 'Irregular Words', words: IRREGULAR_SIGHT_WORDS}].map(g => <React.Fragment key={g.label}><div className={headerClass}><span>{g.label}</span></div>{g.words.map(w => <button key={w} draggable onDragStart={(e) => handleDragStartAsset(e, w, 'text')} onClick={() => addItem(w, 'text')} className={wordBaseClass}>{w}</button>)}</React.Fragment>)}</>;
    if (activeCategoryId === 'DIGRAPHS') return <>{[{label: 'Consonant Teams', words: CONSONANT_DIGRAPHS}, {label: 'Vowel Teams', words: VOWEL_DIGRAPHS}].map(g => <React.Fragment key={g.label}><div className={headerClass}><span>{g.label}</span></div>{g.words.map(w => <button key={w} draggable onDragStart={(e) => handleDragStartAsset(e, w, 'text')} onClick={() => addItem(w, 'text')} className={wordBaseClass}>{w}</button>)}</React.Fragment>)}</>;
    if (activeCategoryId === 'NUMBERS') return Array.from({length: 50}, (_, i) => i + 1).map(n => <button key={n} draggable onDragStart={(e) => handleDragStartAsset(e, n.toString(), 'text')} onClick={() => addItem(n.toString(), 'text')} className={stickerBaseClass.replace('text-3xl', 'text-2xl')}>{n}</button>);
    if (activeCategoryId === 'STICKERS') {
      const groups = [ 
        { label: 'Favorites', s: 0, e: 26 }, 
        { label: 'Animals', s: 26, e: 36 }, 
        { label: 'Vehicles', s: 36, e: 45 }, 
        { label: 'Faces', s: 45, e: 52 }, 
        { label: 'Food', s: 52, e: 61 }, 
        { label: 'Nature', s: 61, e: 71 }, 
        { label: 'Symbols', s: 71, e: 79 } 
      ];
      return groups.map(g => (
        <React.Fragment key={g.label}>
          <div className={headerClass}><span>{g.label}</span></div>
          {STICKERS.slice(g.s, g.e).map(s => (
            <button key={s.id} draggable onDragStart={(e) => handleDragStartAsset(e, s.emoji, 'sticker')} onClick={() => addItem(s.emoji, 'sticker')} className={stickerBaseClass}>
              {s.emoji}
            </button>
          ))}
        </React.Fragment>
      ));
    }
    if (activeCategoryId === 'SHAPES') return ['⭕', '⬜', '🔺', '⭐', '❤️', '🟦', '🔶', '🔷', '🛑', '💠', '🪁', '🌙', '☁️', '⚡'].map(s => <button key={s} draggable onDragStart={(e) => handleDragStartAsset(e, s, 'shape')} onClick={() => addItem(s, 'shape')} className={stickerBaseClass}>{s}</button>);
    if (activeCategoryId === 'GAMES') return <div className="col-span-4 text-center py-20 text-slate-300 font-bold px-4"><div className="text-6xl mb-4 opacity-50">🎮</div>Games Library coming soon! ✨</div>;
    
    if (activeCategoryId === 'SONGS') {
      const subjectSongs = userSongs.filter(s => (s.assignedSubjectIds || []).includes(subjectId));
      if (!subjectSongs.length) return <div className="col-span-4 text-center py-20 text-slate-300 font-bold px-4"><div className="text-6xl mb-4 opacity-50">🎵</div>Add some songs in Teacher Mode to see them here! ✨</div>;
      return subjectSongs.map(song => (
        <button 
          key={song.id} 
          onClick={() => handlePlaySong(song)}
          className={`col-span-4 flex items-center gap-4 p-4 bg-white border-2 rounded-[2rem] transition-all hover:border-pink-300 shadow-sm ${activeSong?.id === song.id && songPlaying ? 'ring-4 ring-pink-100 border-pink-400 scale-[1.02]' : ''}`}
        >
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${activeSong?.id === song.id && songPlaying ? 'bg-pink-100 animate-bounce-gentle' : 'bg-slate-50'}`}>
            {song.icon}
          </div>
          <div className="flex-1 text-left min-w-0">
             <div className="font-black text-slate-800 truncate text-sm">{song.title}</div>
             <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{song.artist}</div>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all ${activeSong?.id === song.id && songPlaying ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
             {activeSong?.id === song.id && songPlaying ? '⏸️' : '▶️'}
          </div>
        </button>
      ));
    }

    if (activeCategoryId === 'HISTORY') {
      const hist = (design.whiteboards || []).filter(b => b.conceptId === concept.id);
      if (!hist.length) return <div className="col-span-4 text-center py-12 text-slate-300 font-bold px-4">No history yet. 🕰️</div>;
      return [...hist].reverse().map(b => <div key={b.id} className="col-span-4 flex items-stretch gap-2 mb-2"><button onClick={() => restoreBoardState(b)} className="flex-1 p-4 bg-white border-2 rounded-2xl text-left hover:border-blue-300 shadow-sm transition-all overflow-hidden"><div className="font-black text-slate-800 truncate text-sm">{b.name}</div><div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{new Date(b.timestamp).toLocaleDateString()}</div></button><button onClick={() => deleteFromHistory(b.id)} className="w-10 bg-rose-50 border-2 border-rose-100 rounded-xl text-rose-300 hover:text-rose-600 transition-colors flex items-center justify-center">✕</button></div>);
    }
  };

  const filteredMaterials = materials.filter(m => m.subjectId === subjectId);
  const currentSubject = allSubjects.find(s => s.id === subjectId);

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden font-['Fredoka']">
      <header className="h-16 bg-white border-b-4 border-slate-100 px-6 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-2xl p-2 hover:bg-slate-100 rounded-full transition-colors">⬅️</button>
          <div className="flex flex-col">
            <h1 className="font-black text-slate-900 tracking-tight leading-tight">{concept.title} Master</h1>
            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">{currentSubject?.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleClearEverything} className="px-4 py-2 bg-slate-100 rounded-xl font-black text-slate-900 text-sm border-b-4 border-slate-200 active:translate-y-1 active:border-b-0 transition-all">✨ New</button>
          <button onClick={handleSaveBoard} className="px-4 py-2 bg-blue-500 text-white rounded-xl font-black text-sm border-b-4 border-blue-700 active:translate-y-1 active:border-b-0 transition-all shadow-md">💾 Submit</button>
          <div className="flex gap-1 ml-4 bg-slate-100 p-1 rounded-xl">
             {['plain', 'lined', 'grid'].map(b => <button key={b} onClick={() => setBoardBg(b as any)} className={`p-2 rounded-lg ${boardBg === b ? 'bg-white shadow-sm ring-2 ring-blue-400' : ''}`}>{b === 'plain' ? '⬜' : b === 'lined' ? '📝' : '📊'}</button>)}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* ASSETS DRAWER (LEFT) */}
        <div className={`absolute left-0 top-0 bottom-0 z-[60] bg-white border-r-4 border-slate-100 shadow-2xl transition-transform duration-300 w-[28rem] flex ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="w-28 flex-shrink-0 bg-slate-50 border-r-2 border-slate-100 flex flex-col overflow-y-auto py-6 gap-3 items-center custom-scrollbar">
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategoryId(cat.id)} className={`w-20 h-20 flex-shrink-0 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all ${activeCategoryId === cat.id ? 'bg-white shadow-lg text-blue-500 ring-2 ring-blue-100 scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}>
                <span className="text-3xl font-black leading-none">{cat.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-tight text-center leading-none px-1">{cat.label}</span>
              </button>
            ))}
          </div>
          <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="font-black text-slate-400 text-[10px] tracking-[0.2em] uppercase truncate">{categories.find(c => c.id === activeCategoryId)?.label} Library</h3>
              <button onClick={() => setDrawerOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-4 gap-5 content-start custom-scrollbar">
              {renderCategoryContent()}
            </div>
          </div>
          <button onClick={() => setDrawerOpen(!drawerOpen)} className="absolute left-full top-1/2 -translate-y-1/2 bg-white border-r-4 border-slate-100 p-4 rounded-r-3xl shadow-xl font-black text-xl hover:translate-x-1 transition-all flex items-center justify-center min-w-[56px] border-b-4 border-slate-200">
            {drawerOpen ? '⬅️' : '📦'}
          </button>
        </div>

        {/* MATERIAL LIBRARY (RIGHT) */}
        <div className={`absolute right-0 top-0 bottom-0 z-[65] bg-white border-l-4 border-slate-100 shadow-2xl transition-transform duration-300 w-80 flex flex-col ${libraryOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4 border-b flex justify-between items-center bg-blue-50"><h3 className="font-black text-blue-500 text-xs tracking-widest uppercase flex items-center gap-2"><span className="text-xl">📚</span> Materials</h3><button onClick={() => setLibraryOpen(false)} className="text-slate-300 hover:text-rose-500 font-black">✕</button></div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {!filteredMaterials.length ? <div className="text-center py-12 px-4 opacity-50"><div className="text-5xl mb-4">📂</div><p className="font-black text-slate-400">No subject materials.</p></div> : <div className="space-y-6"><h4 className="px-1 text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${currentSubject?.color || 'bg-blue-400'}`}></span>{currentSubject?.title}</h4><div className="space-y-4">{filteredMaterials.map(m => <button key={m.id} onClick={() => { setActiveMaterial(m); setLibraryOpen(false); }} className="w-full bg-white border-2 rounded-3xl hover:border-blue-400 shadow-sm transition-all flex flex-col overflow-hidden"><div className="h-28 bg-slate-50 flex items-center justify-center">{m.thumbnailUrl ? <img src={m.thumbnailUrl} className="w-full h-full object-cover" /> : <div className="text-5xl">{getFileIcon(m.type)}</div>}</div><div className="p-3 text-left font-black text-slate-900 truncate text-xs">{m.name}</div></button>)}</div></div>}
          </div>
          <button onClick={() => setLibraryOpen(!libraryOpen)} className="absolute right-full top-1/2 -translate-y-1/2 bg-blue-500 text-white border-l-4 border-blue-700 p-4 rounded-l-3xl shadow-xl font-black text-xl hover:-translate-x-1 transition-all flex items-center justify-center min-w-[56px]">
            {libraryOpen ? '➡️' : '📚'}
          </button>
        </div>

        {/* WHITEBOARD MAIN AREA */}
        <main className="flex-1 relative overflow-hidden flex flex-col bg-slate-50" onDrop={handleDropOnBoard} onDragOver={(e) => e.preventDefault()} onWheel={(e) => { e.preventDefault(); handleZoomAt({ sx: e.clientX, sy: e.clientY }, Math.pow(1.1, e.deltaY > 0 ? -1 : 1)); }}>
          {activeMaterial && <div className="absolute z-[90] pointer-events-auto shadow-2xl transition-opacity animate-material-enter" style={{ left: materialPos.x, top: materialPos.y, width: 'min(900px, 92vw)', height: 'min(750px, 85vh)' }}><div className="bg-white w-full h-full rounded-[2.5rem] border-8 border-white flex flex-col overflow-hidden shadow-2xl ring-4 ring-black/5"><div className="flex items-center justify-between p-4 bg-slate-50 cursor-move border-b-2" onMouseDown={handleMaterialMouseDown}><div className="flex items-center gap-3"><div className="text-2xl">{getFileIcon(activeMaterial.type)}</div><div><h4 className="font-black text-slate-900 text-xs tracking-tight truncate max-w-[200px]">{activeMaterial.name}</h4></div></div><button onClick={() => setActiveMaterial(null)} className="w-10 h-10 bg-white rounded-xl shadow border-2 flex items-center justify-center text-lg hover:bg-rose-50 hover:text-rose-500 transition-all">✕</button></div><div className="flex-1 bg-white flex items-center justify-center overflow-hidden">{activeMaterial.type === 'video' ? (materialUrl && <video src={materialUrl} controls className="max-w-full max-h-full" autoPlay />) : (materialUrl && <iframe src={`${materialUrl}#toolbar=1&view=FitH`} className="w-full h-full border-none bg-white" title={activeMaterial.name} />)}</div></div></div>}
          <div className="absolute top-4 right-4 z-[70] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full font-black text-slate-900 text-xs shadow-lg border-2 border-slate-100 select-none">{Math.round(viewport.zoom * 100)}%</div>
          <div className={`flex-1 relative touch-none select-none ${activeTool === 'select' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`} onMouseDown={startInteraction} onMouseMove={performInteraction} onMouseUp={stopInteraction} onMouseLeave={stopInteraction} onTouchStart={startInteraction} onTouchMove={performInteraction} onTouchEnd={stopInteraction} style={{ touchAction: 'none' }}>
            <div className={`absolute inset-0 origin-top-left ${boardBg === 'lined' ? 'board-lined' : boardBg === 'grid' ? 'board-grid' : 'bg-white'}`} style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`, backgroundPosition: '0 0', backgroundSize: `50px 50px`, width: '2000px', height: '2000px' }}>
              <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
              {items.map(item => (
                <div key={item.id} className={`absolute z-10 select-none group pointer-events-auto ${animatingItemId === item.id ? 'animate-live-jiggle' : ''}`} style={{ left: item.x, top: item.y, transform: `translate(-50%, -50%) scale(${item.scale})` }} onMouseDown={(e) => handleItemMouseDown(e, item)}>
                  <div className={`relative p-4 rounded-3xl border-4 transition-all ${selectedItemId === item.id ? 'border-blue-400 bg-blue-500/10' : 'border-transparent'} ${activeTool === 'select' ? 'hover:border-blue-400' : ''}`}>
                    <span className={`block pointer-events-none ${item.type === 'text' ? 'text-7xl font-black text-slate-900' : 'text-9xl'}`}>{item.content}</span>
                    {activeTool === 'select' && selectedItemId === item.id && (
                      <><button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="absolute -top-3 -right-3 w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-xl font-black text-xl border-4 border-white">🗑️</button>
                      <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-xl cursor-nwse-resize" onMouseDown={(e) => handleResizeMouseDown(e, item)} /></>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="h-24 bg-white/95 backdrop-blur-md border-t-4 border-slate-100 flex items-center justify-center gap-6 z-50">
            <div className="flex bg-slate-100 p-2 rounded-full shadow-inner gap-1">
              {[ {id: 'select', icon: '🖐️'}, {id: 'marker', icon: '✏️'}, {id: 'highlighter', icon: '🖍️'}, {id: 'eraser', icon: '🧼'} ].map(t => (
                <div key={t.id} className="relative group/tool">
                  <button onClick={() => { if ((activeTool === t.id) && (t.id === 'marker' || t.id === 'highlighter')) setShowColorPicker(showColorPicker === t.id ? null : t.id as any); else { setActiveTool(t.id as any); setShowColorPicker(null); } }} className={`w-16 h-16 rounded-full transition-all flex items-center justify-center text-2xl relative ${activeTool === t.id ? 'bg-white shadow-xl text-blue-500 scale-110 ring-2 ring-blue-100' : 'opacity-40'}`}>
                    {t.icon}{(t.id === 'marker' || t.id === 'highlighter') && <div className="absolute -bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: t.id === 'marker' ? markerColor : highlighterColor }} />}
                  </button>
                  {showColorPicker === t.id && <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white p-3 rounded-2xl shadow-2xl border-2 border-slate-100 z-[80] animate-fade-in flex gap-2">{(t.id === 'marker' ? MARKER_COLORS : HIGHLIGHTER_COLORS).map(c => <button key={c.value} onClick={() => { if (t.id === 'marker') setMarkerColor(c.value); else setHighlightColor(c.value); setShowColorPicker(null); }} className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-125 ${ (t.id === 'marker' ? markerColor : highlighterColor) === c.value ? 'border-blue-400 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c.value }} />)}</div>}
                </div>
              ))}
            </div>
            <div className="h-12 w-px bg-slate-200" />
            <div className="flex gap-2">
              <button onClick={() => handleZoomAt({ sx: window.innerWidth / 2, sy: window.innerHeight / 2 }, 1.25)} className="w-14 h-14 rounded-2xl bg-white shadow-lg border-2 border-slate-100 flex items-center justify-center text-xl">➕</button>
              <button onClick={() => handleZoomAt({ sx: window.innerWidth / 2, sy: window.innerHeight / 2 }, 0.8)} className="w-14 h-14 rounded-2xl bg-white shadow-lg border-2 border-slate-100 flex items-center justify-center text-xl">➖</button>
              <button onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })} className="w-14 h-14 rounded-2xl bg-slate-50 shadow-lg border-2 border-slate-100 flex items-center justify-center text-xl">🏠</button>
            </div>
            <button onClick={handleUndo} disabled={undoStack.length === 0} className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl border-b-8 transition-all active:translate-y-1 active:border-b-0 ${undoStack.length > 0 ? 'bg-amber-100 text-amber-600 border-amber-300' : 'bg-slate-50 text-slate-200 border-slate-100'}`}>↩️</button>
          </div>
        </main>
      </div>

      <style>{`
        .board-lined { background-color: white; background-image: linear-gradient(rgba(59, 130, 246, 0.1) 2px, transparent 2px); }
        .board-grid { background-color: white; background-image: linear-gradient(rgba(59, 130, 246, 0.08) 2px, transparent 2px), linear-gradient(90deg, rgba(59, 130, 246, 0.08) 2px, transparent 2px); }
        .cursor-grab { cursor: grab; }
        .active\\:cursor-grabbing:active { cursor: grabbing; }
        canvas { image-rendering: auto; }
        .cursor-nwse-resize { cursor: nwse-resize; }
        @keyframes fade-in { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes material-enter { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes live-jiggle { 0% { transform: scale(1); } 25% { transform: scale(1.2) rotate(5deg); } 50% { transform: scale(1.1) rotate(-5deg); } 100% { transform: scale(1) rotate(0); } }
        @keyframes bounce-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        .animate-material-enter { animation: material-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-live-jiggle { animation: live-jiggle 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-bounce-gentle { animation: bounce-gentle 2s ease-in-out infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }
      `}</style>
    </div>
  );
};

export default ConceptDashboard;
