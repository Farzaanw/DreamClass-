
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Concept, ClassroomDesign, BoardItem, Whiteboard, MaterialFile, Subject } from '../types';
import { STICKERS, VC_WORDS, CV_WORDS, REGULAR_SIGHT_WORDS, IRREGULAR_SIGHT_WORDS, CONSONANT_DIGRAPHS, VOWEL_DIGRAPHS } from '../constants';

interface ConceptDashboardProps {
  concept: Concept;
  design: ClassroomDesign;
  subjectId: string;
  materials: MaterialFile[];
  allSubjects: Subject[];
  onBack: () => void;
  onSaveDesign: (design: ClassroomDesign) => void;
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

const ConceptDashboard: React.FC<ConceptDashboardProps> = ({ concept, design, subjectId, materials, allSubjects, onBack, onSaveDesign }) => {
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

  // Determine Sidebar Categories based on Subject
  const categories = useMemo(() => {
    const commonTail = [
      { id: 'STICKERS', label: 'Stickers', icon: '✨' },
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
    // Default categories for custom subjects
    return [
      { id: 'LETTERS', label: 'ABC', icon: '🅰️' },
      { id: 'NUMBERS', label: '123', icon: '🔢' },
      { id: 'SHAPES', label: 'Shapes', icon: '📐' },
      ...commonTail
    ];
  }, [subjectId]);

  const [activeCategoryId, setActiveCategoryId] = useState<string>(categories[0].id);

  // Pan and Zoom State
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const isPanningRef = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);

  // Initialize Canvas and Load State
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

  // Use fetch-to-blob for more reliable rendering in iframes
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
          console.error("Failed to generate blob for material:", err);
          setMaterialUrl(activeMaterial.content || null);
        });
    } else {
      setMaterialUrl(null);
    }

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [activeMaterial]);

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
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = previousState.drawing;
      }
    }
    
    setUndoStack(prev => prev.slice(0, -1));
    setSelectedItemId(null);
  };

  const screenToWorld = (sx: number, sy: number) => {
    return {
      wx: (sx - viewport.x) / viewport.zoom,
      wy: (sy - viewport.y) / viewport.zoom
    };
  };

  const startInteraction = (getEvent: any) => {
    if (isDraggingMaterial.current) return;
    const nativeEvent = getEvent.nativeEvent || getEvent;
    const isTouch = nativeEvent.touches && nativeEvent.touches.length > 0;
    
    if (isTouch && nativeEvent.touches.length === 2) {
      isPanningRef.current = false;
      isDrawingRef.current = false;
      const dist = Math.hypot(
        nativeEvent.touches[0].clientX - nativeEvent.touches[1].clientX,
        nativeEvent.touches[0].clientY - nativeEvent.touches[1].clientY
      );
      lastTouchDistance.current = dist;
      return;
    }

    const coords = getScreenCoordinates(nativeEvent);

    if (activeTool === 'select') {
      isPanningRef.current = true;
      lastPanPos.current = { x: coords.sx, y: coords.sy };
      if (getEvent.target === getEvent.currentTarget) {
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
    
    if (nativeEvent.touches && nativeEvent.touches.length === 2) {
      const dist = Math.hypot(
        nativeEvent.touches[0].clientX - nativeEvent.touches[1].clientX,
        nativeEvent.touches[0].clientY - nativeEvent.touches[1].clientY
      );
      if (lastTouchDistance.current !== null) {
        const factor = dist / lastTouchDistance.current;
        const rect = getEvent.currentTarget.getBoundingClientRect();
        const midX = ((nativeEvent.touches[0].clientX + nativeEvent.touches[1].clientX) / 2) - rect.left;
        const midY = ((nativeEvent.touches[0].clientY + nativeEvent.touches[1].clientY) / 2) - rect.top;
        handleZoomAt({ sx: midX, sy: midY }, factor);
      }
      lastTouchDistance.current = dist;
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
      const ctx = contextRef.current;
      ctx.lineTo(worldCoords.wx, worldCoords.wy);
      ctx.stroke();
    }
  };

  const stopInteraction = () => {
    if (isDrawingRef.current && contextRef.current) {
      contextRef.current.closePath();
    }
    isPanningRef.current = false;
    isDrawingRef.current = false;
    lastTouchDistance.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const delta = e.deltaY > 0 ? -1 : 1;
    const factor = Math.pow(1 + zoomIntensity, delta);
    const rect = e.currentTarget.getBoundingClientRect();
    handleZoomAt({ sx: e.clientX - rect.left, sy: e.clientY - rect.top }, factor);
  };

  const handleZoomAt = (screenCoords: { sx: number, sy: number }, factor: number) => {
    setViewport(prev => {
      const newZoom = Math.min(Math.max(prev.zoom * factor, 0.1), 5);
      const worldPos = {
        x: (screenCoords.sx - prev.x) / prev.zoom,
        y: (screenCoords.sy - prev.y) / prev.zoom
      };
      return {
        zoom: newZoom,
        x: screenCoords.sx - worldPos.x * newZoom,
        y: screenCoords.sy - worldPos.y * newZoom
      };
    });
  };

  const getScreenCoordinates = (event: any) => {
    const rect = canvasRef.current?.closest('main')?.getBoundingClientRect() || { left: 0, top: 0 };
    if (event.touches && event.touches.length > 0) {
      return {
        sx: event.touches[0].clientX - rect.left,
        sy: event.touches[0].clientY - rect.top
      };
    }
    const x = event.clientX !== undefined ? event.clientX : event.pageX;
    const y = event.clientY !== undefined ? event.clientY : event.pageY;
    return { sx: x - rect.left, sy: y - rect.top };
  };

  const addItem = (content: string, type: BoardItem['type'] = 'emoji', screenX?: number, screenY?: number) => {
    saveToUndoStack();
    const sx = screenX !== undefined ? screenX : window.innerWidth / 2;
    const sy = screenY !== undefined ? screenY : window.innerHeight / 2;
    const worldPos = screenToWorld(sx, sy);

    const newItem: BoardItem = {
      id: Math.random().toString(36).substr(2, 9),
      content,
      type,
      x: worldPos.wx,
      y: worldPos.wy,
      scale: 1,
      rotation: 0
    };
    setItems(prev => [...prev, newItem]);
    setSelectedItemId(newItem.id);
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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (content) {
      addItem(content, type, x, y);
    }
  };

  const handleDragOverBoard = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleItemMouseDown = (e: React.MouseEvent, item: BoardItem) => {
    if (activeTool === 'select' && !isPanningRef.current) {
        e.stopPropagation();
        setSelectedItemId(item.id);
        saveToUndoStack();
        const startX = e.clientX;
        const startY = e.clientY;
        const initialX = item.x;
        const initialY = item.y;
        const handleMouseMove = (moveEvent: MouseEvent) => {
          const dx = (moveEvent.clientX - startX) / viewport.zoom;
          const dy = (moveEvent.clientY - startY) / viewport.zoom;
          setItems(prev => prev.map(it => it.id === item.id ? { ...it, x: initialX + dx, y: initialY + dy } : it));
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
    const startX = e.clientX;
    const initialScale = item.scale;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / viewport.zoom;
      const factor = 1 + (dx / 100);
      const newScale = Math.max(0.2, Math.min(initialScale * factor, 5));
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, scale: newScale } : it));
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
    
    const drawing = canvasRef.current?.toDataURL('image/png');
    const newBoard: Whiteboard = {
      id: Math.random().toString(36).substr(2, 9),
      conceptId: concept.id,
      name: name || `Lesson ${new Date().toLocaleTimeString()}`,
      timestamp: Date.now(),
      items: [...items],
      bg: boardBg,
      drawingData: drawing,
      viewport: { ...viewport }
    };
    
    const currentConceptBoards = design.conceptBoards || {};
    const updatedDesign: ClassroomDesign = { 
      ...design, 
      whiteboards: [...(design.whiteboards || []), newBoard],
      conceptBoards: {
        ...currentConceptBoards,
        [concept.id]: newBoard
      }
    };
    
    onSaveDesign(updatedDesign);
    alert("Board submitted! You can find it in the History sidebar (🕰️) anytime. ✨");
    return true;
  };

  const restoreBoardState = (board: Whiteboard) => {
    setItems(board.items || []);
    setBoardBg(board.bg || 'plain');
    if (board.viewport) setViewport(board.viewport);
    
    if (contextRef.current && canvasRef.current) {
      const ctx = contextRef.current;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      if (board.drawingData) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = board.drawingData;
      }
    }

    setActiveCategoryId(categories[0].id);
    setDrawerOpen(false);
    setUndoStack([]); 
    setSelectedItemId(null);

    const updatedDesign: ClassroomDesign = { 
      ...design, 
      conceptBoards: {
        ...(design.conceptBoards || {}),
        [concept.id]: board
      }
    };
    onSaveDesign(updatedDesign);
  };

  const deleteFromHistory = (boardId: string) => {
    if (confirm("Permanently delete this board from your history?")) {
      onSaveDesign({
        ...design,
        whiteboards: (design.whiteboards || []).filter(b => b.id !== boardId)
      });
    }
  };

  const handleClearEverything = () => {
    const shouldSave = confirm("Do you want to save your current whiteboard before starting a new one?");
    
    if (shouldSave) {
      const saved = handleSaveBoard();
      if (!saved) return;
    }
    
    setItems([]);
    if (contextRef.current) {
      contextRef.current.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    }
    setViewport({ x: 0, y: 0, zoom: 1 });
    setUndoStack([]);
    setSelectedItemId(null);
    
    const currentConceptBoards = design.conceptBoards || {};
    const updatedConceptBoards = { ...currentConceptBoards };
    delete updatedConceptBoards[concept.id];
    
    onSaveDesign({
      ...design,
      conceptBoards: updatedConceptBoards
    });
  };

  const handleHomeReset = () => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  };

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'pdf': return '📄';
      case 'slides': return '📊';
      case 'video': return '🎬';
      default: return '📁';
    }
  };

  const handleMaterialMouseDown = (e: React.MouseEvent) => {
    isDraggingMaterial.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = materialPos.x;
    const initialY = materialPos.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      setMaterialPos({
        x: initialX + (moveEvent.clientX - startX),
        y: initialY + (moveEvent.clientY - startY)
      });
    };

    const onMouseUp = () => {
      isDraggingMaterial.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const renderCategoryContent = () => {
    const iconBaseClass = "w-full aspect-square bg-white rounded-xl shadow border-2 border-slate-200 font-black text-slate-900 text-3xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer overflow-hidden px-1";
    const wordBaseClass = "col-span-1 bg-white rounded-2xl shadow border-2 border-slate-200 font-bold text-slate-900 text-sm py-4 px-2 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer text-center truncate min-h-[64px]";
    const headerClass = "col-span-3 mt-6 mb-3 text-xs font-black uppercase text-slate-500 tracking-widest border-b-2 border-slate-100 pb-2 flex items-center gap-2";

    if (activeCategoryId === 'UPPER') {
      return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => (
        <button key={l} draggable onDragStart={(e) => handleDragStartAsset(e, l, 'text')} onClick={() => addItem(l, 'text')} className={iconBaseClass}>{l}</button>
      ));
    }
    if (activeCategoryId === 'LOWER') {
      return "abcdefghijklmnopqrstuvwxyz".split("").map(l => (
        <button key={l} draggable onDragStart={(e) => handleDragStartAsset(e, l, 'text')} onClick={() => addItem(l, 'text')} className={iconBaseClass}>{l}</button>
      ));
    }
    if (activeCategoryId === 'BLENDS') {
      return (
        <>
          <div className={headerClass}><span>Vowel-First (VC)</span></div>
          {VC_WORDS.map(w => (
            <button key={w} draggable onDragStart={(e) => handleDragStartAsset(e, w, 'text')} onClick={() => addItem(w, 'text')} className={wordBaseClass}>{w}</button>
          ))}
          <div className={headerClass}><span>Consonant-First (CV)</span></div>
          {CV_WORDS.map(w => (
            <button key={w} draggable onDragStart={(e) => handleDragStartAsset(e, w, 'text')} onClick={() => addItem(w, 'text')} className={wordBaseClass}>{w}</button>
          ))}
        </>
      );
    }
    if (activeCategoryId === 'SIGHT') {
      return (
        <>
          <div className={headerClass}><span>Phonics Words</span></div>
          {REGULAR_SIGHT_WORDS.map(w => (
            <button key={w} draggable onDragStart={(e) => handleDragStartAsset(e, w, 'text')} onClick={() => addItem(w, 'text')} className={wordBaseClass}>{w}</button>
          ))}
          <div className={headerClass}><span>Irregular Words</span></div>
          {IRREGULAR_SIGHT_WORDS.map(w => (
            <button key={w} draggable onDragStart={(e) => handleDragStartAsset(e, w, 'text')} onClick={() => addItem(w, 'text')} className={wordBaseClass}>{w}</button>
          ))}
        </>
      );
    }
    if (activeCategoryId === 'DIGRAPHS') {
      return (
        <>
          <div className={headerClass}><span>Consonant Teams</span></div>
          {CONSONANT_DIGRAPHS.map(w => (
            <button key={w} draggable onDragStart={(e) => handleDragStartAsset(e, w, 'text')} onClick={() => addItem(w, 'text')} className={wordBaseClass}>{w}</button>
          ))}
          <div className={headerClass}><span>Vowel Teams</span></div>
          {VOWEL_DIGRAPHS.map(w => (
            <button key={w} draggable onDragStart={(e) => handleDragStartAsset(e, w, 'text')} onClick={() => addItem(w, 'text')} className={wordBaseClass}>{w}</button>
          ))}
        </>
      );
    }
    if (activeCategoryId === 'LETTERS') {
        return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => (
          <button key={l} draggable onDragStart={(e) => handleDragStartAsset(e, l, 'text')} onClick={() => addItem(l, 'text')} className={iconBaseClass}>{l}</button>
        ));
    }
    if (activeCategoryId === 'NUMBERS') {
      return Array.from({length: 50}, (_, i) => i + 1).map(n => (
        <button key={n} draggable onDragStart={(e) => handleDragStartAsset(e, n.toString(), 'text')} onClick={() => addItem(n.toString(), 'text')} className={iconBaseClass}>{n}</button>
      ));
    }
    if (activeCategoryId === 'STICKERS') {
      return STICKERS.map(s => (
        <button key={s.id} draggable onDragStart={(e) => handleDragStartAsset(e, s.emoji, 'sticker')} onClick={() => addItem(s.emoji, 'sticker')} className={iconBaseClass.replace('text-3xl', 'text-4xl')}>{s.emoji}</button>
      ));
    }
    if (activeCategoryId === 'SHAPES') {
      return ['⭕', '⬜', '🔺', '⭐', '❤️', '🟦', '🔶', '🔷', '🛑', '💠', '🪁', '🌙', '☁️', '⚡'].map(s => (
        <button key={s} draggable onDragStart={(e) => handleDragStartAsset(e, s, 'shape')} onClick={() => addItem(s, 'shape')} className={iconBaseClass.replace('text-3xl', 'text-4xl')}>{s}</button>
      ));
    }
    if (activeCategoryId === 'HISTORY') {
      const saved = (design.whiteboards || []).filter(b => b.conceptId === concept.id);
      if (saved.length === 0) return <div className="col-span-3 text-center py-12 text-slate-400 font-bold px-4">No history yet. 🕰️</div>;
      
      return [...saved].reverse().map(board => (
        <div key={board.id} className="col-span-3 flex items-stretch gap-2 group/hist">
          <button onClick={() => restoreBoardState(board)} className="flex-1 p-4 bg-white border-2 rounded-2xl text-left hover:border-blue-400 shadow-sm transition-all overflow-hidden">
            <div className="font-black text-slate-900 truncate group-hover/hist:text-blue-600 text-sm">{board.name}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{new Date(board.timestamp).toLocaleDateString()}</div>
          </button>
          <button onClick={() => deleteFromHistory(board.id)} className="w-10 bg-rose-50 border-2 border-rose-100 rounded-xl text-rose-300 hover:text-rose-600 transition-colors flex items-center justify-center">✕</button>
        </div>
      ));
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
            <h1 className="font-black text-slate-900 tracking-tight leading-tight">{concept.title}</h1>
            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">{currentSubject?.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleClearEverything} className="px-4 py-2 bg-slate-100 rounded-xl font-black text-slate-900 text-sm border-b-4 border-slate-200 active:translate-y-1 active:border-b-0 transition-all">✨ New</button>
          <button onClick={handleSaveBoard} className="px-4 py-2 bg-blue-500 text-white rounded-xl font-black text-sm border-b-4 border-blue-700 active:translate-y-1 active:border-b-0 transition-all shadow-md">💾 Submit</button>
          <div className="flex gap-1 ml-4 bg-slate-100 p-1 rounded-xl">
             <button onClick={() => setBoardBg('plain')} className={`p-2 rounded-lg ${boardBg === 'plain' ? 'bg-white shadow-sm ring-2 ring-blue-400' : ''}`}>⬜</button>
             <button onClick={() => setBoardBg('lined')} className={`p-2 rounded-lg ${boardBg === 'lined' ? 'bg-white shadow-sm ring-2 ring-blue-400' : ''}`}>📝</button>
             <button onClick={() => setBoardBg('grid')} className={`p-2 rounded-lg ${boardBg === 'grid' ? 'bg-white shadow-sm ring-2 ring-blue-400' : ''}`}>📊</button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Assets Drawer Sidebar (Left) - Removed overall overflow-hidden so toggle can stick out */}
        <div className={`absolute left-0 top-0 bottom-0 z-[60] bg-white border-r-4 border-slate-100 shadow-2xl transition-transform duration-300 w-96 flex ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Vertical Tab Sidebar - Larger and scrollable */}
          <div className="w-28 flex-shrink-0 bg-slate-50 border-r-2 border-slate-100 flex flex-col overflow-y-auto hide-scrollbar py-6 gap-4 items-center custom-scrollbar">
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`w-20 h-20 flex-shrink-0 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                  activeCategoryId === cat.id 
                    ? 'bg-white shadow-lg text-blue-500 ring-2 ring-blue-100 scale-105' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                <span className="text-4xl font-black">{cat.icon}</span>
                <span className="text-[11px] font-black uppercase tracking-tight text-center leading-none px-1">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-white">
              <h3 className="font-black text-slate-400 text-xs tracking-widest uppercase truncate">
                {categories.find(c => c.id === activeCategoryId)?.label} Drawer
              </h3>
              <button onClick={() => setDrawerOpen(false)} className="text-slate-300 hover:text-rose-500 font-black">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-3 gap-5 content-start custom-scrollbar">
              {renderCategoryContent()}
            </div>
          </div>
          
          {/* Toggle Tab - Restored and Improved */}
          <button 
            onClick={() => setDrawerOpen(!drawerOpen)} 
            className="absolute left-full top-1/2 -translate-y-1/2 bg-white border-r-4 border-slate-100 p-4 rounded-r-3xl shadow-xl font-black text-xl hover:translate-x-1 transition-all flex items-center justify-center min-w-[56px] border-b-4 border-slate-200"
            title={drawerOpen ? "Close Drawer" : "Open Drawer"}
          >
            {drawerOpen ? '⬅️' : '📦'}
          </button>
        </div>

        {/* Material Library Sidebar (Right) */}
        <div className={`absolute right-0 top-0 bottom-0 z-[65] bg-white border-l-4 border-slate-100 shadow-2xl transition-transform duration-300 w-80 flex flex-col ${libraryOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4 border-b flex justify-between items-center bg-blue-50">
            <h3 className="font-black text-blue-500 text-xs tracking-widest uppercase flex items-center gap-2">
              <span className="text-xl">📚</span> Material Library
            </h3>
            <button onClick={() => setLibraryOpen(false)} className="text-slate-300 hover:text-rose-500 font-black">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {!filteredMaterials.length ? (
              <div className="text-center py-12 px-4">
                 <div className="text-5xl mb-4 opacity-20">📂</div>
                 <p className="font-black text-slate-400">No materials for this subject!</p>
                 <p className="text-xs text-slate-300 mt-2">Go to Teacher Mode to upload PDFs or Videos for your class.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <h4 className="px-1 text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${currentSubject?.color || 'bg-blue-400'}`}></span>
                  {currentSubject?.title || 'Current Subject'}
                </h4>
                <div className="space-y-4">
                  {filteredMaterials.map(mat => (
                    <button 
                      key={mat.id} 
                      onClick={() => {
                        setActiveMaterial(mat);
                        setLibraryOpen(false);
                      }} 
                      className="w-full bg-white border-2 rounded-3xl hover:border-blue-400 shadow-sm transition-all group/mat hover:-translate-y-1 active:scale-95 overflow-hidden flex flex-col"
                    >
                      <div className="h-28 bg-slate-50 relative flex items-center justify-center overflow-hidden">
                        {mat.thumbnailUrl ? (
                          <img src={mat.thumbnailUrl} alt={mat.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-5xl group-hover/mat:scale-110 transition-transform">{getFileIcon(mat.type)}</div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                           <span>{getFileIcon(mat.type)}</span>
                           <span className="text-slate-500">{mat.type}</span>
                        </div>
                      </div>
                      <div className="p-3 text-left">
                        <div className="font-black text-slate-900 truncate text-xs">{mat.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Toggle Tab */}
          <button 
            onClick={() => setLibraryOpen(!libraryOpen)} 
            className="absolute right-full top-1/2 -translate-y-1/2 bg-blue-500 text-white border-l-4 border-blue-700 p-4 rounded-l-3xl shadow-xl font-black text-xl hover:-translate-x-1 transition-all flex items-center justify-center min-w-[56px]"
            title={libraryOpen ? "Close Library" : "Open Library"}
          >
            {libraryOpen ? '➡️' : '📚'}
          </button>
        </div>

        <main 
          className="flex-1 relative overflow-hidden flex flex-col bg-slate-50" 
          onDrop={handleDropOnBoard} 
          onDragOver={handleDragOverBoard}
          onWheel={handleWheel}
        >
          {/* Material Viewer Floating Window Overlay */}
          {activeMaterial && (
            <div 
              className="absolute z-[90] pointer-events-auto shadow-2xl transition-opacity animate-material-enter"
              style={{ 
                left: materialPos.x, 
                top: materialPos.y, 
                width: 'min(900px, 92vw)',
                height: 'min(750px, 85vh)'
              }}
            >
              <div className="bg-white w-full h-full rounded-[2.5rem] border-8 border-white flex flex-col overflow-hidden shadow-2xl ring-4 ring-black/5">
                <div 
                  className="flex items-center justify-between p-4 bg-slate-50 cursor-move border-b-2"
                  onMouseDown={handleMaterialMouseDown}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getFileIcon(activeMaterial.type)}</div>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs tracking-tight truncate max-w-[200px]">{activeMaterial.name}</h4>
                      <div className="text-[9px] text-blue-500 font-black uppercase tracking-widest">Teaching Mode • Active Resource</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveMaterial(null)} className="w-10 h-10 bg-white rounded-xl shadow border-2 flex items-center justify-center text-lg hover:bg-rose-50 hover:text-rose-500 transition-all">✕</button>
                  </div>
                </div>
                <div className="flex-1 bg-white flex items-center justify-center overflow-hidden">
                  {activeMaterial.type === 'video' ? (
                    <div className="w-full h-full bg-black flex items-center justify-center relative">
                      {materialUrl ? (
                        <video 
                          src={materialUrl} 
                          controls 
                          className="max-w-full max-h-full"
                          autoPlay
                        />
                      ) : (
                        <div className="text-center text-white p-8">
                          <div className="text-6xl mb-4">🎬</div>
                          <p className="font-bold">Video content loading...</p>
                        </div>
                      )}
                    </div>
                  ) : activeMaterial.type === 'pdf' || activeMaterial.type === 'slides' ? (
                    materialUrl ? (
                      <iframe 
                        src={`${materialUrl}#toolbar=1&view=FitH`} 
                        className="w-full h-full border-none bg-white" 
                        title={activeMaterial.name}
                        allow="autoplay"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                        <div className="text-6xl mb-4 animate-bounce">📂</div>
                        <h5 className="text-lg font-black text-slate-800 mb-1">Loading Document...</h5>
                        <p className="text-slate-500 font-medium text-xs max-w-[200px]">Preparing your magical lesson materials. Please wait a moment! ✨</p>
                      </div>
                    )
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center">
                      <div className="text-6xl mb-4">📂</div>
                      <p className="text-slate-700 font-black text-sm">Generic Viewer</p>
                    </div>
                  )}
                </div>
                <div className="p-3 text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-t">
                   Interactive Viewer • Scroll to browse • Pinch to zoom
                </div>
              </div>
            </div>
          )}

          <div className="absolute top-4 right-4 z-[70] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full font-black text-slate-900 text-xs shadow-lg border-2 border-slate-100 select-none">
            {Math.round(viewport.zoom * 100)}%
          </div>

          <div 
            className={`flex-1 relative touch-none select-none ${activeTool === 'select' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`} 
            onMouseDown={startInteraction} 
            onMouseMove={performInteraction} 
            onMouseUp={stopInteraction} 
            onMouseLeave={stopInteraction}
            onTouchStart={startInteraction}
            onTouchMove={performInteraction}
            onTouchEnd={stopInteraction}
            style={{ touchAction: 'none' }}
          >
            <div 
              className={`absolute inset-0 origin-top-left ${boardBg === 'lined' ? 'board-lined' : boardBg === 'grid' ? 'board-grid' : 'bg-white'}`} 
              style={{ 
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`, 
                backgroundPosition: '0 0',
                backgroundSize: `50px 50px`,
                width: '2000px',
                height: '2000px'
              }}
            >
              <canvas 
                ref={canvasRef} 
                className="absolute inset-0 pointer-events-none" 
              />
              {items.map(item => (
                <div 
                  key={item.id} 
                  className="absolute z-10 select-none group pointer-events-auto" 
                  style={{ 
                    left: item.x, 
                    top: item.y, 
                    transform: `translate(-50%, -50%) scale(${item.scale})`
                  }} 
                  onMouseDown={(e) => handleItemMouseDown(e, item)}
                >
                  <div className={`relative p-4 rounded-3xl border-4 transition-all ${
                    selectedItemId === item.id ? 'border-blue-400 bg-blue-500/10' : 'border-transparent'
                  } ${activeTool === 'select' ? 'hover:border-blue-400' : ''}`}>
                    <span className={`block pointer-events-none ${item.type === 'text' ? 'text-7xl font-black text-slate-900' : 'text-9xl'}`}>{item.content}</span>
                    
                    {activeTool === 'select' && selectedItemId === item.id && (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} 
                          className="absolute -top-3 -right-3 w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-xl font-black text-xl hover:scale-110 transition-all border-4 border-white"
                        >
                          🗑️
                        </button>
                        <div 
                          className="absolute -bottom-3 -right-3 w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-xl cursor-nwse-resize flex items-center justify-center text-[10px] text-white font-bold"
                          onMouseDown={(e) => handleResizeMouseDown(e, item)}
                        >
                          ↔️
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-24 bg-white/95 backdrop-blur-md border-t-4 border-slate-100 flex items-center justify-center gap-6 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
            <div className="flex bg-slate-100 p-2 rounded-full shadow-inner gap-1">
              {[
                {id: 'select', icon: '🖐️', label: 'Hand Tool'},
                {id: 'marker', icon: '✏️', label: 'Sharpie'},
                {id: 'highlighter', icon: '🖍️', label: 'Highlighter'},
                {id: 'eraser', icon: '🧼', label: 'Eraser'}
              ].map(tool => (
                <div key={tool.id} className="relative group/tool">
                  <button 
                    title={tool.label}
                    onClick={() => {
                      if (activeTool === tool.id && (tool.id === 'marker' || tool.id === 'highlighter')) {
                        setShowColorPicker(showColorPicker === tool.id ? null : tool.id as any);
                      } else {
                        setActiveTool(tool.id as any);
                        setShowColorPicker(null);
                      }
                    }} 
                    className={`w-16 h-16 rounded-full transition-all flex items-center justify-center text-2xl relative ${activeTool === tool.id ? 'bg-white shadow-xl text-blue-500 scale-110 ring-2 ring-blue-100' : 'opacity-40 hover:opacity-100'}`}
                  >
                    {tool.icon}
                    {(tool.id === 'marker' || tool.id === 'highlighter') && (
                      <div className="absolute -bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: tool.id === 'marker' ? markerColor : highlighterColor }} />
                    )}
                  </button>

                  {showColorPicker === tool.id && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white p-3 rounded-2xl shadow-2xl border-2 border-slate-100 z-[80] animate-fade-in flex gap-2">
                      {(tool.id === 'marker' ? MARKER_COLORS : HIGHLIGHTER_COLORS).map(c => (
                        <button
                          key={c.value}
                          onClick={() => {
                            if (tool.id === 'marker') setMarkerColor(c.value);
                            else setHighlightColor(c.value);
                            setShowColorPicker(null);
                          }}
                          className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-125 ${ (tool.id === 'marker' ? markerColor : highlighterColor) === c.value ? 'border-blue-400 scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="h-12 w-px bg-slate-200" />

            <div className="flex gap-2">
              <button onClick={() => handleZoomAt({ sx: window.innerWidth / 2, sy: window.innerHeight / 2 }, 1.25)} className="w-14 h-14 rounded-2xl bg-white shadow-lg border-2 border-slate-100 flex items-center justify-center text-xl hover:bg-slate-50 active:translate-y-1 active:shadow-sm transition-all" title="Zoom In">➕</button>
              <button onClick={() => handleZoomAt({ sx: window.innerWidth / 2, sy: window.innerHeight / 2 }, 0.8)} className="w-14 h-14 rounded-2xl bg-white shadow-lg border-2 border-slate-100 flex items-center justify-center text-xl hover:bg-slate-50 active:translate-y-1 active:shadow-sm transition-all" title="Zoom Out">➖</button>
              <button onClick={handleHomeReset} className="w-14 h-14 rounded-2xl bg-slate-50 shadow-lg border-2 border-slate-100 flex items-center justify-center text-xl hover:bg-slate-100 active:translate-y-1 active:shadow-sm transition-all" title="Reset View">🏠</button>
            </div>

            <button onClick={handleUndo} disabled={undoStack.length === 0} className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl border-b-8 transition-all active:translate-y-1 active:border-b-0 ${undoStack.length > 0 ? 'bg-amber-100 text-amber-600 border-amber-300' : 'bg-slate-50 text-slate-200 cursor-not-allowed border-slate-100'}`} title="Undo Last Action">↩️</button>
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
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        .animate-material-enter { animation: material-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ConceptDashboard;
