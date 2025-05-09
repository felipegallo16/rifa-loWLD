'use client';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "h-8" }: LogoProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-full"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 4h16a2 2 0 0 1 2 2v4a2 2 0 1 0 0 4v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 1 0 0-4V6a2 2 0 0 1 2-2z" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="9" x2="12" y2="15" />
      </svg>
      <span className="font-bold text-2xl mt-2">Rifa-lo</span>
    </div>
  );
} 