import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ChevronLeft, 
  Stars, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X,
  Camera,
  Loader2,
  Calendar,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const FaceSuggestor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const apiUrl = process.env.REACT_APP_API_URL || 'https://api.glosscut.com';
  
  // States
  const [image, setImage] = useState(null);
  const [processing, setProcessing] = useState(false);
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
      };
      reader.readAsDataURL(file);
    }
  };

  const getSuggestions = async () => {
    if (!image) {
      showAlert("Please upload a photo first.");
      return;
    }

    if (usesLeft <= 0) {
      showAlert("You have exhausted your free suggestions.", "error");
      return;
    }

    setProcessing(true);
    try {
      // Convert base64 to blob
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

      setSuggestions(response.data.suggestions);
      setUsesLeft(response.data.usesLeft);
      showAlert("Styles generated successfully!", "success");
    } catch (error) {
      console.error(error);
      showAlert(error.response?.data?.message || "Failed to process image.", "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] pt-24 pb-12 px-4 text-white">
      {/* Alert */}
      {alert && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[3000] w-full max-w-md p-4 rounded-2xl border backdrop-blur-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
          alert.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
          alert.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
          'bg-blue-500/10 border-blue-500/20 text-blue-400'
        }`}>
          {alert.type === 'error' ? <AlertTriangle size={20} /> : 
           alert.type === 'success' ? <CheckCircle size={20} /> : <Info size={20} />}
          <p className="flex-1 text-sm font-medium">{alert.message}</p>
          <button onClick={() => setAlert(null)}><X size={16} /></button>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Stars className="text-amber-500" /> AI Style Suggester
          </h1>
          <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full flex items-center gap-2 text-amber-500 font-bold text-sm">
            <Zap size={14} fill="currentColor" /> {usesLeft} Free Left
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-8 duration-700">
          <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight">Discover Your <span className="text-amber-500 underline decoration-amber-500/30 underline-offset-8">Perfect Look</span></h2>
          <p className="text-gray-400 max-w-xl mx-auto text-lg">
            Our AI analyzes your facial shape to suggest the most flattering haircuts and styles. Completely free for your first tries.
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 md:p-16 overflow-hidden relative backdrop-blur-3xl shadow-2xl">
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[120px] -z-10" />

          {image ? (
            <div className="relative max-w-sm mx-auto aspect-square rounded-[32px] overflow-hidden border-2 border-amber-500/30 group shadow-2xl">
              <img src={image} alt="User face" className="w-full h-full object-cover" />
              {processing && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <Loader2 size={56} className="animate-spin text-amber-500" />
                    <div className="absolute inset-0 blur-xl bg-amber-500/30 animate-pulse"></div>
                  </div>
                  <p className="font-black text-xl tracking-widest uppercase animate-pulse">Scanning...</p>
                </div>
              )}
              <button 
                onClick={() => {setImage(null); setSuggestions(null);}}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center max-w-sm mx-auto aspect-square border-2 border-dashed border-white/10 rounded-[32px] cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group relative overflow-hidden">
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/10">
                  <Camera size={44} className="text-amber-500" />
                </div>
                <p className="text-2xl font-black mb-2">Upload Face Photo</p>
                <p className="text-sm text-gray-500 font-medium">Clear front-facing photo works best</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </label>
          )}

          {image && !suggestions && !processing && (
            <div className="mt-12 flex justify-center">
              <button 
                onClick={getSuggestions}
                className="group px-16 py-5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl flex items-center gap-4 transition-all shadow-2xl shadow-amber-600/30 active:scale-95 text-lg"
              >
                <Stars size={24} className="group-hover:rotate-12 transition-transform" />
                Analyze My Face
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {suggestions && (
          <div className="mt-20 space-y-20 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="flex items-center gap-6">
              <h3 className="text-4xl font-black">AI Recommendations</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-amber-500 to-transparent opacity-30" />
            </div>

            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                   <Zap size={20} fill="currentColor" />
                </div>
                <p className="font-black tracking-widest text-amber-500 uppercase">Top Hairstyle Matches</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {suggestions.hairstyles.map((style, idx) => (
                  <div key={idx} className="bg-zinc-900 border border-white/5 rounded-[32px] overflow-hidden group hover:border-amber-500/40 transition-all duration-500 hover:-translate-y-2 shadow-xl">
                    <div className="aspect-[4/5] overflow-hidden relative">
                      <img src={style.image} alt={style.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                      
                      <button 
                        onClick={() => navigate(`/all-services-search?q=${style.name}`)}
                        className="absolute bottom-6 left-6 right-6 bg-white text-black py-4 rounded-2xl font-black text-sm opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 shadow-2xl active:scale-95"
                      >
                         <Calendar size={18} /> Book This Look
                      </button>
                    </div>
                    <div className="p-6">
                      <p className="font-black text-xl text-white group-hover:text-amber-500 transition-colors uppercase tracking-tight">{style.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-white/10 rounded-[40px] p-10 md:p-16 relative overflow-hidden backdrop-blur-xl">
               <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px]" />
               
               <div className="relative z-10">
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                    <Zap size={20} fill="currentColor" />
                  </div>
                  <p className="font-black tracking-widest text-amber-500 uppercase">Best Beard Styles for You</p>
                </div>

                <div className="flex flex-wrap gap-4">
                  {suggestions.beards.map((beard, idx) => (
                    <span key={idx} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-base hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all cursor-default shadow-lg uppercase tracking-tight">
                      {beard}
                    </span>
                  ))}
                </div>
               </div>
            </div>

            <div className="flex flex-col items-center gap-6 pt-8 pb-12">
              <button 
                onClick={() => {setImage(null); setSuggestions(null);}}
                className="group flex items-center gap-2 text-zinc-500 hover:text-white font-black transition-all text-sm uppercase tracking-widest"
              >
                <X size={16} className="group-hover:rotate-90 transition-transform" />
                Try Another Photo
              </button>
              <div className="w-20 h-1 bg-amber-500/20 rounded-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceSuggestor;
