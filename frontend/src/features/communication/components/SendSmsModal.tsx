import { Modal } from '@/components/ui/Modal';
import { SendSmsForm } from './SendSmsForm';
import { useT } from '@/i18n';

/** Reusable "Send SMS" quick action — dropped into the Patient detail page (and any other record screen). */
export function SendSmsModal({
  open,
  onClose,
  patientId,
  defaultPhone,
  defaultName,
}: {
  open: boolean;
  onClose: () => void;
  patientId?: number;
  defaultPhone?: string;
  defaultName?: string;
}) {
  const t = useT();
  return (
    <Modal open={open} onClose={onClose} title={t('Send SMS')}>
      <SendSmsForm patientId={patientId} defaultPhone={defaultPhone} defaultName={defaultName} onSent={onClose} />
    </Modal>
  );
}
