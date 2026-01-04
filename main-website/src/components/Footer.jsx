import React from 'react';
import { Link } from 'react-router-dom';
import {
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Terminal,
  Wifi,
  BatteryCharging,
  Disc
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=VT323&display=swap');

        :root {
          --neon-cyan: #00f3ff;
          --neon-pink: #ff00ff;
          --neon-green: #0aff0a;
          --deep-bg: #050508;
          --grid-color: rgba(0, 243, 255, 0.1);
        }

        /* --- 1. CRT MONITOR EFFECTS --- */
        .monitor-screen {
          background-color: var(--deep-bg);
          background-image: 
            radial-gradient(circle, rgba(10, 20, 30, 0) 60%, rgba(0, 0, 0, 0.6) 100%),
            linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
          background-size: 100% 100%, 100% 4px;
          box-shadow: inset 0 0 50px rgba(0,0,0,0.7);
          position: relative;
          overflow: hidden;
        }
        
        @keyframes monitor-flicker {
          0% { opacity: 0.98; }
          5% { opacity: 0.95; }
          10% { opacity: 0.98; }
          100% { opacity: 0.98; }
        }
        .screen-content {
          animation: monitor-flicker 0.15s infinite;
        }

        /* --- 2. MOVING PERSPECTIVE GRID --- */
        @keyframes plane-move {
          0% { background-position: 0 0; }
          100% { background-position: 0 40px; }
        }
        .retro-plane {
          position: absolute;
          bottom: -50%;
          left: -50%;
          width: 200%;
          height: 100%;
          background-image: 
            linear-gradient(var(--grid-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
          background-size: 40px 40px;
          transform: perspective(500px) rotateX(60deg);
          animation: plane-move 2s linear infinite;
          opacity: 0.3;
          mask-image: linear-gradient(to top, black, transparent);
          pointer-events: none;
          z-index: 0;
        }

        /* --- 3. RGB SPLIT (GLITCH) --- */
        .rgb-glitch {
          position: relative;
          mix-blend-mode: screen;
        }
        .rgb-glitch:hover {
          animation: glitch-anim 0.3s cubic-bezier(.25, .46, .45, .94) both infinite;
          color: var(--neon-pink);
        }
        @keyframes glitch-anim {
          0% { transform: translate(0); text-shadow: -2px 0 var(--neon-cyan); }
          20% { transform: translate(-2px, 2px); text-shadow: 2px 0 var(--neon-cyan); }
          40% { transform: translate(-2px, -2px); text-shadow: -2px 0 var(--neon-cyan); }
          60% { transform: translate(2px, 2px); text-shadow: 2px 0 var(--neon-cyan); }
          80% { transform: translate(2px, -2px); text-shadow: -2px 0 var(--neon-cyan); }
          100% { transform: translate(0); text-shadow: -2px 0 var(--neon-cyan); }
        }

        /* --- 4. SCANLINE BAR --- */
        @keyframes scanline {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        .scan-bar {
          width: 100%;
          height: 10px;
          background: linear-gradient(to bottom, transparent, rgba(0, 243, 255, 0.4), transparent);
          position: absolute;
          z-index: 20;
          opacity: 0.3;
          animation: scanline 6s linear infinite;
          pointer-events: none;
        }

        /* --- 5. UTILITIES --- */
        .font-tech { font-family: 'Share Tech Mono', monospace; }
        .font-dos { font-family: 'VT323', monospace; }

        .key-shadow {
           box-shadow: 3px 3px 0 #333;
           transition: all 0.1s;
        }
        .key-shadow:active {
           box-shadow: 0px 0px 0 #333;
           transform: translate(3px, 3px);
        }
      `}</style>

      {/* FOOTER CONTAINER */}
      {/* Reduced horizontal padding on mobile (px-2) to allow max screen usage */}
      <footer className="w-full flex justify-center pb-4 pt-8 px-2 md:pb-8 md:pt-12 md:px-6 bg-[#000] overflow-hidden">
        
        {/* THE "DEVICE" FRAME */}
        <div className="w-full max-w-[85rem] relative z-10 bg-[#1a1a1a] p-1 rounded-lg shadow-[0_0_20px_rgba(0,243,255,0.05)] md:shadow-[0_0_40px_rgba(0,243,255,0.1)] border border-[#333]">
          
          {/* DECORATIVE TOP BOLTS - Hidden on mobile to save space, visible on MD+ */}
          <div className="hidden md:flex justify-between px-4 py-1">
             <div className="w-2 h-2 rounded-full bg-[#333] shadow-[inset_0_0_2px_black]"></div>
             <div className="w-2 h-2 rounded-full bg-[#333] shadow-[inset_0_0_2px_black]"></div>
          </div>

          {/* INNER SCREEN */}
          {/* Removed fixed min-h-500px, changed to min-h-auto for mobile so it doesn't leave huge empty space */}
          <div className="monitor-screen rounded border-2 border-[#444] relative min-h-auto md:min-h-[500px]">
            
            {/* Visual Effects Layers */}
            <div className="scan-bar"></div>
            <div className="retro-plane"></div>
            
            {/* MAIN CONTENT WRAPPER */}
            {/* Reduced padding from p-6 to p-5 on mobile. */}
            <div className="screen-content relative z-20 p-5 md:p-10 lg:p-12 h-full flex flex-col justify-between">
              
              {/* TOP HEADER ROW */}
              <div className="flex flex-col md:flex-row justify-between items-start border-b border-[#333] pb-6 mb-8 gap-4">
                <div className="flex flex-col gap-1 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-tech text-[#00f3ff] text-[10px] md:text-xs tracking-widest uppercase">System Online</span>
                  </div>
                  {/* Scaled text down for mobile (text-3xl) */}
                  <h2 className="font-dos text-3xl md:text-4xl text-white uppercase tracking-wider rgb-glitch w-fit cursor-default">
                    GlossCut<span className="text-[#00f3ff]">_OS</span>
                  </h2>
                </div>
                
                {/* Stats row - visible on mobile now but stacked horizontally */}
                <div className="flex w-full md:w-auto justify-between md:justify-end gap-4 font-tech text-xs text-gray-500">
                  <div className="flex items-center gap-2 md:block">
                    <span className="text-[#ff00ff] md:block mr-1 md:mr-0">SERVER:</span>
                    US-EAST-1
                  </div>
                  <div className="flex items-center gap-2 md:block">
                    <span className="text-[#0aff0a] md:block mr-1 md:mr-0">UPTIME:</span>
                    99.9%
                  </div>
                </div>
              </div>

              {/* GRID COLUMNS */}
              {/* Gap reduced to 8 on mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-10 mb-8 md:mb-12">
                
                {/* 1. BRAND IDENTITY */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="bg-[#000]/50 border border-[#333] p-4 backdrop-blur-sm max-w-full md:max-w-sm">
                    <p className="font-tech text-gray-300 text-sm leading-relaxed">
                      <span className="text-[#0aff0a] mr-2">{'>'}</span> 
                      Initializing premium grooming protocols. Connecting clients to elite artisans.
                    </p>
                  </div>

                  {/* KEYBOARD STYLE ICONS */}
                  <div className="flex gap-4">
                    <KeyButton icon={Facebook} label="F1" />
                    <KeyButton icon={Instagram} label="F2" />
                    <KeyButton icon={Twitter} label="F3" />
                  </div>
                </div>

                {/* 2. NAVIGATION LINKS */}
                <div className="lg:col-span-3">
                  <Header label="Directory" color="#00f3ff" />
                  <ul className="space-y-3 font-dos text-xl">
                    <TermLink to="/" label="Home_Base" index="01" />
                    <TermLink to="/all-services-search" label="Search_Query" index="02" />
                    <TermLink to="/customer-account-creation" label="User_Reg" index="03" />
                    <TermLink to="/barber-account-creation" label="Artisan_Log" index="04" />
                  </ul>
                </div>

                {/* 3. LEGAL LINKS */}
                <div className="lg:col-span-2">
                  <Header label="Protocols" color="#ff00ff" />
                  <ul className="space-y-3 font-dos text-xl text-gray-400">
                    <LegalLink label="Privacy.txt" />
                    <LegalLink label="Terms.doc" />
                    <LegalLink label="Cookies.bat" />
                  </ul>
                </div>

                {/* 4. DATA/CONTACT */}
                <div className="lg:col-span-3">
                   <Header label="Uplink" color="#0aff0a" />
                   <div className="bg-[#0a0a0a] border border-[#333] p-4 font-tech text-sm space-y-4 shadow-inner">
                      <DataRow icon={Mail} value="help@glosscut.com" />
                      <DataRow icon={Phone} value="800-555-CUTS" />
                      <DataRow icon={MapPin} value="Neo-Tokyo, Sec 7" />
                   </div>
                </div>
              </div>

              {/* BOTTOM STATUS BAR */}
              <div className="mt-auto pt-6 border-t border-[#333] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 font-tech text-xs text-gray-500 uppercase">
                
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 w-full md:w-auto">
                  <span>© {currentYear} GLOSSCUT SYSTEMS</span>
                  <span className="hidden md:inline-block">|</span>
                  <div className="flex justify-between md:justify-start w-full md:w-auto gap-4">
                    <span className="flex items-center gap-2">
                        <BatteryCharging size={14} className="text-[#0aff0a]" /> 
                        PWR: 100%
                    </span>
                    <span className="flex items-center gap-2">
                        <Wifi size={14} className="text-[#00f3ff]" /> 
                        NET: SECURE
                    </span>
                  </div>
                </div>

                <a 
                  href="https://github.com/ompatil" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 hover:text-[#00f3ff] transition-colors mt-2 md:mt-0"
                >
                  <Terminal size={14} />
                  <span>Coded by Om B. Patil</span>
                  <ExternalLink size={12} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                </a>

              </div>

            </div>
          </div>
          
           {/* DECORATIVE BOTTOM BOLTS - Hidden on mobile */}
           <div className="hidden md:flex justify-between px-4 py-1">
             <div className="w-2 h-2 rounded-full bg-[#333] shadow-[inset_0_0_2px_black]"></div>
             <div className="w-2 h-2 rounded-full bg-[#333] shadow-[inset_0_0_2px_black]"></div>
          </div>

        </div>
      </footer>
    </>
  );
};

// --- RETRO COMPONENTS ---

/* 1. Header with Glitch Line */
const Header = ({ label, color }) => (
  <div className="mb-4">
    <h4 className="font-tech text-sm font-bold uppercase tracking-widest mb-1" style={{ color: color }}>
      {label}
    </h4>
    <div className="w-full h-[1px] bg-[#333] relative overflow-hidden">
      <div className="absolute top-0 left-0 h-full w-1/3 bg-current animate-[loading_2s_ease-in-out_infinite]" style={{ backgroundColor: color }}></div>
    </div>
    <style>{`@keyframes loading { 0% { left: -50%; } 100% { left: 150%; } }`}</style>
  </div>
);

/* 2. Terminal Link - Added py-1 for better touch targets */
const TermLink = ({ to, label, index }) => (
  <li className="py-1">
    <Link to={to} className="group flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
      <span className="text-[#333] font-tech text-xs group-hover:text-[#00f3ff] transition-colors">{index}</span>
      <span className="relative">
        <span className="absolute -left-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#00f3ff]">{'>'}</span>
        <span className="group-hover:translate-x-1 transition-transform inline-block group-hover:text-shadow-cyan">{label}</span>
      </span>
    </Link>
  </li>
);

/* 3. Keycap Buttons - No change needed, flex container handles them */
const KeyButton = ({ icon: Icon, label }) => (
  <button className="flex flex-col items-center gap-1 group">
    <div className="w-12 h-10 bg-[#222] border-t border-l border-[#444] border-r border-b border-[#111] rounded flex items-center justify-center key-shadow active:translate-y-1">
      <Icon size={18} className="text-gray-400 group-hover:text-[#ff00ff] transition-colors" />
    </div>
    <span className="font-tech text-[10px] text-[#444] group-hover:text-[#ff00ff]">{label}</span>
  </button>
);

/* 4. Legal Link - Added py-1 for touch targets */
const LegalLink = ({ label }) => (
  <li className="hover:text-[#ff00ff] cursor-pointer transition-colors flex items-center gap-2 group py-1">
    <Disc size={12} className="group-hover:animate-spin" />
    <span className="border-b border-transparent group-hover:border-[#ff00ff] border-dashed">{label}</span>
  </li>
);

/* 5. Data Display Row */
const DataRow = ({ icon: Icon, value }) => (
  <div className="flex items-center gap-3 text-gray-500 hover:text-[#0aff0a] transition-colors cursor-default">
    <Icon size={14} className="shrink-0" />
    <span className="tracking-tight break-all">{value}</span>
  </div>
);

export default Footer;