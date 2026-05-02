"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import type { Feature } from "@/lib/features";
import type { BudgetItem, Guest, Letter, NewsPost, QAPair, Table } from "@/lib/types";

type Submission = {
  id: string;
  couple_name: string | null;
  partner_one: string | null;
  partner_two: string | null;
};

type PanelUser = {
  id: string;
  username: string;
  email: string | null;
  language: string;
  features: Feature[];
  submission_id: string | null;
  is_active: boolean;
  access_status: "pending" | "approved" | "rejected";
  auth_provider: "password" | "google";
  approved_at: string | null;
  created_at: string;
};

async function requirePanel(feature?: Feature) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");
  if (feature && !session.isAdmin && !session.features.includes(feature)) {
    throw new Error("You do not have access to this feature.");
  }
  return { session, supabase: createAdminClient() };
}

function requireSubmissionId(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session?.submissionId) {
    throw new Error("This panel user is not linked to a wedding submission.");
  }
  return session.submissionId;
}

function scopedId(session: Awaited<ReturnType<typeof getSession>>) {
  return session?.submissionId ?? null;
}

export async function getAdminData(): Promise<{
  users: PanelUser[];
  submissions: Submission[];
}> {
  const { session, supabase } = await requirePanel();
  if (!session.isAdmin) throw new Error("Only the admin user can manage panel users.");

  const [{ data: users, error: usersError }, { data: submissions, error: submissionsError }] = await Promise.all([
    supabase.from("panel_users").select("id, username, email, language, features, submission_id, is_active, access_status, auth_provider, approved_at, created_at").order("created_at"),
    supabase.from("solicitation_submissions").select("id, couple_name, partner_one, partner_two").order("couple_name"),
  ]);

  if (usersError) throw new Error(usersError.message);
  if (submissionsError) throw new Error(submissionsError.message);

  return {
    users: (users ?? []) as PanelUser[],
    submissions: (submissions ?? []) as Submission[],
  };
}

export async function listGuests(): Promise<Guest[]> {
  const { session, supabase } = await requirePanel("guests");
  let query = supabase.from("guests").select("*").eq("archived", false).order("last_name");
  const submissionId = scopedId(session);
  if (submissionId) query = query.eq("submission_id", submissionId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Guest[];
}

export async function createGuest(input: Omit<Guest, "id" | "submission_id" | "created_at" | "archived">): Promise<Guest> {
  const { session, supabase } = await requirePanel("guests");
  const submissionId = requireSubmissionId(session);
  const { data, error } = await supabase
    .from("guests")
    .insert({ ...input, submission_id: submissionId, archived: false })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Guest;
}

export async function updateGuest(id: string, input: Partial<Omit<Guest, "id" | "submission_id" | "created_at">>): Promise<Guest> {
  const { session, supabase } = await requirePanel("guests");
  let query = supabase.from("guests").update(input).eq("id", id);
  const submissionId = scopedId(session);
  if (submissionId) query = query.eq("submission_id", submissionId);
  const { data, error } = await query.select().single();
  if (error) throw new Error(error.message);
  return data as Guest;
}

export async function archiveGuest(id: string): Promise<void> {
  await updateGuest(id, { archived: true });
}

export async function listTablesAndGuests(): Promise<{ guests: Guest[]; tables: Table[] }> {
  const { session, supabase } = await requirePanel("seating");
  let guestsQuery = supabase.from("guests").select("*").eq("archived", false);
  let tablesQuery = supabase.from("tables").select("*");
  const submissionId = scopedId(session);
  if (submissionId) {
    guestsQuery = guestsQuery.eq("submission_id", submissionId);
    tablesQuery = tablesQuery.eq("submission_id", submissionId);
  }
  const [{ data: guests, error: guestsError }, { data: tables, error: tablesError }] = await Promise.all([guestsQuery, tablesQuery]);
  if (guestsError) throw new Error(guestsError.message);
  if (tablesError) throw new Error(tablesError.message);
  return { guests: (guests ?? []) as Guest[], tables: (tables ?? []) as Table[] };
}

export async function createTable(input: Pick<Table, "name" | "capacity" | "shape" | "x" | "y">): Promise<Table> {
  const { session, supabase } = await requirePanel("seating");
  const submissionId = requireSubmissionId(session);
  const { data, error } = await supabase
    .from("tables")
    .insert({ ...input, submission_id: submissionId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Table;
}

export async function assignGuestTable(guestId: string, tableId: string | null): Promise<void> {
  const { session, supabase } = await requirePanel("seating");
  let query = supabase.from("guests").update({ table_id: tableId }).eq("id", guestId);
  const submissionId = scopedId(session);
  if (submissionId) query = query.eq("submission_id", submissionId);
  const { error } = await query;
  if (error) throw new Error(error.message);
}

export async function renameTable(id: string, name: string): Promise<void> {
  const { session, supabase } = await requirePanel("seating");
  let query = supabase.from("tables").update({ name }).eq("id", id);
  const submissionId = scopedId(session);
  if (submissionId) query = query.eq("submission_id", submissionId);
  const { error } = await query;
  if (error) throw new Error(error.message);
}

export async function updateTable(
  id: string,
  input: Pick<Table, "name" | "capacity" | "shape">
): Promise<Table> {
  const { session, supabase } = await requirePanel("seating");
  let query = supabase.from("tables").update(input).eq("id", id);
  const submissionId = scopedId(session);
  if (submissionId) query = query.eq("submission_id", submissionId);
  const { data, error } = await query.select().single();
  if (error) throw new Error(error.message);
  return data as Table;
}

export async function deleteTable(id: string): Promise<void> {
  const { session, supabase } = await requirePanel("seating");
  let guestQuery = supabase.from("guests").update({ table_id: null }).eq("table_id", id);
  let tableQuery = supabase.from("tables").delete().eq("id", id);
  const submissionId = scopedId(session);
  if (submissionId) {
    guestQuery = guestQuery.eq("submission_id", submissionId);
    tableQuery = tableQuery.eq("submission_id", submissionId);
  }
  const { error: guestError } = await guestQuery;
  if (guestError) throw new Error(guestError.message);
  const { error: tableError } = await tableQuery;
  if (tableError) throw new Error(tableError.message);
}

export async function listDietaryGuests(): Promise<Guest[]> {
  const { session, supabase } = await requirePanel("dietary");
  let query = supabase.from("guests").select("*").eq("archived", false);
  const submissionId = scopedId(session);
  if (submissionId) query = query.eq("submission_id", submissionId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Guest[];
}

export async function listBudgetItems(): Promise<BudgetItem[]> {
  const { session, supabase } = await requirePanel("budget");
  let query = supabase.from("budget_items").select("*").order("category");
  const submissionId = scopedId(session);
  if (submissionId) query = query.eq("submission_id", submissionId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as BudgetItem[];
}

export async function createBudgetItem(input: Omit<BudgetItem, "id" | "submission_id">): Promise<BudgetItem> {
  const { session, supabase } = await requirePanel("budget");
  const submissionId = requireSubmissionId(session);
  const { data, error } = await supabase
    .from("budget_items")
    .insert({ ...input, submission_id: submissionId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as BudgetItem;
}

export async function updateBudgetItem(id: string, input: Omit<BudgetItem, "id" | "submission_id">): Promise<BudgetItem> {
  const { session, supabase } = await requirePanel("budget");
  let query = supabase.from("budget_items").update(input).eq("id", id);
  const submissionId = scopedId(session);
  if (submissionId) query = query.eq("submission_id", submissionId);
  const { data, error } = await query.select().single();
  if (error) throw new Error(error.message);
  return data as BudgetItem;
}

export async function deleteBudgetItem(id: string): Promise<void> {
  const { session, supabase } = await requirePanel("budget");
  let query = supabase.from("budget_items").delete().eq("id", id);
  const submissionId = scopedId(session);
  if (submissionId) query = query.eq("submission_id", submissionId);
  const { error } = await query;
  if (error) throw new Error(error.message);
}

export async function loadChatbot(): Promise<{ qaPairs: QAPair[]; contextBlock: string; updatedAt: string | null }> {
  const { session, supabase } = await requirePanel("chatbot");
  const submissionId = requireSubmissionId(session);
  const [{ data: qa, error: qaError }, { data: kb, error: kbError }] = await Promise.all([
    supabase.from("qa_pairs").select("*").eq("submission_id", submissionId).order("order"),
    supabase.from("knowledge_base").select("*").eq("submission_id", submissionId).maybeSingle(),
  ]);
  if (qaError) throw new Error(qaError.message);
  if (kbError) throw new Error(kbError.message);
  return {
    qaPairs: (qa ?? []) as QAPair[],
    contextBlock: kb?.context_block ?? "",
    updatedAt: kb?.updated_at ?? null,
  };
}

export async function saveChatbot(input: { qaPairs: Pick<QAPair, "question" | "answer">[]; contextBlock: string }): Promise<string> {
  const { session, supabase } = await requirePanel("chatbot");
  const submissionId = requireSubmissionId(session);
  const { error: deleteError } = await supabase.from("qa_pairs").delete().eq("submission_id", submissionId);
  if (deleteError) throw new Error(deleteError.message);

  const pairs = input.qaPairs.filter((pair) => pair.question.trim() || pair.answer.trim());
  if (pairs.length > 0) {
    const { error: insertError } = await supabase.from("qa_pairs").insert(
      pairs.map((pair, index) => ({
        question: pair.question,
        answer: pair.answer,
        order: index,
        submission_id: submissionId,
      }))
    );
    if (insertError) throw new Error(insertError.message);
  }

  const updatedAt = new Date().toISOString();
  const { error: kbError } = await supabase.from("knowledge_base").upsert({
    submission_id: submissionId,
    context_block: input.contextBlock,
    updated_at: updatedAt,
  }, { onConflict: "submission_id" });
  if (kbError) throw new Error(kbError.message);
  return updatedAt;
}

export async function listNewsPosts(): Promise<NewsPost[]> {
  const { session, supabase } = await requirePanel("news");
  let query = supabase.from("news_posts").select("*").order("created_at", { ascending: false });
  const submissionId = scopedId(session);
  if (submissionId) query = query.eq("submission_id", submissionId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as NewsPost[];
}

export async function createNewsPost(input: Omit<NewsPost, "id" | "submission_id" | "created_at">): Promise<NewsPost> {
  const { session, supabase } = await requirePanel("news");
  const submissionId = requireSubmissionId(session);
  const { data, error } = await supabase
    .from("news_posts")
    .insert({ ...input, submission_id: submissionId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as NewsPost;
}

export async function updateNewsPost(id: string, input: Omit<NewsPost, "id" | "submission_id" | "created_at">): Promise<NewsPost> {
  const { session, supabase } = await requirePanel("news");
  let query = supabase.from("news_posts").update(input).eq("id", id);
  const submissionId = scopedId(session);
  if (submissionId) query = query.eq("submission_id", submissionId);
  const { data, error } = await query.select().single();
  if (error) throw new Error(error.message);
  return data as NewsPost;
}

export async function deleteNewsPost(id: string): Promise<void> {
  const { session, supabase } = await requirePanel("news");
  let query = supabase.from("news_posts").delete().eq("id", id);
  const submissionId = scopedId(session);
  if (submissionId) query = query.eq("submission_id", submissionId);
  const { error } = await query;
  if (error) throw new Error(error.message);
}

export async function listLetters(): Promise<Letter[]> {
  const { session, supabase } = await requirePanel("letters");
  let query = supabase.from("letters").select("*").order("created_at", { ascending: false });
  const submissionId = scopedId(session);
  if (submissionId) query = query.eq("submission_id", submissionId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Letter[];
}

export async function toggleLetterRead(id: string, read: boolean): Promise<void> {
  const { session, supabase } = await requirePanel("letters");
  let query = supabase.from("letters").update({ read }).eq("id", id);
  const submissionId = scopedId(session);
  if (submissionId) query = query.eq("submission_id", submissionId);
  const { error } = await query;
  if (error) throw new Error(error.message);
}

export async function archiveLetter(id: string): Promise<void> {
  const { session, supabase } = await requirePanel("letters");
  let query = supabase.from("letters").update({ archived: true }).eq("id", id);
  const submissionId = scopedId(session);
  if (submissionId) query = query.eq("submission_id", submissionId);
  const { error } = await query;
  if (error) throw new Error(error.message);
}
