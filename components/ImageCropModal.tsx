"use client";

import { useState, useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { createCroppedBlob } from "@/lib/image-crop";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

type ImageCropModalProps = {
  imageSrc: string;
  onDone: (blob: Blob) => void;
  onCancel: () => void;
};

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;

/** Full image in crop area (0–100%), centered with letterboxing – like Instagram/iOS */
const FULL_IMAGE_PERCENTAGES = { x: 0, y: 0, width: 100, height: 100 };

export function ImageCropModal({ imageSrc, onDone, onCancel }: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setError("");
    setBusy(true);
    try {
      const blob = await createCroppedBlob(imageSrc, croppedAreaPixels, {
        maxSizeBytes: MAX_SIZE_BYTES,
      });
      onDone(blob);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to process image");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <div className="flex-1 relative min-h-[60vh] sm:min-h-[50vh]">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          objectFit="contain"
          initialCroppedAreaPercentages={FULL_IMAGE_PERCENTAGES}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{}}
          classes={{ containerClassName: "!bg-black" }}
        />
      </div>
      <div className="shrink-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 bg-white border-t border-zinc-200 space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-sm text-zinc-600 shrink-0 select-none">Zoom</label>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 min-w-0 h-10 touch-pan-y rounded-lg appearance-none bg-zinc-200 accent-[#0052FF] cursor-pointer"
            style={{ minHeight: 44 }}
            aria-label="Zoom in or out"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 min-h-[48px] rounded-xl border border-zinc-300 px-4 py-3 text-zinc-700 hover:bg-zinc-50 active:scale-[0.98] transition-transform touch-manipulation"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || !croppedAreaPixels}
            className="flex-1 min-h-[48px] rounded-xl bg-[#0052FF] text-white px-4 py-3 font-medium hover:bg-[#0046E0] disabled:opacity-50 active:scale-[0.98] transition-transform touch-manipulation"
          >
            {busy ? "Processing…" : "Use this crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
