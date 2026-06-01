/**
 * SIMKlinik — PHP Bridge Helper
 * All database operations go through the remote PHP bridge API.
 */

const BRIDGE_URL = process.env.BRIDGE_URL!;
const BRIDGE_SECRET = process.env.BRIDGE_SECRET!;

export interface BridgeResponse<T = unknown> {
  data?: T;
  error?: string;
  success?: boolean;
  id?: number;
  total?: number;
  per_page?: number;
  current_page?: number;
  last_page?: number;
}

const BRIDGE_RETRIES = 3;
const BRIDGE_RETRY_DELAY_MS = 300;

export async function fetchWithRetry(url: string, options: RequestInit, retries = BRIDGE_RETRIES): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err: unknown) {
      const isLast = attempt === retries;
      const isSocket = err instanceof Error && 'code' in err && 
        (err as NodeJS.ErrnoException).code === 'UND_ERR_SOCKET';

      console.warn(`[Bridge] Attempt ${attempt}/${retries} failed:`, (err as Error).message);

      if (isLast || !isSocket) throw err;

      await new Promise(r => setTimeout(r, BRIDGE_RETRY_DELAY_MS * attempt)); // 300ms, 600ms
    }
  }
  throw new Error('Unreachable');
}

export async function callBridge<T = unknown>(
  action: string,
  data: Record<string, unknown> = {}
): Promise<T> {
  const startTime = Date.now();
  const payload = JSON.stringify({ action, data });
  console.log(`[Bridge] → ${action}`, payload.substring(0, 300));

  try {
    const res = await fetchWithRetry(BRIDGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bridge-Secret": BRIDGE_SECRET,
      },
      body: payload,
    });

    const duration = Date.now() - startTime;

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error(
        `[Bridge] ← ${action} FAILED (${res.status}) in ${duration}ms:`,
        errorText
      );
      throw new Error(`Bridge error: ${res.status} - ${errorText}`);
    }

    const result = await res.json();
    console.log(`[Bridge] ← ${action} OK in ${duration}ms`);
    return result as T;
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    if (error instanceof Error && !error.message.startsWith("Bridge error:")) {
      console.error(
        `[Bridge] ← ${action} NETWORK ERROR in ${duration}ms:`,
        error.message
      );
    }
    throw error;
  }
}
