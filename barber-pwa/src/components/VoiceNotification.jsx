import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Volume2, VolumeX, MessageSquareQuote, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const VoiceNotification = () => {
    const { socket } = useSocket();
    const [isAudioEnabled, setIsAudioEnabled] = useState(localStorage.getItem('voiceControlEnabled') === 'true');
    const [isListening, setIsListening] = useState(false);

    // Voice Settings State
    const [voiceSettings, setVoiceSettings] = useState({
        lang: localStorage.getItem('voiceCommandLang') || 'English'
    });

    const latestBookingIdRef = useRef(null);
    const recognitionRef = useRef(null);
    const wakeLockRef = useRef(null);
    const silentAudioRef = useRef(null);

    // --- WAKE LOCK & BACKGROUND PERSISTENCE ---
    const requestWakeLock = useCallback(async () => {
        if (!isAudioEnabled) return; // Don't request if not enabled
        if ('wakeLock' in navigator) {
            try {
                // If we already have a lock, don't request another
                if (wakeLockRef.current) return;

                wakeLockRef.current = await navigator.wakeLock.request('screen');
                console.log('🔒 [VoiceNotification] Screen Wake Lock is active');

                wakeLockRef.current.addEventListener('release', () => {
                    console.log('🔓 [VoiceNotification] Screen Wake Lock was released');
                    wakeLockRef.current = null;
                });
            } catch (err) {
                console.warn(`⚠️ [VoiceNotification] Wake Lock Error: ${err.name}. This is normal if user hasn't clicked yet.`);
            }
        }
    }, [isAudioEnabled]);

    const releaseWakeLock = useCallback(async () => {
        if (wakeLockRef.current) {
            await wakeLockRef.current.release();
            wakeLockRef.current = null;
        }
    }, []);

    // Re-acquire wake lock when app becomes visible again
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && isAudioEnabled) {
                await requestWakeLock();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isAudioEnabled, requestWakeLock]);

    // Handle initial load and state changes
    useEffect(() => {
        if (isAudioEnabled) {
            requestWakeLock();
            // Also try to start silent audio (might fail until first interaction)
            if (silentAudioRef.current) {
                silentAudioRef.current.play().catch(() => {
                    console.log("🔉 [VoiceNotification] Background audio waiting for first user interaction...");
                });
            }
        } else {
            releaseWakeLock();
            if (silentAudioRef.current) silentAudioRef.current.pause();
        }
    }, [isAudioEnabled, requestWakeLock, releaseWakeLock]);

    // Log available voices when they change (browser load)
    useEffect(() => {
        const logVoices = () => {
            const v = window.speechSynthesis.getVoices();
            if (v.length > 0) {
                console.log("🔊 [VoiceNotification] All available system voices:",
                    v.map(voice => `${voice.name} (${voice.lang})`)
                );
            }
        };
        window.speechSynthesis.onvoiceschanged = logVoices;
        logVoices(); // Try immediately too
        return () => { window.speechSynthesis.onvoiceschanged = null; };
    }, []);

    // Update settings when event is fired
    useEffect(() => {
        const handleSettingsUpdate = () => {
            setVoiceSettings({
                lang: localStorage.getItem('voiceCommandLang') || 'English'
            });
        };
        window.addEventListener('voiceSettingsChanged', handleSettingsUpdate);
        return () => window.removeEventListener('voiceSettingsChanged', handleSettingsUpdate);
    }, []);

    const getMessage = (customerName, services) => {
        const { lang } = voiceSettings;
        switch (lang) {
            case 'Hindi':
                return `${customerName} se naya appointment request aaya hai ${services} ke liye. Confirm karne ke liye Haan bolein.`;
            case 'Marathi':
                return `${customerName} कडून ${services} साठी नवीन अपॉईंटमेंट विनंती आली आहे. पुष्टी करण्यासाठी हो म्हणा.`;
            default:
                return `New appointment request from ${customerName} for ${services}. Say yes to confirm.`;
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

    const getWelcomeMessage = () => {
        const { lang } = voiceSettings;
        switch (lang) {
            case 'Hindi': return "ऑडियो सूचनाएं सक्षम की गई हैं।";
            case 'Marathi': return "ऑडिओ सूचना सक्षम केल्या आहेत.";
            default: return "Audio notifications enabled.";
        }
    };

    const speak = useCallback((text, callback, force = false) => {
        if (!isAudioEnabled && !force) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const { lang } = voiceSettings;

        // Find best voice match
        let preferredVoice;

        // Language filter
        const langCode = lang === 'Hindi' ? 'hi-IN' : (lang === 'Marathi' ? 'mr-IN' : 'en-IN');
        let filteredVoices = voices.filter(v => v.lang.includes(langCode) || v.lang.includes('hi-IN')); // fallback to Hindi for Marathi

        if (filteredVoices.length === 0) filteredVoices = voices.filter(v => v.lang.includes('en-IN') || v.lang.includes('en-GB'));

        // Log available voices once to help debug if needed
        if (window.speechSynthesis.getVoices().length > 0) {
            console.log("🔊 [VoiceNotification] Available voices:",
                voices.map(v => `${v.name} (${v.lang})`)
            );
        }

        // Pick the first available voice for the language
        preferredVoice = filteredVoices[0];

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
            console.log(`🎤 [VoiceNotification] Mic ACTIVE (${recognition.lang}). Waiting for commands...`);
            setIsListening(true);
        };
        recognition.onend = () => {
            console.log("🎤 [VoiceNotification] Mic DEACTIVATED.");
            setIsListening(false);
        };
        recognition.onerror = (event) => {
            console.error("🎤 [VoiceNotification] Mic Error:", event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                console.warn("🎤 [VoiceNotification] Permission denied. Please allow microphone access.");
            }
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase().trim();
            console.log('🎤 [VoiceNotification] Result:', transcript);

            // Expanded command list for multi-language support
            const acceptCommands = [
                'yes', 'yeah', 'yup', 'haan', 'ha', 'ho'
            ];
            const isMatch = acceptCommands.some(cmd => transcript.includes(cmd));

            if (isMatch) {
                const bookingId = latestBookingIdRef.current;
                console.log(`✅ [VoiceNotification] Match! Accepting booking: ${bookingId}`);
                if (bookingId) {
                    acceptBooking(bookingId);
                }
            } else {
                console.warn("🤔 [VoiceNotification] No match for:", transcript);
            }
        };

        recognitionRef.current = recognition;
        try {
            console.log("🎤 [VoiceNotification] Calling recognition.start()...");
            recognition.start();
            setTimeout(() => {
                if (recognitionRef.current && isListening) {
                    console.log("⏱️ [VoiceNotification] Listen timeout (20s). Stopping mic.");
                    recognitionRef.current.stop();
                }
            }, 20000);
        } catch (e) {
            console.error("🎤 [VoiceNotification] Failed to start recognition:", e);
        }
    }, [isAudioEnabled, voiceSettings, isListening]);

    useEffect(() => {
        if (!socket) return;

        const handleNewBooking = async (data) => {
            console.log("📢 [VoiceNotification] Received new_booking:", data);

            // Resume audio context on new booking (Chrome/Android safety)
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            }

            const customerName = data.customerName || "a customer";
            const services = data.services?.map(s => s.name).join(", ") || "services";
            const bookingId = data.bookingId;

            if (!bookingId) {
                console.error("📢 [VoiceNotification] Received new_booking without bookingId");
                return;
            }

            latestBookingIdRef.current = bookingId;
            const message = getMessage(customerName, services);

            console.log("📢 [VoiceNotification] Starting announcement speech...");
            speak(message, () => {
                console.log("📢 [VoiceNotification] Announcement finished. Delaying 500ms then starting mic...");
                if (bookingId) {
                    setTimeout(() => {
                        console.log("📢 [VoiceNotification] Triggering startListening now.");
                        startListening();
                    }, 500);
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
            const welcomeMsg = lang === 'Hindi' ? "Voice assistant chalu hai." :
                (lang === 'Marathi' ? "व्हॉइस असिस्टंट सुरू आहे." :
                    "Voice assistant active.");

            speak(welcomeMsg, null, true);
            setIsAudioEnabled(true);
            localStorage.setItem('voiceControlEnabled', 'true');

            if (silentAudioRef.current) {
                silentAudioRef.current.play().catch(e => console.warn("Background audio suppressed until interaction"));
            }
        } else {
            setIsAudioEnabled(false);
            localStorage.setItem('voiceControlEnabled', 'false');
            if (recognitionRef.current) recognitionRef.current.stop();
            if (silentAudioRef.current) {
                silentAudioRef.current.pause();
            }
            releaseWakeLock();
        }
    };

    return (
        <>
            {/* Hidden persistent heartbeat (Silence) */}
            <audio
                ref={silentAudioRef}
                loop
                src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
                style={{ display: 'none' }}
            />

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
