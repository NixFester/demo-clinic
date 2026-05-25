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

export async function callBridge<T = unknown>(
  action: string,
  data: Record<string, unknown> = {}
): Promise<T> {
  const startTime = Date.now();
  const payload = JSON.stringify({ action, data });
  console.log(`[Bridge] → ${action}`, payload.substring(0, 300));

  try {
    const res = await fetch(BRIDGE_URL, {
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
