// Client-safe helper. Checks res.ok before treating the body as success data.
export async function readApiResponse<T>(res: Response): Promise<T> {
  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!res.ok) {
    const message = data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
      ? (data as { error: string }).error
      : 'Something went wrong. Please try again.'
    throw new Error(message)
  }

  return data as T
}
