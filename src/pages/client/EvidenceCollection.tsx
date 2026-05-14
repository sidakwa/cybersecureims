import React, { useState } from 'react';
import { useFrameworks, useEvidenceSubmissions } from '../hooks/useCompliance';
import { useDocuments } from '../hooks/useDocuments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Upload, FileText, CheckCircle2, Clock, AlertCircle, Eye, X, Download } from 'lucide-react';

export default function EvidenceCollection() {
  const { frameworks, loading: frameworksLoading } = useFrameworks();
  const { submissions, loading: submissionsLoading, createSubmission, updateSubmission } = useEvidenceSubmissions();
  const { uploadDocument, documents } = useDocuments();
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState('');
  const [selectedControl, setSelectedControl] = useState('');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': 
        return <Badge className="bg-green-500 text-[#0D2240]">Approved</Badge>;
      case 'submitted': 
        return <Badge className="bg-blue-500 text-[#0D2240]">Under Review</Badge>;
      case 'under_review': 
        return <Badge className="bg-blue-500 text-[#0D2240]">Under Review</Badge>;
      case 'needs_changes': 
        return <Badge className="bg-yellow-500 text-[#0D2240]">Changes Needed</Badge>;
      case 'rejected': 
        return <Badge className="bg-red-500 text-[#0D2240]">Rejected</Badge>;
      case 'draft': 
        return <Badge variant="outline">Draft</Badge>;
      default: 
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'submitted': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'under_review': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'needs_changes': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'rejected': return <X className="w-4 h-4 text-red-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (!selectedFramework || !selectedControl || !evidenceTitle) {
      alert('Please fill in all required fields');
      return;
    }

    setUploading(true);
    try {
      // Upload files to Supabase Storage
      const uploadedFileIds = [];
      for (const file of selectedFiles) {
        const result = await uploadDocument(file, 'evidence');
        if (result?.data) {
          uploadedFileIds.push(result.data.id);
        }
      }

      // Create evidence submission
      const submission = {
        client_organization_id: await getCurrentOrganizationId(),
        framework_id: selectedFramework,
        control_id: selectedControl,
        title: evidenceTitle,
        description: evidenceDescription,
        status: 'submitted',
        submission_date: new Date().toISOString(),
        evidence_document_ids: uploadedFileIds,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      const { error } = await createSubmission(submission);
      
      if (!error) {
        setShowUploadModal(false);
        resetForm();
      } else {
        alert('Error submitting evidence: ' + error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading evidence');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFramework('');
    setSelectedControl('');
    setEvidenceTitle('');
    setEvidenceDescription('');
    setSelectedFiles([]);
  };

  const getFrameworkControls = (frameworkId: string) => {
    const framework = frameworks.find(f => f.id === frameworkId);
    return framework?.controls || [];
  };

  if (frameworksLoading || submissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Evidence Collection</h1>
          <p className="text-muted-foreground mt-2">
            Upload and manage compliance evidence for your frameworks
          </p>
        </div>
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" /> Upload Evidence
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Compliance Evidence</DialogTitle>
              <DialogDescription>
                Upload documents and evidence to demonstrate compliance with framework requirements.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Compliance Framework *</Label>
                <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a framework" />
                  </SelectTrigger>
                  <SelectContent>
                    {frameworks.map((framework) => (
                      <SelectItem key={framework.id} value={framework.id}>
                        {framework.name} - {framework.version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Control/Requirement *</Label>
                <Select value={selectedControl} onValueChange={setSelectedControl} disabled={!selectedFramework}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a control" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedFramework && getFrameworkControls(selectedFramework).map((control: any) => (
                      <SelectItem key={control.control_id} value={control.control_id}>
                        {control.control_id} - {control.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Evidence Title *</Label>
                <Input 
                  placeholder="e.g., HACCP Plan Documentation 2024"
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Provide additional context about this evidence..."
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Documents *</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB each)
                    </p>
                  </label>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                        <span>{file.name}</span>
                        <span className="text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Submit Evidence'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{submissions.length}</div>
            <p className="text-xs text-muted-foreground">Total Submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {submissions.filter(s => s.status === 'submitted' || s.status === 'under_review').length}
            </div>
            <p className="text-xs text-muted-foreground">Under Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {submissions.filter(s => s.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {submissions.filter(s => s.status === 'needs_changes').length}
            </div>
            <p className="text-xs text-muted-foreground">Needs Changes</p>
          </CardContent>
        </Card>
      </div>

      {/* Evidence Submissions Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Submissions</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="needs-work">Needs Work</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {submissions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No evidence submissions yet</p>
                <Button className="mt-4" variant="outline" onClick={() => setShowUploadModal(true)}>
                  Upload Your First Evidence
                </Button>
              </CardContent>
            </Card>
          ) : (
            submissions.map((submission) => (
              <Card key={submission.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(submission.status)}
                        <CardTitle className="text-lg">{submission.title}</CardTitle>
                      </div>
                      <CardDescription>
                        Control: {submission.control_id}
                      </CardDescription>
                    </div>
                    {getStatusBadge(submission.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="space-y-2 flex-1">
                      {submission.description && (
                        <p className="text-sm text-muted-foreground">{submission.description}</p>
                      )}
                      
                      {submission.auditor_feedback && (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm font-semibold text-yellow-800 mb-1">Auditor Feedback:</p>
                          <p className="text-sm text-yellow-700">{submission.auditor_feedback}</p>
                        </div>
                      )}
                      
                      <div className="flex space-x-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setShowDetailsModal(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        
                        {submission.status === 'needs_changes' && (
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => setShowUploadModal(true)}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Resubmit
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {submission.score && (
                      <div className="text-right ml-4">
                        <div className="text-sm text-muted-foreground">Compliance Score</div>
                        <div className="text-2xl font-bold text-green-600">{submission.score}%</div>
                      </div>
                    )}
                    
                    <div className="text-right ml-4">
                      <div className="text-xs text-muted-foreground">Submitted</div>
                      <div className="text-sm">
                        {new Date(submission.submission_date || submission.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {submissions.filter(s => s.status === 'submitted' || s.status === 'under_review').map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{submission.title}</CardTitle>
                    <CardDescription>Control: {submission.control_id}</CardDescription>
                  </div>
                  <Badge className="bg-blue-500">Under Review</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setSelectedSubmission(submission);
                    setShowDetailsModal(true);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Track Progress
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {submissions.filter(s => s.status === 'approved').map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{submission.title}</CardTitle>
                    <CardDescription>Control: {submission.control_id}</CardDescription>
                  </div>
                  <Badge className="bg-green-500">Approved</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified on {new Date(submission.updated_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Evidence Details</DialogTitle>
            <DialogDescription>
              Review your submission and auditor feedback
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="border-b pb-3">
                <h3 className="font-semibold mb-1">{selectedSubmission.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Control: {selectedSubmission.control_id}
                </p>
              </div>
              
              {selectedSubmission.description && (
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="text-sm mt-1">{selectedSubmission.description}</p>
                </div>
              )}
              
              {selectedSubmission.auditor_feedback && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <label className="text-sm font-medium text-yellow-800">Auditor Feedback</label>
                  <p className="text-sm mt-1 text-yellow-700">{selectedSubmission.auditor_feedback}</p>
                </div>
              )}
              
              {selectedSubmission.evidence_document_ids?.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Attached Documents</label>
                  <div className="mt-2 space-y-2">
                    {selectedSubmission.evidence_document_ids.map((docId: string, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">Document {index + 1}</span>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between text-sm text-muted-foreground pt-3 border-t">
                <span>Submitted: {new Date(selectedSubmission.created_at).toLocaleString()}</span>
                <span>Status: {selectedSubmission.status}</span>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
