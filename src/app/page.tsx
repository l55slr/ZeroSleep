import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-semibold tracking-tight">ZeroSleep</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          One page for everything you build. Your GitHub, npm, LeetCode, and
          projects — one link.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Get started
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
    </main>
  );
}
