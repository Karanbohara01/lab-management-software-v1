import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { SPRING_SMOOTH, isTestEnv } from '@/components/ui/motion';
import { authApi } from '@/api/auth';
import { useForcedLightTheme } from '@/hooks/useTheme';
import { ApiError } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { BackLink } from '@/components/BackLink';
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
  const skipMotion = isTestEnv();
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
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 45%, rgba(248, 250, 252, 0.72) 0%, rgba(241, 245, 249, 0.82) 55%, rgba(226, 232, 240, 0.92) 100%),
            url('/marketing/login-backdrop.png')
          `,
        }}
      />

      <BackLink
        to="/login"
        className="absolute left-4 top-4 z-10 mb-0 rounded-full border border-border/70 bg-surface/85 px-3 py-1.5 shadow-sm backdrop-blur-md transition-colors hover:bg-surface sm:left-6 sm:top-6"
      >
        Back to sign in
      </BackLink>

      <motion.div
        initial={skipMotion ? false : { opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={SPRING_SMOOTH}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <Link
            to="/"
            aria-label="LIMS home"
            className="rounded-xl bg-surface/85 p-2.5 shadow-sm ring-1 ring-border/70 backdrop-blur-md transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <BrandMark className="h-14" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Choose a new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">Pick something you haven't used before.</p>
          </div>
        </div>

        {!token ? (
          <div className="card space-y-3 border-border/80 bg-surface/95 p-6 text-center shadow-popover backdrop-blur-md">
            <Alert tone="danger">This reset link is missing its token.</Alert>
            <Link to="/forgot-password" className="inline-block text-sm font-medium text-primary hover:underline">
              Request a new link
            </Link>
          </div>
        ) : done ? (
          <div className="card space-y-3 border-border/80 bg-surface/95 p-6 text-center shadow-popover backdrop-blur-md">
            <CheckCircle2 className="mx-auto h-8 w-8 text-success" aria-hidden />
            <p className="text-sm text-foreground">Password updated. Taking you to sign in…</p>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="card space-y-4 border-border/80 bg-surface/95 p-6 shadow-popover backdrop-blur-md"
            noValidate
          >
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
      </motion.div>
    </div>
  );
}
