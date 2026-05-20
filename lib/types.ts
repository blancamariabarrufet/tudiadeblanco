export type RSVPStatus = "confirmed" | "declined" | "pending" | "awaiting";

export interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  rsvp_status: RSVPStatus;
  dietary: string;
  plus_one: boolean;
  table_id: string | null;
  seat_index: number | null;
  notes: string;
  submission_id: string;
  archived: boolean;
  created_at: string;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  shape: "round" | "rectangular";
  x: number;
  y: number;
  submission_id: string;
}

export interface BudgetItem {
  id: string;
  category: string;
  description: string;
  budgeted: number;
  actual: number;
  deposit_paid: number;
  payment_due_date: string;
  paid_status: "unpaid" | "deposit_paid" | "fully_paid";
  notes: string;
  submission_id: string;
}

export interface NewsPost {
  id: string;
  title: string;
  body: string;
  status: "draft" | "published" | "scheduled";
  date: string;
  scheduled_at: string | null;
  image_url: string | null;
  submission_id: string;
  created_at: string;
}

export interface Letter {
  id: string;
  guest_name: string;
  anonymous: boolean;
  body: string;
  read: boolean;
  archived: boolean;
  created_at: string;
  submission_id: string;
}

export interface QAPair {
  id: string;
  question: string;
  answer: string;
  order: number;
  submission_id: string;
}

export interface KnowledgeBase {
  submission_id: string;
  qa_pairs: QAPair[];
  context_block: string;
  updated_at: string;
}

export interface Wedding {
  id: string;
  submission_id: string;
  partner1_name: string;
  partner2_name: string;
  wedding_date: string | null;
  currency: string;
  created_at: string;
}
