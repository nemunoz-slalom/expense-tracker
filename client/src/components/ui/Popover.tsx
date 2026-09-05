import * as PopoverPrimitive from '@radix-ui/react-popover';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export function PopoverContent(props: PopoverPrimitive.PopoverContentProps): JSX.Element {
  return <PopoverPrimitive.Content className="popover-content" {...props} />;
}
