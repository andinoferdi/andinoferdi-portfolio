"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { assetPreloader } from "@/services/asset-preloader";

interface LoadingScreenProps {
  onComplete?: () => void;
}

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing...");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const loadAssets = async () => {
      const loadingSteps = [
        { text: "Loading images...", progress: 20 },
        { text: "Preloading audio...", progress: 40 },
        { text: "Caching assets...", progress: 60 },
        { text: "Finalizing...", progress: 80 },
        { text: "Ready!", progress: 100 },
      ];

      try {
        setLoadingText("Preloading assets...");
        setProgress(10);

        const result = await assetPreloader.preloadAllAssets();

        for (const step of loadingSteps) {
          setLoadingText(step.text);
          setProgress(step.progress);
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        if (result.errors.length > 0) {
          console.warn("Some assets failed to load:", result.errors);
        }

        setIsComplete(true);
        
        setTimeout(() => {
          onComplete?.();
        }, 500);

      } catch (error) {
        console.warn("Asset preloading failed:", error);
        setLoadingText("Loading complete");
        setProgress(100);
        setIsComplete(true);
        
        setTimeout(() => {
          onComplete?.();
        }, 500);
      }
    };

    loadAssets();
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      >
        <div className="flex flex-col items-center space-y-8 max-w-md mx-auto px-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-background border-t-transparent rounded-full"
              />
            </div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="absolute -inset-2 rounded-full bg-gradient-to-r from-primary/20 to-primary/10"
            />
          </motion.div>

          <div className="text-center space-y-4">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-2xl font-bold text-foreground"
            >
              Andino Ferdiansah
            </motion.h1>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-muted-foreground"
            >
              {loadingText}
            </motion.p>
          </div>

          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Loading</span>
              <span>{progress}%</span>
            </div>
            
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full bg-gradient-to-r from-primary to-primary/80",
                  isComplete && "from-green-500 to-green-400"
                )}
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="flex space-x-1"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-2 h-2 rounded-full bg-primary"
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
