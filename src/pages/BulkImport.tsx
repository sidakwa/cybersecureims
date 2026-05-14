import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';

export default function BulkImport() {
  const { profile, isAdmin } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);

    // Simulate upload - implement actual CSV/JSON parsing as needed
    setTimeout(() => {
      setResult({
        success: true,
        message: `File "${file.name}" uploaded successfully. ${file.size} bytes.`
      });
      setUploading(false);
    }, 2000);
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="bg-red-50">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">Access Denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Import</h1>
        <p className="text-gray-500 mt-1">Import data from CSV or Excel files</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Upload CSV or Excel file</p>
              <p className="text-sm text-gray-400 mb-4">Supported formats: .csv, .xlsx, .xls</p>
              <input
                type="file"
                id="file-upload"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Select File
              </Button>
              {file && (
                <div className="mt-4 p-2 bg-gray-100 rounded text-sm">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {file && (
          <Card>
            <CardContent className="pt-6">
              <Button onClick={handleUpload} disabled={uploading} className="w-full">
                {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                {uploading ? 'Importing...' : 'Import Data'}
              </Button>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className={result.success ? 'bg-green-50' : 'bg-red-50'}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                {result.success ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
                <p className={result.success ? 'text-green-600' : 'text-red-600'}>{result.message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Import Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="link" className="justify-start px-0">Download Controls Template</Button>
            <Button variant="link" className="justify-start px-0">Download Risks Template</Button>
            <Button variant="link" className="justify-start px-0">Download Vendors Template</Button>
            <Button variant="link" className="justify-start px-0">Download Users Template</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
