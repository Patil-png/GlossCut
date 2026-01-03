import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Circle, Crown,
  Check, Sparkles, Clock
} from 'lucide-react';

const AppointmentTypeScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { barberId, barberData, services, totalPrice, date, time } = location.state || {};

  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    if (!barberId || !services || !totalPrice) {
      navigate('/all-services-search');
    }
  }, [barberId, services, totalPrice, navigate]);

  const appointmentTypes = [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Standard appointment slot.',
      priceIndicator: 'Standard',
      priority: 2,
      icon: Circle,
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      borderColor: '#BFDBFE'
    },
    {
      id: 'express',
      name: 'Express',
      description: 'VIP Lounge access, top priority & fastest service.',
      priceIndicator: 'Exclusive',
      priority: 4,
      icon: Crown,
      color: '#FFD700',
      bgColor: '#FEF3C7',
      borderColor: '#FCD34D'
    },
  ];

  const handleTypeSelect = (type) => {
    setSelectedType(type);
  };

  const handleContinue = () => {
    if (!selectedType) return;

    navigate('/appointment-check', {
      state: {
        barberId,
        barberData,
        services,
        totalPrice,
        date,
        time,
        selectedAppointmentType: selectedType.name,
      }
    });
  };

  if (!barberId || !services || !totalPrice) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -m-2 mr-4 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Select Appointment Type</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Step 2 of 4</span>
            <span className="text-sm text-gray-500">Appointment Type</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full w-1/2"></div>
          </div>
        </div>

        {/* Appointment Types */}
        <div className="space-y-4 mb-8">
          {appointmentTypes.map((type) => {
            const IconComponent = type.icon;
            const isSelected = selectedType?.id === type.id;

            return (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type)}
                className={`w-full p-6 rounded-2xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <IconComponent
                      size={24}
                      color={isSelected ? type.color : '#6B7280'}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      type.id === 'express' ? 'bg-yellow-100 text-yellow-800' :
                      type.id === 'basic' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {type.priceIndicator}
                    </span>
                    {isSelected && (
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check size={14} color="white" />
                      </div>
                    )}
                  </div>
                </div>

                <h3 className={`text-lg font-bold mb-2 ${
                  type.id === 'express' ? 'text-yellow-600' : 'text-gray-900'
                }`}>
                  {type.name}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {type.description}
                </p>

                {type.id === 'express' && (
                  <div className="flex items-center gap-2 mt-3">
                    <Sparkles size={14} className="text-yellow-500" />
                    <span className="text-xs font-semibold text-yellow-600 uppercase tracking-wide">
                      VIP Priority
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Service Summary */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Selected Services</h3>
          <div className="space-y-3 mb-4">
            {services?.map((service, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Check size={14} className="text-blue-600" />
                  </div>
                  <span className="text-gray-900 font-medium">{service.name}</span>
                </div>
                <span className="text-gray-600">₹{service.price}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-xl font-bold text-blue-600">₹{totalPrice?.toFixed(2)}</span>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selectedType}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
            selectedType
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue to Queue Check
        </button>
      </div>
    </div>
  );
};

export default AppointmentTypeScreen;
