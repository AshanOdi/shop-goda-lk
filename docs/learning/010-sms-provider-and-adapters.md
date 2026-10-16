# 010 — SMS provider: interfaces, adapters and fakes

**Milestone:** M1 · **Branch:** m1/sms-provider · **Commits:**
`feat(lib): add isE164Mobile and maskPhone helpers` ·
`feat(sms): add sms provider interface` ·
`feat(sms): add console sms provider for development` ·
`feat(sms): add text.lk sms provider` ·
`feat(sms): choose sms provider from environment` ·
`docs: record sms provider decisions` ·
`docs: update progress for m1 task 3` ·
`docs(learning): explain sms provider and adapters`

## What we built

A way for Ape Kade to send SMS, which login OTP codes (task 4) need, without the rest of the code knowing which SMS company is used. In development the message is printed in the terminal; when a Text.lk API key is set it really goes out through Text.lk.

## Why it matters

Sellers log in with a code sent to their phone. During development we don't want to pay for SMS or need an account, and tests must never send real messages. Later we might switch SMS company, or add WhatsApp. Because everything depends on one small interface, those changes touch one file.

## New concepts

### Interface (TypeScript)

An interface is a contract: "anything that calls itself an SmsProvider has a `name` and a `send()` method with this shape".

```ts
export interface SmsProvider {
  readonly name: string;
  send(message: SmsMessage): Promise<SmsResult>;
}
```

The interface contains no code. Classes **implement** it: `class TextLkSmsProvider implements SmsProvider`. TypeScript checks the class really has everything the contract requires.

### Adapter pattern

Text.lk has its own URL, headers and field names (`recipient`, `sender_id`, `type: "plain"`). The **adapter** (`textlk.ts`) translates our simple `send({ to, text })` into Text.lk's format, and Text.lk's reply back into our `SmsResult`. Like a travel plug adapter: the device (our app) doesn't change; only the adapter knows the wall socket (Text.lk).

```
OTP code ──► SmsProvider.send({ to, text })
                 ├── ConsoleSmsProvider  → prints in the terminal (dev, tests)
                 └── TextLkSmsProvider   → HTTPS POST to app.text.lk (production)
```

### Dependency inversion

High-level code (login) depends on the **abstraction** (`SmsProvider`), not on a concrete company (Text.lk). `getSmsProvider()` decides which one to hand out based on the environment. That's the "D" in the SOLID principles.

### Discriminated union for results

```ts
export type SmsResult = { ok: true; providerId?: string } | { ok: false; error: string };
```

`|` means "one of these shapes". The `ok` field tells them apart (it's the **discriminant**). After `if (result.ok)`, TypeScript knows `providerId` exists; in the `else` branch it knows `error` exists. We return failures instead of throwing because "no SMS credit" or "network down" are expected situations the caller must handle, not programmer bugs.

### Dependency injection (for tests)

```ts
constructor(private readonly options: TextLkOptions) {
  this.fetch = options.fetch ?? globalThis.fetch;
}
```

The adapter accepts a `fetch` function from outside. In production it uses the real `fetch`; in tests we pass a fake one that returns whatever response we want ("success", "insufficient balance", a broken HTML page, a network error). We can test every situation without the internet or an account. Passing what an object needs from outside, rather than it creating it itself, is called **dependency injection**.

`private readonly options` in the constructor's parameter list is a TypeScript shorthand: it declares and assigns a class field in one go.

### Mocks and spies (Vitest)

- `vi.fn<typeof fetch>(async () => ...)` creates a **mock function** that records every call (`fetchFn.mock.calls`), so the test can check the URL, headers and body we sent.
- `vi.spyOn(console, "info").mockImplementation(() => {})` **spies** on `console.info`: it records what was printed (and keeps test output quiet). `vi.restoreAllMocks()` puts the real function back.

### Timeouts with `AbortSignal.timeout`

`signal: AbortSignal.timeout(10_000)` cancels the request if Text.lk hasn't answered in 10 seconds, so a slow gateway can't hang a seller's login forever.

### Pure function + cached instance

`createSmsProvider(config)` only looks at its argument, so tests can try every config without touching `process.env`. `getSmsProvider()` calls it once with the real `env` and caches the result (`provider ??= ...`, meaning "assign only if still undefined").

### Masking personal data in logs

`maskPhone("+94771234567")` → `+9477•••4567`. Even the development console provider masks numbers, so the habit holds everywhere (CLAUDE.md: never log buyer phone numbers).

## How it works

Login (task 4) calls `getSmsProvider().send({ to: "+94771234567", text: "Your Ape Kade code is 123456" })` → no `TEXTLK_API_KEY` locally → `ConsoleSmsProvider` prints `[sms:console] to +9477•••4567: Your Ape Kade code is 123456` → returns `{ ok: true }`. On Vercel with the key set → `TextLkSmsProvider` checks the number is E.164 → POSTs JSON to Text.lk with the Bearer token → reads `{ status: "success", uid }` → `{ ok: true, providerId: uid }`, or `{ ok: false, error }` for any failure.

## Files changed

| File | What it does |
| --- | --- |
| `src/lib/phone.ts` | `isE164Mobile()`, `maskPhone()` |
| `src/server/providers/sms/types.ts` | `SmsProvider` interface, `SmsMessage`, `SmsResult` |
| `src/server/providers/sms/console.ts` | Development/test provider |
| `src/server/providers/sms/textlk.ts` | Text.lk adapter |
| `src/server/providers/sms/index.ts` | `createSmsProvider()`, `getSmsProvider()` |
| `tests/unit/providers/sms-*.test.ts` | Console, Text.lk (fake fetch) and selection tests |

## Try it yourself

```bash
pnpm test tests/unit/providers
```

Then in `textlk.ts` change `type: "plain"` to `type: "text"` and run the tests again: the "sends the request Text.lk expects" test fails and shows exactly which field differs. Undo with `git restore src/server/providers/sms/textlk.ts`.

## Check your understanding

1. How would you add a "Dialog SMS" provider later? Which files change?
2. Why does `send()` return `{ ok: false }` instead of throwing?
3. How do the Text.lk tests run without internet?

<details>
<summary>Answers</summary>

1. Add `dialog.ts` with a class implementing `SmsProvider`, plus tests, and update `createSmsProvider()`. Login code doesn't change.
2. Failures like no credit or a network error are normal events the caller must handle; the union type forces the caller to check `ok`.
3. A fake `fetch` is injected through the constructor, returning prepared responses.

</details>

## Words to know

- **Interface**: a contract describing a shape, with no code.
- **Adapter**: code that translates between our interface and an outside service.
- **Dependency inversion / injection**: depend on abstractions / pass dependencies in from outside.
- **Discriminated union**: a union of shapes told apart by one field (`ok`).
- **Mock / spy**: a fake function that records calls / a wrapper that records calls to a real one.
- **Timeout**: giving up after a fixed time.
