"use client";

import { useTheme } from "@/components/providers/theme-provider";
import Aurora from "./Aurora";

export default function ThemeAwareAurora() {
  const { theme } = useTheme();

  const actualTheme = theme === "system" 
    ? (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme;

  const colorStops =
    actualTheme === "dark"
      ? ["#1a1a2e", "#16213e", "#0f3460"]
      : ["#1a1a2e", "#16213e", "#0f3460"]; 

  return (
    <Aurora 
      colorStops={colorStops}
      amplitude={1.0}
      blend={1}
      speed={0.5}
      opacity={actualTheme === "dark" ? 1.0 : 0.3}
    />
  );
}
