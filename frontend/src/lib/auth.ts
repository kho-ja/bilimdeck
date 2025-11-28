import { API_BASE_URL } from "./api"

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  password2: string
  first_name?: string
  last_name?: string
}

const TOKEN_KEY = "bilimdeck-tokens"

export function getStoredTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(TOKEN_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function storeTokens(tokens: AuthTokens) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function login(credentials: LoginCredentials): Promise<AuthTokens> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || "Login failed")
  }

  const tokens = await response.json()
  storeTokens(tokens)
  return tokens
}

export async function register(data: RegisterData): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const message = Object.values(error).flat().join(", ") || "Registration failed"
    throw new Error(message)
  }

  return response.json()
}

export async function logout(refreshToken?: string) {
  const tokens = getStoredTokens()
  if (tokens?.access) {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.access}`,
        },
        body: JSON.stringify({ refresh: refreshToken || tokens.refresh }),
      })
    } catch {
      // Ignore errors during logout
    }
  }
  clearTokens()
}

export async function refreshAccessToken(): Promise<string | null> {
  const tokens = getStoredTokens()
  if (!tokens?.refresh) return null

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: tokens.refresh }),
    })

    if (!response.ok) {
      clearTokens()
      return null
    }

    const data = await response.json()
    storeTokens({ ...tokens, access: data.access })
    return data.access
  } catch {
    clearTokens()
    return null
  }
}

export async function fetchCurrentUser(): Promise<User | null> {
  const tokens = getStoredTokens()
  if (!tokens?.access) return null

  let response = await fetch(`${API_BASE_URL}/api/auth/me/`, {
    headers: {
      Authorization: `Bearer ${tokens.access}`,
    },
  })

  if (response.status === 401) {
    const newToken = await refreshAccessToken()
    if (!newToken) return null

    response = await fetch(`${API_BASE_URL}/api/auth/me/`, {
      headers: {
        Authorization: `Bearer ${newToken}`,
      },
    })
  }

  if (!response.ok) return null
  return response.json()
}
