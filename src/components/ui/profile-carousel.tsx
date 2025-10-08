"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState, useCallback, useMemo } from "react";

type Profile = {
  quote: string;
  name: string;
  designation: string;
  src: string;
};

// Deterministic hash so server/client produce the same offsets (no Math.random)
function seededHash(input: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function getJitter(seedStr: string, idx: number) {
  const s = seededHash(`${seedStr}-${idx}`);
  // angles between -10..10 but avoid too close to 0 to feel "acak"
  let angle = (s % 21) - 10;
  if (Math.abs(angle) < 3) angle = angle < 0 ? -5 : 5;
  
  // Bias ke kiri: 70% chance untuk offset negatif (kiri), 30% untuk positif (kanan)
  const xSeed = Math.floor(s / 10) % 100;
  let x;
  if (xSeed < 70) {
    // 70% chance untuk offset kiri (-20 to -5)
    x = -5 - Math.floor((xSeed / 70) * 15);
  } else {
    // 30% chance untuk offset kanan (5 to 20)
    x = 5 + Math.floor(((xSeed - 70) / 30) * 15);
  }
  
  // Y offset tetap random tapi lebih kecil
  const y = (Math.floor(s / 100) % 21) - 10;
  return { angle, x, y };
}

export const ProfileCarousel = ({
  profiles,
  autoplay = false,
}: {
  profiles: Profile[];
  autoplay?: boolean;
}) => {
  const [active, setActive] = useState(0);
  const prefersReduced = useReducedMotion();

  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq =
      typeof window !== "undefined"
        ? window.matchMedia("(max-width: 768px)")
        : null;
    const update = () => setIsNarrow(!!mq?.matches);
    update();
    mq?.addEventListener?.("change", update);
    return () => mq?.removeEventListener?.("change", update);
  }, []);

  const jitters = useMemo(
    () => profiles.map((p, i) => getJitter(p?.src || String(i), i)),
    [profiles]
  );
  const amplitude = isNarrow ? 0.6 : 1;
  const angleAmp = isNarrow ? 0.8 : 1;

  const handleNext = useCallback(() => {
    setActive((prev) => (prev + 1) % profiles.length);
  }, [profiles.length]);

  const handlePrev = useCallback(() => {
    setActive((prev) => (prev - 1 + profiles.length) % profiles.length);
  }, [profiles.length]);

  // NOTE: autoplay kept for API completeness, but hero-section no longer passes it.
  useEffect(() => {
    if (autoplay) {
      const interval = setInterval(handleNext, 5000);
      return () => clearInterval(interval);
    }
  }, [autoplay, handleNext]);

  return (
    <div className="mx-auto max-w-sm px-4 py-12 md:py-20 font-sans antialiased md:max-w-4xl md:px-8 lg:px-12">
      <div className="relative grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-20">
        <div>
          <div className="relative h-72 md:h-80 w-full max-w-[20rem] md:max-w-none mx-auto transform-gpu isolate overflow-visible">
            {profiles.map((profile, index) => {
              const j = jitters[index];
              const offX = index === active ? 0 : Math.round(j.x * amplitude);
              const offY = index === active ? 0 : Math.round(j.y * amplitude);
              const rot = index === active ? 0 : j.angle * angleAmp;

              return (
                <motion.div
                  key={profile.src}
                  initial={false}
                  animate={{
                    opacity: index === active ? 1 : 0.65,
                    scale: index === active ? 1 : 0.965,
                    rotate: rot,
                    x: offX,
                    y: offY,
                    zIndex: index === active ? 40 : profiles.length + 2 - index,
                  }}
                  transition={
                    prefersReduced
                      ? { duration: 0 }
                      : { type: "tween", duration: 0.22, ease: "easeOut" }
                  }
                  className="absolute inset-0 origin-bottom transform-gpu pointer-events-none select-none will-change-transform [backface-visibility:hidden]"
                  style={{ willChange: "transform,opacity" }}
                >
                  <Image
                    src={profile.src || "/placeholder.svg"}
                    alt={profile.name}
                    width={500}
                    height={500}
                    sizes="(max-width: 768px) 90vw, 50vw"
                    priority={index === active}
                    draggable={false}
                    className="h-full w-full rounded-3xl object-cover object-center"
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col py-2 h-full">
          <motion.div
            key={active}
            initial={false}
            animate={prefersReduced ? { opacity: 1 } : { opacity: [0.92, 1] }}
            transition={
              prefersReduced
                ? { duration: 0 }
                : { duration: 0.18, ease: "easeOut" }
            }
            className="flex-1 text-center md:text-left"
          >
            <h3 className="text-2xl font-bold text-black dark:text-white">
              {profiles[active].name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-neutral-500">
              {profiles[active].designation}
            </p>
            <motion.p className="mt-6 md:mt-8 text-base md:text-lg text-gray-500 dark:text-neutral-300">
              {profiles[active].quote}
            </motion.p>
          </motion.div>

          <div className="flex gap-4 justify-center md:justify-start mt-8 md:mt-12">
            <button
              onClick={handlePrev}
              aria-label="Previous profile"
              className="group/button flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <IconArrowLeft className="h-4 w-4 md:h-5 md:w-5 text-black transition-transform duration-300 group-hover/button:rotate-12 dark:text-neutral-400" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next profile"
              className="group/button flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <IconArrowRight className="h-4 w-4 md:h-5 md:w-5 text-black transition-transform duration-300 group-hover/button:-rotate-12 dark:text-neutral-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
