import React, { useState } from 'react';
import { 
  X, ShoppingBag, Plus, CheckCircle2, Smartphone, 
  MessageSquare, Calendar, Layers, Trash2, ArrowRight, Sparkles 
} from 'lucide-react';

interface ProductItem {
  id?: string;
  name: string;
  price: string;
  description?: string;
  image?: string;
}

interface JarvisUnifiedCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: any;
  onProductSynced?: (catalog: ProductItem[]) => void;
}

export const JarvisUnifiedCatalogModal: React.FC<JarvisUnifiedCatalogModalProps> = ({
  isOpen,
  onClose,
  brand,
  onProductSynced
}) => {
  if (!isOpen || !brand) return null;

  const [catalog, setCatalog] = useState<ProductItem[]>(() => {
    return Array.isArray(brand.productsCatalog) ? brand.productsCatalog : [];
  });
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setSuccessMessage('');

    try {
      const res = await fetch('/api/jarvis/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'UPDATE_STORE_CATALOG',
          brandId: brand.id || brand.slug,
          data: {
            addService: {
              name: name.trim(),
              price: price.trim() || '500 ج.م',
              description: description.trim() || 'خدمة معتمدة متوفرة للحجز والطلب الفوري'
            }
          }
        })
      });

      const d = await res.json();
      if (d.success && Array.isArray(d.productsCatalog)) {
        setCatalog(d.productsCatalog);
        if (onProductSynced) onProductSynced(d.productsCatalog);
        setName('');
        setPrice('');
        setDescription('');
        setSuccessMessage(`تمت إضافة "${name}" وتغذية تيتو ستوديو، تيتو أجنت، ومتجر PWA وأوبسيديان بنجاح! ⚡`);
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (err) {
      console.error('Add product error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (indexToDelete: number) => {
    const updated = catalog.filter((_, i) => i !== indexToDelete);
    setCatalog(updated);
    try {
      await fetch('/api/jarvis/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'UPDATE_STORE_CATALOG',
          brandId: brand.id || brand.slug,
          data: { productsCatalog: updated }
        })
      });
      if (onProductSynced) onProductSynced(updated);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in font-['Cairo'] text-right" dir="rtl">
      <div className="relative w-full max-w-2xl bg-[#030718] border border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(0,240,255,0.25)] flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/20 flex items-center justify-between bg-[#040b22]/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                كتالوج المنتجات والخدمات السيادي الموحد
                <span className="text-cyan-300 font-bold">({brand.name})</span>
              </h3>
              <p className="text-[10.5px] text-white/60">
                أي منتج تضيفه هنا يغذي تلقائياً تقويم تيتو ستوديو، عقل تيتو أجنت على الواتساب، ومتجر PWA
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Synced Pillars Pill Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-3 bg-black/40 border-b border-white/5 text-[9.5px] font-mono">
          <div className="p-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-1.5 text-blue-300">
            <Smartphone className="w-3.5 h-3.5 text-blue-400" />
            <span>متجر PWA أونلاين</span>
          </div>
          <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5 text-emerald-300">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>عقل تيتو أجنت (واتساب)</span>
          </div>
          <div className="p-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-1.5 text-purple-300">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <span>تقويم تيتو ستوديو</span>
          </div>
          <div className="p-1.5 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center gap-1.5 text-fuchsia-300">
            <Layers className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>عقدة أوبسيديان 2-Way</span>
          </div>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Add Product Form */}
          <form onSubmit={handleAddProduct} className="p-3.5 rounded-2xl bg-[#040e2d]/80 border border-cyan-500/30 flex flex-col gap-2.5 shadow-inner">
            <div className="flex items-center justify-between pb-1 border-b border-cyan-500/20">
              <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                إضافة منتج أو خدمة جديدة للبراند
              </span>
              <span className="text-[9px] font-mono text-white/50">INSTANT SYNC ⚡</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-[10px] text-white/70 font-bold">اسم المنتج أو الخدمة *</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: باقة العناية الشاملة، جلسة تبييض أسنان..."
                  className="px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-white/70 font-bold">السعر المقترح</label>
                <input 
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="مثال: 750 ج.م"
                  className="px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-white/70 font-bold">الوصف التسويقي والمزايا (للرد والمحتوى)</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="اكتب تفاصيل ومزايا الخدمة ليستخدمها تيتو أجنت في إقناع العميل، وتيتو ستوديو في صياغة البوست..."
                className="px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="mt-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black shadow-[0_0_20px_rgba(0,240,255,0.4)] transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>{isSaving ? 'جاري التوزيع على المنظومة...' : '🚀 إضافة وتغذية المنظومة بالكامل (ستوديو + أجنت + متجر)'}</span>
            </button>
          </form>

          {/* Current Catalog List */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-white/80 px-1">
              <span>المنتجات والخدمات النشطة حالياً في الكتالوج ({catalog.length}):</span>
              <a 
                href={`/store/${brand.slug || brand.id}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1 text-[10px] font-mono"
              >
                <span>معاينة المتجر PWA</span>
                <ArrowRight className="w-3 h-3 rotate-180" />
              </a>
            </div>

            {catalog.length === 0 ? (
              <div className="p-6 text-center text-xs text-white/40 bg-black/30 rounded-2xl border border-white/5">
                لا توجد منتجات مسجلة حتى الآن. استخدم النموذج أعلاه لإضافة أول خدمة للبراند!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {catalog.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-black/50 border border-white/10 flex flex-col justify-between gap-2 hover:border-cyan-500/40 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{item.name}</span>
                        <span className="text-[11px] font-mono font-bold text-emerald-400">{item.price}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteProduct(idx)}
                        className="text-white/30 hover:text-rose-400 p-1 rounded-lg transition"
                        title="حذف المنتج من الكتالوج"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {item.description && (
                      <p className="text-[10px] text-white/60 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center gap-1 pt-1.5 border-t border-white/5 text-[9px] text-cyan-300/80 font-mono">
                      <span>✓ متزامن سحابياً</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-cyan-500/20 bg-[#040b22]/90 flex items-center justify-between text-xs">
          <span className="text-[10px] text-white/50">T2 Sovereign Unified Product Ingestion Engine</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
          >
            إغلاق الكتالوج
          </button>
        </div>

      </div>
    </div>
  );
};
