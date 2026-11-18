import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DashboardPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          ZeroSleep
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The editor arrives in Phase 1.
        </p>
      </div>
    </main>
  );
}
