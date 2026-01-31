"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAccount, useConnect, useDisconnect, useChainId, useSignMessage } from "wagmi";
import { baseSepolia } from "wagmi/chains";

export function ConnectButton() {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [clickError, setClickError] = useState<string | null>(null);
  const [sessionAddress, setSessionAddress] = useState<string | null | undefined>(undefined);
  const [signInBusy, setSignInBusy] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const { connectAsync, connectors, isPending, error: connectError, reset: resetConnect } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isConnected) {
      setSessionAddress(null);
      return;
    }
    let cancelled = false;
    fetch("/api/auth/session", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSessionAddress(data.address ?? null);
      })
      .catch(() => {
        if (!cancelled) setSessionAddress(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isConnected]);

  useEffect(() => {
    setClickError(null);
  }, [connectors]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  async function handleConnect() {
    const connector = connectors[0];
    if (!connector) {
      setClickError("No wallet extension found. Install MetaMask or another Web3 wallet.");
      return;
    }
    setClickError(null);
    resetConnect();
    try {
      await connectAsync({ connector, chainId: baseSepolia.id });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed. Try again.";
      setClickError(msg);
    }
  }

  async function handleSignIn() {
    if (!address || !isConnected) return;
    setMenuOpen(false);
    setSignInError(null);
    setSignInBusy(true);
    try {
      const nonceRes = await fetch("/api/auth/nonce");
      const { nonce } = await nonceRes.json();
      const { createSiweMessage } = await import("@/lib/siwe");
      const origin = typeof window !== "undefined" ? window.location.origin : undefined;
      const message = createSiweMessage(address, nonce, chainId, origin);
      const messageStr = message.prepareMessage();
      const signature = await signMessageAsync({ message: messageStr });
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageStr, signature }),
        credentials: "include",
      });
      if (!verifyRes.ok) {
        const data = await verifyRes.json().catch(() => ({}));
        throw new Error(data.error ?? "Sign-in failed");
      }
      setSessionAddress(address);
    } catch (e) {
      setSignInError(e instanceof Error ? e.message : "Sign-in failed. Try again.");
    } finally {
      setSignInBusy(false);
    }
  }

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        className="rounded-xl bg-[#0052FF] text-white px-4 py-1.5 text-sm font-medium inline-block opacity-80 cursor-not-allowed"
        aria-busy="true"
      >
        Connect wallet
      </button>
    );
  }

  if (isConnected && address) {
    const needsSignIn = sessionAddress === null;
    return (
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm font-mono text-zinc-700 hover:border-[#0052FF] hover:text-[#0052FF] transition-colors"
        >
          {address.slice(0, 6)}…{address.slice(-4)}
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-white/40 bg-white/70 backdrop-blur-md shadow-lg py-1 z-30">
            {needsSignIn && (
              <>
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={signInBusy}
                  className="block w-full text-left px-4 py-2.5 text-sm text-[#0052FF] font-medium hover:bg-white/50 rounded-t-xl"
                >
                  {signInBusy ? "Signing…" : "Sign in with wallet"}
                </button>
                {signInError && (
                  <p className="px-4 py-2 text-xs text-red-600" title={signInError}>
                    {signInError}
                  </p>
                )}
                <div className="border-t border-white/30 my-1" />
              </>
            )}
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-2.5 text-sm text-zinc-800 hover:bg-white/50 ${!needsSignIn ? "rounded-t-xl" : ""}`}
            >
              Profile
            </Link>
            <Link
              href="/my-questions"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm text-zinc-800 hover:bg-white/50"
            >
              My questions
            </Link>
            <Link
              href="/my-votes"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm text-zinc-800 hover:bg-white/50"
            >
              My votes
            </Link>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                disconnect();
              }}
              className="block w-full text-left px-4 py-2.5 text-sm text-zinc-800 hover:bg-white/50 rounded-b-xl border-t border-white/30"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    );
  }

  const connector = connectors[0];
  if (!connector) {
    return (
      <span className="rounded-xl border border-zinc-300 px-4 py-1.5 text-sm text-zinc-500" title="Install MetaMask or another Web3 wallet">
        No wallet found
      </span>
    );
  }
  const errorMsg = clickError ?? connectError?.message ?? null;
  return (
    <div className="flex flex-col items-end gap-1">
      {errorMsg && (
        <p className="text-xs text-amber-600 max-w-[220px] text-right" title={errorMsg}>
          {errorMsg}
        </p>
      )}
      <button
        type="button"
        onClick={handleConnect}
        disabled={isPending}
        className="rounded-xl bg-[#0052FF] text-white px-4 py-1.5 text-sm font-medium hover:bg-[#0046E0] disabled:opacity-50 transition-colors cursor-pointer"
      >
        {isPending ? "Connecting…" : "Connect wallet"}
      </button>
    </div>
  );
}
