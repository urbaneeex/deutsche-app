type IconProps = { className?: string; size?: number };

const defaults = { size: 16, className: "shrink-0" };

export function IconEdit({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={className ?? defaults.className} aria-hidden>
      <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSparkles({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" className={className ?? defaults.className} aria-hidden>
      <path d="M8 1l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zM3 9l.5 1.5L5 11l-1.5.5L3 13l-.5-1.5L1 11l1.5-.5L3 9zM13 9l.5 1.5L15 11l-1.5.5L13 13l-.5-1.5L11 11l1.5-.5L13 9z" />
    </svg>
  );
}

export function IconTrash({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={className ?? defaults.className} aria-hidden>
      <path d="M3 4h10M6 4V3h4v1M5 4v8h6V4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconDotsVertical({ className, size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="currentColor" className={className ?? defaults.className} aria-hidden>
      <circle cx="7" cy="2.5" r="1.25" />
      <circle cx="7" cy="7" r="1.25" />
      <circle cx="7" cy="11.5" r="1.25" />
    </svg>
  );
}

export function IconCompass({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className ?? defaults.className} aria-hidden>
      <circle cx="10" cy="10" r="7" />
      <path d="M12.5 7.5L9 9 7.5 12.5 11 11 12.5 7.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconCards({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className ?? defaults.className} aria-hidden>
      <rect x="2" y="5" width="12" height="13" rx="1.5" opacity="0.45" />
      <rect x="5" y="2" width="12" height="13" rx="1.5" />
    </svg>
  );
}

export function IconChart({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className ?? defaults.className} aria-hidden>
      <path d="M4 16V10M8 16V6M12 16V9M16 16V4" strokeLinecap="round" />
    </svg>
  );
}

export function IconChat({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className ?? defaults.className} aria-hidden>
      <path d="M4 5h12a1 1 0 011 1v7a1 1 0 01-1 1H8l-4 3V6a1 1 0 011-1z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMic({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className ?? defaults.className} aria-hidden>
      <rect x="7" y="3" width="6" height="9" rx="3" />
      <path d="M5 10a5 5 0 0010 0M10 15v2" strokeLinecap="round" />
    </svg>
  );
}

export function IconVolume({ className, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={className ?? defaults.className} aria-hidden>
      <path d="M3 6h2l3-2v8l-3-2H3V6z" strokeLinejoin="round" />
      <path d="M10 5.5a3 3 0 010 5M11.5 4a5 5 0 010 8" strokeLinecap="round" />
    </svg>
  );
}
