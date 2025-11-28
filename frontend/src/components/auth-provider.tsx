"use client"

import * as React from "react"
import {
  User,
  LoginCredentials,
  RegisterData,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  fetchCurrentUser,
  getStoredTokens,
} from "@/lib/auth"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const refreshUser = React.useCallback(async () => {
    try {
      const currentUser = await fetchCurrentUser()
      setUser(currentUser)
    } catch {
      setUser(null)
    }
  }, [])

  React.useEffect(() => {
    const initAuth = async () => {
      const tokens = getStoredTokens()
      if (tokens) {
        await refreshUser()
      }
      setIsLoading(false)
    }
    initAuth()
  }, [refreshUser])

  const login = React.useCallback(
    async (credentials: LoginCredentials) => {
      await apiLogin(credentials)
      await refreshUser()
    },
    [refreshUser]
  )

  const register = React.useCallback(async (data: RegisterData) => {
    await apiRegister(data)
  }, [])

  const logout = React.useCallback(async () => {
    await apiLogout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
