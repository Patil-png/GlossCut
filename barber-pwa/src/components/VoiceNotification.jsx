import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { Volume2, VolumeX, MessageSquareQuote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VoiceNotification = () => {
    const { socket } = useSocket();
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [lastAnnouncement, setLastAnnouncement] = useState("");

    const speak = useCallback((text) => {
        if (!isAudioEnabled) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Use a nice voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes('en-IN')) || voices.find(v => v.lang.includes('en-GB')) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;

        window.speechSynthesis.speak(utterance);
    }, [isAudioEnabled]);

    useEffect(() => {
        if (!socket) return;

        const handleNewBooking = (data) => {
            const customerName = data.customerName || "a customer";
            const services = data.services?.map(s => s.name).join(", ") || "services";

            const message = `New appointment request from ${customerName} for ${services}.`;
            setLastAnnouncement(message);
            speak(message);
        };

        socket.on('new_booking', handleNewBooking);

        return () => {
            socket.off('new_booking', handleNewBooking);
        };
    }, [socket, speak]);

    const toggleAudio = () => {
        if (!isAudioEnabled) {
            // Browsers allow audio after a user gesture
            const utterance = new SpeechSynthesisUtterance("Audio notifications enabled");
            window.speechSynthesis.speak(utterance);
            setIsAudioEnabled(true);
        } else {
            setIsAudioEnabled(false);
        }
    };

    return (
        <>
            {/* Audio Toggle Button */}
            <div className="fixed bottom-24 right-6 z-[100]">
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

            {/* Announcement Banner (Optional visibility) */}
            <AnimatePresence>
                {!isAudioEnabled && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-24 right-20 z-[100] bg-black text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2"
                    >
                        <MessageSquareQuote size={14} className="text-[#FFD700]" />
                        <span>Tap to enable voice alerts</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default VoiceNotification;
