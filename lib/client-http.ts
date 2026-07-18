type ErrorPayload = { error?: unknown };

function errorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as ErrorPayload).error === "string"
  ) {
    return (payload as { error: string }).error;
  }
  return fallback;
}

/**
 * Centralizes JSON decoding and HTTP error handling for browser requests.
 * Callers remain responsible for validating the domain fields they require.
 */
export async function readJsonResponse<T>(
  response: Response,
  fallbackError: string,
): Promise<T> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(
      response.ok
        ? "The server returned an invalid response."
        : fallbackError,
    );
  }
  if (!response.ok) throw new Error(errorMessage(payload, fallbackError));
  return payload as T;
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  fallbackError: string,
): Promise<T> {
  return readJsonResponse<T>(await fetch(input, init), fallbackError);
}
