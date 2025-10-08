"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useCallback, useMemo } from "react";

type Profile = {
  quote: string;
  name: string;
  designation: string;
  src: string;
};

export const ProfileCarousel = ({
  profiles,
}: {
  profiles: Profile[];
}) => {
  const [active, setActive] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActive((prev) => (prev + 1) % profiles.length);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [profiles.length, isTransitioning]);

  const handlePrev = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActive((prev) => (prev - 1 + profiles.length) % profiles.length);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [profiles.length, isTransitioning]);


  const randomRotateY = useMemo(() => {
    const rotations = [-8, -4, 0, 4, 8, -6, 2, -2, 6, -6];
    return (index: number) => rotations[index % rotations.length];
  }, []);


  const currentProfile = profiles[active];

  return (
    <div className="mx-auto max-w-sm px-4 py-20 font-sans antialiased md:max-w-4xl md:px-8 lg:px-12">
      <div className="relative grid grid-cols-1 gap-20 md:grid-cols-2">
        <div>
          <div className="relative h-80 w-full overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{
                  opacity: 0,
                  scale: 0.95,
                  rotateY: randomRotateY(active),
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotateY: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  rotateY: randomRotateY(active),
                }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="absolute inset-0"
                style={{
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                }}
              >
                <Image
                  src={currentProfile.src}
                  alt={currentProfile.name}
                  width={500}
                  height={500}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={active === 0}
                  draggable={false}
                  className="h-full w-full rounded-3xl object-cover object-center"
                  onError={() => {
                    console.warn(`Failed to load profile image: ${currentProfile.src}`);
                  }}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        
        <div className="flex flex-col py-4 h-full">
          <motion.div
            key={active}
            initial={{
              y: 15,
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            transition={{
              duration: 0.25,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="flex-1"
          >
            <h3 className="text-2xl font-bold text-black dark:text-white">
              {currentProfile.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-neutral-500">
              {currentProfile.designation}
            </p>
            <motion.p className="mt-8 text-lg text-gray-500 dark:text-neutral-300">
              {currentProfile.quote.split(" ").map((word, index) => (
                <motion.span
                  key={index}
                  initial={{
                    opacity: 0,
                    y: 3,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.15,
                    ease: "easeOut",
                    delay: 0.01 * index,
                  }}
                  className="inline-block"
                >
                  {word}&nbsp;
                </motion.span>
              ))}
            </motion.p>
          </motion.div>
          
          <div className="flex gap-4 justify-center mt-8 md:mt-12">
            <button
              onClick={handlePrev}
              disabled={isTransitioning}
              className="group/button flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconArrowLeft className="h-4 w-4 md:h-5 md:w-5 text-black transition-transform duration-200 group-hover/button:rotate-12 dark:text-neutral-400" />
            </button>
            <button
              onClick={handleNext}
              disabled={isTransitioning}
              className="group/button flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconArrowRight className="h-4 w-4 md:h-5 md:w-5 text-black transition-transform duration-200 group-hover/button:-rotate-12 dark:text-neutral-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
