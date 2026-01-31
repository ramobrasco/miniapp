"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useChainId, useSignMessage } from "wagmi";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ImageCropModal } from "@/components/ImageCropModal";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function AskPage() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "signing" | "uploading" | "posting" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState<number | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const closeCropModal = useCallback(() => {
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    }
  }, [cropImageSrc]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rest = body.trim();
    if (!rest) {
      setError("Finish the question (e.g. buy this?)");
      return;
    }
    const fullQuestion = "Should I " + rest;
    setError("");
    setStatus("signing");

    try {
      if (!isConnected || !address) {
        setError("Connect your wallet first");
        setStatus("error");
        return;
      }

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
        const verifyData = await verifyRes.json().catch(() => ({}));
        setError(verifyData.error ?? "Sign-in failed. Try again.");
        setStatus("error");
        return;
      }

      setStatus("posting");
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: fullQuestion, image_url: imageUrl || null }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create question");
        setStatus("error");
        return;
      }
      setCreatedId(data.id);
      setStatus("done");
      setBody("");
      setImageUrl("");
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Please choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    setError("");
    setPhotoMenuOpen(false);
    setCropImageSrc(URL.createObjectURL(file));
  }

  function openLibrary() {
    setPhotoMenuOpen(false);
    fileInputRef.current?.click();
  }

  function openCamera() {
    setPhotoMenuOpen(false);
    cameraInputRef.current?.click();
  }

  async function handleCropDone(blob: Blob) {
    setStatus("uploading");
    setError("");
    closeCropModal();
    try {
      const file = new File([blob], "image.jpg", { type: "image/jpeg" });
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setImageUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    setStatus("idle");
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold mb-4">What do you need the crowd to decide?</h1>
        {!mounted ? (
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="rounded-xl border border-zinc-300 flex flex-wrap items-start gap-0 bg-white">
              <span className="py-2 pl-3 pr-1 text-zinc-900 font-medium">Should I{"\u00A0"}</span>
              <textarea placeholder="buy this?" rows={3} readOnly className="flex-1 min-w-[120px] py-2 pr-3 pl-0 text-zinc-900 placeholder-zinc-400 bg-transparent border-0 resize-none" maxLength={1990} />
            </div>
            <p className="text-zinc-500 text-sm">You type the rest; &quot;Should I &quot; stays as the start.</p>
            <div>
              <label className="block text-sm text-zinc-600 mb-1">Optional image</label>
              <input type="file" accept="image/*" disabled className="text-sm" />
            </div>
            <button type="button" className="min-h-[44px] rounded-xl bg-[#0052FF] text-white px-5 py-2.5 font-medium">Ask the crowd</button>
          </form>
        ) : (
          <>
        {!isConnected && (
          <p className="text-[#0052FF] mb-4">Connect your wallet to ask. Your wallet is your identity.</p>
        )}
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-zinc-300 focus-within:ring-2 focus-within:ring-[#0052FF] focus-within:border-[#0052FF] flex flex-wrap items-start gap-0 bg-white">
            <span className="py-2 pl-3 pr-1 text-zinc-900 font-medium">Should I{"\u00A0"}</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="buy this?"
              rows={3}
              className="flex-1 min-w-[120px] py-2 pr-3 pl-0 text-zinc-900 placeholder-zinc-400 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none"
              maxLength={1990}
              disabled={!isConnected}
            />
          </div>
          <p className="text-zinc-500 text-sm">You type the rest; “Should I ” stays as the start.</p>
          <div>
            <label className="block text-sm text-zinc-600 mb-1">Optional image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
              aria-hidden
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
              aria-hidden
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => isConnected && setPhotoMenuOpen((o) => !o)}
                disabled={!isConnected}
                className="min-h-[44px] rounded-xl border border-zinc-300 px-4 py-2 text-zinc-700 hover:border-[#0052FF] hover:text-[#0052FF] transition-colors disabled:opacity-50 w-full text-left flex items-center gap-2"
              >
                <span className="text-lg">📷</span> Add Photo
              </button>
              {photoMenuOpen && (
                <>
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-zinc-200 bg-white shadow-lg py-1" role="menu">
                    <button type="button" onClick={openLibrary} className="w-full px-4 py-3 text-left text-zinc-800 hover:bg-zinc-50 rounded-t-xl" role="menuitem">
                      Choose from Library
                    </button>
                    <button type="button" onClick={openCamera} className="w-full px-4 py-3 text-left text-zinc-800 hover:bg-zinc-50 rounded-b-xl" role="menuitem">
                      Take a Photo
                    </button>
                  </div>
                  <button
                    type="button"
                    className="fixed inset-0 z-[5]"
                    aria-label="Close menu"
                    onClick={() => setPhotoMenuOpen(false)}
                  />
                </>
              )}
            </div>
            <p className="text-zinc-500 text-xs mt-1">Crop to square and we’ll resize to fit (max 2MB).</p>
            {imageUrl && (
              <p className="text-zinc-500 text-sm mt-1">Image added. <button type="button" onClick={() => setImageUrl("")} className="text-[#0052FF] hover:underline">Remove</button></p>
            )}
          </div>
          {cropImageSrc && (
            <ImageCropModal
              imageSrc={cropImageSrc}
              onDone={handleCropDone}
              onCancel={closeCropModal}
            />
          )}
          <button
            type="submit"
            disabled={!isConnected || !body.trim() || status === "signing" || status === "posting" || status === "uploading"}
            className="min-h-[44px] rounded-xl bg-[#0052FF] text-white px-5 py-2.5 font-medium hover:bg-[#0046E0] disabled:opacity-50 transition-colors"
          >
            {status === "signing" ? "Sign in…" : status === "posting" || status === "uploading" ? "Posting…" : "Ask the crowd"}
          </button>
        </form>
          </>
        )}
      </main>
    </div>
  );
}
