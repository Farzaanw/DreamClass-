
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Concept, ClassroomDesign, Message, BoardItem, Whiteboard } from '../types';
import { decodeBase64, encodeBase64, decodeAudioData } from '../audioUtils';
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

const ConceptDashboard: React.FC<ConceptDashboardProps> = ({ concept, design, subjectId, onBack, onSaveDesign }) => {
  // Board State
  const [items, setItems] = useState<BoardItem[]>([]);
  const [history, setHistory] = useState<BoardItem[][]>([]);
  const [activeTool, setActiveTool] = useState<'select' | 'marker' | 'highlighter' | 'eraser'>('select');
  const [boardBg, setBoardBg] = useState<'plain' | 'lined' | 'grid'>('plain');
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES.LETTERS);
  const [drawerOpen, setDrawerOpen] = useState(true);

  // AI & Session State
  const [isLive, setIsLive] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Canvas Setup ---
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        contextRef.current = ctx;
      }
    }
  }, []);

  // --- History & Undo ---
  const saveToHistory = (currentState: BoardItem[]) => {
    setHistory(prev => {
      const newHistory = [...prev, currentState];
      return newHistory.slice(-20); // Keep last 20 states
    });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setItems(previous);
    setHistory(prev => prev.slice(0, -1));
  };

  // --- Drawing Logic ---
  const startDrawing = ({ nativeEvent }: any) => {
    if (activeTool === 'select') return;
    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    isDrawingRef.current = true;
  };

  const draw = ({ nativeEvent }: any) => {
    if (!isDrawingRef.current || !contextRef.current || activeTool === 'select') return;
    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    const ctx = contextRef.current;
    if (activeTool === 'marker') {
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 6;
      ctx.globalCompositeOperation = 'source-over';
    } else if (activeTool === 'highlighter') {
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.5)';
      ctx.lineWidth = 25;
      ctx.globalCompositeOperation = 'source-over';
    } else if (activeTool === 'eraser') {
      ctx.lineWidth = 50;
      ctx.globalCompositeOperation = 'destination-out';
    }
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawingRef.current) {
      // For drawing, we'd ideally save canvas state too, but let's focus on items for undo
      contextRef.current?.closePath();
      isDrawingRef.current = false;
    }
  };

  const getCoordinates = (event: any) => {
    if (event.touches) {
      const rect = canvasRef.current!.getBoundingClientRect();
      return {
        offsetX: event.touches[0].clientX - rect.left,
        offsetY: event.touches[0].clientY - rect.top
      };
    }
    return { offsetX: event.offsetX, offsetY: event.offsetY };
  };

  // --- Board Interaction Logic ---
  const addItem = (content: string, type: BoardItem['type'] = 'emoji', x?: number, y?: number) => {
    saveToHistory(items);
    const newItem: BoardItem = {
      id: Math.random().toString(36).substr(2, 9),
      content,
      type,
      x: x !== undefined ? x : (150 + Math.random() * 200),
      y: y !== undefined ? y : (150 + Math.random() * 200),
      scale: 1,
      rotation: 0
    };
    setItems(prev => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    saveToHistory(items);
    setItems(prev => prev.filter(item => item.id !== id));
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
    if (activeTool !== 'select') return;
    e.stopPropagation();
    saveToHistory(items);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = item.x;
    const initialY = item.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, x: initialX + dx, y: initialY + dy } : it));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // --- Board Storage & UI ---
  const handleSaveBoard = () => {
    const name = prompt("Name your whiteboard session:", `Lesson ${new Date().toLocaleTimeString()}`);
    if (!name) return;
    
    const drawing = canvasRef.current?.toDataURL();
    const newBoard: Whiteboard = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      timestamp: Date.now(),
      items: items,
      bg: boardBg,
      drawingData: drawing
    };

    const updatedDesign = {
      ...design,
      whiteboards: [...(design.whiteboards || []), newBoard]
    };
    onSaveDesign(updatedDesign);
    alert("Whiteboard saved to Subject History! ✨");
  };

  const handleLoadBoard = (board: Whiteboard) => {
    if (confirm(`Load "${board.name}"? This will replace your current board.`)) {
      saveToHistory(items);
      setItems(board.items);
      setBoardBg(board.bg);
      if (board.drawingData && contextRef.current) {
        const img = new Image();
        img.onload = () => {
          contextRef.current?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
          contextRef.current?.drawImage(img, 0, 0);
        };
        img.src = board.drawingData;
      }
      setDrawerOpen(false);
    }
  };

  const handleClearEverything = () => {
    if (items.length === 0 && contextRef.current) {
       // Check if canvas is empty is hard, so we always prompt if drawing might exist
    }
    if (confirm("Are you sure you want to clear your magic whiteboard? This will delete everything! 🧹✨")) {
      saveToHistory(items);
      setItems([]);
      contextRef.current?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    }
  };

  const renderCategoryContent = () => {
    if (activeCategory === CATEGORIES.LETTERS) {
      return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("").map(l => (
        <button 
          key={l} 
          title={`Drag Letter ${l}`} 
          draggable 
          onDragStart={(e) => handleDragStartAsset(e, l, 'text')}
          onClick={() => addItem(l, 'text')} 
          className="w-12 h-12 bg-white rounded-xl shadow-md border-2 border-slate-200 font-bold text-2xl text-slate-800 flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-grab active:cursor-grabbing"
        >
          {l}
        </button>
      ));
    }
    if (activeCategory === CATEGORIES.NUMBERS) {
      return Array.from({length: 21}, (_, i) => i).map(n => (
        <button 
          key={n} 
          title={`Drag Number ${n}`} 
          draggable
          onDragStart={(e) => handleDragStartAsset(e, n.toString(), 'text')}
          onClick={() => addItem(n.toString(), 'text')} 
          className="w-12 h-12 bg-white rounded-xl shadow-md border-2 border-slate-200 font-bold text-2xl text-slate-900 flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-grab active:cursor-grabbing"
        >
          {n}
        </button>
      ));
    }
    if (activeCategory === CATEGORIES.STICKERS) {
      return STICKERS.map(s => (
        <button 
          key={s.id} 
          title={`Drag Sticker ${s.id}`} 
          draggable
          onDragStart={(e) => handleDragStartAsset(e, s.emoji, 'sticker')}
          onClick={() => addItem(s.emoji, 'sticker')} 
          className="w-12 h-12 bg-white rounded-xl shadow-md border-2 border-slate-200 text-3xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-grab active:cursor-grabbing"
        >
          {s.emoji}
        </button>
      ));
    }
    if (activeCategory === CATEGORIES.SHAPES) {
      return ['⭕', '⬜', '🔺', '⭐', '❤️', '🟦', '🟡', '🛑'].map(s => (
        <button 
          key={s} 
          title={`Drag Shape ${s}`} 
          draggable
          onDragStart={(e) => handleDragStartAsset(e, s, 'shape')}
          onClick={() => addItem(s, 'shape')} 
          className="w-12 h-12 bg-white rounded-xl shadow-md border-2 border-slate-200 text-3xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-grab active:cursor-grabbing"
        >
          {s}
        </button>
      ));
    }
    if (activeCategory === CATEGORIES.HISTORY) {
      const saved = design.whiteboards || [];
      if (saved.length === 0) return <div className="col-span-4 text-center py-10 text-slate-400 font-bold">No saved boards yet! 🕰️</div>;
      return saved.map(board => (
        <button key={board.id} onClick={() => handleLoadBoard(board)} className="col-span-4 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-left hover:border-blue-400 hover:bg-white transition-all group">
          <div className="font-bold text-slate-700 truncate group-hover:text-blue-600">{board.name}</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(board.timestamp).toLocaleDateString()}</div>
        </button>
      ));
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden font-['Fredoka']">
      {/* Header */}
      <header className="h-16 bg-white border-b px-6 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} title="Back to Classroom" className="text-2xl p-2 hover:bg-slate-100 rounded-full transition-colors">⬅️</button>
          <div>
            <h1 className="font-bold text-slate-800 leading-none">{concept.title}</h1>
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Interactive Whiteboard</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button title="New Board" onClick={handleClearEverything} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200">✨ New</button>
          <button title="Save Session" onClick={handleSaveBoard} className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 shadow-md">💾 Save</button>
          <div className="w-px h-8 bg-slate-200 mx-2" />
          <div className="flex gap-1">
             <button onClick={() => setBoardBg('plain')} title="Plain Background" className={`p-2 rounded-lg border-2 ${boardBg === 'plain' ? 'border-blue-500 bg-blue-50' : 'border-slate-100'}`}>⬜</button>
             <button onClick={() => setBoardBg('lined')} title="Lined Paper" className={`p-2 rounded-lg border-2 ${boardBg === 'lined' ? 'border-blue-500 bg-blue-50' : 'border-slate-100'}`}>📝</button>
             <button onClick={() => setBoardBg('grid')} title="Graph Paper" className={`p-2 rounded-lg border-2 ${boardBg === 'grid' ? 'border-blue-500 bg-blue-50' : 'border-slate-100'}`}>📊</button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Asset Drawer */}
        <div className={`absolute left-0 top-0 bottom-0 z-40 bg-white border-r shadow-2xl transition-transform duration-300 w-72 flex flex-col ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest">Magic Drawer</h3>
            <button onClick={() => setDrawerOpen(false)} className="text-slate-300 hover:text-rose-500">✕</button>
          </div>
          <div className="flex bg-slate-100 p-1 border-b">
            {Object.values(CATEGORIES).map(cat => (
              <button key={cat} title={`Category: ${cat}`} onClick={() => setActiveCategory(cat)} className={`flex-1 py-3 text-2xl rounded-xl transition-all ${activeCategory === cat ? 'bg-white shadow-md scale-105' : 'opacity-40 hover:opacity-100'}`}>{cat}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 gap-3 content-start custom-scrollbar">
            {renderCategoryContent()}
          </div>
        </div>
        {!drawerOpen && (
          <button onClick={() => setDrawerOpen(true)} title="Open Assets" className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border-y border-r p-3 rounded-r-2xl shadow-xl z-30 font-bold text-slate-400 hover:text-blue-500 transition-all">📦</button>
        )}

        {/* Board Area */}
        <main 
          className={`flex-1 relative overflow-hidden flex flex-col ${boardBg === 'lined' ? 'board-lined' : boardBg === 'grid' ? 'board-grid' : 'bg-white'}`}
          onDrop={handleDropOnBoard}
          onDragOver={handleDragOverBoard}
        >
          <div 
            className="flex-1 relative cursor-crosshair transition-all duration-300"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          >
            <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />
            {items.map(item => (
              <div 
                key={item.id} 
                className="absolute z-10 select-none group" 
                style={{ left: item.x, top: item.y, transform: `translate(-50%, -50%)` }}
                onMouseDown={(e) => handleItemMouseDown(e, item)}
              >
                <div className={`relative p-4 rounded-2xl cursor-grab active:cursor-grabbing border-4 border-transparent ${activeTool === 'select' ? 'hover:border-blue-200' : ''}`}>
                  <span className={`block pointer-events-none ${item.type === 'text' ? 'text-7xl font-black text-slate-800 drop-shadow-sm' : 'text-9xl'}`}>{item.content}</span>
                  {activeTool === 'select' && (
                    <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg hover:scale-110">🗑️</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Toolbar */}
          <div className="h-24 bg-white/90 backdrop-blur-md border-t flex items-center justify-center gap-6 px-6 relative z-50">
            <div className="flex bg-slate-100 p-2 rounded-[2rem] shadow-inner gap-2">
              {[
                { id: 'select', icon: '🖐️', label: 'Move' },
                { id: 'marker', icon: '✏️', label: 'Marker' },
                { id: 'highlighter', icon: '🖍️', label: 'Glow' },
                { id: 'eraser', icon: '🧼', label: 'Eraser' },
              ].map(tool => (
                <button key={tool.id} title={tool.label} onClick={() => setActiveTool(tool.id as any)} className={`flex flex-col items-center justify-center w-16 h-16 rounded-[1.5rem] transition-all ${activeTool === tool.id ? 'bg-white shadow-xl scale-110 text-blue-500 ring-4 ring-blue-50' : 'opacity-40 hover:opacity-100'}`}>
                  <span className="text-2xl">{tool.icon}</span>
                  <span className="text-[9px] font-bold uppercase tracking-tighter">{tool.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={handleUndo} title="Undo Last Action" className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl transition-all border-b-4 active:translate-y-1 active:border-b-0 ${history.length > 0 ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'}`}>↩️</button>
              <button onClick={handleClearEverything} title="Clear Everything" className="w-16 h-16 bg-rose-50 text-rose-500 rounded-[1.5rem] flex items-center justify-center text-3xl hover:bg-rose-100 transition-all border-b-4 border-rose-200 active:translate-y-1 active:border-b-0">🗑️</button>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .board-lined {
          background-color: white;
          background-image: linear-gradient(rgba(59, 130, 246, 0.2) 2px, transparent 2px);
          background-size: 100% 50px;
        }
        .board-grid {
          background-color: white;
          background-image: linear-gradient(rgba(59, 130, 246, 0.15) 2px, transparent 2px),
                            linear-gradient(90deg, rgba(59, 130, 246, 0.15) 2px, transparent 2px);
          background-size: 50px 50px;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ConceptDashboard;
