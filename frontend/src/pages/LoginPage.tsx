import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Microscope } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { useAuth } from '@/features/auth/useAuth';
import { clearLoginError, login } from '@/features/auth/authSlice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { isAuthenticated, loginPending, loginError } = useAuth();

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
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link
            to="/"
            aria-label="LabOS home"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Microscope className="h-6 w-6" aria-hidden />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Sign in to LabOS</h1>
            <p className="mt-1 text-sm text-muted">Pathology &amp; Laboratory Management</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 p-6" noValidate>
          {loginError && <Alert tone="danger">{loginError}</Alert>}

          <Input
            label="Username"
            autoComplete="username"
            autoFocus
            error={errors.username?.message}
            {...register('username')}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" className="w-full" loading={loginPending}>
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted">
          Trouble signing in? Contact your laboratory administrator.
        </p>
      </div>
    </div>
  );
}
