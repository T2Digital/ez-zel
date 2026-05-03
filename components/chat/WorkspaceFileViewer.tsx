import React from 'react';
import { FileText, Printer, X } from 'lucide-react';

interface WorkspaceFileViewerProps {
    file: any;
    workspaceTab: 'l0' | 'l1' | 'l2';
    setWorkspaceTab: (tab: 'l0' | 'l1' | 'l2') => void;
    onClose: () => void;
}

export const WorkspaceFileViewer: React.FC<WorkspaceFileViewerProps> = ({ file, workspaceTab, setWorkspaceTab, onClose }) => {
    if (!file) return null;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<html><head><title>' + file.title + '</title>');
            printWindow.document.write('<style>body { font-family: monospace; white-space: pre-wrap; padding: 20px; color: #000; background: #fff; line-height: 1.5; font-size: 14px; }</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(
                (workspaceTab === 'l0' ? file.l0_summary : workspaceTab === 'l1' ? file.l1_metadata : (file.l2_content || file.content)) || 'فارغ'
            );
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#151515] border border-white/10 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a0a] gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-white tracking-widest truncate" dir="ltr">{file.title}</h3>
                            <p className="text-[10px] text-white/40 truncate">{file.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {file.itemType === 'file' && (
                            <button onClick={handlePrint} className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl font-bold flex items-center gap-2 transition-all text-sm print:hidden">
                                <Printer className="w-4 h-4" /> طباعة
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-red-400 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-[#0d0d0d] border-b border-white/5">
                      <button onClick={() => setWorkspaceTab('l0')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${workspaceTab === 'l0' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10'}`}>L0 (Summary)</button>
                      <button onClick={() => setWorkspaceTab('l1')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${workspaceTab === 'l1' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10'}`}>L1 (Metadata/Headers)</button>
                      <button onClick={() => setWorkspaceTab('l2')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${workspaceTab === 'l2' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10'}`}>L2 (Full Content)</button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[#0f0f0f]" dir="ltr">
                    <div className="text-white/80 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                        {(() => {
                            const rawContent = workspaceTab === 'l0' ? (file.l0_summary || '// لا يوجد L0 (ملخص)') : 
                                             workspaceTab === 'l1' ? (file.l1_metadata || '// لا يوجد L1 (هيكلة)') : 
                                             (file.l2_content || file.content || '// لا يوجد L2 (محتوى)');
                            
                            // Simple parser to render markdown images and keep text
                            const parts = rawContent.split(/(!\[.*?\]\(.*?\))/g);
                            return parts.map((part: string, i: number) => {
                                const match = part.match(/!\[(.*?)\]\((.*?)\)/);
                                if (match) {
                                    return <img key={i} src={match[2]} alt={match[1]} className="max-w-full h-auto rounded-lg my-4 border border-white/10 shadow-lg object-contain bg-black/50" crossOrigin="anonymous" referrerPolicy="no-referrer" />;
                                }
                                return <span key={i}>{part}</span>;
                            });
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};
