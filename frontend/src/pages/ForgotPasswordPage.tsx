import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { authApi } from '@/api/auth';
import { useForcedLightTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { BrandMark } from '@/components/brand/BrandMark';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  useForcedLightTheme();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setServerError(null);
    try {
      await authApi.forgotPassword(values);
      // Always show the same confirmation, whether or not that email has an account —
      // the backend deliberately never reveals which (see AuthService.forgotPassword).
      setSent(true);
    } catch {
      setServerError('Something went wrong. Please try again in a moment.');
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
            <h1 className="text-xl font-semibold text-foreground">Reset your password</h1>
            <p className="mt-1 text-sm text-muted">We'll email you a link to choose a new one.</p>
          </div>
        </div>

        {sent ? (
          <div className="card space-y-3 p-6 text-center">
            <MailCheck className="mx-auto h-8 w-8 text-success" aria-hidden />
            <p className="text-sm text-foreground">
              If an account exists for that email, we've sent a link to reset the password. It expires in 1 hour.
            </p>
            <Link to="/login" className="inline-block text-sm font-medium text-primary hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="card space-y-4 p-6" noValidate>
            {serverError && <Alert tone="danger">{serverError}</Alert>}

            <Input
              label="Email"
              type="email"
              autoComplete="email"
              autoFocus
              error={errors.email?.message}
              {...register('email')}
            />

            <Button type="submit" className="w-full" loading={submitting}>
              Send reset link
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
