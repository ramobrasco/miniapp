/**
 * Produce a square cropped image blob from image URL and crop area (pixels).
 * Optionally resize/compress to stay under maxBytes (e.g. 2MB).
 */

export type PixelCrop = { x: number; y: number; width: number; height: number };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Draw the cropped region onto a square canvas and return as blob.
 * Output is square (crop size × crop size) in JPEG for smaller size.
 */
export async function createCroppedBlob(
  imageSrc: string,
  pixelCrop: PixelCrop,
  options: { maxSizeBytes?: number; outputSize?: number } = {}
): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const { maxSizeBytes = 2 * 1024 * 1024, outputSize } = options;

  // Use crop size or a max dimension for the square output
  const cropSize = Math.min(pixelCrop.width, pixelCrop.height);
  const size = outputSize ?? Math.min(cropSize, 1200); // cap 1200px for performance

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(
    img,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size
  );

  let quality = 0.92;
  let currentSize = size;
  let blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob) throw new Error("Failed to create image blob");

  // If over max size, reduce quality then scale down until under limit
  while (blob.size > maxSizeBytes && (quality > 0.15 || currentSize > 200)) {
    if (quality > 0.35) {
      quality -= 0.15;
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
      );
    } else {
      // Scale down and try again
      const nextSize = Math.max(200, Math.floor(currentSize * 0.7));
      const scaleCanvas = document.createElement("canvas");
      scaleCanvas.width = nextSize;
      scaleCanvas.height = nextSize;
      const scaleCtx = scaleCanvas.getContext("2d");
      if (!scaleCtx) break;
      scaleCtx.drawImage(canvas, 0, 0, currentSize, currentSize, 0, 0, nextSize, nextSize);
      canvas.width = nextSize;
      canvas.height = nextSize;
      ctx.drawImage(scaleCanvas, 0, 0, nextSize, nextSize, 0, 0, nextSize, nextSize);
      currentSize = nextSize;
      quality = 0.85;
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
      );
    }
    if (!blob) break;
  }

  if (!blob) throw new Error("Failed to create image blob");
  return blob;
}
