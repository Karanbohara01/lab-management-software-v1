import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

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
  return (
    <Modal
      open={open}
      onClose={onStay}
      title="Discard unsaved changes?"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onStay}>
            Stay on this page
          </Button>
          <Button variant="danger" type="button" onClick={onDiscard}>
            Discard changes
          </Button>
        </>
      }
    >
      <p className="text-sm text-foreground">
        You have changes that haven&apos;t been saved. If you leave now, they will be lost.
      </p>
    </Modal>
  );
}
