import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Folder, FileText, ChevronLeft, Table, Calendar, Briefcase, Plus, Search, MoreVertical, Save, X, Trash2, Image as ImageIcon, Video, MousePointer2, Target } from 'lucide-react';
import { shadowDB, DBFSItem } from '../services/dbService';
import { playShadowVoice, generateMp3FromShadowVoice } from '../services/geminiService';
import SpaceCanvas from './SpaceCanvas';
import { WorkspaceFileViewer } from './chat/WorkspaceFileViewer';

interface Props {
  userId: string;
  onItemSelect: (item: DBFSItem) => void;
  onBack?: () => void;
}

const WorkspaceExplorer: React.FC<Props> = ({ userId, onItemSelect, onBack }) => {
  const [items, setItems] = useState<DBFSItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: number | null, name: string }[]>([{ id: null, name: 'الورك سبيس' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<DBFSItem | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'l0' | 'l1' | 'l2'>('l2');

  // 3D Navigation State
  const cameraRef = useRef({ x: 0, y: 0, z: -500 });
  const targetCameraRef = useRef({ x: 0, y: 0, z: -500 });
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const itemPositions = useMemo(() => {
     const posMap = new Map<number, {x: number, y: number, z: number}>();
     
     // Staggered Layer grid layout
     const itemsPerLayer = 9;
     const gridCols = 3;
     const spacingX = 400;
     const spacingY = 400;
     const layerSpacingZ = 1500; // Increased spacing

     items.forEach((item, i) => {
         const layerIndex = Math.floor(i / itemsPerLayer);
         const indexInLayer = i % itemsPerLayer;
         
         const col = indexInLayer % gridCols;
         const row = Math.floor(indexInLayer / gridCols);
         
         // Stagger each layer slightly so items behind aren't completely hidden
         const staggerOffsetX = layerIndex * 150;
         const staggerOffsetY = layerIndex * 100;

         const x = (col - (gridCols - 1) / 2) * spacingX + staggerOffsetX;
         const y = (row - (gridCols - 1) / 2) * spacingY + staggerOffsetY;
         const z = - (layerIndex * layerSpacingZ);

         posMap.set(item.id!, { x, y, z });
     });
     return posMap;
  }, [items]);

  useEffect(() => {
    loadItems();
    // Reset camera on navigation
    targetCameraRef.current = { x: 0, y: 0, z: -500 };
  }, [currentFolderId, userId]);

  useEffect(() => {
    const loop = () => {
       const cam = cameraRef.current;
       const target = targetCameraRef.current;
       
       const isTouchActive = activePointers.current.size > 0 || isDragging.current;
       const easeX = isTouchActive ? 1 : 0.2;
       const easeY = isTouchActive ? 1 : 0.2;
       const easeZ = isTouchActive ? 1 : 0.2; 

       if (!isTouchActive) {
         // Apply momentum
         targetCameraRef.current.x += velocity.current.x;
         targetCameraRef.current.y += velocity.current.y;
         targetCameraRef.current.z += velocity.current.z;
         
         // Decay
         velocity.current.x *= 0.90;
         velocity.current.y *= 0.90;
         velocity.current.z *= 0.90;
       }

       cam.x += (target.x - cam.x) * easeX;
       cam.y += (target.y - cam.y) * easeY;
       cam.z += (target.z - cam.z) * easeZ;

       if (sceneRef.current) {
         sceneRef.current.style.transform = `translate3d(${-cam.x}px, ${-cam.y}px, ${cam.z}px)`;
       }
       rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const loadItems = async () => {
    const data = await shadowDB.getFSItemsByParent(userId, currentFolderId);
    setItems(data);
  };

  const navigateTo = async (folder: DBFSItem | null) => {
    if (folder === null) {
      setCurrentFolderId(null);
      setBreadcrumbs([{ id: null, name: 'الورك سبيس' }]);
    } else if (folder.type === 'folder') {
      setCurrentFolderId(folder.id!);
      setBreadcrumbs(prev => [...prev, { id: folder.id!, name: folder.name }]);
    } else {
      setSelectedFile(folder);
      onItemSelect(folder);
    }
  };

  const goBack = (index: number) => {
    const newPath = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newPath);
    setCurrentFolderId(newPath[newPath.length - 1].id);
  };

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const getIcon = (type: string) => {
    switch (type) {
      case 'folder': return <Folder className="w-6 h-6 text-amber-400 fill-amber-400/20 drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]" />;
      case 'table': return <Table className="w-6 h-6 text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.3)]" />;
      case 'calendar': return <Calendar className="w-6 h-6 text-blue-400 drop-shadow-[0_0_20px_rgba(96,165,250,0.3)]" />;
      case 'project': return <Briefcase className="w-6 h-6 text-purple-400 drop-shadow-[0_0_20px_rgba(192,132,252,0.3)]" />;
      case 'image': return <ImageIcon className="w-6 h-6 text-pink-400 drop-shadow-[0_0_20px_rgba(244,114,182,0.3)]" />;
      case 'video': return <Video className="w-6 h-6 text-red-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.3)]" />;
      default: return <FileText className="w-6 h-6 text-white/60 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" />;
    }
  };

  const velocity = useRef({ x: 0, y: 0, z: 0 });
  const lastMoveTime = useRef<number>(0);

  const activePointers = useRef(new Map<number, {x: number, y: number}>());
  const initialPinchDist = useRef<number | null>(null);
  const dragThresholdExceeded = useRef(false);

  const lastTapTime = useRef<number>(0);
  const initialPointerPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    const now = Date.now();
    if (activePointers.current.size === 0 && now - lastTapTime.current < 300) {
        // Double tap
        targetCameraRef.current.z += 800;
        lastTapTime.current = 0; // reset
        dragThresholdExceeded.current = true; // prevent click
    } else {
        lastTapTime.current = now;
        dragThresholdExceeded.current = false;
    }

    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.current.size === 1) {
        isDragging.current = true;
        
        velocity.current = { x: 0, y: 0, z: 0 };
        lastMoveTime.current = Date.now();
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        initialPointerPos.current = { x: e.clientX, y: e.clientY };
    } else if (activePointers.current.size === 2) {
        isDragging.current = false;
        const pts = Array.from(activePointers.current.values()) as {x: number, y: number}[];
        initialPinchDist.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const now = Date.now();
    const dt = Math.max(1, now - lastMoveTime.current);

    if (activePointers.current.has(e.pointerId)) {
        activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (activePointers.current.size === 1 && isDragging.current) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        
        const totalDx = e.clientX - initialPointerPos.current.x;
        const totalDy = e.clientY - initialPointerPos.current.y;
        if (Math.hypot(totalDx, totalDy) > 20) {
            dragThresholdExceeded.current = true;
        }
        
        const scale = 800 / Math.max(100, 800 - targetCameraRef.current.z);
        // Remove aggressive dampening, make the drag feel 1:1 and fast
        const moveX = dx * 2.0;
        const moveY = dy * 2.0;
        targetCameraRef.current.x -= moveX;
        targetCameraRef.current.y -= moveY;
        
        // Calculate velocity (pixels per frame basically, scaled by dt)
        if (Math.hypot(dx, dy) > 0.5) {
            // Smooth velocity by averaging with previous to prevent sudden drops if pointer stalls slightly before release
            const newVelX = -moveX / (dt / 16);
            const newVelY = -moveY / (dt / 16);
            velocity.current = {
                x: velocity.current.x * 0.4 + newVelX * 0.6,
                y: velocity.current.y * 0.4 + newVelY * 0.6,
                z: 0
            };
        }
        
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    } else if (activePointers.current.size === 2 && initialPinchDist.current !== null) {
        dragThresholdExceeded.current = true;
        const pts = Array.from(activePointers.current.values()) as {x: number, y: number}[];
        const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const diff = currentDist - initialPinchDist.current;
        
        const moveZ = diff * 10;
        targetCameraRef.current.z += moveZ;
        
        velocity.current = {
            x: 0,
            y: 0,
            z: moveZ / (dt / 16)
        };
        
        initialPinchDist.current = currentDist;
    }
    
    lastMoveTime.current = now;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);
    if (activePointers.current.size < 2) {
        initialPinchDist.current = null;
    }
    if (activePointers.current.size === 1) {
        const pt = Array.from(activePointers.current.values())[0] as {x: number, y: number};
        lastMousePos.current = { x: pt.x, y: pt.y };
        isDragging.current = true;
    } else if (activePointers.current.size === 0) {
        isDragging.current = false;
    }
    if (containerRef.current && containerRef.current.hasPointerCapture(e.pointerId)) {
        containerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    // Zoom in/out moves camera Z with responsive speed
    targetCameraRef.current.z = Math.max(-15000, Math.min(5000, targetCameraRef.current.z + e.deltaY * 3));
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    // Zoom in on double click
    targetCameraRef.current.z += 800;
  };

  const resetCamera = () => {
    targetCameraRef.current = { x: 0, y: 0, z: -500 };
  };

  return (
    <div className="fixed inset-0 flex flex-col font-['Cairo'] text-white overflow-hidden bg-black">
      <SpaceCanvas interactive={false} showEarth={false} />
      
      {/* Search & Actions - UI LAYER OVERLAY */}
      <div className="absolute top-0 left-0 right-0 z-40 p-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 flex-1 pointer-events-auto">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all shadow-md" title="رجوع">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <button onClick={resetCamera} className="p-2 rounded-full bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/40 hover:text-indigo-200 transition-all border border-indigo-500/30 shadow-md" title="توسيط الكاميرا">
            <Target className="w-5 h-5" />
          </button>
          <div className="hidden sm:block text-xl font-black text-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">الورك سبيس</div>
          <div className="relative flex-1 max-w-md mr-4">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="دور في ذاكرتي..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pr-12 pl-4 text-sm focus:outline-none focus:border-purple-500/50 transition-all shadow-md"
            />
          </div>
        </div>
        <button className="p-3 bg-purple-600 rounded-2xl hover:scale-105 active:scale-95 transition-all pointer-events-auto shadow-[0_0_20px_rgba(147,51,234,0.4)]">
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Breadcrumbs - UI LAYER */}
      <div className="absolute top-24 left-0 right-0 z-40 px-6 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide pointer-events-none">
        <div className="glass px-4 py-2 rounded-2xl flex items-center gap-2 pointer-events-auto border border-white/10">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                <button 
                  onClick={() => goBack(i)}
                  className={`text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${i === breadcrumbs.length - 1 ? 'text-purple-400' : 'text-white/30 hover:text-white drop-shadow-md'}`}
                >
                  {crumb.name}
                </button>
                {i < breadcrumbs.length - 1 && <ChevronLeft className="w-3 h-3 text-white/10 shrink-0" />}
              </React.Fragment>
            ))}
        </div>
      </div>

      {/* Space Navigator Instructions */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex items-center gap-2 text-white/30 text-xs font-bold uppercase tracking-widest py-2 px-4 rounded-full bg-black/50 border border-white/5 backdrop-blur-sm">
        <MousePointer2 className="w-3 h-3" /> اسحب للتنقل - سكرول للغوص
      </div>

      {/* 3D WORKSPACE SCENE */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing z-10 perspective-[1000px] select-none touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        style={{ perspective: '800px', touchAction: 'none' }}
      >
        <div 
           ref={sceneRef}
           className="absolute top-1/2 left-1/2 w-0 h-0"
           style={{ 
             transformStyle: 'preserve-3d', 
             transform: `translate3d(-1000px, 0px, 1000px)`, // starting position
           }}
        >
          {filteredItems.map((item) => {
            const pos = itemPositions.get(item.id!);
            if (!pos) return null;
            
            // Render logic based on data type
            const isImage = item.type === 'image';
            
            return (
              <div 
                key={item.id} 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    if (!dragThresholdExceeded.current) {
                        navigateTo(item); 
                    }
                }}
                className="absolute group flex flex-col items-center text-center hover:scale-110 transition-transform cursor-pointer"
                style={{
                    transform: `translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px) translate(-50%, -50%)`,
                    transformStyle: 'preserve-3d'
                }}
              >
                  {/* Floating Orb or Image Preview */}
                  <div className={`relative flex items-center justify-center p-4 ${isImage ? 'bg-transparent' : 'bg-black/40'} border border-white/10 rounded-full backdrop-blur-md group-hover:border-purple-500/50 group-hover:bg-purple-900/20 transition-all shadow-[0_0_30px_rgba(0,0,0,0.8)]`}>
                      <div className="absolute inset-0 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 group-hover:animate-ping z-0 pointer-events-none"></div>
                      <div className="relative z-10 pointer-events-none">
                         {isImage && item.l2_content ? (
                             <img src={item.l2_content} className="w-8 h-8 md:w-12 md:h-12 object-cover rounded-xl border border-white/20 shadow-lg shadow-pink-500/20" />
                         ) : getIcon(item.type)}
                      </div>
                  </div>
                  
                  <div className="mt-3 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                    <span className="text-xs font-black text-white block whitespace-nowrap">{item.name}</span>
                    <span className="text-[8px] text-purple-300 uppercase font-bold tracking-widest mt-0.5 block drop-shadow-md">
                      {item.type === 'folder' ? 'مجلد' : 'ملف'}
                    </span>
                  </div>
              </div>
            );
          })}
          
          {filteredItems.length === 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none" style={{ transform: 'translate3d(-50%, -50%, 0)' }}>
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 blur-[50px] rounded-full"></div>
                <Folder className="relative w-32 h-32 mb-6 mx-auto text-white/50 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]" />
              </div>
              <p className="text-2xl font-black text-white/80 tracking-widest drop-shadow-md">الورك سبيس فارغ</p>
              <p className="text-sm font-bold text-white/40 mt-3 max-w-xs mx-auto">سيتم حفظ الملفات والصور المولدة هنا تلقائياً</p>
            </div>
          )}
        </div>
      </div>

      {/* File Viewer Modal */}
      {selectedFile && (
          <WorkspaceFileViewer
              file={selectedFile}
              workspaceTab={workspaceTab}
              setWorkspaceTab={setWorkspaceTab}
              onClose={() => setSelectedFile(null)}
              isEditable={true}
              onFileChange={setSelectedFile}
              onSave={async () => {
                  await shadowDB.saveFSItem(selectedFile);
                  loadItems();
              }}
              onDelete={async () => {
                  if (selectedFile.id) {
                     await shadowDB.deleteFSItem(selectedFile.id);
                     setSelectedFile(null);
                     loadItems();
                  }
              }}
              onPlayAudio={(text) => playShadowVoice(text, 'male')}
              onShareAudio={async (text) => {
                  const mp3 = await generateMp3FromShadowVoice(text, 'male');
                  if (mp3) {
                      const shareObj = { title: 'صوت الملف', text: 'مشاركة صوت الملف من مساحة العمل', files: [mp3.file] };
                      if (navigator.canShare && navigator.canShare({ files: [mp3.file] })) {
                          try { await navigator.share(shareObj); } catch (err) {}
                      } else {
                          const url = URL.createObjectURL(mp3.file);
                          const a = document.createElement('a'); 
                          a.href = url; 
                          a.download = 'shadow-voice.mp3'; 
                          document.body.appendChild(a); 
                          a.click(); 
                          document.body.removeChild(a); 
                          setTimeout(() => URL.revokeObjectURL(url), 1000);
                      }
                  } else {
                      alert("فشل توليد الصوت.");
                  }
              }}
          />
      )}
    </div>
  );
};

export default WorkspaceExplorer;