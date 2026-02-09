'use client';

import { useState, useRef } from 'react';
import { useUploadMerchantDocument, useDeleteMerchantDocument } from '@/hooks/useMerchants';
import { useActiveDocumentTypes } from '@/hooks/useDocumentTypes';
import { Merchant } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { FileText, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Props { merchant: Merchant; }

export function MerchantDocumentsTab({ merchant }: Props) {
  const uploadMutation = useUploadMerchantDocument();
  const deleteMutation = useDeleteMerchantDocument();
  const { data: documentTypesData, isLoading: typesLoading } = useActiveDocumentTypes();
  const documentTypes = documentTypesData?.data || [];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const documents = merchant.documents || [];

  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !selectedTypeId) return;
    uploadMutation.mutate({ id: merchant.id, documentTypeId: selectedTypeId, file, notes: notes || undefined }, {
      onSuccess: () => {
        toast.success('Document uploaded');
        setNotes('');
        setSelectedTypeId(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });
  };

  const handleDelete = (documentId: number) => {
    deleteMutation.mutate({ merchantId: merchant.id, documentId }, {
      onSuccess: () => toast.success('Document deleted'),
    });
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>Add a new document to the merchant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Type</label>
                <Select
                  value={selectedTypeId ? String(selectedTypeId) : ''}
                  onValueChange={(v) => setSelectedTypeId(parseInt(v))}
                  disabled={typesLoading}
                >
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((dt) => (<SelectItem key={dt.id} value={String(dt.id)}>{dt.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,image/jpeg,image/png" className="text-sm" />
              <Button onClick={handleUpload} disabled={uploadMutation.isPending || !selectedTypeId}>
                {uploadMutation.isPending ? <Spinner className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Documents</CardTitle>
          <CardDescription>Manage uploaded documents</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[70px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.document_type?.name || '-'}</TableCell>
                    <TableCell>
                      {doc.file ? (
                        <a href={doc.file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                          {doc.file.name}
                        </a>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{doc.notes || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)} disabled={deleteMutation.isPending}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
