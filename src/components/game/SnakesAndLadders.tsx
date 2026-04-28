"use client";

/**
 * SVG overlay for Snakes and Ladders (Arrows)
 * 
 * Grid: 9 columns × 8 rows
 * Cell positions calculated based on boustrophedon layout
 * 
 * Ladders (Arrows - Emerald Green): 10→23, 22→58, 27→41, 54→68
 * Snakes (Rose Red): 12→8, 44→9, 55→3, 61→13, 72→51
 */

// Calculate cell position in the grid (returns col, row from bottom-left)
function getCellGridPosition(cellId: number): { col: number; row: number } {
  const row = Math.ceil(cellId / 9); // 1-indexed row from bottom
  const posInRow = ((cellId - 1) % 9) + 1; // 1-9 position in row
  
  // Even rows go right-to-left, odd rows go left-to-right
  const col = row % 2 === 1 ? posInRow : 10 - posInRow;
  
  return { col, row };
}

// Convert grid position to SVG coordinates (viewBox 0-900)
function getCellCenter(cellId: number): { x: number; y: number } {
  const { col, row } = getCellGridPosition(cellId);
  const cellWidth = 100; // 900 / 9 = 100
  const cellHeight = 112.5; // 900 / 8 = 112.5
  
  // X: center of column (col is 1-9)
  const x = (col - 0.5) * cellWidth;
  
  // Y: from top of SVG (row 8 is at top, row 1 at bottom)
  const y = (8 - row + 0.5) * cellHeight;
  
  return { x, y };
}

type Connection = {
  from: number;
  to: number;
  type: "arrow" | "snake";
};

const ARROWS: Connection[] = [
  { from: 10, to: 23, type: "arrow" },
  { from: 22, to: 58, type: "arrow" },
  { from: 27, to: 41, type: "arrow" },
  { from: 54, to: 68, type: "arrow" },
];

const SNAKES: Connection[] = [
  { from: 12, to: 8, type: "snake" },
  { from: 44, to: 9, type: "snake" },
  { from: 55, to: 3, type: "snake" },
  { from: 61, to: 13, type: "snake" },
  { from: 72, to: 51, type: "snake" },
];

function Arrow({ from, to }: { from: number; to: number }) {
  const start = getCellCenter(from);
  const end = getCellCenter(to);
  
  // Calculate control points for a nice curve
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  
  // Offset the curve perpendicular to the line
  const len = Math.sqrt(dx * dx + dy * dy);
  const offsetX = (-dy / len) * 30;
  const offsetY = (dx / len) * 30;
  
  const ctrlX = midX + offsetX;
  const ctrlY = midY + offsetY;
  
  // Arrowhead calculation
  const angle = Math.atan2(end.y - ctrlY, end.x - ctrlX);
  const arrowLen = 16;
  const arrowAngle = Math.PI / 6;
  
  const arrow1X = end.x - arrowLen * Math.cos(angle - arrowAngle);
  const arrow1Y = end.y - arrowLen * Math.sin(angle - arrowAngle);
  const arrow2X = end.x - arrowLen * Math.cos(angle + arrowAngle);
  const arrow2Y = end.y - arrowLen * Math.sin(angle + arrowAngle);
  
  return (
    <g className="opacity-80 hover:opacity-100 transition-opacity duration-300">
      {/* Glow effect */}
      <path
        d={`M ${start.x} ${start.y} Q ${ctrlX} ${ctrlY} ${end.x} ${end.y}`}
        fill="none"
        stroke="#10b981"
        strokeWidth="12"
        strokeLinecap="round"
        opacity="0.3"
        filter="url(#arrowGlow)"
      />
      {/* Main arrow line */}
      <path
        d={`M ${start.x} ${start.y} Q ${ctrlX} ${ctrlY} ${end.x} ${end.y}`}
        fill="none"
        stroke="url(#arrowGradient)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="12 6"
        className="animate-[dash_2s_linear_infinite]"
      />
      {/* Arrow head */}
      <polygon
        points={`${end.x},${end.y} ${arrow1X},${arrow1Y} ${arrow2X},${arrow2Y}`}
        fill="#10b981"
      />
      {/* Start circle */}
      <circle cx={start.x} cy={start.y} r="8" fill="#10b981" opacity="0.9" />
      <circle cx={start.x} cy={start.y} r="4" fill="#d1fae5" />
    </g>
  );
}

function Snake({ from, to }: { from: number; to: number }) {
  const start = getCellCenter(from);
  const end = getCellCenter(to);
  
  // Create a wavy snake path
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const segments = Math.max(3, Math.floor(len / 80));
  
  let path = `M ${start.x} ${start.y}`;
  
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const prevT = (i - 1) / segments;
    
    const px = start.x + dx * prevT;
    const py = start.y + dy * prevT;
    const x = start.x + dx * t;
    const y = start.y + dy * t;
    
    // Perpendicular offset for waviness
    const perpX = -dy / len;
    const perpY = dx / len;
    const wave = (i % 2 === 0 ? 1 : -1) * 25;
    
    const ctrlX = (px + x) / 2 + perpX * wave;
    const ctrlY = (py + y) / 2 + perpY * wave;
    
    path += ` Q ${ctrlX} ${ctrlY} ${x} ${y}`;
  }
  
  // Snake head
  const headAngle = Math.atan2(end.y - start.y, end.x - start.x);
  
  return (
    <g className="opacity-80 hover:opacity-100 transition-opacity duration-300">
      {/* Glow effect */}
      <path
        d={path}
        fill="none"
        stroke="#f43f5e"
        strokeWidth="14"
        strokeLinecap="round"
        opacity="0.25"
        filter="url(#snakeGlow)"
      />
      {/* Snake body */}
      <path
        d={path}
        fill="none"
        stroke="url(#snakeGradient)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* Snake pattern */}
      <path
        d={path}
        fill="none"
        stroke="#fecdd3"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 12"
        opacity="0.6"
      />
      {/* Snake head */}
      <ellipse
        cx={start.x}
        cy={start.y}
        rx="12"
        ry="9"
        fill="#e11d48"
        transform={`rotate(${(headAngle * 180) / Math.PI + 90}, ${start.x}, ${start.y})`}
      />
      {/* Eyes */}
      <circle cx={start.x - 4} cy={start.y - 3} r="2.5" fill="#1f2937" />
      <circle cx={start.x + 4} cy={start.y - 3} r="2.5" fill="#1f2937" />
      {/* Tongue */}
      <path
        d={`M ${start.x} ${start.y + 8} L ${start.x - 4} ${start.y + 16} M ${start.x} ${start.y + 8} L ${start.x + 4} ${start.y + 16}`}
        stroke="#dc2626"
        strokeWidth="1.5"
        strokeLinecap="round"
        transform={`rotate(${(headAngle * 180) / Math.PI + 90}, ${start.x}, ${start.y})`}
      />
      {/* Tail end marker */}
      <circle cx={end.x} cy={end.y} r="6" fill="#f43f5e" opacity="0.8" />
    </g>
  );
}

export function SnakesAndLadders() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full z-20"
      viewBox="0 0 900 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        {/* Arrow gradient - Emerald Green */}
        <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        
        {/* Snake gradient - Rose Red */}
        <linearGradient id="snakeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="50%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
        
        {/* Glow filters */}
        <filter id="arrowGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <filter id="snakeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Render arrows (ladders) */}
      {ARROWS.map((arrow) => (
        <Arrow key={`arrow-${arrow.from}-${arrow.to}`} from={arrow.from} to={arrow.to} />
      ))}
      
      {/* Render snakes */}
      {SNAKES.map((snake) => (
        <Snake key={`snake-${snake.from}-${snake.to}`} from={snake.from} to={snake.to} />
      ))}
    </svg>
  );
}
