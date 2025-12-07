import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

const ParallaxBackground: React.FC = () => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end end"]
    });

    // Smooth out the scroll progress
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Define different movement speeds for parallax layers
    // Define different movement speeds for parallax layers
    const y1 = useTransform(smoothProgress, [0, 1], [0, -400]);
    const y2 = useTransform(smoothProgress, [0, 1], [0, -250]);
    const y3 = useTransform(smoothProgress, [0, 1], [0, -800]);
    const rotate1 = useTransform(smoothProgress, [0, 1], [0, 90]);
    const rotate2 = useTransform(smoothProgress, [0, 1], [0, -90]);

    return (
        <div ref={ref} className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Layer 1: Slow moving large blob (Top Left) */}
            <motion.div
                style={{ y: y2, rotate: rotate1 }}
                className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-sapphire-400/20 blur-[100px]"
            />

            {/* Layer 2: Fast moving medium blob (Center Right) */}
            <motion.div
                style={{ y: y3, rotate: rotate2 }}
                className="absolute top-[30%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-purple-400/20 blur-[90px]"
            />

            {/* Layer 3: Medium speed blob (Bottom Left) */}
            <motion.div
                style={{ y: y1 }}
                className="absolute bottom-[10%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-sapphire-600/15 blur-[70px]"
            />

            {/* Layer 4: Subtle accent (Top Right) */}
            <motion.div
                style={{ y: y2 }}
                className="absolute top-[10%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-indigo-400/20 blur-[60px]"
            />
        </div>
    );
};

export default ParallaxBackground;
