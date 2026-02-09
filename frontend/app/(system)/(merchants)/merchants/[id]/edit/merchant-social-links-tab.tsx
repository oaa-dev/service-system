'use client';

import { useState, useEffect } from 'react';
import { useSyncMerchantSocialLinks } from '@/hooks/useMerchants';
import { useActiveSocialPlatforms } from '@/hooks/useSocialPlatforms';
import { Merchant } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface SocialLinkEntry {
  social_platform_id: number;
  url: string;
}

interface Props { merchant: Merchant; }

export function MerchantSocialLinksTab({ merchant }: Props) {
  const syncMutation = useSyncMerchantSocialLinks();
  const { data: platformsData, isLoading } = useActiveSocialPlatforms();
  const platforms = platformsData?.data || [];

  const [links, setLinks] = useState<SocialLinkEntry[]>([]);

  useEffect(() => {
    setLinks(
      (merchant.social_links || []).map((sl) => ({
        social_platform_id: sl.social_platform_id,
        url: sl.url,
      }))
    );
  }, [merchant.social_links]);

  const handleAdd = () => {
    if (platforms.length === 0) return;
    setLinks((prev) => [...prev, { social_platform_id: platforms[0].id, url: '' }]);
  };

  const handleRemove = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof SocialLinkEntry, value: string | number) => {
    setLinks((prev) => prev.map((link, i) => i === index ? { ...link, [field]: value } : link));
  };

  const handleSave = () => {
    const validLinks = links.filter((l) => l.url.trim());
    syncMutation.mutate({ id: merchant.id, data: { social_links: validLinks } }, {
      onSuccess: () => toast.success('Social links updated'),
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Social Links</CardTitle>
            <CardDescription>Manage the merchant&apos;s social media profiles</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAdd} disabled={platforms.length === 0}>
            <Plus className="mr-2 h-4 w-4" /> Add Link
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner className="h-6 w-6" /></div>
        ) : links.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No social links added yet.</p>
        ) : (
          <div className="space-y-3">
            {links.map((link, index) => (
              <div key={index} className="flex items-center gap-3">
                <Select
                  value={String(link.social_platform_id)}
                  onValueChange={(v) => handleChange(index, 'social_platform_id', parseInt(v))}
                >
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {platforms.map((p) => (<SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="https://..."
                  value={link.url}
                  onChange={(e) => handleChange(index, 'url', e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemove(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={syncMutation.isPending}>
            {syncMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
            Save Social Links
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
