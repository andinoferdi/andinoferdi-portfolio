"use client";

import { useTheme } from "next-themes";
import Aurora from "./Aurora";
import { memo } from "react";

const ThemeAwareAurora = memo(function ThemeAwareAurora() {
  const { resolvedTheme } = useTheme();

  const colorStops = ["#1a1a2e", "#16213e", "#0f3460"]; 

  return (
    <Aurora 
      colorStops={colorStops}
      amplitude={1.0}
      blend={1}
      speed={0.5}
      opacity={resolvedTheme === "dark" ? 1.0 : 0.3}
    />
  );
});

export default ThemeAwareAurora;
