import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MailCheck } from 'lucide-react';
import { SPRING_SMOOTH, isTestEnv } from '@/components/ui/motion';
import { authApi } from '@/api/auth';
import { useForcedLightTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { BackLink } from '@/components/BackLink';
import { BrandMark } from '@/components/brand/BrandMark';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  useForcedLightTheme();
  const skipMotion = isTestEnv();
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
      setSent(true);
    } catch {
      setServerError('Something went wrong. Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-surface-muted px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 42%, rgb(255 255 255 / 0.78) 0%, rgb(248 250 252 / 0.52) 48%, rgb(15 23 42 / 0.18) 100%),
            url('/marketing/login-backdrop.png')
          `,
        }}
      />

      <BackLink
        to="/login"
        className="absolute left-4 top-4 mb-0 rounded-full border border-border/70 bg-surface/85 px-3 py-1.5 shadow-sm backdrop-blur-md transition-colors hover:bg-surface sm:left-6 sm:top-6"
      >
        Back to sign in
      </BackLink>

      <motion.div
        initial={skipMotion ? false : { opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={SPRING_SMOOTH}
        className="w-full max-w-sm"
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
            <h1 className="text-xl font-semibold text-foreground">Reset your password</h1>
            <p className="mt-1 text-sm text-muted-foreground">We'll email you a link to choose a new one.</p>
          </div>
        </div>

        {sent ? (
          <div className="card space-y-3 border-border/80 bg-surface/95 p-6 text-center shadow-popover backdrop-blur-md">
            <MailCheck className="mx-auto h-8 w-8 text-success" aria-hidden />
            <p className="text-sm text-foreground">
              If an account exists for that email, we've sent a link to reset the password. It expires in 1 hour.
            </p>
            <Link to="/login" className="inline-block text-sm font-medium text-primary hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="card space-y-4 border-border/80 bg-surface/95 p-6 shadow-popover backdrop-blur-md"
            noValidate
          >
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
      </motion.div>
    </div>
  );
}
