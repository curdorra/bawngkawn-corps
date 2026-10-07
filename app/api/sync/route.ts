import { revalidatePath } from "next/cache";
import { syncPhotos } from "@/lib/sync";

// Runs a photo sync right away. Called by the daily Vercel cron job, or by hand:
//   https://<site>/api/sync?key=<CRON_SECRET>
// (Normally you never need this: visiting the site starts a sync every few minutes.)

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const key = new URL(req.url).searchParams.get("key");
  const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || (key !== secret && bearer !== secret)) return new Response("Not allowed", { status: 401 });

  const result = await syncPhotos({ budgetMs: 50_000 });
  if (result.added || result.removed) {
    revalidatePath("/", "layout");
  }
  return Response.json(result);
}
