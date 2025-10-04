import React, { useRef, useState } from 'react';
import { API_BASE } from '../config';
import { auth } from '../lib/auth';

export function ImageUpload({ 
  currentImageUrl, 
  onImageUploaded, 
  label = 'Upload Image',
  accept = 'image/png,image/jpeg,image/jpg',
  maxSizeMB = 5,
  className = ''
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG or JPEG)');
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target.result;
        
        // Upload to backend
        const response = await fetch(`${API_BASE}/upload/image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
          },
          body: JSON.stringify({
            dataUrl,
            filename: file.name
          })
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        setUploading(false);
        
        // Call the callback with the image URL
        onImageUploaded?.(data.url);
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="flex items-center gap-3">
        {currentImageUrl && (
          <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-slate-200">
            <img 
              src={currentImageUrl} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-white border-2 border-brand-teal text-brand-teal rounded-lg hover:bg-brand-teal hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {uploading ? 'Uploading...' : label}
        </button>
      </div>

      {error && (
        <p className="text-sm text-rose-600">{error}</p>
      )}
      
      <p className="text-xs text-slate-500">
        Accepts PNG and JPEG files up to {maxSizeMB}MB
      </p>
    </div>
  );
}
