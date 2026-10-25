import { AxiosError } from 'axios'

interface ApiErrorBody {
  message?: string
  violations?: { field: string; message: string }[]
}

/** Pull a human-friendly message out of an API/Axios error. */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined
    if (body?.violations?.length) {
      return body.violations.map((v) => `${v.field}: ${v.message}`).join(', ')
    }
    if (body?.message) return body.message
    if (!error.response) {
      return 'Unable to reach the server. Check that the application API is running and try again.'
    }
    if (error.response.status === 401) return 'Your session has expired. Sign in again.'
    if (error.response.status === 403) return 'You do not have permission to perform this action.'
    if (error.response.status === 409) return 'This request conflicts with existing data.'
    if (error.response.status >= 500) return 'The server could not complete the request. Try again shortly.'
    return fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}
