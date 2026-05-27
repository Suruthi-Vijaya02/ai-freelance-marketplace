export default function Logo({ size = 36, className = '' }) {
  const id = `logo-grad-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f09433" />
          <stop offset="25%" stopColor="#e6683c" />
          <stop offset="50%" stopColor="#dc2743" />
          <stop offset="75%" stopColor="#cc2366" />
          <stop offset="100%" stopColor="#bc1888" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill={`url(#${id})`} />
      <text
        x="24"
        y="30"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="Playfair Display, serif"
        fontSize="16"
        fontWeight="700"
      >
        SV
      </text>
    </svg>
  );
}
