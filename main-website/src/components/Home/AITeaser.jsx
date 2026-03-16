import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Camera, ArrowRight, Stars } from 'lucide-react';

const AITeaser = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="bg-gradient-to-br from-black to-zinc-900 rounded-[48px] p-8 md:p-16 flex flex-col lg:flex-row items-center gap-12 border border-white/5 shadow-2xl overflow-hidden relative group">
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-[100px] -z-10 group-hover:bg-amber-600/20 transition-all duration-700" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/5 rounded-full blur-[100px] -z-10" />

          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-600/10 border border-amber-600/20 text-amber-500 text-xs font-black tracking-widest uppercase mb-6">
              <Sparkles size={14} /> NEW: AI STYLE SUGGESTOR
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1]">
              Stop Guessing. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-300">Start Knowing.</span>
            </h2>
            <p className="text-zinc-400 text-lg md:text-xl mb-10 max-w-xl pr-4">
              Our advanced AI analyzes your facial structure to recommend the most flattering haircuts and beard styles. Try it now for free!
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link 
                to="/face-ai" 
                className="group/btn relative px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl flex items-center gap-3 transition-all shadow-xl shadow-amber-600/20 active:scale-95"
              >
                <Camera size={20} />
                Try Face AI
                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
              </Link>
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-black bg-amber-600 flex items-center justify-center text-[10px] font-black text-white">
                  +1k
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual (Abstract Mockup) */}
          <div className="flex-1 w-full max-w-sm lg:max-w-none relative">
            <div className="relative aspect-square md:aspect-[4/3] rounded-[32px] overflow-hidden border border-white/10 bg-zinc-800/50 backdrop-blur-3xl group-hover:border-amber-500/30 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-600/5 to-transparent" />
              
              {/* Animated Scan Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent blur-sm animate-scan z-20" />
              
              {/* Style Cards Floating */}
              <div className="absolute inset-0 p-6 flex flex-col justify-center gap-4">
                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 animate-float">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Stars className="text-amber-500" size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-500">OPTIMAL MATCH</p>
                    <p className="text-sm font-black text-white">Classic Taper Fade</p>
                  </div>
                </div>
                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 translate-x-12 animate-float-delayed">
                   <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Sparkles className="text-purple-500" size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-purple-500">MODERN TREND</p>
                    <p className="text-sm font-black text-white">Texture Fringe</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AITeaser;
