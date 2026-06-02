import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateDemoToken, isTokenExpired } from '../lib/auth'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  avatar: string
}

const DEMO_USER: User = {
  id: 'demo_user',
  name: 'Demo User',
  email: 'demo@obsadmin.io',
  role: 'admin',
  avatar: 'DU',
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginDemo: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        await new Promise((resolve) => setTimeout(resolve, 800))
        if (email === 'demo@obsadmin.io' && password === 'ObsAdmin@demo') {
          const token = generateDemoToken()
          set({ user: DEMO_USER, token, isAuthenticated: true })
          document.cookie = `obsadmin_token=${token}; max-age=86400; path=/; SameSite=Strict`
          return { success: true }
        }
        return { success: false, error: 'Invalid email or password' }
      },

      loginDemo: () => {
        const token = generateDemoToken()
        set({ user: DEMO_USER, token, isAuthenticated: true })
        document.cookie = `obsadmin_token=${token}; max-age=86400; path=/; SameSite=Strict`
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        document.cookie = 'obsadmin_token=; max-age=0; path=/;'
      },
    }),
    {
      name: 'obsadmin-auth',
      onRehydrateStorage: () => (state) => {
        if (state?.token && isTokenExpired(state.token)) {
          state.user = null
          state.token = null
          state.isAuthenticated = false
        }
      },
    }
  )
)
