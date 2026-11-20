import type { Metadata, Viewport } from "next";
import { LandingBackground } from "./landing-background";
import { WaitlistForm } from "./waitlist-form";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "ZeroSleep — Your work. One link.",
  description: "Your GitHub, npm, LeetCode and projects, together in one developer profile. Join the ZeroSleep waitlist to hear when we launch.",
  openGraph: {
    title: "ZeroSleep — Your work. One link.",
    description: "Everything you build, in one developer profile. Join the waitlist.",
    type: "website",
  },
  twitter: { card: "summary" },
};

export const viewport: Viewport = { themeColor: "#ffffff", colorScheme: "light" };

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.brand}>zerosleep</span>
        <span className={styles.headerLabel}>Coming soon</span>
      </header>
      <main className={styles.main}>
        <p className={styles.eyebrow}>A home for developers</p>
        <h1 className={styles.heading}>
          <span>Your work.</span>
          <span>One link.</span>
        </h1>
        <p className={styles.description}>
          Your GitHub, npm, LeetCode and projects — together in one developer profile.
        </p>
        <WaitlistForm />
      </main>
      <footer className={styles.footer}>
        <span>© 2026 ZeroSleep</span>
      </footer>
      <LandingBackground />
    </div>
  );
}
