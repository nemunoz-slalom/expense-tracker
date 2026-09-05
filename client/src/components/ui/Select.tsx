import * as SelectPrimitive from '@radix-ui/react-select';

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectItem({ children, ...props }: SelectPrimitive.SelectItemProps): JSX.Element {
  return <SelectPrimitive.Item {...props}><SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText></SelectPrimitive.Item>;
}

export function SelectTrigger(props: SelectPrimitive.SelectTriggerProps): JSX.Element {
  return <SelectPrimitive.Trigger className="input select-trigger" {...props} />;
}

export function SelectContent({ children, ...props }: SelectPrimitive.SelectContentProps): JSX.Element {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content className="select-content" position="popper" {...props}>
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}
