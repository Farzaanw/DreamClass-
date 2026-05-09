import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Concept, ClassroomDesign, BoardItem, Whiteboard, MaterialFile, Subject, Song, AppMode } from '../types';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { STICKERS, VC_WORDS, CV_WORDS, REGULAR_SIGHT_WORDS, IRREGULAR_SIGHT_WORDS, CONSONANT_DIGRAPHS, VOWEL_DIGRAPHS } from '../constants';
import { supabase } from '../lib/supabase';
import { STORAGE_BUCKETS, buildWhiteboardSnapshotPath, createSignedUrl, uploadFileToStorage } from '../lib/storage';

interface ConceptDashboardProps {
  concept: Concept;
  design: ClassroomDesign;
  subjectId: string;
  materials: MaterialFile[];
  allSubjects: Subject[];
  onBack: () => void;
  onSaveDesign: (design: ClassroomDesign) => void;
  onSelectConcept?: (concept: Concept) => void;
  onUpdateMaterials?: (materials: MaterialFile[]) => void;
  onNavigateToMaterials?: (subjectId: string) => void;
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
  ...(Array.from({ length: 50 }, (_, i) => ({ label: `Number ${i + 1}`, content: (i + 1).toString(), type: 'text' }))),
  ...(['➕', '➖', '✖️', '➗', '=', '<', '>', '≤', '≥', '(', ')', '%', '√', 'π', '∞'].map(s => ({ label: `Symbol ${s}`, content: s, type: 'text' }))),
  { label: 'Ruler', content: 'ruler', type: 'shape', display: '📏', metadata: { vertical: false } },
  { label: 'Clock', content: 'clock', type: 'shape', display: '🕒', metadata: { hour: 10, minute: 10 } },
  { label: 'Unit Cube', content: 'unit-cube', type: 'shape', display: '🧊', metadata: { color: 'bg-blue-400' } },
  { label: 'Thermometer', content: 'thermometer', type: 'shape', display: '🌡️', metadata: { temp: 70 } },
  { label: 'Calendar', content: 'calendar', type: 'shape', display: '📅', metadata: { month: 2, year: 2026, selectedDays: [] } },
  // Science
  { label: 'Plant', content: '🌱', type: 'sticker' },
  { label: 'Non-Living', content: '🪨', type: 'sticker' },
  { label: 'Water', content: '💧', type: 'sticker' },
  { label: 'Sun', content: '☀️', type: 'sticker' },
  { label: 'Air', content: '💨', type: 'sticker' },
  { label: 'Shelter', content: '🏠', type: 'sticker' },
  { label: 'Food', content: '🍎', type: 'sticker' },
  { label: 'Ocean', content: '🌊', type: 'sticker' },
  { label: 'Animal', content: '🦁', type: 'sticker' },
  { label: 'Volcano', content: '🌋', type: 'sticker' },
  { label: 'Hygiene', content: '🪥', type: 'sticker' },
  { label: 'Nutrition', content: '🥗', type: 'sticker' },
  { label: 'Emotions', content: '😊', type: 'sticker' },
  { label: 'Kindness', content: '🤝', type: 'sticker' },
  { label: 'Safety', content: '🚦', type: 'sticker' },
];

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf': return '📄';
    case 'slides': return '📊';
    case 'video': return '🎬';
    default: return '📁';
  }
};

const SUBJECT_CATEGORY_MAP: Record<string, string[]> = {
  'reading': ['UPPER', 'LOWER', 'BLENDS', 'SIGHT', 'DIGRAPHS', 'VOCAB', 'GRAMMAR', 'SPEAKING'],
  'literacy': ['UPPER', 'LOWER', 'BLENDS', 'SIGHT', 'DIGRAPHS', 'VOCAB', 'GRAMMAR', 'SPEAKING'],
  'phonics': ['UPPER', 'LOWER', 'BLENDS', 'SIGHT', 'DIGRAPHS'],
  'math': ['NUMBERS', 'SYMBOLS', 'SHAPES', 'MEASURE', 'MONEY', 'CALENDAR', 'MANIPULATIVES'],
  'science': ['LIVING', 'ANIMALS', 'ECOSYSTEMS', 'WEATHER', 'SPACE', 'GEOGRAPHY'],
  'nature': ['LIVING', 'ANIMALS', 'ECOSYSTEMS', 'WEATHER'],
  'social studies': ['GEOGRAPHY', 'CULTURE', 'HISTORY'],
  'geography': ['GEOGRAPHY'],
  'history': ['HISTORY'],
  'art': ['ART_TOOLS', 'COLORS', 'CRAFTS', 'ARTISTS'],
  'music': ['INSTRUMENTS', 'MUSIC_NOTES'],
  'health': ['HEALTH'],
  'pe': ['HEALTH'],
};

const ConceptDashboard: React.FC<ConceptDashboardProps> = ({
  concept,
  design,
  subjectId,
  materials,
  allSubjects,
  onBack,
  onSaveDesign,
  onSelectConcept,
  onUpdateMaterials,
  onNavigateToMaterials,
  userSongs = [],
  mode
}) => {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [undoStack, setUndoStack] = useState<{ items: BoardItem[], drawing: string | null }[]>([]);

  const [activeTool, setActiveTool] = useState<'select' | 'marker' | 'highlighter' | 'eraser' | 'boxSelect'>('select');
  const [markerColor, setMarkerColor] = useState(MARKER_COLORS[0].value);
  const [highlighterColor, setHighlightColor] = useState(HIGHLIGHTER_COLORS[0].value);
  const [showColorPicker, setShowColorPicker] = useState<'marker' | 'highlighter' | null>(null);
  const mainContentRef = useRef<HTMLElement>(null);

  const [boardBg, setBoardBg] = useState<'plain' | 'lined' | 'grid'>('plain');
  const [boardBgColor, setBoardBgColor] = useState<string>('#ffffff');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [droppedItemId, setDroppedItemId] = useState<string | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<MaterialFile | null>(null);
  const [itemToRemove, setItemToRemove] = useState<MaterialFile | null>(null);
  const [materialUrl, setMaterialUrl] = useState<string | null>(null);
  const [materialPos, setMaterialPos] = useState({ x: 50, y: 50 });
  const isDraggingMaterial = useRef(false);
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [currentBoardName, setCurrentBoardName] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [historyLimit, setHistoryLimit] = useState(20);
  const [globalSpinnerNames, setGlobalSpinnerNames] = useState<string[]>(design.spinnerNames || []);

  const [isNamingModalOpen, setIsNamingModalOpen] = useState(false);
  const [namingModalInput, setNamingModalInput] = useState("");
  const [pendingSaveSuccessCallback, setPendingSaveSuccessCallback] = useState<(() => void) | null>(null);
  const [showSaveGlow, setShowSaveGlow] = useState(false);
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);
  const namingInputRef = useRef<HTMLInputElement>(null);

  const [isDeleteHistoryModalOpen, setIsDeleteHistoryModalOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<{ id: string, name: string } | null>(null);

  // Group box state
  const [groups, setGroups] = useState<{ id: string, itemIds: string[], minimized: boolean }[]>([]);
  const [boxSelectRect, setBoxSelectRect] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
  const isBoxSelectingRef = useRef(false);
  const boxSelectStartRef = useRef<{ wx: number, wy: number } | null>(null);

  const onSaveDesignRef = useRef(onSaveDesign);
  useEffect(() => {
    onSaveDesignRef.current = onSaveDesign;
  }, [onSaveDesign]);

  const buildBoardSnapshot = (opts?: { includeDrawing?: boolean }): Whiteboard => {
    const includeDrawing = !!opts?.includeDrawing;
    const boardId = currentBoardId || `auto-${concept.id}`;
    const boardName = currentBoardName || `Lesson ${new Date().toLocaleTimeString()}`;
    const existingDrawing = design.conceptBoards?.[concept.id]?.drawingData;
    const existingDrawingStoragePath = design.conceptBoards?.[concept.id]?.drawingStoragePath;
    const existingDrawingSignedUrl = design.conceptBoards?.[concept.id]?.drawingSignedUrl;
    const drawingData = includeDrawing && canvasRef.current
      ? canvasRef.current.toDataURL('image/jpeg', 0.45)
      : existingDrawing;

    return {
      id: boardId,
      conceptId: concept.id,
      name: boardName,
      timestamp: Date.now(),
      items: [...items],
      bg: boardBg,
      bgColor: boardBgColor,
      viewport: { ...viewport },
      customIcons: [...customIcons],
      hiddenDrawerItems: [...hiddenDrawerItems],
      customDrawerLabels: { ...customDrawerLabels },
      drawingData,
      drawingStoragePath: existingDrawingStoragePath,
      drawingSignedUrl: existingDrawingSignedUrl
    };
  };

  const buildBoardSignature = (board: Whiteboard | undefined) => {
    if (!board) return '';
    return JSON.stringify({
      id: board.id,
      conceptId: board.conceptId,
      itemCount: board.items?.length || 0,
      itemIds: (board.items || []).map(i => i.id),
      bg: board.bg,
      bgColor: board.bgColor,
      viewport: board.viewport,
      customIconCount: board.customIcons?.length || 0,
      hiddenCount: board.hiddenDrawerItems?.length || 0,
      labelKeys: Object.keys(board.customDrawerLabels || {})
    });
  };

  useEffect(() => {
    if (design.spinnerNames && JSON.stringify(design.spinnerNames) !== JSON.stringify(globalSpinnerNames)) {
      setGlobalSpinnerNames(design.spinnerNames);
    }
  }, [design.spinnerNames]);

  // Persist global spinner names to design whenever they change
  useEffect(() => {
    const currentNames = design.spinnerNames || [];
    if (JSON.stringify(currentNames) !== JSON.stringify(globalSpinnerNames)) {
      onSaveDesignRef.current({ ...design, spinnerNames: globalSpinnerNames });
    }
  }, [globalSpinnerNames, design]);

  const [customIcons, setCustomIcons] = useState<any[]>([]);
  const [availableCustomIcons, setAvailableCustomIcons] = useState<any[]>(design.availableCustomIcons || []);
  const [visibleAssetCount, setVisibleAssetCount] = useState(9);
  const [hiddenDrawerItems, setHiddenDrawerItems] = useState<string[]>([]);
  const [deletedItemsHistory, setDeletedItemsHistory] = useState<string[]>([]);
  const [customDrawerLabels, setCustomDrawerLabels] = useState<Record<string, string[]>>({});
  const [isSearchingIcons, setIsSearchingIcons] = useState(false);
  const [iconSearchQuery, setIconSearchQuery] = useState('');
  const [isCreatingCustomIcon, setIsCreatingCustomIcon] = useState(false);
  const [customIconTab, setCustomIconTab] = useState<'text' | 'image'>('text');
  const [activeEmojiPicker, setActiveEmojiPicker] = useState<'main' | 'item' | null>(null);
  const [textItemInput, setTextItemInput] = useState('');
  const [customIconForm, setCustomIconForm] = useState<{
    icon: string;
    label: string;
    items: { type: 'text' | 'sticker'; content: string; label: string }[];
  }>({
    icon: '⭐',
    label: '',
    items: []
  });

  const EMOJI_LIST = [
    '⭐', '🌟', '✨', '🔥', '🌈', '🎨', '🎭', '🎪', '🎫', '🎬',
    '🍎', '🍋', '🍇', '🍓', '🍕', '🍔', '🍦', '🍩', '🍪', '🍫',
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸',
    '🚗', '🚕', '🚙', '🚌', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚',
    '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪',
    '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖱️', '🕹️', '🗜️', '💽', '💾',
    '📚', '📖', '📒', '📔', '📕', '📗', '📘', '📙', '📓', '📋',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇'
  ];
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string | null>(null);

  const [showTransition, setShowTransition] = useState(false);
  const [showAddArrow, setShowAddArrow] = useState(mode === 'teacher');
  const [showLibraryArrow, setShowLibraryArrow] = useState(mode === 'teacher');
  const [showSwitcherArrow, setShowSwitcherArrow] = useState(mode === 'teacher');
  const [showSaveArrow, setShowSaveArrow] = useState(mode === 'teacher');

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

  const currentSubject = useMemo(() => {
    return allSubjects.find(s => s.id === subjectId) || allSubjects.find(s => s.title?.toLowerCase() === subjectId?.toLowerCase());
  }, [allSubjects, subjectId]);

  const categories = useMemo(() => {
    const commonTail = [
      { id: 'STICKERS', label: 'Stickers', icon: '✨' },
      { id: 'SONGS', label: 'Songs', icon: '🎵' },
      { id: 'GAMES', label: 'Games', icon: '🎮' },
      { id: 'HISTORY', label: 'History', icon: '🕰️' }
    ];

    const subjectName = currentSubject?.title?.toLowerCase() || subjectId?.toLowerCase() || '';

    let relevantCategoryIds: string[] = [];

    // Check for keywords in subject name
    for (const [keyword, catIds] of Object.entries(SUBJECT_CATEGORY_MAP)) {
      if (subjectName.includes(keyword)) {
        relevantCategoryIds = [...new Set([...relevantCategoryIds, ...catIds])];
      }
    }

    // Default categories if no keywords found
    if (relevantCategoryIds.length === 0) {
      if (subjectId === 'phonics' || subjectName.includes('reading') || subjectName.includes('literacy')) {
        relevantCategoryIds = ['UPPER', 'LOWER', 'BLENDS', 'SIGHT', 'DIGRAPHS'];
      } else if (subjectId === 'math' || subjectName.includes('math') || subjectName.includes('number')) {
        relevantCategoryIds = ['NUMBERS', 'SYMBOLS', 'MEASURE', 'CALENDAR', 'SHAPES'];
      } else if (subjectId === 'science' || subjectName.includes('science') || subjectName.includes('nature')) {
        relevantCategoryIds = ['LIVING', 'ANIMALS', 'ECOSYSTEMS', 'WEATHER'];
      } else {
        // Fallback for unknown subjects: show a mix of basic categories
        relevantCategoryIds = ['UPPER', 'LOWER', 'NUMBERS', 'SHAPES', 'STICKERS'];
      }
    }

    const baseCategories = CATEGORY_TEMPLATES.filter(cat => relevantCategoryIds.includes(cat.id) && !customIcons.some(ci => ci.id === cat.id));

    const customCats = customIcons.map(ci => ({
      id: ci.id,
      label: ci.label,
      icon: ci.icon,
      isCustom: true,
      items: ci.items
    }));

    const addMaterialBtn = mode === 'teacher' ? [{ id: 'ADD_MATERIAL', label: 'Add', icon: '➕' }] : [];

    // Ensure we don't duplicate commonTail if they are already in baseCategories
    const filteredCommonTail = commonTail.filter(ct => !relevantCategoryIds.includes(ct.id) && !customIcons.some(ci => ci.id === ct.id));

    return [
      ...addMaterialBtn,
      ...customCats,
      ...baseCategories,
      ...filteredCommonTail
    ];
  }, [subjectId, currentSubject, customIcons, mode]);

  const [activeCategoryId, setActiveCategoryId] = useState<string>(categories[0]?.id || 'STICKERS');

  useEffect(() => {
    setVisibleAssetCount(10);
  }, [activeCategoryId, activeSubCategoryId]);

  useEffect(() => {
    setActiveSubCategoryId(null);
  }, [activeCategoryId]);

  useEffect(() => {
    if (!categories.find(c => c.id === activeCategoryId)) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  // Handle Timer Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setItems(prev => {
        let hasChanges = false;
        const newItems = prev.map(item => {
          if (item.type === 'timer' && item.metadata?.isRunning && item.metadata?.timeLeft > 0) {
            hasChanges = true;
            const newTime = item.metadata.timeLeft - 1;

            // Play sound when time is up
            if (newTime === 0) {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => { });
            }

            return { ...item, metadata: { ...item.metadata, timeLeft: newTime, isRunning: newTime > 0 } };
          }
          return item;
        });
        return hasChanges ? newItems : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [spinnerInputs, setSpinnerInputs] = useState<Record<string, string>>({});
  const getCenter = () => ({ x: window.innerWidth / 2 - 3500, y: window.innerHeight / 2 - 3500, zoom: 1 });
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });

  const stickerBaseClass = "w-full aspect-square bg-white rounded-2xl shadow-sm border-2 border-slate-100 font-black text-slate-900 text-5xl flex items-center justify-center hover:scale-110 hover:border-blue-500 hover:ring-4 hover:ring-blue-400/30 hover:shadow-xl active:scale-95 active:ring-[6px] active:ring-blue-500/60 active:border-blue-600 active:bg-blue-50 active:shadow-[0_0_24px_rgba(59,130,246,0.45)] transition-all cursor-pointer overflow-hidden p-2 m-0.5";
  const letterBaseClass = stickerBaseClass.replace('text-5xl', 'text-4xl');
  const wordBaseClass = "col-span-2 bg-white rounded-2xl shadow-sm border-2 border-slate-100 font-bold text-slate-800 text-lg py-4 px-3 flex items-center justify-center hover:scale-105 hover:border-blue-500 hover:ring-4 hover:ring-blue-400/30 hover:shadow-xl active:scale-95 active:ring-[6px] active:ring-blue-500/60 active:border-blue-600 active:bg-blue-50 active:shadow-[0_0_24px_rgba(59,130,246,0.45)] transition-all cursor-pointer text-center truncate min-h-[64px]";
  const headerClass = "col-span-4 mt-8 mb-4 text-lg font-black uppercase text-slate-400 tracking-[0.2em] border-b-2 border-slate-50 pb-2 flex items-center gap-2";
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
      if (canvas.width !== 7000) canvas.width = 7000;
      if (canvas.height !== 7000) canvas.height = 7000;
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
          if (savedState.hiddenDrawerItems) setHiddenDrawerItems(savedState.hiddenDrawerItems);
          if (savedState.customDrawerLabels) setCustomDrawerLabels(savedState.customDrawerLabels);

          const drawingSrc = savedState.drawingSignedUrl || savedState.drawingData;
          if (drawingSrc) {
            const img = new Image();
            img.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
            };
            img.src = drawingSrc;
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        } else {
          setItems([]);
          setBoardBg('plain');
          setBoardBgColor('#ffffff');
          setViewport(getCenter());
          setCurrentBoardId(null);
          setCurrentBoardName(null);
          setCustomIcons([]);
          setHiddenDrawerItems([]);
          setDeletedItemsHistory([]);
          setCustomDrawerLabels({});
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
  }, [concept.id]);

  useEffect(() => {
    let url: string | null = null;
    const resolve = async () => {
      if (!activeMaterial) {
        setMaterialUrl(null);
        return;
      }
      if (activeMaterial.signedUrl) {
        setMaterialUrl(activeMaterial.signedUrl);
        return;
      }
      if (activeMaterial.storagePath) {
        try {
          const signed = await createSignedUrl(STORAGE_BUCKETS.materials, activeMaterial.storagePath);
          setMaterialUrl(signed);
          return;
        } catch {
          // fall through to legacy content
        }
      }
      if (activeMaterial.content?.startsWith('data:')) {
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
        } catch {
          setMaterialUrl(activeMaterial.content);
        }
      } else if (activeMaterial.content) {
        setMaterialUrl(activeMaterial.content);
      } else {
        setMaterialUrl(null);
      }
    };
    resolve();
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [activeMaterial]);

  useEffect(() => {
    if (activeMaterial && !materials.some(m => m.id === activeMaterial.id)) {
      setActiveMaterial(null);
    }
  }, [materials, activeMaterial]);

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
    if (activeSong?.id === song.id) {
      if (songPlaying) {
        songAudioRef.current?.pause();
        setSongPlaying(false);
      } else {
        songAudioRef.current?.play();
        setSongPlaying(true);
      }
    } else {
      if (songAudioRef.current) {
        songAudioRef.current.pause();
        songAudioRef.current = null;
      }
      const audio = new Audio(song.url);
      audio.play().catch(err => console.error("Playback failed:", err));
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
      const drawingSrc = board.drawingSignedUrl || board.drawingData;
      if (drawingSrc) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = drawingSrc;
      }
    }
    setSelectedItemId(null);
  };

  const deleteFromHistory = (boardId: string) => {
    const updatedWhiteboards = (design.whiteboards || []).filter(b => b.id !== boardId);
    const updatedConceptBoards = { ...(design.conceptBoards || {}) };
    Object.keys(updatedConceptBoards).forEach(key => {
      if (updatedConceptBoards[key].id === boardId) delete updatedConceptBoards[key];
    });
    onSaveDesign({ ...design, whiteboards: updatedWhiteboards, conceptBoards: updatedConceptBoards });

    // Reset active whiteboard space to default blank
    setItems([]);
    if (contextRef.current && canvasRef.current) contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setViewport({ x: 0, y: 0, zoom: 1 });
    setUndoStack([]);
    setSelectedItemId(null);
    setCurrentBoardId(null);
    setCurrentBoardName(null);
    setIsDeleteHistoryModalOpen(false);
    setBoardToDelete(null);
  };

  const screenToWorld = (sx: number, sy: number) => ({
    wx: (sx - viewport.x) / viewport.zoom,
    wy: (sy - viewport.y) / viewport.zoom
  });

  const startInteraction = (getEvent: any) => {
    if (isDraggingMaterial.current) return;
    const nativeEvent = getEvent.nativeEvent || getEvent;

    if (nativeEvent.type === 'touchstart' && nativeEvent.touches && nativeEvent.touches.length === 2) {
      const touch1 = nativeEvent.touches[0];
      const touch2 = nativeEvent.touches[1];
      lastTouchDistance.current = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      return; // Handled by pinch-to-zoom
    }
    lastTouchDistance.current = null;

    const coords = getScreenCoordinates(nativeEvent);
    if (activeTool === 'boxSelect') {
      const worldCoords = screenToWorld(coords.sx, coords.sy);
      boxSelectStartRef.current = worldCoords;
      isBoxSelectingRef.current = true;
      setBoxSelectRect({ x1: worldCoords.wx, y1: worldCoords.wy, x2: worldCoords.wx, y2: worldCoords.wy });
    } else if (activeTool === 'select') {
      isPanningRef.current = true;
      lastPanPos.current = { x: coords.sx, y: coords.sy };
      // Clear selection if clicking on the background (canvas or the background div)
      const target = nativeEvent.target as HTMLElement;
      if (target.classList.contains('board-lined') || target.classList.contains('board-grid') || target.tagName === 'CANVAS' || target.classList.contains('bg-white')) {
        setSelectedItemId(null);
        setGroups([]);
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

    if (nativeEvent.type === 'touchmove' && nativeEvent.touches && nativeEvent.touches.length === 2) {
      const touch1 = nativeEvent.touches[0];
      const touch2 = nativeEvent.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      if (lastTouchDistance.current !== null) {
        const factor = dist / lastTouchDistance.current;
        const cx = (touch1.clientX + touch2.clientX) / 2;
        const cy = (touch1.clientY + touch2.clientY) / 2;
        const rect = getEvent.currentTarget.getBoundingClientRect();
        handleZoomAt({ sx: cx - rect.left, sy: cy - rect.top }, factor);
      }
      lastTouchDistance.current = dist;
      return;
    }

    if (nativeEvent.type === 'mousemove' && !(nativeEvent.buttons & 1)) {
      if (isDrawingRef.current) stopInteraction();
      return;
    }
    const coords = getScreenCoordinates(nativeEvent);
    if (isBoxSelectingRef.current && boxSelectStartRef.current) {
      const worldCoords = screenToWorld(coords.sx, coords.sy);
      setBoxSelectRect({ x1: boxSelectStartRef.current.wx, y1: boxSelectStartRef.current.wy, x2: worldCoords.wx, y2: worldCoords.wy });
    } else if (isPanningRef.current) {
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
    lastTouchDistance.current = null;
    if (isBoxSelectingRef.current && boxSelectRect) {
      const x1 = Math.min(boxSelectRect.x1, boxSelectRect.x2);
      const y1 = Math.min(boxSelectRect.y1, boxSelectRect.y2);
      const x2 = Math.max(boxSelectRect.x1, boxSelectRect.x2);
      const y2 = Math.max(boxSelectRect.y1, boxSelectRect.y2);
      if (Math.abs(x2 - x1) > 20 && Math.abs(y2 - y1) > 20) {
        const enclosed = items.filter(it => it.x >= x1 && it.x <= x2 && it.y >= y1 && it.y <= y2);
        if (enclosed.length > 0) {
          setGroups(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), itemIds: enclosed.map(it => it.id), minimized: false }]);
        }
      }
      setBoxSelectRect(null);
      boxSelectStartRef.current = null;
      isBoxSelectingRef.current = false;
      setActiveTool('select');
      return;
    }
    if (isDrawingRef.current && contextRef.current) contextRef.current.closePath();
    isPanningRef.current = false;
    isDrawingRef.current = false;
  };

  const handleGroupMouseDown = (e: React.MouseEvent, group: { id: string, itemIds: string[], minimized: boolean }) => {
    e.stopPropagation();
    saveToUndoStack();
    const startX = e.clientX, startY = e.clientY;
    let hasDragged = false;
    const initialPositions = items.filter(it => group.itemIds.includes(it.id)).map(it => ({ id: it.id, x: it.x, y: it.y }));
    const handleMouseMove = (mv: MouseEvent) => {
      if (Math.abs(mv.clientX - startX) > 3 || Math.abs(mv.clientY - startY) > 3) hasDragged = true;
      const dx = (mv.clientX - startX) / viewport.zoom;
      const dy = (mv.clientY - startY) / viewport.zoom;
      setItems(prev => prev.map(it => {
        const init = initialPositions.find(p => p.id === it.id);
        if (init) return { ...it, x: init.x + dx, y: init.y + dy };
        return it;
      }));
    };
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (!hasDragged) {
        setGroups(prev => prev.filter(g => g.id !== group.id));
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleGroupResizeMouseDown = (e: React.MouseEvent, group: { id: string, itemIds: string[], minimized: boolean }) => {
    e.stopPropagation();
    if (group.minimized) return;
    saveToUndoStack();
    const startX = e.clientX;
    const initialItems = items.filter(it => group.itemIds.includes(it.id));
    if (initialItems.length === 0) return;

    // Find the center of the group
    const xs = initialItems.map(it => it.x);
    const ys = initialItems.map(it => it.y);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;

    const initialData = initialItems.map(it => ({ id: it.id, scale: it.scale, x: it.x, y: it.y }));
    const handleMouseMove = (mv: MouseEvent) => {
      const scaleFactor = Math.max(0.2, 1 + (startX - mv.clientX) / (100 * viewport.zoom));
      setItems(prev => prev.map(it => {
        const init = initialData.find(p => p.id === it.id);
        if (init) {
          const newX = centerX + (init.x - centerX) * scaleFactor;
          const newY = centerY + (init.y - centerY) * scaleFactor;
          return { ...it, scale: init.scale * scaleFactor, x: newX, y: newY };
        }
        return it;
      }));
    };
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const getGroupBounds = (group: { id: string, itemIds: string[] }) => {
    const groupItems = items.filter(it => group.itemIds.includes(it.id));
    if (groupItems.length === 0) return null;
    const padding = 60;
    const xs = groupItems.map(it => it.x);
    const ys = groupItems.map(it => it.y);
    return {
      x: Math.min(...xs) - padding,
      y: Math.min(...ys) - padding,
      w: Math.max(...xs) - Math.min(...xs) + padding * 2,
      h: Math.max(...ys) - Math.min(...ys) + padding * 2,
    };
  };

  const handleZoomAt = (screenCoords: { sx: number, sy: number }, factor: number) => {
    setViewport(prev => {
      const newZoom = Math.min(Math.max(prev.zoom * factor, 0.1), 5);
      const worldPos = { x: (screenCoords.sx - prev.x) / prev.zoom, y: (screenCoords.sy - prev.y) / prev.zoom };
      return { zoom: newZoom, x: screenCoords.sx - worldPos.x * newZoom, y: screenCoords.sy - worldPos.y * newZoom };
    });
  };

  const hideItem = (categoryId: string, itemKey: string) => {
    const fullKey = `${categoryId}:${itemKey}`;
    setHiddenDrawerItems(prev => [...prev, fullKey]);
    setDeletedItemsHistory(prev => [...prev, fullKey]);
  };

  const undoHideItem = () => {
    if (deletedItemsHistory.length === 0) return;
    const lastDeleted = deletedItemsHistory[deletedItemsHistory.length - 1];
    setHiddenDrawerItems(prev => prev.filter(item => item !== lastDeleted));
    setDeletedItemsHistory(prev => prev.slice(0, -1));
  };

  const addCustomLabel = (categoryId: string) => {
    const label = window.prompt("Enter text for your custom label:");
    if (label) {
      setCustomDrawerLabels(prev => ({
        ...prev,
        [categoryId]: [...(prev[categoryId] || []), label]
      }));
    }
  };

  const removeCustomLabel = (categoryId: string, index: number) => {
    setCustomDrawerLabels(prev => ({
      ...prev,
      [categoryId]: prev[categoryId].filter((_, i) => i !== index)
    }));
  };

  const renderDrawerItem = (categoryId: string, itemKey: string, content: string, type: string, label?: string, metadata?: any, isCustom = false, customIndex?: number) => {
    const fullKey = `${categoryId}:${itemKey}`;
    if (hiddenDrawerItems.includes(fullKey)) return null;

    const baseClass = type === 'text' ? wordBaseClass : stickerBaseClass;

    return (
      <div key={fullKey} className="relative group/drawer-item flex flex-col items-center gap-1">
        <button
          draggable
          onDragStart={(e) => handleDragStartAsset(e, content, type as any, metadata)}
          onClick={() => addItem(content, type as any, undefined, undefined, metadata)}
          className={baseClass}
        >
          {content}
        </button>
        {label && label.toLowerCase() !== content.toLowerCase() && type !== 'sticker' && type !== 'image' && <span className="text-base font-bold text-slate-400 uppercase text-center leading-tight">{label}</span>}

        {mode === 'teacher' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isCustom && customIndex !== undefined) {
                removeCustomLabel(categoryId, customIndex);
              } else {
                hideItem(categoryId, itemKey);
              }
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg opacity-0 group-hover/drawer-item:opacity-100 transition-opacity z-10"
          >
            ✕
          </button>
        )}
      </div>
    );
  };

  const renderDrawerControls = (categoryId: string) => {
    if (mode !== 'teacher' || categoryId === 'STICKERS') return null;
    const hasDeleted = deletedItemsHistory.some(h => h.startsWith(`${categoryId}:`));

    return (
      <div className="col-span-4 flex items-center gap-2 mb-4">
        <button
          onClick={() => addCustomLabel(categoryId)}
          className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-xs uppercase tracking-widest border-2 border-blue-100 hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
        >
          <span>➕ Add Label</span>
        </button>
        {hasDeleted && (
          <button
            onClick={undoHideItem}
            className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl font-black text-xs uppercase tracking-widest border-2 border-slate-100 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
          >
            <span>↩️ Undo</span>
          </button>
        )}
      </div>
    );
  };

  const renderCustomLabels = (categoryId: string) => {
    const labels = (customDrawerLabels[categoryId] || []).filter(l => {
      const forbidden = ['one', 'come', 'said', 'sad'];
      return !forbidden.includes(l.toLowerCase().trim());
    });
    return labels.map((l, i) => renderDrawerItem(categoryId, `custom-${i}`, l, 'text', undefined, undefined, true, i));
  };

  const getScreenCoordinates = (event: any) => {
    const rect = canvasRef.current?.closest('main')?.getBoundingClientRect() || { left: 0, top: 0 };
    if (event.touches && event.touches.length > 0) return { sx: event.touches[0].clientX - rect.left, sy: event.touches[0].clientY - rect.top };
    return { sx: (event.clientX || event.pageX) - rect.left, sy: (event.clientY || event.pageY) - rect.top };
  };

  const addItem = (content: string, type: BoardItem['type'] = 'emoji', screenX?: number, screenY?: number, metadata?: any) => {
    if (items.length >= 400) {
      alert('Board limit reached (400 items). Remove some items before adding more.');
      return;
    }
    if (type === 'spinner') {
      metadata = { ...metadata, names: metadata?.names || globalSpinnerNames };
    }
    if (type === 'sticker') {
      const stickerCount = items.filter(it => it.type === 'sticker').length;
      if (stickerCount >= 8) {
        alert("You can only place up to 8 stickers at a time!");
        return;
      }
    }
    saveToUndoStack();

    // Improved non-stacking logic: Use a grid-like sequence for default placement
    const gridCols = 4;
    const spacing = 120;
    const index = items.length % 12; // Cycle through 12 positions
    const col = index % gridCols;
    const row = Math.floor(index / gridCols);

    const defaultX = (window.innerWidth * 0.4) + (col * spacing);
    const defaultY = (window.innerHeight * 0.3) + (row * spacing);

    const worldPos = screenToWorld(screenX !== undefined ? screenX : defaultX, screenY !== undefined ? screenY : defaultY);
    const newItem: BoardItem = { id: Math.random().toString(36).substr(2, 9), content, type, x: worldPos.wx, y: worldPos.wy, scale: 1, rotation: 0, metadata };
    setItems(prev => [...prev, newItem]);

    // Briefly highlight dropped item
    setDroppedItemId(newItem.id);
    setTimeout(() => {
      setDroppedItemId(prev => prev === newItem.id ? null : prev);
    }, 1500);
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
    setItems(prev => {
      const newItems = prev.map(item => item.id === id ? { ...item, metadata: { ...item.metadata, ...newMetadata } } : item);

      // Sync global spinner names if a spinner was updated
      const updatedItem = newItems.find(it => it.id === id);
      if (updatedItem?.type === 'spinner' && newMetadata.names) {
        setGlobalSpinnerNames(newMetadata.names);

        // Adjust size if more than 8 names
        const nameCount = newMetadata.names.length;
        if (nameCount > 8) {
          const extra = (nameCount - 8) * 15;
          updatedItem.width = 300 + extra;
          updatedItem.height = 400 + extra;
        } else {
          updatedItem.width = 300;
          updatedItem.height = 400;
        }
      }

      return newItems;
    });
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
    const materialId = e.dataTransfer.getData('materialId');
    const metadataStr = e.dataTransfer.getData('metadata');
    const metadata = metadataStr ? JSON.parse(metadataStr) : undefined;
    const rect = e.currentTarget.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    const dropY = e.clientY - rect.top;

    if (materialId) {
      const material = materials.find(m => m.id === materialId);
      if (material) {
        setMaterialPos({ x: dropX, y: dropY });
        setActiveMaterial(material);
        setLibraryOpen(false);
      }
      return;
    }

    if (content) addItem(content, type, dropX, dropY, metadata);
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

  // Auto-save whiteboard items and basic state.
  // Avoid capturing drawing image here; canvas serialization is expensive and causes UI hitches on concept switching.
  useEffect(() => {
    if (mode === 'teacher' || mode === 'classroom') {
      const timer = setTimeout(() => {
        // Only auto-save if we have something to save
        if (items.length === 0 && boardBg === 'plain' && viewport.x === 0 && viewport.y === 0 && viewport.zoom === 1) return;

        const newBoard = buildBoardSnapshot({ includeDrawing: false });

        const existingWhiteboards = design.whiteboards || [];
        const updatedWhiteboards = existingWhiteboards.some(b => b.id === newBoard.id)
          ? existingWhiteboards.map(b => b.id === newBoard.id ? newBoard : b)
          : [...existingWhiteboards, newBoard];

        // Lightweight change detection (avoids deep stringifying huge drawing payloads)
        const currentSavedBoard = design.conceptBoards?.[concept.id];
        const hasChanged = buildBoardSignature(currentSavedBoard) !== buildBoardSignature(newBoard);

        if (hasChanged) {
          onSaveDesignRef.current({
            ...design,
            whiteboards: updatedWhiteboards,
            conceptBoards: { ...(design.conceptBoards || {}), [concept.id]: newBoard }
          });
        }
      }, 3000); // 3 second debounce for auto-save
      return () => clearTimeout(timer);
    }
  }, [items, boardBg, boardBgColor, viewport, customIcons, hiddenDrawerItems, customDrawerLabels, currentBoardId, currentBoardName, concept.id, mode, design]);

  const executeSaveBoard = async (boardId: string, boardName: string, onSuccess?: () => void) => {
    setSaveStatus('saving');

    // Capture the full state including the drawing layer
    // We flatten onto a white background to avoid "black" JPEGs from transparency
    let drawingSnapshot: string | undefined = undefined;
    let drawingBlob: Blob | null = null;
    if (canvasRef.current) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvasRef.current.width;
      tempCanvas.height = canvasRef.current.height;
      const tCtx = tempCanvas.getContext('2d');
      if (tCtx) {
        tCtx.fillStyle = '#ffffff'; // White background
        tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tCtx.drawImage(canvasRef.current, 0, 0);
        drawingSnapshot = tempCanvas.toDataURL('image/jpeg', 0.5);
        drawingBlob = await new Promise((resolve) => tempCanvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.5));
      }
    }

    let drawingStoragePath: string | undefined = undefined;
    let drawingSignedUrl: string | undefined = undefined;
    const newBoard: Whiteboard = {
      id: boardId,
      conceptId: concept.id,
      name: boardName,
      timestamp: Date.now(),
      items: [...items],
      bg: boardBg,
      bgColor: boardBgColor,
      drawingData: drawingSnapshot,
      drawingStoragePath,
      drawingSignedUrl,
      viewport: { ...viewport },
      customIcons: [...customIcons],
      hiddenDrawerItems: [...hiddenDrawerItems],
      customDrawerLabels: { ...customDrawerLabels }
    };

    // 1. Update Cloud (Supabase)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (drawingBlob) {
        try {
          if (drawingBlob.size > 2 * 1024 * 1024) {
            console.warn('Whiteboard snapshot exceeded 2MB target; saving without snapshot.');
            drawingBlob = null;
          }
        } catch {
          // no-op
        }
      }
      if (drawingBlob) {
        try {
          drawingStoragePath = buildWhiteboardSnapshotPath(user.id, subjectId, boardId);
          await uploadFileToStorage(STORAGE_BUCKETS.whiteboards, drawingStoragePath, drawingBlob, 'image/jpeg');
          drawingSignedUrl = await createSignedUrl(STORAGE_BUCKETS.whiteboards, drawingStoragePath);
          newBoard.drawingStoragePath = drawingStoragePath;
          newBoard.drawingSignedUrl = drawingSignedUrl;
          newBoard.drawingData = undefined;
        } catch (err) {
          console.error('Error uploading whiteboard snapshot:', err);
        }
      }
      // Exclude values that have their own columns
      const { id, conceptId, name, timestamp, drawingData, ...data } = newBoard;

      const { error } = await supabase
        .from('whiteboards')
        .upsert({
          id: boardId,
          user_id: user.id,
          subject_id: subjectId,
          concept_id: concept.id,
          name: boardName,
          data: data,
          drawing_data: null,
          timestamp: Date.now()
        });

      if (error) console.error('Error saving whiteboard to Supabase:', error);
    }

    // 2. Update local state
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

    // Trigger Success Glow
    setShowSaveGlow(true);
    setTimeout(() => setShowSaveGlow(false), 2000);

    if (onSuccess) {
      onSuccess();
    } else {
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleSaveBoard = (onSuccess?: () => void) => {
    // If we have a current board, skip naming and just overwrite (for preparation flow)
    if (currentBoardId) {
      executeSaveBoard(currentBoardId, currentBoardName || "Prepared Lesson", onSuccess);
      return true;
    }

    setNamingModalInput(`Lesson ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    setPendingSaveSuccessCallback(() => onSuccess);
    setIsNamingModalOpen(true);
    setTimeout(() => namingInputRef.current?.focus(), 200);
    return false;
  };

  const handleClearEverything = () => {
    setIsNewBoardModalOpen(true);
  };

  const executeClearEverything = (saveFirst: boolean) => {
    const clearAction = () => {
      setItems([]);
      if (contextRef.current && canvasRef.current) contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setViewport({ x: 0, y: 0, zoom: 1 });
      setUndoStack([]);
      setSelectedItemId(null);
      setCurrentBoardId(null);
      setCurrentBoardName(null);
      const updatedConceptBoards = { ...(design.conceptBoards || {}) };
      delete updatedConceptBoards[concept.id];
      onSaveDesign({ ...design, conceptBoards: updatedConceptBoards });
      setIsNewBoardModalOpen(false);
    };

    if (saveFirst) {
      handleSaveBoard(clearAction);
    } else {
      clearAction();
    }
  };

  const handleMaterialMouseDown = (e: React.MouseEvent) => {
    isDraggingMaterial.current = true;
    const startX = e.clientX, startY = e.clientY, initialX = materialPos.x, initialY = materialPos.y;
    const onMouseMove = (mv: MouseEvent) => setMaterialPos({ x: initialX + (mv.clientX - startX), y: initialY + (mv.clientY - startY) });
    const onMouseUp = () => { isDraggingMaterial.current = false; window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const renderAssetList = (categoryId: string, items: any[], renderFn: (item: any) => React.ReactNode) => {
    return (
      <>
        {items.map(renderFn)}
      </>
    );
  };

  const renderCategoryContent = () => {
    const effectiveCategoryId = activeSubCategoryId || activeCategoryId;

    if (effectiveCategoryId === 'UPPER') return (
      <>
        {renderDrawerControls(effectiveCategoryId)}
        {renderAssetList(effectiveCategoryId, "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), (l) => renderDrawerItem(effectiveCategoryId, l, l, 'text'))}
        {renderCustomLabels(effectiveCategoryId)}
      </>
    );
    if (effectiveCategoryId === 'LOWER') return (
      <>
        {renderDrawerControls(effectiveCategoryId)}
        {renderAssetList(effectiveCategoryId, "abcdefghijklmnopqrstuvwxyz".split(""), (l) => renderDrawerItem(effectiveCategoryId, l, l, 'text'))}
        {renderCustomLabels(effectiveCategoryId)}
      </>
    );
    if (effectiveCategoryId === 'BLENDS') {
      const allItems = [
        ...VC_WORDS.map(w => ({ e: w, l: w, t: 'text' })),
        ...CV_WORDS.map(w => ({ e: w, l: w, t: 'text' }))
      ];
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, allItems, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t as any, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
    }
    if (effectiveCategoryId === 'SIGHT') {
      const allItems = [
        ...REGULAR_SIGHT_WORDS.map(w => ({ e: w, l: w, t: 'text' })),
        ...IRREGULAR_SIGHT_WORDS.map(w => ({ e: w, l: w, t: 'text' }))
      ];
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, allItems, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t as any, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
    }
    if (effectiveCategoryId === 'DIGRAPHS') {
      const allItems = [
        ...CONSONANT_DIGRAPHS.map(w => ({ e: w, l: w, t: 'text' })),
        ...VOWEL_DIGRAPHS.map(w => ({ e: w, l: w, t: 'text' }))
      ];
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, allItems, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t as any, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
    }
    if (effectiveCategoryId === 'NUMBERS') return (
      <>
        {renderDrawerControls(effectiveCategoryId)}
        {renderAssetList(effectiveCategoryId, Array.from({ length: 100 }, (_, i) => i + 1), (n) => renderDrawerItem(effectiveCategoryId, n.toString(), n.toString(), 'text'))}
        {renderCustomLabels(effectiveCategoryId)}
      </>
    );

    if (effectiveCategoryId === 'SYMBOLS') return (
      <>
        {renderDrawerControls(effectiveCategoryId)}
        {renderAssetList(effectiveCategoryId, ['➕', '➖', '✖️', '➗', '=', '<', '>', '≤', '≥', '(', ')', '%', '√', 'π', '∞'], (s) => renderDrawerItem(effectiveCategoryId, s, s, 'text'))}
        {renderCustomLabels(effectiveCategoryId)}
      </>
    );

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
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, items, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
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
        { e: '🦊', l: 'Fox', t: 'sticker' },
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
      const allItems = [...bgs, ...types, ...cycles, ...specific, ...dinosaurs];
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, allItems, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
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
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, items, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
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
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, items, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t as any, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
    }

    if (effectiveCategoryId === 'MEASURE') {
      const items = [
        { e: '📏', l: 'Ruler', t: 'shape', c: 'ruler', m: { vertical: false } },
        { e: '🕒', l: 'Clock', t: 'shape', c: 'clock', m: { hour: 10, minute: 10 } },
        { e: '🧊', l: 'Unit Cube', t: 'shape', c: 'unit-cube', m: { color: 'bg-blue-400' } },
        { e: '🌡️', l: 'Thermometer', t: 'shape', c: 'thermometer', m: { temp: 70 } },
        { e: '⚖️', l: 'Scale', t: 'sticker', c: '⚖️' }
      ];
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, items, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t as any, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
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
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, items, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t as any, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
    }

    if (effectiveCategoryId === 'VOCAB') {
      const words = ['Apple', 'Ball', 'Cat', 'Dog', 'Elephant', 'Fish', 'Goat', 'Hat', 'Ice', 'Jar', 'Kite', 'Lion', 'Moon', 'Nest', 'Owl', 'Pig', 'Queen', 'Rabbit', 'Sun', 'Tiger', 'Umbrella', 'Van', 'Web', 'Xylophone', 'Yo-yo', 'Zebra'];
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, words, (w) => renderDrawerItem(effectiveCategoryId, w, w, 'text'))}
          {renderCustomLabels(effectiveCategoryId)}
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
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, items, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t as any, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
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
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, items, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t as any, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
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
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, items, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t as any, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
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
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, items, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t as any, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
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
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, items, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t as any, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
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
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, items, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t as any, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
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
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, items, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t as any, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
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
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, items, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t as any, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
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
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, items, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t as any, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
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
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, items, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t as any, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
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
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, items, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t as any, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
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
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, items, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t as any, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
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
      const allItems = groups.flatMap(g => g.items);
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, allItems, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t as any, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
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
      const allItems = [
        { e: '📅', l: 'Calendar', t: 'shape', c: 'calendar', m: { month: 2, year: 2026, selectedDays: [] } },
        ...stickers,
        ...days.map(d => ({ e: d, l: d, t: 'text' })),
        ...months.map(m => ({ e: m, l: m, t: 'text' })),
        ...timeWords.map(t => ({ e: t, l: t, t: 'text' }))
      ];

      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, allItems, (i) => renderDrawerItem(effectiveCategoryId, i.l, i.e, i.t as any, i.l))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
    }

    if (effectiveCategoryId === 'STICKERS') {
      return (
        <>
          {renderAssetList(effectiveCategoryId, STICKERS, (s) => renderDrawerItem(effectiveCategoryId, s.id, s.emoji, 'sticker'))}
        </>
      );
    }

    const customCat = customIcons.find(ci => ci.id === effectiveCategoryId);
    if (customCat && customCat.items) {
      const filteredItems = (customCat.items || []).filter((i: any) => {
        const forbidden = ['one', 'come', 'said', 'sad'];
        const content = typeof i.content === 'string' ? i.content.toLowerCase().trim() : '';
        const label = typeof i.label === 'string' ? i.label.toLowerCase().trim() : '';
        return !forbidden.includes(content) && !forbidden.includes(label);
      });
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, filteredItems, (i) => renderDrawerItem(effectiveCategoryId, i.label, i.content, i.type, i.label))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
    }

    if (effectiveCategoryId === 'SONGS') {
      const filteredSongs = (userSongs || []).filter(s => s.assignedSubjectIds?.includes(subjectId));
      if (filteredSongs.length === 0) return <div className="col-span-4 text-center py-12 text-slate-300 font-bold px-4">No songs in your library for this subject. 🎵</div>;

      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {filteredSongs.map(s => (
            <div key={s.id} className="col-span-4 flex items-center gap-3 p-3 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-200 transition-all shadow-sm group">
              <button
                onClick={() => handlePlaySong(s)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${activeSong?.id === s.id && songPlaying ? 'bg-blue-500 text-white animate-pulse' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}
              >
                {activeSong?.id === s.id && songPlaying ? '⏸️' : '▶️'}
              </button>
              <div className="flex-1 min-w-0">
                <div className="font-black text-slate-800 truncate text-base">{s.title}</div>
                <div className="text-sm text-slate-400 font-bold uppercase tracking-wider">{s.category}</div>
              </div>
              <span className="text-2xl opacity-40 group-hover:opacity-100 transition-opacity">{s.icon}</span>
            </div>
          ))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
    }

    if (effectiveCategoryId === 'SHAPES') {
      const shapes = [
        '⭕', '⬜', '🔺', '⭐', '❤️', '🟦', '🔶', '🔷', '🛑', '💠', '🪁', '🌙', '☁️', '⚡', '🟢', '🟡', '🟠', '🟣', '🟤', '🖤', '🤍', '🟥', '🟧', '🟨', '🟩', '🟪',
        '💎', '📦', '🔮', '📍', '🚩', '🏁', '🎯', '🎈', '🎨', '🧩', '🧸', '🎲', '♟️', '🃏'
      ];
      return (
        <>
          {renderDrawerControls(effectiveCategoryId)}
          {renderAssetList(effectiveCategoryId, shapes, (s) => renderDrawerItem(effectiveCategoryId, s, s, 'shape', s))}
          {renderCustomLabels(effectiveCategoryId)}
        </>
      );
    }
    if (effectiveCategoryId === 'GAMES') return <div className="col-span-4 text-center py-20 text-slate-300 font-bold px-4"><div className="text-6xl mb-4 opacity-50">🎮</div>Games Library coming soon! ✨</div>;

    if (activeCategoryId === 'HISTORY') {
      const hist = (design.whiteboards || []).filter(b => b.conceptId === concept.id);
      if (!hist.length) return <div className="col-span-4 text-center py-12 text-slate-300 font-bold px-4">No history yet. 🕰️</div>;

      const reversedHist = [...hist].reverse();
      const displayedHist = reversedHist.slice(0, historyLimit);

      const updateHistoryBoardName = (boardId: string, newName: string) => {
        const updatedWhiteboards = (design.whiteboards || []).map(b => b.id === boardId ? { ...b, name: newName } : b);
        onSaveDesign({ ...design, whiteboards: updatedWhiteboards });
        if (currentBoardId === boardId) setCurrentBoardName(newName);
      };

      return (
        <>
          {displayedHist.map(b => (
            <div key={b.id} className="col-span-4 relative mb-3 group">
              <button
                onClick={() => restoreBoardState(b)}
                className="w-full p-4 bg-white border-4 border-slate-100 rounded-3xl text-left hover:border-blue-400 shadow-sm transition-all flex flex-col gap-1 active:scale-95"
              >
                <div className="flex w-full">
                  <input
                    type="text"
                    value={b.name || ''}
                    placeholder="Untitled"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateHistoryBoardName(b.id, e.target.value)}
                    className="flex-1 font-black text-slate-800 text-lg bg-transparent border-b-2 border-transparent hover:border-slate-200 focus:border-blue-400 outline-none transition-colors px-1 -ml-1 placeholder:text-slate-300"
                  />
                </div>
                <div className="text-sm text-slate-400 font-bold tracking-wider px-1">
                  Created: {new Date(b.timestamp).toLocaleDateString()}, {new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setBoardToDelete({ id: b.id, name: b.name || 'Untitled Lesson' });
                  setIsDeleteHistoryModalOpen(true);
                }}
                className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center text-sm font-black border-2 border-white shadow-md opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-90 transition-all z-10"
                title="Delete Snapshot"
              >
                ✕
              </button>
            </div>
          ))}
          {hist.length > historyLimit && (
            <button
              onClick={() => setHistoryLimit(prev => prev + 20)}
              className="col-span-4 py-3 mt-2 bg-blue-50 text-blue-600 font-black rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors uppercase text-xs tracking-widest leading-none drop-shadow-sm active:scale-95"
            >
              Show More ({hist.length - historyLimit} left)
            </button>
          )}
        </>
      );
    }
  };

  const filteredMaterials = materials.filter(m => m.subjectId === subjectId);
  const subjectConcepts = currentSubject?.concepts || [];

  return (
    <div
      className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden font-['Fredoka']"
      onClick={() => {
        setShowAddArrow(false);
        setShowLibraryArrow(false);
        setShowSwitcherArrow(false);
        setSelectedItemId(null);
      }}
    >
      <header className="h-20 py-21 bg-white border-b-2 border-slate-100 px-6 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-6 flex-1">
          <button onClick={onBack} className="text-xl p-1.5 hover:bg-slate-100 rounded-full transition-colors">⬅️</button>
          <div className="flex flex-col min-w-[150px]">
            <div className="flex items-center gap-3">
              <h1 className="font-black text-slate-900 text-base tracking-tight leading-tight truncate max-w-[250px]">{concept.title}</h1>
            </div>
            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">{currentSubject?.title}</span>
          </div>

          {/* Concept Switcher for Teacher Mode */}
          {mode === 'teacher' && subjectConcepts.length > 1 && (
            <div className="relative ml-4 flex-1 max-w-[1200px] group/switcher">
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
                    <div className="bg-green-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl border-2 border-white whitespace-nowrap">
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
                        // Persist quickly before switching concepts.
                        // Keep existing drawingData here to avoid blocking UI with canvas serialization.
                        const newBoard = buildBoardSnapshot({ includeDrawing: false });

                        const existingWhiteboards = design.whiteboards || [];
                        const updatedWhiteboards = existingWhiteboards.some(b => b.id === newBoard.id)
                          ? existingWhiteboards.map(b => b.id === newBoard.id ? newBoard : b)
                          : [...existingWhiteboards, newBoard];

                        onSaveDesignRef.current({
                          ...design,
                          whiteboards: updatedWhiteboards,
                          conceptBoards: { ...(design.conceptBoards || {}), [concept.id]: newBoard }
                        });

                        onSelectConcept?.(c);
                      }
                    }}
                    className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap pointer-events-auto ${c.title === concept.title
                      ? 'bg-white text-blue-600 shadow-md ring-4 ring-blue-400 scale-110'
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
              onClick={() => {
                setShowSaveArrow(false);
                handleSaveBoard(() => onBack());
              }}
              className={`relative px-5 py-2 rounded-xl font-black text-sm border-b-4 transition-all shadow-lg flex items-center gap-2 ${saveStatus === 'saved' ? 'bg-green-500 text-white border-green-700' :
                saveStatus === 'saving' ? 'bg-green-400 text-white border-green-600 cursor-wait' :
                  'bg-green-600 text-white border-green-800 hover:bg-green-500 active:translate-y-1 active:border-b-0'
                }`}
              disabled={saveStatus === 'saving'}
            >
              <span className="text-lg">{saveStatus === 'saved' ? '✅' : '💾'}</span>
              {saveStatus === 'saved' ? 'Saved!' : saveStatus === 'saving' ? 'Saving...' : 'Save'}

              {showSaveArrow && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-full mr-4 top-1 -translate-y-1/2 flex items-center pointer-events-none whitespace-nowrap z-[100]"
                  >
                    <div className="bg-green-600 text-white px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-2xl border-2 border-white mr-2">
                      Save for classroom
                    </div>
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-3xl drop-shadow-md"
                    >
                      ➡️
                    </motion.span>
                  </motion.div>
                </AnimatePresence>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={handleClearEverything}
                className="px-4 py-1.5 bg-slate-100 rounded-lg font-black text-slate-900 text-xs border-b-2 border-slate-200 active:translate-y-0.5 active:border-b-0 transition-all"
              >
                ✨ New
              </button>
              <button
                onClick={handleSaveBoard}
                className={`px-5 py-1.5 rounded-lg font-black text-xs border-b-2 transition-all shadow-md flex items-center gap-2 ${saveStatus === 'saved' ? 'bg-green-500 text-white border-green-700' :
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
                <span className="text-sm font-bold uppercase tracking-tight text-center leading-none px-1">Add</span>
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
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-2xl whitespace-nowrap border-2 border-white ml-2">
                      Click to add icons!
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Scrollable Categories */}
          <div className="flex-1 overflow-y-auto py-4 flex flex-col items-center gap-3 custom-scrollbar">
            {categories.filter(cat => cat.id !== 'ADD_MATERIAL' && !hiddenDrawerItems.includes(cat.id)).map((cat) => (
              <button
                key={cat.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveCategoryId(cat.id);
                  setDrawerOpen(true);
                }}
                className={`w-20 h-20 flex-shrink-0 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all relative group ${activeCategoryId === cat.id && drawerOpen
                  ? 'bg-white shadow-lg text-blue-600 ring-4 ring-blue-400 scale-105'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                  }`}
              >
                <span className="text-3xl font-black leading-none">{cat.icon}</span>
                <span className="text-base font-bold uppercase tracking-tight text-center leading-none px-1 py-0.5 rounded-md transition-all">{cat.label}</span>

                {mode === 'teacher' && !['STICKERS','SONGS', 'GAMES', 'HISTORY'].includes(cat.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (cat.isCustom) {
                        setCustomIcons(prev => prev.filter(ci => ci.id !== cat.id));
                      } else {
                        setHiddenDrawerItems(prev => [...prev, cat.id]);
                      }
                      if (activeCategoryId === cat.id) setDrawerOpen(false);
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
            <h3 className="font-black text-slate-400 text-base tracking-[0.2em] uppercase truncate">
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
          <div className="p-4 border-b flex justify-between items-center bg-blue-50"><h3 className="font-black text-blue-500 text-base tracking-widest uppercase flex items-center gap-2"><span className="text-xl">📚</span> Materials</h3><button onClick={() => setLibraryOpen(false)} className="text-slate-300 hover:text-rose-500 font-black">✕</button></div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {!filteredMaterials.length ? (
              <div className="text-center py-12 px-4">
                <div className="opacity-50">
                  <div className="text-5xl mb-4">📂</div>
                  <p className="font-black text-slate-400">No subject materials.</p>
                </div>
                {mode === 'teacher' && (
                  <button
                    onClick={() => onNavigateToMaterials?.(subjectId)}
                    className="mt-6 w-full bg-blue-500 text-white font-black py-4 rounded-3xl shadow-lg border-b-4 border-blue-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>➕</span> Click here to add
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <h4 className="px-1 text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${currentSubject?.color || 'bg-blue-400'}`}></span>
                  {currentSubject?.title}
                </h4>
                <div className="space-y-4">
                  {filteredMaterials.map(m => (
                    <div key={m.id} className="relative group">
                      <button
                        onClick={() => { setActiveMaterial(m); setLibraryOpen(false); }}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('materialId', m.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        className="w-full bg-white border-2 rounded-3xl hover:border-blue-400 shadow-sm transition-all flex flex-col overflow-hidden"
                      >
                        <div className="h-28 bg-slate-50 flex items-center justify-center relative overflow-hidden pointer-events-none">
                          {(m.type === 'pdf' && (m.signedUrl || m.content)) ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white">
                              <div className="w-[400px] h-[400px] origin-center" style={{ transform: 'scale(0.35)' }}>
                                <iframe src={`${m.signedUrl || m.content}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} className="w-full h-full pointer-events-none" scrolling="no" title={m.name} />
                              </div>
                            </div>
                          ) : m.type === 'video' && (m.signedUrl || m.content) ? (
                            <video src={m.signedUrl || m.content} className="w-full h-full object-cover pointer-events-none" muted />
                          ) : m.thumbnailUrl ? (
                            <img src={m.thumbnailUrl} className="w-full h-full object-cover pointer-events-none" alt="Thumbnail" />
                          ) : (
                            <div className="text-5xl">{getFileIcon(m.type)}</div>
                          )}
                        </div>
                        <div className="p-3 text-left font-black text-slate-900 truncate text-sm">{m.name}</div>
                      </button>
                      {mode === 'teacher' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setItemToRemove(m); }}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg transition-all border-2 border-white z-10 hover:scale-110 active:scale-90"
                          title="Delete Material"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  {mode === 'teacher' && (
                    <button
                      onClick={() => onNavigateToMaterials?.(subjectId)}
                      className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl py-6 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">➕</span>
                      <span className="font-black text-xs uppercase tracking-widest">Add Material</span>
                    </button>
                  )}
                </div>
              </div>
            )}
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
                  <div className="bg-blue-600 text-white px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-2xl whitespace-nowrap border-2 border-white mr-2">
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
        <main
          ref={mainContentRef}
          className="flex-1 relative overflow-hidden flex flex-col bg-slate-50"
          onDrop={handleDropOnBoard}
          onDragOver={(e) => e.preventDefault()}
        >
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
          {activeMaterial && (
            <div className="absolute z-[90] pointer-events-auto shadow-2xl transition-opacity animate-material-enter" style={{ left: materialPos.x, top: materialPos.y, width: 'min(900px, 92vw)', height: 'min(750px, 85vh)' }}>
              <div className="bg-white w-full h-full rounded-[2.5rem] border-8 border-white flex flex-col overflow-hidden shadow-2xl ring-4 ring-black/5">
                <div className="flex items-center justify-between p-4 bg-slate-50 cursor-move border-b-2" onMouseDown={handleMaterialMouseDown}>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getFileIcon(activeMaterial.type)}</div>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs tracking-tight truncate max-w-[200px]">{activeMaterial.name}</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {mode === 'teacher' && (
                      <button
                        onClick={() => setItemToRemove(activeMaterial)}
                        className="w-10 h-10 bg-white rounded-xl shadow border-2 flex items-center justify-center text-lg hover:bg-rose-50 hover:text-rose-500 transition-all"
                        title="Delete Material"
                      >
                        🗑️
                      </button>
                    )}
                    <button onClick={() => setActiveMaterial(null)} className="w-10 h-10 bg-white rounded-xl shadow border-2 flex items-center justify-center text-lg hover:bg-rose-50 hover:text-rose-500 transition-all">✕</button>
                  </div>
                </div>
                <div className="flex-1 bg-white flex items-center justify-center overflow-hidden">
                  {activeMaterial.type === 'video' ? (
                    materialUrl && <video src={materialUrl} controls className="max-w-full max-h-full" autoPlay />
                  ) : (
                    materialUrl && <iframe src={materialUrl} className="w-full h-full border-none bg-white" title={activeMaterial.name} />
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="absolute top-4 right-4 z-[70] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full font-black text-slate-900 text-base shadow-lg border-2 border-slate-100 select-none">{Math.round(viewport.zoom * 100)}%</div>
          <div
            className={`flex-1 relative touch-none select-none overflow-hidden ${activeTool === 'select' ? 'cursor-grab active:cursor-grabbing' : activeTool === 'boxSelect' ? 'cursor-crosshair' : 'cursor-crosshair'}`}
            onMouseDown={startInteraction} onMouseMove={performInteraction} onMouseUp={stopInteraction} onMouseLeave={stopInteraction} onTouchStart={startInteraction} onTouchMove={performInteraction} onTouchEnd={stopInteraction}
            onWheel={(e) => {
              // Smooth zoom with scroll wheel without needing Ctrl
              const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05;
              const rect = e.currentTarget.getBoundingClientRect();
              handleZoomAt({ sx: e.clientX - rect.left, sy: e.clientY - rect.top }, zoomFactor);
            }}
            style={{
              touchAction: 'none',
              backgroundColor: boardBgColor,
              backgroundImage: boardBg === 'grid'
                ? 'radial-gradient(#cbd5e1 2px, transparent 2px)'
                : boardBg === 'lined'
                  ? 'repeating-linear-gradient(transparent, transparent 48px, #cbd5e1 48px, #cbd5e1 50px)'
                  : 'none',
              backgroundSize: boardBg === 'grid' ? `${50 * viewport.zoom}px ${50 * viewport.zoom}px` : `100% ${50 * viewport.zoom}px`,
              backgroundPosition: `${viewport.x}px ${viewport.y}px`
            }}
          >
            <div className="absolute top-0 left-0 origin-top-left border border-slate-300 shadow-md" style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`, width: '7000px', height: '7000px' }}>
              <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
              {items.filter(item => {
                const parentGroup = groups.find(g => g.itemIds.includes(item.id));
                return !parentGroup || !parentGroup.minimized;
              }).map(item => {
                const inGroup = groups.some(g => g.itemIds.includes(item.id));
                return (
                  <div key={item.id} className={`absolute z-10 select-none group ${inGroup ? 'pointer-events-none' : 'pointer-events-auto'}`} style={{ left: item.x, top: item.y, transform: `translate(-50%, -50%) scale(${item.scale})` }} onMouseDown={(e) => { e.stopPropagation(); handleItemMouseDown(e, item); }}>
                    <div className={`relative p-4 rounded-3xl border-4 transition-all duration-700 ${droppedItemId === item.id ? 'ring-8 ring-blue-400/50 bg-blue-400/20 border-blue-400 scale-105' : selectedItemId === item.id ? 'border-blue-400 bg-blue-500/10' : 'border-transparent'} ${activeTool === 'select' ? 'hover:border-blue-400' : ''}`}>
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
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="border-2 border-slate-100 flex items-center justify-center" />
                          ))}
                        </div>
                      ) : item.type === 'shape' && item.content === 'number-line' ? (
                        <div className="w-[800px] h-20 flex flex-col items-center justify-center pointer-events-none">
                          <div className="w-full h-1 bg-slate-400 relative">
                            {Array.from({ length: 21 }).map((_, i) => (
                              <div key={i} className="absolute top-0 w-0.5 h-4 bg-slate-400 -translate-y-1/2" style={{ left: `${(i / 20) * 100}%` }}>
                                <span className="absolute top-6 left-1/2 -translate-x-1/2 text-sm font-bold text-slate-500">{i}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : item.type === 'shape' && item.content === 'clock' ? (
                        <div className="w-64 h-64 bg-white rounded-full border-8 border-slate-800 relative shadow-2xl flex items-center justify-center pointer-events-auto clock-container">
                          {/* Remove Button */}
                          <button
                            onMouseDown={e => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                            className="absolute -top-4 -right-4 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all z-50"
                          >
                            ✕
                          </button>
                          {/* Minute Ticks */}
                          {Array.from({ length: 60 }).map((_, i) => {
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
                          {Array.from({ length: 12 }).map((_, i) => {
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
                            {Array.from({ length: item.metadata?.vertical ? 24 : 12 }).map((_, i) => (
                              <div key={i} className={`flex-1 border-slate-400/30 flex ${item.metadata?.vertical ? 'border-b flex-row justify-between items-center px-2' : 'border-r flex-col justify-between items-center py-2'}`}>
                                <span className="text-xs font-black text-slate-500">{i}</span>
                                <div className={`flex ${item.metadata?.vertical ? 'flex-col gap-1' : 'flex-row gap-1'}`}>
                                  {Array.from({ length: 4 }).map((_, j) => (
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
                              {Array.from({ length: 11 }).map((_, i) => (
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
                            {Array.from({ length: new Date(item.metadata?.year || 2026, item.metadata?.month || 1, 0).getDate() }).map((_, i) => {
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
                      ) : item.type === 'timer' ? (
                        <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-8 border-blue-100 flex flex-col items-center gap-6 min-w-[280px] pointer-events-auto">
                          <div className="flex justify-between w-full items-center">
                            <div className="text-sm font-black text-slate-400 uppercase tracking-widest">Classroom Timer ⏱️</div>
                            <button
                              onMouseDown={e => e.stopPropagation()}
                              onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                              className="text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                          <div className={`text-7xl font-black tabular-nums transition-colors ${item.metadata?.timeLeft === 0 ? 'text-rose-500 animate-bounce-gentle' : 'text-slate-800'}`}>
                            {Math.floor((item.metadata?.timeLeft || 0) / 60)}:{String((item.metadata?.timeLeft || 0) % 60).padStart(2, '0')}
                          </div>

                          <div className="flex gap-4 w-full" onMouseDown={e => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                const isRunning = !item.metadata?.isRunning;
                                updateItemMetadata(item.id, { isRunning });
                              }}
                              className={`flex-1 py-4 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 ${item.metadata?.isRunning ? 'bg-amber-100 text-amber-600 border-b-4 border-amber-300' : 'bg-emerald-500 text-white border-b-4 border-emerald-700'}`}
                            >
                              {item.metadata?.isRunning ? '⏸️ Pause' : '▶️ Start'}
                            </button>
                            <button
                              onClick={() => {
                                updateItemMetadata(item.id, { timeLeft: item.metadata?.initialTime || 60, isRunning: false });
                              }}
                              className="px-6 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black border-b-4 border-slate-200 hover:bg-slate-200 transition-all"
                            >
                              🔄
                            </button>
                          </div>

                          <div className="flex items-center gap-3 w-full bg-slate-50 p-3 rounded-2xl" onMouseDown={e => e.stopPropagation()}>
                            <span className="text-xs font-black text-slate-400 uppercase">Set:</span>
                            {[1, 2, 5, 10].map(m => (
                              <button
                                key={m}
                                onClick={() => updateItemMetadata(item.id, { timeLeft: m * 60, initialTime: m * 60, isRunning: false })}
                                className="flex-1 py-2 bg-white rounded-xl text-sm font-black text-slate-600 border-2 border-slate-100 hover:border-blue-300 transition-all"
                              >
                                {m}m
                              </button>
                            ))}
                          </div>

                          {item.metadata?.timeLeft === 0 && (
                            <div className="text-rose-500 font-black text-xl animate-pulse">TIME IS UP! 🔔</div>
                          )}
                        </div>
                      ) : item.type === 'spinner' ? (
                        <div
                          className="bg-white p-8 rounded-[3rem] shadow-2xl border-8 border-purple-100 flex flex-col items-center gap-6 pointer-events-auto"
                          style={{
                            minWidth: (item.metadata?.names || []).length > 8 ? 350 + ((item.metadata?.names || []).length - 8) * 20 : 350
                          }}
                        >
                          <div className="flex justify-between w-full items-center">
                            <div className="text-sm font-black text-slate-400 uppercase tracking-widest">Wheel Spinner 🎡</div>
                            <button
                              onMouseDown={e => e.stopPropagation()}
                              onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                              className="text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              ✕
                            </button>
                          </div>

                          <div
                            className="relative"
                            style={{
                              width: (item.metadata?.names || []).length > 8 ? 288 + ((item.metadata?.names || []).length - 8) * 15 : 288,
                              height: (item.metadata?.names || []).length > 8 ? 288 + ((item.metadata?.names || []).length - 8) * 15 : 288
                            }}
                          >
                            {/* Spinner Ticker */}
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-5xl z-20 drop-shadow-lg">🔻</div>

                            {/* The Wheel */}
                            <motion.div
                              animate={{ rotate: item.metadata?.rotation || 0 }}
                              transition={item.metadata?.isSpinning ? { duration: 4, ease: [0.15, 0, 0.15, 1] } : { duration: 0 }}
                              className="w-full h-full rounded-full border-[12px] border-slate-900 relative overflow-hidden shadow-2xl bg-slate-100"
                            >
                              {(item.metadata?.names || []).length > 0 ? (
                                <svg viewBox="0 0 100 100" className="w-full h-full">
                                  {(item.metadata?.names || []).map((name: string, i: number, arr: string[]) => {
                                    const sliceAngle = 360 / arr.length;
                                    const startAngle = i * sliceAngle;
                                    const endAngle = (i + 1) * sliceAngle;
                                    const colors = ['#eab308', '#ec4899', '#3b82f6', '#8b5cf6', '#22c55e', '#f97316', '#ef4444'];

                                    // Special case for 1 student: full circle
                                    if (arr.length === 1) {
                                      return (
                                        <g key={i}>
                                          <circle cx="50" cy="50" r="50" fill={colors[0]} />
                                          <text
                                            x="50"
                                            y="30"
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fill="white"
                                            className="font-black text-[15px] drop-shadow-sm"
                                          >
                                            {name}
                                          </text>
                                        </g>
                                      );
                                    }

                                    // Path calculation for slices
                                    const radius = 50;
                                    const centerX = 50;
                                    const centerY = 50;

                                    const startRad = (startAngle - 90) * Math.PI / 180.0;
                                    const endRad = (endAngle - 90) * Math.PI / 180.0;

                                    const x1 = centerX + radius * Math.cos(startRad);
                                    const y1 = centerY + radius * Math.sin(startRad);
                                    const x2 = centerX + radius * Math.cos(endRad);
                                    const y2 = centerY + radius * Math.sin(endRad);

                                    const largeArcFlag = sliceAngle <= 180 ? "0" : "1";
                                    const d = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                                    // Text positioning
                                    const textAngle = startAngle + sliceAngle / 2;
                                    const textRad = (textAngle - 90) * Math.PI / 180.0;

                                    // Switch to radial (vertical) text if more than 5 names to avoid overlap
                                    const isRadial = arr.length > 5;
                                    const textDist = isRadial ? 0.75 : 0.65;
                                    const textX = centerX + (radius * textDist) * Math.cos(textRad);
                                    const textY = centerY + (radius * textDist) * Math.sin(textRad);

                                    // Dynamic Font Size Calculation
                                    const fontSize = Math.max(3.5, Math.min(isRadial ? 12 : 14, (isRadial ? 90 : 50) / arr.length));
                                    const rotation = isRadial ? textAngle + 90 : textAngle;

                                    return (
                                      <g key={i}>
                                        <path d={d} fill={colors[i % colors.length]} stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
                                        <text
                                          x={textX}
                                          y={textY}
                                          textAnchor="middle"
                                          dominantBaseline="middle"
                                          fill="white"
                                          className="font-black drop-shadow-sm"
                                          style={{ fontSize: `${fontSize}px` }}
                                          transform={`rotate(${rotation}, ${textX}, ${textY})`}
                                        >
                                          {name}
                                        </text>
                                      </g>
                                    );
                                  })}
                                </svg>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold italic text-center p-8">Add names below to start!</div>
                              )}
                            </motion.div>

                            {/* Center Button - Dark Circular */}
                            <button
                              onMouseDown={e => e.stopPropagation()}
                              onClick={() => {
                                if ((item.metadata?.names || []).length < 2) return;
                                const extraSpins = 6 + Math.random() * 4;
                                const newRotation = (item.metadata?.rotation || 0) + (360 * extraSpins) + Math.random() * 360;
                                updateItemMetadata(item.id, { isSpinning: true, rotation: newRotation, selectedName: null });

                                // Play spin sound
                                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
                                audio.volume = 0.3;
                                audio.play().catch(() => { });

                                setTimeout(() => {
                                  const finalRotation = newRotation % 360;
                                  const anglePerSegment = 360 / (item.metadata?.names || []).length;
                                  // Ticker is at top (270 deg). 
                                  const winningAngle = (360 - (finalRotation % 360)) % 360;
                                  const winnerIdx = Math.floor(winningAngle / anglePerSegment);
                                  const winner = item.metadata?.names[winnerIdx];
                                  updateItemMetadata(item.id, { isSpinning: false, selectedName: winner });

                                  // Play win sound
                                  const winAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3');
                                  winAudio.volume = 0.4;
                                  winAudio.play().catch(() => { });
                                }, 4000);
                              }}
                              disabled={item.metadata?.isSpinning || (item.metadata?.names || []).length < 2}
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-slate-900 text-white rounded-full border-4 border-slate-700 shadow-2xl z-30 font-black text-sm hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex flex-col items-center justify-center gap-0.5"
                            >
                              <span className="text-xl">🎡</span>
                              <span>SPIN</span>
                            </button>
                          </div>

                          {/* Name Input */}
                          <div className="w-full space-y-3" onMouseDown={e => e.stopPropagation()}>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Add to spinner"
                                value={spinnerInputs[item.id] || ''}
                                onChange={(e) => setSpinnerInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                                className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-purple-300 outline-none font-bold text-base"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const name = spinnerInputs[item.id]?.trim();
                                    if (name) {
                                      updateItemMetadata(item.id, { names: [...(item.metadata?.names || []), name] });
                                      setSpinnerInputs(prev => ({ ...prev, [item.id]: '' }));
                                    }
                                  }
                                }}
                              />
                              <button
                                onClick={() => {
                                  const name = spinnerInputs[item.id]?.trim();
                                  if (name) {
                                    updateItemMetadata(item.id, { names: [...(item.metadata?.names || []), name] });
                                    setSpinnerInputs(prev => ({ ...prev, [item.id]: '' }));
                                  }
                                }}
                                className="px-6 py-3 bg-purple-500 text-white rounded-xl font-black text-base hover:scale-105 active:scale-95 transition-all shadow-md"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => updateItemMetadata(item.id, { names: [] })}
                                className="px-4 py-3 bg-slate-100 text-slate-400 rounded-xl font-black text-xs hover:bg-rose-50 hover:text-rose-500 transition-all"
                              >
                                Clear
                              </button>
                            </div>
                            <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto p-1 custom-scrollbar w-full">
                              {(item.metadata?.names || []).map((name: string, i: number) => (
                                <div key={i} className="px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-black flex items-center justify-between gap-1 border border-purple-100 min-w-0">
                                  <span className="truncate">{name}</span>
                                  <button onClick={() => updateItemMetadata(item.id, { names: (item.metadata?.names || []).filter((_: any, idx: number) => idx !== i) })} className="hover:text-rose-500 flex-shrink-0">✕</button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Winner Announcement */}
                          <AnimatePresence>
                            {item.metadata?.selectedName && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center p-8 rounded-[3rem] text-center shadow-2xl border-4 border-purple-200"
                                onMouseDown={e => e.stopPropagation()}
                              >
                                <motion.div
                                  animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                                  transition={{ duration: 0.5, repeat: Infinity }}
                                  className="text-8xl mb-6"
                                >
                                  🌟
                                </motion.div>
                                <div className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">The Winner Is...</div>
                                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 mb-8 animate-celebrate drop-shadow-sm">
                                  {item.metadata?.selectedName}
                                </div>
                                <button
                                  onClick={() => updateItemMetadata(item.id, { selectedName: null })}
                                  className="px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-2xl font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
                                >
                                  Awesome! 🎉
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
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
                )
              })}

              {/* Group Boxes */}
              {groups.map(group => {
                const bounds = getGroupBounds(group);
                if (!bounds) return null;
                return (
                  <div
                    key={group.id}
                    className="absolute z-[5] pointer-events-auto"
                    style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: group.minimized ? 40 : bounds.h }}
                  >
                    <div
                      className={`w-full h-full border-2 border-dashed border-blue-400 rounded-2xl transition-all ${group.minimized ? 'bg-blue-50/90 backdrop-blur-sm' : 'bg-blue-50/20'}`}
                      onMouseDown={(e) => handleGroupMouseDown(e, group)}
                    >
                      <div className="absolute -top-12 left-0 flex gap-1 z-20">
                        <button
                          onMouseDown={e => e.stopPropagation()}
                          onClick={(e) => { e.stopPropagation(); setGroups(prev => prev.map(g => g.id === group.id ? { ...g, minimized: !g.minimized } : g)); }}
                          className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-md text-xs font-black shadow-md hover:bg-blue-600 transition-all border border-blue-600"
                          title={group.minimized ? 'Expand' : 'Minimize'}
                        >
                          {group.minimized ? '▶' : '▼'}
                        </button>
                        <button
                          onMouseDown={e => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            setItems(prev => {
                              const initialItems = prev.filter(it => group.itemIds.includes(it.id));
                              if (initialItems.length === 0) return prev;
                              const xs = initialItems.map(it => it.x);
                              const ys = initialItems.map(it => it.y);
                              const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
                              const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
                              return prev.map(it => {
                                if (!group.itemIds.includes(it.id)) return it;
                                return { ...it, scale: it.scale * 1.1, x: centerX + (it.x - centerX) * 1.1, y: centerY + (it.y - centerY) * 1.1 };
                              });
                            });
                          }}
                          className="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-md text-xs font-black shadow-md hover:bg-green-600 transition-all border border-green-600"
                          title="Increase Size"
                        >
                          ➕
                        </button>
                        <button
                          onMouseDown={e => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            setItems(prev => {
                              const initialItems = prev.filter(it => group.itemIds.includes(it.id));
                              if (initialItems.length === 0) return prev;
                              const xs = initialItems.map(it => it.x);
                              const ys = initialItems.map(it => it.y);
                              const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
                              const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
                              return prev.map(it => {
                                if (!group.itemIds.includes(it.id)) return it;
                                return { ...it, scale: Math.max(0.2, it.scale * 0.9), x: centerX + (it.x - centerX) * 0.9, y: centerY + (it.y - centerY) * 0.9 };
                              });
                            });
                          }}
                          className="w-8 h-8 flex items-center justify-center bg-yellow-500 text-white rounded-md text-xs font-black shadow-md hover:bg-yellow-600 transition-all border border-yellow-600"
                          title="Decrease Size"
                        >
                          ➖
                        </button>
                      </div>
                      {!group.minimized && (
                        <div
                          className="absolute -bottom-3 -left-3 w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-xl cursor-sw-resize z-20 hover:scale-110 transition-transform"
                          onMouseDown={(e) => handleGroupResizeMouseDown(e, group)}
                          title="Resize Group"
                        />
                      )}
                      {group.minimized && (
                        <div className="flex items-center justify-center h-full text-blue-500 font-black text-xs uppercase tracking-widest gap-2">
                          <span>📦</span> {group.itemIds.length} items grouped
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Box Selection Rectangle */}
              {boxSelectRect && (
                <div
                  className="absolute border-2 border-blue-500 bg-blue-400/15 rounded-lg pointer-events-none z-[100]"
                  style={{
                    left: Math.min(boxSelectRect.x1, boxSelectRect.x2),
                    top: Math.min(boxSelectRect.y1, boxSelectRect.y2),
                    width: Math.abs(boxSelectRect.x2 - boxSelectRect.x1),
                    height: Math.abs(boxSelectRect.y2 - boxSelectRect.y1),
                  }}
                />
              )}
            </div>
          </div>
          <div className="h-16 py-2 bg-white/95 backdrop-blur-md border-t-2 border-slate-100 flex items-center justify-center gap-4 z-50">
            {mode === 'teacher' && currentBoardName && (
              <div className="flex items-center mr-2">
                <span className="px-4 py-2 bg-blue-50 text-blue-600 text-sm font-black rounded-xl border-2 border-blue-100 uppercase tracking-wider shadow-sm">
                  Active: {currentBoardName}
                </span>
              </div>
            )}
            <div className="flex bg-slate-100 p-2 rounded-full shadow-inner gap-1">
              {[{ id: 'select', icon: '🖐️' }, { id: 'marker', icon: '✏️' }, { id: 'highlighter', icon: '🖍️' }, { id: 'eraser', icon: '🧼' }].map(t => (
                <div key={t.id} className="relative group/tool">
                  <button onClick={() => { if ((activeTool === t.id) && (t.id === 'marker' || t.id === 'highlighter')) setShowColorPicker(showColorPicker === t.id ? null : t.id as any); else { setActiveTool(t.id as any); setShowColorPicker(null); } }} className={`w-10 h-10 rounded-full transition-all flex items-center justify-center text-xl relative ${activeTool === t.id ? 'bg-white shadow-xl text-blue-500 scale-110 ring-2 ring-blue-100' : 'opacity-40'}`}>
                    {t.icon}{(t.id === 'marker' || t.id === 'highlighter') && <div className="absolute -bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: t.id === 'marker' ? markerColor : highlighterColor }} />}
                  </button>
                  {showColorPicker === t.id && <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white p-3 rounded-2xl shadow-2xl border-2 border-slate-100 z-[80] animate-fade-in flex gap-2">{(t.id === 'marker' ? MARKER_COLORS : HIGHLIGHTER_COLORS).map(c => <button key={c.value} onClick={() => { if (t.id === 'marker') setMarkerColor(c.value); else setHighlightColor(c.value); setShowColorPicker(null); }} className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-125 ${(t.id === 'marker' ? markerColor : highlighterColor) === c.value ? 'border-blue-400 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c.value }} />)}</div>}
                </div>
              ))}
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex gap-2">
              <button onClick={() => handleZoomAt({ sx: window.innerWidth / 2, sy: window.innerHeight / 2 }, 1.25)} className="w-9 h-9 rounded-xl bg-white shadow-md border border-slate-100 flex items-center justify-center text-base">➕</button>
              <button onClick={() => handleZoomAt({ sx: window.innerWidth / 2, sy: window.innerHeight / 2 }, 0.8)} className="w-9 h-9 rounded-xl bg-white shadow-md border border-slate-100 flex items-center justify-center text-base">➖</button>
              <button onClick={() => setViewport(getCenter())} className="w-9 h-9 rounded-xl bg-slate-50 shadow-md border border-slate-100 flex items-center justify-center text-base">🏠</button>
            </div>
            <button onClick={handleUndo} disabled={undoStack.length === 0} className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border-b-4 transition-all active:translate-y-0.5 active:border-b-0 ${undoStack.length > 0 ? 'bg-amber-100 text-amber-600 border-amber-300' : 'bg-slate-50 text-slate-200 border-slate-100'}`}>↩️</button>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex gap-2">
              <button
                onClick={() => addItem('timer', 'timer', window.innerWidth / 2, window.innerHeight / 2, { timeLeft: 60, initialTime: 60, isRunning: false })}
                className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 border-b-4 border-blue-200 flex items-center justify-center text-2xl hover:bg-blue-100 transition-all active:translate-y-0.5 active:border-b-0"
                title="Add Timer"
              >
                ⏱️
              </button>
              <button
                onClick={() => addItem('spinner', 'spinner', window.innerWidth / 2, window.innerHeight / 2, { names: globalSpinnerNames, rotation: 0, isSpinning: false })}
                className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 border-b-4 border-purple-200 flex items-center justify-center text-2xl hover:bg-purple-100 transition-all active:translate-y-0.5 active:border-b-0"
                title="Add Wheel Spinner"
              >
                🎡
              </button>
              <button
                onClick={() => { setActiveTool(activeTool === 'boxSelect' ? 'select' : 'boxSelect'); }}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-b-4 transition-all active:translate-y-0.5 active:border-b-0 ${activeTool === 'boxSelect' ? 'bg-blue-500 text-white border-blue-700 shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-blue-50'}`}
                title="Group Select"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 4" /><path d="M14 10l6-6m0 0v5m0-5h-5" strokeDasharray="none" /></svg>
              </button>
            </div>
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

              <AnimatePresence>
                {isCreatingCustomIcon && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-6 overflow-hidden"
                  >
                    <div className="p-6 bg-blue-50/50 rounded-[2rem] border-2 border-blue-100 space-y-4">
                      <div className="flex gap-4">
                        <div className="flex flex-col gap-2 relative">
                          <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 ml-2">Icon</label>
                          <button
                            onClick={() => setActiveEmojiPicker(activeEmojiPicker === 'main' ? null : 'main')}
                            className="w-20 h-20 bg-white border-2 border-blue-100 rounded-3xl text-4xl flex items-center justify-center text-center focus:outline-none focus:border-blue-400 shadow-sm hover:bg-blue-50 transition-all"
                          >
                            {customIconForm.icon}
                          </button>
                          {activeEmojiPicker === 'main' && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-white border-2 border-blue-100 rounded-2xl shadow-2xl p-4 z-[100] grid grid-cols-5 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
                              {EMOJI_LIST.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => {
                                    setCustomIconForm(prev => ({ ...prev, icon: emoji }));
                                    setActiveEmojiPicker(null);
                                  }}
                                  className="text-2xl hover:bg-blue-50 p-1 rounded-lg transition-all"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 ml-2">Topic Label</label>
                          <input
                            type="text"
                            value={customIconForm.label}
                            onChange={(e) => setCustomIconForm(prev => ({ ...prev, label: e.target.value }))}
                            placeholder="e.g. My Custom Topic"
                            className="w-full h-20 px-6 bg-white border-2 border-blue-100 rounded-3xl font-bold text-xl text-slate-700 focus:outline-none focus:border-blue-400 shadow-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 ml-2">Content Items</label>
                        <div className="flex flex-wrap gap-2 p-4 bg-white/50 rounded-2xl border-2 border-dashed border-blue-100 min-h-[80px]">
                          {customIconForm.items.map((item, idx) => (
                            <div key={idx} className="bg-white px-3 py-2 rounded-xl border-2 border-blue-100 flex items-center gap-2 shadow-sm group">
                              <span className="text-xl">{item.type === 'text' ? '🔤' : '🖼️'}</span>
                              <span className="font-bold text-slate-600">{item.content}</span>
                              <button
                                onClick={() => setCustomIconForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))}
                                className="text-rose-400 hover:text-rose-600 transition-colors"
                              >✕</button>
                            </div>
                          ))}
                          {customIconForm.items.length === 0 && (
                            <div className="flex-1 flex items-center justify-center text-slate-300 font-bold italic text-sm">No items added yet</div>
                          )}
                        </div>
                        <div className="flex flex-col gap-3">
                          <div className="flex border-b-2 border-blue-100 mb-2">
                            <button
                              onClick={() => setCustomIconTab('text')}
                              className={`flex-1 py-2 font-black text-[10px] uppercase tracking-widest transition-all ${customIconTab === 'text' ? 'text-blue-600 border-b-2 border-blue-600 -mb-[2px]' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              Add Text Item
                            </button>
                            <button
                              onClick={() => setCustomIconTab('image')}
                              className={`flex-1 py-2 font-black text-[10px] uppercase tracking-widest transition-all ${customIconTab === 'image' ? 'text-blue-600 border-b-2 border-blue-600 -mb-[2px]' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              Add Image Item
                            </button>
                          </div>

                          {customIconTab === 'text' ? (
                            <div className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                              <div className="flex-1 flex flex-col gap-2">
                                <input
                                  type="text"
                                  value={textItemInput}
                                  onChange={(e) => setTextItemInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && textItemInput) {
                                      setCustomIconForm(prev => ({ ...prev, items: [...prev.items, { type: 'text', content: textItemInput, label: textItemInput }] }));
                                      setTextItemInput('');
                                    }
                                  }}
                                  placeholder="Type text item..."
                                  className="w-full py-3 px-4 bg-white border-2 border-blue-100 rounded-2xl font-bold text-sm text-slate-700 focus:outline-none focus:border-blue-400 shadow-sm"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  if (textItemInput) {
                                    setCustomIconForm(prev => ({ ...prev, items: [...prev.items, { type: 'text', content: textItemInput, label: textItemInput }] }));
                                    setTextItemInput('');
                                  }
                                }}
                                className="px-6 py-3 bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md"
                              >
                                Add Text
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-right-2 duration-300">
                              <div className="bg-white border-2 border-blue-100 rounded-2xl shadow-sm p-4 grid grid-cols-8 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                                {EMOJI_LIST.map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => {
                                      setCustomIconForm(prev => ({ ...prev, items: [...prev.items, { type: 'sticker', content: emoji, label: emoji }] }));
                                    }}
                                    className="text-2xl hover:bg-blue-50 p-1 rounded-lg transition-all"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => {
                            if (!customIconForm.label) return alert('Please enter a label');
                            const newId = `CUSTOM_${Date.now()}`;
                            const newCat = {
                              id: newId,
                              label: customIconForm.label,
                              icon: customIconForm.icon,
                              type: 'category',
                              items: customIconForm.items,
                              isCustom: true
                            };
                            setAvailableCustomIcons(prev => {
                              const updated = [...prev, newCat];
                              onSaveDesignRef.current({ ...design, availableCustomIcons: updated });
                              return updated;
                            });
                            setCustomIcons(prev => [...prev, newCat]);
                            setIsCreatingCustomIcon(false);
                            setCustomIconForm({ icon: '⭐', label: '', items: [] });
                          }}
                          className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg hover:bg-blue-700 transition-all"
                        >
                          Save Topic
                        </button>
                        <button
                          onClick={() => setIsCreatingCustomIcon(false)}
                          className="flex-1 py-4 bg-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-sm shadow-md hover:bg-slate-300 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-6 gap-4">
                <button
                  onClick={() => setIsCreatingCustomIcon(true)}
                  className={`aspect-square rounded-3xl border-4 border-dashed transition-all flex flex-col items-center justify-center gap-2 relative group ${isCreatingCustomIcon ? 'border-blue-400 bg-blue-50 shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-white hover:scale-105 shadow-sm hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]'}`}
                >
                  <div className="absolute inset-0 rounded-3xl border-4 border-blue-400/30 animate-ping pointer-events-none" />
                  <div className="absolute inset-0 rounded-3xl shadow-[0_0_25px_rgba(59,130,246,0.5)] animate-pulse pointer-events-none" />
                  <span className="text-4xl">✨</span>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter text-center px-1">Create Your Own</span>
                </button>

                {availableCustomIcons.filter(cat =>
                  cat.label.toLowerCase().includes(iconSearchQuery.toLowerCase())
                ).map((cat, idx) => {
                  const isAlreadyAdded = !hiddenDrawerItems.includes(cat.id) && categories.some(c => c.id === cat.id);
                  return (
                    <button
                      key={`custom-${idx}`}
                      onClick={() => {
                        if (isAlreadyAdded) {
                          if (cat.isCustom || customIcons.some(ci => ci.id === cat.id)) {
                            setCustomIcons(prev => prev.filter(ci => ci.id !== cat.id));
                          }
                          setHiddenDrawerItems(prev => [...prev, cat.id]);
                        } else {
                          // Unhide if hidden
                          setHiddenDrawerItems(prev => prev.filter(id => id !== cat.id));
                          // Add to custom if not natively in categories
                          if (!categories.some(c => c.id === cat.id)) {
                            setCustomIcons(prev => [...prev, cat]);
                          }
                        }
                      }}
                      className={`aspect-square rounded-3xl border-4 transition-all flex flex-col items-center justify-center gap-2 relative group ${isAlreadyAdded ? 'border-blue-400 bg-blue-50 shadow-inner' : 'border-slate-100 bg-white hover:border-blue-200 hover:scale-105 shadow-sm'}`}
                    >
                      <span className="text-4xl">{cat.icon}</span>
                      <span className="text-sm font-black uppercase text-slate-400 tracking-tighter text-center px-1 truncate w-full">{cat.label}</span>
                      {isAlreadyAdded && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg border-2 border-white">✓</div>
                      )}
                    </button>
                  );
                })}

                {CATEGORY_TEMPLATES.filter(cat =>
                  cat.label.toLowerCase().includes(iconSearchQuery.toLowerCase())
                ).map((cat, idx) => {
                  const isAlreadyAdded = !hiddenDrawerItems.includes(cat.id) && categories.some(c => c.id === cat.id);
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (isAlreadyAdded) {
                          if (customIcons.some(ci => ci.id === cat.id)) {
                            setCustomIcons(prev => prev.filter(ci => ci.id !== cat.id));
                          }
                          setHiddenDrawerItems(prev => [...prev, cat.id]);
                        } else {
                          // Unhide if hidden
                          setHiddenDrawerItems(prev => prev.filter(id => id !== cat.id));
                          // Add to custom if not natively in categories
                          if (!categories.some(c => c.id === cat.id) && !customIcons.some(ci => ci.id === cat.id)) {
                            setCustomIcons(prev => [...prev, cat]);
                          }
                        }
                      }}
                      className={`aspect-square rounded-3xl border-4 transition-all flex flex-col items-center justify-center gap-2 relative group ${isAlreadyAdded ? 'border-blue-400 bg-blue-50 shadow-inner' : 'border-slate-100 bg-white hover:border-blue-200 hover:scale-105 shadow-sm'}`}
                    >
                      <span className="text-4xl">{cat.icon}</span>
                      <span className="text-sm font-black uppercase text-slate-400 tracking-tighter text-center px-1 truncate w-full">{cat.label}</span>
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

      <AnimatePresence>
        {itemToRemove && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setItemToRemove(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center z-10"
            >
              <div className="text-5xl mb-4">🗑️</div>
              <h3 className="text-xl font-black text-slate-800 mb-4">Are you sure you want to remove this material from your classroom?</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setItemToRemove(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                >
                  No
                </button>
                <button
                  onClick={() => {
                    if (onUpdateMaterials) {
                      const updated = materials.filter(m => m.id !== itemToRemove.id);
                      onUpdateMaterials([...updated]);
                    }
                    if (activeMaterial?.id === itemToRemove.id) {
                      setActiveMaterial(null);
                    }
                    setItemToRemove(null);
                  }}
                  className="flex-1 py-3 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-colors shadow-lg border-b-4 border-rose-700 active:translate-y-1 active:border-b-0"
                >
                  Yes
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* New Board Confirmation Modal */}
        {isNewBoardModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewBoardModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] p-10 border-8 border-blue-50 flex flex-col gap-6 text-center"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-4xl shadow-inner mx-auto animate-bounce-gentle">
                ✨
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black text-slate-900 mb-2">Create New Board?</h2>
                <p className="text-slate-500 font-bold text-md tracking-tight px-4 leading-relaxed">
                  This will clear your current space and save your current work to history.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsNewBoardModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  Not Yet
                </button>
                <button
                  onClick={() => executeClearEverything(true)}
                  className="flex-[1.5] py-4 bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 hover:shadow-lg transition-all shadow-md border-b-6 border-blue-700 active:translate-y-1 active:border-b-0"
                >
                  Create New
                </button>
              </div>
              <button
                onClick={() => executeClearEverything(false)}
                className="text-[20px] font-black text-slate-300 uppercase tracking-widest hover:text-rose-400 transition-colors"
              >
                Clear without saving
              </button>
            </motion.div>
          </div>
        )}
        {isNamingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNamingModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] p-10 border-8 border-blue-50 flex flex-col gap-8"
            >
              <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center text-5xl shadow-inner mx-auto animate-bounce-gentle">
                📝
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900 mb-2">Name Your Lesson</h2>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Give this board a memorable title</p>
              </div>

              <div className="relative group/input">
                <input
                  ref={namingInputRef}
                  type="text"
                  value={namingModalInput}
                  onChange={(e) => setNamingModalInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const finalName = namingModalInput.trim() || `Lesson ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                      const newId = Math.random().toString(36).substr(2, 9);
                      setCurrentBoardId(newId);
                      setCurrentBoardName(finalName);
                      setIsNamingModalOpen(false);
                      executeSaveBoard(newId, finalName, pendingSaveSuccessCallback || undefined);
                    }
                  }}
                  className="w-full px-8 py-6 bg-slate-50 border-4 border-slate-100 rounded-[2rem] font-black text-slate-800 text-xl focus:border-blue-400 focus:bg-white outline-none transition-all placeholder:text-slate-300 shadow-inner group-hover/input:border-slate-200"
                  placeholder="Enter lesson name..."
                  autoFocus
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsNamingModalOpen(false)}
                  className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-3xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const finalName = namingModalInput.trim() || `Lesson ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                    const newId = Math.random().toString(36).substr(2, 9);
                    setCurrentBoardId(newId);
                    setCurrentBoardName(finalName);
                    setIsNamingModalOpen(false);
                    executeSaveBoard(newId, finalName, pendingSaveSuccessCallback || undefined);
                  }}
                  className="flex-[1.5] py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest hover:scale-[1.02] hover:shadow-2xl transition-all shadow-xl border-b-8 border-blue-900 active:translate-y-2 active:border-b-0"
                >
                  Save Board 💾
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isDeleteHistoryModalOpen && boardToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteHistoryModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] p-10 border-8 border-rose-50 flex flex-col gap-6"
            >
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-4xl shadow-inner mx-auto animate-bounce-gentle">
                🗑️
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black text-slate-900 mb-2">Delete Lesson?</h2>
                <p className="text-slate-500 font-bold text-sm tracking-tight px-4 leading-relaxed">
                  Are you sure you want to delete <span className="text-rose-500">"{boardToDelete.name}"</span>? This cannot be undone.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsDeleteHistoryModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  No, Keep It
                </button>
                <button
                  onClick={() => {
                    deleteFromHistory(boardToDelete.id);
                    setIsDeleteHistoryModalOpen(false);
                    setBoardToDelete(null);
                  }}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-rose-600 hover:shadow-lg transition-all shadow-md border-b-6 border-rose-700 active:translate-y-1 active:border-b-0"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .board-lined { background-color: white; background-image: linear-gradient(rgba(59, 130, 246, 0.25) 2px, transparent 2px); }
        .board-grid { background-color: white; background-image: linear-gradient(rgba(59, 130, 246, 0.2) 2px, transparent 2px), linear-gradient(90deg, rgba(59, 130, 246, 0.2) 2px, transparent 2px); }
        .cursor-grab { cursor: grab; }
        .active\\:cursor-grabbing:active { cursor: grabbing; }
        canvas { image-rendering: auto; }
        .cursor-nwse-resize { cursor: nwse-resize; }
        @keyframes modal-fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
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
        .animate-modal-fade-in { animation: modal-fade-in 0.2s ease-out forwards; }
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
