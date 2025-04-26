import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function calculateExpirationDate(employmentType) {
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000

  switch (employmentType) {
    case "full-time":
      return now + 7 * oneDay // 1 week for full-time employees
    case "part-time":
    case "student":
      return now + 14 * oneDay // 2 weeks for part-time and student employees
    default:
      return now + 7 * oneDay
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
