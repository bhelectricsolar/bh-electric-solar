export default function CornerFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`frame ${className}`}>
      <span className="frame-tr" />
      <span className="frame-br" />
      {children}
    </div>
  );
}
