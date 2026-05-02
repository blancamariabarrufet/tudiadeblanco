import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { UserProvider } from "@/context/UserContext";
import { NavRail } from "@/components/layout/NavRail";

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <UserProvider user={user}>
      <div className="flex min-h-screen" style={{ background: "var(--surface)" }}>
        <NavRail />
        <main className="min-w-0 flex-1 overflow-auto pb-24 md:pb-0">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
        </main>
      </div>
    </UserProvider>
  );
}
