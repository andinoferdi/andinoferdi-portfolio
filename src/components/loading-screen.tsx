"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Spotlight } from "@/components/ui/spotlight-new";
import { HoverBorderGradient } from "@/components/ui/hover-border-button";
import { Download, Music, Image as ImageIcon, FileText, Play } from "lucide-react";
import { getProjectsData } from "@/services/projects";
import { getProfileData } from "@/services/profile";
import { getOriginalTracks } from "@/services/music";
import { getExperienceData } from "@/services/journey";
import { getGalleryData } from "@/services/gallery";

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAsset, setCurrentAsset] = useState("");
  const [showStartButton, setShowStartButton] = useState(false);

  const assets = useMemo(() => {
    const projectsData = getProjectsData();
    const profileData = getProfileData();
    const musicData = getOriginalTracks();
    const experienceData = getExperienceData();
    const galleryData = getGalleryData();

    const imageAssets = [
      ...profileData.profiles.map(p => p.src),
      ...projectsData.projects.map(p => p.image),
      ...musicData.map(m => m.coverImage),
      ...galleryData.items.map(g => g.src),
      ...experienceData.experiences.filter(exp => exp.logo).map(exp => exp.logo!),
    ];

    const audioAssets = musicData.map(m => m.audioUrl);
    const documentAssets = [profileData.cvDownload.url];

    return [
      { 
        name: "Images", 
        icon: ImageIcon, 
        count: imageAssets.length,
        description: "Loading images",
        assets: imageAssets
      },
      { 
        name: "Audio", 
        icon: Music, 
        count: audioAssets.length,
        description: "Loading audio files",
        assets: audioAssets
      },
      { 
        name: "Documents", 
        icon: FileText, 
        count: documentAssets.length,
        description: "Loading documents",
        assets: documentAssets
      },
    ];
  }, []);

  const totalAssets = assets.reduce((sum, asset) => sum + asset.count, 0);

  useEffect(() => {
    const preloadAssets = async () => {
      const allPromises: Promise<void>[] = [];

      for (const assetGroup of assets) {
        for (const assetUrl of assetGroup.assets) {
          if (assetGroup.name === "Images") {
            const promise = new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = assetUrl;
            });
            allPromises.push(promise);
          } else if (assetGroup.name === "Audio") {
            const promise = new Promise<void>((resolve) => {
              const audio = new Audio();
              audio.oncanplaythrough = () => resolve();
              audio.onerror = () => resolve();
              audio.preload = "metadata";
              audio.src = assetUrl;
            });
            allPromises.push(promise);
          } else if (assetGroup.name === "Documents") {
            const promise = fetch(assetUrl, { method: "HEAD" })
              .then(() => {})
              .catch(() => {});
            allPromises.push(promise);
          }
        }
      }

      const totalAssets = allPromises.length;
      let loadedAssets = 0;

      const updateProgress = () => {
        loadedAssets++;
        const progress = Math.floor((loadedAssets / totalAssets) * 100);
        setProgress(progress);

        const progressPerAsset = 100 / assets.length;
        const currentAssetIndex = Math.floor(progress / progressPerAsset);
        if (currentAssetIndex < assets.length) {
          setCurrentAsset(assets[currentAssetIndex].name);
        }
      };

      allPromises.forEach(promise => {
        promise.then(updateProgress);
      });

      Promise.allSettled(allPromises).then(() => {
        setProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          setShowStartButton(true);
        }, 500);
      });
    };

    preloadAssets();
  }, [assets]);

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
