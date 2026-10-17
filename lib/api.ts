import { StorageNotSetUp } from "./store";

/** Runs an admin write; a missing storage setup becomes a clear 503 instead of a crash. */
export async function guard(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (err) {
    if (err instanceof StorageNotSetUp) return Response.json({ error: "storage" }, { status: 503 });
    throw err;
  }
}
