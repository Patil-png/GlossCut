import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Volume2, VolumeX, MessageSquareQuote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VoiceNotification = () => {
    const { socket } = useSocket();
    const [isAudioEnabled, setIsAudioEnabled] = useState(localStorage.getItem('voiceControlEnabled') === 'true');
    const [voiceSettings, setVoiceSettings] = useState({
        lang: localStorage.getItem('voiceCommandLang') || 'English'
    });

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

    const getMessage = (customerName, services, status = 'pending') => {
        const { lang } = voiceSettings;
        const isConfirmed = status === 'confirmed';

        switch (lang) {
            case 'Hindi':
                return isConfirmed
                    ? `${customerName} ne ${services} ke liye booking confirm ki hai.`
                    : `${customerName} se naya appointment request aaya hai ${services} ke liye.`;
            case 'Marathi':
                return isConfirmed
                    ? `${customerName} ने ${services} साठी बुकिंग निश्चित केली आहे.`
                    : `${customerName} कडून ${services} साठी नवीन अपॉईंटमेंट विनंती आली आहे.`;
            default:
                return isConfirmed
                    ? `${customerName} has booked ${services} successfully.`
                    : `New appointment request from ${customerName} for ${services}.`;
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

        // Failsafe: Clear any stuck utterances before speaking
        window.speechSynthesis.cancel();

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

        // Small delay to allow state updates to settle (especially important for mobile)
        setTimeout(() => {
            window.speechSynthesis.speak(utterance);
        }, 100);
    }, [isAudioEnabled, voiceSettings]);


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
            const message = getMessage(customerName, services, data.status);

            console.log(`📢 [VoiceNotification] Preparing announcement: "${message}"`);

            if (!isAudioEnabled) {
                console.warn("📢 [VoiceNotification] Voice is DISABLED in settings. Announcement skipped.");
                return;
            }

            speak(message);
        };

        socket.on('new_booking', handleNewBooking);

        return () => {
            socket.off('new_booking', handleNewBooking);
        };
    }, [socket, speak, voiceSettings]);

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
                        <span>Tap to enable voice notifications</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default VoiceNotification;
