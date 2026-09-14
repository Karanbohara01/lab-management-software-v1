import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Microscope, Check } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { useAuth } from '@/features/auth/useAuth';
import { login } from '@/features/auth/authSlice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { useQuery } from '@/hooks/useQuery';
import { useScrollToTopOnError } from '@/hooks/useScrollToTopOnError';
import { ApiError } from '@/types/api';
import { signupApi } from './api';

const schema = z.object({
  name: z.string().min(2, 'Enter your laboratory’s name'),
  slug: z
    .string()
    .min(2, 'Pick a short identifier')
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
  city: z.string().optional(),
  contactPhone: z.string().optional(),
  planCode: z.string().min(1, 'Choose a plan'),
  adminFullName: z.string().min(2, 'Your name is required'),
  adminUsername: z.string().min(3, 'Pick a username (min 3 characters)'),
  adminEmail: z.string().email('Enter a valid email'),
  adminPassword: z.string().min(8, 'At least 8 characters'),
});
type FormValues = z.infer<typeof schema>;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Public, unauthenticated clinic signup — creates a real, isolated tenant with its own trial
 * subscription and first admin login in one call (`POST /public/signup`), then signs that admin
 * straight in. No platform-admin involvement, no manual provisioning — this is what makes the
 * product self-serve rather than sales-assisted-only.
 */
export function SignupPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  useScrollToTopOnError(serverError);
  const [slugEdited, setSlugEdited] = useState(false);

  const { data: plans, loading: plansLoading, error: plansError } = useQuery(() => signupApi.plans(), []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { planCode: searchParams.get('plan') ?? '' },
  });

  const name = watch('name');
  useEffect(() => {
    if (!slugEdited && name) setValue('slug', slugify(name));
  }, [name, slugEdited, setValue]);

  useEffect(() => {
    const first = plans?.[0];
    if (first && !watch('planCode')) {
      setValue('planCode', searchParams.get('plan') ?? first.code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans]);

  if (isAuthenticated) return <Navigate to="/app" replace />;

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setServerError(null);
    try {
      await signupApi.signup({
        slug: values.slug,
        name: values.name,
        city: values.city || undefined,
        contactPhone: values.contactPhone || undefined,
        contactName: values.adminFullName,
        contactEmail: values.adminEmail,
        planCode: values.planCode,
        adminUsername: values.adminUsername,
        adminEmail: values.adminEmail,
        adminFullName: values.adminFullName,
        adminPassword: values.adminPassword,
      });
      const result = await dispatch(login({ username: values.adminUsername, password: values.adminPassword }));
      if (login.fulfilled.match(result)) {
        navigate('/app', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Unable to create your clinic. Please try again.');
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link
            to="/"
            aria-label="LabOS home"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Microscope className="h-6 w-6" aria-hidden />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Start your free trial</h1>
            <p className="mt-1 text-sm text-muted">Your own isolated LabOS workspace, ready in seconds.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="card space-y-5 p-6" noValidate>
          {serverError && <Alert tone="danger">{serverError}</Alert>}

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your laboratory</p>
            <Input label="Laboratory name" autoFocus error={errors.name?.message} {...register('name')} />
            <Input
              label="Workspace URL"
              hint="Used only as your account's internal identifier."
              error={errors.slug?.message}
              {...register('slug', {
                onChange: () => setSlugEdited(true),
              })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="City" error={errors.city?.message} {...register('city')} />
              <Input label="Phone" error={errors.contactPhone?.message} {...register('contactPhone')} />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Plan</p>
            {plansLoading ? (
              <p className="text-sm text-muted">Loading plans…</p>
            ) : plansError ? (
              <Alert tone="danger">Unable to load plans right now.</Alert>
            ) : (
              <div className="grid gap-2 sm:grid-cols-3">
                {(plans ?? []).map((plan) => {
                  const selected = watch('planCode') === plan.code;
                  return (
                    <label
                      key={plan.code}
                      className={`cursor-pointer rounded-lg border p-3 text-sm transition-colors ${
                        selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-surface-muted'
                      }`}
                    >
                      <input type="radio" value={plan.code} className="sr-only" {...register('planCode')} />
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{plan.name}</span>
                        {selected && <Check className="h-4 w-4 text-primary" aria-hidden />}
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        NPR {plan.priceMonthly.toLocaleString()}/mo · up to {plan.maxUsers} users
                      </p>
                    </label>
                  );
                })}
              </div>
            )}
            {errors.planCode && <p className="text-xs text-danger">{errors.planCode.message}</p>}
            <p className="text-xs text-muted">14-day free trial. No card required to start.</p>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your admin login</p>
            <Input label="Your full name" error={errors.adminFullName?.message} {...register('adminFullName')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Username" autoComplete="username" error={errors.adminUsername?.message} {...register('adminUsername')} />
              <Input label="Email" type="email" autoComplete="email" error={errors.adminEmail?.message} {...register('adminEmail')} />
            </div>
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              hint="At least 8 characters."
              error={errors.adminPassword?.message}
              {...register('adminPassword')}
            />
          </div>

          <Button type="submit" className="w-full" loading={submitting}>
            Create my clinic
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
