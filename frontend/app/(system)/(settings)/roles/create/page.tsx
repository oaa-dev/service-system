'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateRole, usePermissionsGrouped } from '@/hooks/useRoles';
import { createRoleSchema, type CreateRoleFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Shield, Key } from 'lucide-react';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export default function CreateRolePage() {
  const router = useRouter();
  const createRole = useCreateRole();
  const { data: permissionsData, isLoading: permissionsLoading } = usePermissionsGrouped();

  const form = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: '',
      permissions: [],
    },
  });

  const onSubmit = (data: CreateRoleFormData) => {
    createRole.mutate(data, {
      onSuccess: () => {
        router.push('/roles');
      },
      onError: (error) => {
        const axiosError = error as AxiosError<ApiError>;
        if (axiosError.response?.data?.errors) {
          Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
            form.setError(key as keyof CreateRoleFormData, {
              message: Array.isArray(value) ? value[0] : value,
            });
          });
        } else {
          form.setError('root', {
            message: axiosError.response?.data?.message || 'Failed to create role',
          });
        }
      },
    });
  };

  const permissions = permissionsData?.data || {};

  // Select all permissions for a module
  const handleSelectAllModule = (modulePermissions: { name: string }[], checked: boolean) => {
    const currentPermissions = form.getValues('permissions') || [];
    const modulePermissionNames = modulePermissions.map((p) => p.name);

    if (checked) {
      const newPermissions = [...new Set([...currentPermissions, ...modulePermissionNames])];
      form.setValue('permissions', newPermissions);
    } else {
      const newPermissions = currentPermissions.filter((p) => !modulePermissionNames.includes(p));
      form.setValue('permissions', newPermissions);
    }
  };

  // Check if all permissions in a module are selected
  const isModuleFullySelected = (modulePermissions: { name: string }[]) => {
    const currentPermissions = form.watch('permissions') || [];
    return modulePermissions.every((p) => currentPermissions.includes(p.name));
  };

  // Check if some permissions in a module are selected
  const isModulePartiallySelected = (modulePermissions: { name: string }[]) => {
    const currentPermissions = form.watch('permissions') || [];
    const selectedCount = modulePermissions.filter((p) => currentPermissions.includes(p.name)).length;
    return selectedCount > 0 && selectedCount < modulePermissions.length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/roles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Role</h1>
          <p className="text-muted-foreground">
            Create a new role with specific permissions
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {form.formState.errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Role Info */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-amber-500/10 p-2">
                      <Shield className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <CardTitle>Role Details</CardTitle>
                      <CardDescription>Basic role information</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., editor, moderator"
                            disabled={createRole.isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Lowercase letters, numbers, and dashes only.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Permissions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-500/10 p-2">
                      <Key className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle>Permissions</CardTitle>
                      <CardDescription>
                        Select the permissions this role should have
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="permissions"
                    render={() => (
                      <FormItem>
                        {permissionsLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <Spinner className="h-6 w-6" />
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {Object.entries(permissions).map(([module, modulePermissions], index) => (
                              <div key={module}>
                                {index > 0 && <Separator className="mb-6" />}
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold capitalize text-base">{module}</h4>
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`select-all-${module}`}
                                        checked={isModuleFullySelected(modulePermissions)}
                                        onCheckedChange={(checked) =>
                                          handleSelectAllModule(modulePermissions, checked as boolean)
                                        }
                                        className={isModulePartiallySelected(modulePermissions) ? 'data-[state=checked]:bg-primary/50' : ''}
                                      />
                                      <label
                                        htmlFor={`select-all-${module}`}
                                        className="text-sm text-muted-foreground cursor-pointer"
                                      >
                                        Select all
                                      </label>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {modulePermissions.map((permission) => (
                                      <FormField
                                        key={permission.name}
                                        control={form.control}
                                        name="permissions"
                                        render={({ field }) => (
                                          <FormItem className="flex items-center space-x-2 space-y-0 rounded-md border p-3 hover:bg-muted/50 transition-colors">
                                            <FormControl>
                                              <Checkbox
                                                checked={field.value?.includes(permission.name)}
                                                onCheckedChange={(checked) => {
                                                  const current = field.value || [];
                                                  if (checked) {
                                                    field.onChange([...current, permission.name]);
                                                  } else {
                                                    field.onChange(
                                                      current.filter((p) => p !== permission.name)
                                                    );
                                                  }
                                                }}
                                              />
                                            </FormControl>
                                            <FormLabel className="font-normal text-sm cursor-pointer flex-1">
                                              {permission.action}
                                            </FormLabel>
                                          </FormItem>
                                        )}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/roles">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createRole.isPending}>
              {createRole.isPending && <Spinner className="mr-2 h-4 w-4" />}
              Create Role
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
