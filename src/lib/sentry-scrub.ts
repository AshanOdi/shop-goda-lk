/**
 * Removes buyer personal data from Sentry events before they leave the app.
 * CLAUDE.md: never log buyer phone numbers, addresses or emails; tag events with
 * shopId/orderId only. This is a last line of defence on top of `dataCollection`.
 */
import type { ErrorEvent } from "@sentry/nextjs";

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
// Sri Lankan mobiles in any format we accept (SPEC 5.2): 07X..., 7X..., +947X..., 947X...
const SL_MOBILE = /(?<!\d)(?:\+94|94|0)?7\d(?:[\s-]?\d){7}(?!\d)/g;

export function redactPII(text: string): string {
  return text.replace(EMAIL, "[email]").replace(SL_MOBILE, "[phone]");
}

export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.message) event.message = redactPII(event.message);

  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = redactPII(exception.value);
  }

  for (const breadcrumb of event.breadcrumbs ?? []) {
    if (breadcrumb.message) breadcrumb.message = redactPII(breadcrumb.message);
  }

  // Never send who the person is or what they submitted (checkout forms hold
  // name, phone and address). Request URL and method are kept for debugging.
  delete event.user;
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
  }

  return event;
}
