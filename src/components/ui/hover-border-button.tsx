"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT";

const GRADIENT_CONFIG = {
  light: {
    moving: {
      TOP: "radial-gradient(20.7% 50% at 50% 0%, hsl(0, 0%, 0%) 0%, rgba(0, 0, 0, 0) 100%)",
      LEFT: "radial-gradient(16.6% 43.1% at 0% 50%, hsl(0, 0%, 0%) 0%, rgba(0, 0, 0, 0) 100%)",
      BOTTOM: "radial-gradient(20.7% 50% at 50% 100%, hsl(0, 0%, 0%) 0%, rgba(0, 0, 0, 0) 100%)",
      RIGHT: "radial-gradient(16.2% 41.2% at 100% 50%, hsl(0, 0%, 0%) 0%, rgba(0, 0, 0, 0) 100%)",
    },
    highlight: "radial-gradient(75% 181.16% at 50% 50%, #3275F8 0%, rgba(0, 0, 0, 0) 100%)",
  },
  dark: {
    moving: {
      TOP: "radial-gradient(20.7% 50% at 50% 0%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
      LEFT: "radial-gradient(16.6% 43.1% at 0% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
      BOTTOM: "radial-gradient(20.7% 50% at 50% 100%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
      RIGHT: "radial-gradient(16.2% 41.2% at 100% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
    },
    highlight: "radial-gradient(75% 181.16% at 50% 50%, #3275F8 0%, rgba(255, 255, 255, 0) 100%)",
  },
};

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = "button",
  duration = 1,
  clockwise = true,
  ...props
}: React.PropsWithChildren<
  {
    as?: React.ElementType;
    containerClassName?: string;
    className?: string;
    duration?: number;
    clockwise?: boolean;
  } & React.HTMLAttributes<HTMLElement>
>) {
  const [hovered, setHovered] = useState<boolean>(false);
  const [direction, setDirection] = useState<Direction>("TOP");

  const rotateDirection = useCallback((currentDirection: Direction): Direction => {
    const directions: Direction[] = ["TOP", "LEFT", "BOTTOM", "RIGHT"];
    const currentIndex = directions.indexOf(currentDirection);
    const nextIndex = clockwise
      ? (currentIndex - 1 + directions.length) % directions.length
      : (currentIndex + 1) % directions.length;
    return directions[nextIndex];
  }, [clockwise]);

  useEffect(() => {
    if (!hovered) {
      const interval = setInterval(() => {
        setDirection((prevState) => rotateDirection(prevState));
      }, duration * 1000);
      return () => clearInterval(interval);
    }
  }, [hovered, duration, rotateDirection]);

  return (
    <Tag
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex rounded-full border content-center bg-black/20 hover:bg-black/10 transition duration-500 dark:bg-white/20 dark:hover:bg-white/10 items-center flex-col flex-nowrap gap-10 h-min justify-center overflow-visible p-px decoration-clone w-fit cursor-pointer",
        containerClassName
      )}
      {...props}
    >
      <div
        className={cn(
          "w-auto text-white dark:text-black z-10 bg-black dark:bg-white px-4 py-2 rounded-[inherit]",
          className
        )}
      >
        {children}
      </div>
      
      {/* Light mode gradient */}
      <motion.div
        className="flex-none inset-0 overflow-hidden absolute z-0 rounded-[inherit] dark:hidden"
        style={{
          filter: "blur(2px)",
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
        initial={{ background: GRADIENT_CONFIG.light.moving[direction] }}
        animate={{
          background: hovered
            ? [GRADIENT_CONFIG.light.moving[direction], GRADIENT_CONFIG.light.highlight]
            : GRADIENT_CONFIG.light.moving[direction],
        }}
        transition={{ ease: "linear", duration: duration ?? 1 }}
      />
      
      {/* Dark mode gradient */}
      <motion.div
        className="flex-none inset-0 overflow-hidden absolute z-0 rounded-[inherit] hidden dark:block"
        style={{
          filter: "blur(2px)",
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
        initial={{ background: GRADIENT_CONFIG.dark.moving[direction] }}
        animate={{
          background: hovered
            ? [GRADIENT_CONFIG.dark.moving[direction], GRADIENT_CONFIG.dark.highlight]
            : GRADIENT_CONFIG.dark.moving[direction],
        }}
        transition={{ ease: "linear", duration: duration ?? 1 }}
      />
      
      <div className="bg-black dark:bg-white absolute z-1 flex-none inset-[2px] rounded-[100px]" />
    </Tag>
  );
}
