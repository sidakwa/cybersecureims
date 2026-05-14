import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface AvatarUploadProps {
  onUploadComplete?: (url: string) => void;
}

export function AvatarUpload({ onUploadComplete }: AvatarUploadProps) {
  const { user, profile, refresh } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(profile?.avatar_url || null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, GIF)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          onUploadProgress: (progressEvent) => {
            const percent = (progressEvent.loaded / progressEvent.total) * 100;
            setProgress(Math.round(percent));
          }
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Refresh user context
      await refresh();
      
      if (onUploadComplete) {
        onUploadComplete(publicUrl);
      }
      
      URL.revokeObjectURL(objectUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
      setPreview(profile?.avatar_url || null);
    } finally {
      setUploading(false);
    }
  }, [user, profile, refresh, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const getUserInitials = () => {
    if (profile?.full_name) return profile.full_name.substring(0, 2).toUpperCase();
    if (user?.email) return user.email.substring(0, 2).toUpperCase();
    return 'U';
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Preview */}
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={preview || undefined} />
          <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl">
            {getUserInitials()}
          </AvatarFallback>
        </Avatar>
        
        {/* Upload Overlay */}
        <div
          {...getRootProps()}
          className={`absolute inset-0 rounded-full flex items-center justify-center bg-black/50 cursor-pointer transition-opacity ${
            isDragActive ? 'opacity-100' : 'opacity-0 hover:opacity-100'
          }`}
        >
          <input {...getInputProps()} />
          <Camera className="h-8 w-8 text-white" />
        </div>
      </div>

      {/* Upload Button */}
      <div className="text-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('avatar-input')?.click()}
          disabled={uploading}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading...' : 'Change Avatar'}
        </Button>
        <p className="text-xs text-gray-400 mt-2">
          JPG, PNG or GIF. Max 2MB.
        </p>
      </div>

      {/* Progress Bar */}
      {uploading && (
        <div className="w-full max-w-xs">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center text-gray-500 mt-1">{progress}% uploaded</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
