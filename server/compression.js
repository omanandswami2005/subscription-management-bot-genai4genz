import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Validate plan features structure
 * @param {Object} features - Plan features object
 * @throws {Error} If validation fails
 */
function validatePlanFeatures(features) {
  if (!features || typeof features !== 'object') {
    throw new Error('Plan features must be an object');
  }

  // Check for required fields based on common plan structure
  if (Array.isArray(features)) {
    throw new Error('Plan features must be an object, not an array');
  }

  return true;
}

/**
 * Compress plan features using gzip
 * @param {Object} features - Plan features object to compress
 * @returns {Promise<Buffer>} Compressed data as Buffer
 */
export async function compressPlanFeatures(features) {
  try {
    // Validate structure before compression
    validatePlanFeatures(features);

    // Convert to JSON string
    const json = JSON.stringify(features);
    
    // Compress using gzip
    const compressed = await gzip(Buffer.from(json, 'utf-8'));
    
    return compressed;
  } catch (error) {
    console.error('Compression error:', error);
    throw new Error(`Failed to compress plan features: ${error.message}`);
  }
}

/**
 * Decompress plan features from gzip
 * @param {Buffer} compressed - Compressed data buffer
 * @returns {Promise<Object>} Decompressed plan features object
 */
export async function decompressPlanFeatures(compressed) {
  try {
    if (!Buffer.isBuffer(compressed)) {
      throw new Error('Compressed data must be a Buffer');
    }

    // Decompress using gunzip
    const decompressed = await gunzip(compressed);
    
    // Parse JSON
    const json = decompressed.toString('utf-8');
    const features = JSON.parse(json);
    
    return features;
  } catch (error) {
    console.error('Decompression error:', error);
    throw new Error(`Failed to decompress plan features: ${error.message}`);
  }
}

/**
 * Synchronous version of compress for use in tests
 * @param {Object} features - Plan features object
 * @returns {Buffer} Compressed data
 */
export function compressPlanFeaturesSync(features) {
  validatePlanFeatures(features);
  const json = JSON.stringify(features);
  return zlib.gzipSync(Buffer.from(json, 'utf-8'));
}

/**
 * Synchronous version of decompress for use in tests
 * @param {Buffer} compressed - Compressed data buffer
 * @returns {Object} Decompressed features
 */
export function decompressPlanFeaturesSync(compressed) {
  if (!Buffer.isBuffer(compressed)) {
    throw new Error('Compressed data must be a Buffer');
  }
  const decompressed = zlib.gunzipSync(compressed);
  return JSON.parse(decompressed.toString('utf-8'));
}
