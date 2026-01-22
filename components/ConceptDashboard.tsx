import React, { useState, useEffect, useRef } from 'react';
import { Concept, ClassroomDesign, Message, BoardItem, Whiteboard } from '../types';
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
  const [items, setItems] = useState<BoardItem[]>([]);
  const [history, setHistory] = useState<BoardItem[][]>([]);
  const [activeTool, setActiveTool] = useState<'select' | 'marker' | 'highlighter' | 'eraser'>('select');
  const [boardBg, setBoardBg] = useState<'plain' | 'lined' | 'grid'>('plain');
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES.LETTERS);
  const [drawerOpen, setDrawerOpen] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);

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

  const saveToHistory = (currentState: BoardItem[]) => {
    setHistory(prev => [...prev, currentState].slice(-20));
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setItems(previous);
    setHistory(prev => prev.slice(0, -1));
  };

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

  const handleSaveBoard = () => {
    const name = prompt("Name your board:", `Lesson ${new Date().toLocaleTimeString()}`);
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
    onSaveDesign({ ...design, whiteboards: [...(design.whiteboards || []), newBoard] });
    alert("Saved! ✨");
  };

  const handleClearEverything = () => {
    if (confirm("Clear board? 🧹✨")) {
      saveToHistory(items);
      setItems([]);
      contextRef.current?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    }
  };

  const renderCategoryContent = () => {
    if (activeCategory === CATEGORIES.LETTERS) {
      return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => (
        <button key={l} draggable onDragStart={(e) => handleDragStartAsset(e, l, 'text')} onClick={() => addItem(l, 'text')} className="w-12 h-12 bg-white rounded-xl shadow border-2 border-slate-200 font-bold text-2xl flex items-center justify-center hover:scale-110">{l}</button>
      ));
    }
    if (activeCategory === CATEGORIES.NUMBERS) {
      return Array.from({length: 10}, (_, i) => i).map(n => (
        <button key={n} draggable onDragStart={(e) => handleDragStartAsset(e, n.toString(), 'text')} onClick={() => addItem(n.toString(), 'text')} className="w-12 h-12 bg-white rounded-xl shadow border-2 border-slate-200 font-bold text-2xl flex items-center justify-center hover:scale-110">{n}</button>
      ));
    }
    if (activeCategory === CATEGORIES.STICKERS) {
      return STICKERS.slice(0, 12).map(s => (
        <button key={s.id} draggable onDragStart={(e) => handleDragStartAsset(e, s.emoji, 'sticker')} onClick={() => addItem(s.emoji, 'sticker')} className="w-12 h-12 bg-white rounded-xl shadow border-2 border-slate-200 text-3xl flex items-center justify-center hover:scale-110">{s.emoji}</button>
      ));
    }
    if (activeCategory === CATEGORIES.SHAPES) {
      return ['⭕', '⬜', '🔺', '⭐', '❤️', '🟦'].map(s => (
        <button key={s} draggable onDragStart={(e) => handleDragStartAsset(e, s, 'shape')} onClick={() => addItem(s, 'shape')} className="w-12 h-12 bg-white rounded-xl shadow border-2 border-slate-200 text-3xl flex items-center justify-center hover:scale-110">{s}</button>
      ));
    }
    if (activeCategory === CATEGORIES.HISTORY) {
      const saved = design.whiteboards || [];
      if (saved.length === 0) return <div className="col-span-4 text-center py-10 text-slate-400 font-bold">No saved boards!</div>;
      return saved.map(board => (
        <button key={board.id} onClick={() => { setItems(board.items); setBoardBg(board.bg); setDrawerOpen(false); }} className="col-span-4 p-4 bg-slate-50 border-2 rounded-2xl text-left hover:border-blue-400">
          <div className="font-bold text-slate-700 truncate">{board.name}</div>
        </button>
      ));
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden font-['Fredoka']">
      <header className="h-16 bg-white border-b px-6 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-2xl p-2 hover:bg-slate-100 rounded-full transition-colors">⬅️</button>
          <h1 className="font-bold text-slate-800">{concept.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleClearEverything} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-sm">✨ New</button>
          <button onClick={handleSaveBoard} className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold text-sm">💾 Save</button>
          <div className="flex gap-1 ml-4">
             <button onClick={() => setBoardBg('plain')} className={`p-2 rounded-lg border-2 ${boardBg === 'plain' ? 'border-blue-500 bg-blue-50' : 'border-slate-100'}`}>⬜</button>
             <button onClick={() => setBoardBg('lined')} className={`p-2 rounded-lg border-2 ${boardBg === 'lined' ? 'border-blue-500 bg-blue-50' : 'border-slate-100'}`}>📝</button>
             <button onClick={() => setBoardBg('grid')} className={`p-2 rounded-lg border-2 ${boardBg === 'grid' ? 'border-blue-500 bg-blue-50' : 'border-slate-100'}`}>📊</button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className={`absolute left-0 top-0 bottom-0 z-40 bg-white border-r shadow-2xl transition-transform duration-300 w-72 flex flex-col ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-400 text-xs tracking-widest uppercase">Drawer</h3>
            <button onClick={() => setDrawerOpen(false)} className="text-slate-300 hover:text-rose-500">✕</button>
          </div>
          <div className="flex bg-slate-100 p-1 border-b">
            {Object.values(CATEGORIES).map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex-1 py-3 text-xl rounded-xl ${activeCategory === cat ? 'bg-white shadow-md' : 'opacity-40'}`}>{cat}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 gap-3 content-start">
            {renderCategoryContent()}
          </div>
        </div>
        {!drawerOpen && <button onClick={() => setDrawerOpen(true)} className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border-r p-3 rounded-r-2xl shadow-xl z-30">📦</button>}

        <main className={`flex-1 relative overflow-hidden flex flex-col ${boardBg === 'lined' ? 'board-lined' : boardBg === 'grid' ? 'board-grid' : 'bg-white'}`} onDrop={handleDropOnBoard} onDragOver={handleDragOverBoard}>
          <div className="flex-1 relative cursor-crosshair" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}>
            <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />
            {items.map(item => (
              <div key={item.id} className="absolute z-10 select-none group" style={{ left: item.x, top: item.y, transform: `translate(-50%, -50%)` }} onMouseDown={(e) => handleItemMouseDown(e, item)}>
                <div className={`relative p-4 rounded-2xl border-4 border-transparent ${activeTool === 'select' ? 'hover:border-blue-200' : ''}`}>
                  <span className={`block pointer-events-none ${item.type === 'text' ? 'text-7xl font-black text-slate-800' : 'text-9xl'}`}>{item.content}</span>
                  {activeTool === 'select' && <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="absolute -top-3 -right-3 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg">🗑️</button>}
                </div>
              </div>
            ))}
          </div>
          <div className="h-20 bg-white/90 backdrop-blur-md border-t flex items-center justify-center gap-6 z-50">
            <div className="flex bg-slate-100 p-1.5 rounded-full shadow-inner gap-1">
              {['select', 'marker', 'highlighter', 'eraser'].map(tool => (
                <button key={tool} onClick={() => setActiveTool(tool as any)} className={`w-14 h-14 rounded-full transition-all ${activeTool === tool ? 'bg-white shadow-xl text-blue-500 scale-110' : 'opacity-40'}`}>
                  {tool === 'select' ? '🖐️' : tool === 'marker' ? '✏️' : tool === 'highlighter' ? '🖍️' : '🧼'}
                </button>
              ))}
            </div>
            <button onClick={handleUndo} className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-b-4 ${history.length > 0 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}>↩️</button>
          </div>
        </main>
      </div>

      <style>{`
        .board-lined { background-color: white; background-image: linear-gradient(rgba(59, 130, 246, 0.2) 2px, transparent 2px); background-size: 100% 50px; }
        .board-grid { background-color: white; background-image: linear-gradient(rgba(59, 130, 246, 0.15) 2px, transparent 2px), linear-gradient(90deg, rgba(59, 130, 246, 0.15) 2px, transparent 2px); background-size: 50px 50px; }
      `}</style>
    </div>
  );
};

export default ConceptDashboard;