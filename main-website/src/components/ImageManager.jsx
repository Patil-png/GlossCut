import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import Image from './Image';

const ImageManager = ({
  images = [],
  onImagesChange,
  maxImages = 5,
  title = "Shop Images",
  description = "Upload high-quality images of your shop and services",
  acceptedTypes = "image/*",
  maxSizeMB = 5
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);

    if (files.length + images.length > maxImages) {
      setErrors({ general: `Maximum ${maxImages} images allowed` });
      return;
    }

    setUploading(true);
    setErrors({});

    const newImages = [];
    const uploadPromises = files.map(async (file, index) => {
      // Validate file
      if (file.size > maxSizeMB * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          [file.name]: `File size must be less than ${maxSizeMB}MB`
        }));
        return;
      }

      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          [file.name]: 'Only image files are allowed'
        }));
        return;
      }

      // Create FormData for upload
      const formData = new FormData();
      formData.append('shopImage', file);

      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        // Simulate upload progress (replace with actual upload)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: Math.min((prev[file.name] || 0) + 10, 90)
          }));
        }, 100);

        // Here you would make the actual API call
        // const response = await axios.post('/api/shop/upload-image', formData, {
        //   headers: { 'Content-Type': 'multipart/form-data' },
        //   onUploadProgress: (progressEvent) => {
        //     const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        //     setUploadProgress(prev => ({ ...prev, [file.name]: percentCompleted }));
        //   }
        // });

        // Simulate API response
        await new Promise(resolve => setTimeout(resolve, 2000));

        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

        // Mock successful upload response
        const mockImageUrl = URL.createObjectURL(file); // In real app, use response.data.imageUrl

        newImages.push({
          id: Date.now() + index,
          url: mockImageUrl,
          name: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString()
        });

      } catch (error) {
        console.error('Upload error:', error);
        setErrors(prev => ({
          ...prev,
          [file.name]: 'Upload failed. Please try again.'
        }));
      }
    });

    await Promise.all(uploadPromises);

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }

    setUploading(false);
    setUploadProgress({});
    event.target.value = ''; // Reset file input
  };

  const removeImage = (imageId) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    onImagesChange(updatedImages);
  };

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm">{description}</p>
        <p className="text-zinc-500 text-xs mt-1">
          Maximum {maxImages} images • Up to {maxSizeMB}MB each • JPG, PNG, WebP
        </p>
      </div>

      {/* Upload Area */}
      <div className="mb-6">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
          className="w-full h-32 border-2 border-dashed border-zinc-700 rounded-lg hover:border-amber-500/50 hover:bg-amber-500/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-3"
        >
          <Upload className="w-8 h-8 text-zinc-500" />
          <div className="text-center">
            <p className="text-zinc-300 font-medium">
              {uploading ? 'Uploading...' : 'Click to upload images'}
            </p>
            <p className="text-zinc-500 text-sm">
              {images.length}/{maxImages} images uploaded
            </p>
          </div>
        </button>
      </div>

      {/* Error Messages */}
      {errors.general && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{errors.general}</p>
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="mb-4 space-y-2">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
              <div className="flex-1">
                <p className="text-zinc-300 text-sm font-medium truncate">{fileName}</p>
                <div className="w-full bg-zinc-700 rounded-full h-2 mt-1">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              {progress === 100 && (
                <CheckCircle className="w-5 h-5 text-green-400" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-zinc-800">
                <Image
                  src={image.url}
                  alt={image.name || `Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Overlay with controls */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <button
                  onClick={() => removeImage(image.id)}
                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Image info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 rounded-b-lg">
                <p className="text-white text-xs font-medium truncate">
                  {image.name || `Image ${index + 1}`}
                </p>
                {image.size && (
                  <p className="text-zinc-400 text-xs">
                    {(image.size / 1024 / 1024).toFixed(1)}MB
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !uploading && (
        <div className="text-center py-8">
          <ImageIcon className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">No images uploaded yet</p>
          <p className="text-zinc-600 text-sm">Upload images to showcase your shop</p>
        </div>
      )}
    </div>
  );
};

export default ImageManager;
