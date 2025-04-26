// Calculate expiration date based on employment type
export function calculateExpirationDate(employmentType) {
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000

  switch (employmentType) {
    case "full-time":
      return now + 90 * oneDay // 90 days for full-time employees
    case "part-time":
      return now + 60 * oneDay // 60 days for part-time employees
    case "temporary":
      return now + 30 * oneDay // 30 days for temporary employees
    default:
      return now + 30 * oneDay // Default to 30 days
  }
}
