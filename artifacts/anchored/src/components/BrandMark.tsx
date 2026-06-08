import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 180 180"
      role="img"
      aria-label="DoneMark"
      className={cn("h-10 w-10", className)}
    >
      <defs>
        <linearGradient id="brandmark-bg" x1="18" y1="14" x2="162" y2="166" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF3C4" />
          <stop offset="0.48" stopColor="#EAFBF7" />
          <stop offset="1" stopColor="#FFD1BF" />
        </linearGradient>
        <linearGradient id="brandmark-fingerprint" x1="46" y1="34" x2="135" y2="144" gradientUnits="userSpaceOnUse">
          <stop stopColor="#55E0B9" />
          <stop offset="0.45" stopColor="#25BEEA" />
          <stop offset="1" stopColor="#FF755E" />
        </linearGradient>
      </defs>
      <rect width="180" height="180" rx="40" fill="url(#brandmark-bg)" />
      <path d="M56 57C66 42 87 35 105 41C119 46 129 57 133 70" stroke="url(#brandmark-fingerprint)" strokeWidth="10" strokeLinecap="round" />
      <path d="M45 76C57 52 86 44 107 54C122 61 132 76 133 92" stroke="url(#brandmark-fingerprint)" strokeWidth="10" strokeLinecap="round" />
      <path d="M42 96C50 72 75 58 98 65C115 70 126 85 128 104" stroke="url(#brandmark-fingerprint)" strokeWidth="10" strokeLinecap="round" />
      <path d="M51 116C54 91 76 74 98 80C113 84 122 98 121 115" stroke="url(#brandmark-fingerprint)" strokeWidth="10" strokeLinecap="round" />
      <path d="M71 134C67 113 78 94 96 93C109 92 116 104 112 119" stroke="url(#brandmark-fingerprint)" strokeWidth="10" strokeLinecap="round" />
      <path d="M88 121C90 112 95 106 101 107" stroke="url(#brandmark-fingerprint)" strokeWidth="10" strokeLinecap="round" />
      <path d="M58 91L80 113L126 68" stroke="white" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
