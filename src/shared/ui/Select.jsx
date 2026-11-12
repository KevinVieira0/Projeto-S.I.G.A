import { forwardRef } from "react";
const Select = forwardRef(function Select(
  { children, className = "", ...props },
  ref,
) {
  return (
    <select {...props} ref={ref} className={`ui-field ${className}`}>
      {children}
    </select>
  );
});
export default Select;
