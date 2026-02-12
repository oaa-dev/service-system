'use client';

import { useState, useEffect } from 'react';
import { useActiveFields } from '@/hooks/useFields';
import { useBusinessTypeFields } from '@/hooks/useBusinessTypes';
import type { Field } from '@/types/api';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

export interface LinkedFieldData {
  field_id: number;
  is_required: boolean;
  sort_order: number;
}

interface Props {
  businessTypeId: number;
  disabled?: boolean;
  onFieldsChange?: (fields: LinkedFieldData[]) => void;
}

interface LinkedField extends LinkedFieldData {
  field?: Field;
}

function FieldLinkerInner({ disabled, activeFields, initialLinkedFields, onFieldsChange }: {
  disabled?: boolean;
  activeFields: Field[];
  initialLinkedFields: LinkedField[];
  onFieldsChange?: (fields: LinkedFieldData[]) => void;
}) {
  const [linkedFields, setLinkedFields] = useState<LinkedField[]>(initialLinkedFields);
  const [selectKey, setSelectKey] = useState(0);

  useEffect(() => {
    onFieldsChange?.(linkedFields.map((f, i) => ({
      field_id: f.field_id,
      is_required: f.is_required,
      sort_order: i,
    })));
  }, [linkedFields, onFieldsChange]);

  const linkedFieldIds = new Set(linkedFields.map((f) => f.field_id));
  const availableFields = activeFields.filter((f) => !linkedFieldIds.has(f.id));

  const handleAddField = (fieldIdStr: string) => {
    const fieldId = parseInt(fieldIdStr, 10);
    const field = activeFields.find((f) => f.id === fieldId);
    if (!field) return;
    setLinkedFields((prev) => [
      ...prev,
      { field_id: field.id, is_required: false, sort_order: prev.length, field },
    ]);
    setSelectKey((k) => k + 1);
  };

  const handleRemoveField = (fieldId: number) => {
    setLinkedFields((prev) => prev.filter((f) => f.field_id !== fieldId));
  };

  const handleToggleRequired = (fieldId: number) => {
    setLinkedFields((prev) =>
      prev.map((f) =>
        f.field_id === fieldId ? { ...f, is_required: !f.is_required } : f
      )
    );
  };

  const handleSortOrderChange = (fieldId: number, value: string) => {
    const sortOrder = parseInt(value, 10);
    if (isNaN(sortOrder)) return;
    setLinkedFields((prev) =>
      prev.map((f) =>
        f.field_id === fieldId ? { ...f, sort_order: sortOrder } : f
      )
    );
  };

  const fieldTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'select': return 'default' as const;
      case 'checkbox': return 'secondary' as const;
      case 'radio': return 'outline' as const;
      default: return 'secondary' as const;
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Custom Fields</p>
        <p className="text-xs text-muted-foreground">
          Associate reusable fields with this business type. These fields will appear on services.
        </p>
      </div>

      {linkedFields.length > 0 && (
        <div className="space-y-2">
          {linkedFields.map((lf) => (
            <div key={lf.field_id} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {lf.field?.label || `Field #${lf.field_id}`}
                  </span>
                  <Badge variant={fieldTypeBadgeVariant(lf.field?.type || 'input')}>
                    {lf.field?.type || 'input'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground whitespace-nowrap">Required</label>
                <Switch
                  checked={lf.is_required}
                  onCheckedChange={() => handleToggleRequired(lf.field_id)}
                  disabled={disabled}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground whitespace-nowrap">Order</label>
                <Input
                  type="number"
                  className="w-16 h-8"
                  value={lf.sort_order}
                  onChange={(e) => handleSortOrderChange(lf.field_id, e.target.value)}
                  disabled={disabled}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => handleRemoveField(lf.field_id)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {linkedFields.length === 0 && (
        <p className="text-xs text-muted-foreground py-2">No fields linked yet.</p>
      )}

      {availableFields.length > 0 && (
        <Select key={selectKey} onValueChange={handleAddField} disabled={disabled}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Add a field..." />
          </SelectTrigger>
          <SelectContent>
            {availableFields.map((field) => (
              <SelectItem key={field.id} value={String(field.id)}>
                {field.label} ({field.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export function FieldLinker({ businessTypeId, disabled, onFieldsChange }: Props) {
  const { data: activeFieldsData, isLoading: fieldsLoading } = useActiveFields();
  const { data: linkedFieldsData, isLoading: linkedLoading } = useBusinessTypeFields(businessTypeId);

  const isLoading = fieldsLoading || linkedLoading;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Custom Fields</p>
          <p className="text-xs text-muted-foreground">Associate reusable fields with this business type.</p>
        </div>
        <div className="flex items-center justify-center py-6">
          <Spinner className="h-5 w-5" />
        </div>
      </div>
    );
  }

  const activeFields = activeFieldsData?.data || [];
  const initialLinkedFields: LinkedField[] = (linkedFieldsData?.data || []).map((btf) => ({
    field_id: btf.field_id,
    is_required: btf.is_required,
    sort_order: btf.sort_order,
    field: btf.field || activeFields.find((f) => f.id === btf.field_id),
  }));

  return (
    <FieldLinkerInner
      key={`${businessTypeId}-${initialLinkedFields.map(f => f.field_id).join(',')}`}
      disabled={disabled}
      activeFields={activeFields}
      initialLinkedFields={initialLinkedFields}
      onFieldsChange={onFieldsChange}
    />
  );
}
