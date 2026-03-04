
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Concept, ClassroomDesign, BoardItem, Whiteboard, MaterialFile, Subject, Song, AppMode } from '../types';
import { STICKERS, VC_WORDS, CV_WORDS, REGULAR_SIGHT_WORDS, IRREGULAR_SIGHT_WORDS, CONSONANT_DIGRAPHS, VOWEL_DIGRAPHS } from '../constants';

interface ConceptDashboardProps {
  concept: Concept;
  design: ClassroomDesign;
  subjectId: string;
  materials: MaterialFile[];
  allSubjects: Subject[];
  onBack: () => void;
  onSaveDesign: (design: ClassroomDesign) => void;
  onSelectConcept?: (concept: Concept) => void;
  userSongs?: Song[]; // Songs added by the user
  mode: AppMode;
}

const MARKER_COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Violet', value: '#9333ea' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Black', value: '#000000' },
  { name: 'Brown', value: '#78350f' }
];

const HIGHLIGHTER_COLORS = [
  { name: 'Yellow', value: 'rgba(234, 179, 8, 0.4)' },
  { name: 'Pink', value: 'rgba(236, 72, 153, 0.4)' },
  { name: 'Green', value: 'rgba(34, 197, 94, 0.4)' },
  { name: 'Blue', value: 'rgba(59, 130, 246, 0.4)' }
];

const CATEGORY_TEMPLATES = [
  { id: 'NUMBERS', label: 'Numbers', icon: '🔢', type: 'category' },
  { id: 'SYMBOLS', label: 'Symbols', icon: '➗', type: 'category' },
  { id: 'LIVING', label: 'Living Things', icon: '🌱', type: 'category' },
  { id: 'ANIMALS', label: 'Animals', icon: '🦁', type: 'category' },
  { id: 'ECOSYSTEMS', label: 'Ecosystems', icon: '🌎', type: 'category' },
  { id: 'UPPER', label: 'Upper Case', icon: '🅰️', type: 'category' },
  { id: 'LOWER', label: 'Lower Case', icon: '🔡', type: 'category' },
  { id: 'BLENDS', label: 'Blends', icon: '🔗', type: 'category' },
  { id: 'SIGHT', label: 'Sight Words', icon: '👁️', type: 'category' },
  { id: 'DIGRAPHS', label: 'Digraphs', icon: '🔈', type: 'category' },
  { id: 'SHAPES', label: 'Shapes', icon: '🟦', type: 'category' },
  { id: 'MEASURE', label: 'Measure', icon: '📏', type: 'category' },
  { id: 'MONEY', label: 'Money', icon: '💰', type: 'category' },
  { id: 'CALENDAR', label: 'Calendar', icon: '📅', type: 'category' },
  { id: 'MANIPULATIVES', label: 'Manipulatives', icon: '🔳', type: 'category' },
  { id: 'VOCAB', label: 'Vocab & Spelling', icon: '📖', type: 'category' },
  { id: 'GRAMMAR', label: 'Grammar Basics', icon: '📝', type: 'category' },
  { id: 'SPEAKING', label: 'Speaking & Listening', icon: '🗣️', type: 'category' },
  { id: 'WEATHER', label: 'Weather & Seasons', icon: '🌤️', type: 'category' },
  { id: 'SPACE', label: 'Space', icon: '🚀', type: 'category' },
  { id: 'GEOGRAPHY', label: 'Maps & Geography', icon: '🗺️', type: 'category' },
  { id: 'CULTURE', label: 'Cultures', icon: '🎎', type: 'category' },
  { id: 'ART_TOOLS', label: 'Drawing & Painting', icon: '🎨', type: 'category' },
  { id: 'COLORS', label: 'Colors & Patterns', icon: '🌈', type: 'category' },
  { id: 'CRAFTS', label: 'Crafts & Collage', icon: '✂️', type: 'category' },
  { id: 'ARTISTS', label: 'Famous Artists', icon: '🖼️', type: 'category' },
  { id: 'INSTRUMENTS', label: 'Instruments', icon: '🎸', type: 'category' },
  { id: 'MUSIC_NOTES', label: 'Music Notes', icon: '🎵', type: 'category' },
  { id: 'HEALTH', label: 'Health & Life', icon: '❤️', type: 'category' },
];

const ALL_TOPIC_ICONS = [
  // Phonics
  ...("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => ({ label: `Letter ${l}`, content: l, type: 'text' }))),
  ...("abcdefghijklmnopqrstuvwxyz".split("").map(l => ({ label: `Letter ${l}`, content: l, type: 'text' }))),
  // Math
  ...(Array.from({length: 50}, (_, i) => ({ label: `Number ${i+1}`, content: (i+1).toString(), type: 'text' }))),
  ...(['➕', '➖', '✖️', '➗', '=', '<', '>', '≤', '≥', '(', ')', '%', '√', 'π', '∞'].map(s => ({ label: `Symbol ${s}`, content: s, type: 'text' }))),
  { label: 'Ruler', content: 'ruler', type: 'shape', display: '📏', metadata: { vertical: false } },
  { label: 'Clock', content: 'clock', type: 'shape', display: '🕒', metadata: { hour: 10, minute: 10 } },
  { label: 'Unit Cube', content: 'unit-cube', type: 'shape', display: '🧊', metadata: { color: 'bg-blue-400' } },
  { label: 'Thermometer', content: 'thermometer', type: 'shape', display: '🌡️', metadata: { temp: 70 } },
  { label: 'Calendar', content: 'calendar', type: 'shape', display: '📅', metadata: { month: 2, year: 2026, selectedDays: [] } },
  // Science
  { label: 'Living', content: '🌱', type: 'sticker' },
  { label: 'Non-Living', content: '🪨', type: 'sticker' },
  { label: 'Water', content: '💧', type: 'sticker' },
  { label: 'Sun', content: '☀️', type: 'sticker' },
  { label: 'Air', content: '💨', type: 'sticker' },
  { label: 'Shelter', content: '🏠', type: 'sticker' },
  { label: 'Food', content: '🍎', type: 'sticker' },
  { label: 'Tree', content: '🌳', type: 'sticker' },
  { label: 'Fungi', content: '🍄', type: 'sticker' },
  { label: 'Microbe', content: '🦠', type: 'sticker' },
  { label: 'Shell', content: '🐚', type: 'sticker' },
  { label: 'Bone', content: '🦴', type: 'sticker' },
  { label: 'Forest', content: '🌲', type: 'sticker' },
  { label: 'Ocean', content: '🌊', type: 'sticker' },
  { label: 'Desert', content: '🏜️', type: 'sticker' },
  { label: 'Arctic', content: '❄️', type: 'sticker' },
  { label: 'Jungle', content: '🎋', type: 'sticker' },
  { label: 'Mammal', content: '🐕', type: 'sticker' },
  { label: 'Bird', content: '🐦', type: 'sticker' },
  { label: 'Fish', content: '🐟', type: 'sticker' },
  { label: 'Reptile', content: '🦎', type: 'sticker' },
  { label: 'Amphibian', content: '🐸', type: 'sticker' },
  { label: 'Insect', content: '🐜', type: 'sticker' },
  { label: 'Dinosaur', content: '🦖', type: 'sticker' },
  { label: 'T-Rex', content: '🦖', type: 'sticker' },
  { label: 'Brachio', content: '🦕', type: 'sticker' },
  { label: 'Pterosaur', content: '🐉', type: 'sticker' },
  { label: 'Fossil', content: '🦴', type: 'sticker' },
  { label: 'Volcano', content: '🌋', type: 'sticker' },
  { label: 'Rabbit', content: '🐇', type: 'sticker' },
  { label: 'Fox', content: '🦊', type: 'sticker' },
  { label: 'Turtle', content: '🐢', type: 'sticker' },
  { label: 'Shark', content: '🦈', type: 'sticker' },
  { label: 'Elephant', content: '🐘', type: 'sticker' },
  { label: 'Lion', content: '🦁', type: 'sticker' },
  { label: 'Giraffe', content: '🦒', type: 'sticker' },
  { label: 'Zebra', content: '🦓', type: 'sticker' },
  { label: 'Panda', content: '🐼', type: 'sticker' },
  { label: 'Koala', content: '🐨', type: 'sticker' },
  { label: 'Whale', content: '🐳', type: 'sticker' },
  { label: 'Octopus', content: '🐙', type: 'sticker' },
  { label: 'Hygiene', content: '🪥', type: 'sticker' },
  { label: 'Nutrition', content: '🥗', type: 'sticker' },
  { label: 'Emotions', content: '😊', type: 'sticker' },
  { label: 'Kindness', content: '🤝', type: 'sticker' },
  { label: 'Safety', content: '🚦', type: 'sticker' },
];

const getFileIcon = (type: string) => {
  switch(type) {
    case 'pdf': return '📄';
    case 'slides': return '📊';
    case 'video': return '🎬';
    default: return '📁';
  }
};

const ConceptDashboard: React.FC<ConceptDashboardProps> = ({ concept, design, subjectId, materials, allSubjects, onBack, onSaveDesign, onSelectConcept, userSongs = [], mode }) => {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [undoStack, setUndoStack] = useState<{ items: BoardItem[], drawing: string | null }[]>([]);
  
  const [activeTool, setActiveTool] = useState<'select' | 'marker' | 'highlighter' | 'eraser'>('select');
  const [markerColor, setMarkerColor] = useState(MARKER_COLORS[0].value);
  const [highlighterColor, setHighlightColor] = useState(HIGHLIGHTER_COLORS[0].value);
  const [showColorPicker, setShowColorPicker] = useState<'marker' | 'highlighter' | null>(null);
  
  const [boardBg, setBoardBg] = useState<'plain' | 'lined' | 'grid'>('plain');
  const [boardBgColor, setBoardBgColor] = useState<string>('#ffffff');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<MaterialFile | null>(null);
  const [materialUrl, setMaterialUrl] = useState<string | null>(null);
  const [materialPos, setMaterialPos] = useState({ x: 50, y: 50 });
  const isDraggingMaterial = useRef(false);
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [currentBoardName, setCurrentBoardName] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [customIcons, setCustomIcons] = useState<any[]>([]);
  const [isSearchingIcons, setIsSearchingIcons] = useState(false);
  const [iconSearchQuery, setIconSearchQuery] = useState('');
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string | null>(null);
  const [showTransition, setShowTransition] = useState(false);
  const [showAddArrow, setShowAddArrow] = useState(mode === 'teacher');
  const [showLibraryArrow, setShowLibraryArrow] = useState(mode === 'teacher');
  const [showSwitcherArrow, setShowSwitcherArrow] = useState(mode === 'teacher');

  const conceptSwitcherRef = useRef<HTMLDivElement>(null);
  const isDraggingSwitcher = useRef(false);
  const hasMovedSwitcher = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleSwitcherMouseDown = (e: React.MouseEvent) => {
    if (!conceptSwitcherRef.current) return;
    isDraggingSwitcher.current = true;
    hasMovedSwitcher.current = false;
    startX.current = e.pageX - conceptSwitcherRef.current.offsetLeft;
    scrollLeft.current = conceptSwitcherRef.current.scrollLeft;
  };

  const handleSwitcherMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingSwitcher.current || !conceptSwitcherRef.current) return;
    const x = e.pageX - conceptSwitcherRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    if (Math.abs(walk) > 5) {
      hasMovedSwitcher.current = true;
      e.preventDefault();
      conceptSwitcherRef.current.scrollLeft = scrollLeft.current - walk;
    }
  };

  const handleSwitcherStop = () => {
    setTimeout(() => {
      isDraggingSwitcher.current = false;
    }, 0);
  };

  // Active Song States
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [songPlaying, setSongPlaying] = useState(false);
  const songAudioRef = useRef<HTMLAudioElement | null>(null);

  const categories = useMemo(() => {
    const commonTail = [
      { id: 'STICKERS', label: 'Stickers', icon: '✨' },
      { id: 'GAMES', label: 'Games', icon: '🎮' },
      { id: 'HISTORY', label: 'History', icon: '🕰️' }
    ];

    const isDefaultSubject = ['phonics', 'math', 'science'].includes(subjectId);
    
    let baseCategories: any[] = [];
    if (isDefaultSubject) {
      if (subjectId === 'phonics') {
        baseCategories = [
          { id: 'UPPER', label: 'ABC', icon: '🅰️' },
          { id: 'LOWER', label: 'abc', icon: '🔡' },
          { id: 'BLENDS', label: 'Blends', icon: '🔗' },
          { id: 'SIGHT', label: 'Sight', icon: '👁️' },
          { id: 'DIGRAPHS', label: 'Digraph', icon: '🔈' },
        ];
      } else if (subjectId === 'math') {
        baseCategories = [
          { id: 'NUMBERS', label: '123', icon: '🔢' },
          { id: 'SYMBOLS', label: 'Symbols', icon: '➗' },
          { id: 'MEASURE', label: 'Measure', icon: '📏' },
          { id: 'CALENDAR', label: 'Calendar', icon: '📅' },
          { id: 'SHAPES', label: 'Shapes', icon: '🟦' },
        ];
      } else if (subjectId === 'science') {
        baseCategories = [
          { id: 'LIVING', label: 'Living', icon: '🌱' },
          { id: 'ANIMALS', label: 'Animals', icon: '🦁' },
          { id: 'ECOSYSTEMS', label: 'Eco', icon: '🌎' },
        ];
      }
    }

    const customCats = customIcons.map(ci => ({
      id: ci.id,
      label: ci.label,
      icon: ci.icon,
      isCustom: true
    }));

    const addMaterialBtn = mode === 'teacher' ? [{ id: 'ADD_MATERIAL', label: 'Add', icon: '➕' }] : [];

    return [
      ...addMaterialBtn,
      ...baseCategories,
      ...customCats,
      ...commonTail
    ];
  }, [subjectId, customIcons, mode]);

  const [activeCategoryId, setActiveCategoryId] = useState<string>(categories[0]?.id || 'STICKERS');

  useEffect(() => {
    setActiveSubCategoryId(null);
  }, [activeCategoryId]);

  useEffect(() => {
    if (!categories.find(c => c.id === activeCategoryId)) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const isPanningRef = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    setShowTransition(true);
    const timer = setTimeout(() => setShowTransition(false), 1500);
    return () => clearTimeout(timer);
  }, [concept.title]);

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
          setBoardBgColor(savedState.bgColor || '#ffffff');
          if (savedState.viewport) setViewport(savedState.viewport);
          setCurrentBoardId(savedState.id);
          setCurrentBoardName(savedState.name);
          if (savedState.customIcons) setCustomIcons(savedState.customIcons);
          
          if (savedState.drawingData) {
            const img = new Image();
            img.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
            };
            img.src = savedState.drawingData;
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        } else {
          setItems([]);
          setBoardBg('plain');
          setBoardBgColor('#ffffff');
          setViewport({ x: 0, y: 0, zoom: 1 });
          setCurrentBoardId(null);
          setCurrentBoardName(null);
          setCustomIcons([]);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
  }, [concept.id]);

  useEffect(() => {
    let url: string | null = null;
    if (activeMaterial && activeMaterial.content) {
      if (activeMaterial.content.startsWith('data:')) {
        try {
          const parts = activeMaterial.content.split(',');
          const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          url = URL.createObjectURL(blob);
          setMaterialUrl(url);
        } catch (e) {
          console.error("Manual blob conversion failed:", e);
          setMaterialUrl(activeMaterial.content);
        }
      } else {
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
      }
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
    setBoardBgColor(board.bgColor || '#ffffff');
    if (board.viewport) setViewport(board.viewport);
    setCurrentBoardId(board.id);
    setCurrentBoardName(board.name);
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
      // Clear selection if clicking on the background (canvas or the background div)
      const target = nativeEvent.target as HTMLElement;
      if (target.classList.contains('board-lined') || target.classList.contains('board-grid') || target.tagName === 'CANVAS' || target.classList.contains('bg-white')) {
        setSelectedItemId(null);
      }
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

  const addItem = (content: string, type: BoardItem['type'] = 'emoji', screenX?: number, screenY?: number, metadata?: any) => {
    if (type === 'sticker') {
      const stickerCount = items.filter(it => it.type === 'sticker').length;
      if (stickerCount >= 8) {
        alert("You can only place up to 8 stickers at a time!");
        return;
      }
    }
    saveToUndoStack();
    const worldPos = screenToWorld(screenX !== undefined ? screenX : window.innerWidth / 2, screenY !== undefined ? screenY : window.innerHeight / 2);
    const newItem: BoardItem = { id: Math.random().toString(36).substr(2, 9), content, type, x: worldPos.wx, y: worldPos.wy, scale: 1, rotation: 0, metadata };
    setItems(prev => [...prev, newItem]);
    // Removed auto-selection to satisfy user request: "Only show the delete button on the icon if the user reclicks on the icon"
  };

  const removeItem = (id: string) => {
    saveToUndoStack();
    setItems(prev => prev.filter(item => item.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
    // If the removed item was the active song, stop it
    if (activeSong?.id === id) {
      songAudioRef.current?.pause();
      setSongPlaying(false);
      setActiveSong(null);
    }
  };

  const updateItemMetadata = (id: string, newMetadata: any, skipUndo = false) => {
    if (!skipUndo) saveToUndoStack();
    setItems(prev => prev.map(item => item.id === id ? { ...item, metadata: { ...item.metadata, ...newMetadata } } : item));
  };

  const handleClockHandMouseDown = (e: React.MouseEvent, itemId: string, type: 'hour' | 'minute') => {
    e.stopPropagation();
    const clockElement = e.currentTarget.closest('.clock-container');
    if (!clockElement) return;

    const rect = clockElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - centerX;
      const dy = moveEvent.clientY - centerY;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;

      if (type === 'hour') {
        const hour = Math.round(angle / 30) % 12;
        updateItemMetadata(itemId, { hour }, true);
      } else {
        const minute = Math.round(angle / 6) % 60;
        updateItemMetadata(itemId, { minute }, true);
      }
    };

    const handleMouseUp = () => {
      saveToUndoStack();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleThermometerMouseDown = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    const thermoElement = e.currentTarget.closest('.thermometer-container');
    if (!thermoElement) return;

    const tubeElement = thermoElement.querySelector('.thermo-tube');
    if (!tubeElement) return;

    const updateTemp = (clientY: number) => {
      const rect = tubeElement.getBoundingClientRect();
      const relativeY = clientY - rect.top;
      const percentage = 100 - Math.max(0, Math.min(100, (relativeY / rect.height) * 100));
      updateItemMetadata(itemId, { temp: Math.round(percentage) }, true);
    };

    updateTemp(e.clientY);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateTemp(moveEvent.clientY);
    };

    const handleMouseUp = () => {
      saveToUndoStack();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const getCubeClusterInfo = (cube: BoardItem) => {
    const cubes = items.filter(i => i.content === 'unit-cube');
    const cluster: BoardItem[] = [];
    const queue = [cube];
    const visited = new Set([cube.id]);
    const gridSize = 40;

    while (queue.length > 0) {
      const current = queue.shift()!;
      cluster.push(current);
      
      cubes.forEach(other => {
        if (!visited.has(other.id)) {
          const dx = Math.abs(current.x - other.x);
          const dy = Math.abs(current.y - other.y);
          if ((dx === gridSize && dy === 0) || (dx === 0 && dy === gridSize)) {
            visited.add(other.id);
            queue.push(other);
          }
        }
      });
    }

    if (cluster.length <= 1) return null;

    const minX = Math.min(...cluster.map(c => c.x));
    const maxX = Math.max(...cluster.map(c => c.x));
    const minY = Math.min(...cluster.map(c => c.y));
    const maxY = Math.max(...cluster.map(c => c.y));

    const width = Math.round((maxX - minX) / gridSize) + 1;
    const height = Math.round((maxY - minY) / gridSize) + 1;
    const isTopLeft = cube.x === minX && cube.y === minY;

    return { width, height, isTopLeft, total: cluster.length };
  };

  const handleDragStartAsset = (e: React.DragEvent, content: string, type: BoardItem['type'], metadata?: any) => {
    e.dataTransfer.setData('content', content);
    e.dataTransfer.setData('type', type);
    if (metadata) e.dataTransfer.setData('metadata', JSON.stringify(metadata));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnBoard = (e: React.DragEvent) => {
    e.preventDefault();
    const content = e.dataTransfer.getData('content');
    const type = e.dataTransfer.getData('type') as BoardItem['type'];
    const metadataStr = e.dataTransfer.getData('metadata');
    const metadata = metadataStr ? JSON.parse(metadataStr) : undefined;
    const rect = e.currentTarget.getBoundingClientRect();
    if (content) addItem(content, type, e.clientX - rect.left, e.clientY - rect.top, metadata);
  };

  const handleItemMouseDown = (e: React.MouseEvent, item: BoardItem) => {
    if (activeTool === 'select' && !isPanningRef.current) {
        e.stopPropagation();
        setSelectedItemId(item.id);
        
        // Bring to front
        setItems(prev => {
          const itemToMove = prev.find(it => it.id === item.id);
          if (!itemToMove) return prev;
          return [...prev.filter(it => it.id !== item.id), itemToMove];
        });

        saveToUndoStack();
        const startX = e.clientX, startY = e.clientY, initialX = item.x, initialY = item.y;
        const handleMouseMove = (mv: MouseEvent) => {
          let newX = initialX + (mv.clientX - startX) / viewport.zoom;
          let newY = initialY + (mv.clientY - startY) / viewport.zoom;
          
          if (item.content === 'unit-cube') {
            const gridSize = 40;
            newX = Math.round(newX / gridSize) * gridSize;
            newY = Math.round(newY / gridSize) * gridSize;
          }

          setItems(prev => prev.map(it => it.id === item.id ? { ...it, x: newX, y: newY } : it));
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

  // Auto-save whiteboard items and basic state
  useEffect(() => {
    if (mode === 'teacher') {
      const timer = setTimeout(() => {
        // Only auto-save if we have something to save
        if (items.length === 0 && boardBg === 'plain' && viewport.x === 0 && viewport.y === 0 && viewport.zoom === 1) return;

        const boardId = currentBoardId || `auto-${concept.id}`;
        const boardName = currentBoardName || `Lesson ${new Date().toLocaleTimeString()}`;
        
        const newBoard: Whiteboard = {
          id: boardId,
          conceptId: concept.id,
          name: boardName,
          timestamp: Date.now(),
          items: [...items],
          bg: boardBg,
          bgColor: boardBgColor,
          viewport: { ...viewport },
          customIcons: [...customIcons],
          // Keep existing drawing data during auto-save
          drawingData: design.conceptBoards?.[concept.id]?.drawingData
        };

        const existingWhiteboards = design.whiteboards || [];
        const updatedWhiteboards = existingWhiteboards.some(b => b.id === boardId)
          ? existingWhiteboards.map(b => b.id === boardId ? newBoard : b)
          : [...existingWhiteboards, newBoard];

        onSaveDesign({
          ...design,
          whiteboards: updatedWhiteboards,
          conceptBoards: { ...(design.conceptBoards || {}), [concept.id]: newBoard }
        });
      }, 2000); // 2 second debounce for auto-save
      return () => clearTimeout(timer);
    }
  }, [items, boardBg, viewport, customIcons, currentBoardId, currentBoardName, concept.id, mode]);

  const handleSaveBoard = (onSuccess?: () => void) => {
    let boardId = currentBoardId;
    let boardName = currentBoardName;

    if (!boardId) {
      const inputName = window.prompt("Name this lesson board:", `Lesson ${new Date().toLocaleTimeString()}`);
      if (inputName === null) return false;
      boardName = inputName || `Lesson ${new Date().toLocaleTimeString()}`;
      boardId = Math.random().toString(36).substr(2, 9);
      setCurrentBoardId(boardId);
      setCurrentBoardName(boardName);
    }

    setSaveStatus('saving');

    // Capture the full state including the drawing layer
    const drawingSnapshot = canvasRef.current ? canvasRef.current.toDataURL('image/png') : undefined;

    const newBoard: Whiteboard = { 
      id: boardId, 
      conceptId: concept.id, 
      name: boardName!, 
      timestamp: Date.now(), 
      items: [...items], 
      bg: boardBg, 
      bgColor: boardBgColor,
      drawingData: drawingSnapshot, 
      viewport: { ...viewport },
      customIcons: [...customIcons]
    };

    const existingWhiteboards = design.whiteboards || [];
    const updatedWhiteboards = existingWhiteboards.some(b => b.id === boardId)
      ? existingWhiteboards.map(b => b.id === boardId ? newBoard : b)
      : [...existingWhiteboards, newBoard];

    const updatedDesign = { 
      ...design, 
      whiteboards: updatedWhiteboards, 
      conceptBoards: { ...(design.conceptBoards || {}), [concept.id]: newBoard } 
    };

    onSaveDesign(updatedDesign);
    
    setSaveStatus('saved');
    if (onSuccess) {
      setTimeout(onSuccess, 800);
    } else {
      setTimeout(() => setSaveStatus('idle'), 2000);
    }

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
    setCurrentBoardId(null);
    setCurrentBoardName(null);
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
    const headerClass = "col-span-4 mt-8 mb-4 text-xs font-black uppercase text-slate-400 tracking-[0.2em] border-b-2 border-slate-50 pb-2 flex items-center gap-2";

    const effectiveCategoryId = activeSubCategoryId || activeCategoryId;

    if (effectiveCategoryId === 'UPPER') return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => <button key={l} draggable onDragStart={(e) => handleDragStartAsset(e, l, 'text')} onClick={() => addItem(l, 'text')} className={letterBaseClass}>{l}</button>);
    if (effectiveCategoryId === 'LOWER') return "abcdefghijklmnopqrstuvwxyz".split("").map(l => <button key={l} draggable onDragStart={(e) => handleDragStartAsset(e, l, 'text')} onClick={() => addItem(l, 'text')} className={letterBaseClass}>{l}</button>);
    if (effectiveCategoryId === 'BLENDS') return <>{[{label: 'Vowel-First (VC)', words: VC_WORDS}, {label: 'Consonant-First (CV)', words: CV_WORDS}].map(g => <React.Fragment key={g.label}><div className={headerClass}><span>{g.label}</span></div>{g.words.map(w => <button key={w} draggable onDragStart={(e) => handleDragStartAsset(e, w, 'text')} onClick={() => addItem(w, 'text')} className={wordBaseClass}>{w}</button>)}</React.Fragment>)}</>;
    if (effectiveCategoryId === 'SIGHT') return <>{[{label: 'Phonics Words', words: REGULAR_SIGHT_WORDS}, {label: 'Irregular Words', words: IRREGULAR_SIGHT_WORDS}].map(g => <React.Fragment key={g.label}><div className={headerClass}><span>{g.label}</span></div>{g.words.map(w => <button key={w} draggable onDragStart={(e) => handleDragStartAsset(e, w, 'text')} onClick={() => addItem(w, 'text')} className={wordBaseClass}>{w}</button>)}</React.Fragment>)}</>;
    if (effectiveCategoryId === 'DIGRAPHS') return <>{[{label: 'Consonant Teams', words: CONSONANT_DIGRAPHS}, {label: 'Vowel Teams', words: VOWEL_DIGRAPHS}].map(g => <React.Fragment key={g.label}><div className={headerClass}><span>{g.label}</span></div>{g.words.map(w => <button key={w} draggable onDragStart={(e) => handleDragStartAsset(e, w, 'text')} onClick={() => addItem(w, 'text')} className={wordBaseClass}>{w}</button>)}</React.Fragment>)}</>;
    if (effectiveCategoryId === 'NUMBERS') return Array.from({length: 50}, (_, i) => i + 1).map(n => <button key={n} draggable onDragStart={(e) => handleDragStartAsset(e, n.toString(), 'text')} onClick={() => addItem(n.toString(), 'text')} className={stickerBaseClass.replace('text-3xl', 'text-2xl')}>{n}</button>);
    
    if (effectiveCategoryId === 'SYMBOLS') return ['➕', '➖', '✖️', '➗', '=', '<', '>', '≤', '≥', '(', ')', '%', '√', 'π', '∞'].map(s => <button key={s} draggable onDragStart={(e) => handleDragStartAsset(e, s, 'text')} onClick={() => addItem(s, 'text')} className={stickerBaseClass}>{s}</button>);
    
    if (effectiveCategoryId === 'LIVING') {
      const items = [
        { e: '🌱', l: 'Living', t: 'sticker' },
        { e: '🪨', l: 'Non-Living', t: 'sticker' },
        { e: '💧', l: 'Water', t: 'sticker' },
        { e: '☀️', l: 'Sun', t: 'sticker' },
        { e: '💨', l: 'Air', t: 'sticker' },
        { e: '🏠', l: 'Shelter', t: 'sticker' },
        { e: '🍎', l: 'Food', t: 'sticker' },
        { e: '🌳', l: 'Tree', t: 'sticker' },
        { e: '🍄', l: 'Fungi', t: 'sticker' },
        { e: '🦠', l: 'Microbe', t: 'sticker' },
        { e: '🐚', l: 'Shell', t: 'sticker' },
        { e: '🦴', l: 'Bone', t: 'sticker' },
      ];
      return items.map(i => (
        <div key={i.l} className="flex flex-col items-center gap-1">
          <button draggable onDragStart={(e) => handleDragStartAsset(e, i.e, i.t as any)} onClick={() => addItem(i.e, i.t as any)} className={stickerBaseClass}>{i.e}</button>
          <span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span>
        </div>
      ));
    }

    if (effectiveCategoryId === 'ANIMALS') {
      const bgs = [
        { e: '🌲', l: 'Forest', t: 'sticker' },
        { e: '🌊', l: 'Ocean', t: 'sticker' },
        { e: '🏜️', l: 'Desert', t: 'sticker' },
        { e: '❄️', l: 'Arctic', t: 'sticker' },
        { e: '🎋', l: 'Jungle', t: 'sticker' },
      ];
      const types = [
        { e: '🐕', l: 'Mammal', t: 'sticker' },
        { e: '🐦', l: 'Bird', t: 'sticker' },
        { e: '🐟', l: 'Fish', t: 'sticker' },
        { e: '🦎', l: 'Reptile', t: 'sticker' },
        { e: '🐸', l: 'Amphibian', t: 'sticker' },
        { e: '🐜', l: 'Insect', t: 'sticker' },
        { e: '🦖', l: 'Dinosaur', t: 'sticker' },
      ];
      const cycles = [
        { e: '🥚', l: 'Egg', t: 'sticker' },
        { e: '🐛', l: 'Larva', t: 'sticker' },
        { e: '🕸️', l: 'Chrysalis', t: 'sticker' },
        { e: '🦋', l: 'Butterfly', t: 'sticker' },
        { e: '🐸', l: 'Frog', t: 'sticker' },
        { e: '🐣', l: 'Hatchling', t: 'sticker' },
      ];
      const specific = [
        { e: '🐇', l: 'Rabbit', t: 'sticker' },
        { e: ' foxes', l: 'Fox', t: 'sticker' },
        { e: '🐢', l: 'Turtle', t: 'sticker' },
        { e: '🦈', l: 'Shark', t: 'sticker' },
        { e: '🐘', l: 'Elephant', t: 'sticker' },
        { e: '🦁', l: 'Lion', t: 'sticker' },
        { e: '🦒', l: 'Giraffe', t: 'sticker' },
        { e: '🦓', l: 'Zebra', t: 'sticker' },
        { e: '🐼', l: 'Panda', t: 'sticker' },
        { e: '🐨', l: 'Koala', t: 'sticker' },
        { e: '🐳', l: 'Whale', t: 'sticker' },
        { e: '🐙', l: 'Octopus', t: 'sticker' },
      ];
      const dinosaurs = [
        { e: '🦖', l: 'T-Rex', t: 'sticker' },
        { e: '🦕', l: 'Brachio', t: 'sticker' },
        { e: '🐉', l: 'Pterosaur', t: 'sticker' },
        { e: '🦴', l: 'Fossil', t: 'sticker' },
        { e: '🌋', l: 'Volcano', t: 'sticker' },
      ];
      return (
        <>
          <div className={headerClass}><span>Backgrounds</span></div>
          {bgs.map(i => <div key={i.l} className="flex flex-col items-center gap-1"><button draggable onDragStart={(e) => handleDragStartAsset(e, i.e, i.t as any)} onClick={() => addItem(i.e, i.t as any)} className={stickerBaseClass}>{i.e}</button><span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span></div>)}
          <div className={headerClass}><span>Classifications</span></div>
          {types.map(i => <div key={i.l} className="flex flex-col items-center gap-1"><button draggable onDragStart={(e) => handleDragStartAsset(e, i.e, i.t as any)} onClick={() => addItem(i.e, i.t as any)} className={stickerBaseClass}>{i.e}</button><span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span></div>)}
          <div className={headerClass}><span>Life Cycles</span></div>
          {cycles.map(i => <div key={i.l} className="flex flex-col items-center gap-1"><button draggable onDragStart={(e) => handleDragStartAsset(e, i.e, i.t as any)} onClick={() => addItem(i.e, i.t as any)} className={stickerBaseClass}>{i.e}</button><span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span></div>)}
          <div className={headerClass}><span>Animals</span></div>
          {specific.map(i => <div key={i.l} className="flex flex-col items-center gap-1"><button draggable onDragStart={(e) => handleDragStartAsset(e, i.e, i.t as any)} onClick={() => addItem(i.e, i.t as any)} className={stickerBaseClass}>{i.e}</button><span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span></div>)}
          <div className={headerClass}><span>Dinosaurs</span></div>
          {dinosaurs.map(i => <div key={i.l} className="flex flex-col items-center gap-1"><button draggable onDragStart={(e) => handleDragStartAsset(e, i.e, i.t as any)} onClick={() => addItem(i.e, i.t as any)} className={stickerBaseClass}>{i.e}</button><span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span></div>)}
        </>
      );
    }

    if (effectiveCategoryId === 'ECOSYSTEMS') {
      const items = [
        { e: '☀️', l: 'Sun', t: 'sticker' },
        { e: '🌿', l: 'Plant', t: 'sticker' },
        { e: '🐛', l: 'Bug', t: 'sticker' },
        { e: '🐇', l: 'Rabbit', t: 'sticker' },
        { e: '🦊', l: 'Fox', t: 'sticker' },
        { e: '🍄', l: 'Mushroom', t: 'sticker' },
        { e: '➡️', l: 'Arrow', t: 'sticker' },
        { e: '🌊', l: 'Water', t: 'sticker' },
        { e: '🏔️', l: 'Mountain', t: 'sticker' },
        { e: '🏜️', l: 'Desert', t: 'sticker' },
        { e: '🕸️', l: 'Web', t: 'sticker' },
        { e: '🐝', l: 'Pollinator', t: 'sticker' },
        { e: '🦅', l: 'Predator', t: 'sticker' },
        { e: '🦌', l: 'Prey', t: 'sticker' },
        { e: '🪵', l: 'Decomposer', t: 'sticker' },
      ];
      return items.map(i => (
        <div key={i.l} className="flex flex-col items-center gap-1">
          <button draggable onDragStart={(e) => handleDragStartAsset(e, i.e, i.t as any)} onClick={() => addItem(i.e, i.t as any)} className={stickerBaseClass}>{i.e}</button>
          <span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span>
        </div>
      ));
    }

    if (effectiveCategoryId === 'MANIPULATIVES') {
      const items = [
        { e: '🔳', l: 'Ten Frame', t: 'shape', c: 'ten-frame' },
        { e: '🧊', l: 'Ones Cube', t: 'sticker', c: '🧊' },
        { e: '🧱', l: 'Tens Rod', t: 'sticker', c: '🧱' },
        { e: '🟦', l: 'Hundreds Flat', t: 'sticker', c: '🟦' },
        { e: '🔴', l: 'Red Chip', t: 'sticker', c: '🔴' },
        { e: '🔵', l: 'Blue Chip', t: 'sticker', c: '🔵' },
        { e: '🟡', l: 'Yellow Chip', t: 'sticker', c: '🟡' },
        { e: '🟢', l: 'Green Chip', t: 'sticker', c: '🟢' },
        { e: '🍕', l: '1/2 Circle', t: 'sticker', c: '🍕' },
        { e: '🍰', l: '1/3 Circle', t: 'sticker', c: '🍰' },
        { e: '🥧', l: '1/4 Circle', t: 'sticker', c: '🥧' },
        { e: '📏', l: 'Number Line', t: 'shape', c: 'number-line' }
      ];
      return items.map(i => (
        <div key={i.l} className="flex flex-col items-center gap-1">
          <button draggable onDragStart={(e) => handleDragStartAsset(e, i.c, i.t as any)} onClick={() => addItem(i.c, i.t as any)} className={stickerBaseClass}>{i.e}</button>
          <span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span>
        </div>
      ));
    }

    if (effectiveCategoryId === 'MEASURE') {
      const items = [
        { e: '📏', l: 'Ruler', t: 'shape', c: 'ruler', m: { vertical: false } },
        { e: '🕒', l: 'Clock', t: 'shape', c: 'clock', m: { hour: 10, minute: 10 } },
        { e: '🧊', l: 'Unit Cube', t: 'shape', c: 'unit-cube', m: { color: 'bg-blue-400' } },
        { e: '🌡️', l: 'Thermometer', t: 'shape', c: 'thermometer', m: { temp: 70 } },
        { e: '⚖️', l: 'Scale', t: 'sticker', c: '⚖️' }
      ];
      return items.map(i => (
        <div key={i.l} className="flex flex-col items-center gap-1">
          <button draggable onDragStart={(e) => handleDragStartAsset(e, i.c, i.t as any, i.m)} onClick={() => addItem(i.c, i.t as any, undefined, undefined, i.m)} className={stickerBaseClass}>{i.e}</button>
          <span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span>
        </div>
      ));
    }

    if (effectiveCategoryId === 'MONEY') {
      const items = [
        { e: '🪙', l: 'Penny', t: 'sticker', c: '🪙' },
        { e: '🥈', l: 'Nickel', t: 'sticker', c: '🥈' },
        { e: '🥇', l: 'Dime', t: 'sticker', c: '🥇' },
        { e: '🥉', l: 'Quarter', t: 'sticker', c: '🥉' },
        { e: '💵', l: '$1 Bill', t: 'sticker', c: '💵' },
        { e: '💸', l: '$5 Bill', t: 'sticker', c: '💸' },
        { e: '💰', l: 'Piggy Bank', t: 'sticker', c: '💰' },
        { e: '💳', l: 'Card', t: 'sticker', c: '💳' },
        { e: '🛒', l: 'Shop', t: 'sticker', c: '🛒' },
        { e: '🏷️', l: 'Price Tag', t: 'sticker', c: '🏷️' },
      ];
      return items.map(i => (
        <div key={i.l} className="flex flex-col items-center gap-1">
          <button draggable onDragStart={(e) => handleDragStartAsset(e, i.c, i.t as any)} onClick={() => addItem(i.c, i.t as any)} className={stickerBaseClass}>{i.e}</button>
          <span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span>
        </div>
      ));
    }

    if (effectiveCategoryId === 'VOCAB') {
      const words = ['Apple', 'Ball', 'Cat', 'Dog', 'Elephant', 'Fish', 'Goat', 'Hat', 'Ice', 'Jar', 'Kite', 'Lion', 'Moon', 'Nest', 'Owl', 'Pig', 'Queen', 'Rabbit', 'Sun', 'Tiger', 'Umbrella', 'Van', 'Web', 'Xylophone', 'Yo-yo', 'Zebra'];
      return (
        <>
          <div className={headerClass}><span>Spelling Words</span></div>
          {words.map(w => <button key={w} draggable onDragStart={(e) => handleDragStartAsset(e, w, 'text')} onClick={() => addItem(w, 'text')} className={wordBaseClass}>{w}</button>)}
          <div className={headerClass}><span>Tools</span></div>
          <div className="flex flex-col items-center gap-1">
            <button draggable onDragStart={(e) => handleDragStartAsset(e, '📖', 'sticker')} onClick={() => addItem('📖', 'sticker')} className={stickerBaseClass}>📖</button>
            <span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">Dictionary</span>
          </div>
        </>
      );
    }

    if (effectiveCategoryId === 'GRAMMAR') {
      const items = [
        { e: 'N', l: 'Noun', t: 'text', c: 'Noun' },
        { e: 'V', l: 'Verb', t: 'text', c: 'Verb' },
        { e: 'Adj', l: 'Adjective', t: 'text', c: 'Adjective' },
        { e: 'Adv', l: 'Adverb', t: 'text', c: 'Adverb' },
        { e: '.', l: 'Period', t: 'text', c: '.' },
        { e: '?', l: 'Question', t: 'text', c: '?' },
        { e: '!', l: 'Exclaim', t: 'text', c: '!' },
        { e: ',', l: 'Comma', t: 'text', c: ',' },
        { e: '"', l: 'Quotes', t: 'text', c: '"' },
        { e: 'A', l: 'Capital', t: 'text', c: 'ABC' },
      ];
      return items.map(i => (
        <div key={i.l} className="flex flex-col items-center gap-1">
          <button draggable onDragStart={(e) => handleDragStartAsset(e, i.c, i.t as any)} onClick={() => addItem(i.c, i.t as any)} className={stickerBaseClass}>{i.e}</button>
          <span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span>
        </div>
      ));
    }

    if (effectiveCategoryId === 'SPEAKING') {
      const items = [
        { e: '🗣️', l: 'Speak', t: 'sticker', c: '🗣️' },
        { e: '👂', l: 'Listen', t: 'sticker', c: '👂' },
        { e: '🎤', l: 'Mic', t: 'sticker', c: '🎤' },
        { e: '📢', l: 'Announce', t: 'sticker', c: '📢' },
        { e: '💬', l: 'Bubble', t: 'sticker', c: '💬' },
        { e: '💭', l: 'Think', t: 'sticker', c: '💭' },
        { e: '🤝', l: 'Agree', t: 'sticker', c: '🤝' },
        { e: '❓', l: 'Ask', t: 'sticker', c: '❓' },
      ];
      return items.map(i => (
        <div key={i.l} className="flex flex-col items-center gap-1">
          <button draggable onDragStart={(e) => handleDragStartAsset(e, i.c, i.t as any)} onClick={() => addItem(i.c, i.t as any)} className={stickerBaseClass}>{i.e}</button>
          <span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span>
        </div>
      ));
    }

    if (effectiveCategoryId === 'WEATHER') {
      const items = [
        { e: '☀️', l: 'Sunny', t: 'sticker', c: '☀️' },
        { e: '🌤️', l: 'Partly', t: 'sticker', c: '🌤️' },
        { e: '☁️', l: 'Cloudy', t: 'sticker', c: '☁️' },
        { e: '🌧️', l: 'Rainy', t: 'sticker', c: '🌧️' },
        { e: '⛈️', l: 'Stormy', t: 'sticker', c: '⛈️' },
        { e: '❄️', l: 'Snowy', t: 'sticker', c: '❄️' },
        { e: '💨', l: 'Windy', t: 'sticker', c: '💨' },
        { e: '🌈', l: 'Rainbow', t: 'sticker', c: '🌈' },
        { e: '🌡️', l: 'Temp', t: 'shape', c: 'thermometer', m: { temp: 70 } },
        { e: '🌸', l: 'Spring', t: 'sticker', c: '🌸' },
        { e: '🌻', l: 'Summer', t: 'sticker', c: '🌻' },
        { e: '🍂', l: 'Fall', t: 'sticker', c: '🍂' },
        { e: '⛄', l: 'Winter', t: 'sticker', c: '⛄' },
      ];
      return items.map(i => (
        <div key={i.l} className="flex flex-col items-center gap-1">
          <button draggable onDragStart={(e) => handleDragStartAsset(e, i.c, i.t as any, i.m)} onClick={() => addItem(i.c, i.t as any, undefined, undefined, i.m)} className={stickerBaseClass}>{i.e}</button>
          <span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span>
        </div>
      ));
    }

    if (effectiveCategoryId === 'SPACE') {
      const items = [
        { e: '☀️', l: 'Sun', t: 'sticker', c: '☀️' },
        { e: '🌍', l: 'Earth', t: 'sticker', c: '🌍' },
        { e: '🌙', l: 'Moon', t: 'sticker', c: '🌙' },
        { e: '⭐', l: 'Star', t: 'sticker', c: '⭐' },
        { e: '🚀', l: 'Rocket', t: 'sticker', c: '🚀' },
        { e: '🪐', l: 'Saturn', t: 'sticker', c: '🪐' },
        { e: '☄️', l: 'Comet', t: 'sticker', c: '☄️' },
        { e: '🛸', l: 'UFO', t: 'sticker', c: '🛸' },
        { e: '🔭', l: 'Telescope', t: 'sticker', c: '🔭' },
        { e: '👨‍🚀', l: 'Astronaut', t: 'sticker', c: '👨‍🚀' },
      ];
      return items.map(i => (
        <div key={i.l} className="flex flex-col items-center gap-1">
          <button draggable onDragStart={(e) => handleDragStartAsset(e, i.c, i.t as any)} onClick={() => addItem(i.c, i.t as any)} className={stickerBaseClass}>{i.e}</button>
          <span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span>
        </div>
      ));
    }

    if (effectiveCategoryId === 'GEOGRAPHY') {
      const items = [
        { e: '🗺️', l: 'Map', t: 'sticker', c: '🗺️' },
        { e: '🌎', l: 'Globe', t: 'sticker', c: '🌎' },
        { e: '📍', l: 'Pin', t: 'sticker', c: '📍' },
        { e: '🧭', l: 'Compass', t: 'sticker', c: '🧭' },
        { e: '🏔️', l: 'Mountain', t: 'sticker', c: '🏔️' },
        { e: '🌊', l: 'Ocean', t: 'sticker', c: '🌊' },
        { e: '🏜️', l: 'Desert', t: 'sticker', c: '🏜️' },
        { e: '🏝️', l: 'Island', t: 'sticker', c: '🏝️' },
        { e: '🏙️', l: 'City', t: 'sticker', c: '🏙️' },
        { e: '🏡', l: 'Town', t: 'sticker', c: '🏡' },
      ];
      return items.map(i => (
        <div key={i.l} className="flex flex-col items-center gap-1">
          <button draggable onDragStart={(e) => handleDragStartAsset(e, i.c, i.t as any)} onClick={() => addItem(i.c, i.t as any)} className={stickerBaseClass}>{i.e}</button>
          <span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span>
        </div>
      ));
    }

    if (effectiveCategoryId === 'CULTURE') {
      const items = [
        { e: '🎎', l: 'Tradition', t: 'sticker', c: '🎎' },
        { e: '🏮', l: 'Festival', t: 'sticker', c: '🏮' },
        { e: '🥘', l: 'Food', t: 'sticker', c: '🥘' },
        { e: '🏛️', l: 'History', t: 'sticker', c: '🏛️' },
        { e: '🏰', l: 'Castle', t: 'sticker', c: '🏰' },
        { e: '⛩️', l: 'Shrine', t: 'sticker', c: '⛩️' },
        { e: '🗿', l: 'Statue', t: 'sticker', c: '🗿' },
        { e: '🌍', l: 'World', t: 'sticker', c: '🌍' },
      ];
      return items.map(i => (
        <div key={i.l} className="flex flex-col items-center gap-1">
          <button draggable onDragStart={(e) => handleDragStartAsset(e, i.c, i.t as any)} onClick={() => addItem(i.c, i.t as any)} className={stickerBaseClass}>{i.e}</button>
          <span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span>
        </div>
      ));
    }

    if (effectiveCategoryId === 'ART_TOOLS') {
      const items = [
        { e: '🎨', l: 'Palette', t: 'sticker', c: '🎨' },
        { e: '🖌️', l: 'Brush', t: 'sticker', c: '🖌️' },
        { e: '🖍️', l: 'Crayon', t: 'sticker', c: '🖍️' },
        { e: '✏️', l: 'Pencil', t: 'sticker', c: '✏️' },
        { e: '🖋️', l: 'Pen', t: 'sticker', c: '🖋️' },
        { e: '🖼️', l: 'Canvas', t: 'sticker', c: '🖼️' },
        { e: '📐', l: 'Ruler', t: 'sticker', c: '📐' },
        { e: '🧼', l: 'Eraser', t: 'sticker', c: '🧼' },
      ];
      return items.map(i => (
        <div key={i.l} className="flex flex-col items-center gap-1">
          <button draggable onDragStart={(e) => handleDragStartAsset(e, i.c, i.t as any)} onClick={() => addItem(i.c, i.t as any)} className={stickerBaseClass}>{i.e}</button>
          <span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span>
        </div>
      ));
    }

    if (effectiveCategoryId === 'COLORS') {
      const items = [
        { e: '🔴', l: 'Red', t: 'sticker', c: '🔴' },
        { e: '🟠', l: 'Orange', t: 'sticker', c: '🟠' },
        { e: '🟡', l: 'Yellow', t: 'sticker', c: '🟡' },
        { e: '🟢', l: 'Green', t: 'sticker', c: '🟢' },
        { e: '🔵', l: 'Blue', t: 'sticker', c: '🔵' },
        { e: '🟣', l: 'Purple', t: 'sticker', c: '🟣' },
        { e: '🟤', l: 'Brown', t: 'sticker', c: '🟤' },
        { e: '⚫', l: 'Black', t: 'sticker', c: '⚫' },
        { e: '⚪', l: 'White', t: 'sticker', c: '⚪' },
        { e: '🌈', l: 'Rainbow', t: 'sticker', c: '🌈' },
        { e: '🏁', l: 'Check', t: 'sticker', c: '🏁' },
        { e: '💠', l: 'Pattern', t: 'sticker', c: '💠' },
      ];
      return items.map(i => (
        <div key={i.l} className="flex flex-col items-center gap-1">
          <button draggable onDragStart={(e) => handleDragStartAsset(e, i.c, i.t as any)} onClick={() => addItem(i.c, i.t as any)} className={stickerBaseClass}>{i.e}</button>
          <span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span>
        </div>
      ));
    }

    if (effectiveCategoryId === 'CRAFTS') {
      const items = [
        { e: '✂️', l: 'Scissors', t: 'sticker', c: '✂️' },
        { e: '🧵', l: 'Thread', t: 'sticker', c: '🧵' },
        { e: '🧶', l: 'Yarn', t: 'sticker', c: '🧶' },
        { e: '🧷', l: 'Pin', t: 'sticker', c: '🧷' },
        { e: '🧩', l: 'Puzzle', t: 'sticker', c: '🧩' },
        { e: '🧸', l: 'Toy', t: 'sticker', c: '🧸' },
        { e: '🪁', l: 'Kite', t: 'sticker', c: '🪁' },
        { e: '🎈', l: 'Balloon', t: 'sticker', c: '🎈' },
      ];
      return items.map(i => (
        <div key={i.l} className="flex flex-col items-center gap-1">
          <button draggable onDragStart={(e) => handleDragStartAsset(e, i.c, i.t as any)} onClick={() => addItem(i.c, i.t as any)} className={stickerBaseClass}>{i.e}</button>
          <span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span>
        </div>
      ));
    }

    if (effectiveCategoryId === 'ARTISTS') {
      const items = [
        { e: '👨‍🎨', l: 'Artist', t: 'sticker', c: '👨‍🎨' },
        { e: '🖼️', l: 'Masterpiece', t: 'sticker', c: '🖼️' },
        { e: '🏛️', l: 'Museum', t: 'sticker', c: '🏛️' },
        { e: '🗿', l: 'Sculpture', t: 'sticker', c: '🗿' },
        { e: '📸', l: 'Photo', t: 'sticker', c: '📸' },
        { e: '🎥', l: 'Film', t: 'sticker', c: '🎥' },
      ];
      return items.map(i => (
        <div key={i.l} className="flex flex-col items-center gap-1">
          <button draggable onDragStart={(e) => handleDragStartAsset(e, i.c, i.t as any)} onClick={() => addItem(i.c, i.t as any)} className={stickerBaseClass}>{i.e}</button>
          <span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span>
        </div>
      ));
    }

    if (effectiveCategoryId === 'INSTRUMENTS') {
      const items = [
        { e: '🎸', l: 'Guitar', t: 'sticker', c: '🎸' },
        { e: '🎹', l: 'Piano', t: 'sticker', c: '🎹' },
        { e: '🎻', l: 'Violin', t: 'sticker', c: '🎻' },
        { e: '🎺', l: 'Trumpet', t: 'sticker', c: '🎺' },
        { e: '🎷', l: 'Sax', t: 'sticker', c: '🎷' },
        { e: '🥁', l: 'Drums', t: 'sticker', c: '🥁' },
        { e: '🪕', l: 'Banjo', t: 'sticker', c: '🪕' },
        { e: '🪗', l: 'Accordion', t: 'sticker', c: '🪗' },
        { e: '🪈', l: 'Flute', t: 'sticker', c: '🪈' },
        { e: '🔔', l: 'Bell', t: 'sticker', c: '🔔' },
      ];
      return items.map(i => (
        <div key={i.l} className="flex flex-col items-center gap-1">
          <button draggable onDragStart={(e) => handleDragStartAsset(e, i.c, i.t as any)} onClick={() => addItem(i.c, i.t as any)} className={stickerBaseClass}>{i.e}</button>
          <span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span>
        </div>
      ));
    }

    if (effectiveCategoryId === 'MUSIC_NOTES') {
      const items = [
        { e: '🎵', l: 'Note', t: 'sticker', c: '🎵' },
        { e: '🎶', l: 'Notes', t: 'sticker', c: '🎶' },
        { e: '🎼', l: 'Staff', t: 'sticker', c: '🎼' },
        { e: '🎹', l: 'Keys', t: 'sticker', c: '🎹' },
        { e: '📻', l: 'Radio', t: 'sticker', c: '📻' },
        { e: '🎧', l: 'Audio', t: 'sticker', c: '🎧' },
        { e: '🔈', l: 'Sound', t: 'sticker', c: '🔈' },
        { e: '🔇', l: 'Mute', t: 'sticker', c: '🔇' },
      ];
      return items.map(i => (
        <div key={i.l} className="flex flex-col items-center gap-1">
          <button draggable onDragStart={(e) => handleDragStartAsset(e, i.c, i.t as any)} onClick={() => addItem(i.c, i.t as any)} className={stickerBaseClass}>{i.e}</button>
          <span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span>
        </div>
      ));
    }

    if (effectiveCategoryId === 'HEALTH') {
      const groups = [
        {
          label: 'Hygiene 🪥',
          items: [
            { e: '🪥', l: 'Brush', t: 'sticker', c: '🪥' },
            { e: '🧼', l: 'Soap', t: 'sticker', c: '🧼' },
            { e: '🚿', l: 'Shower', t: 'sticker', c: '🚿' },
            { e: '🛁', l: 'Bath', t: 'sticker', c: '🛁' },
            { e: '🧴', l: 'Lotion', t: 'sticker', c: '🧴' },
            { e: '🧻', l: 'Paper', t: 'sticker', c: '🧻' },
            { e: '🧺', l: 'Laundry', t: 'sticker', c: '🧺' },
          ]
        },
        {
          label: 'Nutrition 🥗',
          items: [
            { e: '🥗', l: 'Salad', t: 'sticker', c: '🥗' },
            { e: '🍎', l: 'Apple', t: 'sticker', c: '🍎' },
            { e: '🥦', l: 'Broccoli', t: 'sticker', c: '🥦' },
            { e: '🥕', l: 'Carrot', t: 'sticker', c: '🥕' },
            { e: '🍌', l: 'Banana', t: 'sticker', c: '🍌' },
            { e: '🍓', l: 'Berry', t: 'sticker', c: '🍓' },
            { e: '🌽', l: 'Corn', t: 'sticker', c: '🌽' },
            { e: '🥛', l: 'Milk', t: 'sticker', c: '🥛' },
            { e: '🍳', l: 'Eggs', t: 'sticker', c: '🍳' },
            { e: '🥣', l: 'Cereal', t: 'sticker', c: '🥣' },
          ]
        },
        {
          label: 'Emotions 😊',
          items: [
            { e: '😊', l: 'Happy', t: 'sticker', c: '😊' },
            { e: '😢', l: 'Sad', t: 'sticker', c: '😢' },
            { e: '😠', l: 'Angry', t: 'sticker', c: '😠' },
            { e: '😮', l: 'Surprised', t: 'sticker', c: '😮' },
            { e: '😴', l: 'Sleepy', t: 'sticker', c: '😴' },
            { e: '🥳', l: 'Party', t: 'sticker', c: '🥳' },
            { e: '🤢', l: 'Sick', t: 'sticker', c: '🤢' },
            { e: '🤯', l: 'Mind Blown', t: 'sticker', c: '🤯' },
            { e: '🥺', l: 'Please', t: 'sticker', c: '🥺' },
            { e: '😤', l: 'Proud', t: 'sticker', c: '😤' },
            { e: '🧘', l: 'Calm', t: 'sticker', c: '🧘' },
          ]
        },
        {
          label: 'Kindness 🤝',
          items: [
            { e: '🤝', l: 'Help', t: 'sticker', c: '🤝' },
            { e: '❤️', l: 'Love', t: 'sticker', c: '❤️' },
            { e: '🫂', l: 'Hug', t: 'sticker', c: '🫂' },
            { e: '🤲', l: 'Share', t: 'sticker', c: '🤲' },
            { e: '🗣️', l: 'Speak', t: 'sticker', c: '🗣️' },
            { e: '👂', l: 'Listen', t: 'sticker', c: '👂' },
            { e: '🌟', l: 'Star', t: 'sticker', c: '🌟' },
            { e: '✨', l: 'Magic', t: 'sticker', c: '✨' },
          ]
        },
        {
          label: 'Safety 🚦',
          items: [
            { e: '🚦', l: 'Signal', t: 'sticker', c: '🚦' },
            { e: '🛑', l: 'Stop', t: 'sticker', c: '🛑' },
            { e: '🚧', l: 'Caution', t: 'sticker', c: '🚧' },
            { e: '🦺', l: 'Vest', t: 'sticker', c: '🦺' },
            { e: '🚲', l: 'Helmet', t: 'sticker', c: '🚲' },
            { e: '🛟', l: 'Lifebuoy', t: 'sticker', c: '🛟' },
            { e: '🩹', l: 'Bandage', t: 'sticker', c: '🩹' },
            { e: '🚑', l: 'Ambulance', t: 'sticker', c: '🚑' },
            { e: '🚒', l: 'Fire Truck', t: 'sticker', c: '🚒' },
            { e: '👮', l: 'Officer', t: 'sticker', c: '👮' },
          ]
        }
      ];

      return (
        <>
          {groups.map(g => (
            <React.Fragment key={g.label}>
              <div className={headerClass}><span>{g.label}</span></div>
              {g.items.map(i => (
                <div key={i.l} className="flex flex-col items-center gap-1">
                  <button draggable onDragStart={(e) => handleDragStartAsset(e, i.c, i.t as any)} onClick={() => addItem(i.c, i.t as any)} className={stickerBaseClass}>{i.e}</button>
                  <span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span>
                </div>
              ))}
            </React.Fragment>
          ))}
        </>
      );
    }

    if (effectiveCategoryId === 'CALENDAR') {
      const stickers = [
        { e: 'AM', l: 'AM', t: 'text' },
        { e: 'PM', l: 'PM', t: 'text' },
        { e: '🌅', l: 'Morning', t: 'sticker' },
        { e: '☀️', l: 'Afternoon', t: 'sticker' },
        { e: '🌙', l: 'Night', t: 'sticker' },
      ];
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const timeWords = ['Hour', 'Minute', 'Second', 'Day', 'Week', 'Month', 'Year'];
      
      return (
        <>
          <div className={headerClass}><span>Tools</span></div>
          <div className="flex flex-col items-center gap-1">
            <button draggable onDragStart={(e) => handleDragStartAsset(e, 'calendar', 'shape', { month: 2, year: 2026, selectedDays: [] })} onClick={() => addItem('calendar', 'shape', undefined, undefined, { month: 2, year: 2026, selectedDays: [] })} className={stickerBaseClass}>📅</button>
            <span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">Interactive Calendar</span>
          </div>
          <div className={headerClass}><span>Stickers</span></div>
          {stickers.map(i => (
            <div key={i.l} className="flex flex-col items-center gap-1">
              <button draggable onDragStart={(e) => handleDragStartAsset(e, i.e, i.t as any)} onClick={() => addItem(i.e, i.t as any)} className={stickerBaseClass}>{i.e}</button>
              <span className="text-xs font-bold text-slate-400 uppercase text-center leading-tight">{i.l}</span>
            </div>
          ))}
          <div className={headerClass}><span>Day Cards</span></div>
          {days.map(w => <button key={w} draggable onDragStart={(e) => handleDragStartAsset(e, w, 'text')} onClick={() => addItem(w, 'text')} className={wordBaseClass.replace('bg-slate-50', 'bg-blue-50 border-blue-100 text-blue-700')}>{w}</button>)}
          <div className={headerClass}><span>Month Strip</span></div>
          {months.map(w => <button key={w} draggable onDragStart={(e) => handleDragStartAsset(e, w, 'text')} onClick={() => addItem(w, 'text')} className={wordBaseClass.replace('bg-slate-50', 'bg-pink-50 border-pink-100 text-pink-700')}>{w}</button>)}
          <div className={headerClass}><span>Time Words</span></div>
          {timeWords.map(w => <button key={w} draggable onDragStart={(e) => handleDragStartAsset(e, w, 'text')} onClick={() => addItem(w, 'text')} className={wordBaseClass}>{w}</button>)}
        </>
      );
    }

    if (effectiveCategoryId === 'STICKERS') {
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
    if (effectiveCategoryId === 'SHAPES') return [
      '⭕', '⬜', '🔺', '⭐', '❤️', '🟦', '🔶', '🔷', '🛑', '💠', '🪁', '🌙', '☁️', '⚡', '🟢', '🟡', '🟠', '🟣', '🟤', '🖤', '🤍', '🟥', '🟧', '🟨', '🟩', '🟪',
      '💎', '📦', '🔮', '📍', '🚩', '🏁', '🎯', '🎈', '🎨', '🧩', '🧸', '🎲', '♟️', '🃏'
    ].map(s => <button key={s} draggable onDragStart={(e) => handleDragStartAsset(e, s, 'shape')} onClick={() => addItem(s, 'shape')} className={stickerBaseClass}>{s}</button>);
    if (effectiveCategoryId === 'GAMES') return <div className="col-span-4 text-center py-20 text-slate-300 font-bold px-4"><div className="text-6xl mb-4 opacity-50">🎮</div>Games Library coming soon! ✨</div>;

    if (activeCategoryId === 'HISTORY') {
      const hist = (design.whiteboards || []).filter(b => b.conceptId === concept.id);
      if (!hist.length) return <div className="col-span-4 text-center py-12 text-slate-300 font-bold px-4">No history yet. 🕰️</div>;
      return [...hist].reverse().map(b => <div key={b.id} className="col-span-4 flex items-stretch gap-2 mb-2"><button onClick={() => restoreBoardState(b)} className="flex-1 p-4 bg-white border-2 rounded-2xl text-left hover:border-blue-300 shadow-sm transition-all overflow-hidden"><div className="font-black text-slate-800 truncate text-sm">{b.name}</div><div className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-wider">{new Date(b.timestamp).toLocaleDateString()}</div></button><button onClick={() => deleteFromHistory(b.id)} className="w-10 bg-rose-50 border-2 border-rose-100 rounded-xl text-rose-300 hover:text-rose-600 transition-colors flex items-center justify-center">✕</button></div>);
    }
  };

  const filteredMaterials = materials.filter(m => m.subjectId === subjectId);
  const currentSubject = allSubjects.find(s => s.id === subjectId);
  const subjectConcepts = currentSubject?.concepts || [];

  return (
    <div 
      className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden font-['Fredoka']"
      onClick={() => {
        setShowAddArrow(false);
        setShowLibraryArrow(false);
        setShowSwitcherArrow(false);
      }}
    >
      <header className="h-24 bg-white border-b-4 border-slate-100 px-8 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-6 flex-1">
          <button onClick={onBack} className="text-3xl p-3 hover:bg-slate-100 rounded-full transition-colors">⬅️</button>
          <div className="flex flex-col min-w-[150px]">
            <div className="flex items-center gap-3">
              <h1 className="font-black text-slate-900 text-2xl tracking-tight leading-tight truncate max-w-[250px]">{concept.title}</h1>
              {currentBoardName && (
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-sm font-black rounded-md border border-blue-100 uppercase tracking-tighter">
                  Active: {currentBoardName}
                </span>
              )}
            </div>
            <span className="text-sm font-bold text-blue-500 uppercase tracking-widest">{currentSubject?.title}</span>
          </div>

          {/* Concept Switcher for Teacher Mode */}
          {mode === 'teacher' && subjectConcepts.length > 1 && (
            <div className="relative ml-4 flex-1 max-w-[500px] group/switcher">
              <AnimatePresence>
                {showSwitcherArrow && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-4 z-[100] flex flex-col items-center pointer-events-none"
                  >
                    <motion.span 
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-3xl drop-shadow-md mb-1"
                    >
                      ⬆️
                    </motion.span>
                    <div className="bg-green-600 text-white px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl border-2 border-white whitespace-nowrap">
                      Switch Concepts
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div 
                ref={conceptSwitcherRef}
                onMouseDown={handleSwitcherMouseDown}
                onMouseMove={handleSwitcherMouseMove}
                onMouseUp={handleSwitcherStop}
                onMouseLeave={handleSwitcherStop}
                className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border-2 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.4)] overflow-x-auto hide-scrollbar cursor-grab active:cursor-grabbing select-none transition-all duration-500"
              >
                {subjectConcepts.map((c) => (
                  <button
                    key={c.title}
                    onClick={() => {
                      if (!hasMovedSwitcher.current) {
                        onSelectConcept?.(c);
                      }
                    }}
                    className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap pointer-events-auto ${
                      c.title === concept.title 
                        ? 'bg-white text-blue-600 shadow-sm ring-2 ring-blue-100' 
                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                    }`}
                  >
                    {c.icon} {c.title}
                  </button>
                ))}
              </div>
              {/* Fade indicators */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-50 to-transparent pointer-events-none rounded-l-2xl opacity-0 group-hover/switcher:opacity-100 transition-opacity"></div>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none rounded-r-2xl opacity-0 group-hover/switcher:opacity-100 transition-opacity"></div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {mode === 'teacher' ? (
            <button 
              onClick={() => handleSaveBoard(() => onBack())} 
              className={`px-10 py-5 rounded-2xl font-black text-xl border-b-8 transition-all shadow-2xl flex items-center gap-4 ${
                saveStatus === 'saved' ? 'bg-green-500 text-white border-green-700' : 
                saveStatus === 'saving' ? 'bg-green-400 text-white border-green-600 cursor-wait' :
                'bg-green-600 text-white border-green-800 hover:bg-green-500 active:translate-y-2 active:border-b-0'
              }`}
              disabled={saveStatus === 'saving'}
            >
              <span className="text-3xl">{saveStatus === 'saved' ? '✅' : '💾'}</span>
              {saveStatus === 'saved' ? 'Changes Saved!' : saveStatus === 'saving' ? 'Saving...' : 'Save Lesson'}
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <button 
                onClick={handleClearEverything} 
                className="px-6 py-3 bg-slate-100 rounded-xl font-black text-slate-900 text-base border-b-4 border-slate-200 active:translate-y-1 active:border-b-0 transition-all"
              >
                ✨ New
              </button>
              <button 
                onClick={handleSaveBoard} 
                className={`px-8 py-3 rounded-xl font-black text-base border-b-4 transition-all shadow-md flex items-center gap-2 ${
                  saveStatus === 'saved' ? 'bg-green-500 text-white border-green-700' : 
                  saveStatus === 'saving' ? 'bg-blue-400 text-white border-blue-600 cursor-wait' :
                  'bg-blue-500 text-white border-blue-700 active:translate-y-1 active:border-b-0'
                }`}
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saved' ? '✅ Saved!' : saveStatus === 'saving' ? '⏳ Saving...' : '💾 Save'}
              </button>
              <div className="flex gap-2 ml-4 bg-slate-100 p-1.5 rounded-xl">
                 {(['plain', 'lined', 'grid'] as const).map(b => (
                   <button 
                    key={b} 
                    onClick={() => setBoardBg(b)} 
                    className={`p-3 rounded-xl transition-all ${boardBg === b ? 'bg-white shadow-sm ring-2 ring-blue-400' : 'hover:bg-white/50'}`}
                    title={`${b.charAt(0).toUpperCase() + b.slice(1)} Paper`}
                   >
                     <span className="text-xl">{b === 'plain' ? '⬜' : b === 'lined' ? '📝' : '📊'}</span>
                   </button>
                 ))}
                 <div className="w-px h-8 bg-slate-200 mx-1 self-center" />
                 {['#ffffff', '#fefce8', '#f0fdf4', '#eff6ff', '#fdf2f8', '#faf5ff'].map(color => (
                   <button 
                    key={color} 
                    onClick={() => setBoardBgColor(color)} 
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${boardBgColor === color ? 'border-blue-400 scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                   />
                 ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* ASSETS DRAWER (LEFT) */}
        <div className="absolute left-0 top-0 bottom-0 z-[70] w-28 bg-slate-50 border-r-2 border-slate-100 flex flex-col shadow-lg">
          {/* Fixed Add Button at Top (Teacher Mode) */}
          {mode === 'teacher' && (
            <div className="p-4 flex flex-col items-center border-b-2 border-slate-100 relative z-[80]">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSearchingIcons(true);
                  setShowAddArrow(false);
                }}
                className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all bg-blue-50 border-2 border-blue-100 text-blue-500 animate-glow-flow hover:scale-105 active:scale-95 shadow-sm"
              >
                <span className="text-3xl font-black leading-none">➕</span>
                <span className="text-xs font-bold uppercase tracking-tight text-center leading-none px-1">Add</span>
              </button>

              <AnimatePresence>
                {showAddArrow && (
                  <motion.div
                    initial={{ opacity: 0, x: -20, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute left-full ml-4 z-[100] flex items-center pointer-events-none"
                  >
                    <motion.span 
                      animate={{ x: [0, 10, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-4xl drop-shadow-lg"
                    >
                      ⬅️
                    </motion.span>
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-2xl whitespace-nowrap border-2 border-white ml-2 animate-bounce-gentle">
                      Click to add icons!
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Scrollable Categories */}
          <div className="flex-1 overflow-y-auto py-4 flex flex-col items-center gap-3 custom-scrollbar">
            {categories.filter(cat => cat.id !== 'ADD_MATERIAL').map((cat) => (
              <button 
                key={cat.id} 
                onClick={(e) => { 
                  e.stopPropagation();
                  setActiveCategoryId(cat.id); 
                  setDrawerOpen(true); 
                }} 
                className={`w-20 h-20 flex-shrink-0 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all relative group ${
                  activeCategoryId === cat.id && drawerOpen 
                    ? 'bg-white shadow-lg text-blue-500 ring-2 ring-blue-100 scale-105' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                <span className="text-3xl font-black leading-none">{cat.icon}</span>
                <span className="text-xs font-bold uppercase tracking-tight text-center leading-none px-1">{cat.label}</span>
                
                {cat.isCustom && mode === 'teacher' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCustomIcons(prev => prev.filter(ci => ci.id !== cat.id));
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                  >
                    ✕
                  </button>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className={`absolute left-28 top-0 bottom-0 z-[60] bg-white border-r-4 border-slate-100 shadow-2xl transition-transform duration-300 w-80 flex flex-col ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="px-6 py-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
            <h3 className="font-black text-slate-400 text-xs tracking-[0.2em] uppercase truncate">
              {categories.find(c => c.id === activeCategoryId)?.label || (activeCategoryId === 'SONGS' ? 'Songs' : 'Games')} Library
            </h3>
            <button onClick={() => setDrawerOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 grid grid-cols-4 gap-5 content-start custom-scrollbar">
            {renderCategoryContent()}
          </div>
          <button onClick={() => setDrawerOpen(!drawerOpen)} className="absolute left-full top-1/2 -translate-y-1/2 bg-white border-r-4 border-slate-100 p-4 rounded-r-3xl shadow-xl font-black text-xl hover:translate-x-1 transition-all flex items-center justify-center min-w-[56px] border-b-4 border-slate-200">
            {drawerOpen ? '⬅️' : '📦'}
          </button>
        </div>

        {/* MATERIAL LIBRARY (RIGHT) */}
        <div className={`absolute right-0 top-0 bottom-0 z-[65] bg-white border-l-4 border-slate-100 shadow-2xl transition-transform duration-300 w-80 flex flex-col ${libraryOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4 border-b flex justify-between items-center bg-blue-50"><h3 className="font-black text-blue-500 text-xs tracking-widest uppercase flex items-center gap-2"><span className="text-xl">📚</span> Materials</h3><button onClick={() => setLibraryOpen(false)} className="text-slate-300 hover:text-rose-500 font-black">✕</button></div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {!filteredMaterials.length ? <div className="text-center py-12 px-4 opacity-50"><div className="text-5xl mb-4">📂</div><p className="font-black text-slate-400">No subject materials.</p></div> : <div className="space-y-6"><h4 className="px-1 text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${currentSubject?.color || 'bg-blue-400'}`}></span>{currentSubject?.title}</h4><div className="space-y-4">{filteredMaterials.map(m => <button key={m.id} onClick={() => { setActiveMaterial(m); setLibraryOpen(false); }} className="w-full bg-white border-2 rounded-3xl hover:border-blue-400 shadow-sm transition-all flex flex-col overflow-hidden"><div className="h-28 bg-slate-50 flex items-center justify-center">{m.thumbnailUrl ? <img src={m.thumbnailUrl} className="w-full h-full object-cover" /> : <div className="text-5xl">{getFileIcon(m.type)}</div>}</div><div className="p-3 text-left font-black text-slate-900 truncate text-xs">{m.name}</div></button>)}</div></div>}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setLibraryOpen(!libraryOpen);
              setShowLibraryArrow(false);
            }} 
            className="absolute right-full top-1/2 -translate-y-1/2 bg-blue-500 text-white border-l-4 border-blue-700 p-4 rounded-l-3xl shadow-xl font-black text-xl hover:-translate-x-1 transition-all flex items-center justify-center min-w-[56px]"
          >
            {libraryOpen ? '➡️' : '📚'}

            {showLibraryArrow && !libraryOpen && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute right-full mr-4 z-[100] flex items-center pointer-events-none"
                >
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-2xl whitespace-nowrap border-2 border-white mr-2 animate-bounce-gentle">
                    Classroom Materials
                  </div>
                  <motion.span 
                    animate={{ x: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-4xl drop-shadow-lg"
                  >
                    ➡️
                  </motion.span>
                </motion.div>
              </AnimatePresence>
            )}
          </button>
        </div>

        {/* WHITEBOARD MAIN AREA */}
        <main className="flex-1 relative overflow-hidden flex flex-col bg-slate-50" onDrop={handleDropOnBoard} onDragOver={(e) => e.preventDefault()} onWheel={(e) => { e.preventDefault(); handleZoomAt({ sx: e.clientX, sy: e.clientY }, Math.pow(1.1, e.deltaY > 0 ? -1 : 1)); }}>
          <AnimatePresence>
            {showTransition && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, y: -20 }}
                className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none"
              >
                <div className="bg-white/40 backdrop-blur-sm px-12 py-6 rounded-[3rem] border-4 border-white/50 shadow-2xl flex flex-col items-center gap-4">
                  <span className="text-8xl drop-shadow-2xl">{concept.icon}</span>
                  <h2 className="text-6xl font-black text-slate-800 tracking-tighter uppercase drop-shadow-lg">{concept.title}</h2>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {activeMaterial && <div className="absolute z-[90] pointer-events-auto shadow-2xl transition-opacity animate-material-enter" style={{ left: materialPos.x, top: materialPos.y, width: 'min(900px, 92vw)', height: 'min(750px, 85vh)' }}><div className="bg-white w-full h-full rounded-[2.5rem] border-8 border-white flex flex-col overflow-hidden shadow-2xl ring-4 ring-black/5"><div className="flex items-center justify-between p-4 bg-slate-50 cursor-move border-b-2" onMouseDown={handleMaterialMouseDown}><div className="flex items-center gap-3"><div className="text-2xl">{getFileIcon(activeMaterial.type)}</div><div><h4 className="font-black text-slate-900 text-xs tracking-tight truncate max-w-[200px]">{activeMaterial.name}</h4></div></div><button onClick={() => setActiveMaterial(null)} className="w-10 h-10 bg-white rounded-xl shadow border-2 flex items-center justify-center text-lg hover:bg-rose-50 hover:text-rose-500 transition-all">✕</button></div><div className="flex-1 bg-white flex items-center justify-center overflow-hidden">{activeMaterial.type === 'video' ? (materialUrl && <video src={materialUrl} controls className="max-w-full max-h-full" autoPlay />) : (materialUrl && <iframe src={materialUrl} className="w-full h-full border-none bg-white" title={activeMaterial.name} />)}</div></div></div>}
          <div className="absolute top-4 right-4 z-[70] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full font-black text-slate-900 text-xs shadow-lg border-2 border-slate-100 select-none">{Math.round(viewport.zoom * 100)}%</div>
          <div className={`flex-1 relative touch-none select-none ${activeTool === 'select' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`} onMouseDown={startInteraction} onMouseMove={performInteraction} onMouseUp={stopInteraction} onMouseLeave={stopInteraction} onTouchStart={startInteraction} onTouchMove={performInteraction} onTouchEnd={stopInteraction} style={{ touchAction: 'none' }}>
            <div className={`absolute inset-0 origin-top-left ${boardBg === 'lined' ? 'board-lined' : boardBg === 'grid' ? 'board-grid' : ''}`} style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`, backgroundPosition: '0 0', backgroundSize: `50px 50px`, width: '2000px', height: '2000px', backgroundColor: boardBgColor }}>
              <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
              {items.map(item => (
                <div key={item.id} className="absolute z-10 select-none group pointer-events-auto" style={{ left: item.x, top: item.y, transform: `translate(-50%, -50%) scale(${item.scale})` }} onMouseDown={(e) => handleItemMouseDown(e, item)}>
                  <div className={`relative p-4 rounded-3xl border-4 transition-all ${selectedItemId === item.id ? 'border-blue-400 bg-blue-500/10' : 'border-transparent'} ${activeTool === 'select' ? 'hover:border-blue-400' : ''}`}>
                    {item.type === 'song' ? (
                      <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border-4 border-pink-100 flex items-center gap-6 min-w-[320px] pointer-events-auto">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-inner ${activeSong?.id === item.id && songPlaying ? 'bg-pink-100 animate-bounce-gentle' : 'bg-slate-50'}`}>
                          {item.metadata?.icon || '🎵'}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="font-black text-slate-800 truncate text-lg">{item.metadata?.title || 'Song'}</div>
                          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">{item.metadata?.artist || 'Artist'}</div>
                        </div>
                        <button 
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlaySong({ id: item.id, url: item.content, title: item.metadata.title, icon: item.metadata.icon, category: '' });
                          }}
                          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${activeSong?.id === item.id && songPlaying ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-pink-50 hover:text-pink-500'}`}
                        >
                          {activeSong?.id === item.id && songPlaying ? '⏸️' : '▶️'}
                        </button>
                      </div>
                    ) : item.type === 'shape' && item.content === 'ten-frame' ? (
                      <div className="w-[400px] h-[160px] border-4 border-slate-300 grid grid-cols-5 grid-rows-2 bg-white shadow-inner rounded-xl overflow-hidden">
                        {Array.from({length: 10}).map((_, i) => (
                          <div key={i} className="border-2 border-slate-100 flex items-center justify-center" />
                        ))}
                      </div>
                    ) : item.type === 'shape' && item.content === 'number-line' ? (
                      <div className="w-[800px] h-20 flex flex-col items-center justify-center pointer-events-none">
                        <div className="w-full h-1 bg-slate-400 relative">
                          {Array.from({length: 21}).map((_, i) => (
                            <div key={i} className="absolute top-0 w-0.5 h-4 bg-slate-400 -translate-y-1/2" style={{ left: `${(i / 20) * 100}%` }}>
                              <span className="absolute top-6 left-1/2 -translate-x-1/2 text-sm font-bold text-slate-500">{i}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : item.type === 'shape' && item.content === 'clock' ? (
                      <div className="w-64 h-64 bg-white rounded-full border-8 border-slate-800 relative shadow-2xl flex items-center justify-center pointer-events-auto clock-container">
                        {/* Minute Ticks */}
                        {Array.from({length: 60}).map((_, i) => {
                          const angle = i * 6 * (Math.PI / 180);
                          const isFiveMin = i % 5 === 0;
                          const length = isFiveMin ? 12 : 6;
                          const thickness = isFiveMin ? 'w-1' : 'w-0.5';
                          const x = Math.sin(angle) * (110 - length / 2);
                          const y = -Math.cos(angle) * (110 - length / 2);
                          return (
                            <div 
                              key={i} 
                              className={`absolute ${thickness} bg-slate-300 rounded-full`} 
                              style={{ 
                                height: `${length}px`,
                                transform: `translate(${x}px, ${y}px) rotate(${i * 6}deg)` 
                              }} 
                            />
                          );
                        })}
                        {/* Clock Numbers */}
                        {Array.from({length: 12}).map((_, i) => {
                          const angle = (i + 1) * 30 * (Math.PI / 180);
                          const x = Math.sin(angle) * 90;
                          const y = -Math.cos(angle) * 90;
                          return (
                            <div key={i} className="absolute font-black text-slate-800 text-xl pointer-events-none" style={{ transform: `translate(${x}px, ${y}px)` }}>
                              {i + 1}
                            </div>
                          );
                        })}
                        {/* Hour Hand */}
                        <div 
                          onMouseDown={(e) => handleClockHandMouseDown(e, item.id, 'hour')}
                          className="absolute w-4 h-20 bg-slate-800 rounded-full origin-bottom bottom-1/2 transition-transform duration-75 cursor-pointer hover:bg-blue-600 z-20" 
                          style={{ transform: `rotate(${(item.metadata?.hour || 0) * 30 + (item.metadata?.minute || 0) * 0.5}deg)` }} 
                        />
                        {/* Minute Hand */}
                        <div 
                          onMouseDown={(e) => handleClockHandMouseDown(e, item.id, 'minute')}
                          className="absolute w-2.5 h-28 bg-slate-500 rounded-full origin-bottom bottom-1/2 transition-transform duration-75 cursor-pointer hover:bg-blue-400 z-20" 
                          style={{ transform: `rotate(${(item.metadata?.minute || 0) * 6}deg)` }} 
                        />
                        <div className="absolute w-6 h-6 bg-slate-800 rounded-full z-30" />
                        
                        {selectedItemId === item.id && (
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                            Drag hands to set time! 🕒
                          </div>
                        )}
                      </div>
                    ) : item.type === 'shape' && item.content === 'ruler' ? (
                      <div 
                        className={`bg-yellow-100 border-2 border-yellow-300 shadow-lg relative pointer-events-auto transition-all duration-300 rounded-lg ${item.metadata?.vertical ? 'w-20 h-[600px]' : 'w-[600px] h-20'}`}
                      >
                        {/* Ruler Marks */}
                        <div className={`absolute inset-0 flex ${item.metadata?.vertical ? 'flex-col' : 'flex-row'}`}>
                          {Array.from({length: item.metadata?.vertical ? 24 : 12}).map((_, i) => (
                            <div key={i} className={`flex-1 border-slate-400/30 flex ${item.metadata?.vertical ? 'border-b flex-row justify-between items-center px-2' : 'border-r flex-col justify-between items-center py-2'}`}>
                              <span className="text-xs font-black text-slate-500">{i}</span>
                              <div className={`flex ${item.metadata?.vertical ? 'flex-col gap-1' : 'flex-row gap-1'}`}>
                                {Array.from({length: 4}).map((_, j) => (
                                  <div key={j} className={`bg-slate-400/50 ${item.metadata?.vertical ? 'h-px w-2' : 'w-px h-2'}`} />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className={`absolute ${item.metadata?.vertical ? 'top-2 right-2' : 'bottom-2 right-2'} flex gap-2`}>
                           <button 
                            onMouseDown={e => e.stopPropagation()}
                            onClick={() => updateItemMetadata(item.id, { vertical: !item.metadata?.vertical })}
                            className="bg-white/80 backdrop-blur p-2 rounded-xl shadow-sm border border-slate-200 text-xs hover:bg-white transition-all"
                           >
                             🔄 Rotate
                           </button>
                        </div>
                      </div>
                    ) : item.type === 'shape' && item.content === 'unit-cube' ? (
                      <div className={`w-10 h-10 ${item.metadata?.color || 'bg-blue-400'} border-2 border-white/50 shadow-md rounded-sm flex items-center justify-center pointer-events-auto relative`}>
                        <div className="w-6 h-6 border border-white/20 rounded-sm shadow-inner" />
                        {(() => {
                          const info = getCubeClusterInfo(item);
                          if (info && info.isTopLeft) {
                            return (
                              <div className="absolute -top-8 left-0 bg-slate-800 text-white px-2 py-0.5 rounded-md text-xs font-black whitespace-nowrap shadow-xl z-50">
                                {info.width > 1 && info.height > 1 ? `${info.width} × ${info.height} = ${info.total}` : info.total}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ) : item.type === 'shape' && item.content === 'thermometer' ? (
                      <div className="w-16 h-64 bg-slate-100 rounded-full border-4 border-slate-300 relative shadow-xl flex flex-col items-center py-4 pointer-events-auto thermometer-container">
                        <div 
                          onMouseDown={(e) => handleThermometerMouseDown(e, item.id)}
                          className="w-6 flex-1 bg-white rounded-full relative overflow-hidden border-2 border-slate-200 cursor-ns-resize thermo-tube"
                        >
                          <div 
                            className="absolute bottom-0 w-full bg-red-500 transition-all duration-75" 
                            style={{ height: `${item.metadata?.temp || 0}%` }} 
                          />
                          {/* Scale Marks */}
                          <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-20">
                            {Array.from({length: 11}).map((_, i) => (
                              <div key={i} className="w-full h-px bg-slate-900" />
                            ))}
                          </div>
                        </div>
                        <div className="w-10 h-10 bg-red-500 rounded-full mt-[-6px] border-4 border-slate-100 shadow-md z-10" />
                        
                        {selectedItemId === item.id && (
                          <div className="absolute -right-16 top-1/2 -translate-y-1/2 flex flex-col items-center bg-slate-800 text-white p-2 rounded-xl shadow-2xl border border-slate-700 pointer-events-none">
                            <span className="text-sm font-black">{item.metadata?.temp || 0}°</span>
                            <span className="text-xs uppercase font-bold text-slate-400">Temp</span>
                          </div>
                        )}
                      </div>
                    ) : item.type === 'shape' && item.content === 'measuring-cup' ? (
                      <div className="w-32 h-40 bg-white/30 backdrop-blur-sm border-4 border-slate-300 rounded-b-3xl relative shadow-xl pointer-events-auto flex flex-col-reverse overflow-hidden">
                        <div 
                          className="bg-blue-400/60 transition-all duration-500" 
                          style={{ height: `${((item.metadata?.fill || 0) / (item.metadata?.capacity || 1)) * 100}%` }} 
                        />
                        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                          <div className="text-xs font-black text-slate-500 uppercase">{item.metadata?.capacity} Cup</div>
                          <div className="flex-1 border-l-2 border-slate-300/50 my-2 relative">
                            <div className="absolute top-1/4 left-0 w-2 h-px bg-slate-300" />
                            <div className="absolute top-1/2 left-0 w-4 h-px bg-slate-300" />
                            <div className="absolute top-3/4 left-0 w-2 h-px bg-slate-300" />
                          </div>
                        </div>
                        {selectedItemId === item.id && (
                          <div className="absolute -right-12 top-0 bottom-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur p-2 rounded-xl shadow-lg border border-slate-100" onMouseDown={e => e.stopPropagation()}>
                            <input 
                              type="range" 
                              min="0" 
                              max={item.metadata?.capacity || 1} 
                              step="0.0625"
                              value={item.metadata?.fill || 0} 
                              onChange={(e) => updateItemMetadata(item.id, { fill: parseFloat(e.target.value) }, true)}
                              className="h-24 appearance-none bg-slate-200 rounded-full w-2"
                              style={{ WebkitAppearance: 'slider-vertical' } as any}
                            />
                          </div>
                        )}
                      </div>
                    ) : item.type === 'shape' && item.content === 'calendar' ? (
                      <div className="w-[400px] bg-white rounded-3xl shadow-2xl border-4 border-slate-100 overflow-hidden pointer-events-auto">
                        <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
                          <button onClick={(e) => { e.stopPropagation(); updateItemMetadata(item.id, { month: ((item.metadata?.month || 1) + 10) % 12 + 1 }); }} className="hover:scale-110 transition-transform">◀️</button>
                          <div className="text-center">
                            <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][(item.metadata?.month || 1) - 1]}
                            </div>
                            <div className="text-xl font-black">{item.metadata?.year || 2026}</div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); updateItemMetadata(item.id, { month: (item.metadata?.month || 1) % 12 + 1 }); }} className="hover:scale-110 transition-transform">▶️</button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 p-4">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="text-center text-xs font-black text-slate-300 py-2">{d}</div>)}
                          {Array.from({length: new Date(item.metadata?.year || 2026, item.metadata?.month || 1, 0).getDate()}).map((_, i) => {
                            const day = i + 1;
                            const isSelected = item.metadata?.selectedDays?.includes(day);
                            return (
                              <button 
                                key={i} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const selectedDays = item.metadata?.selectedDays || [];
                                  const newSelected = selectedDays.includes(day) 
                                    ? selectedDays.filter((d: number) => d !== day)
                                    : [...selectedDays, day];
                                  updateItemMetadata(item.id, { selectedDays: newSelected });
                                }}
                                className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all ${isSelected ? 'bg-blue-500 text-white shadow-lg scale-110' : 'hover:bg-slate-50 text-slate-600'}`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            {item.metadata?.selectedDays?.length || 0} Days Selected
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateItemMetadata(item.id, { selectedDays: [] }); }}
                            className="text-xs font-black text-blue-500 uppercase hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className={`block pointer-events-none ${item.type === 'text' ? 'text-7xl font-black text-slate-900' : 'text-9xl'}`}>{item.content}</span>
                    )}
                    {activeTool === 'select' && selectedItemId === item.id && (
                      <><button 
                        onMouseDown={(e) => { e.stopPropagation(); removeItem(item.id); }} 
                        className="absolute -top-3 -right-3 w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-xl font-black text-xl border-4 border-white z-[100] cursor-pointer hover:scale-110 transition-transform"
                      >
                        🗑️
                      </button>
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

      {isSearchingIcons && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSearchingIcons(false)} />
          <div className="bg-white w-full max-w-4xl h-[80vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden relative animate-material-enter">
            <div className="p-8 border-b-2 border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Add Classroom Icons</h2>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Select icons to add to your sidebar</p>
              </div>
              <button onClick={() => setIsSearchingIcons(false)} className="w-12 h-12 bg-white rounded-2xl shadow-sm border-2 border-slate-100 flex items-center justify-center text-xl hover:bg-rose-50 hover:text-rose-500 transition-all">✕</button>
            </div>
            
            <div className="p-6 bg-white border-b-2 border-slate-50">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search all topic icons (e.g. 'Lion', 'Ruler', 'A')..."
                  value={iconSearchQuery}
                  onChange={(e) => setIconSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:border-blue-400 transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-6 gap-4">
                {CATEGORY_TEMPLATES.filter(cat => 
                  cat.label.toLowerCase().includes(iconSearchQuery.toLowerCase())
                ).map((cat, idx) => {
                  const isAlreadyAdded = customIcons.some(ci => ci.id === cat.id);
                  return (
                    <button 
                      key={idx}
                      onClick={() => {
                        if (isAlreadyAdded) {
                          setCustomIcons(prev => prev.filter(ci => ci.id !== cat.id));
                        } else {
                          setCustomIcons(prev => [...prev, cat]);
                        }
                      }}
                      className={`aspect-square rounded-3xl border-4 transition-all flex flex-col items-center justify-center gap-2 relative group ${isAlreadyAdded ? 'border-blue-400 bg-blue-50 shadow-inner' : 'border-slate-100 bg-white hover:border-blue-200 hover:scale-105 shadow-sm'}`}
                    >
                      <span className="text-4xl">{cat.icon}</span>
                      <span className="text-xs font-black uppercase text-slate-400 tracking-tighter text-center px-1 truncate w-full">{cat.label}</span>
                      {isAlreadyAdded && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg border-2 border-white">✓</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="p-8 bg-slate-50 border-t-2 border-slate-100 flex justify-end">
              <button 
                onClick={() => setIsSearchingIcons(false)}
                className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

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
        @keyframes glow-flow {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        .animate-glow-flow { animation: glow-flow 2s infinite; }
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
