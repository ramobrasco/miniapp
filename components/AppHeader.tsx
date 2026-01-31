"use client";

import Link from "next/link";
import { ConnectButton } from "@/components/ConnectButton";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/40 px-4 py-3 flex items-center justify-between bg-white/70 dark:bg-white/50 backdrop-blur-md">
      <Link href="/" className="font-semibold text-lg text-zinc-900 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#0052FF]" />
        Should I?
      </Link>
      <ConnectButton />
    </header>
  );
}
