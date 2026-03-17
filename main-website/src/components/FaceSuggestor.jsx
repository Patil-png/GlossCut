import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Stars,
  AlertTriangle,
  Info,
  X,
  Calendar,
  Zap,
  Target,
  ShieldCheck,
  BrainCircuit,
  Award,
  BookMarked,
  Fingerprint,
  ZapOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const FaceSuggestor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const apiUrl = process.env.REACT_APP_API_URL || 'https://api.glosscut.com';

  const [image, setImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [usesLeft, setUsesLeft] = useState(user?.faceSuggestorUses ?? 2);
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback((message, type = 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
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
    <div className="min-h-screen bg-[#050505] pt-24 pb-12 px-4 text-white font-sans selection:bg-amber-500/30 overflow-x-hidden">
      {/* HUD Background Decoration */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-500/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      {/* HUD Alert System */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ y: -50, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: -50, opacity: 0, x: '-50%' }}
            className={`fixed top-24 left-1/2 z-[3000] w-full max-w-md p-4 rounded-2xl border backdrop-blur-3xl flex items-center gap-4 shadow-2xl ${alert.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                alert.type === 'success' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                  'bg-zinc-900/50 border-white/10 text-zinc-300'
              }`}
          >
            {alert.type === 'error' ? <AlertTriangle size={20} /> :
              alert.type === 'success' ? <ShieldCheck size={20} className="animate-pulse" /> : <Info size={20} />}
            <p className="flex-1 text-sm font-black uppercase tracking-widest">{alert.message}</p>
            <button onClick={() => setAlert(null)}><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Futuristic Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="group p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-white/10 transition-all active:scale-95"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="flex flex-col items-center text-center">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-amber-500/5 border border-amber-500/20 text-amber-500 text-[9px] font-black tracking-[0.3em] uppercase"
            >
              <Fingerprint size={12} /> Biometric Auth Active
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
              NEURAL STYLIST<span className="text-amber-500 ml-2">V3.0</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex flex-col items-end ${usesLeft === 0 ? 'text-red-500' : 'text-amber-500'}`}>
              <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-zinc-900/80 border border-white/5 backdrop-blur-md">
                {usesLeft > 0 ? <Zap size={18} fill="currentColor" /> : <ZapOff size={18} />}
                <span className="font-black text-sm tracking-widest uppercase">{usesLeft} Scans Remaining</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Left Column: AI Scanner Core */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="lg:col-span-6"
          >
            <div className="relative group rounded-[60px] p-2 bg-gradient-to-br from-amber-500/20 via-transparent to-blue-500/20 border border-white/5">
              <div className="relative aspect-square rounded-[54px] overflow-hidden bg-zinc-950 shadow-inner">
                {image ? (
                  <div className="relative w-full h-full">
                    <motion.img
                      layoutId="userFace"
                      src={image}
                      alt="Raw Input"
                      className="w-full h-full object-cover"
                    />

                    {/* Scanning UX */}
                    <AnimatePresence>
                      {processing && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-8"
                        >
                          {/* Animated Grid */}
                          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#f59e0b22_1px,transparent_1px),linear-gradient(to_bottom,#f59e0b22_1px,transparent_1px)] bg-[size:40px_40px]" />

                          <motion.div
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 w-full h-[2px] bg-amber-500 shadow-[0_0_20px_#f59e0b] z-20"
                          />

                          <div className="relative">
                            <motion.div
                              animate={{ scale: [1, 1.2, 1], rotate: 360 }}
                              transition={{ duration: 4, repeat: Infinity }}
                              className="w-32 h-32 rounded-full border-2 border-amber-500/30 border-t-amber-500"
                            />
                            <BrainCircuit size={48} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500" />
                          </div>

                          <div className="text-center space-y-2">
                            <motion.p
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="text-2xl font-black tracking-[0.4em] text-amber-500"
                            >
                              ANALYZING...
                            </motion.p>
                            <p className="text-[10px] font-black tracking-widest uppercase text-zinc-500">
                              Identifying Structural Vectors
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Static HUD Brackets */}
                    <div className="absolute inset-8 pointer-events-none">
                      <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-amber-500/40 rounded-tl-3xl" />
                      <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-amber-500/40 rounded-tr-3xl" />
                      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-amber-500/40 rounded-bl-3xl" />
                      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-amber-500/40 rounded-br-3xl" />
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-amber-500/5 transition-all group p-12 text-center">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-28 h-28 bg-white/5 rounded-full flex items-center justify-center mb-10 border border-white/10 group-hover:border-amber-500/50"
                    >
                      <Target size={56} className="text-amber-500/40 group-hover:text-amber-500 group-hover:animate-pulse" />
                    </motion.div>
                    <h3 className="text-3xl font-black mb-4 tracking-tighter">MOUNT FACIAL DATA</h3>
                    <p className="text-zinc-500 font-medium max-w-xs mx-auto">
                      High-contrast daylight photos yield 98% accuracy in structural mapping.
                    </p>
                  </label>
                )}
              </div>
            </div>

            <AnimatePresence>
              {image && !suggestions && !processing && (
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  onClick={getSuggestions}
                  className="w-full mt-10 py-7 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-[32px] flex items-center justify-center gap-4 transition-all shadow-[0_20px_50px_rgba(245,158,11,0.2)] active:scale-95 text-xl tracking-tight"
                >
                  <Stars size={28} /> TRIGGER NEURAL INFERENCE
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Column: Intelligent Dash & Results */}
          <div className="lg:col-span-6 space-y-12">

            <AnimatePresence mode="wait">
              {analysis ? (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-12"
                >
                  {/* Metric Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'FACE ARCHITECTURE', value: analysis.faceShape, icon: Target },
                      { label: 'JAWLINE SCORE', value: `${analysis.details.jawline}/10`, icon: ShieldCheck },
                      { label: 'STYLE ARCHETYPE', value: analysis.archetype, icon: Award, highlight: true },
                      { label: 'CONFIDENCE', value: `${Math.round(analysis.confidence * 100)}%`, icon: Zap },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-6 rounded-[32px] border ${stat.highlight ? 'bg-amber-500/10 border-amber-500/30' : 'bg-zinc-900/50 border-white/5'} backdrop-blur-xl`}
                      >
                        <div className="flex items-center gap-3 mb-4 opacity-40">
                          <stat.icon size={14} />
                          <span className="text-[10px] font-black tracking-widest uppercase">{stat.label}</span>
                        </div>
                        <p className={`text-2xl font-black uppercase tracking-tighter ${stat.highlight ? 'text-amber-500' : ''}`}>{stat.value}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Stylist Command Box */}
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="p-10 rounded-[48px] bg-gradient-to-br from-zinc-900 to-black border border-white/5 relative overflow-hidden group shadow-2xl"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] -z-10 group-hover:bg-amber-500/20 transition-all duration-1000" />
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-black">
                        <BookMarked size={20} />
                      </div>
                      <h4 className="font-black text-xs tracking-[0.3em] text-zinc-400 uppercase">Consultant's Verdict</h4>
                    </div>
                    <p className="text-2xl font-medium leading-[1.4] text-white/90 italic">
                      "{analysis.stylistNote}"
                    </p>
                  </motion.div>

                  {/* Results Display */}
                  <div className="space-y-10">
                    <h3 className="text-xs font-black tracking-[0.4em] uppercase text-zinc-500 border-b border-white/5 pb-4">Generated Style Profiles</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {suggestions.hairstyles.map((style, idx) => (
                        <motion.div
                          key={idx}
                          whileHover={{ y: -10 }}
                          className="group relative bg-[#0a0a0a] rounded-[48px] overflow-hidden border border-white/5 hover:border-amber-500/40 shadow-2xl transition-all duration-500"
                        >
                          <div className="aspect-[4/5] overflow-hidden relative">
                            <img src={style.image} alt={style.name} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-125" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                            <div className="absolute top-8 left-8">
                              <motion.span
                                animate={{ opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="px-6 py-2.5 bg-amber-500 text-black text-[9px] font-black rounded-full uppercase tracking-widest shadow-2xl"
                              >
                                {style.archetype}
                              </motion.span>
                            </div>

                            <div className="absolute bottom-10 left-10 right-10 space-y-6">
                              <p className="text-3xl font-black uppercase tracking-tighter leading-none">{style.name}</p>
                              <button
                                onClick={() => navigate(`/all-services-search?q=${style.name}`)}
                                className="w-full py-5 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 hover:bg-amber-500"
                              >
                                <Calendar size={20} /> RESERVE STYLE
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-[48px] p-12 flex flex-col items-center">
                      <h4 className="font-black text-[10px] tracking-[0.5em] text-zinc-500 mb-8 uppercase">Neural Beard Comps</h4>
                      <div className="flex flex-wrap justify-center gap-3">
                        {suggestions.beards.map((beard, i) => (
                          <motion.div
                            key={i}
                            whileHover={{ scale: 1.05 }}
                            className="px-10 py-5 bg-[#0a0a0a] border border-white/10 rounded-3xl font-black text-xs uppercase tracking-widest hover:border-amber-500 hover:text-amber-500 transition-all cursor-default"
                          >
                            {beard}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => { setImage(null); setSuggestions(null); setAnalysis(null); }}
                      className="w-full py-6 text-zinc-600 hover:text-white transition-all font-black text-[10px] tracking-[0.5em] uppercase"
                    >
                      <X size={14} className="inline mr-2" /> Reset Matrix
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-20 py-32 border border-dashed border-white/5 rounded-[60px] bg-zinc-900/10">
                  <Target size={120} className="text-zinc-900 mb-10 animate-pulse" />
                  <h3 className="text-4xl font-black mb-6 text-zinc-800">READY FOR SCAN</h3>
                  <p className="text-zinc-700 max-w-sm font-medium">Feed the neural engine with high-fidelity biometric data to generate your personalized styling manifests.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceSuggestor;
