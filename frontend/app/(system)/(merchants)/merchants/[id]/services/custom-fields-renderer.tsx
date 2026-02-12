'use client';

import { useBusinessTypeFields } from '@/hooks/useBusinessTypes';
import { BusinessTypeField } from '@/types/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface CustomFieldsRendererProps {
  businessTypeId: number | null;
  values: Record<string, string | number | number[]>;
  onChange: (values: Record<string, string | number | number[]>) => void;
  disabled?: boolean;
}

export function CustomFieldsRenderer({ businessTypeId, values, onChange, disabled }: CustomFieldsRendererProps) {
  const { data: fieldsData, isLoading } = useBusinessTypeFields(businessTypeId);
  const fields = fieldsData?.data || [];

  if (!businessTypeId) return null;
  if (isLoading) return <Skeleton className="h-8 w-full" />;

  const sortedFields = [...fields]
    .filter((btf) => btf.field && btf.field.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (sortedFields.length === 0) return null;

  const handleChange = (btFieldId: number, value: string | number | number[]) => {
    onChange({ ...values, [String(btFieldId)]: value });
  };

  return (
    <div className="space-y-4">
      {sortedFields.map((btField) => (
        <FieldRenderer
          key={btField.id}
          btField={btField}
          value={values[String(btField.id)]}
          onChange={(val) => handleChange(btField.id, val)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

interface FieldRendererProps {
  btField: BusinessTypeField;
  value: string | number | number[] | undefined;
  onChange: (value: string | number | number[]) => void;
  disabled?: boolean;
}

function FieldRenderer({ btField, value, onChange, disabled }: FieldRendererProps) {
  const field = btField.field!;
  const fieldValues = [...(field.values || [])].sort((a, b) => a.sort_order - b.sort_order);

  switch (field.type) {
    case 'input':
      return (
        <div className="space-y-2">
          <Label>
            {field.label}
            {btField.is_required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            type={field.config?.is_number ? 'number' : 'text'}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2">
          <Label>
            {field.label}
            {btField.is_required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Select
            value={value != null ? String(value) : ''}
            onValueChange={(v) => onChange(v ? parseInt(v) : 0)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {fieldValues.map((fv) => (
                <SelectItem key={fv.id} value={String(fv.id)}>{fv.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'radio':
      return (
        <div className="space-y-2">
          <Label>
            {field.label}
            {btField.is_required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <RadioGroup
            value={value != null ? String(value) : ''}
            onValueChange={(v) => onChange(parseInt(v))}
            disabled={disabled}
          >
            {fieldValues.map((fv) => (
              <div key={fv.id} className="flex items-center space-x-2">
                <RadioGroupItem value={String(fv.id)} id={`radio-${btField.id}-${fv.id}`} />
                <Label htmlFor={`radio-${btField.id}-${fv.id}`} className="font-normal">{fv.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    case 'checkbox':
      return (
        <div className="space-y-2">
          <Label>
            {field.label}
            {btField.is_required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="space-y-2">
            {fieldValues.map((fv) => {
              const currentValues = (Array.isArray(value) ? value : []) as number[];
              const isChecked = currentValues.includes(fv.id);
              return (
                <div key={fv.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`checkbox-${btField.id}-${fv.id}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const updated = checked
                        ? [...currentValues, fv.id]
                        : currentValues.filter((id) => id !== fv.id);
                      onChange(updated);
                    }}
                    disabled={disabled}
                  />
                  <Label htmlFor={`checkbox-${btField.id}-${fv.id}`} className="font-normal">{fv.label}</Label>
                </div>
              );
            })}
          </div>
        </div>
      );

    default:
      return null;
  }
}
