// هيكل رمادي بيتحرك وقت التحميل
export default function Skeleton({ height = 16, width = "100%", className = "" }) {
  return (
    <div
      className={`dash-skeleton ${className}`.trim()}
      style={{ height, width }}
      aria-hidden="true"
    />
  );
}
