export function serviceError(error: unknown, service = "Request") {
  const providerError = error as { status?: number; statusCode?: number } | null;
  const status = Number(providerError?.status ?? providerError?.statusCode);
  if (status === 429) return `${service} rate limit reached. Please wait a moment and retry.`;
  if (status === 401 || status === 403) return `${service} rejected the server API key.`;
  if (status >= 500) return `${service} is temporarily unavailable.`;
  return error instanceof Error ? error.message.slice(0, 220) : `${service} failed.`;
}
