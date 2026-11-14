import { useState } from 'react';
import { MessageSquarePlus, CalendarPlus, PhoneOff } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { PERMISSIONS } from '@/features/auth/permissions';
import { communicationApi } from '@/features/communication/api';
import { SMS_MESSAGE_STATUS_LABEL, type SmsMessage, type SmsMessageStatus } from '@/features/communication/types';
import { SendSmsModal } from '@/features/communication/components/SendSmsModal';
import { FollowUpModal } from '@/features/communication/components/FollowUpModal';
import { useT } from '@/i18n';

const STATUS_TONE: Record<SmsMessageStatus, 'neutral' | 'success' | 'danger' | 'info'> = {
  QUEUED: 'neutral',
  SENT: 'info',
  DELIVERED: 'success',
  FAILED: 'danger',
};

export function PatientCommunicationTab({
  patientId,
  phone,
  fullName,
}: {
  patientId: number;
  phone: string | null;
  fullName: string;
}) {
  const t = useT();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canSend = hasPermission(PERMISSIONS.COMMUNICATION_SEND);
  const [sendOpen, setSendOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [optOutConfirmOpen, setOptOutConfirmOpen] = useState(false);

  const optOut = async () => {
    if (!phone) return;
    try {
      await communicationApi.optOuts.add({ phone, patientId, reason: 'Requested via patient record' });
      toast.success(t('{phone} will no longer be sent SMS by this system', { phone }));
    } catch (err) {
      toast.error(
        err instanceof ApiError && err.message ? err.message : t('Unable to add this number to the do-not-contact list'),
      );
    } finally {
      setOptOutConfirmOpen(false);
    }
  };

  const { data: messages, loading, error, refetch } = useQuery(() => communicationApi.messages.forPatient(patientId), [patientId]);
  const { data: followUps, refetch: refetchFollowUps } = useQuery(() => communicationApi.followUps.forPatient(patientId), [patientId]);

  const columns: Column<SmsMessage>[] = [
    { key: 'date', header: t('Sent'), cell: (m) => new Date(m.createdAt).toLocaleString() },
    { key: 'body', header: t('Message'), cell: (m) => <span className="line-clamp-1 text-sm">{m.messageBody}</span> },
    {
      key: 'status',
      header: t('Status'),
      cell: (m) => <Badge tone={STATUS_TONE[m.status]}>{t(SMS_MESSAGE_STATUS_LABEL[m.status])}</Badge>,
    },
  ];

  return (
    <div className="space-y-4">
      {canSend && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setSendOpen(true)}>
            <MessageSquarePlus className="h-4 w-4" aria-hidden />
            {t('Send SMS')}
          </Button>
          <Button variant="secondary" onClick={() => setFollowUpOpen(true)}>
            <CalendarPlus className="h-4 w-4" aria-hidden />
            {t('Schedule follow-up')}
          </Button>
          {phone && (
            <Button variant="ghost" onClick={() => setOptOutConfirmOpen(true)}>
              <PhoneOff className="h-4 w-4" aria-hidden />
              {t('Opt out of SMS')}
            </Button>
          )}
        </div>
      )}

      <Card>
        <CardHeader title={t('Follow-ups')} />
        <CardBody className="space-y-2">
          {!followUps || followUps.length === 0 ? (
            <p className="text-sm text-muted">{t('No follow-ups scheduled.')}</p>
          ) : (
            followUps.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{f.dueDate}</p>
                  {f.reason && <p className="text-xs text-muted">{f.reason}</p>}
                </div>
                <Badge tone={f.status === 'PENDING' ? 'info' : f.status === 'DONE' ? 'success' : 'neutral'}>
                  {t(f.status)}
                </Badge>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t('SMS history')} />
        {loading && !messages ? (
          <TableSkeleton columns={columns.length} rows={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : messages && messages.length === 0 ? (
          <EmptyState title={t('No messages yet')} message={t('SMS sent to this patient — manual, automated or campaign — will appear here.')} />
        ) : (
          messages && <DataTable columns={columns} rows={messages} rowKey={(m) => m.id} />
        )}
      </Card>

      <SendSmsModal
        open={sendOpen}
        onClose={() => {
          setSendOpen(false);
          refetch();
        }}
        patientId={patientId}
        defaultPhone={phone ?? ''}
        defaultName={fullName}
      />
      <FollowUpModal
        open={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
        patientId={patientId}
        onSaved={refetchFollowUps}
      />
      <ConfirmDialog
        open={optOutConfirmOpen}
        onClose={() => setOptOutConfirmOpen(false)}
        onConfirm={optOut}
        title={t('Opt out {phone} of SMS?', { phone: phone ?? '' })}
        message={t('This number will never be sent an SMS by this system again — manual, automated, or campaign — until it is removed from the do-not-contact list.')}
        confirmLabel={t('Opt out')}
      />
    </div>
  );
}
