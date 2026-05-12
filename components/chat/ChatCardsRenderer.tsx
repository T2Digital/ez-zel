import React from 'react';
import { Loader2, Activity, Briefcase, CheckCircle, Clock, Copy, ExternalLink, FileText, FolderOpen, Layout, Printer, Smartphone, Download, Share2, Globe, Users, Bot } from 'lucide-react';
import LiveAgentAction from '../LiveAgentAction';
import { getCardIcon, handleAppCardAction } from './ToolCardRenderer';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip } from 'recharts';
import { InteractiveEducator } from './InteractiveEducator';
import { TradingViewChart } from './TradingViewChart';
import { AutonomousDashboard } from './AutonomousDashboard';
import { VideoDisplay } from './VideoDisplay';
import { PredictiveAnalyticsBoard } from './PredictiveAnalyticsBoard';

export const renderChatCard = (
    card: any, 
    i: number, 
    currentUser: any, 
    handleSend: (text: string, v?: any, i?: any, skip?: boolean) => void,
    setSelectedWorkspaceFile: (card: any) => void
) => {
      if (card.cardType === 'swarm_manager') {
          return (
              <div key={i} className="bg-[#121212] border border-emerald-500/30 rounded-xl overflow-hidden font-sans shadow-[0_0_15px_rgba(16,185,129,0.1)] my-4" dir="rtl">
                  <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 p-4 border-b border-emerald-500/20 flex items-center gap-3">
                      <Users className="w-5 h-5 text-emerald-400" />
                      <div>
                          <h3 className="font-semibold text-emerald-300 tracking-tight">{card.title}</h3>
                          <div className="text-xs text-emerald-500/70 mt-0.5">سرب تفكير جماعي يعمل بالتوازي</div>
                      </div>
                  </div>
                  <div className="p-4 space-y-3">
                      {card.tasks.map((task: any, idx: number) => (
                          <div key={idx} className="bg-black/40 border border-white/5 rounded-lg p-3 flex gap-3 items-start relative overflow-hidden group">
                              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
                              <div className="bg-emerald-500/10 p-2 rounded-md shrink-0">
                                  <Bot className="w-4 h-4 text-emerald-400" />
                              </div>
                              <div>
                                  <div className="text-sm font-bold text-white/90">عميل: {task.agent_role}</div>
                                  <div className="text-xs text-white/50 leading-relaxed mt-1">المهمة: {task.instruction}</div>
                              </div>
                              <div className="mr-auto self-center">
                                  <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          );
      }
      if (card.cardType === 'predictive_board') {
          return <React.Fragment key={i}><PredictiveAnalyticsBoard title={card.title} metrics={card.metrics || []} predicted_actions={card.predicted_actions || []} onApproveAction={(desc) => handleSend(`وافق على القرار: ${desc}`, undefined, undefined, false)} /></React.Fragment>;
      }
      if (card.cardType === 'interactive_educator') {
          return <React.Fragment key={i}><InteractiveEducator card={card} /></React.Fragment>;
      }
      if (card.cardType === 'tradingview_chart') {
          return <React.Fragment key={i}><TradingViewChart card={card} /></React.Fragment>;
      }
      if (card.cardType === 'autonomous_dashboard') {
          return <React.Fragment key={i}><AutonomousDashboard card={card} /></React.Fragment>;
      }
      if (card.cardType === 'video_display') {
          return <React.Fragment key={i}><VideoDisplay card={card} /></React.Fragment>;
      }
      if (card.cardType === 'live_action') {
          return <LiveAgentAction key={i} actionType={card.actionType} args={card.args} userProfile={currentUser} onComplete={(resultText) => {
              handleSend(resultText, undefined, undefined, true);
          }} />;
      }
      if (card.cardType === 'autonomous_agent') {
          return (
              <div key={i} className="mt-4 bg-[#111] border border-fuchsia-500/30 rounded-[22px] p-5 shadow-[0_0_30px_rgba(217,70,239,0.15)] relative overflow-hidden w-full md:w-[450px]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-fuchsia-500 animate-pulse"></div>
                  <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-fuchsia-500/20 rounded-full animate-spin-slow">
                              <Loader2 className="w-6 h-6 text-fuchsia-400" />
                          </div>
                          <div>
                              <h3 className="font-black text-white text-sm">عميل مستقل قيد التشغيل</h3>
                              <p className="text-[10px] text-fuchsia-300 font-mono">AUTONOMOUS_BACKGROUND_TASK</p>
                          </div>
                      </div>
                      <div className="px-3 py-1 bg-fuchsia-500/10 text-fuchsia-400 text-xs font-bold rounded-full border border-fuchsia-500/20">
                          Running
                      </div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <p className="text-xs text-white/80 leading-relaxed font-bold">{card.description}</p>
                  </div>
                  <div className="mt-3 text-[10px] text-white/40 text-center flex items-center justify-center gap-1">
                      <Activity className="w-3 h-3 text-fuchsia-400 animate-pulse" />
                      يتم المعالجة في الخلفية، سيتم إشعارك عند الانتهاء.
                  </div>
              </div>
          );
      }
      if (card.cardType === 'project_manager') {
          return (
              <div key={i} className="mt-4 rounded-[22px] p-5 w-full md:w-[450px] bg-gradient-to-br from-indigo-900/40 to-black border border-indigo-500/30 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                          <div className="p-3 bg-indigo-500/20 rounded-xl"><Briefcase className="w-6 h-6 text-indigo-400" /></div>
                          <div>
                              <h3 className="font-black text-white text-md">{card.data.title || "مشروع جديد"}</h3>
                              <p className="text-xs text-indigo-300 mt-0.5 max-w-[200px] truncate">{card.data.description}</p>
                          </div>
                      </div>
                      <div className="text-right">
                          <div className="text-2xl font-black text-indigo-400">{Math.round(card.data.progress || 0)}%</div>
                          <div className="text-[10px] text-white/50 font-bold uppercase">إنجاز</div>
                      </div>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 mb-5 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${card.data.progress || 0}%` }}></div>
                  </div>
                  <div className="space-y-2">
                      {card.data.tasks && parseInt(card.data.tasks.length) > 0 ? card.data.tasks.slice(0, 4).map((t: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5">
                              <span className="text-xs font-bold text-white/80">{t.title}</span>
                              {t.status === 'done' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-amber-500" />}
                          </div>
                      )) : <div className="text-xs text-white/50 text-center py-2">لا توجد مهام حتى الآن</div>}
                      {card.data.tasks && card.data.tasks.length > 4 && (
                          <div className="text-[10px] text-center text-indigo-400 pt-1 font-bold">+ {card.data.tasks.length - 4} مهام أخرى المخفية</div>
                      )}
                  </div>
              </div>
          );
      }
      if (card.cardType === 'system_terminal') {
          return (
              <div key={i} className="mt-4 bg-[#0a0a0a] rounded-[16px] border border-white/20 overflow-hidden w-full md:w-[450px] shadow-2xl font-mono text-left" dir="ltr">
                  <div className="bg-[#1a1a1a] px-4 py-2 flex items-center gap-2 border-b border-white/10">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="ml-2 text-[10px] text-white/40 font-bold">ez-zel@shadow-core:~</span>
                  </div>
                  <div className="p-4 text-xs font-mono">
                      <div className="text-emerald-400 mb-2">$ {card.data.command_type || 'executing...'}</div>
                      <pre className="text-white/80 whitespace-pre-wrap">{card.data.logs}</pre>
                      <div className="mt-2 text-white/50 animate-pulse">_</div>
                  </div>
              </div>
          );
      }
      if (card.cardType === 'task_success') {
          return (
              <div key={i} className="mt-4 bg-[#111] p-4 rounded-[22px] border border-emerald-500/20 flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-full"><CheckCircle className="w-5 h-5 text-emerald-500" /></div>
                  <div><h3 className="font-bold text-white text-sm">{card.title}</h3><p className="text-[10px] text-white/50">{card.description}</p></div>
              </div>
          );
      }
      if (card.cardType === 'business_doc') {
          return (
            <div key={i} className="mt-4 bg-white text-black rounded-[22px] p-6 shadow-2xl printable-invoice w-full md:w-[600px] border border-black/10 overflow-hidden relative print:w-full print:border-none print:shadow-none print:m-0 print:p-0">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-6 px-2">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-black rounded-xl border-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] flex items-center justify-center print:border-black print:shadow-none">
                                <span className="text-white text-xl font-black mb-1">E</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight uppercase">Ez-Zel <span className="text-cyan-600">Enterprise</span></h1>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Digital Shadow System</p>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col gap-1">
                            <h2 className="text-3xl font-black">{card.data.docType === 'quote' ? 'عرض السعـر' : (card.data.docType === 'contract' ? 'عقـد اتفـاق' : (card.data.docType === 'cv' ? 'سيـرة ذاتيـة' : 'فـاتـورة'))}</h2>
                            <p className="text-xs text-gray-400 font-bold tracking-widest" dir="ltr">DOCUMENT ID: <span className="text-black font-mono">EZ-{Math.floor(Math.random() * 90000) + 10000}</span></p>
                        </div>
                    </div>
                    <div className="text-right flex flex-col gap-1 mt-14">
                        <p className="font-black text-sm text-gray-400 uppercase tracking-widest">التاريـخ</p>
                        <p className="text-sm font-bold font-mono bg-gray-100 px-3 py-1 rounded-md border border-gray-200" dir="ltr">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                </div>

                {/* Client Section */}
                <div className="mb-8 px-2">
                    <div className="inline-block bg-black text-white px-3 py-1 rounded-md mb-3">
                        <p className="text-[10px] uppercase font-black tracking-widest">{card.data.docType === 'cv' ? 'الاسم' : 'مقدم إلى'}</p>
                    </div>
                    <h3 className="text-2xl font-black text-gray-800 border-l-4 border-cyan-500 pl-3 leading-none">{card.data.clientName}</h3>
                </div>

                {/* Contract Body (Optional) */}
                {card.data.contractBody && (
                    <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
                        <h4 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-widest border-b border-gray-200 pb-2">{card.data.docType === 'cv' ? 'الملخص والتفاصيل' : 'تفاصيل العقد للشروط والأحكام'}</h4>
                        <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap font-medium">{card.data.contractBody}</div>
                    </div>
                )}

                {/* Items Table */}
                {card.data.items && card.data.items.length > 0 && (
                    <div className="mb-8 overflow-hidden rounded-xl border border-gray-200">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-gray-100 text-gray-600 font-black uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="py-3 px-4">البند / الوصف</th>
                                    <th className="py-3 px-4 text-left w-32">القيمة (EGP)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {card.data.items.map((item: any, idx: number) => (
                                    <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-4 font-bold text-gray-800">{item.desc}</td>
                                        <td className="py-4 px-4 text-left font-mono font-bold text-gray-900 bg-gray-50/50" dir="ltr">{(item.price || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Total Section */}
                {card.data.items && card.data.items.length > 0 && (
                    <div className="flex justify-end px-2 mb-10">
                        <div className="w-full md:w-1/2 flex justify-between items-center p-4 rounded-xl bg-black text-white shadow-xl transform hover:scale-[1.02] transition-transform">
                            <span className="font-black text-sm tracking-widest uppercase">الإجمالي النهائي</span>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-2xl font-mono text-cyan-400" dir="ltr">{card.data.items.reduce((s:number, i:any) => s + (i.price || 0), 0).toLocaleString()}</span>
                                <span className="text-xs font-bold text-gray-400">EGP</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Notes */}
                <div className="mt-12 text-center border-t border-gray-200 pt-6">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Generated by Ez-Zel Digital Shadow</p>
                    <p className="text-[9px] text-gray-300">This document is electronically verified.</p>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex gap-3 print:hidden">
                    <button onClick={() => window.print()} className="flex-1 py-3 bg-black text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-gray-800 transition-all text-sm shadow-xl active:scale-95">
                        <Printer className="w-4 h-4" /> طباعة المستند
                    </button>
                    {card.data.contractBody && (
                        <button onClick={() => {
                            const contractText = `عقد اتفاق\n\nالطرف الثاني: ${card.data.clientName}\n\n${card.data.contractBody}`;
                            navigator.clipboard.writeText(contractText);
                            alert('تم نسخ نص العقد!');
                        }} className="px-4 py-3 border-2 border-black rounded-xl font-black flex items-center justify-center gap-2 hover:bg-gray-100 transition-all text-sm active:scale-95">
                            <Copy className="w-4 h-4" /> نسخ النص
                        </button>
                    )}
                </div>
            </div>
          );
      }
      if (card.cardType === 'mobile_agent_action') {
          return (
              <div key={i} className="mt-3 bg-indigo-900/20 border border-indigo-500/30 rounded-[22px] p-4 overflow-hidden relative w-full md:w-[320px]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse"></div>
                  <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-500/20 rounded-xl shrink-0">
                          <Smartphone className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="flex-1">
                          <h4 className="text-xs font-bold text-indigo-300 mb-1">{card.title}</h4>
                          <p className="text-[11px] text-white/70 leading-relaxed">{card.description}</p>
                          <div className="mt-2 text-[10px] text-indigo-400/50 font-mono">
                              [NATIVE_CALL: ShadowAgent.clickOnText("{card.target_text}")]
                          </div>
                      </div>
                  </div>
              </div>
          );
      }
      if (card.cardType === 'workspace_item') {
          return (
              <div key={i} className="mt-4 rounded-[22px] p-4 w-full md:w-[320px] bg-[#1a1a1a]/95 border border-white/20 shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                  <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-white/5 rounded-xl text-emerald-400">
                          {card.itemType === 'folder' ? <FolderOpen className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                          <h3 className="font-bold text-sm text-white truncate" dir="ltr">{card.title}</h3>
                          <p className="text-[10px] text-emerald-500/80 mt-0.5 truncate">{card.description}</p>
                      </div>
                  </div>
                  {card.itemType === 'file' && (
                      <button onClick={() => setSelectedWorkspaceFile(card)} className="w-full py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs">
                          <ExternalLink className="w-3 h-3" /> فتح الملف
                      </button>
                  )}
              </div>
          );
      }
      if (card.cardType === 'image_display') {
          return (
              <div key={i} className="mt-4 rounded-[22px] p-2 w-full md:w-[320px] bg-[#1a1a1a]/95 border border-white/20 shadow-xl overflow-hidden relative">
                  <img src={card.url} alt={card.title} className="w-full h-auto rounded-xl object-contain mb-2 bg-black" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                  <div className="p-2">
                       <h3 className="font-bold text-sm text-white truncate px-1">{card.title}</h3>
                       <p className="text-[10px] text-white/50 mt-1 px-1">{card.description}</p>
                       <div className="flex items-center gap-2 mt-4 px-1 pb-1">
                           <button onClick={async () => {
                                try {
                                    const proxyUrl = `/api/proxy?url=${encodeURIComponent(card.url)}`;
                                    const res = await fetch(proxyUrl);
                                    const blob = await res.blob();
                                    const blobUrl = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = blobUrl;
                                    a.download = `shadow_design_${Date.now()}.png`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
                                } catch (e) {
                                    window.open(card.url, '_blank');
                                }
                           }} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center gap-2 text-[10px] text-white/80 transition-colors">
                               <Download className="w-3.5 h-3.5" /> تحميل
                           </button>
                           <button onClick={async () => {
                                try {
                                    const proxyUrl = `/api/proxy?url=${encodeURIComponent(card.url)}`;
                                    const res = await fetch(proxyUrl);
                                    const blob = await res.blob();
                                    const file = new File([blob], 'shadow_design.png', { type: blob.type });
                                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                        await navigator.share({
                                            title: card.title,
                                            files: [file]
                                        });
                                    } else if (navigator.share) {
                                        navigator.share({ title: card.title, url: card.url }).catch(() => {});
                                    } else {
                                        navigator.clipboard.writeText(card.url);
                                    }
                                } catch (e) {
                                    if (navigator.share) {
                                        navigator.share({ title: card.title, url: card.url }).catch(() => {});
                                    } else {
                                        navigator.clipboard.writeText(card.url);
                                    }
                                }
                           }} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center gap-2 text-[10px] text-white/80 transition-colors">
                               <Share2 className="w-3.5 h-3.5" /> مشاركة
                           </button>
                           <button onClick={() => handleSend(`انشر التصميم ده على السوشيال ميديا: ${card.url}`, null, null, true)} className="flex-1 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold transition-colors">
                               <Globe className="w-3.5 h-3.5" /> نشر
                           </button>
                       </div>
                  </div>
              </div>
          );
      }
      if (card.cardType === 'chart_display') {
          const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
          return (
              <div key={i} className="mt-4 rounded-[22px] p-4 w-full md:w-[380px] bg-[#000000]/95 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] overflow-hidden relative group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
                  <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                          <Activity className="w-5 h-5" />
                      </div>
                      <div>
                          <h3 className="font-bold text-[15px] text-white">{card.title}</h3>
                          <p className="text-[11px] text-white/50">تحليل بيانات</p>
                      </div>
                  </div>
                  <div className="h-[200px] w-full text-xs" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                          {card.chartType === 'line' ? (
                              <LineChart data={card.data}>
                                  <XAxis dataKey="name" stroke="#666" tick={{fill: '#888'}} />
                                  <YAxis stroke="#666" tick={{fill: '#888'}} />
                                  <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333', borderRadius: '8px'}} itemStyle={{color: '#10b981'}} />
                                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} activeDot={{r: 6}} />
                              </LineChart>
                          ) : card.chartType === 'pie' ? (
                              <PieChart>
                                  <Pie data={card.data} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                                      {card.data.map((entry: any, index: number) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                  </Pie>
                                  <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333', borderRadius: '8px'}} />
                              </PieChart>
                          ) : (
                              <BarChart data={card.data}>
                                  <XAxis dataKey="name" stroke="#666" tick={{fill: '#888'}} />
                                  <YAxis stroke="#666" tick={{fill: '#888'}} />
                                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#111', borderColor: '#333', borderRadius: '8px'}} />
                                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                              </BarChart>
                          )}
                      </ResponsiveContainer>
                  </div>
                  {card.description && (
                      <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl">
                          <p className="text-xs leading-relaxed text-white/80 font-medium">{card.description}</p>
                      </div>
                  )}
              </div>
          );
      }
      return (
        <div key={i} className={`mt-4 rounded-[22px] p-4 w-full md:w-[320px] bg-[#0f0f0f]/90 border border-white/10`}>
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-xl bg-white/10`}>{getCardIcon(card.cardType, card.number)}</div>
                <div><h3 className={`font-black text-xs text-white`}>{card.title}</h3><p className="text-[10px] text-white/50 truncate max-w-[200px]">{card.description}</p></div>
            </div>
            <button onClick={() => handleAppCardAction(card)} className={`w-full py-2.5 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-xs border bg-white/10 hover:bg-white/20 text-white border-white/10`}>
                {card.cardType === 'internal_nav' ? <Layout className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                {card.cardType === 'internal_nav' ? 'فتح الصفحة' : 'فتح التطبيق'}
            </button>
        </div>
      );
};
