import React from 'react';
import { Link } from 'react-router-dom';
import {
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  MapPin,
  Feather,
  Compass,
  Scroll,
  ArrowRight,
  Ship,
  Skull,
  Anchor,
  X
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <style>{`
        /* --- FONTS --- */
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Nothing+You+Could+Do&display=swap');

        /* --- BASE TEXTURE --- */
        .ancient-canvas-bg {
          background-color: #cba785;
          background-image: 
            url("https://www.transparenttextures.com/patterns/aged-paper.png"),
            radial-gradient(ellipse at 20% 30%, rgba(40, 20, 10, 0.5) 0%, transparent 40%),
            radial-gradient(circle at 80% 80%, rgba(40, 20, 10, 0.6) 0%, transparent 30%);
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 0 100px rgba(20, 10, 5, 0.9);
        }

        /* --- ATMOSPHERIC ANIMATIONS --- */
        @keyframes fog-flow {
          0% { background-position: 0% 0%; opacity: 0.3; }
          50% { opacity: 0.5; }
          100% { background-position: 200% 0%; opacity: 0.3; }
        }
        .fog-layer {
          position: absolute; inset: 0;
          background: url('https://raw.githubusercontent.com/s1mpson/css-fog-animation/master/img/fog1.png') repeat-x;
          background-size: 200% 100%;
          animation: fog-flow 60s linear infinite;
          z-index: 1; pointer-events: none; mix-blend-mode: overlay;
        }

        @keyframes mote-float {
            0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
            20% { opacity: 0.8; }
            80% { opacity: 0.8; }
            100% { transform: translateY(-120px) translateX(30px); opacity: 0; }
        }
        .dust-mote {
            position: absolute; width: 3px; height: 3px; background: #fff8dc; border-radius: 50%;
            filter: blur(1px); opacity: 0; z-index: 2; pointer-events: none;
            box-shadow: 0 0 4px #fff8dc;
        }

        @keyframes realistic-flicker {
          0%   { opacity: 0.4; transform: scale(1); }
          10%  { opacity: 0.32; transform: scale(0.98); }
          20%  { opacity: 0.45; transform: scale(1.01); }
          30%  { opacity: 0.28; transform: scale(0.96); }
          40%  { opacity: 0.4; transform: scale(1.02); }
          50%  { opacity: 0.3; transform: scale(0.99); }
          60%  { opacity: 0.5; transform: scale(1.03); }
          70%  { opacity: 0.35; transform: scale(0.97); }
          80%  { opacity: 0.55; transform: scale(1.04); }
          90%  { opacity: 0.3; transform: scale(0.95); }
          100% { opacity: 0.4; transform: scale(1); }
        }
        .lantern-glow {
            background: radial-gradient(circle at center, rgba(255, 180, 120, 0.7) 0%, transparent 65%);
            border-radius: 50%; filter: blur(35px);
            position: absolute; inset: -50px; z-index: -1;
            opacity: 0.4;
            animation: realistic-flicker 4s linear infinite;
        }

        /* --- INTERACTION ANIMATIONS --- */
        .ship-anim { animation: float-ship 6s ease-in-out infinite; }
        @keyframes float-ship { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-10px) rotate(3deg); } }

        @keyframes compass-drift {
            0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(5deg); } 75% { transform: rotate(-5deg); }
        }
        .compass-idle { animation: compass-drift 10s ease-in-out infinite; }
        .group:hover .compass-idle { animation: none; }
        
        @keyframes compass-spin-crazy {
           0% { transform: rotate(0deg); } 20% { transform: rotate(180deg); } 40% { transform: rotate(-45deg); } 100% { transform: rotate(0deg); }
        }
        .group:hover .compass-spin { animation: compass-spin-crazy 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); color: #8b0000; }

        @keyframes coin-shine-sweep {
            0% { left: -100%; opacity: 0; } 50% { opacity: 0.6; } 100% { left: 200%; opacity: 0; }
        }
        .coin-shine-layer {
             content: ''; position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
             background: linear-gradient(to right, transparent, rgba(255,255,255,0.7), transparent);
             transform: skewX(-25deg); pointer-events: none; z-index: 20;
        }
        .coin-wrapper:hover .coin-shine-layer { animation: coin-shine-sweep 0.6s ease-out; }
        .coin-3d { transition: transform 0.6s; transform-style: preserve-3d; }
        .coin-wrapper:hover .coin-3d { transform: rotateY(180deg); }

        @keyframes fade-up-enter {
            from { opacity: 0; transform: translateY(30px); filter: blur(2px); }
            to   { opacity: 1; transform: translateY(0); filter: blur(0px); }
        }
        .enter-anim { opacity: 0; animation: fade-up-enter 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-500 { animation-delay: 0.5s; }

        /* --- STYLING --- */
        .canvas-patch { position: relative; }
        .canvas-patch::after {
            content: ''; position: absolute; top: -15px; left: -15px; right: -15px; bottom: -15px;
            background-color: #bda080; background-image: url("https://www.transparenttextures.com/patterns/aged-paper.png");
            border: 3px dashed #4e342e; transform: rotate(-1deg); z-index: -1;
            box-shadow: 5px 5px 15px rgba(0,0,0,0.3); opacity: 0.95; border-radius: 4px;
        }
        @media (min-width: 768px) { .canvas-patch::after { top: -20px; left: -30px; right: auto; bottom: auto; width: 110%; height: 120%; transform: rotate(-2deg); } }

        .font-map-title { font-family: 'Cinzel Decorative', serif; letter-spacing: 1px; color: #1a0f0a; }
        .font-map-text { font-family: 'Crimson Text', serif; color: #1a0f0a; }
        .font-handwritten { font-family: 'Nothing You Could Do', cursive; color: #1a0f0a; }

        .ink-underline::after {
          content: ''; position: absolute; bottom: -2px; left: 0; width: 0%; height: 3px;
          background: #8b0000; transition: width 0.5s ease-out; opacity: 0.8;
        }
        .group:hover .ink-underline::after { width: 100%; }

        .grid-overlay {
          background-image: linear-gradient(rgba(60, 40, 30, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(60, 40, 30, 0.07) 1px, transparent 1px);
          background-size: 60px 60px; position: absolute; inset: 0; pointer-events: none; opacity: 0.5; z-index: 0; mix-blend-mode: multiply;
        }
        .signature-ink { text-shadow: 1px 1px 2px rgba(0,0,0,0.2); }
      `}</style>

      {/* FOOTER CONTAINER: Reduced padding for mobile (pt-8 pb-6) */}
      <footer className="w-full relative ancient-canvas-bg pt-8 pb-6 md:pt-24 md:pb-16 text-[#1a0f0a] overflow-hidden">
        
        {/* --- ATMOSPHERE LAYERS --- */}
        <div className="fog-layer"></div>
        {[...Array(6)].map((_, i) => (
            <div key={i} className="dust-mote" style={{
                left: `${Math.random() * 100}%`, 
                top: `${40 + Math.random() * 60}%`, 
                animation: `mote-float ${4 + Math.random() * 5}s infinite linear ${Math.random() * 2}s`
            }}></div>
        ))}

        {/* BACKGROUND SVG */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
          <svg className="w-full h-full" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice">
            <g opacity="0.5">
                <path d="M0,0 L100,20 L120,5 L200,10 L300,0 Z" fill="#2a1a10" />
                <path d="M1440,800 L1300,750 L1200,740 L1440,700 Z" fill="#2a1a10" />
            </g>
            <path d="M-50,200 Q100,150 200,300 T400,250 T600,400 T300,600 T-50,600 Z" fill="none" stroke="#8d6e63" strokeWidth="2" strokeDasharray="5,5" />
          </svg>
        </div>
        <div className="grid-overlay"></div>

        {/* --- CONTENT --- */}
        <div className="relative z-20 max-w-7xl mx-auto px-6">
          
          {/* Main Grid: Reduced gap (gap-6) and margin (mb-6) for mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 pb-6 md:gap-10 md:mb-12 md:pb-12 border-b-2 border-[#5d4037]/30 border-dashed">
            
            {/* BRANDING */}
            <div className="lg:col-span-5 space-y-4 md:space-y-6 group canvas-patch p-4 md:p-6 rounded-sm flex flex-col items-center lg:block text-center lg:text-left enter-anim">
               <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 select-none w-fit cursor-default relative z-10">
                  <div className="w-20 h-20 md:w-24 md:h-24 relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-[#3e2723] rounded-full opacity-10 blur-xl group-hover:opacity-20 group-hover:scale-125 transition-all duration-700"></div>
                      <Ship size={56} className="md:w-[64px] md:h-[64px] text-[#1a0f0a] ship-anim relative z-10 drop-shadow-md" />
                  </div>
                  <div className="flex flex-col items-center lg:items-start">
                    <h3 className="text-4xl md:text-6xl font-map-title font-black uppercase leading-none text-[#1a0f0a] group-hover:text-[#8b0000] transition-colors duration-500 drop-shadow-sm">
                      GlossCut
                    </h3>
                    <div className="flex items-center gap-2 md:gap-3 mt-2">
                       <Anchor size={12} className="md:w-[14px] md:h-[14px] text-[#5d4037]" />
                       <span className="font-typewriter text-[10px] md:text-xs font-bold text-[#5d4037] tracking-[0.2em] md:tracking-[0.25em]">
                         EST. {currentYear} • PORT 884
                       </span>
                    </div>
                  </div>
               </div>
               
               <div className="relative z-10 max-w-md mx-auto lg:mx-0 lg:pl-6 lg:border-l-4 border-[#8b4513] border-double">
                 <p className="font-map-text text-lg md:text-2xl italic leading-relaxed font-bold text-[#2a1a10]">
                   "Your chart to the finest grooming artisans across the seven seas."
                 </p>
               </div>
               
               <div className="flex gap-4 md:gap-5 pt-2 md:pt-4 relative z-10 justify-center lg:justify-start w-full">
                  <MapCoin icon={Facebook} />
                  <MapCoin icon={Instagram} />
                  <MapCoin icon={Twitter} />
               </div>
            </div>

            {/* NAVIGATION (Hidden Mobile) */}
            <div className="hidden md:block lg:col-span-3 lg:col-start-7 pt-2 group relative enter-anim delay-200">
              <div className="lantern-glow"></div>
              <SectionHeader icon={Scroll} title="The Chart" />
              <ul className="space-y-4 relative z-10">
                  <MapLink to="/all-services-search" label="Search Registry" distance="50 NM" />
                  <MapLink to="/customer-account-creation" label="Join Crew" distance="120 NM" />
                  <MapLink to="/barber-account-creation" label="Artisan Guild" distance="80 NM" />
                  <MapLink to="/login" label="Captain's Log" distance="0 NM" />
              </ul>
            </div>

            {/* CONTACT */}
            <div className="lg:col-span-3 pt-0 md:pt-2 group relative text-center lg:text-left flex flex-col items-center lg:items-start enter-anim delay-300">
              <div className="lantern-glow"></div>
               <SectionHeader icon={Compass} title="Signal" iconClass="compass-spin compass-idle" />
               <ul className="space-y-3 md:space-y-6 font-typewriter text-xs md:text-sm text-[#1a0f0a] font-bold relative z-10 w-full max-w-[200px] md:max-w-none">
                <ContactRow icon={Mail} text="post@glosscut.com" />
                <ContactRow icon={Phone} text="+1 (555) 808-2077" />
                <ContactRow icon={MapPin} text="Sector 7, Old Port" subtext="44.5°N, 73.2°W" />
              </ul>
            </div>
          </div>

          {/* --- BOTTOM ROW --- */}
          {/* Reduced gap (gap-4) for mobile */}
          <div className="flex flex-col-reverse md:flex-row justify-between items-center md:items-end gap-4 md:gap-12 relative pt-0 md:pt-4 enter-anim delay-500">
              
             {/* LEGAL */}
             <div className="flex flex-col gap-2 md:gap-4 relative z-10 items-center md:items-start text-center md:text-left pb-2 md:pb-0">
                <div className="flex items-center gap-2 font-typewriter text-[10px] md:text-xs text-[#5d4037] font-bold opacity-80">
                   <Skull size={12} className="md:w-[14px] md:h-[14px] hover:text-[#8b0000] transition-colors cursor-pointer hover:animate-spin" />
                   <span>© {currentYear} GlossCut Archives.</span>
                </div>
                <div className="flex gap-6 md:gap-8 font-map-text italic text-base md:text-lg text-[#1a0f0a] font-bold">
                   <Link to="/privacy" className="hover:text-[#8b0000] hover:skew-x-6 transition-all decoration-dotted underline underline-offset-4 decoration-[#5d4037]/40">Privacy</Link>
                   <Link to="/terms" className="hover:text-[#8b0000] hover:skew-x-6 transition-all decoration-dotted underline underline-offset-4 decoration-[#5d4037]/40">Terms</Link>
                </div>
             </div>

             {/* SIGNATURE - SMALLER ON MOBILE */}
             <a 
               href="https://github.com/ompatil" 
               target="_blank" 
               rel="noopener noreferrer" 
               className="hover-quill group relative z-10 w-full md:w-auto mt-[-5px] md:mt-0"
             >
                <div className="flex flex-col items-center md:items-end md:text-right relative">
                   
                   <p className="font-typewriter text-[9px] md:text-[11px] uppercase text-[#5d4037] mb-0 tracking-widest font-bold opacity-80">
                     Map Drawn By:
                   </p>
                   
                   <div className="flex items-center justify-center md:justify-end gap-2 relative">
                      <div className="md:hidden absolute inset-0 bg-[#8b0000] opacity-[0.03] rounded-full blur-xl transform scale-150"></div>
                      
                      {/* Name resized to 2.2rem for mobile */}
                      <p className="font-handwritten signature-ink text-[2.2rem] md:text-[3.5rem] leading-none text-[#1a0f0a] transform -rotate-2 group-hover:scale-110 group-hover:rotate-0 group-hover:text-[#8b0000] transition-all duration-500 select-none relative z-10 pt-1">
                          Om Patil
                      </p>
                      {/* Icon resized to 18px for mobile */}
                      <Feather size={18} className="md:w-8 md:h-8 quill-icon text-[#5d4037] mb-2 md:mb-4 relative z-10" />
                   </div>
                </div>
             </a>
          </div>
        </div>
      </footer>
    </>
  );
};

// --- SUB COMPONENTS ---

const SectionHeader = ({ icon: Icon, title, iconClass = '' }) => (
  <h4 className="font-map-title font-bold uppercase mb-4 md:mb-8 border-b-4 border-[#5d4037] w-fit pb-2 flex items-center gap-3 text-[#1a0f0a] text-xl md:text-2xl tracking-[0.15em] select-none shadow-[0_1px_0_rgba(255,255,255,0.2)]">
     <Icon size={24} className={`text-[#8b0000] drop-shadow-sm ${iconClass}`} /> {title}
  </h4>
);

const MapLink = ({ to, label, distance }) => (
   <li className="group/link flex items-center justify-between border-b border-[#5d4037]/20 hover:border-[#8b0000] hover:bg-[#eaddcf]/40 rounded-lg px-2 py-1.5 transition-all cursor-pointer">
      <Link to={to} className="flex items-center gap-3 transition-all duration-300 text-[#1a0f0a]">
         <div className="relative w-5 h-5 flex items-center justify-center">
            <ArrowRight size={16} className="absolute opacity-100 group-hover/link:opacity-0 transition-all duration-300 text-[#5d4037]" />
            <X size={18} className="absolute opacity-0 scale-0 group-hover/link:opacity-100 group-hover/link:scale-110 rotate-90 group-hover/link:rotate-0 transition-all duration-300 text-[#8b0000]" />
         </div>
         <span className="font-map-text text-lg font-bold ink-underline">{label}</span>
      </Link>
      <span className="font-typewriter text-xs text-[#5d4037] group-hover/link:text-[#8b0000] font-bold bg-[#f5deb3]/50 px-1 rounded">{distance}</span>
   </li>
);

const ContactRow = ({ icon: Icon, text, subtext }) => (
  <li className="flex items-start gap-4 group/contact hover:translate-x-2 transition-transform duration-300 p-1 rounded-md hover:bg-[#eaddcf]/30 w-full justify-center md:justify-start text-left">
     <div className="mt-0.5 text-[#5d4037] group-hover/contact:text-[#eaddcf] group-hover/contact:bg-[#8b0000] transition-colors p-1.5 border-2 border-[#5d4037] group-hover/contact:border-[#8b0000] rounded bg-[#eaddcf] shadow-sm shrink-0">
        <Icon size={16} />
     </div>
     <div className="flex flex-col">
        <span className="font-bold text-base md:text-lg text-[#1a0f0a] group-hover/contact:text-[#8b0000] transition-colors leading-tight break-all md:break-normal">{text}</span>
        {subtext && <span className="text-[10px] md:text-[11px] text-[#5d4037] font-serif-old italic font-semibold">{subtext}</span>}
     </div>
  </li>
);

const MapCoin = ({ icon: Icon }) => (
   <a href="#" className="coin-wrapper w-10 h-10 md:w-14 md:h-14 rounded-full border-[3px] border-[#5d4037] flex items-center justify-center bg-[#eaddcf] text-[#5d4037] shadow-[0_4px_0_#3e2723,0_8px_8px_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-[5px] hover:text-[#8b0000] hover:border-[#8b0000] transition-all duration-150 group relative z-10 overflow-hidden">
      <div className="coin-shine-layer"></div>
      <div className="coin-3d relative z-10">
         <Icon size={18} className="md:w-6 md:h-6" />
      </div>
   </a>
);

export default Footer;