import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useBackTarget } from '@/lib/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { communicationApi } from './api';
import { SMS_CATEGORY_LABEL, type SmsTemplate } from './types';
import { SmsTemplateFormModal } from './components/SmsTemplateFormModal';
import { useT } from '@/i18n';

export function SmsTemplatesPage() {
  const t = useT();
  const { back } = useBackTarget();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.COMMUNICATION_TEMPLATE_MANAGE);
  const [editing, setEditing] = useState<SmsTemplate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery(() => communicationApi.templates.list(), []);

  const columns: Column<SmsTemplate>[] = [
    { key: 'name', header: t('Name'), cell: (tpl) => <span className="font-medium">{tpl.name}</span> },
    { key: 'category', header: t('Category'), cell: (tpl) => t(SMS_CATEGORY_LABEL[tpl.category]) },
    {
      key: 'body',
      header: t('Message'),
      cell: (tpl) => <span className="line-clamp-2 text-sm text-muted">{tpl.body}</span>,
      hideOnMobile: true,
    },
    { key: 'length', header: t('Length'), cell: (tpl) => t('{count} chars', { count: tpl.characterCount }) },
    {
      key: 'status',
      header: t('Status'),
      cell: (tpl) => <Badge tone={tpl.active ? 'success' : 'neutral'}>{t(tpl.active ? 'Active' : 'Inactive')}</Badge>,
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            cell: (tpl: SmsTemplate) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await communicationApi.templates.setActive(tpl.id, !tpl.active);
                  refetch();
                }}
              >
                {t(tpl.active ? 'Deactivate' : 'Activate')}
              </Button>
            ),
          } as Column<SmsTemplate>,
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        back={back}
        title={t('SMS templates')}
        description={t('Reusable message bodies with {placeholder} tokens, used by automation rules and campaigns.')}
        actions={
          canManage ? (
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t('New template')}
            </Button>
          ) : undefined
        }
      />

      <Card>
        {loading && !data ? (
          <TableSkeleton columns={columns.length} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.length === 0 ? (
          <EmptyState title={t('No templates yet')} message={t('Create a template to speed up sending and enable automation.')} />
        ) : (
          data && (
            <DataTable
              columns={columns}
              rows={data}
              rowKey={(tpl) => tpl.id}
              onRowClick={
                canManage
                  ? (tpl) => {
                      setEditing(tpl);
                      setModalOpen(true);
                    }
                  : undefined
              }
            />
          )
        )}
      </Card>

      <SmsTemplateFormModal open={modalOpen} onClose={() => setModalOpen(false)} template={editing} onSaved={refetch} />
    </>
  );
}
