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
  BookMarked,
  Fingerprint,
  Camera,
  Stars,
  Scan,
  Share2,
  RotateCcw,
  Check,
  Bot
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ARCHETYPE_MAP = {
  'Oval': { title: 'The Balanced Icon', rarity: 'top 12%', color: '#f59e0b' },
  'Round': { title: 'The Soft Visionary', rarity: 'top 18%', color: '#22c55e' },
  'Square': { title: 'The Bold Powerhouse', rarity: 'top 9%', color: '#3b82f6' },
  'Heart': { title: 'The Precision Creative', rarity: 'top 15%', color: '#ec4899' },
  'Diamond': { title: 'The Sharp Aesthetic', rarity: 'top 7%', color: '#a855f7' },
  'Oblong': { title: 'The Elegant Architect', rarity: 'top 11%', color: '#6366f1' }
};

const FaceSuggestor = () => {
  const navigate = useNavigate();
  const [biometrics, setBiometrics] = useState(null);
  const [copied, setCopied] = useState(false);

  const resetSession = () => {
    setImage(null);
    setAnalysis(null);
    setSuggestions(null);
    setBiometrics(null);
    setProcessing(false);
  };

  const handleShare = async () => {
    const archetype = ARCHETYPE_MAP[analysis?.faceShape] || { title: analysis?.faceShape, rarity: 'Genetic' };
    const shareData = {
      title: 'My Neural Style Signature',
      text: `My face geometry is "${archetype.title}" (${archetype.rarity} rarity). Just got my biometric analysis on SetKarr! Check your status!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        showAlert("Link copied to clipboard!", "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const imgRef = useRef();
  const canvasRef = useRef();

  const [image, setImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [alert, setAlert] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [computingStatus, setComputingStatus] = useState("INITIALIZING GRID...");
  const [progress, setProgress] = useState(0);

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

    // 1. Draw Connective Neural Grid (Surgical Web)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 3]);
    ctx.globalAlpha = 0.3;

    const drawPath = (points, close = false) => {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      if (close) ctx.closePath();
      ctx.stroke();
    };

    // Draw key feature paths
    drawPath(resizedDetections.landmarks.getJawOutline());
    drawPath(resizedDetections.landmarks.getLeftEye(), true);
    drawPath(resizedDetections.landmarks.getRightEye(), true);
    drawPath(resizedDetections.landmarks.getNose(), false);
    drawPath(resizedDetections.landmarks.getMouth(), true);

    // 2. Draw High-Visibility Neural Points
    ctx.setLineDash([]); // Reset dash
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#f59e0b';
    ctx.fillStyle = '#f59e0b';

    resizedDetections.landmarks.positions.forEach(pos => {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 2.2, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Reset shadow for subsequent draws
    ctx.shadowBlur = 0;

    // Biometric Math (Surgical V7)
    const landmarks = detections.landmarks;
    const jaw = landmarks.getJawOutline();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    // 4-Point Width Analysis (Surgical V7)
    const faceWidthMax = Math.max(0.1, Math.abs(jaw[0].x - jaw[16].x));

    // Phase 5 Audit Fix: Zygomatic arch (cheekbones) corresponds to landmarks [3, 13]
    const cheekWidth = Math.abs(jaw[3].x - jaw[13].x);
    const jawWidth = Math.abs(jaw[5].x - jaw[11].x);

    // Phase 1 Audit Fix: Index [0] is outer corner for both eyes
    const eyeToChinHeight = Math.abs(jaw[8].y - ((leftEye[0].y + rightEye[0].y) / 2));

    // Phase 3 Audit Fix: Anatomical multiplier 1.42 (Recalibrated for V7 Balance)
    const estimatedTotalHeight = eyeToChinHeight * 1.42;

    // Alignment Metrics (Symmetry & Tilt)
    const eyeLevelDiff = Math.abs(leftEye[0].y - rightEye[0].y);
    const alignmentScore = Math.max(0, 1 - (eyeLevelDiff / (faceWidthMax * 0.2)));

    return {
      ratios: {
        hw: Number((estimatedTotalHeight / faceWidthMax).toFixed(2)),
        jf: Number((jawWidth / faceWidthMax).toFixed(2)),
        cw: Number((cheekWidth / faceWidthMax).toFixed(2)),
        alignment: Number(alignmentScore.toFixed(2)),
        // Audit Fix (Pass 4): Normalize by face width for scale-invariant ratio & increase precision
        eyes: Number((Math.abs(leftEye[3].x - rightEye[0].x) / faceWidthMax).toFixed(3))
      },
      landmarks: landmarks.positions
    };
  };

  const getSuggestions = async () => {
    if (!image) return showAlert("Capture facial data first.");
    if (!modelsLoaded) return showAlert("Neural engine warming up... wait a sec.");
    setProcessing(true);
    setProgress(0);
    setComputingStatus("INITIALIZING NEURAL GRID...");

    try {
      // Phase 1: Biometric Mapping
      await new Promise(r => setTimeout(r, 800));
      setComputingStatus("MAPPING FACIAL VERTICES...");
      setProgress(20);

      const detectionData = await performDetection();
      if (!detectionData) {
        setProcessing(false);
        return;
      }
      setBiometrics(detectionData.ratios);

      // Phase 2: DNA cross-referencing
      await new Promise(r => setTimeout(r, 600));
      setComputingStatus("CALCULATING BIOMETRIC RATIOS...");
      setProgress(45);

      const res = await fetch(image);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');
      formData.append('biometrics', JSON.stringify(detectionData.ratios));

      // Phase 3: Matrix Reasoning
      await new Promise(r => setTimeout(r, 500));
      setComputingStatus("CROSS-REFERENCING ARCHETYPES...");
      setProgress(75);

      const response = await axios.post(`${apiUrl}/api/ai/suggest`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth-token': localStorage.getItem('customerAuthToken') || ''
        },
        withCredentials: true
      });

      // Final Phase
      setComputingStatus("FINALIZING NEURAL SIGNATURE...");
      setProgress(100);
      await new Promise(r => setTimeout(r, 400));

      const analysisData = response.data.analysis;
      const archetype = ARCHETYPE_MAP[analysisData.faceShape] || { title: analysisData.faceShape, rarity: '99%' };

      setAnalysis({
        ...analysisData,
        archetypeTitle: archetype.title,
        rarity: archetype.rarity,
        themeColor: archetype.color
      });
      setSuggestions(response.data.suggestions);
      showAlert(`Neural Signature: ${archetype.title}`, "success");
    } catch (error) {
      console.error(error);
      showAlert(error.response?.data?.message || "Biometric override failed.", "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24 md:pt-28 pb-12 md:pb-12 px-3 md:px-4 text-slate-900 font-sans selection:bg-amber-500/10 overflow-x-hidden">
      {/* LUSH MINIMALISM BACKGROUND SYSTEM */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#f8fafc]" />

        {/* Soft Designer Glows */}
        <div
          className="absolute top-[-10%] right-[-10%] w-[70vw] h-[70vw] rounded-full blur-[120px] opacity-[0.07] mix-blend-multiply animate-pulse"
          style={{
            background: 'radial-gradient(circle, #22C55E 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[100px] opacity-[0.05] mix-blend-multiply"
          style={{
            background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)',
          }}
        />

        {/* Premium Noise Grain Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        {/* Structural Scanline Pattern */}
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(15,23,42,0)_50%,rgba(15,23,42,1)_50%),linear-gradient(90deg,rgba(15,23,42,0)_50%,rgba(15,23,42,1)_50%)] bg-[size:4px_4px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ y: -50, opacity: 0, x: '-50%', scale: 0.95 }}
            animate={{ y: 0, opacity: 1, x: '-50%', scale: 1 }}
            exit={{ y: -50, opacity: 0, x: '-50%', scale: 0.95 }}
            className={`fixed top-24 left-1/2 z-[3000] w-[90%] max-w-md rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-2xl flex flex-col items-stretch shadow-2xl overflow-hidden ${alert.type === 'error' ? 'shadow-red-500/10' :
                alert.type === 'success' ? 'shadow-amber-500/10' : 'shadow-slate-500/5'
              }`}
          >
            <div className="p-4 md:p-5 flex items-center gap-4">
              <div className={`p-2 rounded-lg ${alert.type === 'error' ? 'bg-red-500/20 text-red-400' :
                  alert.type === 'success' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700/50 text-slate-300'
                }`}>
                {alert.type === 'error' ? <AlertTriangle size={18} /> :
                  alert.type === 'success' ? <ShieldCheck size={18} className="animate-pulse" /> : <Info size={18} />}
              </div>
              <div className="flex-1 flex flex-col gap-0.5">
                <span className="text-[8px] font-black tracking-[0.2em] text-slate-500 uppercase">
                  {alert.type === 'error' ? 'ERR: PROTOCOL_BREACH' :
                    alert.type === 'success' ? 'SEC: NEURAL_FIX' : 'SYS: STATUS_UPDATE'}
                </span>
                <p className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest leading-tight">
                  {alert.message}
                </p>
              </div>
              <button
                onClick={() => setAlert(null)}
                className="p-1 hover:bg-white/10 rounded-md transition-colors text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
            {/* Neural Life-cycle Progress Bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 4, ease: "linear" }}
              className={`h-[3px] origin-left ${alert.type === 'error' ? 'bg-red-500' :
                  alert.type === 'success' ? 'bg-amber-500' : 'bg-slate-500'
                }`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col md:flex-row items-center justify-between mb-8 md:mb-10 gap-5 md:gap-6 px-1 md:px-4"
        >
          <button
            onClick={() => navigate(-1)}
            className="group p-3 md:p-4 rounded-xl md:rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all active:scale-95 hidden md:flex items-center justify-center order-2 md:order-1"
          >
            <ChevronLeft size={20} className="text-slate-600 group-hover:-translate-x-1 transition-transform" />
          </button>

          <div className="flex flex-col items-center text-center order-1 md:order-2">
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="flex items-center gap-2 mb-3 md:mb-4 px-3 md:px-4 py-1 md:py-1.5 rounded-full bg-white/80 border border-slate-200 text-slate-500 text-[8px] md:text-[10px] font-bold tracking-[0.2em] md:tracking-[0.3em] uppercase backdrop-blur-md shadow-sm"
            >
              <Fingerprint size={10} className="text-amber-500" /> {modelsLoaded ? 'SYSTEM ENCRYPTED' : 'INITIALIZING GRID...'}
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 mb-2 relative">
              Neural Stylist<span className="text-amber-500">_</span>
              <span className="absolute -top-3 md:-top-4 -right-6 md:-right-8 text-[8px] md:text-[10px] font-bold bg-slate-900 text-white px-1.5 md:px-2 py-0.5 md:py-1 rounded-md tracking-[0.2em]">V3.0</span>
            </h1>
            <p className="text-slate-400 text-[10px] md:text-xs lg:text-sm max-w-[280px] md:max-w-sm font-medium tracking-tight uppercase tracking-widest leading-relaxed">
              Biometric Archetype Matching engine
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3 order-3">
            <div className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
              <Zap size={14} fill="currentColor" />
              <span className="text-[8px] md:text-[10px] font-black tracking-[0.1em] md:tracking-[0.2em] uppercase">Unlimited Access</span>
            </div>
          </div>
        </motion.div>

        <div className="lg:col-span-12 xl:col-span-10 xl:offset-1 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="w-full lg:max-w-md mx-auto"
            >
              <div className="relative group rounded-[32px] md:rounded-[48px] p-1 md:p-2 bg-white border border-slate-200 shadow-xl md:shadow-2xl flex flex-col">
                <div className="relative aspect-[4/5] lg:aspect-auto lg:h-[500px] rounded-[28px] md:rounded-[42px] overflow-hidden bg-slate-50">
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
                            className="absolute inset-0 bg-slate-900/80 backdrop-blur-2xl flex flex-col items-center justify-center gap-8 z-30"
                          >
                            {/* Neural Pulse Energy Aura */}
                            <div className="absolute inset-0 opacity-30 bg-[linear-gradient(to_right,#f59e0b11_1px,transparent_1px),linear-gradient(to_bottom,#f59e0b11_1px,transparent_1px)] bg-[size:25px_25px]" />

                            <motion.div
                              animate={{ top: ['-10%', '110%'] }}
                              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                              className="absolute left-0 w-full h-[6px] bg-amber-500 shadow-[0_0_50px_#f59e0b] z-40 opacity-90"
                            />

                            <div className="relative z-50 flex flex-col items-center w-full px-10">
                              <div className="relative mb-10 w-24 h-24">
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1], rotate: 360 }}
                                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                  className="absolute inset-0 rounded-full border-[6px] border-amber-500/10 border-t-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Bot size={32} className="text-amber-500 animate-pulse" />
                                </div>
                              </div>

                              <motion.p
                                key={computingStatus}
                                initial={{ y: 5, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-sm md:text-base font-black tracking-[0.4em] text-amber-500 uppercase mb-6 text-center drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                              >
                                {computingStatus}
                              </motion.p>

                              <div className="w-full max-w-[200px] h-2.5 bg-white/5 rounded-full overflow-hidden mb-4 border border-white/10 p-[1px]">
                                <motion.div
                                  className="h-full bg-amber-500 shadow-[0_0_30px_#f59e0b] rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  transition={{ duration: 0.4 }}
                                />
                              </div>

                              <div className="flex items-center gap-4 text-[10px] font-black tracking-widest text-white/50 uppercase">
                                <span>SYNC_CORE</span>
                                <span className="text-amber-500/80">{progress}%</span>
                                <span>V3.0_MATRIX</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Static HUD Brackets */}
                      <div className="absolute inset-3 md:inset-4 pointer-events-none z-10 transition-all duration-500 group-hover:inset-5 md:group-hover:inset-6">
                        <div className="absolute top-0 left-0 w-12 h-12 md:w-20 md:h-20 border-t-4 md:border-t-8 border-l-4 md:border-l-8 border-amber-500 rounded-tl-[24px] md:rounded-tl-[40px] drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                        <div className="absolute top-0 right-0 w-12 h-12 md:w-20 md:h-20 border-t-4 md:border-t-8 border-r-4 md:border-r-8 border-amber-500 rounded-tr-[24px] md:rounded-tr-[40px] drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                        <div className="absolute bottom-0 left-0 w-12 h-12 md:w-20 md:h-20 border-b-4 md:border-b-8 border-l-4 md:border-l-8 border-amber-500 rounded-bl-[24px] md:rounded-bl-[40px] drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                        <div className="absolute bottom-0 right-0 w-12 h-12 md:w-20 md:h-20 border-b-4 md:border-b-8 border-r-4 md:border-r-8 border-amber-500 rounded-br-[24px] md:rounded-br-[40px] drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-slate-50 transition-all group p-6 md:p-16 text-center">
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-8 border border-slate-200 shadow-xl group-hover:scale-110 transition-all group-hover:border-amber-500 group-hover:shadow-amber-500/10">
                        <Camera size={32} className="text-slate-200 md:size-12 group-hover:text-amber-500 transition-colors" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-black mb-2 md:mb-4 text-slate-900 tracking-tight uppercase">Upload Portrait</h3>
                      <p className="text-slate-400 font-bold max-w-[240px] md:max-w-xs mx-auto text-[8px] md:text-[10px] tracking-[0.2em] uppercase leading-relaxed opacity-70">
                        Neutral expression. Front-facing capture. <br className="hidden md:block" /> High-contrast lighting preferred.
                      </p>
                    </label>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {image && (
                  <motion.button
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    whileHover={!processing ? { scale: 1.02 } : {}}
                    whileTap={!processing ? { scale: 0.98 } : {}}
                    onClick={getSuggestions}
                    disabled={processing}
                    className={`w-full mt-8 md:mt-10 py-5 md:py-6 text-white font-black rounded-2xl md:rounded-3xl flex items-center justify-center gap-3 md:gap-4 transition-all shadow-xl uppercase tracking-widest text-xs md:text-sm ${processing ? 'bg-slate-800 cursor-not-allowed opacity-80' : 'bg-slate-900 hover:bg-black shadow-slate-200'
                      }`}
                  >
                    {processing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-amber-500 rounded-full animate-spin" />
                        Neural Computing...
                      </>
                    ) : (
                      <>
                        <BrainCircuit size={20} className="text-amber-500" />
                        {analysis ? 'Re-Run Neural Map' : 'Start Neural Mapping'}
                      </>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="w-full space-y-10">

              <AnimatePresence mode="wait">
                {analysis ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20
                    }}
                    className="space-y-10"
                  >
                    {/* Neural Signature Header Badge */}
                    <div className="flex flex-col items-center sm:items-start gap-4 mb-2">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-white text-[9px] font-black tracking-[0.3em] uppercase flex items-center gap-2 shadow-2xl"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        NEURAL IDENTITY SIGNED
                      </motion.div>
                      <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase">
                        {analysis.archetypeTitle}
                      </h2>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">DNA Prevalence:</span>
                        <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-600 text-xs font-black tracking-widest uppercase border border-amber-500/20">
                          {analysis.rarity}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:gap-6">
                      {[
                        { label: 'CALCULATED SHAPE', value: analysis.faceShape, icon: Target },
                        { label: 'GEOMETRIC ALIGNMENT', value: `${(biometrics?.alignment * 100 || 99).toFixed(0)}%`, icon: ShieldCheck, highlight: true },
                        { label: 'PROPORTION SCALE', value: analysis.details.proportionScale || 'Balanced', icon: Zap },
                        { label: 'NEURAL CONFIDENCE', value: `${(analysis.confidence * 100).toFixed(1)}%`, icon: Fingerprint },
                      ].map((stat, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border ${stat.highlight ? 'bg-amber-500 text-white border-amber-600 shadow-xl shadow-amber-500/20' : 'bg-white/60 backdrop-blur-xl border-slate-200 shadow-sm'} relative overflow-hidden group`}
                        >
                          <div className="flex items-center gap-2 mb-2 md:mb-4 opacity-70">
                            <span className={`text-[8px] md:text-[9px] font-black tracking-[0.2em] uppercase ${stat.highlight ? 'text-white' : 'text-slate-400'}`}>{stat.label}</span>
                          </div>
                          <p className={`text-xl md:text-2xl font-black tracking-tighter uppercase ${stat.highlight ? 'text-white' : 'text-slate-900'}`}>{stat.value}</p>
                          {!stat.highlight && <stat.icon className="absolute top-1/2 -right-2 -translate-y-1/2 opacity-5 scale-150 rotate-12" size={50} />}
                        </motion.div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={handleShare}
                        className="flex-1 py-4 bg-white border border-slate-200 text-slate-900 font-black rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-slate-50 active:scale-95 shadow-lg shadow-slate-200/50 uppercase tracking-widest text-[10px]"
                      >
                        {copied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} className="text-amber-500" />}
                        {copied ? 'Link Copied' : 'Share My Results'}
                      </button>
                      <button
                        onClick={resetSession}
                        className="py-4 px-8 bg-slate-50 text-slate-400 font-black rounded-2xl flex items-center justify-center gap-3 transition-all hover:text-slate-600 active:scale-95 uppercase tracking-widest text-[10px]"
                      >
                        <RotateCcw size={16} /> Reset
                      </button>
                    </div>

                    <div className="p-5 md:p-8 rounded-[32px] md:rounded-[40px] bg-slate-900/5 backdrop-blur-md border border-slate-200/50 relative overflow-hidden">
                      <div className="flex items-center gap-3 mb-3 md:mb-6 opacity-40">
                        <BookMarked size={14} className="text-slate-900" />
                        <h4 className="font-bold text-[8px] md:text-[9px] tracking-[0.3em] text-slate-900 uppercase">Biometric Summary</h4>
                      </div>
                      <p className="text-base md:text-lg font-bold leading-relaxed text-slate-700 italic">
                        "{analysis.stylistNote}"
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black tracking-[0.4em] uppercase text-slate-400">Perfect Archetypes</h3>
                        <div className="h-px bg-slate-100 flex-1 ml-6" />
                      </div>
                      <div className="grid grid-cols-1 gap-5">
                        {suggestions.hairstyles.map((style, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + (idx * 0.1) }}
                            className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 p-3 sm:p-5 rounded-[24px] sm:rounded-[32px] bg-white border border-slate-200 hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/5 transition-all group"
                          >
                            <div className="w-full sm:w-24 h-40 sm:h-24 rounded-[18px] sm:rounded-[24px] overflow-hidden shrink-0 border border-slate-100 shadow-inner">
                              <img src={style.image} alt={style.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                              <span className="text-[8px] md:text-[9px] font-black text-amber-500 tracking-[0.2em] uppercase mb-1 block">{style.archetype} Match</span>
                              <p className="text-lg md:text-xl font-black text-slate-900 mb-2 md:mb-4 tracking-tighter leading-none">{style.name}</p>
                              <button
                                onClick={() => navigate(`/all-services-search?q=${style.name}`)}
                                className="w-full sm:w-auto px-6 py-2 bg-slate-900 hover:bg-amber-500 text-white font-black text-[10px] tracking-widest uppercase rounded-xl transition-all shadow-lg shadow-slate-900/10 hover:shadow-amber-500/20 active:scale-95"
                              >
                                Reserve Style
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 py-16 md:py-24 bg-white border border-slate-100 rounded-[32px] md:rounded-[40px] shadow-sm">
                    <Scan size={48} className="text-slate-100 mb-6 md:mb-8" />
                    <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-slate-200 tracking-tight uppercase tracking-widest">Awaiting Analysis</h3>
                    <p className="text-slate-300 max-w-xs font-medium text-[8px] md:text-[10px] tracking-widest uppercase leading-relaxed opacity-60">Upload photo to proceed</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Why It Works Section (Premium Content Expansion) */}
        {/* Footer info - Minimalized */}
        {!analysis && !processing && (
          <div className="mt-12 md:mt-16 border-t border-slate-100 pt-10 md:pt-20 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16 max-w-6xl mx-auto w-full px-5 md:px-8 pb-16 md:pb-16">
            <div className="max-w-md text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2 md:mb-4">
                <ShieldCheck size={20} className="text-green-500" />
                <h4 className="font-black text-slate-900 uppercase text-[10px] md:text-xs tracking-[0.2em] md:tracking-[0.3em]">Privacy Guaranteed</h4>
              </div>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-medium">Your biometric data is processed in real-time within your browser. We never store, transmit, or monetize your facial geometry.</p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-6 md:gap-8 w-full md:w-auto">
              <div className="flex items-center gap-4">
                {[Scan, Stars, Fingerprint].map((Icon, i) => (
                  <div key={i} className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white border border-slate-100 text-slate-400 shadow-sm hover:text-amber-500 transition-colors">
                    <Icon size={20} className="md:size-6" />
                  </div>
                ))}
              </div>
              <Link to="/customer-account-creation" className="group flex items-center justify-between w-full md:w-auto px-6 md:px-8 py-3.5 md:py-5 bg-slate-900 text-white rounded-2xl md:rounded-3xl font-black text-[10px] md:text-xs tracking-widest uppercase hover:bg-black transition-all shadow-2xl shadow-slate-900/20">
                Join the Neural Grid
                <ChevronLeft size={16} className="rotate-180 ml-4 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceSuggestor;
