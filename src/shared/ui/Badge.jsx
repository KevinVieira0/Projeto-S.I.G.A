export default function Badge({ children, className = "", ...props }) {
  return (
    <span {...props} className={`ui-badge ${className}`}>
      {children}
    </span>
  );
}
