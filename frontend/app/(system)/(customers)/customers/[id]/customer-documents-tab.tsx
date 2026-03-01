'use client';

import { useState, useRef } from 'react';
import {
  useUploadCustomerDocument,
  useDeleteCustomerDocument,
  useVerifyCustomerIdentity,
  useRejectCustomerIdentity,
} from '@/hooks/useCustomers';
import { useActiveDocumentTypes } from '@/hooks/useDocumentTypes';
import { Customer } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { FileText, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { PermissionGate } from '@/components/permission-gate';
import { format } from 'date-fns';

interface Props { customer: Customer; }

function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(url);
}

function isPdfUrl(url: string): boolean {
  return /\.pdf(\?.*)?$/i.test(url);
}

export function CustomerDocumentsTab({ customer }: Props) {
  const uploadMutation = useUploadCustomerDocument();
  const deleteMutation = useDeleteCustomerDocument();
  const verifyMutation = useVerifyCustomerIdentity();
  const rejectMutation = useRejectCustomerIdentity();
  const { data: documentTypesData, isLoading: typesLoading } = useActiveDocumentTypes();
  const documentTypes = documentTypesData?.data || [];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const documents = customer.documents || [];
  const identityStatus = customer.identity_document_status ?? 'none';

  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !selectedTypeId) return;
    uploadMutation.mutate({ id: customer.id, documentTypeId: selectedTypeId, file, notes: notes || undefined }, {
      onSuccess: () => {
        toast.success('Document uploaded');
        setNotes('');
        setSelectedTypeId(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });
  };

  const handleDelete = (documentId: number) => {
    deleteMutation.mutate({ customerId: customer.id, documentId }, {
      onSuccess: () => toast.success('Document deleted'),
    });
  };

  const handleVerify = () => {
    verifyMutation.mutate(customer.id, {
      onSuccess: () => toast.success('Identity approved'),
      onError: () => toast.error('Failed to approve identity'),
    });
  };

  const handleReject = () => {
    rejectMutation.mutate({ id: customer.id, reason: rejectReason || undefined }, {
      onSuccess: () => {
        toast.success('Identity rejected');
        setShowRejectForm(false);
        setRejectReason('');
      },
      onError: () => toast.error('Failed to reject identity'),
    });
  };

  const handleReset = () => {
    rejectMutation.mutate({ id: customer.id }, {
      onSuccess: () => toast.success('Identity status reset'),
      onError: () => toast.error('Failed to reset identity status'),
    });
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Identity Verification Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Identity Verification
          </CardTitle>
          <CardDescription>Government ID submitted by the customer</CardDescription>
        </CardHeader>
        <CardContent>
          {identityStatus === 'none' && (
            <div className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
              No identity document has been submitted yet.
            </div>
          )}

          {identityStatus === 'pending' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-amber-400 text-amber-600 bg-amber-50">
                  Under Review
                </Badge>
              </div>

              {customer.identity_document && (
                <div className="space-y-2">
                  {isImageUrl(customer.identity_document) ? (
                    <img
                      src={customer.identity_document}
                      alt="Identity document"
                      className="rounded border object-contain"
                      style={{ maxHeight: 200 }}
                    />
                  ) : (
                    <a
                      href={customer.identity_document}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      {isPdfUrl(customer.identity_document) ? 'Download PDF' : 'Download Document'}
                    </a>
                  )}
                </div>
              )}

              <PermissionGate permission="customers.update">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleVerify}
                      disabled={verifyMutation.isPending || rejectMutation.isPending}
                    >
                      {verifyMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectForm((prev) => !prev)}
                      disabled={verifyMutation.isPending || rejectMutation.isPending}
                    >
                      Reject
                    </Button>
                  </div>

                  {showRejectForm && (
                    <div className="space-y-2 rounded-md border p-3">
                      <label className="text-sm font-medium">Reason (optional)</label>
                      <Textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Explain why the document is being rejected..."
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleReject}
                          disabled={rejectMutation.isPending}
                        >
                          {rejectMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                          Confirm Rejection
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </PermissionGate>
            </div>
          )}

          {identityStatus === 'approved' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              </div>
              {customer.identity_verified_at && (
                <p className="text-sm text-muted-foreground">
                  Verified on {format(new Date(customer.identity_verified_at), 'MMM d, yyyy')}
                </p>
              )}
              {customer.identity_document && (
                <a
                  href={customer.identity_document}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  View Document
                </a>
              )}
              <PermissionGate permission="customers.update">
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    disabled={rejectMutation.isPending}
                  >
                    {rejectMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                    Reset
                  </Button>
                </div>
              </PermissionGate>
            </div>
          )}

          {identityStatus === 'rejected' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-red-400 text-red-600 bg-red-50">
                  Rejected
                </Badge>
              </div>
              {customer.identity_document && (
                <a
                  href={customer.identity_document}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  Download Document
                </a>
              )}
              <p className="text-sm text-muted-foreground">
                Customer needs to re-upload their identity document.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Form */}
      <PermissionGate permission="customers.update">
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>Add a new document to the customer</CardDescription>
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
      </PermissionGate>

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
                      <PermissionGate permission="customers.update">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)} disabled={deleteMutation.isPending}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </PermissionGate>
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
