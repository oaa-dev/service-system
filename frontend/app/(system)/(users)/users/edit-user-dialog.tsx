'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateUser } from '@/hooks/useUsers';
import { useAllRoles } from '@/hooks/useRoles';
import { updateUserSchema, type UpdateUserFormData } from '@/lib/validations';
import { User, ApiError } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { AxiosError } from 'axios';
import { PermissionGate } from '@/components/permission-gate';

interface EditUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  const updateUser = useUpdateUser();
  const { data: rolesData } = useAllRoles();

  const form = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      roles: [],
    },
  });

  const roles = rolesData?.data || [];

  // Reset form with user data when dialog opens
  useEffect(() => {
    if (user && open) {
      form.reset({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email,
        password: '',
        roles: user.roles || [],
      });
    }
  }, [user, open, form]);

  const onSubmit = (data: UpdateUserFormData) => {
    if (!user) return;

    // Only send fields that have changed or have values (for password)
    const dirtyFields = form.formState.dirtyFields;
    const dataToSend: UpdateUserFormData = {};

    if (dirtyFields.first_name && data.first_name) {
      dataToSend.first_name = data.first_name;
    }
    if (dirtyFields.last_name && data.last_name) {
      dataToSend.last_name = data.last_name;
    }
    if (dirtyFields.email && data.email) {
      dataToSend.email = data.email;
    }
    if (data.password) {
      dataToSend.password = data.password;
    }
    if (dirtyFields.roles) {
      dataToSend.roles = data.roles;
    }

    if (Object.keys(dataToSend).length === 0) {
      onOpenChange(false);
      return;
    }

    updateUser.mutate(
      { id: user.id, data: dataToSend },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        onError: (error) => {
          const axiosError = error as AxiosError<ApiError>;
          if (axiosError.response?.data?.errors) {
            Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
              form.setError(key as keyof UpdateUserFormData, {
                message: Array.isArray(value) ? value[0] : value,
              });
            });
          } else {
            form.setError('root', {
              message: axiosError.response?.data?.message || 'Failed to update user',
            });
          }
        },
      }
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information. Leave password blank to keep unchanged.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              {form.formState.errors.root && (
                <Alert variant="destructive">
                  <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input disabled={updateUser.isPending} {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input disabled={updateUser.isPending} {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        disabled={updateUser.isPending}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Leave blank to keep current"
                        disabled={updateUser.isPending}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <PermissionGate permission="users.update">
                <FormField
                  control={form.control}
                  name="roles"
                  render={() => (
                    <FormItem>
                      <FormLabel>Roles</FormLabel>
                      <FormDescription>
                        Assign roles to this user.
                      </FormDescription>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {roles.map((role) => (
                          <FormField
                            key={role.id}
                            control={form.control}
                            name="roles"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(role.name)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, role.name]);
                                      } else {
                                        field.onChange(current.filter((r) => r !== role.name));
                                      }
                                    }}
                                    disabled={role.name === 'super-admin'}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-sm cursor-pointer capitalize">
                                  {role.name}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </PermissionGate>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={updateUser.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending && <Spinner className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
