import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Volume2, VolumeX, MessageSquareQuote, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const VoiceNotification = () => {
    const { socket } = useSocket();
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const latestBookingIdRef = useRef(null);
    const recognitionRef = useRef(null);

    const speak = useCallback((text, callback) => {
        if (!isAudioEnabled) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes('en-IN')) || voices.find(v => v.lang.includes('en-GB')) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;

        if (callback) {
            utterance.onend = () => {
                clearTimeout(fallbackTimeout);
                callback();
            };
            // Fallback timeout in case onend doesn't fire (browser bug)
            const fallbackTimeout = setTimeout(() => {
                console.warn("SpeechSynthesis onend fallback triggered");
                callback();
            }, 15000);
        }

        window.speechSynthesis.speak(utterance);
    }, [isAudioEnabled]);

    const acceptBooking = async (id) => {
        try {
            console.log("🚀 Attempting to accept booking via voice:", id);
            await api.put(`/api/booking/accept/${id}`);
            speak("Booking accepted successfully.");
            latestBookingIdRef.current = null;
        } catch (err) {
            console.error('❌ Failed to accept booking via voice:', err);
            speak("Failed to accept booking.");
        }
    };

    const startListening = useCallback(() => {
        if (!isAudioEnabled) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported in this browser.");
            return;
        }

        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) { }
        }

        const recognition = new SpeechRecognition();
        // Set to en-IN for better local accent matching
        recognition.lang = 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            console.log("🎤 Voice recognition started...");
            setIsListening(true);
        };
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
            console.error("❌ Speech recognition error:", event.error);
            setIsListening(false);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase().trim();
            console.log('🎤 Voice Command Recognized:', transcript);
            console.log('📝 Current Booking ID in Ref:', latestBookingIdRef.current);

            const acceptCommands = ['accept', 'confirm', 'yes', 'okay', 'ok', 'accept request', 'haan'];
            const isMatch = acceptCommands.some(cmd => transcript.includes(cmd));

            if (isMatch) {
                const bookingId = latestBookingIdRef.current;
                console.log('✅ Match found! Target booking ID:', bookingId);
                if (bookingId) {
                    acceptBooking(bookingId);
                } else {
                    console.warn("⚠️ No active booking ID to accept.");
                }
            } else {
                console.warn("🤔 Recognized speech did not match any accept command.");
            }
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
            // Automatically stop listening after 20 seconds to give more time
            setTimeout(() => {
                if (recognitionRef.current) {
                    console.log("⏱️ Recognition timeout reached, stopping...");
                    recognitionRef.current.stop();
                }
            }, 20000);
        } catch (e) {
            console.error("Failed to start speech recognition:", e);
        }
    }, [isAudioEnabled]); // Removed undefined latestBookingId dependency

    useEffect(() => {
        if (!socket) return;

        const handleNewBooking = (data) => {
            console.log("📢 Received new_booking for voice:", data);
            const customerName = data.customerName || "a customer";
            const services = data.services?.map(s => s.name).join(", ") || "services";
            const bookingId = data.bookingId;

            if (!bookingId) {
                console.error("❌ received new_booking without bookingId", data);
                return;
            }

            latestBookingIdRef.current = bookingId;

            const message = `New appointment request from ${customerName} for ${services}. Say accept to confirm.`;

            // Speak the announcement, then start listening for the command
            speak(message, () => {
                if (bookingId) {
                    console.log(`Speech finished for booking ${bookingId}. Preparing to start listening.`);
                    // Small delay to ensure synthesis has fully stopped using the audio hardware
                    setTimeout(startListening, 500);
                }
            });
        };

        socket.on('new_booking', handleNewBooking);

        return () => {
            socket.off('new_booking', handleNewBooking);
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, [socket, speak, startListening]);

    const toggleAudio = () => {
        if (!isAudioEnabled) {
            const utterance = new SpeechSynthesisUtterance("Voice controls enabled. I am listening for accept commands.");
            window.speechSynthesis.speak(utterance);
            setIsAudioEnabled(true);
        } else {
            setIsAudioEnabled(false);
            if (recognitionRef.current) recognitionRef.current.stop();
        }
    };

    return (
        <>
            {/* Audio & Mic Status Controls */}
            <div className="fixed bottom-24 right-6 z-[100] flex flex-col items-center gap-3">
                <AnimatePresence>
                    {isListening && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5, y: 10 }}
                            className="bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg animate-pulse"
                        >
                            <Mic size={18} />
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleAudio}
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${isAudioEnabled
                        ? 'bg-[#6A1B9A] text-white'
                        : 'bg-white text-gray-400 border border-gray-100'
                        }`}
                >
                    {isAudioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                </motion.button>
            </div>

            {/* Hint Banner */}
            <AnimatePresence>
                {!isAudioEnabled && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-24 right-20 z-[100] bg-black text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2"
                    >
                        <MessageSquareQuote size={14} className="text-[#FFD700]" />
                        <span>Tap to enable voice controls</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default VoiceNotification;
