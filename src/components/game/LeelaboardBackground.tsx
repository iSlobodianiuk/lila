const STAR_DOTS: [number, number, number][] = [
  [80, 80, 0.35],
  [200, 50, 0.38],
  [350, 30, 0.42],
  [500, 60, 0.4],
  [700, 40, 0.33],
  [850, 90, 0.45],
  [30, 300, 0.36],
  [870, 250, 0.4],
  [50, 600, 0.38],
  [880, 550, 0.42],
  [100, 820, 0.35],
  [820, 800, 0.44],
  [430, 20, 0.39],
  [650, 870, 0.37],
  [220, 870, 0.41],
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
        <linearGradient id="snakeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c9a227" />
          <stop offset="50%" stopColor="#f0d060" />
          <stop offset="100%" stopColor="#a07820" />
        </linearGradient>
        <linearGradient id="snakeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b8860b" />
          <stop offset="50%" stopColor="#daa520" />
          <stop offset="100%" stopColor="#8b6508" />
        </linearGradient>
        <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e8c84a" />
          <stop offset="100%" stopColor="#c9a020" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="softglow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#glow)" opacity="0.85">
        <path
          d="M 755 120 C 740 200, 790 280, 760 360 C 730 440, 680 480, 700 560 C 720 640, 780 680, 750 760 C 730 800, 680 820, 640 840"
          fill="none"
          stroke="url(#snakeGrad1)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 750 130 Q 760 125 770 130"
          fill="none"
          stroke="#f0d060"
          strokeWidth="2"
          opacity="0.6"
        />
        <path
          d="M 745 180 Q 758 175 768 180"
          fill="none"
          stroke="#f0d060"
          strokeWidth="2"
          opacity="0.6"
        />
        <path
          d="M 772 260 Q 782 255 792 260"
          fill="none"
          stroke="#f0d060"
          strokeWidth="2"
          opacity="0.6"
        />
        <path
          d="M 755 340 Q 765 335 775 340"
          fill="none"
          stroke="#f0d060"
          strokeWidth="2"
          opacity="0.6"
        />
        <ellipse cx="755" cy="115" rx="12" ry="8" fill="#daa520" transform="rotate(-20, 755, 115)" />
        <circle cx="750" cy="112" r="2.5" fill="#1a0a00" />
        <circle cx="760" cy="110" r="2.5" fill="#1a0a00" />
        <path
          d="M 755 120 L 750 128 M 755 120 L 762 127"
          stroke="#cc2200"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>

      <g filter="url(#glow)" opacity="0.8">
        <path
          d="M 180 730 C 160 760, 130 750, 110 780 C 90 810, 100 840, 130 855"
          fill="none"
          stroke="url(#snakeGrad2)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <ellipse cx="180" cy="726" rx="11" ry="7" fill="#c8a020" transform="rotate(10, 180, 726)" />
        <circle cx="175" cy="723" r="2" fill="#1a0a00" />
        <circle cx="185" cy="722" r="2" fill="#1a0a00" />
        <path
          d="M 180 730 L 175 738 M 180 730 L 187 737"
          stroke="#cc2200"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>

      <g filter="url(#glow)" opacity="0.75">
        <path
          d="M 160 450 C 140 480, 110 490, 120 520 C 130 550, 170 555, 160 580 C 150 605, 110 610, 120 635"
          fill="none"
          stroke="url(#snakeGrad1)"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <ellipse cx="160" cy="446" rx="10" ry="7" fill="#daa520" transform="rotate(-5, 160, 446)" />
        <circle cx="155" cy="443" r="2" fill="#1a0a00" />
        <circle cx="165" cy="442" r="2" fill="#1a0a00" />
        <path
          d="M 160 450 L 155 458 M 160 450 L 167 457"
          stroke="#cc2200"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>

      <g filter="url(#glow)" opacity="0.78">
        <path
          d="M 500 490 C 520 530, 560 540, 550 580 C 540 620, 490 630, 500 670 C 510 700, 550 710, 540 745 C 528 775, 490 790, 460 810"
          fill="none"
          stroke="url(#snakeGrad2)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <ellipse cx="500" cy="486" rx="11" ry="7" fill="#c8a020" transform="rotate(15, 500, 486)" />
        <circle cx="495" cy="483" r="2" fill="#1a0a00" />
        <circle cx="505" cy="482" r="2" fill="#1a0a00" />
        <path
          d="M 500 490 L 495 498 M 500 490 L 507 497"
          stroke="#cc2200"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>

      <g filter="url(#softglow)" opacity="0.9">
        <line
          x1="110"
          y1="800"
          x2="240"
          y2="620"
          stroke="url(#arrowGrad)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <polygon points="240,620 228,638 252,636" fill="#e8c84a" />
        <path
          d="M 110 800 L 98 812 M 110 800 L 122 812"
          stroke="#c9a020"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="148"
          y1="748"
          x2="158"
          y2="738"
          stroke="#f0d060"
          strokeWidth="2"
          opacity="0.7"
        />
        <line
          x1="178"
          y1="706"
          x2="188"
          y2="696"
          stroke="#f0d060"
          strokeWidth="2"
          opacity="0.7"
        />
      </g>

      <g filter="url(#softglow)" opacity="0.88">
        <line
          x1="290"
          y1="700"
          x2="390"
          y2="480"
          stroke="url(#arrowGrad)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <polygon points="390,480 378,500 402,496" fill="#e8c84a" />
        <path
          d="M 290 700 L 278 712 M 290 700 L 302 712"
          stroke="#c9a020"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="320"
          y1="654"
          x2="330"
          y2="634"
          stroke="#f0d060"
          strokeWidth="2"
          opacity="0.7"
        />
        <line
          x1="352"
          y1="600"
          x2="362"
          y2="580"
          stroke="#f0d060"
          strokeWidth="2"
          opacity="0.7"
        />
      </g>

      <g filter="url(#softglow)" opacity="0.92">
        <line
          x1="355"
          y1="600"
          x2="555"
          y2="150"
          stroke="url(#arrowGrad)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <polygon points="555,150 540,172 566,168" fill="#f0d060" />
        <path
          d="M 355 600 L 340 614 M 355 600 L 368 614"
          stroke="#c9a020"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="395"
          y1="525"
          x2="408"
          y2="500"
          stroke="#f0d060"
          strokeWidth="2"
          opacity="0.6"
        />
        <line
          x1="435"
          y1="450"
          x2="448"
          y2="425"
          stroke="#f0d060"
          strokeWidth="2"
          opacity="0.6"
        />
        <line
          x1="475"
          y1="375"
          x2="488"
          y2="350"
          stroke="#f0d060"
          strokeWidth="2"
          opacity="0.6"
        />
      </g>

      <g filter="url(#softglow)" opacity="0.85">
        <line
          x1="560"
          y1="490"
          x2="680"
          y2="310"
          stroke="url(#arrowGrad)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <polygon points="680,310 666,330 690,328" fill="#e8c84a" />
        <path
          d="M 560 490 L 546 502 M 560 490 L 573 502"
          stroke="#c9a020"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="600"
          y1="430"
          x2="612"
          y2="410"
          stroke="#f0d060"
          strokeWidth="2"
          opacity="0.7"
        />
      </g>

      <g filter="url(#softglow)" opacity="0.88">
        <line
          x1="160"
          y1="450"
          x2="530"
          y2="155"
          stroke="url(#arrowGrad)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <polygon points="530,155 514,175 538,174" fill="#f0d060" />
        <path
          d="M 160 450 L 145 462 M 160 450 L 173 462"
          stroke="#c9a020"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="270"
          y1="370"
          x2="282"
          y2="350"
          stroke="#f0d060"
          strokeWidth="2"
          opacity="0.6"
        />
        <line
          x1="370"
          y1="295"
          x2="382"
          y2="275"
          stroke="#f0d060"
          strokeWidth="2"
          opacity="0.6"
        />
      </g>

      <circle
        cx="450"
        cy="450"
        r="380"
        fill="none"
        stroke="#1e6a80"
        strokeWidth="1"
        opacity="0.15"
      />
      <circle
        cx="450"
        cy="450"
        r="280"
        fill="none"
        stroke="#1e6a80"
        strokeWidth="1"
        opacity="0.12"
      />
      <circle
        cx="450"
        cy="450"
        r="180"
        fill="none"
        stroke="#1e6a80"
        strokeWidth="1"
        opacity="0.1"
      />

      {STAR_DOTS.map(([cx, cy, opacity], i) => (
        <circle key={i} cx={cx} cy={cy} r="2" fill="#f0d060" opacity={opacity} />
      ))}
    </svg>
  );
}
