import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './lib/auth'
import { CartProvider } from './lib/cart'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { ShopPage } from './pages/ShopPage'
import { ProductPage } from './pages/ProductPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { AccountPage } from './pages/AccountPage'
import { AdminPage } from './pages/AdminPage'
import { ConversationalAiPage } from './pages/ConversationalAiPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { OrderConfirmationPage } from './pages/OrderConfirmationPage'
import { AccountingPage } from './pages/AccountingPage'
import { PrivacyPage } from './pages/PrivacyPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="butik" element={<ShopPage />} />
                <Route path="butik/:slug" element={<ProductPage />} />
                <Route path="korg" element={<CartPage />} />
                <Route path="kassa" element={<CheckoutPage />} />
                <Route path="order/:id" element={<OrderConfirmationPage />} />
                <Route path="conversational-ai" element={<ConversationalAiPage />} />
                <Route path="elevenagent" element={<Navigate to="/conversational-ai" replace />} />
                <Route path="logga-in" element={<LoginPage />} />
                <Route path="skapa-konto" element={<RegisterPage />} />
                <Route path="konto" element={<AccountPage />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="admin/bokforing" element={<AccountingPage />} />
                <Route path="integritet" element={<PrivacyPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
