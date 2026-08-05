// Image migration utility - compresses existing images in storage
// Downloads images from Storage URLs, compresses them, and re-uploads them to Supabase

import {
  buildUploadPath,
  deleteFromSupabaseStorage,
  extractUploadsPath,
  getPublicStorageUrl,
  testSupabaseStorageConnection,
  uploadToSupabaseStorage,
} from '@/lib/supabase/storage';
import { compressImageSmart } from './imageCompression';

export interface ImageMigrationStats {
  totalProcessed: number;
  successful: number;
  failed: number;
  totalSavings: number; // in MB
  errors: Array<{ productId: string; error: string }>;
}

/**
 * Downloads an image from a URL and converts it to a File object
 * Uses direct download methods (no Firebase SDK methods) for better reliability
 */
export async function downloadImageAsFile(imageUrl: string): Promise<File> {
  console.log('📥 Starting download:', imageUrl.substring(0, 80) + '...');
  
  // Resolve a public URL when we only have a bare storage path
  let downloadUrl = imageUrl;
  if (!imageUrl.startsWith('http')) {
    try {
      downloadUrl = getPublicStorageUrl(imageUrl.replace(/^\/+/, ''));
      console.log('✅ Resolved Supabase public URL for download');
    } catch (error: any) {
      console.warn('⚠️ Using original path (could not resolve public URL):', error.message);
      downloadUrl = imageUrl;
    }
  }
  
  // Extract filename from URL
  const getFilename = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const filename = pathParts[pathParts.length - 1] || 'image.jpg';
      return filename.split('?')[0];
    } catch {
      const urlParts = url.split('/');
      return urlParts[urlParts.length - 1].split('?')[0] || 'image.jpg';
    }
  };
  
  // Detect MIME type from extension
  const getMimeType = (filename: string, blobType?: string): string => {
    if (blobType && blobType !== 'application/octet-stream') {
      return blobType;
    }
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif'
    };
    return mimeMap[ext] || 'image/jpeg';
  };
  
  const filename = getFilename(imageUrl);
  
  // Method 1: XMLHttpRequest (most reliable with progress tracking)
  try {
    console.log('📥 Method 1: XMLHttpRequest download...');
    
    const blob = await new Promise<Blob>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const startTime = Date.now();
      let lastLoggedPercent = -10;
      
      xhr.open('GET', downloadUrl, true);
      xhr.responseType = 'blob';
      xhr.timeout = 180000; // 3 minutes for large files
      
      // Progress tracking
      xhr.onprogress = (e) => {
        if (e.lengthComputable && e.total > 0) {
          const percent = Math.round((e.loaded / e.total) * 100);
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          
          // Log every 10% or every 10 seconds
          if (percent - lastLoggedPercent >= 10 || elapsed % 10 === 0) {
            const loadedMB = (e.loaded / 1024 / 1024).toFixed(2);
            const totalMB = (e.total / 1024 / 1024).toFixed(2);
            console.log(`📊 Progress: ${percent}% (${loadedMB} MB / ${totalMB} MB) - ${elapsed}s`);
            lastLoggedPercent = percent;
          }
        } else {
          // Progress not computable, just log elapsed time
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          if (elapsed > 0 && elapsed % 10 === 0) {
            console.log(`⏳ Downloading... ${elapsed}s elapsed`);
          }
        }
      };
      
      xhr.onload = () => {
        if (xhr.status === 200 && xhr.response && xhr.response.size > 0) {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const sizeMB = (xhr.response.size / 1024 / 1024).toFixed(2);
          console.log(`✅ Download complete in ${elapsed}s. Size: ${sizeMB} MB`);
          resolve(xhr.response);
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.response ? 'Empty response' : xhr.statusText}`));
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Network error during download'));
      };
      
      xhr.ontimeout = () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        reject(new Error(`Timeout after ${elapsed} seconds`));
      };
      
      xhr.send();
    });
    
    return new File([blob], filename, { type: getMimeType(filename, blob.type) });
    
  } catch (xhrError: any) {
    console.warn('⚠️ XMLHttpRequest failed:', xhrError.message);
    
    // Method 2: Fetch API (fallback)
    try {
      console.log('📥 Method 2: Fetch API download...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);
      
      const startTime = Date.now();
      const response = await fetch(downloadUrl, {
        signal: controller.signal,
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      if (!blob || blob.size === 0) {
        throw new Error('Downloaded blob is empty');
      }
      
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
      console.log(`✅ Download complete in ${elapsed}s. Size: ${sizeMB} MB`);
      
      return new File([blob], filename, { type: getMimeType(filename, blob.type) });
      
    } catch (fetchError: any) {
      console.warn('⚠️ Fetch failed:', fetchError.message);
      
      // Method 3: Canvas method (last resort, may have CORS issues)
      try {
        console.log('📥 Method 3: Canvas/Image element download (last resort)...');
        
        const blob = await new Promise<Blob>((resolve, reject) => {
          const img = new Image();
          const timeout = setTimeout(() => reject(new Error('Image load timeout')), 60000);
          
          img.crossOrigin = 'anonymous';
          
          img.onload = () => {
            clearTimeout(timeout);
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              
              if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
              }
              
              ctx.drawImage(img, 0, 0);
              
              canvas.toBlob((blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Canvas toBlob returned null'));
                }
              }, 'image/jpeg', 0.95);
            } catch (error: any) {
              reject(new Error(`Canvas conversion failed: ${error.message}`));
            }
          };
          
          img.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Image failed to load (CORS or invalid URL)'));
          };
          
          img.src = downloadUrl;
        });
        
        const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
        console.log(`✅ Download complete via canvas. Size: ${sizeMB} MB`);
        
        return new File([blob], filename, { type: 'image/jpeg' });
        
      } catch (canvasError: any) {
        console.error('❌ All download methods failed');
        throw new Error(`Failed to download image: ${canvasError.message}. URL: ${imageUrl.substring(0, 80)}`);
      }
    }
  }
}

/**
 * Extracts storage path from a Supabase or legacy Firebase download URL
 */
export function extractStoragePath(url: string): string | null {
  const path = extractUploadsPath(url);
  if (path) {
    console.log('✅ Extracted storage path:', path);
  } else {
    console.warn('⚠️ Could not extract storage path from URL');
  }
  return path;
}

/**
 * Deletes an image from Supabase Storage
 */
export async function deleteImageFromStorage(imageUrl: string): Promise<void> {
  try {
    await deleteFromSupabaseStorage(imageUrl);
    console.log('🗑️ Deleted old image from Supabase storage');
  } catch (error: any) {
    console.warn('⚠️ Failed to delete old image (might not exist):', error.message);
    // Don't throw - deletion is best effort
  }
}

/**
 * Test Supabase Storage connection
 */
export async function testStorageConnection(): Promise<boolean> {
  return testSupabaseStorageConnection();
}

/**
 * Compresses and re-uploads a single image
 * Returns the new download URL and original file size for savings calculation
 */
export async function compressAndReuploadImage(
  imageUrl: string,
  productId: string,
  deleteOld: boolean = true,
  onProgress?: (progress: number) => void
): Promise<{ newUrl: string; originalSize: number; compressedSize: number }> {
  try {
    onProgress?.(5);
    console.log('🚀 Starting compressAndReuploadImage for product:', productId);
    console.log('📎 Image URL:', imageUrl.substring(0, 100) + '...');
    
    // Download the image
    console.log('📥 Step 1/4: Starting download...');
    onProgress?.(10);
    
    let downloadAttempt = 0;
    let originalFile: File | null = null;
    const maxDownloadAttempts = 2;
    
    while (downloadAttempt < maxDownloadAttempts && !originalFile) {
      downloadAttempt++;
      try {
        console.log(`📥 Download attempt ${downloadAttempt}/${maxDownloadAttempts}...`);
        originalFile = await downloadImageAsFile(imageUrl);
        break;
      } catch (downloadError: any) {
        console.error(`❌ Download attempt ${downloadAttempt} failed:`, downloadError.message);
        if (downloadAttempt >= maxDownloadAttempts) {
          throw downloadError;
        }
        // Wait 1 second before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!originalFile) {
      throw new Error('Failed to download image after all attempts');
    }
    
    const originalSize = originalFile.size;
    console.log('✅ Download complete. Original size:', (originalSize / 1024 / 1024).toFixed(2), 'MB');
    onProgress?.(30);
    
    // Compress the image
    console.log('🗜️ Starting compression...');
    console.log('📊 File details:', {
      name: originalFile.name,
      size: (originalSize / 1024 / 1024).toFixed(2) + ' MB',
      type: originalFile.type
    });
    
    let compressedFile: File;
    try {
      compressedFile = await compressImageSmart(originalFile);
      
      // Validate compression worked
      if (!compressedFile || compressedFile.size === 0) {
        throw new Error('Compression returned empty file');
      }
      
      const compressedSize = compressedFile.size;
      const savings = ((originalSize - compressedSize) / 1024 / 1024).toFixed(2);
      const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      
      console.log('✅ Compression complete!');
      console.log('📏 Original size:', (originalSize / 1024 / 1024).toFixed(2), 'MB');
      console.log('📏 Compressed size:', (compressedSize / 1024 / 1024).toFixed(2), 'MB');
      console.log('💾 Savings:', savings, 'MB');
      console.log('📊 Compression ratio:', compressionRatio + '%');
      
      // Warn if compression didn't help much
      if (compressedSize >= originalSize * 0.95) {
        console.warn('⚠️ Compression didn\'t reduce size significantly. Original file might already be optimized.');
      }
    } catch (compressError: any) {
      console.error('❌ Compression failed:', compressError);
      throw new Error(`Image compression failed: ${compressError.message || 'Unknown error'}`);
    }
    
    const compressedSize = compressedFile.size;
    onProgress?.(70);
    
    // Generate new filename and upload compressed image to Supabase Storage
    const extension = compressedFile.name.split('.').pop() || 'jpg';
    const newFileName = buildUploadPath(
      'products',
      `${productId}_compressed.${extension}`
    );

    const newDownloadURL = await uploadToSupabaseStorage(compressedFile, newFileName, {
      contentType: compressedFile.type || 'image/jpeg',
      upsert: true,
    });
    onProgress?.(100);
    
    // Delete old image if requested
    if (deleteOld) {
      try {
        await deleteImageFromStorage(imageUrl);
      } catch (error: any) {
        console.warn('⚠️ Could not delete old image, continuing:', error.message);
      }
    }
    
    console.log('✅ Image compressed and re-uploaded:', {
      original: imageUrl,
      compressed: newDownloadURL,
      originalSize: (originalSize / 1024 / 1024).toFixed(2) + ' MB',
      compressedSize: (compressedSize / 1024 / 1024).toFixed(2) + ' MB',
      savings: (((originalSize - compressedSize) / 1024 / 1024).toFixed(2)) + ' MB'
    });
    
    return { newUrl: newDownloadURL, originalSize, compressedSize };
  } catch (error: any) {
    console.error('❌ Error compressing image:', error);
    throw new Error(`Failed to compress and re-upload image: ${error.message}`);
  }
}

/**
 * Processes a single product - compresses all its images
 */
export async function compressProductImages(
  productId: string,
  productImage: string,
  productImages?: string[],
  deleteOldImages: boolean = true,
  onProgress?: (progress: number) => void
): Promise<{
  newImage: string;
  newImages?: string[];
  savings: number; // in MB
}> {
  const allImages = [productImage, ...(productImages || [])].filter(Boolean);
  let totalSavings = 0;
  
  try {
    // Compress main image
    const mainResult = await compressAndReuploadImage(
      productImage,
      productId,
      deleteOldImages,
      (progress) => onProgress?.(progress * 0.7) // Main image is 70% of work
    );
    
    const compressedMainImage = mainResult.newUrl;
    totalSavings += (mainResult.originalSize - mainResult.compressedSize) / 1024 / 1024;
    
    // Compress additional images if any
    const compressedImages: string[] = [];
    if (productImages && productImages.length > 0) {
      for (let i = 0; i < productImages.length; i++) {
        try {
          const result = await compressAndReuploadImage(
            productImages[i],
            `${productId}_${i}`,
            deleteOldImages,
            (progress) => {
              // Remaining 30% divided among additional images
              const baseProgress = 70 + (i / productImages.length) * 30;
              onProgress?.(baseProgress + (progress / productImages.length) * 0.3);
            }
          );
          compressedImages.push(result.newUrl);
          totalSavings += (result.originalSize - result.compressedSize) / 1024 / 1024;
        } catch (error: any) {
          console.warn(`⚠️ Failed to compress additional image ${i}:`, error);
          // Keep original if compression fails
          compressedImages.push(productImages[i]);
        }
      }
    }
    
    return {
      newImage: compressedMainImage,
      newImages: compressedImages.length > 0 ? compressedImages : undefined,
      savings: totalSavings
    };
  } catch (error: any) {
    console.error(`❌ Error compressing product ${productId}:`, error);
    throw error;
  }
}

/**
 * Checks if an image URL is from Firebase Storage (legacy)
 */
export function isFirebaseStorageUrl(url: string): boolean {
  return url.includes('firebasestorage.googleapis.com') || 
         url.includes('firebasestorage.app') ||
         url.includes('firebase');
}

/**
 * Checks if an image URL is from Supabase Storage
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase.co/storage') || url.includes('/object/public/uploads/');
}

/**
 * Checks if an image is already compressed (has '_compressed' in filename)
 */
export function isAlreadyCompressed(url: string): boolean {
  return url.includes('_compressed') || url.includes('compressed');
}

