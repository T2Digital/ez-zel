import React, { useState, useEffect } from 'react';
import { Folder, FileText, ChevronLeft, Table, Calendar, Briefcase, Plus, Search, MoreVertical } from 'lucide-react';
import { shadowDB, DBFSItem } from '../services/dbService';

interface Props {
  userId: string;
  onItemSelect: (item: DBFSItem) => void;
}

const WorkspaceExplorer: React.FC<Props> = ({ userId, onItemSelect }) => {
  const [items, setItems] = useState<DBFSItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: number | null, name: string }[]>([{ id: null, name: 'الورك سبيس' }]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadItems();
  }, [currentFolderId, userId]);

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
      case 'folder': return <Folder className="w-6 h-6 text-amber-400 fill-amber-400/20" />;
      case 'table': return <Table className="w-6 h-6 text-emerald-400" />;
      case 'calendar': return <Calendar className="w-6 h-6 text-blue-400" />;
      case 'project': return <Briefcase className="w-6 h-6 text-purple-400" />;
      default: return <FileText className="w-6 h-6 text-white/60" />;
    }
  };

  return (
    <div className="flex flex-col h-full glass rounded-[40px] overflow-hidden border border-white/5 bg-black/40">
      {/* Search & Actions */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="دور في ذاكرتي..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pr-12 pl-4 text-sm focus:outline-none focus:border-purple-500/50 transition-all"
            />
          </div>
        </div>
        <button className="p-3 bg-purple-600 rounded-2xl hover:scale-105 active:scale-95 transition-all">
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Breadcrumbs */}
      <div className="px-6 py-4 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            <button 
              onClick={() => goBack(i)}
              className={`text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${i === breadcrumbs.length - 1 ? 'text-purple-400' : 'text-white/30 hover:text-white'}`}
            >
              {crumb.name}
            </button>
            {i < breadcrumbs.length - 1 && <ChevronLeft className="w-3 h-3 text-white/10 shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              onClick={() => navigateTo(item)}
              className="group relative glass p-6 rounded-[32px] border border-white/5 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all cursor-pointer flex flex-col items-center text-center gap-4"
            >
              <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-all">
                {getIcon(item.type)}
              </div>
              <div>
                <span className="text-xs font-bold text-white/80 block truncate w-full px-2">{item.name}</span>
                <span className="text-[9px] text-white/20 uppercase font-black tracking-widest mt-1">
                  {item.type === 'folder' ? 'مجلد' : 'ملف'}
                </span>
              </div>
              <button className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/10 text-white/30 transition-all">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center opacity-20">
              <Folder className="w-16 h-16 mb-4" />
              <p className="text-sm italic">المكان فاضي يا ريس.. لسه مبنيناش حاجة هنا.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceExplorer;