import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useVideoPlayer } from "../../lib/video/hooks";
import { Scene1 } from "./video_scenes/Scene1";
import { Scene2 } from "./video_scenes/Scene2";
import { Scene3 } from "./video_scenes/Scene3";
import { Scene4 } from "./video_scenes/Scene4";
import { Scene5 } from "./video_scenes/Scene5";

export const SCENE_DURATIONS: Record<string, number> = {
  open: 3000,
  tools: 3000,
  security: 3000,
  speed: 3000,
  close: 3000,
}; // Total: 15 seconds

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  open: Scene1,
  tools: Scene2,
  security: Scene3,
  speed: Scene4,
  close: Scene5,
};

const SCENE_START_SEC: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let cumulativeMs = 0;
  for (const [key, ms] of Object.entries(SCENE_DURATIONS)) {
    out[key] = cumulativeMs / 1000;
    cumulativeMs += ms;
  }
  return out;
})();

const AUDIO_SEEK_EPSILON_SEC = 0.18;

export function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  muted = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  muted?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, "");
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.45;
    const targetTime = SCENE_START_SEC[baseSceneKey] ?? 0;
    if (Math.abs(audio.currentTime - targetTime) > AUDIO_SEEK_EPSILON_SEC) {
      audio.currentTime = targetTime;
    }
    audio.play().catch(() => {});
  }, [currentSceneKey, baseSceneKey, muted]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      {/* Persistent brand mark - Luxor icon in corner */}
      <motion.div
        className="absolute z-50"
        animate={{
          top: sceneIndex === 0 ? "50%" : "5vh",
          left: sceneIndex === 0 ? "50%" : "5vw",
          x: sceneIndex === 0 ? "-50%" : "0",
          y: sceneIndex === 0 ? "-50%" : "0",
          scale: sceneIndex === 0 ? 1.5 : 0.7,
          opacity: sceneIndex === 4 ? 0.3 : 1,
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <img
          src={`${import.meta.env.BASE_URL}brand/luxor-icon.png`}
          alt="Luxor PDF"
          className="w-16 h-16 drop-shadow-2xl"
        />
      </motion.div>

      {/* Persistent gradient background orb */}
      <motion.div
        className="absolute rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
        }}
        animate={{
          width: sceneIndex === 0 ? "80vw" : sceneIndex === 4 ? "100vw" : "60vw",
          height: sceneIndex === 0 ? "80vh" : sceneIndex === 4 ? "100vh" : "60vh",
          x: sceneIndex === 0 ? "10vw" : sceneIndex === 1 ? "-20vw" : sceneIndex === 2 ? "40vw" : sceneIndex === 3 ? "-10vw" : "20vw",
          y: sceneIndex === 0 ? "10vh" : sceneIndex === 1 ? "30vh" : sceneIndex === 2 ? "-10vh" : sceneIndex === 3 ? "40vh" : "10vh",
          opacity: 0.15,
        }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />

      {/* Accent orb */}
      <motion.div
        className="absolute rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, hsl(var(--secondary)) 0%, transparent 70%)",
        }}
        animate={{
          width: "50vw",
          height: "50vh",
          x: sceneIndex === 0 ? "60vw" : sceneIndex === 1 ? "70vw" : sceneIndex === 2 ? "10vw" : sceneIndex === 3 ? "60vw" : "40vw",
          y: sceneIndex === 0 ? "40vh" : sceneIndex === 1 ? "10vh" : sceneIndex === 2 ? "50vh" : sceneIndex === 3 ? "20vh" : "40vh",
          opacity: 0.1,
        }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />

      {/* Scene container */}
      <div className="relative z-10 w-full h-full">
        <AnimatePresence mode="sync">
          {SceneComponent && <SceneComponent key={currentSceneKey} />}
        </AnimatePresence>
      </div>

      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}audio/bg_music.mp3`}
        preload="auto"
        autoPlay
        muted={muted}
      />
    </div>
  );
}
