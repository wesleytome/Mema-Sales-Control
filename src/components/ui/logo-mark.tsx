import { cn } from "@/lib/utils"

interface LogoMarkProps {
  className?: string
}

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-5 w-5", className)}
      aria-hidden="true"
    >
      <path
        d="M4.5 17V7H7.1L11.95 13.8L16.85 7H19.5V17H17V10.7L13.1 16.05H10.8L7 10.75V17H4.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

