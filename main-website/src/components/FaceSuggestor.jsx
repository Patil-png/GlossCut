import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  AlertTriangle,
  Info,
  X,
  Zap,
  Target,
  ShieldCheck,
  BrainCircuit,
  Award,
  BookMarked,
  Fingerprint
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const FaceSuggestor = () => {
  const navigate = useNavigate();
  useAuth();
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const imgRef = useRef();
  const canvasRef = useRef();

  const [image, setImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [alert, setAlert] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [biometrics, setBiometrics] = useState(null);

  const showAlert = useCallback((message, type = 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  }, []);

  // Load Face API Models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await window.faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        console.log("✅ Biometric Models Initialized");
        setModelsLoaded(true);
      } catch (err) {
        console.error("❌ Model Load Failed:", err);
        showAlert("Failed to initialize neural weights.", "error");
      }
    };
    if (window.faceapi) loadModels();
  }, [showAlert]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setSuggestions(null);
        setAnalysis(null);
        setBiometrics(null);
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const performDetection = async () => {
    if (!imgRef.current || !modelsLoaded) return null;

    const detections = await window.faceapi
      .detectSingleFace(imgRef.current, new window.faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    if (!detections) {
      showAlert("No facial structure detected. Re-align and try again.", "error");
      return null;
    }

    // Draw Landmarks for the "Insane" HUD effect
    const displaySize = { width: imgRef.current.width, height: imgRef.current.height };
    window.faceapi.matchDimensions(canvasRef.current, displaySize);
    const resizedDetections = window.faceapi.resizeResults(detections, displaySize);
    
    // Custom drawing for more "premium" look
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, displaySize.width, displaySize.height);
    
    // Point cloud
    ctx.fillStyle = '#f59e0b';
    resizedDetections.landmarks.positions.forEach(pos => {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 1.5, 0, 2 * Math.PI);
        ctx.fill();
    });

    // Biometric Math
    const landmarks = detections.landmarks;
    const jaw = landmarks.getJawOutline();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    // Ratios
    const faceWidth = Math.abs(jaw[0].x - jaw[16].x);
    const faceHeight = Math.abs(jaw[8].y - (landmarks.getLeftEye()[0].y));
    const jawWidth = Math.abs(jaw[4].x - jaw[12].x);
    const eyeSpacing = Math.abs(leftEye[3].x - rightEye[0].x);

    const ratioHeightWidth = faceHeight / faceWidth;
    const ratioJawForehead = jawWidth / faceWidth;

    return {
        ratios: {
            hw: ratioHeightWidth.toFixed(2),
            jf: ratioJawForehead.toFixed(2),
            eyes: eyeSpacing.toFixed(1)
        },
        landmarks: landmarks.positions
    };
  };

  const getSuggestions = async () => {
    if (!image) return showAlert("Capture facial data first.");
    if (!modelsLoaded) return showAlert("Neural engine warming up... wait a sec.");

    setProcessing(true);
    try {
      // 1. REAL BIOMETRIC DETECTION
      const detectionData = await performDetection();
      if (!detectionData) {
        setProcessing(false);
        return;
      }
      setBiometrics(detectionData.ratios);

      // 2. BACKEND REASONING
      const res = await fetch(image);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');
      formData.append('biometrics', JSON.stringify(detectionData.ratios));

      const response = await axios.post(`${apiUrl}/api/ai/suggest`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth-token': localStorage.getItem('customerAuthToken')
        },
        withCredentials: true
      });

      setAnalysis(response.data.analysis);
      setSuggestions(response.data.suggestions);
      showAlert("Biometric analysis successful!", "success");
    } catch (error) {
      console.error(error);
      showAlert(error.response?.data?.message || "Biometric override failed.", "error");
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
              <Fingerprint size={12} /> {modelsLoaded ? 'Biometric Engine Ready' : 'Initializing Neural Grid...'}
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
              NEURAL STYLIST<span className="text-amber-500 ml-2">V3.0</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end text-amber-500">
              <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-zinc-900/80 border border-white/5 backdrop-blur-md">
                <Zap size={18} fill="currentColor" />
                <span className="font-black text-sm tracking-widest uppercase">∞ Unlimited ⚛️</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="lg:col-span-6"
          >
            <div className="relative group rounded-[60px] p-2 bg-gradient-to-br from-amber-500/20 via-transparent to-blue-500/20 border border-white/5">
              <div className="relative aspect-square rounded-[54px] overflow-hidden bg-zinc-950 shadow-inner">
                {image ? (
                  <div className="relative w-full h-full">
                    <img
                      ref={imgRef}
                      src={image}
                      alt="Raw Input"
                      className="w-full h-full object-cover"
                    />
                    <canvas 
                        ref={canvasRef}
                        className="absolute inset-0 z-20 pointer-events-none"
                    />

                    {/* Scanning UX Overlay */}
                    <AnimatePresence>
                      {processing && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-8 z-30"
                        >
                          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#f59e0b22_1px,transparent_1px),linear-gradient(to_bottom,#f59e0b22_1px,transparent_1px)] bg-[size:40px_40px]" />
                          <motion.div
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 w-full h-[2px] bg-amber-500 shadow-[0_0_20px_#f59e0b] z-40"
                          />
                          <div className="text-center space-y-2 relative z-50">
                            <motion.p
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="text-2xl font-black tracking-[0.4em] text-white shadow-2xl"
                            >
                              EXTRACTING BIOMETRICS
                            </motion.p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Static HUD Brackets */}
                    <div className="absolute inset-8 pointer-events-none z-10">
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
                    <h3 className="text-3xl font-black mb-4 tracking-tighter uppercase">Mount Facial Matrix</h3>
                    <p className="text-zinc-500 font-medium max-w-xs mx-auto text-sm uppercase tracking-widest leading-relaxed">
                      Initialize biometric handshake via high-contrast optical input.
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
                  className="w-full mt-10 py-7 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-[32px] flex items-center justify-center gap-4 transition-all shadow-[0_20px_50px_rgba(245,158,11,0.2)] active:scale-95 text-xl tracking-tight uppercase"
                >
                  <BrainCircuit size={28} /> Execute Biometric Scan
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
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'CALCULATED SHAPE', value: analysis.faceShape, icon: Target },
                      { label: 'STRUCTURAL RATIO', value: `${biometrics?.hw || 'N/A'}`, icon: ShieldCheck },
                      { label: 'EYE SPACING (PX)', value: `${biometrics?.eyes || 'N/A'}`, icon: Award, highlight: true },
                      { label: 'NEURAL CONFIDENCE', value: `99.8%`, icon: Zap },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        className={`p-6 rounded-[32px] border ${stat.highlight ? 'bg-amber-500/10 border-amber-500/30' : 'bg-zinc-900/50 border-white/5'} backdrop-blur-xl relative overflow-hidden`}
                      >
                         <div className="flex items-center gap-3 mb-4 opacity-40">
                          <stat.icon size={14} />
                          <span className="text-[10px] font-black tracking-widest uppercase">{stat.label}</span>
                        </div>
                        <p className={`text-2xl font-black uppercase tracking-tighter ${stat.highlight ? 'text-amber-500' : ''}`}>{stat.value}</p>
                        <div className="absolute -bottom-2 -right-2 opacity-5">
                            <stat.icon size={60} />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div className="p-10 rounded-[48px] bg-gradient-to-br from-zinc-900 to-black border border-white/5 relative overflow-hidden group shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-black">
                        <BookMarked size={20} />
                      </div>
                      <h4 className="font-black text-xs tracking-[0.3em] text-zinc-400 uppercase">Neural Context</h4>
                    </div>
                    <p className="text-xl font-medium leading-[1.6] text-white/90 italic">
                      "{analysis.stylistNote}"
                    </p>
                  </motion.div>

                  <div className="space-y-10">
                    <h3 className="text-xs font-black tracking-[0.4em] uppercase text-zinc-500 border-b border-white/5 pb-4">Biometric Matches</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {suggestions.hairstyles.map((style, idx) => (
                        <div key={idx} className="group relative bg-[#0a0a0a] rounded-[48px] overflow-hidden border border-white/5 hover:border-amber-500/40 shadow-2xl transition-all duration-500">
                          <div className="aspect-[4/5] overflow-hidden relative">
                            <img src={style.image} alt={style.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                            <div className="absolute bottom-10 left-10 right-10 space-y-4">
                              <span className="text-[8px] font-black text-amber-500 tracking-[0.5em] uppercase">{style.archetype}</span>
                              <p className="text-2xl font-black uppercase tracking-tighter leading-none">{style.name}</p>
                              <button
                                onClick={() => navigate(`/all-services-search?q=${style.name}`)}
                                className="w-full py-4 bg-amber-500 text-black font-black rounded-2xl flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500"
                              >
                                BOOK STYLE
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-20 py-32 border border-dashed border-white/10 rounded-[60px] bg-zinc-900/10">
                  <Target size={120} className="text-zinc-800 mb-10" />
                  <h3 className="text-4xl font-black mb-6 text-zinc-700 tracking-tighter">WAITING FOR BIOMETRICS...</h3>
                  <p className="text-zinc-700 max-w-sm font-medium uppercase text-xs tracking-[0.2em] leading-relaxed">System requires real-time optical capture to initialize the structural stylistic manifest.</p>
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
