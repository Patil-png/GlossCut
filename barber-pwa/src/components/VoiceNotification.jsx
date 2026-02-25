import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Volume2, VolumeX, MessageSquareQuote, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const VoiceNotification = () => {
    const { socket } = useSocket();
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [latestBookingId, setLatestBookingId] = useState(null);
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
            utterance.onend = () => callback();
        }

        window.speechSynthesis.speak(utterance);
    }, [isAudioEnabled]);

    const acceptBooking = async (id) => {
        try {
            await api.put(`/api/booking/accept/${id}`);
            speak("Booking accepted successfully.");
            setLatestBookingId(null);
        } catch (err) {
            console.error('Failed to accept booking:', err);
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
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            console.log('Voice Command Recognized:', transcript);

            if (transcript.includes('accept') || transcript.includes('confirm') || transcript.includes('yes')) {
                if (latestBookingId) {
                    acceptBooking(latestBookingId);
                }
            }
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
            // Automatically stop listening after 10 seconds to save resources
            setTimeout(() => {
                if (recognitionRef.current) recognitionRef.current.stop();
            }, 10000);
        } catch (e) {
            console.error("Failed to start speech recognition:", e);
        }
    }, [isAudioEnabled, latestBookingId]);

    useEffect(() => {
        if (!socket) return;

        const handleNewBooking = (data) => {
            console.log("📢 Received new_booking for voice:", data);
            const customerName = data.customerName || "a customer";
            const services = data.services?.map(s => s.name).join(", ") || "services";
            const bookingId = data.bookingId;

            setLatestBookingId(bookingId);

            const message = `New appointment request from ${customerName} for ${services}. Say accept to confirm.`;

            // Speak the announcement, then start listening for the command
            speak(message, () => {
                if (bookingId) {
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
