'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateField } from '@/hooks/useFields';
import { createFieldSchema, type CreateFieldFormData } from '@/lib/validations';
import { ApiError, CreateFieldRequest } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Plus, X } from 'lucide-react';
import { AxiosError } from 'axios';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFieldDialog({ open, onOpenChange }: Props) {
  const mutation = useCreateField();

  const form = useForm<CreateFieldFormData>({
    resolver: zodResolver(createFieldSchema),
    defaultValues: { label: '', type: 'input' as const, config: null, is_active: true, sort_order: 0, values: [] },
  });

  const { fields: valueFields, append, remove } = useFieldArray({
    control: form.control,
    name: 'values',
  });

  const watchType = form.watch('type');
  const hasOptions = watchType === 'select' || watchType === 'checkbox' || watchType === 'radio';

  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  useEffect(() => {
    form.setValue('values', []);
    if (watchType === 'input') {
      form.setValue('config', null);
    } else {
      form.setValue('config', { default_value: watchType === 'checkbox' ? [] : undefined });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchType]);

  const getDefaultValue = (): string | string[] | undefined => {
    const config = form.getValues('config') as Record<string, unknown> | null;
    return config?.default_value as string | string[] | undefined;
  };

  const setDefaultValue = (val: string | string[] | undefined) => {
    const current = (form.getValues('config') || {}) as Record<string, unknown>;
    form.setValue('config', { ...current, default_value: val });
  };

  const handleDefaultToggle = (optionValue: string) => {
    if (watchType === 'checkbox') {
      const current = (getDefaultValue() as string[]) || [];
      const next = current.includes(optionValue)
        ? current.filter((v) => v !== optionValue)
        : [...current, optionValue];
      setDefaultValue(next.length > 0 ? next : undefined);
    } else {
      const current = getDefaultValue() as string | undefined;
      setDefaultValue(current === optionValue ? undefined : optionValue);
    }
  };

  const isDefaultSelected = (optionValue: string): boolean => {
    const dv = getDefaultValue();
    if (watchType === 'checkbox') {
      return Array.isArray(dv) && dv.includes(optionValue);
    }
    return dv === optionValue;
  };

  const onSubmit = (data: CreateFieldFormData) => {
    const payload: CreateFieldRequest = {
      ...data,
      values: hasOptions ? data.values : undefined,
      config: data.type === 'input' ? data.config : (hasOptions ? data.config : undefined),
    };

    mutation.mutate(payload, {
      onSuccess: () => onOpenChange(false),
      onError: (error) => {
        const axiosError = error as AxiosError<ApiError>;
        if (axiosError.response?.data?.errors) {
          Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
            form.setError(key as keyof CreateFieldFormData, {
              message: Array.isArray(value) ? value[0] : value,
            });
          });
        } else {
          form.setError('root', {
            message: axiosError.response?.data?.message || 'Failed to create field',
          });
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) form.reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Field</DialogTitle>
          <DialogDescription>Add a new reusable field definition.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              {form.formState.errors.root && (
                <Alert variant="destructive">
                  <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                </Alert>
              )}

              <FormField control={form.control} name="label" render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl><Input disabled={mutation.isPending} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="input">Input</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                      <SelectItem value="radio">Radio</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {watchType === 'input' && (
                <div className="space-y-3 rounded-lg border p-4">
                  <p className="text-sm font-medium">Input Configuration</p>
                  <div className="grid grid-cols-2 gap-3">
                    <FormItem>
                      <FormLabel className="text-xs">Placeholder</FormLabel>
                      <FormControl>
                        <Input
                          disabled={mutation.isPending}
                          value={(form.watch('config') as Record<string, unknown>)?.placeholder as string || ''}
                          onChange={(e) => {
                            const current = (form.getValues('config') || {}) as Record<string, unknown>;
                            form.setValue('config', { ...current, placeholder: e.target.value || undefined });
                          }}
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormLabel className="text-xs">Default Value</FormLabel>
                      <FormControl>
                        <Input
                          disabled={mutation.isPending}
                          value={(form.watch('config') as Record<string, unknown>)?.default_value as string || ''}
                          onChange={(e) => {
                            const current = (form.getValues('config') || {}) as Record<string, unknown>;
                            form.setValue('config', { ...current, default_value: e.target.value || undefined });
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  </div>
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="text-xs">Numeric Input</FormLabel>
                    <FormControl>
                      <Switch
                        checked={!!((form.watch('config') as Record<string, unknown>)?.is_number)}
                        onCheckedChange={(checked) => {
                          const current = (form.getValues('config') || {}) as Record<string, unknown>;
                          form.setValue('config', { ...current, is_number: checked || undefined });
                        }}
                        disabled={mutation.isPending}
                      />
                    </FormControl>
                  </FormItem>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="sort_order" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl><Input type="number" disabled={mutation.isPending} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="is_active" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 mt-2">
                    <FormLabel>Active</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={mutation.isPending} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>

              {hasOptions && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Options</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ value: '', sort_order: 0 })}
                      disabled={mutation.isPending}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add Option
                    </Button>
                  </div>
                  {valueFields.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
                      No options added yet. Click &quot;Add Option&quot; to start.
                    </p>
                  )}
                  {valueFields.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-1">
                        <span className="flex-1 text-xs font-medium text-muted-foreground">Value</span>
                        <span className="w-16 text-xs font-medium text-muted-foreground text-center">Default</span>
                        <span className="w-8" />
                      </div>
                      {valueFields.map((vf, index) => (
                        <div key={vf.id} className="flex items-center gap-2">
                          <FormField control={form.control} name={`values.${index}.value`} render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl><Input placeholder="Option value" disabled={mutation.isPending} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <div className="w-16 flex justify-center">
                            {(() => {
                              const optVal = form.watch(`values.${index}.value`) ?? '';
                              return watchType === 'checkbox' ? (
                                <Checkbox
                                  checked={isDefaultSelected(optVal)}
                                  onCheckedChange={() => handleDefaultToggle(optVal)}
                                  disabled={mutation.isPending || !optVal}
                                />
                              ) : (
                                <RadioGroup value={(getDefaultValue() as string) || ''}>
                                  <RadioGroupItem
                                    value={optVal || `__placeholder_${index}`}
                                    onClick={() => handleDefaultToggle(optVal)}
                                    disabled={mutation.isPending || !optVal}
                                  />
                                </RadioGroup>
                              );
                            })()}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 w-8 h-8 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(index)}
                            disabled={mutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
