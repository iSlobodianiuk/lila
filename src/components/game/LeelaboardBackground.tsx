/**
 * Subtle Zen-minimalist background for the Leela board
 * Features soft geometric patterns and earth-tone accents
 */

const SUBTLE_DOTS: [number, number, number][] = [
  [80, 80, 0.08],
  [200, 50, 0.1],
  [350, 30, 0.06],
  [500, 60, 0.09],
  [700, 40, 0.07],
  [850, 90, 0.08],
  [30, 300, 0.06],
  [870, 250, 0.1],
  [50, 600, 0.08],
  [880, 550, 0.07],
  [100, 820, 0.09],
  [820, 800, 0.06],
  [430, 20, 0.08],
  [650, 870, 0.07],
  [220, 870, 0.09],
  [450, 450, 0.05],
  [150, 150, 0.06],
  [750, 750, 0.07],
];

export function LeelaboardBackground() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 900 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        {/* Subtle gradient for background elements */}
        <linearGradient id="zenGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b7355" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#5c4a36" stopOpacity="0.04" />
        </linearGradient>
        
        <linearGradient id="zenGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a89078" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#8b7355" stopOpacity="0.03" />
        </linearGradient>
        
        {/* Soft glow filter */}
        <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Zen circles - subtle concentric rings */}
      <circle
        cx="450"
        cy="450"
        r="400"
        fill="none"
        stroke="#8b7355"
        strokeWidth="0.5"
        opacity="0.08"
      />
      <circle
        cx="450"
        cy="450"
        r="320"
        fill="none"
        stroke="#8b7355"
        strokeWidth="0.5"
        opacity="0.06"
      />
      <circle
        cx="450"
        cy="450"
        r="240"
        fill="none"
        stroke="#8b7355"
        strokeWidth="0.5"
        opacity="0.05"
      />
      <circle
        cx="450"
        cy="450"
        r="160"
        fill="none"
        stroke="#8b7355"
        strokeWidth="0.5"
        opacity="0.04"
      />
      <circle
        cx="450"
        cy="450"
        r="80"
        fill="none"
        stroke="#8b7355"
        strokeWidth="0.5"
        opacity="0.03"
      />

      {/* Subtle diagonal lines - representing the spiritual journey */}
      <line
        x1="0"
        y1="900"
        x2="900"
        y2="0"
        stroke="url(#zenGrad1)"
        strokeWidth="1"
      />
      <line
        x1="100"
        y1="900"
        x2="900"
        y2="100"
        stroke="url(#zenGrad2)"
        strokeWidth="0.5"
      />
      <line
        x1="0"
        y1="800"
        x2="800"
        y2="0"
        stroke="url(#zenGrad2)"
        strokeWidth="0.5"
      />

      {/* Corner accents */}
      <path
        d="M 0 100 Q 50 50, 100 0"
        fill="none"
        stroke="#8b7355"
        strokeWidth="2"
        opacity="0.06"
      />
      <path
        d="M 800 900 Q 850 850, 900 800"
        fill="none"
        stroke="#8b7355"
        strokeWidth="2"
        opacity="0.06"
      />

      {/* Lotus-inspired pattern at center (very subtle) */}
      <g opacity="0.04" filter="url(#softGlow)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <ellipse
            key={angle}
            cx="450"
            cy="450"
            rx="60"
            ry="25"
            fill="none"
            stroke="#8b7355"
            strokeWidth="1"
            transform={`rotate(${angle}, 450, 450)`}
          />
        ))}
      </g>

      {/* Small accent dots scattered across the board */}
      {SUBTLE_DOTS.map(([cx, cy, opacity], i) => (
        <circle key={i} cx={cx} cy={cy} r="3" fill="#8b7355" opacity={opacity} />
      ))}

      {/* Four corner marks - representing the four directions */}
      <rect x="10" y="10" width="40" height="2" fill="#8b7355" opacity="0.08" />
      <rect x="10" y="10" width="2" height="40" fill="#8b7355" opacity="0.08" />
      
      <rect x="850" y="10" width="40" height="2" fill="#8b7355" opacity="0.08" />
      <rect x="888" y="10" width="2" height="40" fill="#8b7355" opacity="0.08" />
      
      <rect x="10" y="888" width="40" height="2" fill="#8b7355" opacity="0.08" />
      <rect x="10" y="850" width="2" height="40" fill="#8b7355" opacity="0.08" />
      
      <rect x="850" y="888" width="40" height="2" fill="#8b7355" opacity="0.08" />
      <rect x="888" y="850" width="2" height="40" fill="#8b7355" opacity="0.08" />
    </svg>
  );
}
