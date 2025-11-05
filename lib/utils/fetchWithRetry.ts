const DEFAULT_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_BACKOFF_MS = 400;

export type FetchRetryOptions = {
  attempts?: number;
  timeoutMs?: number;
  backoffMs?: number;
};

type RetryableError = Error & {
  cause?: {
    code?: string;
  } | null;
};

const shouldRetry = (error: unknown): error is RetryableError => {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message ?? "";
  const causeCode = (error as RetryableError).cause?.code ?? "";

  if (causeCode === "UND_ERR_CONNECT_TIMEOUT" || causeCode === "UND_ERR_SOCKET") {
    return true;
  }

  if (message.includes("fetch failed") || message.includes("network timeout")) {
    return true;
  }

  return false;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: FetchRetryOptions = {}
): Promise<Response> {
  const attempts = Math.max(1, options.attempts ?? DEFAULT_ATTEMPTS);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const backoffMs = options.backoffMs ?? DEFAULT_BACKOFF_MS;

  let attempt = 0;
  let lastError: unknown;

  while (attempt < attempts) {
    attempt += 1;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input, {
        ...(init ?? {}),
        signal: controller.signal,
        cache: (init?.cache ?? "no-store") as RequestCache
      });
      return response;
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !shouldRetry(error)) {
        throw error instanceof Error ? error : new Error(String(error));
      }
      await wait(backoffMs * attempt);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("fetchWithRetry failed");
}
