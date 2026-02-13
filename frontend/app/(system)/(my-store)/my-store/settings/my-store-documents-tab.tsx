'use client';

import { useRef, useState } from 'react';
import { useUploadMyDocument, useDeleteMyDocument } from '@/hooks/useMyMerchant';
import { useActiveDocumentTypes } from '@/hooks/useDocumentTypes';
import { Merchant } from '@/types/api';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { FileText, Trash2, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Props { merchant: Merchant; }

export function MyStoreDocumentsTab({ merchant }: Props) {
  const uploadMutation = useUploadMyDocument();
  const deleteMutation = useDeleteMyDocument();
  const { data: docTypesData, isLoading: typesLoading } = useActiveDocumentTypes();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);

  const allTypes = docTypesData?.data || [];
  const merchantDocs = merchant.documents || [];

  const groupedDocs = allTypes.map((type) => ({
    type,
    documents: merchantDocs.filter((doc) => doc.document_type_id === type.id),
  }));

  const handleUpload = (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedTypeId) return;
    const file = files[0];
    uploadMutation.mutate({ documentTypeId: selectedTypeId, file }, {
      onSuccess: () => {
        toast.success('Document uploaded');
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      onError: () => {
        toast.error('Failed to upload document');
      },
    });
  };

  const handleDelete = (documentId: number) => {
    deleteMutation.mutate(documentId, {
      onSuccess: () => {
        toast.success('Document deleted');
      },
      onError: () => {
        toast.error('Failed to delete document');
      },
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>Upload and manage store documents</CardDescription>
      </CardHeader>
      <CardContent>
        {typesLoading ? (
          <div className="flex justify-center py-8"><Spinner className="h-6 w-6" /></div>
        ) : (
          <>
            <div className="flex gap-3 mb-6">
              <Select
                value={selectedTypeId ? String(selectedTypeId) : '__none__'}
                onValueChange={(v) => setSelectedTypeId(v === '__none__' ? null : parseInt(v))}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select document type</SelectItem>
                  {allTypes.map((type) => (
                    <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedTypeId || uploadMutation.isPending}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </div>

            <Separator className="my-4" />

            {groupedDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No document types available.</p>
            ) : (
              <div className="space-y-6">
                {groupedDocs.map(({ type, documents }) => (
                  <div key={type.id}>
                    <h4 className="text-sm font-medium mb-2">{type.name}</h4>
                    {documents.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No documents uploaded</p>
                    ) : (
                      <div className="space-y-2">
                        {documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{doc.file?.name || 'Document'}</span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => doc.file?.url && window.open(doc.file.url, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(doc.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
