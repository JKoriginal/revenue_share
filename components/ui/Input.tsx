import { forwardRef, InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, ...props }, ref) {
  return (
    <div className="space-y-1.5">
      <label>{label}</label>
      <input ref={ref} {...props} />
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
});
