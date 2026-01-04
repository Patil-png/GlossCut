import React from 'react';
import { Link } from 'react-router-dom';
import {
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  MapPin,
  Zap,
  Code,
  ExternalLink,
  Activity,
  Cpu,
  ArrowRight
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <style>{`
        /* --- 1. KINETIC GRID --- */
        @keyframes grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        .cyber-grid-animated {
          background-size: 40px 40px;
          background-image: 
            linear-gradient(to right, rgba(230, 150, 53, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(230, 150, 53, 0.05) 1px, transparent 1px);
          position: absolute;
          inset: 0;
          z-index: 0;
          mask-image: radial-gradient(circle at center, black 40%, transparent 95%);
          animation: grid-move 4s linear infinite;
        }

        /* --- 2. MOVING CONIC BORDER --- */
        @keyframes border-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .conic-border {
          position: absolute;
          inset: -200%;
          background: conic-gradient(
            from 90deg at 50% 50%,
            #000000 0%,
            #333333 40%,
            #e69635 50%,
            #0affd9 60%,
            #333333 70%,
            #000000 100%
          );
          animation: border-spin 6s linear infinite;
          opacity: 0.5;
        }

        /* --- 3. FILM GRAIN --- */
        .noise-overlay {
          position: absolute;
          inset: 0;
          opacity: 0.03;
          pointer-events: none;
          z-index: 2;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        /* --- 4. SCANLINE --- */
        @keyframes scanline-drop {
          0% { top: -10%; opacity: 0; }
          50% { opacity: 0.5; }
          100% { top: 110%; opacity: 0; }
        }
        .scanline {
          position: absolute;
          left: 0;
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, #0affd9, transparent);
          opacity: 0.3;
          animation: scanline-drop 5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          box-shadow: 0 0 10px rgba(10, 255, 217, 0.3);
          z-index: 5;
        }

        /* --- 5. ORBS --- */
        @keyframes float-pulse {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.05; }
          50% { transform: translate(20px, -20px) scale(1.1); opacity: 0.08; }
        }
        .ambient-orb {
          animation: float-pulse 8s ease-in-out infinite;
        }

        /* --- 6. SHIMMER TEXT --- */
        @keyframes text-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #fff 0%, #fff 40%, #e69635 50%, #fff 60%, #fff 100%);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: text-shimmer 4s linear infinite;
        }

        /* --- 7. NEW: SOCIAL ICON HOVER GLOW --- */
        .social-glow-bg {
          background: radial-gradient(circle at center, rgba(10, 255, 217, 0.15) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .group:hover .social-glow-bg {
          opacity: 1;
        }
      `}</style>

      {/* FOOTER ROOT */}
      <footer className="w-full flex justify-center pb-6 pt-10 px-4 md:px-6 bg-[#000]">
        
        {/* Main Card */}
        <div className="w-full max-w-[85rem] relative rounded-3xl overflow-hidden group/container">
          
          {/* Border Animation */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-3xl">
             <div className="conic-border"></div>
          </div>
          
          {/* Inner Background */}
          <div className="absolute inset-[1px] bg-[#050505] rounded-[23px] z-0"></div>

          {/* Content */}
          <div className="relative w-full h-full rounded-[23px] overflow-hidden z-10">
            
            {/* Background Effects */}
            <div className="cyber-grid-animated"></div>
            <div className="noise-overlay"></div>
            <div className="ambient-orb absolute top-0 left-1/4 w-96 h-96 bg-[#e69635] rounded-full mix-blend-screen filter blur-[120px] pointer-events-none"></div>
            <div className="ambient-orb absolute bottom-0 right-1/4 w-96 h-96 bg-[#0affd9] rounded-full mix-blend-screen filter blur-[120px] pointer-events-none" style={{ animationDelay: '-4s' }}></div>
            <div className="scanline pointer-events-none"></div>
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#e69635]/30 to-transparent z-20"></div>

            {/* Content Padding */}
            <div className="relative z-10 px-5 py-8 md:px-12 md:py-12 lg:px-16">
              
              {/* --- GRID LAYOUT (Mobile Optimized) --- */}
              <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-10 mb-10 lg:mb-16">

                {/* 1. IDENTITY (Full Width Mobile) */}
                <div className="col-span-2 lg:col-span-4 flex flex-col gap-6 pb-6 lg:pb-0 border-b border-[#222] lg:border-none">
                  <Link to="/" className="group flex items-center gap-4 w-fit select-none">
                    <div className="relative w-14 h-14 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-2xl transition-all duration-500 group-hover:border-[#e69635]/50 group-hover:shadow-[0_0_30px_rgba(230,150,53,0.15)]">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#e69635]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <img src="/GlossCut.png" alt="Logo" className="w-8 h-8 object-contain grayscale contrast-125 brightness-110 group-hover:grayscale-0 transition-all duration-500 z-10" />
                    </div>
                    
                    <div className="flex flex-col">
                      <h3 className="text-2xl font-mono font-black tracking-tighter uppercase shimmer-text transition-colors duration-300">
                        GlossCut
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0affd9] animate-pulse"></span>
                        <span className="text-[10px] font-mono font-bold text-[#0affd9] tracking-[0.2em] uppercase">
                          Nexus.Online
                        </span>
                      </div>
                    </div>
                  </Link>

                  <p className="text-gray-500 font-mono text-xs md:text-sm leading-relaxed max-w-sm">
                    The definitive interface connecting elite grooming artisans with discerning clients. 
                    <span className="block mt-2 text-[#e69635] animate-pulse">Verified. Synchronized. Encrypted.</span>
                  </p>

                  {/* NICE SOCIAL ICONS */}
                  <div className="flex items-center gap-3 mt-2">
                      <SocialIcon icon={Facebook} delay="0s" />
                      <SocialIcon icon={Instagram} delay="0.1s" />
                      <SocialIcon icon={Twitter} delay="0.2s" />
                  </div>
                </div>

                {/* 2. NAVIGATION (Left Half Mobile) */}
                <div className="col-span-1 lg:col-span-3 lg:pl-8">
                  <SectionHeader icon={Activity} title="Nav" />
                  <ul className="space-y-2">
                    <NavRow to="/" label="Home" />
                    <NavRow to="/all-services-search" label="Search" />
                    <NavRow to="/customer-account-creation" label="Clients" />
                    <NavRow to="/barber-account-creation" label="Artisans" />
                  </ul>
                </div>

                {/* 3. LEGAL (Right Half Mobile) */}
                <div className="col-span-1 lg:col-span-2">
                    <SectionHeader icon={Cpu} title="Legal" />
                    <ul className="space-y-2 font-mono text-[10px] md:text-xs text-gray-500">
                      <LegalLink label="Privacy Policy" />
                      <LegalLink label="Terms of Service" highlight="#0affd9" />
                      <LegalLink label="Cookie Data" highlight="white" />
                    </ul>
                </div>

                {/* 4. UPLINK DATA (Full Width Mobile) */}
                <div className="col-span-2 lg:col-span-3 pt-6 lg:pt-0 border-t border-[#222] lg:border-none">
                  <SectionHeader icon={Zap} title="Uplink Data" />
                  <ul className="space-y-4 font-mono text-sm">
                    <ContactRow icon={Mail} text="support@glosscut.com" href="mailto:support@glosscut.com" />
                    <ContactRow icon={Phone} text="+1 (555) 808-2077" href="tel:+15558082077" />
                    <ContactRow icon={MapPin} text="Sector 7, Neo-Tokyo Dist." />
                  </ul>
                </div>

              </div>

              {/* --- BOTTOM BAR --- */}
              <div className="relative pt-6 border-t border-[#1a1a1a] flex flex-col md:flex-row justify-between items-center gap-6">
                  
                  <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left">
                    <span className="text-gray-500 font-mono text-[10px] md:text-xs font-bold tracking-tight">
                      © {currentYear} GLOSSCUT SYSTEMS INC.
                    </span>
                    <span className="text-[9px] text-gray-700 font-mono uppercase">
                      All Rights Reserved. v2.4.0
                    </span>
                  </div>

                  <a 
                    href="https://github.com/ompatil" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative inline-flex items-center justify-center p-[1px] overflow-hidden rounded-lg cursor-pointer hover:shadow-[0_0_20px_rgba(10,255,217,0.2)] transition-shadow duration-300"
                  >
                    <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#e69635_50%,#0affd9_100%)] opacity-100 transition-opacity duration-500"></span>
                    <span className="relative inline-flex h-full w-full items-center gap-3 rounded-lg bg-[#0a0a0a] px-5 py-2.5 text-sm font-medium text-white backdrop-blur-3xl border border-transparent hover:bg-[#0a0a0a]/80 transition-all">
                       <Code size={14} className="text-[#0affd9] animate-pulse" />
                       <span className="text-[9px] uppercase text-gray-500 font-mono">Architect: <span className="text-[#e69635] font-bold ml-1 group-hover:text-white transition-colors">OM . B . PATIL</span></span>
                       <ExternalLink size={12} className="text-gray-600 group-hover:text-[#0affd9] transition-colors ml-1" />
                    </span>
                  </a>

              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

// --- IMPROVED SUB-COMPONENTS ---

/* 1. Nice Social Icon with "Magnetic Liquid" Effect */
const SocialIcon = ({ icon: Icon, delay }) => (
  <button 
    className="group relative w-10 h-10 rounded-xl bg-[#0a0a0a] border border-[#333] flex items-center justify-center overflow-hidden transition-all duration-300 hover:border-[#0affd9] hover:shadow-[0_0_15px_rgba(10,255,217,0.3)] hover:-translate-y-1 active:scale-95"
    style={{ animationDelay: delay }}
  >
     <div className="absolute inset-0 bg-gradient-to-tr from-[#0affd9]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
     <Icon size={18} className="relative z-10 text-gray-500 group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
  </button>
);

/* 2. Interactive Section Header (Underline grows on hover) */
const SectionHeader = ({ icon: Icon, title }) => (
  <div className="group w-full mb-4">
    <h4 className="flex items-center gap-2 text-[#0affd9] font-bold text-xs md:text-sm uppercase tracking-widest pb-2">
      <Icon size={14} className="group-hover:rotate-180 transition-transform duration-500 text-[#0affd9] group-hover:text-[#e69635]" /> 
      <span className="group-hover:text-white transition-colors">{title}</span>
    </h4>
    <div className="w-full h-[1px] bg-[#333] relative overflow-hidden">
       <div className="absolute left-0 top-0 h-full w-0 bg-[#e69635] group-hover:w-full transition-all duration-500 ease-out"></div>
    </div>
  </div>
);

/* 3. Link with "Data Reveal" Arrow Effect */
const NavRow = ({ to, label }) => (
  <li>
    <Link 
      to={to} 
      className="group flex items-center justify-between py-1.5 text-gray-400 hover:text-white transition-colors border-b border-transparent hover:border-[#222]"
    >
      <div className="flex items-center gap-2">
        <span className="text-[#e69635] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 font-mono font-bold">{'>'}</span>
        <span className="font-mono text-xs md:text-sm group-hover:translate-x-1 transition-transform duration-300">{label}</span>
      </div>
      <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#0affd9]" />
    </Link>
  </li>
);

/* 4. Contact Row with "Pulse Icon" interaction */
const ContactRow = ({ icon: Icon, text, href }) => (
  <li className="group flex items-start gap-3 text-gray-400 hover:text-white transition-colors cursor-default">
    <div className="mt-0.5 p-1.5 rounded-md bg-[#111] border border-[#222] group-hover:border-[#e69635] group-hover:bg-[#e69635]/10 transition-all duration-300">
       <Icon size={14} className="text-[#e69635] group-hover:animate-pulse" />
    </div>
    {href ? (
       <a href={href} className="hover:text-[#e69635] transition-colors pt-0.5 text-xs md:text-sm break-all">{text}</a>
    ) : (
       <span className="pt-0.5 text-xs md:text-sm group-hover:text-gray-300 transition-colors">{text}</span>
    )}
  </li>
);

/* 5. Legal Link with "Dot" highlight */
const LegalLink = ({ label, highlight = "#e69635" }) => (
  <li 
    className="cursor-pointer transition-colors flex items-center gap-2 group py-0.5"
    style={{ '--highlight-color': highlight }}
  >
    <div className="w-1 h-1 bg-[#333] rounded-full group-hover:bg-[var(--highlight-color)] group-hover:scale-150 transition-all"></div> 
    <span className="group-hover:text-[var(--highlight-color)] transition-colors group-hover:translate-x-1 duration-300">{label}</span>
  </li>
);

export default Footer;