import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import QueueStatus from './QueueStatus';
import {
  ArrowLeft, Crown, Scissors, Check, AlertCircle, Shield, ArrowRight,
  Wallet, MapPin, Phone
} from 'lucide-react';

// --- PREMIUM VINTAGE STYLES ---
const Styles = () => (
  <style>
    {`
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,600;0,800;1,400&family=Caveat:wght@500;700&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400&display=swap');
      
      :root {
        --leather-primary: #3E2723;
        --leather-secondary: #281815;
        --leather-highlight: #5D4037;
        --gold-light: #F9E79F;
        --gold-mid: #D4AF37;
        --gold-dark: #886F28;
        --paper-bg: #F3E5AB;
        --ink-color: #2C1E16;
        --stamp-red: #D32F2F;
      }

      body {
        background-color: #1a120e;
        font-family: 'Playfair Display', serif;
        overflow-x: hidden;
        color: #e5e5e5;
      }

      /* --- TEXTURES & SURFACES --- */
      .mahogany-desk {
        background-color: #1a120e;
        background-image: 
          radial-gradient(circle at 50% 0%, rgba(255,255,255,0.05), transparent 70%),
          url("https://www.transparenttextures.com/patterns/wood-pattern.png");
        min-height: 100vh;
      }

      .leather-texture {
        background-color: var(--leather-primary);
        background-image: url("https://www.transparenttextures.com/patterns/black-leather.png");
        box-shadow: 
          inset 0 0 80px rgba(0,0,0,0.8),
          0 20px 50px rgba(0,0,0,0.6);
        position: relative;
        border-radius: 4px;
      }
      
      .stitch-border {
        position: absolute;
        top: 8px; left: 8px; right: 8px; bottom: 8px;
        border: 2px dashed #6d4c41;
        border-radius: 4px;
        pointer-events: none;
        box-shadow: 0 1px 0 rgba(255,255,255,0.1);
      }

      .gold-foil-text {
        background: linear-gradient(to bottom, var(--gold-light) 0%, var(--gold-mid) 40%, var(--gold-dark) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        font-family: 'Cinzel', serif;
        letter-spacing: 0.05em;
      }

      /* --- COMPONENTS --- */
      .gold-spine {
        width: 12px;
        background: linear-gradient(to right, #6b5321, #f9e79f, #886f28, #4a3812);
        border-radius: 6px;
        box-shadow: inset 0 0 2px rgba(0,0,0,0.5), 2px 0 5px rgba(0,0,0,0.4);
        position: relative; z-index: 10;
      }

      .leather-patch-btn {
        background: linear-gradient(145deg, #4a302a, #36221d);
        border: 1px solid #5d4037;
        border-radius: 12px;
        position: relative;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        overflow: hidden;
      }
      .leather-patch-btn::after {
        content: ''; position: absolute; top: 4px; left: 4px; right: 4px; bottom: 4px;
        border: 1px dashed #6d4c41; border-radius: 8px;
        box-shadow: 0 1px 0 rgba(255,255,255,0.05);
      }
      .leather-patch-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 15px rgba(0,0,0,0.4); border-color: var(--gold-mid); }
      .leather-patch-btn.selected {
        border-color: var(--gold-light);
        box-shadow: 0 0 0 1px var(--gold-mid), 0 10px 20px rgba(0,0,0,0.5);
        background: linear-gradient(145deg, #3e2723, #281815);
      }
      .leather-patch-btn.selected .check-badge {
        background: linear-gradient(to bottom, var(--gold-light), var(--gold-mid));
        color: #281815;
      }

      .check-badge {
        position: absolute; top: 0; right: 0; width: 30px; height: 30px;
        background: #2a1b12; border-bottom-left-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        border-left: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1);
        color: #555; transition: all 0.3s; z-index: 5;
      }

      .paper-scroll {
        background-color: var(--paper-bg);
        background-image: url("https://www.transparenttextures.com/patterns/natural-paper.png");
        color: var(--ink-color);
        position: relative;
        box-shadow: inset 0 0 40px rgba(139, 69, 19, 0.1), -5px 0 15px rgba(0,0,0,0.2);
        --mask: linear-gradient(#000 0 0) 50% / calc(100% - 20px) 100% no-repeat,
                radial-gradient(farthest-side, #000 98%, #0000) 0 0/20px 20px round;
        -webkit-mask: var(--mask); mask: var(--mask);
      }
      
      .royal-seal {
        width: 70px; height: 70px;
        background: radial-gradient(circle at 35% 35%, #bf360c, #7f0000);
        border-radius: 50%; border: 4px solid #7f0000;
        box-shadow: inset 0 2px 5px rgba(255,255,255,0.3), 3px 3px 6px rgba(0,0,0,0.4);
        display: flex; align-items: center; justify-content: center;
        font-family: 'Cinzel', serif; font-weight: 700; color: rgba(0,0,0,0.4);
        font-size: 24px; text-shadow: 0 1px 0 rgba(255,255,255,0.2);
        transform: rotate(-10deg);
      }

      /* THE RED PENDING STAMP */
      .ink-stamp-pending {
        border: 3px solid var(--stamp-red);
        color: var(--stamp-red);
        font-family: 'Courier Prime', monospace;
        font-weight: bold;
        text-transform: uppercase;
        padding: 5px 15px;
        border-radius: 8px;
        transform: rotate(-15deg);
        opacity: 0.8;
        mix-blend-mode: multiply;
        font-size: 1.2rem;
        letter-spacing: 2px;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-15deg);
        z-index: 20;
        mask-image: url("https://www.transparenttextures.com/patterns/black-felt.png");
      }

      .script-font { font-family: 'Caveat', cursive; color: #1a237e; transform: rotate(-1deg); display: inline-block; }
      .typewriter-font { font-family: 'Courier Prime', monospace; color: #3e2723; }

      .embossed-input {
        background: rgba(0,0,0,0.2); border: none; border-bottom: 1px solid rgba(255,255,255,0.1);
        border-radius: 4px; padding: 12px 16px; width: 100%; color: #e5e5e5;
        font-family: 'Playfair Display', serif;
        box-shadow: inset 1px 1px 3px rgba(0,0,0,0.5), inset -1px -1px 3px rgba(255,255,255,0.05);
        transition: all 0.3s;
      }
      .embossed-input:focus { outline: none; background: rgba(0,0,0,0.3); border-bottom-color: var(--gold-mid); }

      .btn-gold-plate {
        background: linear-gradient(to bottom, #f9e79f 0%, #d4af37 50%, #886f28 100%);
        color: #281815; font-family: 'Cinzel', serif; font-weight: bold; text-transform: uppercase;
        letter-spacing: 0.1em; border: 1px solid #886f28;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 6px rgba(0,0,0,0.4);
        text-shadow: 0 1px 0 rgba(255,255,255,0.3); transition: all 0.2s;
      }
      .btn-gold-plate:hover { transform: translateY(-1px); filter: brightness(1.1); box-shadow: 0 6px 12px rgba(0,0,0,0.5); }
      .btn-gold-plate:disabled { filter: grayscale(1); opacity: 0.6; }

      .fade-in { animation: fadeIn 0.5s ease-out forwards; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      
      .receipt-line { border-bottom: 1px dotted #8d6e63; padding-bottom: 4px; margin-bottom: 4px; }
      .receipt-grid { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
    `}
  </style>
);

const BookingAppointment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const barberData = location.state?.barberData;
  const { isAuthenticated, user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [providerDetails, setProviderDetails] = useState(null);

  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedAppointmentType, setSelectedAppointmentType] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  
  const [ticketId] = useState(`TK-${Math.floor(100000 + Math.random() * 900000)}`);

  const appointmentTypes = [
    { id: '2', name: 'Gentleman\'s Cut', description: 'Classic styling with hot towel.', priceIndicator: 'Standard', priority: 2, icon: Scissors },
    { id: '4', name: 'Royal Service', description: 'Priority chair. No waiting.', priceIndicator: 'Premium', priority: 4, icon: Crown },
  ];

  const fetchProviderDetails = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/barber-card/${barberData.id}`);
      setProviderDetails(res.data);
    } catch (err) {
      console.error("Failed to fetch provider details", err);
    }
  }, [barberData.id]);

  useEffect(() => {
    if (!barberData) {
      navigate('/all-services-search');
    } else {
      fetchProviderDetails();
    }
  }, [barberData, navigate, fetchProviderDetails]);

  useEffect(() => {
    if (isAuthenticated && user) {
      setCustomerInfo({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        notes: ''
      });
    }
  }, [isAuthenticated, user]);

  const handleServiceSelect = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleAppointmentTypeSelect = (type) => {
    setSelectedAppointmentType(type);
    setCurrentStep(2);
  };

  const handleCustomerInfoSubmit = async (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate('/booking-confirmation-waiting', {
        state: {
          barberData: { ...barberData, services: providerDetails?.services || [] },
          selectedServices: selectedServices.map(serviceId => {
            const service = providerDetails?.services?.find(s => s.id === serviceId);
            return service ? { id: service.id, name: service.name, price: service.price } : null;
          }).filter(Boolean),
          selectedAppointmentType: {
            id: selectedAppointmentType?.id,
            name: selectedAppointmentType?.name,
            priority: selectedAppointmentType?.priority
          },
          customerInfo,
          totalPrice: calculateTotalPrice()
        }
      });
    } else {
      await createBooking();
    }
  };

  const createBooking = async () => {
    setLoading(true);
    setError('');
    try {
      const services = providerDetails?.services?.filter(s => selectedServices.includes(s.id)) || [];
      const now = new Date();
      const bookingData = {
        barberId: barberData.id,
        shopId: barberData.id,
        services,
        totalPrice: calculateTotalPrice(),
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        appointmentType: selectedAppointmentType.name,
        customerInfo,
        status: 'pending'
      };
      const endpoint = isAuthenticated ? '/api/booking' : '/api/booking/public';
      const response = await axios.post(`${process.env.REACT_APP_API_URL}${endpoint}`, bookingData);
      if (response.data) {
        setSuccess(true);
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    navigate('/payment', {
      state: {
        barberData: { ...barberData, services: providerDetails?.services?.filter(s => selectedServices.includes(s.id)) || [] },
        selectedServices: selectedServices.map(serviceId => {
          const service = providerDetails?.services?.find(s => s.id === serviceId);
          return service ? { id: service.id, name: service.name, price: service.price } : null;
        }).filter(Boolean),
        selectedAppointmentType: {
          id: selectedAppointmentType?.id,
          name: selectedAppointmentType?.name,
          priority: selectedAppointmentType?.priority
        },
        customerInfo,
        totalPrice: calculateTotalPrice()
      }
    });
  };

  const calculateTotalPrice = () => {
    if (!providerDetails?.services) return 0;
    return providerDetails.services
      .filter(service => selectedServices.includes(service.id))
      .reduce((total, service) => {
        const price = parseFloat(service.price.replace(/[^0-9.]/g, ''));
        return total + price;
      }, 0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  if (!barberData) return null;

  if (success) {
    return (
      <div className="min-h-screen mahogany-desk flex items-center justify-center p-4">
        <Styles />
        <div className="paper-scroll max-w-md w-full text-center p-12 rounded relative">
            <div className="royal-seal mx-auto mb-6">PAID</div>
            <h1 className="text-3xl font-bold mb-4 font-serif text-[#3e2723]">Confirmed</h1>
            <p className="text-[#5d4037] mb-8 font-serif italic">Your booking is secured in the ledger.</p>
            
            <div className="text-left mb-8 p-6 border border-[#8d6e63] bg-[#fff8e1]/50 typewriter-font text-sm">
                <p className="mb-2"><strong>REF:</strong> {ticketId}</p>
                <p className="mb-2"><strong>SERVICE:</strong> {selectedAppointmentType?.name}</p>
                <p className="mb-2"><strong>DATE:</strong> {formatDate(new Date().toISOString().split('T')[0])}</p>
                <p><strong>BARBER:</strong> {barberData.name}</p>
            </div>
            
            <button onClick={() => navigate('/')} className="text-[#3e2723] border-b-2 border-[#3e2723] pb-1 hover:text-[#5d4037] font-bold uppercase tracking-widest text-sm">Return to Directory</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mahogany-desk pb-20 overflow-x-hidden">
      <Styles />
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-8">
           <button onClick={() => navigate('/all-services-search')} className="group flex items-center gap-3 text-[#d4af37] hover:text-[#f9e79f] transition-colors">
             <div className="w-10 h-10 border border-[#886f28] rounded-full flex items-center justify-center bg-[#281815] group-hover:bg-[#3e2723]">
                <ArrowLeft size={18} />
             </div>
             <span className="font-cinzel font-bold text-sm tracking-widest">Return</span>
           </button>
        </div>

        {/* MAIN BOOKING CONTAINER */}
        <div className="flex flex-col lg:flex-row shadow-[0_30px_60px_rgba(0,0,0,0.9)] rounded-xl overflow-hidden min-h-[750px]">
          
          {/* LEFT: Leather Panel (Menu) */}
          <div className="lg:w-7/12 leather-texture p-8 md:p-12 relative z-10 flex flex-col">
             <div className="stitch-border"></div>
             
             {/* Header */}
             <div className="relative z-10 mb-10">
                 <h2 className="text-4xl gold-foil-text mb-2">Service Ledger</h2>
                 <div className="w-32 h-1 bg-gradient-to-r from-[#d4af37] to-transparent"></div>
             </div>

             {/* Step 1: Type Selection */}
             {currentStep === 1 && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 fade-in">
                 {appointmentTypes.map((type) => (
                   <button 
                      key={type.id} 
                      onClick={() => handleAppointmentTypeSelect(type)} 
                      className={`leather-patch-btn p-6 text-left group h-full flex flex-col justify-between ${selectedAppointmentType?.id === type.id ? 'selected' : ''}`}
                   >
                     <div className="check-badge">
                        {selectedAppointmentType?.id === type.id ? <Check size={16} strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-[#5d4037]"></div>}
                     </div>
                     <div>
                        <div className="text-[#d4af37] mb-3 opacity-80 group-hover:opacity-100 transition-opacity"><type.icon size={32} /></div>
                        <h3 className="text-2xl font-serif text-[#f3e5ab] mb-2">{type.name}</h3>
                        <p className="text-[#a1887f] text-sm leading-relaxed">{type.description}</p>
                     </div>
                     <div className="mt-6 pt-4 border-t border-[#5d4037]/50 flex justify-between items-center">
                        <span className="text-[#d4af37] font-cinzel text-xs uppercase">{type.priceIndicator}</span>
                        <ArrowRight size={16} className="text-[#a1887f] group-hover:text-[#d4af37] group-hover:translate-x-1 transition-all"/>
                     </div>
                   </button>
                 ))}
               </div>
             )}

             {/* Step 2: Queue */}
             {currentStep === 2 && (
               <div className="relative z-10 fade-in h-full flex flex-col">
                 <div className="bg-[#281815] border border-[#5d4037] rounded-lg p-6 mb-8 shadow-inner">
                     <div className="flex items-center justify-between mb-4">
                         <h3 className="text-xl gold-foil-text">Queue Position</h3>
                         <div className="px-3 py-1 bg-[#3e2723] rounded border border-[#5d4037] text-[#d4af37] font-mono text-sm">
                            EST. 15 MIN
                         </div>
                     </div>
                     <div className="bg-black/40 rounded p-4 border border-[#3e2723]">
                        <QueueStatus barberId={barberData?.owner?._id} showPreviewPosition={true} previewAppointmentType={selectedAppointmentType} previewCustomerInfo={customerInfo} />
                     </div>
                 </div>
                 
                 <div className="mt-auto flex gap-4">
                    <button onClick={() => setCurrentStep(1)} className="px-6 py-4 text-[#a1887f] hover:text-[#f3e5ab] font-cinzel text-sm uppercase tracking-widest border border-transparent hover:border-[#5d4037] rounded transition-all">Back</button>
                    <button onClick={() => setCurrentStep(3)} className="btn-gold-plate flex-1 py-4 rounded shadow-lg">View Services</button>
                 </div>
               </div>
             )}

             {/* Step 3: Services */}
             {currentStep === 3 && (
               <div className="relative z-10 fade-in h-full flex flex-col">
                 <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-8 custom-scrollbar">
                    {providerDetails?.services?.map((service) => {
                        const isSelected = selectedServices.includes(service.id);
                        return (
                            <div 
                                key={service.id} 
                                onClick={() => handleServiceSelect(service.id)} 
                                className={`leather-patch-btn p-4 cursor-pointer flex justify-between items-center group ${isSelected ? 'selected' : ''}`}
                            >
                                <div className="check-badge">
                                   {isSelected ? <Check size={14} /> : null}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded flex items-center justify-center border transition-colors ${isSelected ? 'border-[#d4af37] bg-[#3e2723]' : 'border-[#5d4037] bg-[#281815]'}`}>
                                        <Scissors size={18} className={isSelected ? 'text-[#d4af37]' : 'text-[#5d4037]'} />
                                    </div>
                                    <div>
                                        <h4 className={`text-lg font-serif ${isSelected ? 'text-[#f3e5ab]' : 'text-[#d7ccc8]'}`}>{service.name}</h4>
                                        <p className="text-xs text-[#a1887f]">{service.description}</p>
                                    </div>
                                </div>
                                <div className="text-[#d4af37] font-cinzel text-lg mr-8">{service.price}</div>
                            </div>
                        )
                    })}
                 </div>
                 <div className="mt-auto flex gap-4">
                    <button onClick={() => setCurrentStep(2)} className="px-6 py-4 text-[#a1887f] hover:text-[#f3e5ab] font-cinzel text-sm uppercase tracking-widest border border-transparent hover:border-[#5d4037] rounded transition-all">Back</button>
                    <button onClick={() => setCurrentStep(4)} disabled={selectedServices.length === 0} className="btn-gold-plate flex-1 py-4 rounded shadow-lg">Details</button>
                 </div>
               </div>
             )}

             {/* Step 4: Details Form */}
             {currentStep === 4 && (
               <form onSubmit={handleCustomerInfoSubmit} className="relative z-10 fade-in h-full flex flex-col">
                  <div className="space-y-6 mb-8">
                      <div>
                          <input type="text" required value={customerInfo.name} onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})} className="embossed-input" placeholder="Full Name" />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                          <input type="tel" required value={customerInfo.phone} onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})} className="embossed-input" placeholder="Telephone" />
                          <input type="email" required value={customerInfo.email} onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})} className="embossed-input" placeholder="Email Address" />
                      </div>
                      <div>
                          <textarea rows={3} value={customerInfo.notes} onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})} className="embossed-input resize-none" placeholder="Special Requests..." />
                      </div>
                  </div>
                  {error && <div className="text-red-400 mb-4 text-sm bg-red-900/20 p-2 border border-red-900/50 rounded flex items-center gap-2"><AlertCircle size={14}/> {error}</div>}
                  <div className="mt-auto flex gap-4">
                    <button type="button" onClick={() => setCurrentStep(3)} className="px-6 py-4 text-[#a1887f] hover:text-[#f3e5ab] font-cinzel text-sm uppercase tracking-widest border border-transparent hover:border-[#5d4037] rounded transition-all">Back</button>
                    <button type="submit" disabled={loading} className="btn-gold-plate flex-1 py-4 rounded shadow-lg">{loading ? 'Processing...' : 'Review'}</button>
                  </div>
               </form>
             )}

             {/* Step 5: Payment */}
             {currentStep === 5 && isAuthenticated && (
               <div className="relative z-10 fade-in h-full flex flex-col justify-center items-center">
                  <div className="w-full max-w-sm leather-patch-btn p-8 text-center mb-8">
                      <div className="w-16 h-16 mx-auto bg-[#281815] rounded-full flex items-center justify-center border border-[#5d4037] mb-4 shadow-inner">
                          <Wallet className="text-[#d4af37]" size={28} />
                      </div>
                      <h3 className="text-xl gold-foil-text mb-2">Total Amount</h3>
                      <p className="text-4xl font-serif text-[#f3e5ab] mb-4">₹{calculateTotalPrice().toFixed(2)}</p>
                      <div className="flex items-center justify-center gap-2 text-[#a1887f] text-xs uppercase tracking-widest">
                          <Shield size={12} /> Secure Transaction
                      </div>
                  </div>
                  <button onClick={handlePaymentSubmit} disabled={loading} className="btn-gold-plate w-full max-w-sm py-4 rounded shadow-lg flex items-center justify-center gap-3">
                      {loading ? 'Processing...' : <>Pay Now <ArrowRight size={18} /></>}
                  </button>
               </div>
             )}
          </div>

          {/* MIDDLE: Gold Rod Binding */}
          <div className="gold-spine hidden lg:block h-auto"></div>

          {/* RIGHT: Detailed Paper Receipt */}
          <div className="lg:w-5/12 paper-scroll p-8 md:p-12 relative flex flex-col">
              
              {/* Header Info */}
              <div className="flex justify-between items-start mb-8 relative z-10">
                 <div className="text-left">
                    <h2 className="text-[#3e2723] font-bold text-2xl tracking-widest uppercase font-cinzel">{barberData.name}</h2>
                    <div className="flex items-center gap-2 text-[#5d4037] text-xs typewriter-font mt-1">
                        <MapPin size={12}/> {barberData.address}
                    </div>
                    <div className="flex items-center gap-2 text-[#5d4037] text-xs typewriter-font mt-1">
                        <Phone size={12}/> +91 (Shop Contact)
                    </div>
                 </div>
                 <div className="text-right">
                    <div className="border border-[#3e2723] p-1 px-2 inline-block">
                        <p className="typewriter-font font-bold text-xs uppercase">Ticket No.</p>
                        <p className="typewriter-font text-lg text-[#800000]">{ticketId}</p>
                    </div>
                    <p className="typewriter-font text-[10px] text-[#5d4037] mt-1 text-right">Status: Awaiting Payment</p>
                 </div>
              </div>

              {/* Date/Time Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6 border-b-2 border-[#3e2723] pb-4 relative z-10">
                 <div>
                    <p className="font-bold text-[#3e2723] uppercase text-xs tracking-widest">Date</p>
                    <p className="typewriter-font text-lg">{new Date().toLocaleDateString()}</p>
                 </div>
                 <div className="text-right">
                    <p className="font-bold text-[#3e2723] uppercase text-xs tracking-widest">Time</p>
                    <p className="typewriter-font text-lg">Queue Priority</p>
                 </div>
              </div>

              {/* Client Details */}
              <div className="space-y-2 mb-6 relative z-10">
                  <div className="receipt-grid receipt-line">
                      <span className="font-bold text-[#3e2723] uppercase text-xs">Client Name</span>
                      <span className="typewriter-font text-sm">{customerInfo.name || "Guest"}</span>
                  </div>
                  <div className="receipt-grid receipt-line">
                      <span className="font-bold text-[#3e2723] uppercase text-xs">Phone</span>
                      <span className="typewriter-font text-sm">{customerInfo.phone || "---"}</span>
                  </div>
                  <div className="receipt-grid receipt-line">
                      <span className="font-bold text-[#3e2723] uppercase text-xs">Email</span>
                      <span className="typewriter-font text-sm truncate max-w-[150px]">{customerInfo.email || "---"}</span>
                  </div>
              </div>

              {/* Services Table */}
              <div className="flex-1 relative z-10">
                  <div className="bg-[#e8dac0] p-1 mb-2 border-b border-[#3e2723] flex justify-between text-xs font-bold uppercase text-[#3e2723]">
                      <span>Description</span>
                      <span>Amount</span>
                  </div>
                  <div className="space-y-3 min-h-[120px]">
                      {selectedServices.length > 0 ? (
                          providerDetails?.services?.filter(s => selectedServices.includes(s.id)).map(s => (
                              <div key={s.id} className="flex justify-between items-end text-[#3e2723] receipt-line">
                                  <span className="typewriter-font text-sm">{s.name}</span>
                                  <span className="typewriter-font font-bold">{s.price}</span>
                              </div>
                          ))
                      ) : <p className="script-font text-xl opacity-50 text-center mt-4">Selection pending...</p>}
                  </div>
                  
                  {/* Notes Area */}
                  {customerInfo.notes && (
                    <div className="mt-4 p-2 border border-dashed border-[#8d6e63] bg-[#fff8e1]/60">
                        <p className="text-[10px] uppercase text-[#5d4037] font-bold">Notes:</p>
                        <p className="script-font text-lg leading-tight">{customerInfo.notes}</p>
                    </div>
                  )}
              </div>

              {/* Totals */}
              <div className="mt-auto pt-4 relative z-10">
                  <div className="flex justify-between text-xs text-[#5d4037] mb-1">
                      <span>Subtotal</span>
                      <span className="typewriter-font">₹{calculateTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#5d4037] mb-4">
                      <span>Service Tax (Inc)</span>
                      <span className="typewriter-font">₹0.00</span>
                  </div>
                  <div className="border-t-2 border-[#3e2723] pt-2 flex justify-between items-center relative">
                      <span className="font-bold text-xl text-[#3e2723] uppercase font-cinzel">Total Due</span>
                      <span className="script-font text-4xl font-bold text-[#800000]">₹{calculateTotalPrice().toFixed(2)}</span>
                      
                      {/* PENDING STAMP OVERLAY */}
                      {!success && calculateTotalPrice() > 0 && (
                         <div className="ink-stamp-pending">PAYMENT PENDING</div>
                      )}
                  </div>
              </div>

              {/* Footer / Signature */}
              <div className="mt-8 pt-4 border-t border-[#8d6e63] relative z-10">
                  <div className="flex justify-between items-end">
                      <div className="text-center">
                          <div className="w-32 border-b border-[#3e2723] mb-1"></div>
                          <p className="text-[10px] uppercase text-[#5d4037]">Authorized Signature</p>
                      </div>
                      <div className={`royal-seal scale-75 border-[#3e2723] text-[#3e2723] opacity-60 ${success ? 'text-[#800000] border-[#800000] opacity-90' : ''}`}>
                          {success ? 'PAID' : 'OPEN'}
                      </div>
                  </div>
                  <p className="text-center text-[10px] text-[#8d6e63] mt-4 uppercase typewriter-font">Thank you for your patronage</p>
              </div>

              {/* Decorative Watermark */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                  <Scissors size={200} />
              </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BookingAppointment;