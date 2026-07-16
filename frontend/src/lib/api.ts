import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5080/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gg_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const url = String(error.config?.url ?? '')
      // Clear stale session on unauthorized (except login/register)
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('gg_access_token')
        localStorage.removeItem('gg_refresh_token')
        localStorage.removeItem('gg_user')
      }
    }
    return Promise.reject(error)
  },
)

export default api

export type User = {
  id: string
  email: string
  fullName: string
  phone?: string | null
  roles: string[]
  twoFactorEnabled?: boolean
}

export type AuthResponse = {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string
  user: User
}

export type LoginResult = {
  requiresTwoFactor: boolean
  pendingUserId?: string | null
  twoFactorToken?: string | null
  auth?: AuthResponse | null
}

export type ProductListItem = {
  id: string
  slug: string
  nameSv: string
  shortDescriptionSv: string
  baseImageUrl?: string | null
  dietaryTags: string[]
  fromPriceSekInclVat: number
  inStock: boolean
}

export type ProductVariant = {
  id: string
  flavorNameSv: string
  size: string
  format: string
  sku: string
  priceSekInclVat: number
  vatRate: number
  stockQty: number
  allergens: string[]
  ingredientsSv: string
  imageUrl?: string | null
  isActive: boolean
}

export type ProductDetail = {
  id: string
  slug: string
  nameSv: string
  descriptionSv: string
  shortDescriptionSv: string
  baseImageUrl?: string | null
  dietaryTags: string[]
  variants: ProductVariant[]
}

export type PagedResult<T> = {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
}
