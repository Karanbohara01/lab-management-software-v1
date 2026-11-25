import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { useAuth } from '@/features/auth/useAuth';
import { login } from '@/features/auth/authSlice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { useQuery } from '@/hooks/useQuery';
import { useForcedLightTheme } from '@/hooks/useTheme';
import { useScrollToTopOnError } from '@/hooks/useScrollToTopOnError';
import { ApiError } from '@/types/api';
import { signupApi } from './api';
import { BackLink } from '@/components/BackLink';
import { BrandMark } from '@/components/brand/BrandMark';
import { useT } from '@/i18n';

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
  const t = useT();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  useForcedLightTheme();
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
      setServerError(err instanceof ApiError ? err.message : t('Unable to create your clinic. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-6">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 45%, rgba(248, 250, 252, 0.76) 0%, rgba(241, 245, 249, 0.84) 55%, rgba(226, 232, 240, 0.94) 100%),
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
      <div className="relative z-10 w-full max-w-3xl">
        <div className="mb-4 flex flex-col items-center gap-2 text-center">
          <Link
            to="/"
            aria-label={t('LIMS home')}
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <BrandMark className="h-12" />
          </Link>
          <div>
            <h1 className="text-heading-3 text-foreground">{t('Start your free trial')}</h1>
            <p className="mt-1 text-caption text-muted">{t('Your own isolated LIMS workspace, ready in seconds.')}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 p-6" noValidate>
          {serverError && <Alert tone="danger">{serverError}</Alert>}

          <div className="space-y-3">
            <p className="text-label uppercase text-muted">{t('Your laboratory')}</p>
            <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
              <Input label={t('Laboratory name')} autoFocus error={errors.name?.message} {...register('name')} />
              <Input
                label={t('Workspace URL')}
                hint={t("Used only as your account's internal identifier.")}
                error={errors.slug?.message}
                {...register('slug', {
                  onChange: () => setSlugEdited(true),
                })}
              />
              <Input label={t('City')} error={errors.city?.message} {...register('city')} />
              <Input label={t('Phone')} error={errors.contactPhone?.message} {...register('contactPhone')} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-label uppercase text-muted">{t('Plan')}</p>
              <p className="text-xs text-muted">{t('14-day free trial. No card required to start.')}</p>
            </div>
            {plansLoading ? (
              <p className="text-sm text-muted">{t('Loading plans…')}</p>
            ) : plansError ? (
              <Alert tone="danger">{t('Unable to load plans right now.')}</Alert>
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
                        {t('NPR {price}/mo · up to {count} users', {
                          price: plan.priceMonthly.toLocaleString(),
                          count: plan.maxUsers,
                        })}
                      </p>
                    </label>
                  );
                })}
              </div>
            )}
            {errors.planCode && <p className="text-xs text-danger">{errors.planCode.message}</p>}
          </div>

          <div className="space-y-3">
            <p className="text-label uppercase text-muted">{t('Your admin login')}</p>
            <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
              <Input label={t('Your full name')} error={errors.adminFullName?.message} {...register('adminFullName')} />
              <Input label={t('Username')} autoComplete="username" error={errors.adminUsername?.message} {...register('adminUsername')} />
              <Input label={t('Email')} type="email" autoComplete="email" error={errors.adminEmail?.message} {...register('adminEmail')} />
              <Input
                label={t('Password')}
                type="password"
                autoComplete="new-password"
                placeholder={t('At least 8 characters')}
                error={errors.adminPassword?.message}
                {...register('adminPassword')}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" loading={submitting}>
            {t('Create my clinic')}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted">
          {t('Already have an account?')}{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t('Sign in')}
          </Link>
        </p>
      </div>
    </div>
  );
}
