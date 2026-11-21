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
  twitter: { card: "summary", site: "@zerosleep_" },
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
        <a
          className={styles.social}
          href="https://x.com/zerosleep_"
          aria-label="ZeroSleep on X"
          target="_blank"
          rel="me noopener noreferrer"
        >
          <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
      </footer>
      <LandingBackground />
    </div>
  );
}
