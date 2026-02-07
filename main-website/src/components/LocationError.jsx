import React from 'react';
import { MapPin, Wifi, AlertTriangle } from 'lucide-react';

const LocationError = ({ type, distance, onRetry }) => {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900 text-white">
            <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center shadow-xl border border-gray-700">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
                        {type === 'permission' ? (
                            <MapPin size={40} className="text-red-500" />
                        ) : (
                            <AlertTriangle size={40} className="text-amber-500" />
                        )}
                    </div>
                </div>

                <h2 className="text-2xl font-bold mb-3">
                    {type === 'permission' ? 'Location Access Needed' : 'Location Not Verified'}
                </h2>

                <p className="text-gray-400 mb-6 leading-relaxed">
                    {type === 'permission'
                        ? "We need your location to verify you are at the shop. Please allow location access in your browser settings."
                        : type === 'drift'
                            ? `We can't confirm your location. You seem to be ${Math.round(distance)}m away (Limit: 40m).`
                            : "You are too far from the shop to join the walk-in line."
                    }
                </p>

                {type === 'drift' && (
                    <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-4 mb-6 text-left flex items-start">
                        <Wifi size={20} className="text-blue-400 mt-1 flex-shrink-0 mr-3" />
                        <div className="text-sm text-gray-300">
                            <span className="font-semibold text-blue-400 block mb-1">Tip for better accuracy:</span>
                            Turn on Wi-Fi (even if not connected) and step closer to the entrance or a window.
                        </div>
                    </div>
                )}

                <button
                    onClick={onRetry}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all active:scale-95"
                >
                    {type === 'permission' ? 'Try Again' : 'Refresh Location'}
                </button>

                <div className="mt-4 text-xs text-gray-500">
                    If this persists, please ask the barber to add you manually.
                </div>
            </div>
        </div>
    );
};

export default LocationError;
