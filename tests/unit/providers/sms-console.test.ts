import { afterEach, describe, expect, it, vi } from "vitest";
import { ConsoleSmsProvider } from "@/server/providers/sms/console";

describe("ConsoleSmsProvider", () => {
  afterEach(() => vi.restoreAllMocks());

  it("keeps sent messages so tests can inspect them", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const sms = new ConsoleSmsProvider();

    const result = await sms.send({ to: "+94771234567", text: "Your code is 123456" });

    expect(result).toEqual({ ok: true, providerId: "console-1" });
    expect(sms.sent).toEqual([{ to: "+94771234567", text: "Your code is 123456" }]);
  });

  it("prints the message with the phone number masked", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    await new ConsoleSmsProvider().send({ to: "+94771234567", text: "Your code is 123456" });

    const printed = String(info.mock.calls[0]?.[0]);
    expect(printed).toContain("Your code is 123456");
    expect(printed).toContain("+9477•••4567");
    expect(printed).not.toContain("+94771234567");
  });
});
