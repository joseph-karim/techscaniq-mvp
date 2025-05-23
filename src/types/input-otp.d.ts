declare module 'input-otp' {
  import * as React from "react"

  type OTPInputProps = {
    maxLength?: number;
    containerClassName?: string;
    className?: string;
    value?: string;
    onChange?: (value: string) => void;
    [key: string]: any;
  }

  export const OTPInput: React.FC<OTPInputProps & React.RefAttributes<HTMLDivElement>>;

  export const OTPInputContext: React.Context<{
    slots: {
      char: string;
      hasFakeCaret: boolean;
      isActive: boolean;
    }[];
  }>;
}