import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface DocumentUploadProps {
  onSuccess?: () => void;
  onClose?: () => void;
  relatedTo?: string;
}

const DOCUMENT_CATEGORIES = ['SOP', 'Policy', 'Certificate', 'Audit Report', 'HACCP Plan', 'Training Record', 'Contract', 'Other'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png'];

export function DocumentUpload({ onSuccess, onClose, relatedTo }: DocumentUploadProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    version: '1.0',
    expiry_date: '',
    related_to: relatedTo || ''
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File too large. Max size is 50MB`);
      return;
    }
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError(`File type not allowed. Allowed: PDF, DOC, DOCX, XLS, XLSX, JPEG, PNG`);
      return;
    }
    setFile(selectedFile);
    setError(null);
    setFormData(prev => ({ ...prev, name: selectedFile.name.split('.')[0] }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 });

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }
    if (!formData.name || !formData.category) {
      setError('Please provide a name and category');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const userId = user?.id || 'anonymous';
      const filePath = `${userId}/${fileName}`;


      // Upload to Storage
      const { error: uploadError, data } = await supabase.storage
        .from('food-safety-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('food-safety-documents')
        .getPublicUrl(filePath);

      // Save to documents table
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          version: formData.version,
          expiry_date: formData.expiry_date || null,
          related_to: formData.related_to || null,
          file_path: filePath,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          original_name: file.name,
          uploaded_by: userId,
          status: 'Active'
        });

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw new Error(dbError.message);
      }

      setSuccess(true);
      setProgress(100);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {success ? (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Upload Successful!</h3>
          <p className="text-sm text-gray-500">Your document has been uploaded.</p>
        </div>
      ) : (
        <>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Drop your file here...</p>
            ) : (
              <div>
                <p className="text-gray-600">Drag & drop your document here</p>
                <p className="text-sm text-gray-400 mt-1">or click to browse</p>
                {file && <p className="text-sm text-green-600 mt-2">Selected: {file.name}</p>}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Document Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., HACCP Plan v2"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the document"
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="1.0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-gray-500 text-center">{progress}% uploaded</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleUpload} disabled={uploading || !file} className="flex-1 gap-2">
              {uploading ? 'Uploading...' : <><Upload className="h-4 w-4" /> Upload Document</>}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
