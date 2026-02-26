import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Volume2, VolumeX, MessageSquareQuote, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const VoiceNotification = () => {
    const { socket } = useSocket();
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [isListening, setIsListening] = useState(false);

    // Voice Settings State
    const [voiceSettings, setVoiceSettings] = useState({
        lang: localStorage.getItem('voiceCommandLang') || 'English',
        gender: localStorage.getItem('voiceCommandGender') || 'Female'
    });

    const latestBookingIdRef = useRef(null);
    const recognitionRef = useRef(null);

    // Update settings when event is fired
    useEffect(() => {
        const handleSettingsUpdate = () => {
            setVoiceSettings({
                lang: localStorage.getItem('voiceCommandLang') || 'English',
                gender: localStorage.getItem('voiceCommandGender') || 'Female'
            });
        };
        window.addEventListener('voiceSettingsChanged', handleSettingsUpdate);
        return () => window.removeEventListener('voiceSettingsChanged', handleSettingsUpdate);
    }, []);

    const getMessage = (customerName, services) => {
        const { lang } = voiceSettings;
        switch (lang) {
            case 'Hindi':
                return `${customerName} se naya appointment request aaya hai ${services} ke liye. Confirm karne ke liye Accept bolein.`;
            case 'Marathi':
                return `${customerName} कडून ${services} साठी नवीन अपॉईंटमेंट विनंती आली आहे. पुष्टी करण्यासाठी Accept म्हणा.`;
            case 'Hindi English':
                return `New booking from ${customerName} for ${services}. Accept bolein to confirm.`;
            case 'Marathi English':
                return `New booking from ${customerName} for ${services}. Accept mhana to confirm.`;
            default:
                return `New appointment request from ${customerName} for ${services}. Say accept to confirm.`;
        }
    };

    const getAcceptConfirmation = () => {
        const { lang } = voiceSettings;
        switch (lang) {
            case 'Hindi': return "Appointmnet manzoor ho gaya hai.";
            case 'Marathi': return "अपॉईंटमेंट स्वीकारली गेली आहे.";
            default: return "Booking accepted successfully.";
        }
    };

    const getErrorConfirmation = () => {
        const { lang } = voiceSettings;
        switch (lang) {
            case 'Hindi': return "Maaf kijiye, error aa gaya.";
            case 'Marathi': return "क्षमस्व, एरर आली आहे.";
            default: return "Failed to accept booking.";
        }
    };

    const speak = useCallback((text, callback) => {
        if (!isAudioEnabled) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const { lang, gender } = voiceSettings;

        // Find best voice match
        let preferredVoice;

        // Language filter
        const langCode = lang === 'Hindi' ? 'hi-IN' : (lang === 'Marathi' ? 'mr-IN' : 'en-IN');
        let filteredVoices = voices.filter(v => v.lang.includes(langCode) || v.lang.includes('hi-IN')); // fallback to Hindi for Marathi

        if (filteredVoices.length === 0) filteredVoices = voices.filter(v => v.lang.includes('en-IN') || v.lang.includes('en-GB'));

        // Gender filter (heuristic based on name)
        const isMaleTarget = gender === 'Male';
        preferredVoice = filteredVoices.find(v => {
            const name = v.name.toLowerCase();
            return isMaleTarget ?
                (name.includes('male') || name.includes('david') || name.includes('google inc.') && name.includes('hindi')) :
                (name.includes('female') || name.includes('heera') || name.includes('zira') || name.includes('google inc.') && name.includes('hindi'));
        }) || filteredVoices[0];

        if (preferredVoice) utterance.voice = preferredVoice;

        if (callback) {
            utterance.onend = () => {
                clearTimeout(fallbackTimeout);
                callback();
            };
            const fallbackTimeout = setTimeout(() => {
                console.warn("SpeechSynthesis onend fallback triggered");
                callback();
            }, 15000);
        }

        window.speechSynthesis.speak(utterance);
    }, [isAudioEnabled, voiceSettings]);

    const acceptBooking = async (id) => {
        try {
            console.log("🚀 Attempting to accept booking via voice:", id);
            await api.put(`/api/booking/accept/${id}`);
            speak(getAcceptConfirmation());
            latestBookingIdRef.current = null;
        } catch (err) {
            console.error('❌ Failed to accept booking via voice:', err);
            speak(getErrorConfirmation());
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

        // Dynamic recognition language
        const { lang } = voiceSettings;
        if (lang === 'Hindi' || lang === 'Hindi English') recognition.lang = 'hi-IN';
        else if (lang === 'Marathi' || lang === 'Marathi English') recognition.lang = 'mr-IN';
        else recognition.lang = 'en-IN';

        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            console.log(`🎤 Voice recognition started (${recognition.lang})...`);
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

            // Expanded command list for multi-language support
            const acceptCommands = [
                'accept', 'confirm', 'yes', 'okay', 'ok', 'accept request',
                'haan', 'ha', 'manzoor', 'thik hai', 'done',
                'ho', 'ala', 'mazur' // Marathi equivalents
            ];
            const isMatch = acceptCommands.some(cmd => transcript.includes(cmd));

            if (isMatch) {
                const bookingId = latestBookingIdRef.current;
                if (bookingId) {
                    acceptBooking(bookingId);
                }
            } else {
                console.warn("🤔 Recognized speech did not match any accept command.");
            }
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
            setTimeout(() => {
                if (recognitionRef.current) recognitionRef.current.stop();
            }, 20000);
        } catch (e) {
            console.error("Failed to start speech recognition:", e);
        }
    }, [isAudioEnabled, voiceSettings]);

    useEffect(() => {
        if (!socket) return;

        const handleNewBooking = (data) => {
            console.log("📢 Received new_booking for voice:", data);
            const customerName = data.customerName || "a customer";
            const services = data.services?.map(s => s.name).join(", ") || "services";
            const bookingId = data.bookingId;

            if (!bookingId) return;

            latestBookingIdRef.current = bookingId;

            const message = getMessage(customerName, services);

            speak(message, () => {
                if (bookingId) {
                    setTimeout(startListening, 500);
                }
            });
        };

        socket.on('new_booking', handleNewBooking);

        return () => {
            socket.off('new_booking', handleNewBooking);
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, [socket, speak, startListening, voiceSettings]);

    const toggleAudio = () => {
        if (!isAudioEnabled) {
            const { lang } = voiceSettings;
            const welcomeMsg = lang === 'Hindi' ? "Voice control on hai. Main sun rahi hoon." :
                (lang === 'Marathi' ? "व्हॉइस कंट्रोल सुरू आहे. मी ऐकत आहे." :
                    "Voice controls enabled. I am listening.");

            const utterance = new SpeechSynthesisUtterance(welcomeMsg);
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
