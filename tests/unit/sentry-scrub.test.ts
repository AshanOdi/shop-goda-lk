import type { ErrorEvent } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";
import { redactPII, scrubEvent } from "@/lib/sentry-scrub";

describe("redactPII", () => {
  it.each([
    ["Customer 0771234567 not found", "Customer [phone] not found"],
    ["Customer 077 123 4567 not found", "Customer [phone] not found"],
    ["Customer 077-123-4567 not found", "Customer [phone] not found"],
    ["Customer +94771234567 not found", "Customer [phone] not found"],
    ["Customer 94771234567 not found", "Customer [phone] not found"],
    ["Customer 771234567 not found", "Customer [phone] not found"],
    ["Email kasun@example.com bounced", "Email [email] bounced"],
    ["Order ORD-10001 total 505000", "Order ORD-10001 total 505000"],
    ["Shop 0112345678 landline", "Shop 0112345678 landline"],
  ])("redacts %j", (input, expected) => {
    expect(redactPII(input)).toBe(expected);
  });
});

describe("scrubEvent", () => {
  it("removes user, request body and cookies, and redacts messages", () => {
    const event = {
      type: undefined,
      message: "Failed for kasun@example.com",
      exception: { values: [{ type: "Error", value: "Phone 0771234567 is blocked" }] },
      breadcrumbs: [{ message: "Looked up +94771234567" }],
      user: { email: "kasun@example.com", ip_address: "1.2.3.4" },
      request: {
        url: "https://apekade.lk/store/abc/checkout",
        method: "POST",
        data: { phone: "0771234567", address: "24 Beach Road" },
        cookies: { session: "secret" },
      },
    } satisfies ErrorEvent;

    const scrubbed = scrubEvent(event);

    expect(scrubbed.message).toBe("Failed for [email]");
    expect(scrubbed.exception?.values?.[0]?.value).toBe("Phone [phone] is blocked");
    expect(scrubbed.breadcrumbs?.[0]?.message).toBe("Looked up [phone]");
    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.request?.data).toBeUndefined();
    expect(scrubbed.request?.cookies).toBeUndefined();
    // Kept for debugging:
    expect(scrubbed.request?.url).toBe("https://apekade.lk/store/abc/checkout");
    expect(scrubbed.request?.method).toBe("POST");
  });
});
