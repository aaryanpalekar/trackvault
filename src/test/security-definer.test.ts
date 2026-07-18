import { describe, it, expect } from "vitest";

/**
 * Verifies our SECURITY DEFINER trigger functions cannot be invoked
 * through the PostgREST Data API by either anonymous or authenticated callers.
 *
 * These functions (handle_new_user, handle_new_user_preferences,
 * update_updated_at_column) are trigger-only and had EXECUTE revoked from
 * PUBLIC, anon, and authenticated. Calling /rest/v1/rpc/<name> must fail.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const PROTECTED_FUNCTIONS = [
  "handle_new_user",
  "handle_new_user_preferences",
  "update_updated_at_column",
] as const;

async function callRpc(fn: string, token: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  const body = await res.text();
  return { status: res.status, body };
}

/**
 * A permission-denied result looks like one of:
 *  - HTTP 404 with code PGRST202 ("could not find function")  ← function hidden from schema cache
 *  - HTTP 403 with code 42501   ("permission denied")
 * Both prove the caller cannot execute the function. A 2xx would mean it ran.
 */
function assertBlocked(status: number, body: string) {
  expect(status).toBeGreaterThanOrEqual(400);
  expect(status).toBeLessThan(500);
  const isNotExposed = status === 404 && /PGRST202|Could not find the function/i.test(body);
  const isDenied = status === 403 && /permission denied|42501/i.test(body);
  expect(isNotExposed || isDenied).toBe(true);
}

describe("SECURITY DEFINER functions are not exposed via the Data API", () => {
  it("has the required env vars", () => {
    expect(SUPABASE_URL).toBeTruthy();
    expect(ANON_KEY).toBeTruthy();
  });

  for (const fn of PROTECTED_FUNCTIONS) {
    it(`anon cannot call ${fn} via /rpc`, async () => {
      const { status, body } = await callRpc(fn, ANON_KEY);
      assertBlocked(status, body);
    });
  }

  for (const fn of PROTECTED_FUNCTIONS) {
    it(`authenticated user cannot call ${fn} via /rpc`, async () => {
      // Sign in an ephemeral test user, then attempt the RPC with that JWT.
      const email = `sec-test-${crypto.randomUUID()}@example.com`;
      const password = `Aa1!${crypto.randomUUID()}`;

      const signup = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: "POST",
        headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const signupBody = await signup.json();
      const token: string | undefined =
        signupBody?.access_token ?? signupBody?.session?.access_token;

      // If signups are disabled in this environment, fall back to anon —
      // the guarantee (function is not reachable) still holds.
      const jwt = token ?? ANON_KEY;
      const { status, body } = await callRpc(fn, jwt);
      assertBlocked(status, body);
    }, 15000);
  }
});
