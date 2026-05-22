export function InstagramIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      className="social-brand-icon social-brand-icon--instagram"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#E4405F" />
      <circle cx="12" cy="12" r="4.25" fill="none" stroke="#fff" strokeWidth="1.75" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="#fff" />
    </svg>
  );
}

export function LinkedInIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      className="social-brand-icon social-brand-icon--linkedin"
    >
      <rect x="2" y="2" width="20" height="20" rx="3" fill="#0A66C2" />
      <path
        fill="#fff"
        d="M7.2 10.2h2.5v8.1H7.2V10.2zm1.25-4a1.45 1.45 0 1 1 0 2.9 1.45 1.45 0 0 1 0-2.9zm3.3 4h2.4v1.1h.03c.33-.63 1.15-1.3 2.37-1.3 2.53 0 3 1.67 3 3.84v4.45h-2.6v-3.94c0-.94-.02-2.15-1.31-2.15-1.31 0-1.51 1.02-1.51 2.08v4.01h-2.6V10.2z"
      />
    </svg>
  );
}

export function XIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      className="social-brand-icon social-brand-icon--x"
    >
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#000" />
      <path
        fill="#fff"
        d="M13.2 10.8 18.4 5h-1.2l-4.5 5-3.6-5H5l5.3 7.5L5 19h1.2l4.8-5.5 3.8 5.5h2.8l-5.6-8.2zm-1.6 1.8-.9-1.2L6.6 6.2h2l3.7 5.2.9 1.2 4.5 6.2h-2l-3.8-5.2z"
      />
    </svg>
  );
}
