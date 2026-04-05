interface Props {
  className?: string;
  size?: "sm" | "md" | "lg";
}

function GooglePlayBadge({ size }: { size: Props["size"] }) {
  const h = size === "sm" ? 38 : size === "lg" ? 52 : 44;
  return (
    <a
      href="#android"
      aria-label="Get it on Google Play"
      className="inline-flex items-center group transition-transform hover:scale-105 active:scale-95"
    >
      <svg height={h} viewBox="0 0 646 192" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="646" height="192" rx="20" fill="#1a1a1a" />
        <rect x="1" y="1" width="644" height="190" rx="19" stroke="white" strokeOpacity="0.25" strokeWidth="2" />

        {/* Play triangle */}
        <g transform="translate(30, 40)">
          <path d="M8 0 L8 112 L96 56 Z" fill="url(#gp-grad)" />
          <path d="M8 0 L62 54 L8 54 Z" fill="#00d2ff" fillOpacity="0.9" />
          <path d="M8 58 L62 58 L8 112 Z" fill="#ff6b35" fillOpacity="0.9" />
          <path d="M62 54 L96 56 L62 58 Z" fill="#ffca28" fillOpacity="0.9" />
          <defs>
            <linearGradient id="gp-grad" x1="8" y1="0" x2="8" y2="112" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00d2ff" />
              <stop offset="100%" stopColor="#3a7bd5" />
            </linearGradient>
          </defs>
        </g>

        {/* Text */}
        <text x="148" y="78" fill="white" fillOpacity="0.75" fontSize="22" fontFamily="system-ui, sans-serif" letterSpacing="1">GET IT ON</text>
        <text x="145" y="138" fill="white" fontSize="46" fontFamily="system-ui, sans-serif" fontWeight="500">Google Play</text>
      </svg>
    </a>
  );
}

function AppStoreBadge({ size }: { size: Props["size"] }) {
  const h = size === "sm" ? 38 : size === "lg" ? 52 : 44;
  return (
    <a
      href="#ios"
      aria-label="Download on the App Store"
      className="inline-flex items-center group transition-transform hover:scale-105 active:scale-95"
    >
      <svg height={h} viewBox="0 0 646 192" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="646" height="192" rx="20" fill="#1a1a1a" />
        <rect x="1" y="1" width="644" height="190" rx="19" stroke="white" strokeOpacity="0.25" strokeWidth="2" />

        {/* Apple logo */}
        <g transform="translate(28, 24) scale(1.45)">
          <path
            d="M57.2 31.8c-.3-12.8 10.5-19 11-19.3-6-8.8-15.3-10-18.6-10.1-7.9-.8-15.5 4.7-19.5 4.7-4 0-10.2-4.6-16.8-4.5C5.4 2.8-.2 7.3-3.6 13.8c-6.9 12-1.8 29.8 5 39.6 3.3 4.8 7.3 10.2 12.5 10 5-.2 6.9-3.2 13-3.2 6 0 7.7 3.2 13 3.1 5.4-.1 8.8-4.8 12.1-9.6 3.9-5.5 5.4-10.8 5.5-11.1-.1-.1-10.5-4-10.3-16.8z"
            fill="white"
          />
          <path
            d="M45.5 8.4c2.7-3.3 4.6-7.9 4.1-12.5-3.9.2-8.7 2.6-11.5 5.9-2.5 2.9-4.7 7.6-4.1 12.1 4.3.3 8.8-2.2 11.5-5.5z"
            fill="white"
          />
        </g>

        {/* Text */}
        <text x="148" y="78" fill="white" fillOpacity="0.75" fontSize="22" fontFamily="system-ui, sans-serif" letterSpacing="1">DOWNLOAD ON THE</text>
        <text x="145" y="138" fill="white" fontSize="46" fontFamily="system-ui, sans-serif" fontWeight="500">App Store</text>
      </svg>
    </a>
  );
}

export function AppStoreBadges({ className = "", size = "md" }: Props) {
  return (
    <div className={`flex flex-wrap gap-3 items-center ${className}`}>
      <GooglePlayBadge size={size} />
      <AppStoreBadge size={size} />
    </div>
  );
}
