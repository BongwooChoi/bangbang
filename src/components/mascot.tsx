export function Mascot({ size = 64, happy = true }: { size?: number; happy?: boolean }) {
  return <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <path d="M24 27C20 18 29 12 32 6M49 24C44 15 54 11 55 3M72 27C67 18 78 13 77 6" stroke="#D5A783" strokeWidth="4" strokeLinecap="round"/>
    <path d="M17 48C15 36 26 29 35 32C38 20 55 23 59 30C71 23 84 33 82 48" fill="#FFFEF7" stroke="#4E5546" strokeWidth="3"/>
    <path d="M10 48H90C86 77 75 88 50 88C25 88 14 77 10 48Z" fill="#FFB5A3" stroke="#4E5546" strokeWidth="3" strokeLinejoin="round"/>
    <path d="M13 54H87" stroke="#FFF6DE" strokeWidth="3"/>
    <circle cx="36" cy="65" r="3" fill="#4E5546"/><circle cx="64" cy="65" r="3" fill="#4E5546"/>
    <ellipse cx="27" cy="71" rx="5" ry="3" fill="#F68C84"/><ellipse cx="73" cy="71" rx="5" ry="3" fill="#F68C84"/>
    {happy ? <path d="M44 72Q50 78 56 72" stroke="#4E5546" strokeWidth="3" strokeLinecap="round"/> : <path d="M45 75H55" stroke="#4E5546" strokeWidth="3" strokeLinecap="round"/>}
    <path d="M34 89H66" stroke="#4E5546" strokeWidth="4" strokeLinecap="round"/>
  </svg>;
}
