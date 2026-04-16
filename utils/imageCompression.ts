// Image compression utility for client-side compression
// Compresses images to reduce file size while maintaining visual quality

import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number; // Maximum file size in MB (default: 1MB)
  maxWidthOrHeight?: number; // Maximum width or height (default: 1920px)
  useWebWorker?: boolean; // Use web worker for compression (default: true)
  fileType?: string; // Output file type (default: 'image/jpeg' or 'image/webp')
  initialQuality?: number; // Initial quality (0-1, default: 0.9)
  maxIteration?: number; // Maximum iteration for quality adjustment (default: 10)
  exifOrientation?: number; // Exif orientation (default: 1)
  onProgress?: (progress: number) => void; // Progress callback
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 1, // Target 1MB file size
  maxWidthOrHeight: 1920, // Max dimension 1920px (good for web)
  useWebWorker: true, // Use web worker for better performance
  initialQuality: 0.9, // Start with 90% quality (high quality)
  maxIteration: 10, // Allow up to 10 iterations to reach target size
  exifOrientation: 1
};

/**
 * Compresses an image file while maintaining visual quality
 * Automatically adjusts quality to reach target file size
 * 
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  try {
    // Determine output file type based on input
    const inputType = file.type.toLowerCase();
    let outputType = options.fileType;
    
    if (!outputType) {
      // Prefer WebP if browser supports it, otherwise use JPEG for photos
      if (inputType.includes('webp')) {
        outputType = 'image/webp';
      } else if (inputType.includes('png')) {
        // Keep PNG if it's likely a graphic/image with transparency
        outputType = 'image/png';
      } else {
        // Use JPEG for photos (better compression)
        outputType = 'image/jpeg';
      }
    }

    // Merge options with defaults
    const compressionOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
      fileType: outputType
    };

    console.log('🗜️ Compressing image:', {
      originalSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      originalType: file.type,
      targetSize: compressionOptions.maxSizeMB + ' MB',
      outputType: compressionOptions.fileType
    });

    // Compress the image
    const compressedFile = await imageCompression(file, compressionOptions);

    const originalSizeMB = file.size / 1024 / 1024;
    const compressedSizeMB = compressedFile.size / 1024 / 1024;
    const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1);

    console.log('✅ Image compressed:', {
      originalSize: originalSizeMB.toFixed(2) + ' MB',
      compressedSize: compressedSizeMB.toFixed(2) + ' MB',
      compressionRatio: compressionRatio + '%',
      savings: (originalSizeMB - compressedSizeMB).toFixed(2) + ' MB'
    });

    return compressedFile;
  } catch (error: any) {
    console.error('❌ Image compression failed:', error);
    // If compression fails, return original file
    throw new Error(`Failed to compress image: ${error.message}`);
  }
}

/**
 * Compresses an image with aggressive compression settings for very large files
 * Use this for images that are way too large
 */
export async function compressImageAggressive(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.8, // Target 800KB
    maxWidthOrHeight: 1600, // Max dimension 1600px
    initialQuality: 0.85, // Start with 85% quality
  });
}

/**
 * Compresses an image with conservative settings for already small files
 * Use this when you want minimal compression
 */
export async function compressImageConservative(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 2, // Target 2MB
    maxWidthOrHeight: 2560, // Max dimension 2560px
    initialQuality: 0.95, // Start with 95% quality (very high)
  });
}

/**
 * Smart compression - automatically chooses compression level based on file size
 */
export async function compressImageSmart(file: File): Promise<File> {
  const fileSizeMB = file.size / 1024 / 1024;
  
  if (fileSizeMB > 3) {
    // Very large file - use aggressive compression
    console.log('📦 Large file detected, using aggressive compression');
    return compressImageAggressive(file);
  } else if (fileSizeMB < 0.5) {
    // Small file - use conservative compression
    console.log('📦 Small file detected, using conservative compression');
    return compressImageConservative(file);
  } else {
    // Medium file - use default compression
    console.log('📦 Medium file detected, using standard compression');
    return compressImage(file);
  }
}

