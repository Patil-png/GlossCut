import React, { useState } from 'react';
import axios from 'axios';
import { X, Calendar, Clock, FileText, Scissors, MapPin, Loader2, ChevronDown, Check } from 'lucide-react';

const BookingModal = ({ provider, isOpen, onClose, onSubmit }) => {
  const [selectedService, setSelectedService] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedService || !appointmentDate || !appointmentTime) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        shopId: provider.id,
        service: selectedService,
        date: appointmentDate,
        time: appointmentTime,
        notes: notes,
        customerName: 'Customer Name', // You might want to get this from user context
        customerPhone: 'Customer Phone' // You might want to get this from user context
      };

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/booking/create`, bookingData);
      
      alert('Booking submitted successfully!');
      onSubmit(response.data);
      onClose();
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop with Blur */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                <Calendar size={20} />
             </div>
             <h2 className="text-xl font-bold text-white">Book Appointment</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Provider Info Card */}
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex items-start gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg shadow-indigo-500/20">
                {provider.name?.charAt(0) || 'B'}
             </div>
             <div>
                <h3 className="font-bold text-white text-lg leading-tight">{provider.name}</h3>
                <div className="flex items-center gap-1.5 text-gray-400 text-sm mt-1">
                   <MapPin size={14} className="text-indigo-400" />
                   <span className="truncate max-w-[200px]">{provider.address}</span>
                </div>
             </div>
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
               <Scissors size={14} className="text-indigo-400" /> Select Service
            </label>
            <div className="relative">
               <select 
                 value={selectedService}
                 onChange={(e) => setSelectedService(e.target.value)}
                 required
                 className="w-full appearance-none bg-slate-950 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
               >
                 <option value="" className="bg-slate-900 text-gray-500">Choose a service...</option>
                 {provider.services && provider.services.map((service, index) => (
                   <option key={index} value={service.name || service} className="bg-slate-900">
                     {service.name || service} - ${service.price || 'N/A'}
                   </option>
                 ))}
                 {(!provider.services || provider.services.length === 0) && (
                   <option value="General Consultation" className="bg-slate-900">General Consultation</option>
                 )}
               </select>
               <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                 <Calendar size={14} className="text-indigo-400" /> Date
              </label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [color-scheme:dark]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                 <Clock size={14} className="text-indigo-400" /> Time
              </label>
              <input
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                required
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
               <FileText size={14} className="text-indigo-400" /> Special Requests
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific preferences or needs..."
              rows={3}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none placeholder-gray-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl font-semibold transition-all border border-white/5"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-[2] px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                 <>
                   <Loader2 size={18} className="animate-spin" /> Processing...
                 </>
              ) : (
                 <>Book Appointment</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;