const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3010/api/v1'

interface ApiErrorBody {
  detail?: string
  [key: string]: unknown
}

let csrfToken: string | null = null

function getCookie(name: string) {
  if (typeof document === 'undefined') return null
  const value = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1]
  return value ? decodeURIComponent(value) : null
}

export async function ensureCsrfToken() {
  const cookieToken = getCookie('csrftoken')
  if (cookieToken) {
    csrfToken = cookieToken
    return csrfToken
  }

  if (csrfToken) return csrfToken

  const response = await fetch(`${API_BASE_URL}/auth/csrf/`, {
    credentials: 'include',
  })
  const data = await response.json().catch(() => null) as { csrfToken?: string } | null
  csrfToken = data?.csrfToken ?? getCookie('csrftoken')
  return csrfToken
}

export async function apiRequest<TResponse>(
  path: string,
  options: RequestInit = {},
): Promise<TResponse> {
  const method = (options.method ?? 'GET').toUpperCase()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = await ensureCsrfToken()
    if (token) headers['X-CSRFToken'] = token
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method,
    credentials: 'include',
    headers,
  })

  csrfToken = getCookie('csrftoken') ?? csrfToken

  if (!response.ok) {
    const responseText = await response.text().catch(() => '')
    let errorBody: ApiErrorBody | null = null
    try {
      errorBody = responseText ? JSON.parse(responseText) as ApiErrorBody : null
    } catch {
      errorBody = null
    }
    const fallbackMessage = responseText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    const message = errorBody?.detail ?? fallbackMessage ?? 'No se pudo completar la operación'
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return response.json() as Promise<TResponse>
}
