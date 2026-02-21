import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL ?? '/api'
const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('finbud_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export interface ProfilePayload {
  monthly_income?: number
  fixed_costs?: number
  risk_score?: number
}

export interface DebtPayload {
  name: string
  balance: number
  apr: number
  monthly_payment: number
}

export const authApi = {
  register: (email: string, password: string, display_name?: string) =>
    api.post('/v1/auth/register', { email, password, display_name }),
  login: (email: string, password: string) => {
    const form = new FormData()
    form.append('username', email)
    form.append('password', password)
    return api.post('/v1/auth/login', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const profileApi = {
  getMe: () => api.get('/v1/profile/me'),
  updateMe: (data: ProfilePayload) => api.put('/v1/profile/me', data),
  addDebt: (data: DebtPayload) => api.post('/v1/profile/debts', data),
  getPayoff: (debtId: number) => api.get(`/v1/profile/debts/${debtId}/payoff`),
  getAllocation: () => api.get('/v1/profile/allocation'),
  getProjection: (debtId: number) => api.get(`/v1/profile/projection/${debtId}`),
  getMentorNote: () => api.get<{ note: string }>('/v1/profile/mentor-note'),
}

export default api
