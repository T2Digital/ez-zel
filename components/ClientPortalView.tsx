import React, { useEffect, useState } from 'react';
import { CheckCircle2, MessageSquare, Sparkles, Clock, ExternalLink } from 'lucide-react';

interface ClientPortalViewProps {
  slug: string;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({ slug }) => {
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyIdx, setBusyIdx] = useState<number | null>(null);

  const loadPortal = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/client-portal/${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'تعذر تحميل بيانات البراند');
      setBrand(data.brand);
    } catch (e: any) {
      setError(e.message || 'خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortal();
  }, [slug]);

  const handleDecision = async (postIndex: number, decision: 'approved' | 'revision_requested') => {
    setBusyIdx(postIndex);
    try {
      const feedback =
        decision === 'revision_requested'
          ? window.prompt('اكتب التعديل المطلوب على هذا المنشور:') || 'يرجى تعديل الصياغة'
          : '';
      const res = await fetch(`/api/client-portal/${encodeURIComponent(slug)}/approve-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postIndex, decision, feedback }),
      });
      const data = await res.json();
      if (data.ok && data.brand) setBrand(data.brand);
    } finally {
      setBusyIdx(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020611] text-white flex items-center justify-center font-['Cairo']">
        جاري تحميل بوابة العميل...
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen bg-[#020611] text-rose-300 flex items-center justify-center font-['Cairo']">
        {error || 'البراند غير موجود'}
      </div>
    );
  }

  const posts: any[] = Array.isArray(brand.weekContentPlan) ? brand.weekContentPlan : [];

  return (
    <div dir="rtl" className="min-h-screen bg-[#020611] text-white font-['Cairo'] p-5 md:p-10">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <header className="rounded-3xl bg-[#071122]/80 border border-cyan-500/25 p-6 flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl">
          <div>
            <div className="text-xs text-cyan-300 font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>بوابة العميل المستقلة • T2 Growth OS</span>
            </div>
            <h1 className="text-2xl font-black mt-1">{brand.name}</h1>
            <p className="text-xs text-slate-400 mt-1">
              {brand.businessType || 'نشاط تجاري'} • واتساب الأيجنت: {brand.phone || 'متصل'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/store/${brand.slug || brand.id}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>معاينة المتجر</span>
            </a>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post, idx) => (
            <div
              key={post.id || idx}
              className="rounded-2xl bg-[#071122]/75 border border-white/10 p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-cyan-300">{post.day || `منشور #${idx + 1}`}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    post.clientApproval === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : post.clientApproval === 'revision_requested'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {post.clientApproval === 'approved'
                    ? 'معتمد للنشر'
                    : post.clientApproval === 'revision_requested'
                    ? 'مطلوب تعديل'
                    : 'بانتظار مراجعتك'}
                </span>
              </div>

              {post.visualUrl && (
                <img
                  src={post.visualUrl}
                  alt={post.hook}
                  className="w-full h-52 object-cover rounded-xl border border-white/10"
                />
              )}

              <div className="text-sm font-black">{post.hook}</div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{post.caption}</p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  disabled={busyIdx === idx}
                  onClick={() => handleDecision(idx, 'approved')}
                  className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>اعتماد للنشر</span>
                </button>
                <button
                  disabled={busyIdx === idx}
                  onClick={() => handleDecision(idx, 'revision_requested')}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  <span>طلب تعديل</span>
                </button>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <div className="col-span-full p-8 text-center text-slate-400 rounded-2xl border border-white/10">
              لا توجد منشورات مجدولة حالياً — اطلب من جارفس توليد خطة الأسبوع!
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
