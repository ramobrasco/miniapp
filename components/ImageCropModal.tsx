"use client";

import { useState, useCallback, useRef } from "react";
import Cropper, { type Area, getInitialCropFromCroppedAreaPercentages } from "react-easy-crop";
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

export function ImageCropModal({ imageSrc, onDone, onCancel }: ImageCropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const onMediaLoaded = useCallback((mediaSize: { width: number; height: number; naturalWidth: number; naturalHeight: number }) => {
    const el = containerRef.current;
    const cw = el?.clientWidth ?? 400;
    const ch = el?.clientHeight ?? 400;
    const side = Math.min(cw, ch);
    const cropSize = { width: side, height: side };
    const fullArea = { x: 0, y: 0, width: 1, height: 1 };
    const { crop: initialCrop, zoom: initialZoom } = getInitialCropFromCroppedAreaPercentages(
      fullArea,
      mediaSize,
      0,
      cropSize,
      MIN_ZOOM,
      MAX_ZOOM
    );
    setCrop(initialCrop);
    setZoom(initialZoom);
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
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div ref={containerRef} className="flex-1 relative min-h-[50vh]">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          objectFit="contain"
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          onMediaLoaded={onMediaLoaded}
          style={{}}
          classes={{ containerClassName: "!bg-black" }}
        />
      </div>
      <div className="p-4 bg-white border-t border-zinc-200 space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-600 shrink-0">Zoom out to fit full image, or zoom in to crop</label>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-2 rounded-lg appearance-none bg-zinc-200 accent-[#0052FF]"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 min-h-[44px] rounded-xl border border-zinc-300 px-4 py-2 text-zinc-700 hover:bg-zinc-50 active:scale-[0.98] transition-transform"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || !croppedAreaPixels}
            className="flex-1 min-h-[44px] rounded-xl bg-[#0052FF] text-white px-4 py-2 font-medium hover:bg-[#0046E0] disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {busy ? "Processing…" : "Use this crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
