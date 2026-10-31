import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { authApi } from '@/api/auth';
import { useForcedLightTheme } from '@/hooks/useTheme';
import { ApiError } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { BrandMark } from '@/components/brand/BrandMark';

const schema = z
  .object({
    newPassword: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  useForcedLightTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    if (!token) return;
    setSubmitting(true);
    setServerError(null);
    try {
      await authApi.resetPassword({ token, newPassword: values.newPassword });
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Unable to reset the password.');
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link
            to="/"
            aria-label="LIMS home"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <BrandMark className="h-14" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Choose a new password</h1>
            <p className="mt-1 text-sm text-muted">Pick something you haven't used before.</p>
          </div>
        </div>

        {!token ? (
          <div className="card space-y-3 p-6 text-center">
            <Alert tone="danger">This reset link is missing its token.</Alert>
            <Link to="/forgot-password" className="inline-block text-sm font-medium text-primary hover:underline">
              Request a new link
            </Link>
          </div>
        ) : done ? (
          <div className="card space-y-3 p-6 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-success" aria-hidden />
            <p className="text-sm text-foreground">Password updated. Taking you to sign in…</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="card space-y-4 p-6" noValidate>
            {serverError && (
              <div className="space-y-2">
                <Alert tone="danger">{serverError}</Alert>
                <Link to="/forgot-password" className="block text-sm font-medium text-primary hover:underline">
                  Request a new link
                </Link>
              </div>
            )}

            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              autoFocus
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" className="w-full" loading={submitting}>
              Reset password
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-muted">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
