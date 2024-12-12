import { AssetPickerLoading } from './loading';
import { Picker } from './picker';
import type { PickerProps } from './picker';

interface AssetPickerProps extends PickerProps {
  isLoading?: boolean;
}

export function AssetPicker({ isLoading, ...props }: AssetPickerProps) {
  return isLoading ? <AssetPickerLoading /> : <Picker {...props} />;
}
