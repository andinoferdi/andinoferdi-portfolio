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
  // offsets between -16..16 px
  const x = (Math.floor(s / 10) % 33) - 16;
  const y = (Math.floor(s / 100) % 33) - 16;
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

  const jitters = useMemo(
    () => profiles.map((p, i) => getJitter(p?.src || String(i), i)),
    [profiles]
  );

  const handleNext = useCallback(() => {
    setActive((prev) => (prev + 1) % profiles.length);
  }, [profiles.length]);

  const handlePrev = useCallback(() => {
    setActive((prev) => (prev - 1 + profiles.length) % profiles.length);
  }, [profiles.length]);

  useEffect(() => {
    if (autoplay) {
      const interval = setInterval(handleNext, 5000);
      return () => clearInterval(interval);
    }
  }, [autoplay, handleNext]);

  return (
    <div className="mx-auto max-w-sm px-4 py-20 font-sans antialiased md:max-w-4xl md:px-8 lg:px-12">
      <div className="relative grid grid-cols-1 gap-20 md:grid-cols-2">
        <div>
          <div className="relative h-80 w-full transform-gpu isolate">
            {profiles.map((profile, index) => (
              <motion.div
                key={profile.src}
                initial={false}
                animate={{
                  opacity: index === active ? 1 : 0.65,
                  scale: index === active ? 1 : 0.96,
                  rotate: index === active ? 0 : jitters[index].angle,
                  x: index === active ? 0 : jitters[index].x,
                  y: index === active ? 0 : jitters[index].y,
                  zIndex: index === active ? 40 : profiles.length + 2 - index,
                }}
                transition={
                  prefersReduced
                    ? { duration: 0 }
                    : { type: "tween", duration: 0.24, ease: "easeOut" }
                }
                className="absolute inset-0 origin-bottom transform-gpu pointer-events-none select-none will-change-transform [backface-visibility:hidden]"
                style={{
                  willChange:
                    index === active
                      ? "transform,opacity"
                      : "transform,opacity",
                }}
              >
                <Image
                  src={profile.src || "/placeholder.svg"}
                  alt={profile.name}
                  width={500}
                  height={500}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={index === active}
                  draggable={false}
                  className="h-full w-full rounded-3xl object-cover object-center"
                />
              </motion.div>
            ))}
          </div>
        </div>
        <div className="flex flex-col py-4 h-full">
          <motion.div
            key={active}
            initial={false}
            animate={prefersReduced ? { opacity: 1 } : { opacity: [0.92, 1] }}
            transition={
              prefersReduced
                ? { duration: 0 }
                : { duration: 0.18, ease: "easeOut" }
            }
            className="flex-1"
          >
            <h3 className="text-2xl font-bold text-black dark:text-white">
              {profiles[active].name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-neutral-500">
              {profiles[active].designation}
            </p>
            <motion.p className="mt-8 text-lg text-gray-500 dark:text-neutral-300">
              {profiles[active].quote}
            </motion.p>
          </motion.div>
          <div className="flex gap-4 justify-center mt-8 md:mt-12">
            <button
              onClick={handlePrev}
              className="group/button flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <IconArrowLeft className="h-4 w-4 md:h-5 md:w-5 text-black transition-transform duration-300 group-hover/button:rotate-12 dark:text-neutral-400" />
            </button>
            <button
              onClick={handleNext}
              className="group/button flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <IconArrowRight className="h-4 w-4 md:h-5 md:w-5 text-black transition-transform duration-300 group-hover/button:-rotate-12 dark:text-neutral-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
