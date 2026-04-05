interface AvatarProps {
  name: string
  color?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
}

export function Avatar({ name, color = "#4F46E5", size = "md", className = "" }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-white ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  )
}
