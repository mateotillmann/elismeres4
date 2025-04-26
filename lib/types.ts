export type Employee = {
  id: string
  name: string
  position: string
  employmentType: "full-time" | "part-time" | "student"
  createdAt: number
  isLocked?: boolean
  lockReason?: string
}

export type RewardCard = {
  id: string
  employeeId: string
  cardType: "basic" | "gold" | "platinum"
  points: number
  issuedAt: number
  expiresAt: number
  isRedeemed: boolean
  redeemedAt?: number
  approvedBy?: string
  approverName?: string
  approverRole?: string
  qrCode: string
}

export type ManagerCard = {
  id: string
  name: string
  position: string
  role: "Tréner" | "Koordinátor" | "Műszakvezető"
  createdAt: number
  qrCode: string
  permissions?: Permission[]
  password?: string
}

export type Permission =
  | "manage_employees"
  | "issue_rewards"
  | "redeem_rewards"
  | "manage_managers"
  // Keep these for backward compatibility but they're now consolidated into "manage_managers"
  | "add_delete_managers"
  | "edit_manager_privileges"
  | "change_manager_passwords"

export type RewardType = {
  id: string
  name: string
  description: string
  points: number
}

export const REWARD_TYPES: RewardType[] = [
  { id: "staff-meal", name: "Személyzeti étkezés", description: "Plusz egy személyzeti fogyasztás", points: 1 },
  {
    id: "bacon-jalapeno",
    name: "Bacon/Jalapeno",
    description: "Plusz bacon vagy jalapeno bármelyik szendvicsbe",
    points: 1,
  },
  { id: "nuggets-bonus", name: "Nuggets bónusz", description: "6 db helyett 9 db", points: 1 },
  { id: "happy-meal-toy", name: "Happy Meal játék", description: "Happy Meal játék", points: 1 },
  { id: "sauce", name: "Szósz", description: "Egy tálkás szósz", points: 1 },
  { id: "small-fries", name: "Kis burgonya", description: "Egy kis burgonya vagy pite", points: 1 },
  { id: "coffee-tea", name: "Kávé/Tea", description: "Egy kávé vagy tea", points: 1 },
  { id: "mcfreeze", name: "McFreeze", description: "Egy McFreeze vagy kis shake", points: 1 },
  { id: "double-cheese", name: "Duplasajt", description: "Duplasajtburger sima sajtburger helyett", points: 2 },
]
