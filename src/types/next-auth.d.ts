import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    role?: {
      id: string
      name: string
      displayName: string
      color: string
    } | null
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string
      role?: {
        id: string
        name: string
        displayName: string
        color: string
      } | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role?: {
      id: string
      name: string
      displayName: string
      color: string
    } | null
  }
}
