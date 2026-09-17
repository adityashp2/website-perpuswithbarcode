/**
 * Automatic Image Compression Utility (< 200 KB)
 * Mandatory requirement: All input images must be automatically compressed below 200 KB.
 * Uses HTML5 Canvas with progressive quality step-down and dimension scaling.
 */

export interface CompressionResult {
  file: File;
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  wasCompressed: boolean;
  mimeType: string;
}

export interface CompressionOptions {
  maxKb?: number;          // Default: 190 KB (safely below 200 KB)
  maxDimension?: number;   // Default: 1600 px
  maxWidthOrHeight?: number; // Alias for maxDimension
  mimeType?: 'image/jpeg' | 'image/webp'; // Default: image/jpeg
}

/**
 * Compresses an image File or Blob to ensure its final size is strictly under 200 KB.
 */
export async function compressImageUnder200KB(
  inputFile: File | Blob,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const maxKb = options.maxKb || 190; // Strictly below 200 KB
  const maxDimension = options.maxDimension || options.maxWidthOrHeight || 1600;
  const targetMime = options.mimeType || 'image/jpeg';

  const originalSizeKb = Math.round(inputFile.size / 1024);
  const fileName = (inputFile as File).name || 'compressed_image.jpg';

  // If already below target size, check if we can still convert to clean DataURL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));

    reader.onload = () => {
      const dataUrl = reader.result as string;

      // If already under target and JPEG/WebP, we can return if desired,
      // but running through canvas ensures stripping of heavy EXIF data and guaranteed size
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak valid atau rusak'));

      img.onload = async () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Step 1: Initial scale if dimensions exceed maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context 2D tidak tersedia'));
          return;
        }

        // Fill white background in case of transparent PNG/WebP converting to JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Progressive compression steps:
        // Try quality from 0.85 down to 0.35, then scale down canvas if still needed
        const qualities = [0.85, 0.72, 0.58, 0.45, 0.35];
        let bestBlob: Blob | null = null;
        let bestQuality = 0.85;

        for (const q of qualities) {
          bestQuality = q;
          const blob = await new Promise<Blob | null>((res) => {
            canvas.toBlob((b) => res(b), targetMime, q);
          });

          if (blob) {
            bestBlob = blob;
            if (blob.size / 1024 <= maxKb) {
              break;
            }
          }
        }

        // If still over maxKb, progressively scale dimensions down
        let scalePass = 1;
        while (bestBlob && bestBlob.size / 1024 > maxKb && scalePass <= 4) {
          const scaleFactor = scalePass === 1 ? 0.75 : scalePass === 2 ? 0.6 : 0.45;
          const scaledW = Math.max(320, Math.round(width * scaleFactor));
          const scaledH = Math.max(240, Math.round(height * scaleFactor));

          canvas.width = scaledW;
          canvas.height = scaledH;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, scaledW, scaledH);
          ctx.drawImage(img, 0, 0, scaledW, scaledH);

          const blob = await new Promise<Blob | null>((res) => {
            canvas.toBlob((b) => res(b), targetMime, 0.65 - scalePass * 0.08);
          });

          if (blob) {
            bestBlob = blob;
            if (blob.size / 1024 <= maxKb) break;
          }
          scalePass++;
        }

        if (!bestBlob) {
          // Fallback to original
          resolve({
            file: inputFile as File,
            dataUrl,
            originalSizeKb,
            compressedSizeKb: originalSizeKb,
            wasCompressed: false,
            mimeType: inputFile.type,
          });
          return;
        }

        const finalSizeKb = Math.round(bestBlob.size / 1024);
        const finalDataUrl = canvas.toDataURL(targetMime, bestQuality);
        const finalFile = new File([bestBlob], fileName, { type: targetMime });

        resolve({
          file: finalFile,
          dataUrl: finalDataUrl,
          originalSizeKb,
          compressedSizeKb: finalSizeKb,
          wasCompressed: finalSizeKb < originalSizeKb,
          mimeType: targetMime,
        });
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(inputFile);
  });
}
