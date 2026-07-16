import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type CartLine = {
  productVariantId: string
  productName: string
  variantLabel: string
  unitPriceInclVat: number
  quantity: number
  slug: string
}

type CartContextValue = {
  lines: CartLine[]
  itemCount: number
  totalInclVat: number
  addItem: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void
  setQuantity: (productVariantId: string, quantity: number) => void
  removeItem: (productVariantId: string) => void
  clear: () => void
}

const STORAGE_KEY = 'gg_cart'
const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as CartLine[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  }, [lines])

  const addItem = useCallback((line: Omit<CartLine, 'quantity'>, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productVariantId === line.productVariantId)
      if (existing) {
        return prev.map((l) =>
          l.productVariantId === line.productVariantId
            ? { ...l, quantity: l.quantity + quantity }
            : l,
        )
      }
      return [...prev, { ...line, quantity }]
    })
  }, [])

  const setQuantity = useCallback((productVariantId: string, quantity: number) => {
    setLines((prev) =>
      quantity < 1
        ? prev.filter((l) => l.productVariantId !== productVariantId)
        : prev.map((l) => (l.productVariantId === productVariantId ? { ...l, quantity } : l)),
    )
  }, [])

  const removeItem = useCallback((productVariantId: string) => {
    setLines((prev) => prev.filter((l) => l.productVariantId !== productVariantId))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const value = useMemo(() => {
    const itemCount = lines.reduce((s, l) => s + l.quantity, 0)
    const totalInclVat = lines.reduce((s, l) => s + l.unitPriceInclVat * l.quantity, 0)
    return { lines, itemCount, totalInclVat, addItem, setQuantity, removeItem, clear }
  }, [lines, addItem, setQuantity, removeItem, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart måste användas inom CartProvider')
  return ctx
}
