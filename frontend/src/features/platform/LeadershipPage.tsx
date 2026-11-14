import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ImagePlus, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState, ErrorState } from '@/components/ui/PageState';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@/hooks/useQuery';
import { useT } from '@/i18n';
import { useBackTarget } from '@/lib/navigation';
import { initials } from '@/lib/initials';
import { fileToSquareJpegDataUri, PhotoError } from '@/lib/squarePhoto';
import { ApiError } from '@/types/api';
import { platformApi, type LeadershipProfile } from './api';

const DESCRIPTION_LIMIT = 500; // comfortably fits the public card; the server allows up to 600
const MAX_LEADERS = 12; // the server enforces the same limit

type LinkKey = 'linkedinUrl' | 'facebookUrl' | 'instagramUrl' | 'threadsUrl';

/** The round social buttons around the photo on the website — one per link that is filled in. */
const LINK_FIELDS: { key: LinkKey; label: string; placeholder: string }[] = [
  { key: 'linkedinUrl', label: 'LinkedIn', placeholder: 'linkedin.com/in/your-name' },
  { key: 'facebookUrl', label: 'Facebook', placeholder: 'facebook.com/your.name' },
  { key: 'instagramUrl', label: 'Instagram', placeholder: 'instagram.com/your.name' },
  { key: 'threadsUrl', label: 'Threads', placeholder: 'threads.net/@your.name' },
];

/** What a leader who has not been added yet starts as. */
const BLANK: LeadershipProfile = {
  id: 0,
  name: '',
  title: '',
  description: null,
  photoDataUri: null,
  linkedinUrl: null,
  facebookUrl: null,
  instagramUrl: null,
  threadsUrl: null,
  displayOrder: 0,
  published: false,
};

const linksOf = (p: LeadershipProfile): Record<LinkKey, string> => ({
  linkedinUrl: p.linkedinUrl ?? '',
  facebookUrl: p.facebookUrl ?? '',
  instagramUrl: p.instagramUrl ?? '',
  threadsUrl: p.threadsUrl ?? '',
});

/**
 * The leaders shown in the landing page's "About us" section, in the order they appear there. Edit
 * any of them in place, or add more (up to MAX_LEADERS) and remove ones that are no longer wanted.
 * A profile is only shown publicly once it has a name — clearing the name hides it again.
 */
export function LeadershipPage() {
  const t = useT();
  const { back } = useBackTarget();
  const { data, loading, error, refetch } = useQuery(() => platformApi.leadership(), []);
  const [adding, setAdding] = useState(false); // a new leader's card is open (one at a time)

  const count = data?.length ?? 0;
  const full = count >= MAX_LEADERS;
  const addButton = (
    <Button type="button" disabled={adding || full || !data} onClick={() => setAdding(true)}>
      <Plus className="h-4 w-4" aria-hidden />
      {t('Add leader')}
    </Button>
  );

  return (
    <>
      <PageHeader
        back={back}
        title={t('Leadership')}
        description={t('The people shown in the About us section of the public website. A profile appears there once it has a name.')}
        actions={
          <>
            {addButton}
            <Link
              to="/#about"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              {t('View on website')}
            </Link>
          </>
        }
      />

      {loading && !data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-96 animate-pulse rounded-lg border border-border bg-surface-muted" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : count === 0 && !adding ? (
        <Card>
          <EmptyState
            title={t('No leaders yet')}
            message={t('Add the people you want to show in the About us section of the website.')}
            action={addButton}
          />
        </Card>
      ) : (
        <>
          {full && (
            <p className="mb-3 text-sm text-muted">
              {t('You have added the most leaders that can be shown ({max}). Remove one to add another.', { max: MAX_LEADERS })}
            </p>
          )}
          <div className="grid items-start gap-4 lg:grid-cols-2">
            {(data ?? []).map((profile, i) => (
              <ProfileEditor key={profile.id} profile={profile} position={i + 1} onChanged={refetch} />
            ))}
            {adding && (
              <ProfileEditor
                key="new"
                profile={null}
                position={count + 1}
                onChanged={() => {
                  setAdding(false);
                  refetch();
                }}
                onCancel={() => setAdding(false)}
              />
            )}
          </div>
        </>
      )}
    </>
  );
}

/**
 * One leader's card. With `profile` null it is a leader who has not been added yet: nothing is sent
 * until "Add leader", and Cancel just closes it. Otherwise it edits the saved profile in place and
 * can remove it.
 */
function ProfileEditor({
  profile: savedProfile,
  position,
  onChanged,
  onCancel,
}: {
  profile: LeadershipProfile | null;
  position: number;
  onChanged: () => void;
  onCancel?: () => void;
}) {
  const t = useT();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isNew = savedProfile === null;
  const profile = savedProfile ?? BLANK;
  const [confirmRemove, setConfirmRemove] = useState(false);

  // A new card appears at the end of the list, possibly below the fold — bring it into view.
  useEffect(() => {
    if (isNew) cardRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  }, [isNew]);

  const [name, setName] = useState(profile.name);
  const [title, setTitle] = useState(profile.title);
  const [description, setDescription] = useState(profile.description ?? '');
  const [photo, setPhoto] = useState<string | null>(profile.photoDataUri);
  const [links, setLinks] = useState(() => linksOf(profile));
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const reset = () => {
    setName(profile.name);
    setTitle(profile.title);
    setDescription(profile.description ?? '');
    setPhoto(profile.photoDataUri);
    setLinks(linksOf(profile));
  };

  // A fresh copy arrives after saving; show exactly what the server now holds.
  useEffect(reset, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const saved = linksOf(profile);
  const dirty =
    name !== profile.name ||
    title !== profile.title ||
    description !== (profile.description ?? '') ||
    photo !== profile.photoDataUri ||
    LINK_FIELDS.some((f) => links[f.key] !== saved[f.key]);
  const titleMissing = title.trim() === '';
  const nameIsBlank = name.trim() === '';

  const choosePhoto = async (file: File) => {
    setProblem(null);
    try {
      setPhoto(await fileToSquareJpegDataUri(file));
    } catch (err) {
      const key = err instanceof PhotoError ? err.problem : 'unreadable';
      setProblem(
        key === 'not-an-image'
          ? t('Choose a JPEG, PNG or WebP photo.')
          : key === 'too-large'
            ? t('That photo is too large — choose one under 8 MB.')
            : t('That photo could not be read. Try a different file.'),
      );
    }
  };

  const save = async () => {
    setSaving(true);
    setProblem(null);
    try {
      const payload = {
        name: name.trim(),
        title: title.trim(),
        description: description.trim() || null,
        photoDataUri: photo,
        linkedinUrl: links.linkedinUrl.trim() || null,
        facebookUrl: links.facebookUrl.trim() || null,
        instagramUrl: links.instagramUrl.trim() || null,
        threadsUrl: links.threadsUrl.trim() || null,
      };
      if (isNew) {
        await platformApi.createLeadership(payload);
        toast.success(t('Leader added'));
      } else {
        await platformApi.updateLeadership(profile.id, payload);
        toast.success(t('Profile saved'));
      }
      onChanged();
    } catch (err) {
      setProblem(err instanceof ApiError ? err.message : t('Unable to save the profile'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    await platformApi.deleteLeadership(profile.id);
    toast.success(t('Leader removed'));
    onChanged();
  };

  return (
    <div ref={cardRef}>
      <Card>
        <CardBody className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-heading-4 text-foreground">{t('Leader {n}', { n: position })}</h2>
            {isNew ? (
              <Badge tone="info">{t('New — not added yet')}</Badge>
            ) : (
              <Badge tone={profile.published ? 'success' : 'warning'}>
                {profile.published ? t('Shown on website') : t('Hidden — add a name')}
              </Badge>
            )}
          </div>

          {problem && <Alert tone="danger">{problem}</Alert>}

          <div className="flex items-center gap-4">
            {photo ? (
              <img src={photo} alt="" className="h-24 w-24 shrink-0 rounded-2xl object-cover ring-1 ring-border" />
            ) : (
              <span
                aria-hidden
                className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-2xl font-bold text-primary-foreground"
              >
                {initials(name) || '?'}
              </span>
            )}
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-label={t('Choose a photo')}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = ''; // so choosing the same file again still fires
                  if (file) void choosePhoto(file);
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                  <ImagePlus className="h-4 w-4" aria-hidden />
                  {photo ? t('Change photo') : t('Upload photo')}
                </Button>
                {photo && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPhoto(null)}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                    {t('Remove photo')}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted">{t('Square works best. It is cropped to the centre and shrunk automatically.')}</p>
            </div>
          </div>

          <Input label={t('Name')} value={name} maxLength={160} autoFocus={isNew} onChange={(e) => setName(e.target.value)} />
          <Input
            label={t('Job title')}
            value={title}
            maxLength={120}
            error={titleMissing && (!isNew || title !== '') ? t('A job title is required') : undefined}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div>
            <Textarea
              label={t('Short description')}
              rows={4}
              maxLength={DESCRIPTION_LIMIT}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="mt-1 text-right text-xs text-muted">
              {description.length} / {DESCRIPTION_LIMIT}
            </p>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">{t('Social profiles')}</legend>
            <p className="text-xs text-muted">{t('LinkedIn, Facebook and Instagram buttons are always on the photo and open the link you add here. Threads appears only if you add its link.')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {LINK_FIELDS.map((f) => (
                <Input
                  key={f.key}
                  label={f.label}
                  inputMode="url"
                  autoComplete="off"
                  placeholder={f.placeholder}
                  value={links[f.key]}
                  maxLength={300}
                  onChange={(e) => setLinks((prev) => ({ ...prev, [f.key]: e.target.value }))}
                />
              ))}
            </div>
          </fieldset>

          {nameIsBlank && !isNew && profile.published && (
            <Alert tone="warning">{t('With the name cleared, this profile will be hidden from the website.')}</Alert>
          )}

          <div className="flex items-center justify-between gap-2">
            {isNew ? (
              <span />
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="text-danger hover:bg-danger/10"
                disabled={saving}
                onClick={() => setConfirmRemove(true)}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {t('Remove leader')}
              </Button>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isNew ? saving : !dirty || saving}
                onClick={() => {
                  if (isNew) {
                    onCancel?.();
                  } else {
                    reset();
                    setProblem(null);
                  }
                }}
              >
                {isNew ? t('Cancel') : t('Discard changes')}
              </Button>
              <Button
                type="button"
                loading={saving}
                disabled={isNew ? nameIsBlank || titleMissing : !dirty || titleMissing}
                onClick={() => void save()}
              >
                {isNew ? t('Add leader') : t('Save changes')}
              </Button>
            </div>
          </div>
        </CardBody>
        {!isNew && (
          <ConfirmDialog
            open={confirmRemove}
            onClose={() => setConfirmRemove(false)}
            onConfirm={remove}
            title={t('Remove leader')}
            message={t('Remove {name} from the leadership profiles? They will no longer appear on the website.', {
              name: profile.name || t('this leader'),
            })}
            confirmLabel={t('Remove leader')}
            tone="danger"
          />
        )}
      </Card>
    </div>
  );
}
