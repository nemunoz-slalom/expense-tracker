import * as DialogPrimitive from '@radix-ui/react-dialog';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;

export function DialogContent(props: DialogPrimitive.DialogContentProps): JSX.Element {
  return <DialogPrimitive.Content className="dialog-content" {...props} />;
}
