import { forwardRef } from "react";

const Button = forwardRef(function Button(
  { variant = "primary", className = "", children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`ui-button ${variant} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
