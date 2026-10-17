import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/admin-auth";
import { syncPhotos } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** "Check Drive now": runs a photo sync straight away instead of waiting for the next automatic one. */
export async function POST() {
  if (!(await currentAdmin())) return Response.json({ error: "login" }, { status: 401 });
  const result = await syncPhotos({ budgetMs: 50_000 });
  revalidatePath("/", "layout");
  return Response.json(result);
}
