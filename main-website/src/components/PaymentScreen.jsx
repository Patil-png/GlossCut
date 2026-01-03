import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, CreditCard, Shield, Lock, AlertCircle,
  Clock, MapPin, Star
} from 'lucide-react';

const PaymentScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    barberData,
    selectedServices,
    selectedAppointmentType,
    customerInfo,
    totalPrice,
    bookingId,
    bookingData
  } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);

  // Refs for timer management
  const timerRef = useRef(null);
  const endTimeRef = useRef(null);

  // Cancel booking function
  const cancelBooking = useCallback(async () => {
    if (bookingId) {
      try {
        await axios.put(`${process.env.REACT_APP_API_URL}/api/booking/cancel/${bookingId}`, {}, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        alert('Appointment cancelled because payment was not completed within 1 minute.');
        navigate('/all-services-search');
      } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Failed to cancel appointment. Please try again.');
      }
    }
  }, [bookingId, navigate]);

  // Timer logic - similar to customer-app
  useEffect(() => {
    if (bookingId) {
      // Set the absolute end time ONLY ONCE
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + 60 * 1000;
      }

      // Interval checks the difference between NOW and END TIME
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));

        setCountdown(remaining);

        if (remaining <= 0) {
          clearInterval(timerRef.current);
          cancelBooking();
        }
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [bookingId, cancelBooking]);

  const handlePayment = async () => {
    setProcessing(true);
    setError('');

    try {
      // Clear timer when payment starts
      if (timerRef.current) clearInterval(timerRef.current);

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate payment response
      const paymentResponse = {
        success: true,
        transactionId: 'txn_' + Date.now(),
        amount: totalPrice,
        method: paymentMethod
      };

      // Update the booking with payment information
      if (bookingId) {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/booking/update-payment/${bookingId}`,
          {
            paymentStatus: 'completed',
            paymentMethod: paymentMethod,
            transactionId: paymentResponse.transactionId,
            paymentAmount: totalPrice
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Navigate to success screen with real booking data
      navigate('/booking-success', {
        state: {
          paymentData: paymentResponse,
          bookingData: bookingData,
          barberData,
          selectedServices,
          selectedAppointmentType,
          customerInfo,
          totalPrice
        }
      });
    } catch (err) {
      console.error('Payment failed:', err);
      setError('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!barberData) {
    return (
      <div className="min-h-screen bg-[#050505] text-white font-sans flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-400">No booking data found</p>
          <button
            onClick={() => navigate('/all-services-search')}
            className="mt-4 px-6 py-2 bg-[#1F6FEB] text-white rounded-xl"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-8">

        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Payment</h1>
            <p className="text-gray-400 text-sm sm:text-base">Secure payment for your booking</p>
          </div>
        </div>

        {/* Timer Alert */}
        {countdown > 0 && countdown <= 60 && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-center gap-3">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-orange-400 font-semibold text-sm sm:text-base">Complete payment in</p>
              <p className="text-orange-300 text-xs sm:text-sm">00:{countdown < 10 ? `0${countdown}` : countdown} to secure slot</p>
            </div>
          </div>
        )}

        {/* Barber & Service Summary */}
        <div className="bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <img
              src={barberData.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80'}
              alt={barberData.name}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm sm:text-base truncate">{barberData.name}</h3>
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-400">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-[#FFB703] text-[#FFB703]" />
                <span>{barberData.rating?.toFixed(1) || '4.5'}</span>
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{barberData.address}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3 border-t border-white/10 pt-3 sm:pt-4">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-400">Appointment Type:</span>
              <span className="truncate ml-2">{selectedAppointmentType?.name}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-400">Services:</span>
              <span>{selectedServices?.length || 0} selected</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-400">Date:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-400">Time:</span>
              <span>{new Date().toTimeString().slice(0, 5)}</span>
            </div>
          </div>
        </div>

        {/* Payment Amount */}
        <div className="bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex justify-between items-center">
            <span className="text-base sm:text-lg font-semibold">Total Amount</span>
            <span className="text-xl sm:text-2xl font-bold text-[#FFB703]">₹{totalPrice?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Payment Method</h3>

          <div className="space-y-2 sm:space-y-3">
            <label className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer">
              <input
                type="radio"
                name="payment"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="text-[#1F6FEB] focus:ring-[#1F6FEB] w-4 h-4 sm:w-5 sm:h-5"
              />
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-[#1F6FEB] flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm sm:text-base">Credit/Debit Card</p>
                <p className="text-xs sm:text-sm text-gray-400">Visa, Mastercard, RuPay</p>
              </div>
            </label>

            <label className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer">
              <input
                type="radio"
                name="payment"
                value="upi"
                checked={paymentMethod === 'upi'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="text-[#1F6FEB] focus:ring-[#1F6FEB] w-4 h-4 sm:w-5 sm:h-5"
              />
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#1F6FEB] rounded flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">U</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm sm:text-base">UPI</p>
                <p className="text-xs sm:text-sm text-gray-400">PhonePe, GPay, Paytm</p>
              </div>
            </label>

            <label className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer">
              <input
                type="radio"
                name="payment"
                value="netbanking"
                checked={paymentMethod === 'netbanking'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="text-[#1F6FEB] focus:ring-[#1F6FEB] w-4 h-4 sm:w-5 sm:h-5"
              />
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#1F6FEB] rounded flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">₹</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm sm:text-base">Net Banking</p>
                <p className="text-xs sm:text-sm text-gray-400">All major banks</p>
              </div>
            </label>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center gap-3 p-3 sm:p-4 bg-green-500/10 border border-green-500/30 rounded-xl mb-4 sm:mb-6">
          <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-green-400 text-sm sm:text-base">Secure Payment</p>
            <p className="text-xs sm:text-sm text-green-300">Your payment information is encrypted and secure</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 mb-4 sm:mb-6">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={processing || countdown === 0}
          className="w-full py-3 sm:py-4 bg-gradient-to-r from-[#1F6FEB] to-[#3b82f6] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          {processing ? (
            <>
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
              Pay ₹{totalPrice?.toFixed(2) || '0.00'}
            </>
          )}
        </button>

        {/* Terms */}
        <p className="text-xs text-gray-500 text-center mt-3 sm:mt-4 px-2">
          By clicking Pay, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default PaymentScreen;
