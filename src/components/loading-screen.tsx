"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Spotlight } from "@/components/ui/spotlight-new";
import { HoverBorderGradient } from "@/components/ui/hover-border-button";
import { Download, Music, Image, FileText, Play } from "lucide-react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAsset, setCurrentAsset] = useState("");
  const [showStartButton, setShowStartButton] = useState(false);

  const assets = useMemo(() => [
    { name: "Profile Images", icon: Image, count: 4 },
    { name: "Project Screenshots", icon: Image, count: 4 },
    { name: "Music Tracks", icon: Music, count: 4 },
    { name: "Music Covers", icon: Image, count: 4 },
    { name: "CV Document", icon: FileText, count: 1 },
    { name: "Logo Assets", icon: Image, count: 1 },
  ], []);

  const totalAssets = assets.reduce((sum, asset) => sum + asset.count, 0);

  useEffect(() => {
    let currentProgress = 0;
    let assetIndex = 0;
    let assetProgress = 0;

    const interval = setInterval(() => {
      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsLoading(false);
          setShowStartButton(true);
        }, 500);
        return;
      }

      const increment = Math.random() * 2 + 0.5;
      currentProgress = Math.min(currentProgress + increment, 100);
      setProgress(Math.floor(currentProgress));

      const currentAssetTotal = assets[assetIndex]?.count || 0;
      const assetProgressIncrement = (increment / totalAssets) * currentAssetTotal;
      assetProgress += assetProgressIncrement;

      if (assetProgress >= currentAssetTotal && assetIndex < assets.length - 1) {
        assetIndex++;
        assetProgress = 0;
      }

      if (assetIndex < assets.length) {
        setCurrentAsset(assets[assetIndex].name);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [assets, totalAssets]);

  const handleStart = () => {
    setShowStartButton(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
        >
          <Spotlight
            gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(210, 100%, 85%, .12) 0, hsla(210, 100%, 55%, .06) 50%, hsla(210, 100%, 45%, 0) 80%)"
            gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .08) 0, hsla(210, 100%, 55%, .04) 80%, transparent 100%)"
            gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .06) 0, hsla(210, 100%, 45%, .03) 80%, transparent 100%)"
            translateY={-200}
            width={400}
            height={800}
            smallWidth={200}
            duration={8}
            xOffset={50}
          />

          <div className="relative z-10 text-center max-w-md mx-auto px-6">
            <div className="flex flex-col items-center justify-center space-y-8">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-center"
              >
                <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-2">
                  Loading
                </h1>
                <p className="text-lg text-muted-foreground">
                  Preparing your experience...
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="w-full max-w-sm"
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Download className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {currentAsset}
                  </span>
                </div>

                <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>

                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground">
                    {progress}%
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {totalAssets} assets
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="grid grid-cols-2 gap-3 w-full"
              >
              {assets.map((asset, index) => {
                const Icon = asset.icon;
                const isActive = currentAsset === asset.name;
                const isCompleted = assets.findIndex(a => a.name === currentAsset) > index;

                return (
                  <motion.div
                    key={asset.name}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border transition-all duration-300",
                      isActive
                        ? "border-primary bg-primary/10"
                        : isCompleted
                        ? "border-green-500 bg-green-500/10"
                        : "border-border bg-muted/50"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isActive
                          ? "text-primary"
                          : isCompleted
                          ? "text-green-500"
                          : "text-muted-foreground"
                      )}
                    />
                    <div className="text-left">
                      <p
                        className={cn(
                          "text-xs font-medium",
                          isActive
                            ? "text-primary"
                            : isCompleted
                            ? "text-green-500"
                            : "text-muted-foreground"
                        )}
                      >
                        {asset.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {asset.count} files
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      {showStartButton && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
        >
          <Spotlight
            gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(210, 100%, 85%, .12) 0, hsla(210, 100%, 55%, .06) 50%, hsla(210, 100%, 45%, 0) 80%)"
            gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .08) 0, hsla(210, 100%, 55%, .04) 80%, transparent 100%)"
            gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .06) 0, hsla(210, 100%, 45%, .03) 80%, transparent 100%)"
            translateY={-200}
            width={400}
            height={800}
            smallWidth={200}
            duration={8}
            xOffset={50}
          />

          <div className="relative z-10 text-center max-w-md mx-auto px-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center justify-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center"
              >
                <Play className="h-8 w-8 text-primary-foreground ml-1" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
                className="text-4xl md:text-6xl font-bold text-foreground text-center"
              >
                Ready!
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
                className="text-lg text-muted-foreground text-center"
              >
                All assets loaded successfully
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
                className="flex justify-center"
              >
                <HoverBorderGradient
                  as="button"
                  onClick={handleStart}
                  containerClassName="rounded-full"
                  className="flex items-center justify-center gap-2 px-8 py-3 text-lg font-medium"
                >
                  <Play className="h-5 w-5" />
                  Start Experience
                </HoverBorderGradient>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
