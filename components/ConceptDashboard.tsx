
import React, { useState, useEffect, useRef } from 'react';
import { Concept, ClassroomDesign, BoardItem, Whiteboard } from '../types';
import { STICKERS } from '../constants';

interface ConceptDashboardProps {
  concept: Concept;
  design: ClassroomDesign;
  subjectId: string;
  onBack: () => void;
  onSaveDesign: (design: ClassroomDesign) => void;
}

const CATEGORIES = {
  LETTERS: 'ABC',
  NUMBERS: '123',
  STICKERS: '✨',
  SHAPES: '📐',
  HISTORY: '🕰️'
};

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

const ConceptDashboard: React.FC<ConceptDashboardProps> = ({ concept, design, onBack, onSaveDesign }) => {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [history, setHistory] = useState<{ items: BoardItem[], drawing: string | null }[]>([]);
  const [activeTool, setActiveTool] = useState<'select' | 'marker' | 'highlighter' | 'eraser'>('select');
  const [markerColor, setMarkerColor] = useState(MARKER_COLORS[0].value);
  const [highlighterColor, setHighlighterColor] = useState(HIGHLIGHTER_COLORS[0].value);
  const [showColorPicker, setShowColorPicker] = useState<'marker' | 'highlighter' | null>(null);
  
  const [boardBg, setBoardBg] = useState<'plain' | 'lined' | 'grid'>('plain');
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES.LETTERS);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

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

        // Load existing state for this concept if available
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

  const saveToHistoryState = () => {
    // CRITICAL: Use PNG for history snapshots to prevent black background transparency bug
    const drawingSnapshot = canvasRef.current ? canvasRef.current.toDataURL('image/png') : null;
    setHistory(prev => [...prev, { items: [...items], drawing: drawingSnapshot }].slice(-40));
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    
    // Get the previous state
    const previousState = history[history.length - 1];
    
    // Restore items
    setItems(previousState.items);
    
    // Restore the drawing layer
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
    
    // Remove the state we just reverted to from the history stack
    setHistory(prev => prev.slice(0, -1));
    setSelectedItemId(null);
  };

  const screenToWorld = (sx: number, sy: number) => {
    return {
      wx: (sx - viewport.x) / viewport.zoom,
      wy: (sy - viewport.y) / viewport.zoom
    };
  };

  const startInteraction = (e: any) => {
    const nativeEvent = e.nativeEvent || e;
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
      if (e.target === e.currentTarget) {
        setSelectedItemId(null);
      }
    } else {
      if (!contextRef.current) return;
      saveToHistoryState();
      
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

  const performInteraction = (e: any) => {
    const nativeEvent = e.nativeEvent || e;

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
        const rect = e.currentTarget.getBoundingClientRect();
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
    saveToHistoryState();
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
    saveToHistoryState();
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
    if (activeTool !== 'select' || isPanningRef.current) return;
    e.stopPropagation();
    setSelectedItemId(item.id);
    saveToHistoryState();
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
  };

  const handleResizeMouseDown = (e: React.MouseEvent, item: BoardItem) => {
    e.stopPropagation();
    saveToHistoryState();
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
    
    // Efficient capture for storage - Use PNG here too to avoid black bg in History
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
    alert("Board saved successfully! Access it anytime from the History drawer. ✨");
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
    setActiveCategory(CATEGORIES.LETTERS);
    setDrawerOpen(false);
    setHistory([]); 
    setSelectedItemId(null);
  };

  const deleteFromHistory = (boardId: string) => {
    if (confirm("Permanently delete this board from your records?")) {
      onSaveDesign({
        ...design,
        whiteboards: (design.whiteboards || []).filter(b => b.id !== boardId)
      });
    }
  };

  const handleClearEverything = () => {
    const choice = confirm("Do you want to clear your current progress? Click Cancel to save first!");
    if (!choice) return;
    
    setItems([]);
    if (contextRef.current) {
      contextRef.current.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    }
    setViewport({ x: 0, y: 0, zoom: 1 });
    setHistory([]);
    setSelectedItemId(null);
    
    const currentConceptBoards = design.conceptBoards || {};
    const { [concept.id]: _, ...rest } = currentConceptBoards;
    onSaveDesign({
      ...design,
      conceptBoards: rest
    });
  };

  const handleHomeReset = () => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  };

  const renderCategoryContent = () => {
    const iconBaseClass = "w-12 h-12 bg-white rounded-xl shadow border-2 border-slate-200 font-black text-slate-900 text-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer";
    
    if (activeCategory === CATEGORIES.LETTERS) {
      return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => (
        <button key={l} draggable onDragStart={(e) => handleDragStartAsset(e, l, 'text')} onClick={() => addItem(l, 'text')} className={iconBaseClass}>{l}</button>
      ));
    }
    if (activeCategory === CATEGORIES.NUMBERS) {
      return Array.from({length: 100}, (_, i) => i + 1).map(n => (
        <button key={n} draggable onDragStart={(e) => handleDragStartAsset(e, n.toString(), 'text')} onClick={() => addItem(n.toString(), 'text')} className={iconBaseClass}>{n}</button>
      ));
    }
    if (activeCategory === CATEGORIES.STICKERS) {
      return STICKERS.map(s => (
        <button key={s.id} draggable onDragStart={(e) => handleDragStartAsset(e, s.emoji, 'sticker')} onClick={() => addItem(s.emoji, 'sticker')} className={iconBaseClass.replace('text-2xl', 'text-3xl')}>{s.emoji}</button>
      ));
    }
    if (activeCategory === CATEGORIES.SHAPES) {
      return ['⭕', '⬜', '🔺', '⭐', '❤️', '🟦', '🔶', '🔷', '🛑', '💠', '🪁', '🌙', '☁️', '⚡'].map(s => (
        <button key={s} draggable onDragStart={(e) => handleDragStartAsset(e, s, 'shape')} onClick={() => addItem(s, 'shape')} className={iconBaseClass.replace('text-2xl', 'text-3xl')}>{s}</button>
      ));
    }
    if (activeCategory === CATEGORIES.HISTORY) {
      const saved = (design.whiteboards || []).filter(b => b.conceptId === concept.id);
      if (saved.length === 0) return <div className="col-span-4 text-center py-10 text-slate-400 font-bold px-4">No history for this concept. 🕰️</div>;
      
      return saved.map(board => (
        <div key={board.id} className="col-span-4 flex items-stretch gap-2 group/hist">
          <button onClick={() => restoreBoardState(board)} className="flex-1 p-4 bg-white border-2 rounded-2xl text-left hover:border-blue-400 shadow-sm transition-all overflow-hidden">
            <div className="font-black text-slate-900 truncate group-hover/hist:text-blue-600">{board.name}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(board.timestamp).toLocaleDateString()}</div>
          </button>
          <button onClick={() => deleteFromHistory(board.id)} className="w-10 bg-rose-50 border-2 border-rose-100 rounded-2xl text-rose-300 hover:text-rose-600 transition-colors">✕</button>
        </div>
      ));
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden font-['Fredoka']">
      <header className="h-16 bg-white border-b-4 border-slate-100 px-6 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-2xl p-2 hover:bg-slate-100 rounded-full transition-colors">⬅️</button>
          <h1 className="font-black text-slate-900 tracking-tight">{concept.title}</h1>
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
        <div className={`absolute left-0 top-0 bottom-0 z-[60] bg-white border-r-4 border-slate-100 shadow-2xl transition-transform duration-300 w-72 flex flex-col ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <h3 className="font-black text-slate-400 text-xs tracking-widest uppercase">Materials</h3>
            <button onClick={() => setDrawerOpen(false)} className="text-slate-300 hover:text-rose-500 font-black">✕</button>
          </div>
          <div className="flex bg-slate-100 p-1 border-b">
            {Object.values(CATEGORIES).map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex-1 py-3 text-xl rounded-xl font-black ${activeCategory === cat ? 'bg-white shadow-md text-blue-500' : 'opacity-40 text-slate-900'}`}>{cat}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 gap-3 content-start">
            {renderCategoryContent()}
          </div>
        </div>
        {!drawerOpen && <button onClick={() => setDrawerOpen(true)} className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border-r-4 border-slate-100 p-3 rounded-r-3xl shadow-xl z-[60] font-black text-xl hover:translate-x-1 transition-all">📦</button>}

        <main 
          className="flex-1 relative overflow-hidden flex flex-col bg-slate-50" 
          onDrop={handleDropOnBoard} 
          onDragOver={handleDragOverBoard}
          onWheel={handleWheel}
        >
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
                            else setHighlighterColor(c.value);
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

            <button onClick={handleUndo} disabled={history.length === 0} className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl border-b-8 transition-all active:translate-y-1 active:border-b-0 ${history.length > 0 ? 'bg-amber-100 text-amber-600 border-amber-300' : 'bg-slate-50 text-slate-200 cursor-not-allowed border-slate-100'}`} title="Undo Last Action">↩️</button>
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
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default ConceptDashboard;
