import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface BrandIntroProps {
  onComplete: () => void;
}

export const BrandIntro: React.FC<BrandIntroProps> = ({ onComplete }) => {
  const shouldReduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-advance after 2.2s
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        sessionStorage.setItem('wastewise_intro_seen', 'true');
        onComplete();
      }, 400); // Wait for exit animation
    }, 2200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleSkip = () => {
    setIsVisible(false);
    sessionStorage.setItem('wastewise_intro_seen', 'true');
    onComplete();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#12523C] text-white px-6 select-none"
          role="dialog"
          aria-label="WasteWise AI Introduction"
        >
          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="absolute top-6 right-8 text-xs tracking-wider text-emerald-200/60 hover:text-white transition-colors duration-200 px-3 py-1.5 rounded border border-white/10 hover:border-white/30"
          >
            Skip intro
          </button>

          {/* Central Reveal */}
          <div className="flex flex-col items-center max-w-2xl text-center">
            {/* Wordmark */}
            <motion.h1
              initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.75, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl sm:text-7xl font-bold tracking-tight text-white mb-2"
              style={{ letterSpacing: '-0.03em' }}
            >
              WASTEWISE AI
            </motion.h1>

            {/* Botanical Abstract Line Stroke */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 0.6 }}
              transition={{ duration: 0.7, delay: 0.55, ease: 'easeOut' }}
              className="w-32 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-300 to-transparent my-4"
            />

            {/* Tagline Statement */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7, ease: 'easeOut' }}
              className="text-emerald-100/90 text-sm sm:text-base font-normal tracking-wide"
            >
              Predict smarter. Prepare better. Waste less.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="mt-6 text-xs uppercase tracking-widest text-emerald-200/60 font-medium"
            >
              ADAPPT 5.0 · FoodTech Operations
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
