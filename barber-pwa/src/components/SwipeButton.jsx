import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

const SwipeButton = ({ onSwipe, title = "Slide to Confirm", color = "#6366F1" }) => {
    const [isComplete, setIsComplete] = useState(false);
    const containerRef = useRef(null);
    const x = useMotionValue(0);
    const controls = useAnimation();

    // Get container width
    const [containerWidth, setContainerWidth] = useState(0);
    useEffect(() => {
        if (containerRef.current) {
            setContainerWidth(containerRef.current.offsetWidth);
        }
    }, []);

    const handleDragEnd = (event, info) => {
        const threshold = containerWidth - 64 - 10; // 64 is button width, 10 is padding
        if (info.offset.x >= threshold) {
            setIsComplete(true);
            onSwipe();
            controls.start({ x: threshold });
        } else {
            controls.start({ x: 0 });
        }
    };

    const opacity = useTransform(x, [0, containerWidth - 74], [1, 0]);

    return (
        <div
            ref={containerRef}
            className="relative h-16 w-full bg-gray-100 rounded-[24px] p-2 overflow-hidden flex items-center"
        >
            <motion.div
                style={{ opacity }}
                className="absolute inset-0 flex items-center justify-center font-black text-[12px] uppercase tracking-[0.2em] text-gray-400 pointer-events-none"
            >
                {title}
            </motion.div>

            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: containerWidth - 74 }}
                dragElastic={0}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                animate={controls}
                style={{
                    x,
                    backgroundColor: color
                }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg cursor-grab active:cursor-grabbing z-10 transition-colors ${isComplete ? 'bg-emerald-500' : ''}`}
            >
                {isComplete ? <Check size={20} /> : <ArrowRight size={20} />}
            </motion.div>

            {isComplete && (
                <div className="absolute inset-0 bg-emerald-500 flex items-center justify-center font-black text-[12px] uppercase tracking-[0.2em] text-white">
                    Completed
                </div>
            )}
        </div>
    );
};

export default SwipeButton;
