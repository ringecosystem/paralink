import { ChangeEvent, useState } from "react";

interface UseNumberInputProps {
  maxDecimals?: number;
  maxValue?: number;
  minValue?: number;
  initialValue?: string;
  onChange?: (value: string) => void;
}

interface UseNumberInputReturn {
  value: string;
  setValue: (value: string) => void;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
  isValid: boolean;
  error?: string;
}

export function useNumberInput({
  maxDecimals = 6,
  maxValue,
  minValue = 0,
  initialValue = "",
  onChange,
}: UseNumberInputProps): UseNumberInputReturn {
  const [value, setInternalValue] = useState(initialValue);
  const [error, setError] = useState<string>();

  function validateValue(numValue: number): boolean {
    if (maxValue !== undefined && numValue > maxValue) {
      setError(`Value cannot exceed ${maxValue}`);
      return false;
    }
    if (minValue !== undefined && numValue < minValue) {
      setError(`Value cannot be less than ${minValue}`);
      return false;
    }
    setError(undefined);
    return true;
  }

  function setValue(newValue: string) {
    setInternalValue(newValue);
    onChange?.(newValue);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;

    if (!newValue) {
      setValue("");
      return;
    }

    const regex = new RegExp(`^\\d*\\.?\\d{0,${maxDecimals}}$`);
    if (!regex.test(newValue)) return;

    let formattedValue = newValue;
    if (
      newValue.startsWith("0") &&
      newValue.length > 1 &&
      !newValue.startsWith("0.")
    )
      formattedValue = newValue.replace(/^0+/, "");

    const numValue = parseFloat(formattedValue);
    if (!Number.isNaN(numValue) && validateValue(numValue))
      setValue(formattedValue);
  }

  function handleBlur() {
    if (!value) return;

    const numValue = parseFloat(value);
    if (!Number.isNaN(numValue) && validateValue(numValue)) {
      const formatted = value.includes(".")
        ? numValue.toFixed(maxDecimals)
        : value;
      setValue(formatted);
    }
  }

  return {
    value,
    setValue,
    handleChange,
    handleBlur,
    isValid: !error,
    error,
  };
}

export const numberUtils = {
  formatWithCommas(value: string): string {
    if (!value) return value;
    const parts = value.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  },

  removeCommas(value: string): string {
    return value.replace(/,/g, "");
  },

  formatDecimals(value: string, decimals: number): string {
    const num = parseFloat(value);
    return Number.isNaN(num) ? "" : num.toFixed(decimals);
  },
};
