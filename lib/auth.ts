export type User = {
  id: string
  name: string
  email: string
}

// Hardcoded demo user — no real auth needed
export const DEMO_USER: User = {
  id: 'demo-user-1',
  name: 'Manish',
  email: 'demo@example.com',
}
