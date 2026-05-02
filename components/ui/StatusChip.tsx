import type { BudgetItem, NewsPost, RSVPStatus } from "@/lib/types";

type ChipTone = {
  label: string;
  background: string;
  color: string;
};

const rsvpTones: Record<RSVPStatus, ChipTone> = {
  confirmed: { label: "Confirmed", background: "rgba(98, 122, 89, 0.14)", color: "#3f5f38" },
  declined: { label: "Declined", background: "rgba(127, 63, 54, 0.12)", color: "#7f3f36" },
  pending: { label: "Pending", background: "rgba(151, 118, 54, 0.14)", color: "#785b24" },
  awaiting: { label: "Awaiting", background: "var(--surface-container)", color: "var(--on-surface-variant)" },
};

const paidTones: Record<BudgetItem["paid_status"], ChipTone> = {
  unpaid: { label: "Unpaid", background: "rgba(127, 63, 54, 0.12)", color: "#7f3f36" },
  deposit_paid: { label: "Deposit paid", background: "rgba(151, 118, 54, 0.14)", color: "#785b24" },
  fully_paid: { label: "Paid", background: "rgba(98, 122, 89, 0.14)", color: "#3f5f38" },
};

const postTones: Record<NewsPost["status"], ChipTone> = {
  draft: { label: "Draft", background: "var(--surface-container)", color: "var(--on-surface-variant)" },
  published: { label: "Published", background: "rgba(98, 122, 89, 0.14)", color: "#3f5f38" },
  scheduled: { label: "Scheduled", background: "rgba(102, 91, 125, 0.14)", color: "#665b7d" },
};

function Chip({ tone }: { tone: ChipTone }) {
  return (
    <span
      className="inline-flex min-w-[5.25rem] items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        background: tone.background,
        color: tone.color,
        fontFamily: "var(--font-work-sans)",
      }}
    >
      {tone.label}
    </span>
  );
}

export function RSVPChip({ status }: { status: RSVPStatus }) {
  return <Chip tone={rsvpTones[status]} />;
}

export function PaidChip({ status }: { status: BudgetItem["paid_status"] }) {
  return <Chip tone={paidTones[status]} />;
}

export function PostStatusChip({ status }: { status: NewsPost["status"] }) {
  return <Chip tone={postTones[status]} />;
}
