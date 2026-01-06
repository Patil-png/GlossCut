const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

  // Initialize R2 client
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  // Upload file to R2
  const uploadToR2 = async (fileBuffer, fileName, mimeType, folder = 'images', existingKey = null) => {
    try {
      // Use existing key if provided (for updates), otherwise generate new key
      const key = existingKey || `${folder}/${Date.now()}-${fileName}`;

      console.log('🔄 R2 Upload: Starting upload to bucket:', process.env.R2_BUCKET_NAME);
      console.log('🔄 R2 Upload: Key:', key);
      console.log('🔄 R2 Upload: Using existing key:', !!existingKey);
      console.log('🔄 R2 Upload: Endpoint:', process.env.R2_ENDPOINT);

      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
          Body: fileBuffer,
          ContentType: mimeType,
          // Note: R2 doesn't support ACL like S3, files are private by default
          // We'll need to make the bucket public or use signed URLs
        },
      });

      const result = await upload.done();
      console.log('✅ R2 Upload: Upload successful');

      // Construct the public URL
      const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
      console.log('🔗 R2 Upload: Public URL:', publicUrl);

      return {
        success: true,
        key,
        url: publicUrl,
      };
    } catch (error) {
      console.error('❌ R2 Upload Error:', error);
      console.error('❌ R2 Upload Error Details:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        bucket: process.env.R2_BUCKET_NAME,
        endpoint: process.env.R2_ENDPOINT
      });
      return {
        success: false,
        error: error.message,
      };
    }
  };

  // Delete file from R2
  const deleteFromR2 = async (key) => {
    try {
      const command = new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting from R2:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  // Extract key from R2 URL
  const extractKeyFromUrl = (url) => {
    if (!url || !process.env.R2_PUBLIC_URL) return null;

    try {
      // Handle different URL formats
      let cleanUrl = url;

      // If it's a full URL starting with http, extract the path part
      if (cleanUrl.startsWith('http')) {
        // Remove protocol and domain, keep only the path
        const urlObj = new URL(cleanUrl);
        cleanUrl = urlObj.pathname + urlObj.search;
      }

      // Remove leading slash
      cleanUrl = cleanUrl.replace(/^\//, '');

      // If it starts with 'Uploads/', it's a local upload, not R2
      if (cleanUrl.startsWith('Uploads/')) {
        return cleanUrl;
      }

      // For R2 URLs, remove the base URL part
      const baseUrl = process.env.R2_PUBLIC_URL.replace(/\/$/, '');
      if (cleanUrl.startsWith(baseUrl)) {
        cleanUrl = cleanUrl.replace(baseUrl + '/', '');
      }

      // Remove cache-busting query parameters
      cleanUrl = cleanUrl.split('?')[0];

      // Ensure we have a valid key
      if (!cleanUrl || cleanUrl.includes('http') || cleanUrl.length < 3) {
        return null;
      }

      return cleanUrl;
    } catch (error) {
      console.error('Error extracting key from URL:', error, url);
      return null;
    }
  };

  // Clean up old image when uploading new one (replaces instead of creating new)
  const uploadToR2WithCleanup = async (fileBuffer, fileName, mimeType, folder = 'images', oldImageUrl = null) => {
    try {
      let existingKey = null;

      // Extract key from old image URL if it exists and is from R2
      if (oldImageUrl && typeof oldImageUrl === 'string' && oldImageUrl.includes(process.env.R2_PUBLIC_URL)) {
        existingKey = extractKeyFromUrl(oldImageUrl);
        if (existingKey && !existingKey.includes('http')) { // Ensure we got a valid key, not a URL
          console.log('🔄 Replacing existing R2 image with key:', existingKey);
          // Note: We don't delete the old image since we're replacing it with the same key
        } else {
          console.log('⚠️ Invalid existing key extracted, will generate new key');
          existingKey = null;
        }
      } else if (oldImageUrl) {
        console.log('ℹ️ Old image URL is not an R2 URL, skipping cleanup:', oldImageUrl);
      }

      // Upload new image (will replace existing if same key is used)
      const result = await uploadToR2(fileBuffer, fileName, mimeType, folder, existingKey);

      // If we reused an existing key, add cache-busting parameter to force refresh
      if (existingKey && result.success) {
        const cacheBustingUrl = `${result.url}?v=${Date.now()}`;
        console.log('🔄 Added cache-busting to updated image URL');
        return {
          ...result,
          url: cacheBustingUrl,
        };
      }

      return result;
    } catch (error) {
      console.error('❌ Error in upload with cleanup:', error);
      // If cleanup fails, still try to upload new image
      return await uploadToR2(fileBuffer, fileName, mimeType, folder);
    }
  };

// Generate signed URL for secure image access
const generateSignedUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    console.log('🔗 Generated signed URL for key:', key);

    return {
      success: true,
      signedUrl,
    };
  } catch (error) {
    console.error('❌ Error generating signed URL:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  uploadToR2,
  deleteFromR2,
  extractKeyFromUrl,
  uploadToR2WithCleanup,
  generateSignedUrl,
};
