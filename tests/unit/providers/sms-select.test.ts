import { afterEach, describe, expect, it, vi } from "vitest";
import { createSmsProvider } from "@/server/providers/sms";

describe("createSmsProvider", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses Text.lk when an API key is set", () => {
    const sms = createSmsProvider({
      TEXTLK_API_KEY: "key",
      TEXTLK_SENDER_ID: "ApeKade",
      NODE_ENV: "production",
    });
    expect(sms.name).toBe("textlk");
  });

  it("prints messages in development when there is no key", () => {
    const sms = createSmsProvider({ TEXTLK_SENDER_ID: "ApeKade", NODE_ENV: "development" });
    expect(sms.name).toBe("console");
  });

  it("warns loudly in production when there is no key", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const sms = createSmsProvider({ TEXTLK_SENDER_ID: "ApeKade", NODE_ENV: "production" });

    expect(sms.name).toBe("console");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("TEXTLK_API_KEY is not set"));
  });
});
