"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Play, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { HoverBorderGradient } from "@/components/ui/hover-border-button";
import {
  clearInitialPreloadComplete,
  markInitialPreloadComplete,
  runStrictPreload,
  type PreloadAsset,
  type PreloadResult,
} from "@/services/preload";

interface LoadingScreenProps {
  onComplete: () => void;
}

interface PreloadManifestResponse {
  assets: PreloadAsset[];
  totalCount: number;
  totalBytes: number;
}

type GameState = "idle" | "playing" | "gameover";

interface Pipe {
  x: number;
  topH: number;
  botY: number;
  w: number;
  capW: number;
  scored: boolean;
}

const C = {
  sky1: "#5ec8f0",
  sky2: "#c4eef9",
  grass: "#74bf2e",
  grassDark: "#5fa629",
  sand1: "#ddd58e",
  sand2: "#c4a354",
  pipe: "#72c31d",
  pipeDark: "#538b15",
  pipeShine: "#9de542",
};

const G = {
  gravity: 1400,
  deathGravity: 1700,
  flapVy: -420,
  speed: 180,
  gap: 160,
  minGap: 144,
  width: 64,
  minWidth: 52,
  capW: 76,
  capH: 28,
  spawnDist: 280,
  groundH: 80,
  birdR: 14,
  step: 1 / 240,
  maxDt: 1 / 20,
};

let preloadManifestPromise: Promise<PreloadManifestResponse> | null = null;
const getPreloadManifest = (): Promise<PreloadManifestResponse> => {
  if (!preloadManifestPromise) {
    preloadManifestPromise = fetch("/api/preload-assets", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`manifest_http_${res.status}`);
        return (await res.json()) as PreloadManifestResponse;
      })
      .catch((error) => {
        preloadManifestPromise = null;
        throw error;
      });
  }
  return preloadManifestPromise;
};
const resetPreloadManifestPromise = () => {
  preloadManifestPromise = null;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const rr = (a: number, b: number) => a + Math.random() * (b - a);

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  const cr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + cr, y);
  ctx.arcTo(x + w, y, x + w, y + h, cr);
  ctx.arcTo(x + w, y + h, x, y + h, cr);
  ctx.arcTo(x, y + h, x, y, cr);
  ctx.arcTo(x, y, x + w, y, cr);
  ctx.closePath();
};

const hitCircleRect = (cx: number, cy: number, r: number, x: number, y: number, w: number, h: number) => {
  if (w <= 0 || h <= 0) return false;
  const nx = Math.max(x, Math.min(cx, x + w));
  const ny = Math.max(y, Math.min(cy, y + h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
};

const drawBird = (ctx: CanvasRenderingContext2D, wing: 0 | 1 | 2, r: number) => {
  const wingAngles: [number, number, number] = [-0.62, 0.08, 0.62];
  const wa = wingAngles[wing];

  ctx.save();
  ctx.translate(-r * 0.68, r * 0.14);
  ctx.rotate(wa);
  const wingGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.95);
  wingGradient.addColorStop(0, "#f6b421");
  wingGradient.addColorStop(1, "#a85d00");
  ctx.fillStyle = wingGradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.98, r * 0.42, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#7f4300";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();

  const bodyGradient = ctx.createRadialGradient(-r * 0.18, -r * 0.28, r * 0.04, 0, 0, r);
  bodyGradient.addColorStop(0, "#ffe566");
  bodyGradient.addColorStop(0.42, "#f5c800");
  bodyGradient.addColorStop(1, "#d4a000");
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#a06800";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.beginPath();
  ctx.ellipse(r * 0.14, r * 0.32, r * 0.54, r * 0.44, 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(r * 0.38, -r * 0.22, r * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#bbb";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(r * 0.5, -r * 0.18, r * 0.19, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(r * 0.44, -r * 0.28, r * 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f47c0b";
  ctx.beginPath();
  ctx.moveTo(r * 0.58, -r * 0.14);
  ctx.quadraticCurveTo(r * 1.05, -r * 0.1, r * 1.3, r * 0.04);
  ctx.lineTo(r * 0.62, r * 0.04);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#c85800";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#e06800";
  ctx.beginPath();
  ctx.moveTo(r * 0.62, r * 0.05);
  ctx.quadraticCurveTo(r * 1.05, r * 0.1, r * 1.28, r * 0.04);
  ctx.lineTo(r * 0.6, r * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#c85800";
  ctx.lineWidth = 1;
  ctx.stroke();
};

const useFlappy = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>("idle");
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const deadPlayedRef = useRef(false);
  const bgStartedRef = useRef(false);
  const bgStartingRef = useRef(false);
  const audioUnlockedRef = useRef(false);
  const audioUnlockingRef = useRef(false);
  const bgAttemptTokenRef = useRef(0);
  const bgRetryTimerRef = useRef<number | null>(null);
  const bgRetryCountRef = useRef(0);
  const primeTimerIdsRef = useRef<number[]>([]);
  const sim = useRef({
    W: 0, H: 0, x: 0, y: 0, vy: 0, groundH: G.groundH,
    pipes: [] as Pipe[], groundOff: 0, cloudOff: 0, wing: 1 as 0 | 1 | 2, wingT: 0,
    acc: 0, lastTs: 0, raf: null as number | null, flash: 0, deathVy: 0, deathBounced: false, pop: 1,
  });
  const [state, setState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  const audioRef = useRef<{ jump: HTMLAudioElement | null; pass: HTMLAudioElement | null; dead: HTMLAudioElement | null; bg: HTMLAudioElement | null }>({
    jump: null, pass: null, dead: null, bg: null,
  });
  const safePlay = useCallback((audio: HTMLAudioElement): Promise<boolean> => {
    try {
      const playResult = audio.play();
      if (playResult && typeof playResult.then === "function") {
        return playResult
          .then(() => true)
          .catch((error) => {
            if (error instanceof DOMException && error.name === "AbortError") return false;
            return false;
          });
      }
      return Promise.resolve(true);
    } catch {
      return Promise.resolve(false);
    }
  }, []);
  const play = useCallback((k: "jump" | "pass" | "dead") => {
    const a = audioRef.current[k];
    if (!a) return;
    try { a.currentTime = 0; } catch {}
    void safePlay(a);
  }, [safePlay]);

  const setPhase = useCallback((s: GameState) => { stateRef.current = s; setState(s); }, []);
  const clearPrimeTimers = useCallback(() => {
    if (!primeTimerIdsRef.current.length) return;
    for (const timerId of primeTimerIdsRef.current) {
      window.clearTimeout(timerId);
    }
    primeTimerIdsRef.current = [];
  }, []);
  const clearBackgroundMusicTimers = useCallback(() => {
    if (bgRetryTimerRef.current !== null) {
      window.clearTimeout(bgRetryTimerRef.current);
      bgRetryTimerRef.current = null;
    }
  }, []);
  const unlockAudioOnFirstGesture = useCallback(() => {
    if (audioUnlockedRef.current || audioUnlockingRef.current) return;
    const { pass, dead } = audioRef.current;
    if (!pass || !dead) return;
    audioUnlockingRef.current = true;

    const primeSfx = async (audio: HTMLAudioElement): Promise<boolean> => {
      const wasMuted = audio.muted;
      try { audio.currentTime = 0; } catch {}
      audio.muted = true;
      try {
        const ok = await safePlay(audio);
        if (!ok) {
          audio.muted = wasMuted;
          return false;
        }
        const timerId = window.setTimeout(() => {
          audio.pause();
          try { audio.currentTime = 0; } catch {}
          audio.muted = wasMuted;
          primeTimerIdsRef.current = primeTimerIdsRef.current.filter((id) => id !== timerId);
        }, 40);
        primeTimerIdsRef.current.push(timerId);
        return true;
      } catch {
        audio.muted = wasMuted;
        return false;
      }
    };

    void Promise.allSettled([primeSfx(pass), primeSfx(dead)]).then((results) => {
      const anySuccess = results.some(
        (result) => result.status === "fulfilled" && result.value
      );
      audioUnlockedRef.current = anySuccess;
      audioUnlockingRef.current = false;
    });
  }, [safePlay]);
  const stopBackgroundMusic = useCallback(() => {
    const bg = audioRef.current.bg;
    clearBackgroundMusicTimers();
    bgAttemptTokenRef.current += 1;
    if (!bg) return;
    bg.pause();
    try { bg.currentTime = 0; } catch {}
    bgStartedRef.current = false;
    bgStartingRef.current = false;
    bgRetryCountRef.current = 0;
  }, [clearBackgroundMusicTimers]);
  const stopAllAudio = useCallback(() => {
    clearBackgroundMusicTimers();
    clearPrimeTimers();
    bgAttemptTokenRef.current += 1;
    const { jump, pass, dead, bg } = audioRef.current;
    jump?.pause();
    pass?.pause();
    dead?.pause();
    if (bg) {
      bg.pause();
      try { bg.currentTime = 0; } catch {}
    }
    bgStartedRef.current = false;
    bgStartingRef.current = false;
    bgRetryCountRef.current = 0;
  }, [clearBackgroundMusicTimers, clearPrimeTimers]);
  const startBackgroundMusicForPlaying = useCallback(() => {
    const attemptStart = () => {
      if (stateRef.current !== "playing") return;
      if (bgStartedRef.current || bgStartingRef.current) return;
      const bg = audioRef.current.bg;
      if (!bg) return;
      const attemptToken = ++bgAttemptTokenRef.current;
      bgStartingRef.current = true;
      const onFail = () => {
        if (bgAttemptTokenRef.current !== attemptToken) return;
        bgStartedRef.current = false;
        bgStartingRef.current = false;
        if (stateRef.current !== "playing") return;
        if (bgRetryCountRef.current >= 5) return;
        const retryDelayMs = 120 + bgRetryCountRef.current * 140;
        bgRetryCountRef.current += 1;
        if (bgRetryTimerRef.current !== null) window.clearTimeout(bgRetryTimerRef.current);
        bgRetryTimerRef.current = window.setTimeout(() => {
          bgRetryTimerRef.current = null;
          if (bgAttemptTokenRef.current !== attemptToken || bgStartingRef.current) return;
          attemptStart();
        }, retryDelayMs);
      };
      try {
        void safePlay(bg).then((ok) => {
          if (bgAttemptTokenRef.current !== attemptToken) return;
          if (ok) {
            bgStartedRef.current = true;
            bgRetryCountRef.current = 0;
          } else {
            onFail();
          }
        }).finally(() => {
          if (bgAttemptTokenRef.current !== attemptToken) return;
          bgStartingRef.current = false;
        });
      } catch {
        onFail();
      }
    };
    attemptStart();
  }, [safePlay]);
  const resetBird = useCallback(() => {
    const s = sim.current;
    s.x = s.W * 0.3; s.y = s.H * 0.45; s.vy = 0;
  }, []);

  const spawnPipe = useCallback(() => {
    const s = sim.current;
    if (s.W <= 0 || s.H <= 0) return;
    const groundTop = s.H - s.groundH;
    const w = clamp(s.W * 0.1, G.minWidth, G.width);
    const capW = Math.max(w + 10, G.capW);
    const mobileGapBias = s.H < 360 ? 22 : s.H < 430 ? 14 : 0;
    const gap = clamp(G.gap - mobileGapBias + rr(-12, 14), G.minGap - 12, G.gap + 20);
    const minCenterRaw = clamp(s.H * 0.1, 56, 92) + gap * 0.5;
    const maxCenterRaw = groundTop - clamp(s.H * 0.14, 68, 110) - gap * 0.5;
    const safeMin = Math.max(minCenterRaw, gap * 0.5 + 24);
    const safeMax = Math.min(maxCenterRaw, groundTop - gap * 0.5 - 24);
    const center =
      safeMax > safeMin
        ? rr(safeMin, safeMax)
        : clamp((safeMin + safeMax) * 0.5, gap * 0.5 + 24, groundTop - gap * 0.5 - 24);
    s.pipes.push({ x: s.W + capW, topH: Math.max(0, center - gap * 0.5), botY: center + gap * 0.5, w, capW, scored: false });
  }, []);

  const resetRun = useCallback(() => {
    const s = sim.current;
    resetBird();
    s.pipes = []; s.groundOff = 0; s.cloudOff = 0; s.acc = 0; s.lastTs = 0; s.wing = 1; s.wingT = 0;
    s.flash = 0; s.deathVy = 0; s.deathBounced = false; s.pop = 1;
    deadPlayedRef.current = false; scoreRef.current = 0; setScore(0);
  }, [resetBird]);

  const gameOver = useCallback(() => {
    const s = sim.current;
    setPhase("gameover");
    stopBackgroundMusic();
    s.flash = 0.9; s.deathVy = Math.max(s.vy, -80); s.deathBounced = false;
    if (!deadPlayedRef.current) { play("dead"); deadPlayedRef.current = true; }
    if (scoreRef.current > bestRef.current) { bestRef.current = scoreRef.current; setBest(scoreRef.current); }
  }, [play, setPhase, stopBackgroundMusic]);

  const restartToPlaying = useCallback(() => {
    resetRun();
    spawnPipe();
    sim.current.vy = G.flapVy * 0.6;
    setPhase("playing");
    unlockAudioOnFirstGesture();
    play("jump");
    startBackgroundMusicForPlaying();
  }, [play, resetRun, setPhase, spawnPipe, startBackgroundMusicForPlaying, unlockAudioOnFirstGesture]);

  const flap = useCallback(() => {
    unlockAudioOnFirstGesture();
    const st = stateRef.current;
    if (st === "gameover") return;
    if (st === "idle") { restartToPlaying(); return; }
    if (!bgStartedRef.current && !bgStartingRef.current) {
      startBackgroundMusicForPlaying();
    }
    sim.current.vy = G.flapVy; sim.current.wing = 0; sim.current.wingT = 0; play("jump");
  }, [play, restartToPlaying, startBackgroundMusicForPlaying, unlockAudioOnFirstGesture]);

  const step = useCallback((dt: number) => {
    const s = sim.current;
    const st = stateRef.current;
    if (s.W <= 0 || s.H <= 0) return;
    const groundTop = s.H - s.groundH;
    s.cloudOff = (s.cloudOff + dt * 30) % (s.W + 200);

    if (st === "idle") {
      s.wingT += dt; if (s.wingT > 0.18) { s.wingT = 0; s.wing = ((s.wing + 1) % 3) as 0 | 1 | 2; }
      s.y = s.H * 0.45 + Math.sin(performance.now() * 0.0028) * 8;
      return;
    }
    if (st === "gameover") {
      s.flash = Math.max(0, s.flash - dt * 3.2); s.deathVy += G.deathGravity * dt; s.y += s.deathVy * dt;
      if (s.y + G.birdR >= groundTop) { s.y = groundTop - G.birdR; if (!s.deathBounced && s.deathVy > 120) { s.deathVy = -s.deathVy * 0.33; s.deathBounced = true; } else s.deathVy = 0; }
      return;
    }

    s.vy += G.gravity * dt; s.y += s.vy * dt;
    if (s.y - G.birdR < 0) { s.y = G.birdR; s.vy = Math.max(0, s.vy); }
    if (s.y + G.birdR >= groundTop) { s.y = groundTop - G.birdR; gameOver(); return; }
    s.wingT += dt; if (s.wingT > (s.vy < 0 ? 0.1 : 0.18)) { s.wingT = 0; s.wing = ((s.wing + 1) % 3) as 0 | 1 | 2; }
    s.groundOff = (s.groundOff + G.speed * dt) % 48;

    const next: Pipe[] = [];
    for (const p of s.pipes) {
      const m: Pipe = { ...p, x: p.x - G.speed * dt };
      const bL = m.x - m.w * 0.5 - 2, bW = m.w + 4, cL = m.x - m.capW * 0.5 - 2, cW = m.capW + 4;
      const topBodyH = Math.max(0, m.topH - G.capH), botH = Math.max(0, groundTop - m.botY), botBodyH = Math.max(0, botH - G.capH);
      const hit =
        hitCircleRect(s.x, s.y, G.birdR - 2, bL, 0, bW, topBodyH) ||
        hitCircleRect(s.x, s.y, G.birdR - 2, cL, Math.max(0, m.topH - G.capH), cW, Math.min(G.capH, m.topH)) ||
        hitCircleRect(s.x, s.y, G.birdR - 2, cL, m.botY, cW, Math.min(G.capH, botH)) ||
        hitCircleRect(s.x, s.y, G.birdR - 2, bL, m.botY + G.capH, bW, botBodyH);
      if (hit) { gameOver(); return; }
      if (!m.scored && m.x + m.capW * 0.5 < s.x - G.birdR) { m.scored = true; scoreRef.current += 1; s.pop = 1.45; setScore(scoreRef.current); play("pass"); }
      if (m.x + m.capW * 0.5 > -20) next.push(m);
    }
    s.pipes = next;
    s.pop = Math.max(1, s.pop - dt * 6);
    const last = s.pipes[s.pipes.length - 1];
    if (!last || last.x < s.W - G.spawnDist) spawnPipe();
    if (s.pipes.length === 0) spawnPipe();
  }, [gameOver, play, spawnPipe]);

  const draw = useCallback(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const s = sim.current; if (s.W <= 0 || s.H <= 0) return;
    const groundTop = s.H - s.groundH;
    const sky = ctx.createLinearGradient(0, 0, 0, groundTop); sky.addColorStop(0, C.sky1); sky.addColorStop(1, C.sky2);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, s.W, s.H);
    const cloudX = [0.1, 0.45, 0.75, 0.22], cloudY = [60, 40, 80, 110], cloudS = [1.2, 0.9, 1.05, 0.75];
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    for (let i = 0; i < 4; i++) { const x = ((cloudX[i] * s.W - s.cloudOff + s.W * 2) % (s.W + 200)) - 80, y = cloudY[i], k = cloudS[i]; ctx.beginPath(); ctx.arc(x, y, 22 * k, 0, Math.PI * 2); ctx.arc(x + 18 * k, y - 10 * k, 16 * k, 0, Math.PI * 2); ctx.arc(x + 36 * k, y, 20 * k, 0, Math.PI * 2); ctx.arc(x + 18 * k, y + 8 * k, 14 * k, 0, Math.PI * 2); ctx.fill(); }
    for (const p of s.pipes) {
      const topH = Math.max(0, p.topH), botH = Math.max(0, groundTop - p.botY), bL = p.x - p.w * 0.5, cL = p.x - p.capW * 0.5;
      const pg = ctx.createLinearGradient(bL, 0, bL + p.w, 0); pg.addColorStop(0, C.pipeDark); pg.addColorStop(0.25, C.pipeShine); pg.addColorStop(0.55, C.pipe); pg.addColorStop(1, C.pipeDark);
      if (topH > 0) { ctx.fillStyle = pg; ctx.fillRect(bL, 0, p.w, topH); const cg = ctx.createLinearGradient(cL, 0, cL + p.capW, 0); cg.addColorStop(0, C.pipeDark); cg.addColorStop(0.3, C.pipeShine); cg.addColorStop(0.6, C.pipe); cg.addColorStop(1, C.pipeDark); ctx.fillStyle = cg; roundRect(ctx, cL, Math.max(0, topH - G.capH), p.capW, Math.min(G.capH, topH), 4); ctx.fill(); }
      if (botH > 0) { ctx.fillStyle = pg; ctx.fillRect(bL, p.botY + G.capH, p.w, Math.max(0, botH - G.capH)); const cg = ctx.createLinearGradient(cL, 0, cL + p.capW, 0); cg.addColorStop(0, C.pipeDark); cg.addColorStop(0.3, C.pipeShine); cg.addColorStop(0.6, C.pipe); cg.addColorStop(1, C.pipeDark); ctx.fillStyle = cg; roundRect(ctx, cL, p.botY, p.capW, Math.min(G.capH, botH), 4); ctx.fill(); }
    }
    ctx.fillStyle = C.grassDark; ctx.fillRect(0, groundTop, s.W, 6); ctx.fillStyle = C.grass; ctx.fillRect(0, groundTop + 2, s.W, 10);
    const sg = ctx.createLinearGradient(0, groundTop + 12, 0, s.H); sg.addColorStop(0, C.sand1); sg.addColorStop(1, C.sand2); ctx.fillStyle = sg; ctx.fillRect(0, groundTop + 12, s.W, s.groundH - 12);
    ctx.strokeStyle = "rgba(160,120,60,0.4)"; ctx.lineWidth = 1.5; for (let x = -s.groundOff; x < s.W + 48; x += 48) { ctx.beginPath(); ctx.moveTo(x, groundTop + 14); ctx.lineTo(x + 30, groundTop + 14); ctx.stroke(); }
    const tilt = stateRef.current === "gameover" ? Math.PI * 0.5 : clamp(s.vy * 0.0026, -0.5, Math.PI * 0.42);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(tilt);
    drawBird(ctx, s.wing, G.birdR);
    ctx.restore();
    if (stateRef.current === "playing" || stateRef.current === "gameover") { ctx.save(); ctx.translate(s.W * 0.5, 62); ctx.scale(s.pop || 1, s.pop || 1); ctx.font = `900 ${Math.min(46, s.W * 0.1)}px 'Press Start 2P','Courier New',monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineWidth = 8; ctx.lineJoin = "round"; ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.strokeText(String(scoreRef.current), 0, 0); ctx.fillStyle = "#fff"; ctx.fillText(String(scoreRef.current), 0, 0); ctx.restore(); }
    if (s.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${s.flash})`; ctx.fillRect(0, 0, s.W, s.H); }
    if (stateRef.current === "idle") {
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, s.W, s.H);

      const titleSize = Math.min(34, s.W * 0.09);
      ctx.font = `900 ${titleSize}px 'Press Start 2P','Courier New',monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 6;
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.strokeText("GET READY!", s.W * 0.5, s.H * 0.28);
      ctx.fillStyle = "#fff";
      ctx.fillText("GET READY!", s.W * 0.5, s.H * 0.28);

      const pulse = 0.55 + 0.45 * Math.abs(Math.sin(performance.now() * 0.0032));
      const instructionSize = Math.min(11, s.W * 0.028);
      const instructionY = s.H * 0.28 + titleSize + Math.min(28, s.H * 0.06);
      ctx.globalAlpha = pulse;
      ctx.font = `900 ${instructionSize}px 'Press Start 2P','Courier New',monospace`;
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.strokeText("TAP / SPACE TO PLAY", s.W * 0.5, instructionY);
      ctx.fillStyle = "#ffe84c";
      ctx.fillText("TAP / SPACE TO PLAY", s.W * 0.5, instructionY);
      ctx.globalAlpha = 1;
    }
  }, []);

  useEffect(() => {
    const jump = new Audio("/flappy-bird/jump.mp3");
    const pass = new Audio("/flappy-bird/pass.mp3");
    const dead = new Audio("/flappy-bird/dead.mp3");
    const bg = new Audio("/flappy-bird/background.mp3");
    const allAudio = [jump, pass, dead, bg];
    for (const audio of allAudio) {
      audio.preload = "auto";
      audio.setAttribute("playsinline", "true");
      audio.setAttribute("webkit-playsinline", "true");
      audio.load();
    }
    bg.loop = true;
    jump.volume = 1;
    pass.volume = 1;
    dead.volume = 1;
    bg.volume = 1;

    audioRef.current = { jump, pass, dead, bg };
    return () => {
      clearBackgroundMusicTimers();
      clearPrimeTimers();
      bgAttemptTokenRef.current += 1;
      jump.pause();
      pass.pause();
      dead.pause();
      bg.pause();
      try { bg.currentTime = 0; } catch {}
      audioRef.current = { jump: null, pass: null, dead: null, bg: null };
      bgStartedRef.current = false;
      bgStartingRef.current = false;
      bgRetryCountRef.current = 0;
      audioUnlockedRef.current = false;
      audioUnlockingRef.current = false;
    };
  }, [clearBackgroundMusicTimers, clearPrimeTimers]);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const resize = () => {
      const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      const ctx = cv.getContext("2d"); if (!ctx) return; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sim.current.W = w; sim.current.H = h; sim.current.groundH = clamp(h * 0.16, 62, G.groundH);
      if (stateRef.current === "idle") resetBird();
      draw();
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(cv);
    const simState = sim.current;
    const tick = (ts: number) => {
      const s = simState, prev = s.lastTs || ts; s.lastTs = ts; s.acc += Math.min(G.maxDt, Math.max(0, (ts - prev) / 1000));
      while (s.acc >= G.step) { step(G.step); s.acc -= G.step; }
      draw(); s.raf = requestAnimationFrame(tick);
    };
    simState.raf = requestAnimationFrame(tick);
    return () => { ro.disconnect(); if (simState.raf) cancelAnimationFrame(simState.raf); simState.raf = null; };
  }, [draw, resetBird, step]);

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      if (target.isContentEditable) return true;
      return tag === "input" || tag === "textarea" || tag === "select" || tag === "button";
    };
    const onKey = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if (e.repeat) return;
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyR") return;
      if (e.code === "Space") { e.preventDefault(); flap(); return; }
      if (e.code === "KeyR") { e.preventDefault(); restartToPlaying(); }
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, [flap, restartToPlaying]);

  return {
    canvasRef, state, score, best, medal: useMemo(() => (score >= 10 ? "MEDAL" : null), [score]),
    onTap: flap,
    onRestart: () => { resetRun(); setPhase("idle"); stopBackgroundMusic(); },
    onReplay: restartToPlaying,
    stopAllAudio,
  };
};

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showStartButton, setShowStartButton] = useState(false);
  const [statusText, setStatusText] = useState("Fetching preload manifest...");
  const [totalAssets, setTotalAssets] = useState(0);
  const [loadedAssets, setLoadedAssets] = useState(0);
  const [failedAssets, setFailedAssets] = useState<PreloadResult[]>([]);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const exitTimerRef = useRef<number | null>(null);
  const game = useFlappy();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const preloadController = new AbortController();
    const preloadAssets = async () => {
      clearInitialPreloadComplete(); setIsLoading(true); setShowStartButton(false); setManifestError(null); setFailedAssets([]); setProgress(0); setTotalAssets(0); setLoadedAssets(0); setStatusText("Fetching preload manifest...");
      try {
        const manifest = await getPreloadManifest(); if (cancelled) return;
        const assets = manifest.assets ?? []; setTotalAssets(manifest.totalCount ?? assets.length); setStatusText("Downloading assets...");
        if (!assets.length) { setProgress(100); setLoadedAssets(0); setIsLoading(false); setShowStartButton(true); setStatusText("All assets loaded successfully."); markInitialPreloadComplete(); return; }
        const result = await runStrictPreload(assets, {
          signal: preloadController.signal,
          onProgress: (s) => { if (cancelled) return; setLoadedAssets(s.succeeded); const p = s.totalBytes > 0 ? Math.floor((s.loadedBytes / s.totalBytes) * 100) : Math.floor((s.succeeded / s.total) * 100); setProgress(Math.min(100, Math.max(0, p))); setStatusText(s.retrying ? "Retrying failed downloads..." : "Downloading assets..."); },
        });
        if (cancelled) return;
        const failures = result.outcomes.filter((o) => !o.success); setFailedAssets(failures);
        if (!failures.length) { setProgress(100); setLoadedAssets(manifest.totalCount ?? assets.length); setIsLoading(false); setShowStartButton(true); setStatusText("All assets loaded successfully."); markInitialPreloadComplete(); return; }
        setIsLoading(false); setShowStartButton(false); setStatusText("Some assets failed to preload.");
      } catch (error) {
        if (cancelled) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setManifestError(error instanceof Error ? error.message : "Failed to load manifest."); setIsLoading(false); setShowStartButton(false);
      }
    };
    void preloadAssets();
    return () => { cancelled = true; preloadController.abort(); };
  }, [retryToken]);

  const handleStartExperience = () => {
    if (isExiting) return;
    game.stopAllAudio();
    setIsExiting(true);
    setShowStartButton(false);
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
    }
    exitTimerRef.current = window.setTimeout(() => {
      onComplete();
      exitTimerRef.current = null;
    }, 420);
  };
  const handleRetry = () => { resetPreloadManifestPromise(); setRetryToken((p) => p + 1); };
  const handleGamePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.isPrimary === false) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    game.onTap();
  }, [game]);

  const preloadSummary = useMemo(() => {
    if (manifestError) return `Manifest error: ${manifestError}`;
    if (failedAssets.length > 0 && !showStartButton) return `${failedAssets.length} assets failed to preload.`;
    if (showStartButton && progress >= 100) return "All assets loaded successfully.";
    return statusText;
  }, [failedAssets.length, manifestError, progress, showStartButton, statusText]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={isExiting ? { opacity: 0, scale: 0.985, filter: "blur(4px)" } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0 }}
        transition={{ duration: isExiting ? 0.38 : 0.3, ease: "easeInOut" }}
        className="fixed inset-0 z-50 overflow-y-auto bg-background"
      >
        <style>{"@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');"}</style>
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8" style={{ paddingTop: "max(1.25rem, calc(env(safe-area-inset-top) + 0.75rem))", paddingBottom: "max(1.25rem, calc(env(safe-area-inset-bottom) + 1.25rem))" }}>
          <div className="flex min-h-screen flex-col justify-center gap-6 py-6 sm:gap-7 sm:py-8 lg:py-10" style={{ minHeight: "100dvh" }}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
              <section className="min-w-0">
                <div className="relative w-full overflow-hidden rounded-2xl border border-border/60" style={{ aspectRatio: "16 / 9", maxHeight: "min(68dvh, 620px)", minHeight: "clamp(320px, 60dvh, 560px)" }} onPointerDown={handleGamePointerDown}>
                  <canvas ref={game.canvasRef} className="absolute inset-0 h-full w-full touch-manipulation" aria-label="Flappy Bird loading game" />
                  <div className="pointer-events-none absolute inset-0">
                    {game.best > 0 && <div className="absolute right-3 top-4 text-[10px] text-white/95 sm:right-4 sm:text-xs" style={{ fontFamily: "'Press Start 2P', 'Courier New', monospace", textShadow: "0 2px 8px rgba(0,0,0,0.65)" }}>BEST: {game.best}</div>}
                    {game.state === "gameover" && (
                      <div className="pointer-events-auto absolute inset-0 flex items-center justify-center p-4">
                        <div className="w-full max-w-sm rounded-2xl border border-[#8b6914] bg-[linear-gradient(180deg,#deb887_0%,#c8966f_100%)] px-4 py-5 text-center shadow-[0_8px_0_#6b4f10,0_12px_32px_rgba(0,0,0,0.35)]" onPointerDown={(e) => e.stopPropagation()}>
                          <p className="text-xl text-white sm:text-2xl" style={{ fontFamily: "'Press Start 2P', 'Courier New', monospace", textShadow: "0 4px 0 #8b2000, 0 6px 16px rgba(0,0,0,0.5)" }}>GAME OVER</p>
                          <div className="mt-4 rounded-lg border border-black/15 bg-black/10 px-4 py-3 text-left">
                            <div className="mb-2 flex items-center justify-between"><span className="text-[10px] text-[#5a3a10]" style={{ fontFamily: "'Press Start 2P', 'Courier New', monospace" }}>SCORE</span><span className="text-base text-white" style={{ fontFamily: "'Press Start 2P', 'Courier New', monospace", textShadow: "0 2px 0 #8b4500" }}>{game.score}</span></div>
                            <div className="flex items-center justify-between"><span className="text-[10px] text-[#5a3a10]" style={{ fontFamily: "'Press Start 2P', 'Courier New', monospace" }}>BEST</span><span className="text-base text-white" style={{ fontFamily: "'Press Start 2P', 'Courier New', monospace", textShadow: "0 2px 0 #8b4500" }}>{game.best}</span></div>
                          </div>
                          <div className="mt-4 flex justify-center gap-2">
                            <button type="button" onClick={game.onReplay} className="rounded-md border border-[#3d7a10] bg-[linear-gradient(180deg,#7dce2c_0%,#5aaa18_100%)] px-3 py-2 text-[10px] text-white shadow-[0_4px_0_#3d7a10]" style={{ fontFamily: "'Press Start 2P', 'Courier New', monospace" }}>OK</button>
                            <button type="button" onClick={game.onRestart} className="rounded-md border border-[#a07800] bg-[linear-gradient(180deg,#f5c842_0%,#d4a010_100%)] px-3 py-2 text-[10px] text-white shadow-[0_4px_0_#a07800]" style={{ fontFamily: "'Press Start 2P', 'Courier New', monospace" }}>HOME</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <div className="mt-1 space-y-4 lg:mt-0 lg:self-center">
                <header className="mx-auto w-full max-w-sm space-y-2 text-center">
                  <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">Loading Experience</h1>
                  <p className="text-sm text-muted-foreground sm:text-base">Play Flappy Bird while your assets are downloading.</p>
                </header>

                <section className="w-full space-y-3 rounded-2xl border border-border/50 bg-background/70 p-4 backdrop-blur">
                  <p className="text-sm text-muted-foreground">{preloadSummary}</p>
                  <div className="relative h-3 overflow-hidden rounded-full bg-muted">
                    <motion.div className="h-full rounded-full bg-linear-to-r from-primary to-primary/80" initial={{ width: "0%" }} animate={{ width: `${progress}%` }} transition={{ duration: 0.1, ease: "easeOut" }} />
                    {isLoading && <motion.div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground"><span>{progress}%</span><span>{loadedAssets}/{totalAssets} assets</span></div>
                  <div className="pt-1">
                    {(failedAssets.length > 0 || manifestError) && !showStartButton && <HoverBorderGradient as="button" onClick={handleRetry} containerClassName="w-full rounded-full" className="flex min-h-11 w-full items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium"><RefreshCw className="h-4 w-4" />Retry Failed Download</HoverBorderGradient>}
                    {showStartButton && <HoverBorderGradient as="button" onClick={handleStartExperience} containerClassName="w-full rounded-full" className="flex min-h-11 w-full items-center justify-center gap-2 px-6 py-3 text-base font-medium"><Play className="h-5 w-5" />Start Experience</HoverBorderGradient>}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
