import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SPRING_SMOOTH, isTestEnv } from '@/components/ui/motion';
import { useAppDispatch } from '@/store/hooks';
import { useAuth } from '@/features/auth/useAuth';
import { useForcedLightTheme } from '@/hooks/useTheme';
import { clearLoginError, login } from '@/features/auth/authSlice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { BackLink } from '@/components/BackLink';
import { BrandMark } from '@/components/brand/BrandMark';
import { useT } from '@/i18n';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const t = useT();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { isAuthenticated, loginPending, loginError } = useAuth();
  const skipMotion = isTestEnv();
  useForcedLightTheme();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    dispatch(clearLoginError());
  }, [dispatch]);

  if (isAuthenticated) {
    const from = (location.state as { from?: Location } | null)?.from?.pathname;
    return <Navigate to={from && from.startsWith('/app') ? from : '/app'} replace />;
  }

  const onSubmit = handleSubmit((values) => {
    void dispatch(login(values));
  });

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Clinical laboratory background photography with soft radial light veil */}
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
        to="/"
        className="absolute left-4 top-4 z-10 mb-0 rounded-full border border-border/70 bg-surface/85 px-3 py-1.5 shadow-sm backdrop-blur-md transition-colors hover:bg-surface sm:left-6 sm:top-6"
      >
        {t('Back to home')}
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
            aria-label={t('LIMS home')}
            className="rounded-xl bg-surface/85 p-2.5 shadow-sm ring-1 ring-border/70 backdrop-blur-md transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <BrandMark className="h-14" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('Sign in to LIMS')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('Pathology & Laboratory Management')}</p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="card space-y-4 border-border/80 bg-surface/95 p-6 shadow-popover backdrop-blur-md"
          noValidate
        >
          {loginError && <Alert tone="danger">{loginError}</Alert>}

          <Input
            label={t('Username')}
            autoComplete="username"
            autoFocus
            error={errors.username?.message}
            {...register('username')}
          />
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                {t('Password')}
              </label>
              <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                {t('Forgot password?')}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <Button type="submit" className="w-full" loading={loginPending}>
            {t('Sign in')}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs font-medium text-muted-foreground">
          {t('Trouble signing in? Contact your laboratory administrator.')}
        </p>
      </motion.div>
    </div>
  );
}
