/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useCallback, useRef } from 'react';
import { GalleryImage, GalleryCollection } from '@/types/api';
import { useUploadGalleryImage, useDeleteGalleryImage } from '@/hooks/useMerchants';
import { AvatarCropDialog } from '@/components/avatar-crop-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImagePlus, Trash2, ImageOff } from 'lucide-react';
import { toast } from 'sonner';

interface GalleryTabProps {
  merchantId: number;
  collection: GalleryCollection;
  images: GalleryImage[];
  title: string;
  description: string;
  multiple: boolean;
}

export function GalleryTab({ merchantId, collection, images, title, description, multiple }: GalleryTabProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadGalleryImage();
  const deleteMutation = useDeleteGalleryImage();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropComplete = useCallback((croppedImageBlob: Blob) => {
    const file = new File([croppedImageBlob], 'gallery.jpg', { type: 'image/jpeg' });

    uploadMutation.mutate({ id: merchantId, collection, file }, {
      onSuccess: () => {
        setCropDialogOpen(false);
        setSelectedImage(null);
        toast.success('Image uploaded successfully');
      },
      onError: () => {
        toast.error('Failed to upload image');
      },
    });
  }, [uploadMutation, merchantId, collection]);

  const handleDelete = (mediaId: number) => {
    deleteMutation.mutate({ merchantId, mediaId }, {
      onSuccess: () => {
        toast.success('Image deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete image');
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              <ImagePlus className="mr-2 h-4 w-4" />
              {multiple ? 'Add Image' : (images.length > 0 ? 'Replace Image' : 'Upload Image')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ImageOff className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm">No images uploaded yet</p>
          </div>
        ) : (
          <div className={multiple ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'max-w-sm'}>
            {images.map((image) => (
              <div key={image.id} className="group relative rounded-lg overflow-hidden border">
                <img
                  src={image.preview || image.thumb}
                  alt={image.name}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(image.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AvatarCropDialog
        open={cropDialogOpen}
        onOpenChange={(open) => {
          setCropDialogOpen(open);
          if (!open) setSelectedImage(null);
        }}
        imageSrc={selectedImage}
        onCropComplete={handleCropComplete}
        isUploading={uploadMutation.isPending}
        title="Crop Image"
        description="Adjust the image before uploading"
        saveLabel="Upload"
        cropShape="rect"
      />
    </Card>
  );
}
