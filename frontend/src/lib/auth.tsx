import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import api, { type AuthResponse, type LoginResult, type User } from './api'

export type TwoFactorPending = {
  pendingUserId: string
  twoFactorToken: string
}

type AuthContextValue = {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  /** Returns pending 2FA challenge if required, otherwise null after successful login */
  login: (email: string, password: string) => Promise<TwoFactorPending | null>
  completeTwoFactorLogin: (pending: TwoFactorPending, code: string) => Promise<void>
  register: (payload: {
    email: string
    password: string
    fullName: string
    phone?: string
    marketingConsent: boolean
  }) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function persistTokens(data: AuthResponse) {
  localStorage.setItem('gg_access_token', data.accessToken)
  localStorage.setItem('gg_refresh_token', data.refreshToken)
  localStorage.setItem('gg_user', JSON.stringify(data.user))
}

function clearTokens() {
  localStorage.removeItem('gg_access_token')
  localStorage.removeItem('gg_refresh_token')
  localStorage.removeItem('gg_user')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem('gg_user')
    const token = localStorage.getItem('gg_access_token')
    if (raw && token) {
      try {
        setUser(JSON.parse(raw) as User)
      } catch {
        clearTokens()
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<LoginResult | AuthResponse>('/auth/login', { email, password })

    // New shape: { requiresTwoFactor, auth?, pendingUserId?, twoFactorToken? }
    const asResult = data as LoginResult
    if (asResult.requiresTwoFactor && asResult.pendingUserId && asResult.twoFactorToken) {
      return {
        pendingUserId: asResult.pendingUserId,
        twoFactorToken: asResult.twoFactorToken,
      }
    }

    // Nested auth (new API) OR flat AuthResponse (legacy API still running)
    const auth: AuthResponse | undefined =
      asResult.auth ??
      ('accessToken' in data && (data as AuthResponse).accessToken
        ? (data as AuthResponse)
        : undefined)

    if (!auth?.accessToken || !auth.user) {
      throw new Error('Oväntat svar från inloggning')
    }
    persistTokens(auth)
    setUser(auth.user)
    return null
  }, [])

  const completeTwoFactorLogin = useCallback(async (pending: TwoFactorPending, code: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login/2fa', {
      pendingUserId: pending.pendingUserId,
      twoFactorToken: pending.twoFactorToken,
      code,
    })
    persistTokens(data)
    setUser(data.user)
  }, [])

  const register = useCallback(
    async (payload: {
      email: string
      password: string
      fullName: string
      phone?: string
      marketingConsent: boolean
    }) => {
      const { data } = await api.post<AuthResponse>('/auth/register', {
        ...payload,
        acceptTerms: true,
      })
      persistTokens(data)
      setUser(data.user)
    },
    [],
  )

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('gg_refresh_token')
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken })
      }
    } catch {
      /* ignore network errors on logout */
    }
    clearTokens()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get<User>('/auth/me')
      localStorage.setItem('gg_user', JSON.stringify(data))
      setUser(data)
    } catch {
      /* keep cached user */
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAdmin: !!user?.roles?.includes('Admin'),
      isLoading,
      login,
      completeTwoFactorLogin,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, completeTwoFactorLogin, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth måste användas inom AuthProvider')
  return ctx
}
