/* eslint-disable @next/next/no-img-element */
'use client';

import { useRef } from 'react';
import { useMyMerchantGallery, useUploadMyGalleryImage, useDeleteMyGalleryImage } from '@/hooks/useMyMerchant';
import { GalleryImage } from '@/types/api';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, Trash2, Images } from 'lucide-react';
import { toast } from 'sonner';

export default function MyStoreGalleryPage() {
  const { data: gallery, isLoading } = useMyMerchantGallery();
  const uploadMutation = useUploadMyGalleryImage();
  const deleteMutation = useDeleteMyGalleryImage();

  const photosInputRef = useRef<HTMLInputElement>(null);
  const interiorsInputRef = useRef<HTMLInputElement>(null);
  const exteriorsInputRef = useRef<HTMLInputElement>(null);
  const featureInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (collection: 'photos' | 'interiors' | 'exteriors' | 'feature', files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    uploadMutation.mutate({ collection, file }, {
      onSuccess: () => {
        toast.success(`Image uploaded to ${collection}`);
      },
      onError: () => {
        toast.error('Failed to upload image');
      },
    });
  };

  const handleDelete = (mediaId: number) => {
    deleteMutation.mutate(mediaId, {
      onSuccess: () => {
        toast.success('Image deleted');
      },
      onError: () => {
        toast.error('Failed to delete image');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const renderImageGrid = (images: GalleryImage[], label: string, collection: 'photos' | 'interiors' | 'exteriors') => (
    images.length > 0 ? (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image: GalleryImage) => (
          <div key={image.id} className="relative group">
            <img
              src={image.thumb}
              alt={label}
              className="w-full h-32 object-cover rounded-lg border"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleDelete(image.id)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    ) : (
      <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
        <p className="text-sm text-muted-foreground">No {label.toLowerCase()} uploaded</p>
      </div>
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gallery</h1>
        <p className="text-muted-foreground">Manage your store images and photos</p>
      </div>

      {/* Feature Image */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Image</CardTitle>
          <CardDescription>Main showcase image for your store</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {gallery?.gallery_feature ? (
              <div className="relative inline-block">
                <img
                  src={gallery.gallery_feature.preview || gallery.gallery_feature.url}
                  alt="Feature"
                  className="w-full max-w-2xl h-auto rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => handleDelete(gallery.gallery_feature!.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <Images className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No feature image</p>
                </div>
              </div>
            )}
            <div>
              <input
                ref={featureInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleUpload('feature', e.target.files)}
              />
              <Button
                onClick={() => featureInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                <Upload className="mr-2 h-4 w-4" />
                {gallery?.gallery_feature ? 'Replace Feature Image' : 'Upload Feature Image'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
          <CardDescription>General photos of your store and services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {renderImageGrid(gallery?.gallery_photos || [], 'Photos', 'photos')}
            <div>
              <input
                ref={photosInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleUpload('photos', e.target.files)}
              />
              <Button
                onClick={() => photosInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Photo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interiors */}
      <Card>
        <CardHeader>
          <CardTitle>Interior Photos</CardTitle>
          <CardDescription>Photos of your store interior</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {renderImageGrid(gallery?.gallery_interiors || [], 'Interior photos', 'interiors')}
            <div>
              <input
                ref={interiorsInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleUpload('interiors', e.target.files)}
              />
              <Button
                onClick={() => interiorsInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Interior Photo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exteriors */}
      <Card>
        <CardHeader>
          <CardTitle>Exterior Photos</CardTitle>
          <CardDescription>Photos of your store exterior and surroundings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {renderImageGrid(gallery?.gallery_exteriors || [], 'Exterior photos', 'exteriors')}
            <div>
              <input
                ref={exteriorsInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleUpload('exteriors', e.target.files)}
              />
              <Button
                onClick={() => exteriorsInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Exterior Photo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
