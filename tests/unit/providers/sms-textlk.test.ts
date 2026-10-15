import { describe, expect, it, vi } from "vitest";
import { TEXTLK_SEND_URL, TextLkSmsProvider } from "@/server/providers/sms/textlk";

/** A fake fetch that answers with the given status and body, and records the call. */
function fakeFetch(status: number, body: unknown) {
  return vi.fn<typeof fetch>(async () =>
    typeof body === "string" ? new Response(body, { status }) : Response.json(body, { status }),
  );
}

const message = { to: "+94771234567", text: "Your Ape Kade code is 123456" };

describe("TextLkSmsProvider", () => {
  it("sends the request Text.lk expects", async () => {
    const fetchFn = fakeFetch(200, { status: "success", uid: "abc123" });
    const sms = new TextLkSmsProvider({ apiKey: "key-1", senderId: "ApeKade", fetch: fetchFn });

    await sms.send(message);

    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe(TEXTLK_SEND_URL);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer key-1",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      recipient: "94771234567",
      sender_id: "ApeKade",
      type: "plain",
      message: "Your Ape Kade code is 123456",
    });
  });

  it("returns the message id on success", async () => {
    const sms = new TextLkSmsProvider({
      apiKey: "k",
      senderId: "ApeKade",
      fetch: fakeFetch(200, { status: "success", data: { uid: "uid-9" } }),
    });
    expect(await sms.send(message)).toEqual({ ok: true, providerId: "uid-9" });
  });

  it("reports Text.lk's error message", async () => {
    const sms = new TextLkSmsProvider({
      apiKey: "k",
      senderId: "ApeKade",
      fetch: fakeFetch(200, { status: "error", message: "Insufficient balance" }),
    });
    expect(await sms.send(message)).toEqual({
      ok: false,
      error: "Text.lk error (HTTP 200): Insufficient balance",
    });
  });

  it("handles a server error that isn't JSON", async () => {
    const sms = new TextLkSmsProvider({
      apiKey: "k",
      senderId: "ApeKade",
      fetch: fakeFetch(502, "<html>Bad gateway</html>"),
    });
    expect(await sms.send(message)).toEqual({
      ok: false,
      error: "Text.lk returned HTTP 502 without JSON",
    });
  });

  it("handles a network failure without throwing", async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => {
      throw new TypeError("fetch failed");
    });
    const sms = new TextLkSmsProvider({ apiKey: "k", senderId: "ApeKade", fetch: fetchFn });

    expect(await sms.send(message)).toEqual({
      ok: false,
      error: "Text.lk request failed: TypeError",
    });
  });

  it("refuses numbers that aren't normalised, without calling Text.lk", async () => {
    const fetchFn = fakeFetch(200, { status: "success" });
    const sms = new TextLkSmsProvider({ apiKey: "k", senderId: "ApeKade", fetch: fetchFn });

    const result = await sms.send({ to: "0771234567", text: "hi" });

    expect(result.ok).toBe(false);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
