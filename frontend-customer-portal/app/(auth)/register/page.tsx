'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRegister } from '@/hooks/useAuth';
import { registerSchema, type RegisterFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { User, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { first_name: '', last_name: '', email: '', password: '', password_confirmation: '' },
  });

  const onSubmit = (data: RegisterFormData) => {
    register.mutate(data, {
      onSuccess: () => router.push('/verify-email'),
      onError: (error) => {
        const axiosError = error as AxiosError<ApiError>;
        if (axiosError.response?.data?.errors) {
          Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
            form.setError(key as keyof RegisterFormData, {
              message: Array.isArray(value) ? value[0] : value,
            });
          });
        } else {
          form.setError('root', {
            message: axiosError.response?.data?.message || 'Registration failed. Please try again.',
          });
        }
      },
    });
  };

  const features = ['Browse local services & merchants', 'Book appointments & reservations', 'Track your orders in real-time'];

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-display)]">Create your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Join as a customer and start exploring</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {form.formState.errors.root && (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-3">
            <FormField control={form.control} name="first_name" render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type="text" placeholder="John" className="pl-9 h-11 rounded-lg" disabled={register.isPending} {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="last_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Doe" className="h-11 rounded-lg" disabled={register.isPending} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email address</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input type="email" placeholder="name@example.com" className="pl-9 h-11 rounded-lg" disabled={register.isPending} {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input type="password" placeholder="Create a password" className="pl-9 h-11 rounded-lg" disabled={register.isPending} {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="password_confirmation" render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input type="password" placeholder="Confirm your password" className="pl-9 h-11 rounded-lg" disabled={register.isPending} {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="space-y-2 pt-1">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                </div>
                {f}
              </div>
            ))}
          </div>
          <Button type="submit" className="w-full h-11 rounded-full shadow-warm" disabled={register.isPending}>
            {register.isPending ? (<><Spinner className="mr-2 h-4 w-4" />Creating account...</>) : (<>Create account<ArrowRight className="ml-2 h-4 w-4" /></>)}
          </Button>
        </form>
      </Form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">Sign in</Link>
      </p>
    </div>
  );
}
