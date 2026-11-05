import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useT } from '@/i18n';

/** "You have unsaved changes" — Stay keeps the page, Discard lets the navigation go ahead. */
export function UnsavedChangesDialog({
  open,
  onStay,
  onDiscard,
}: {
  open: boolean;
  onStay: () => void;
  onDiscard: () => void;
}) {
  const t = useT();
  return (
    <Modal
      open={open}
      onClose={onStay}
      title={t('Discard unsaved changes?')}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onStay}>
            {t('Stay on this page')}
          </Button>
          <Button variant="danger" type="button" onClick={onDiscard}>
            {t('Discard changes')}
          </Button>
        </>
      }
    >
      <p className="text-sm text-foreground">
        {t("You have changes that haven't been saved. If you leave now, they will be lost.")}
      </p>
    </Modal>
  );
}
