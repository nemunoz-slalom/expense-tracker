import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
export const AlertDialogAction = AlertDialogPrimitive.Action;
export const AlertDialogTitle = AlertDialogPrimitive.Title;
export const AlertDialogDescription = AlertDialogPrimitive.Description;

export function AlertDialogContent(props: AlertDialogPrimitive.AlertDialogContentProps): JSX.Element {
  return <AlertDialogPrimitive.Content className="dialog-content" {...props} />;
}
