export default function PageContainer({ children, className = "", ...props }) {
  return (
    <div {...props} className={`ui-page ${className}`}>
      {children}
    </div>
  );
}
