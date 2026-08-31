/**
 * Safe LocalStorage Wrapper with QuotaExceededError recovery
 * and client-side image compression to prevent storage overflows.
 */

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn(`[Storage] Failed to get item "${key}":`, e);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      window.localStorage.setItem(key, value);
      return true;
    } catch (error: any) {
      console.warn(`[Storage] Quota exceeded or error saving "${key}". Attempting recovery...`, error);

      // Check if it's a QuotaExceededError
      const isQuota =
        error?.name === 'QuotaExceededError' ||
        error?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        error?.code === 22 ||
        error?.code === 1014 ||
        error?.message?.toLowerCase().includes('quota');

      if (isQuota) {
        try {
          // Attempt automatic cleanup of non-critical large caches
          const nonCriticalKeys = ['gc_about_image', 'gc_products', 'gc_orders'];
          for (const k of nonCriticalKeys) {
            if (k !== key) {
              window.localStorage.removeItem(k);
            }
          }
          // Retry setting the item
          window.localStorage.setItem(key, value);
          return true;
        } catch (retryError) {
          console.error('[Storage] Storage full even after cleanup. Skipping persistent write.', retryError);
          return false;
        }
      }
      return false;
    }
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[Storage] Failed to remove item "${key}":`, e);
    }
  },

  sanitizeQuota: (): void => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      let totalLength = 0;
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k) {
          const val = window.localStorage.getItem(k) || '';
          totalLength += val.length;
          // If any single key has huge raw uncompressed image data (> 2MB)
          if (val.length > 2 * 1024 * 1024) {
            window.localStorage.removeItem(k);
          }
        }
      }
      // If total exceeds 3.5MB, clear product caches to free space
      if (totalLength > 3.5 * 1024 * 1024) {
        window.localStorage.removeItem('gc_products');
        window.localStorage.removeItem('gc_about_image');
      }
    } catch (e) {
      console.warn('[Storage] Sanitize error:', e);
    }
  },
};

/**
 * Resizes and compresses any image file to a lightweight JPEG DataURL (~100-200KB)
 * to ensure it never overflows browser memory or localStorage quotas.
 */
export function compressImageFile(
  file: File,
  maxWidth = 1000,
  maxHeight = 1200,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Invalid image file'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect-ratio preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original data url
          resolve(e.target?.result as string);
          return;
        }

        // Draw and compress to JPEG format
        ctx.fillStyle = '#14131A';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
