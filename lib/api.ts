const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:3010/api/v1'

interface ApiErrorBody {
  detail?: string
}

export async function apiRequest<TResponse>(
  path: string,
  options: RequestInit = {},
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as ApiErrorBody | null
    const message = errorBody?.detail ?? 'No se pudo completar la operación'
    throw new Error(message)
  }

  return response.json() as Promise<TResponse>
}
