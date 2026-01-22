
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Concept, ClassroomDesign, Message, BoardItem } from '../types';
import { decodeBase64, encodeBase64, decodeAudioData, createPcmBlob } from '../audioUtils';
import { STICKERS } from '../constants';

interface ConceptDashboardProps {
  concept: Concept;
  design: ClassroomDesign;
  onBack: () => void;
}

const CATEGORIES = {
  LETTERS: 'ABC',
  NUMBERS: '123',
  STICKERS: '✨',
  SHAPES: '📐'
};

const BOARD_TOOLS: FunctionDeclaration[] = [
  {
    name: 'addItemToBoard',
    description: 'Adds a specific text or emoji item to the interactive whiteboard.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        item: { type: Type.STRING, description: 'The text or emoji to add' },
      },
      required: ['item'],
    },
  },
  {
    name: 'clearBoard',
    description: 'Clears all items and drawings from the whiteboard.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
];

const ConceptDashboard: React.FC<ConceptDashboardProps> = ({ concept, design, onBack }) => {
  // Board State
  const [items, setItems] = useState<BoardItem[]>([]);
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
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const currentTranscriptionRef = useRef({ user: '', model: '' });

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

  const startDrawing = ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
    if (activeTool === 'select') return;
    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    isDrawingRef.current = true;
  };

  const draw = ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current || !contextRef.current || activeTool === 'select') return;
    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    
    const ctx = contextRef.current;
    if (activeTool === 'marker') {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 5;
      ctx.globalCompositeOperation = 'source-over';
    } else if (activeTool === 'highlighter') {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.lineWidth = 20;
      ctx.globalCompositeOperation = 'source-over';
    } else if (activeTool === 'eraser') {
      ctx.lineWidth = 40;
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    contextRef.current?.closePath();
    isDrawingRef.current = false;
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

  // --- Item Logic ---
  const addItem = (content: string, type: BoardItem['type'] = 'emoji') => {
    const newItem: BoardItem = {
      id: Math.random().toString(36).substr(2, 9),
      content,
      type,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      scale: 1,
      rotation: 0
    };
    setItems(prev => [...prev, newItem]);
    // Small sparkle sound/animation could go here
  };

  const updateItem = (id: string, updates: Partial<BoardItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // --- AI Session Logic ---
  const handleAiAction = (name: string, args: any) => {
    if (name === 'addItemToBoard') {
      addItem(args.item);
      return `Added ${args.item} to the magic board!`;
    }
    if (name === 'clearBoard') {
      setItems([]);
      contextRef.current?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      return "The board is shiny and clean!";
    }
    return "Action not recognized.";
  };

  const getOrCreateSession = async (useMic: boolean = false) => {
    if (sessionPromiseRef.current) return sessionPromiseRef.current;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    if (useMic) {
      audioContextInRef.current = new AudioContext({ sampleRate: 16000 });
      audioContextOutRef.current = new AudioContext({ sampleRate: 24000 });
    }

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        systemInstruction: `You are a helpful assistant for teaching ${concept.title}. Use tools to add items to the board to help students visualize. Be encouraging!`,
        tools: [{ functionDeclarations: BOARD_TOOLS }],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => useMic && setIsLive(true),
        onmessage: async (message: LiveServerMessage) => {
          if (message.toolCall) {
            const toolResponses = message.toolCall.functionCalls.map(fc => ({
              id: fc.id, name: fc.name, response: { result: handleAiAction(fc.name, fc.args) }
            }));
            sessionPromise.then(s => s.sendToolResponse({ functionResponses: toolResponses }));
          }
          // Audio processing...
          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio && audioContextOutRef.current) {
            const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), audioContextOutRef.current, 24000, 1);
            const source = audioContextOutRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextOutRef.current.destination);
            const start = Math.max(nextStartTimeRef.current, audioContextOutRef.current.currentTime);
            source.start(start);
            nextStartTimeRef.current = start + audioBuffer.duration;
          }
          // Transcriptions...
          if (message.serverContent?.turnComplete) {
            setIsAiThinking(false);
          }
        },
        onclose: () => setIsLive(false),
      }
    });

    sessionPromiseRef.current = sessionPromise;
    return sessionPromise;
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim()) return;
    setIsAiThinking(true);
    const session = await getOrCreateSession();
    session.sendRealtimeInput({ media: { data: encodeBase64(new TextEncoder().encode(inputMessage)), mimeType: 'text/plain' } });
    setChatHistory(prev => [...prev, { role: 'user', text: inputMessage }]);
    setInputMessage('');
  };

  // --- Rendering Helpers ---
  const renderCategoryContent = () => {
    if (activeCategory === CATEGORIES.LETTERS) {
      return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("").map(l => (
        <button key={l} onClick={() => addItem(l, 'text')} className="w-12 h-12 bg-white rounded-xl shadow-sm border font-bold text-xl hover:bg-blue-50 transition-colors">{l}</button>
      ));
    }
    if (activeCategory === CATEGORIES.NUMBERS) {
      return "01234567891011121314151617181920".match(/\d+/g)?.map(n => (
        <button key={n} onClick={() => addItem(n, 'text')} className="w-12 h-12 bg-white rounded-xl shadow-sm border font-bold text-xl hover:bg-green-50 transition-colors">{n}</button>
      ));
    }
    if (activeCategory === CATEGORIES.STICKERS) {
      return STICKERS.map(s => (
        <button key={s.id} onClick={() => addItem(s.emoji, 'sticker')} className="w-12 h-12 bg-white rounded-xl shadow-sm border text-2xl hover:bg-yellow-50 transition-colors">{s.emoji}</button>
      ));
    }
    if (activeCategory === CATEGORIES.SHAPES) {
      return ['⭕', '⬜', '🔺', '⭐', '❤️', '🟦', '🟡'].map(s => (
        <button key={s} onClick={() => addItem(s, 'shape')} className="w-12 h-12 bg-white rounded-xl shadow-sm border text-2xl hover:bg-purple-50 transition-colors">{s}</button>
      ));
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden font-['Fredoka']">
      {/* Header */}
      <header className="h-16 bg-white border-b px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-2xl p-2 hover:bg-slate-100 rounded-full">⬅️</button>
          <div>
            <h1 className="font-bold text-slate-800 leading-none">{concept.title}</h1>
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Interactive Lab</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setBoardBg('plain')}
            className={`p-2 rounded-lg border-2 ${boardBg === 'plain' ? 'border-blue-500 bg-blue-50' : 'border-slate-100'}`}
          >⬜</button>
          <button 
            onClick={() => setBoardBg('lined')}
            className={`p-2 rounded-lg border-2 ${boardBg === 'lined' ? 'border-blue-500 bg-blue-50' : 'border-slate-100'}`}
          >📝</button>
          <button 
            onClick={() => setBoardBg('grid')}
            className={`p-2 rounded-lg border-2 ${boardBg === 'grid' ? 'border-blue-500 bg-blue-50' : 'border-slate-100'}`}
          >📊</button>
          <div className="w-px h-8 bg-slate-200 mx-2" />
          <button 
            onClick={isLive ? () => setIsLive(false) : () => getOrCreateSession(true)}
            className={`px-4 py-2 rounded-full font-bold text-sm shadow-md transition-all ${isLive ? 'bg-rose-500 text-white animate-pulse' : 'bg-blue-500 text-white'}`}
          >
            {isLive ? '🛑 Stop' : '🎙️ Mic'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Asset Drawer */}
        <div className={`absolute left-0 top-0 bottom-0 z-40 bg-white border-r shadow-2xl transition-transform duration-300 w-72 flex flex-col ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-bold text-slate-400 uppercase text-xs">Magic Assets</h3>
            <button onClick={() => setDrawerOpen(false)} className="text-slate-300">✕</button>
          </div>
          <div className="flex bg-slate-50 p-1">
            {Object.values(CATEGORIES).map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-1 py-2 text-xl rounded-lg transition-all ${activeCategory === cat ? 'bg-white shadow-sm' : 'opacity-40'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 gap-3 content-start">
            {renderCategoryContent()}
          </div>
        </div>
        {!drawerOpen && (
          <button onClick={() => setDrawerOpen(true)} className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border-y border-r p-3 rounded-r-2xl shadow-xl z-30 font-bold text-slate-400">📦</button>
        )}

        {/* Board Area */}
        <main className="flex-1 relative overflow-hidden flex flex-col">
          <div 
            className={`flex-1 relative cursor-crosshair transition-all duration-500 ${boardBg === 'lined' ? 'board-lined' : boardBg === 'grid' ? 'board-grid' : 'bg-white'}`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          >
            {/* Canvas Layer */}
            <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

            {/* Board Items Layer */}
            {items.map(item => (
              <div
                key={item.id}
                className="absolute z-10 select-none group"
                style={{ 
                  left: item.x, 
                  top: item.y, 
                  transform: `translate(-50%, -50%) scale(${item.scale}) rotate(${item.rotation}deg)` 
                }}
                onMouseDown={(e) => {
                  if (activeTool !== 'select') return;
                  e.stopPropagation();
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const handleMove = (moveEvent: MouseEvent) => {
                    const dx = moveEvent.clientX - startX;
                    const dy = moveEvent.clientY - startY;
                    updateItem(item.id, { x: item.x + dx, y: item.y + dy });
                  };
                  const handleUp = () => {
                    window.removeEventListener('mousemove', handleMove);
                    window.removeEventListener('mouseup', handleUp);
                  };
                  window.addEventListener('mousemove', handleMove);
                  window.addEventListener('mouseup', handleUp);
                }}
              >
                <div className={`relative p-4 rounded-2xl cursor-grab active:cursor-grabbing border-4 border-transparent ${activeTool === 'select' ? 'hover:border-blue-200' : ''}`}>
                  <span className={`block pointer-events-none ${item.type === 'text' ? 'text-6xl font-black text-slate-800 drop-shadow-sm' : 'text-8xl'}`}>
                    {item.content}
                  </span>
                  
                  {activeTool === 'select' && (
                    <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); addItem(item.content, item.type); }} className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg">👯</button>
                      <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg">🗑️</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Toolbar */}
          <div className="h-24 bg-white/80 backdrop-blur-md border-t flex items-center justify-center gap-4 px-6 relative z-50">
            <div className="flex bg-slate-100 p-1.5 rounded-3xl shadow-inner gap-1">
              {[
                { id: 'select', icon: '🖐️', label: 'Move' },
                { id: 'marker', icon: '✏️', label: 'Marker' },
                { id: 'highlighter', icon: '🖍️', label: 'Glow' },
                { id: 'eraser', icon: '🧼', label: 'Eraser' },
              ].map(tool => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id as any)}
                  className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all ${activeTool === tool.id ? 'bg-white shadow-lg scale-110 text-blue-500' : 'opacity-40 hover:opacity-100'}`}
                >
                  <span className="text-2xl">{tool.icon}</span>
                  <span className="text-[9px] font-bold uppercase">{tool.label}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={() => { if(confirm("Clear everything? ✨")) handleAiAction('clearBoard', {}); }}
              className="w-16 h-16 bg-rose-100 text-rose-500 rounded-3xl flex items-center justify-center text-2xl hover:bg-rose-200 transition-colors"
              title="Clear Board"
            >
              🗑️
            </button>
          </div>
        </main>

        {/* AI Chat Sidebar */}
        <aside className="w-80 border-l bg-white flex flex-col z-40">
           <div className="p-4 border-b bg-slate-50">
              <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner ${isAiThinking ? 'bg-blue-500 text-white animate-spin' : 'bg-slate-200 text-slate-400'}`}>🤖</div>
                 <div>
                    <h4 className="font-bold text-slate-700 text-sm">Assistant</h4>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{isAiThinking ? 'Thinking...' : 'Ready'}</span>
                 </div>
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-xs shadow-sm ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
           </div>

           <form onSubmit={handleSendMessage} className="p-4 border-t bg-slate-50">
              <input 
                type="text" 
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder="Ask me to help..."
                className="w-full px-4 py-2.5 rounded-full border bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm shadow-inner"
              />
           </form>
        </aside>
      </div>

      <style>{`
        .board-lined {
          background-color: white;
          background-image: linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px);
          background-size: 100% 40px;
        }
        .board-grid {
          background-color: white;
          background-image: linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .animate-bounce-mascot { animation: bounce 2s infinite; }
      `}</style>
    </div>
  );
};

export default ConceptDashboard;
