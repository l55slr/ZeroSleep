"use client";

import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import Dither from "./dither-background";
import styles from "./page.module.css";

export function LandingBackground() {
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <>
      <div className={styles.background} aria-hidden="true">
        <Dither
          waveColor="#9e9e9e"
          backgroundColor="#ffffff"
          ditherMode="bayer"
          colorNum={4}
          pixelSize={2}
          waveSpeed={0.05}
          waveFrequency={3}
          waveAmplitude={0.3}
          mouseEffect="ripple"
          mouseRadius={0.4}
          mouseStrength={1.4}
          disableAnimation={paused || reducedMotion}
          enableMouseInteraction={!paused && !reducedMotion}
          clickRipple={!paused && !reducedMotion}
          intro={!paused && !reducedMotion}
        />
      </div>
      {!reducedMotion && (
        <button
          className={styles.motionButton}
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? "Play background animation" : "Pause background animation"}
        >
          {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
          <span>{paused ? "Play motion" : "Pause motion"}</span>
        </button>
      )}
    </>
  );
}
