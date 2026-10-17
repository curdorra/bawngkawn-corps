import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/admin-auth";
import { guard } from "@/lib/api";
import { syncPhotos } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** "Check Drive now": reads the Drive folder straight away instead of waiting for the next automatic check. */
export const POST = () =>
  guard(async () => {
    if (!(await currentAdmin())) return Response.json({ error: "login" }, { status: 401 });
    const result = await syncPhotos().catch(() => null);
    if (!result || result.skipped) return Response.json({ error: "drive" }, { status: 400 });
    revalidatePath("/", "layout");
    return Response.json(result);
  });
