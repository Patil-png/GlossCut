import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ChevronLeft, 
  Stars, 
  AlertTriangle, 
  Info, 
  X,
  Loader2,
  Calendar,
  Zap,
  Target,
  ShieldCheck,
  BrainCircuit,
  Award,
  BookMarked
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const FaceSuggestor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const apiUrl = process.env.REACT_APP_API_URL || 'https://api.glosscut.com';
  
  // States
  const [image, setImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [usesLeft, setUsesLeft] = useState(user?.faceSuggestorUses ?? 2);
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback((message, type = 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setSuggestions(null);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const getSuggestions = async () => {
    if (!image) return showAlert("Capture facial data first.");
    if (usesLeft <= 0) return showAlert("Neural limit reached.", "error");

    setProcessing(true);
    try {
      const res = await fetch(image);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');

      const response = await axios.post(`${apiUrl}/api/ai/suggest`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'x-auth-token': localStorage.getItem('customerAuthToken')
        },
      });

      setAnalysis(response.data.analysis);
      setSuggestions(response.data.suggestions);
      setUsesLeft(response.data.usesLeft);
      showAlert("Biometric analysis successful!", "success");
    } catch (error) {
      showAlert(error.response?.data?.message || "Inference failed.", "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] pt-24 pb-12 px-4 text-white font-sans selection:bg-amber-500/30">
      {/* HUD Alert System */}
      {alert && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[3000] w-full max-w-md p-4 rounded-2xl border backdrop-blur-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-6 duration-500 ${
          alert.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
          alert.type === 'success' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
          'bg-zinc-900/50 border-white/10 text-zinc-300'
        }`}>
          {alert.type === 'error' ? <AlertTriangle size={20} /> : 
           alert.type === 'success' ? <ShieldCheck size={20} className="animate-pulse" /> : <Info size={20} />}
          <p className="flex-1 text-sm font-black uppercase tracking-wider">{alert.message}</p>
          <button onClick={() => setAlert(null)}><X size={16} /></button>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Futuristic Header */}
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={() => navigate(-1)}
            className="group p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/50 transition-all active:scale-95"
          >
            <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          
          <div className="flex flex-col items-center">
             <div className="flex items-center gap-2 mb-1 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black tracking-[0.2em] uppercase">
                <BrainCircuit size={12} /> Neural Processing Unit
             </div>
             <h1 className="text-3xl font-black tracking-tighter">NEURAL STYLIST V2</h1>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900/80 border border-white/5 px-6 py-3 rounded-2xl backdrop-blur-md">
            <Zap size={18} className="text-amber-500 fill-amber-500" />
            <span className="font-black text-sm tracking-widest">{usesLeft} SCANS LEFT</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Scanner Hub */}
          <div className="lg:col-span-5 space-y-8">
            <div className="relative aspect-square rounded-[48px] overflow-hidden bg-zinc-900/30 border border-white/5 shadow-2xl group">
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent opacity-30" />
              
              {image ? (
                <div className="relative w-full h-full">
                  <img src={image} alt="Biometric source" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                  
                  {/* Scanning HUD Overlays */}
                  {processing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                       <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 shadow-[0_0_20px_#f59e0b] animate-scan-web z-20" />
                       <Loader2 size={64} className="animate-spin text-amber-500 mb-6" />
                       <div className="flex flex-col items-center gap-2">
                          <p className="text-xl font-black tracking-[0.3em] scroll-px-10 animate-pulse text-amber-500">MAPPING FEATURES</p>
                          <div className="flex gap-1">
                             {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: `${i*0.2}s` }} />)}
                          </div>
                       </div>
                    </div>
                  )}

                  {!processing && !suggestions && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                       <button onClick={() => {setImage(null); setSuggestions(null); setAnalysis(null);}} className="p-4 bg-red-500/20 border border-red-500/50 rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-all">
                          <X size={32} />
                       </button>
                    </div>
                  )}

                  {/* Corner Brackets */}
                  <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-amber-500/50 rounded-tl-2xl" />
                  <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-amber-500/50 rounded-tr-2xl" />
                  <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-amber-500/50 rounded-bl-2xl" />
                  <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-amber-500/50 rounded-br-2xl" />
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-amber-500/5 transition-all group">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10 group-hover:border-amber-500/50 group-hover:scale-110 transition-all">
                    <Target size={48} className="text-amber-500 opacity-50 group-hover:opacity-100" />
                  </div>
                  <h3 className="text-2xl font-black mb-2 tracking-tight">INITIALIZE SENSOR</h3>
                  <p className="text-zinc-500 font-medium">Clear frontal image required for inference</p>
                </label>
              ) }
            </div>

            {image && !suggestions && !processing && (
              <button 
                onClick={getSuggestions}
                className="w-full py-6 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-3xl flex items-center justify-center gap-4 transition-all shadow-2xl shadow-amber-600/30 active:scale-95 text-lg"
              >
                <Award size={24} /> ACTIVATE DEEP INFERENCE
              </button>
            )}

            {/* AI Reasoning Summary (Bottom Left) */}
            {analysis && (
               <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 space-y-6 slide-in-bottom">
                  <div className="flex items-center gap-3">
                     <BookMarked className="text-amber-500" size={20} />
                     <h4 className="font-black text-xs tracking-[0.2em] uppercase text-zinc-400">Stylist's Command</h4>
                  </div>
                  <p className="text-xl font-medium leading-relaxed italic text-zinc-200">
                    "{analysis.stylistNote}"
                  </p>
                  <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                     <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-black">
                        <Stars size={16} />
                     </div>
                     <span className="text-xs font-black tracking-widest uppercase">Certified Recommendations</span>
                  </div>
               </div>
            )}
          </div>

          {/* Right Column: Biometric Dash & Results */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* Biometric Dashboard */}
            {analysis && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-right-12 duration-700">
                 {[
                   { label: 'FACE SHAPE', value: analysis.faceShape, color: 'text-white' },
                   { label: 'MATCH RATIO', value: `${Math.round(analysis.confidence * 100)}%`, color: 'text-amber-500' },
                   { label: 'JAWLINE VIBE', value: `${analysis.details.jawline}/10`, color: 'text-white' },
                   { label: 'ARCHETYPE', value: analysis.archetype, color: 'text-amber-500' },
                 ].map((stat, i) => (
                   <div key={i} className="bg-zinc-900/80 border border-white/5 p-6 rounded-3xl backdrop-blur-xl">
                      <p className="text-[10px] font-black text-zinc-500 mb-3 tracking-widest">{stat.label}</p>
                      <p className={`text-xl font-black ${stat.color} uppercase truncate`}>{stat.value}</p>
                   </div>
                 ))}
              </div>
            )}

            {/* Suggestions View */}
            {suggestions ? (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-black tracking-tighter">CURATED REPRODUCTIONS</h3>
                  <div className="flex gap-2">
                     <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                     <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-75" />
                     <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-150" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {suggestions.hairstyles.map((style, idx) => (
                     <div key={idx} className="group relative bg-zinc-900 border border-white/5 rounded-[40px] overflow-hidden hover:border-amber-500/40 transition-all duration-700">
                        <div className="aspect-[4/5] overflow-hidden">
                           <img src={style.image} alt={style.name} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                           
                           <div className="absolute top-6 left-6">
                              <span className="px-4 py-2 bg-amber-500 text-black text-[10px] font-black rounded-full uppercase tracking-widest shadow-xl">
                                {style.archetype}
                              </span>
                           </div>

                           <div className="absolute bottom-8 left-8 right-8 space-y-6">
                              <p className="text-2xl font-black uppercase tracking-tight">{style.name}</p>
                              <button 
                                onClick={() => navigate(`/all-services-search?q=${style.name}`)}
                                className="w-full py-4 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 shadow-2xl active:scale-95"
                              >
                                 <Calendar size={20} /> BOOK THIS STYLE
                              </button>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>

                <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-12 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
                   <div className="relative z-10">
                      <h4 className="font-black text-xs tracking-[0.2em] text-amber-500 mb-8 uppercase">Neural Beard Mapping</h4>
                      <div className="flex flex-wrap gap-4">
                        {suggestions.beards.map((beard, i) => (
                          <div key={i} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-sm uppercase tracking-tighter hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all cursor-default">
                             {beard}
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 border border-white/5 rounded-[48px] bg-zinc-900/20">
                 <BrainCircuit size={80} className="text-zinc-800 mb-6" />
                 <h3 className="text-3xl font-black mb-4 text-zinc-700">NEURAL ENGINE IDLE</h3>
                 <p className="text-zinc-600 max-w-sm">Provide high-resolution facial data to initialize the inference sequence.</p>
              </div>
            )}

            {suggestions && (
               <button 
                 onClick={() => {setImage(null); setSuggestions(null); setAnalysis(null);}}
                 className="mx-auto flex items-center gap-3 text-zinc-600 hover:text-white transition-all font-black text-xs tracking-[0.3em] uppercase"
               >
                 <X size={16} /> RE-INITIALIZE SCANNER
               </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan-web {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan-web {
          animation: scan-web 3s linear infinite;
        }
        .slide-in-bottom {
          animation: slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideIn {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default FaceSuggestor;
