"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HoverBorderGradient } from "@/components/ui/hover-border-button";
import { Download, Image as ImageIcon, FileText, Play } from "lucide-react";
import { getProjectsData } from "@/services/projects";
import { getProfileData } from "@/services/profile";
import { getOriginalTracks } from "@/services/music";
import { getExperienceData } from "@/services/journey";
import { getGalleryData } from "@/services/gallery";
import { getCertificateData } from "@/services/certificate";
import { preloadImage, preloadDocument } from "@/services/preload";

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
    const certificateData = getCertificateData();

    const criticalImages = [
      ...profileData.profiles.map(p => p.src),
      ...projectsData.projects.slice(0, 3).map(p => p.image),
    ];

    const nonCriticalImages = [
      ...projectsData.projects.slice(3).map(p => p.image),
      ...musicData.map(m => m.coverImage),
      ...galleryData.items.map(g => g.src),
      ...experienceData.experiences.filter(exp => exp.logo).map(exp => exp.logo!),
      ...certificateData.certificates.map(c => c.image),
    ];

    const documentAssets = [profileData.cvDownload.url];

    return [
      { 
        name: "Critical Images", 
        icon: ImageIcon, 
        count: criticalImages.length,
        description: "Loading essential images",
        assets: criticalImages,
        priority: "high"
      },
      { 
        name: "Images", 
        icon: ImageIcon, 
        count: nonCriticalImages.length,
        description: "Loading images",
        assets: nonCriticalImages,
        priority: "low"
      },
      { 
        name: "Documents", 
        icon: FileText, 
        count: documentAssets.length,
        description: "Loading documents",
        assets: documentAssets,
        priority: "low"
      },
    ];
  }, []);


  useEffect(() => {
    // Lock body scroll when loading screen is active
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    const preloadAssets = async () => {
      const allPromises: Promise<void>[] = [];
      let loadedCount = 0;
      let totalCount = 0;

      for (const assetGroup of assets) {
        totalCount += assetGroup.assets.length;
      }

      for (const assetGroup of assets) {
        if (assetGroup.name === "Critical Images") {
          for (const assetUrl of assetGroup.assets) {
            const promise = preloadImage(assetUrl)
              .then(() => {
                loadedCount++;
                const progress = Math.floor((loadedCount / totalCount) * 100);
                setProgress(Math.min(progress, 99));
                setCurrentAsset(assetGroup.name);
              });
            allPromises.push(promise);
          }
          await Promise.all(allPromises);
          allPromises.length = 0;
        } else if (assetGroup.name === "Images") {
          const batchSize = 5;
          for (let i = 0; i < assetGroup.assets.length; i += batchSize) {
            const batch = assetGroup.assets.slice(i, i + batchSize);
            const batchPromises = batch.map(assetUrl => 
              preloadImage(assetUrl).then(() => {
                loadedCount++;
                const progress = Math.floor((loadedCount / totalCount) * 100);
                setProgress(Math.min(progress, 99));
                setCurrentAsset(assetGroup.name);
              })
            );
            await Promise.all(batchPromises);
          }
        } else if (assetGroup.name === "Documents") {
          for (const assetUrl of assetGroup.assets) {
            const promise = preloadDocument(assetUrl)
              .then(() => {
                loadedCount++;
                const progress = Math.floor((loadedCount / totalCount) * 100);
                setProgress(Math.min(progress, 99));
                setCurrentAsset(assetGroup.name);
              });
            allPromises.push(promise);
          }
        }
      }

      const forceCompleteTimeout = setTimeout(() => {
        console.warn('Force completing loading after 60s timeout');
        setProgress(100);
        setIsLoading(false);
        setShowStartButton(true);
      }, 60000);

      Promise.allSettled(allPromises).then(() => {
        clearTimeout(forceCompleteTimeout);
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-background overflow-hidden"
        >
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
                    Loading assets...
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-background overflow-hidden"
        >
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
