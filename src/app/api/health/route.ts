import { connection } from "next/server";
import { isDatabaseReachable } from "@/server/services/health";

// GET /api/health — for uptime monitoring (SPEC 15) and a quick local check.
export async function GET() {
  // Always run at request time. Without this, Next.js could try to prerender the
  // response during `next build`, when there may be no database to talk to.
  await connection();

  if (await isDatabaseReachable()) {
    return Response.json({ status: "ok" });
  }
  return Response.json({ status: "error", database: "unreachable" }, { status: 503 });
}
