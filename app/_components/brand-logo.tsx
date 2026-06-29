type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <span
      className={`inline-flex items-baseline whitespace-nowrap font-semibold leading-none ${className}`}
      style={{ fontFamily: "var(--font-brand)" }}
    >
      <span>Pair</span>
      <span className="text-[var(--page-accent)]">view</span>
      <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-[var(--page-accent)] align-[0.35em]" />
    </span>
  );
}
