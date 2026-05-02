import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const submissionId = searchParams.get("submissionId");

  if (!submissionId) {
    return Response.json({ error: "submissionId is required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const now = Date.now();

  const [
    { data: wedding, error: weddingError },
    { data: news, error: newsError },
    { data: knowledgeBase, error: knowledgeError },
    { data: qaPairs, error: qaError },
    { data: rsvpSettings, error: rsvpError },
  ] = await Promise.all([
    supabase
      .from("solicitation_submissions")
      .select("id, couple_name, partner_one, partner_two, email, wedding_date, ceremony_venue, reception_venue, guest_count, locale")
      .eq("id", submissionId)
      .maybeSingle(),
    supabase
      .from("news_posts")
      .select("id, title, body, status, date, scheduled_at, image_url, created_at")
      .eq("submission_id", submissionId)
      .in("status", ["published", "scheduled"])
      .order("date", { ascending: false }),
    supabase
      .from("knowledge_base")
      .select("context_block, updated_at")
      .eq("submission_id", submissionId)
      .maybeSingle(),
    supabase
      .from("qa_pairs")
      .select("id, question, answer, order")
      .eq("submission_id", submissionId)
      .order("order"),
    supabase
      .from("rsvp_settings")
      .select("is_open, deadline, meal_options, updated_at")
      .eq("submission_id", submissionId)
      .maybeSingle(),
  ]);

  const error = weddingError ?? newsError ?? knowledgeError ?? qaError ?? rsvpError;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!wedding) return Response.json({ error: "Wedding not found." }, { status: 404 });

  return Response.json({
    wedding,
    news: (news ?? []).filter((post) => {
      if (post.status === "published") return true;
      if (!post.scheduled_at) return false;
      return new Date(post.scheduled_at).getTime() <= now;
    }),
    chatbot: {
      contextBlock: knowledgeBase?.context_block ?? "",
      updatedAt: knowledgeBase?.updated_at ?? null,
      qaPairs: qaPairs ?? [],
    },
    rsvp: rsvpSettings ?? {
      is_open: true,
      deadline: null,
      meal_options: [],
      updated_at: null,
    },
  });
}
