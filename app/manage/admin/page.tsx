"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Overlay, ConfirmOverlay } from "@/components/ui/Overlay";
import { useT } from "@/context/UserContext";
import { approveUser, createUser, deleteUser, rejectUser, updateUser } from "@/app/actions/auth";
import { getAdminData } from "@/app/actions/panel";
import { ALL_FEATURES, FEATURE_LABELS, type Feature } from "@/lib/features";
import { Plus, Trash2, Edit2, Check } from "lucide-react";

interface PanelUser {
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
}

interface Submission {
  id: string;
  couple_name: string | null;
  partner_one: string | null;
  partner_two: string | null;
}

const EMPTY_FORM = {
  username: "",
  email: "",
  password: "",
  language: "es" as "en" | "es",
  features: [...ALL_FEATURES] as Feature[],
  submissionId: "" as string,
  isActive: true,
};

export default function AdminPage() {
  const t = useT();

  const [users, setUsers] = useState<PanelUser[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"users" | "solicitations">("users");
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<PanelUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { users, submissions } = await getAdminData();
      setUsers(users);
      setSubmissions(submissions);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setFormError(null);
    setShowCreate(true);
  }

  function openEdit(user: PanelUser) {
    setForm({
      username: user.username,
      email: user.email ?? "",
      password: "",
      language: user.language as "en" | "es",
      features: user.features ?? [],
      submissionId: user.submission_id ?? "",
      isActive: user.is_active,
    });
    setFormError(null);
    setEditTarget(user);
  }

  function toggleFeature(f: Feature) {
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(f)
        ? prev.features.filter((x) => x !== f)
        : [...prev.features, f],
    }));
  }

  async function handleCreate() {
    if (!form.username || !form.password) {
      setFormError("Username and password are required.");
      return;
    }
    setSaving(true);
    const result = await createUser({
      username: form.username,
      email: form.email,
      password: form.password,
      language: form.language,
      features: form.features,
      submissionId: form.submissionId || null,
    });
    setSaving(false);
    if ("error" in result) { setFormError(result.error); return; }
    await load();
    setShowCreate(false);
  }

  async function handleUpdate() {
    if (!editTarget) return;
    setSaving(true);
    const result = await updateUser(editTarget.id, {
      password: form.password || undefined,
      email: form.email,
      language: form.language,
      features: form.features,
      submissionId: form.submissionId || null,
      isActive: form.isActive,
    });
    setSaving(false);
    if ("error" in result) { setFormError(result.error); return; }
    await load();
    setEditTarget(null);
  }

  async function handleDelete(id: string) {
    await deleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setDeleteTarget(null);
  }

  async function handleApprove(id: string) {
    setSaving(true);
    const result = await approveUser(id);
    setSaving(false);
    if ("error" in result) {
      setLoadError(result.error);
      return;
    }
    await load();
  }

  async function handleReject(id: string) {
    setSaving(true);
    const result = await rejectUser(id);
    setSaving(false);
    if ("error" in result) {
      setLoadError(result.error);
      return;
    }
    await load();
  }

  function submissionLabel(id: string | null) {
    if (!id) return "—";
    const s = submissions.find((s) => s.id === id);
    return s ? (s.couple_name || `${s.partner_one} & ${s.partner_two}`) : id.slice(0, 8) + "…";
  }

  if (loading) return (
    <div className="p-12 text-center text-sm" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-work-sans)" }}>
      {t.common.loading}
    </div>
  );

  if (loadError) return (
    <div>
      <ModuleHeader title={t.admin.title} subtitle={t.admin.subtitle} />
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--secondary-container)", color: "var(--on-surface)", fontFamily: "var(--font-work-sans)" }}
      >
        <p className="font-medium mb-2">Unable to load admin data</p>
        <p className="text-sm">{loadError}</p>
        <button
          onClick={load}
          className="mt-4 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--primary)", color: "white" }}
        >
          Retry
        </button>
      </div>
    </div>
  );

  function renderUserForm() {
    return (
      <div className="space-y-4">
      {!editTarget && (
        <div>
          <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
            {t.admin.username}
          </label>
          <input
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            className="input-underline"
            placeholder="e.g. garcia_2026"
            autoComplete="off"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
          Email
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="input-underline"
          placeholder="couple@example.com"
          autoComplete="off"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
          {t.admin.password}{editTarget ? ` (${t.admin.passwordHint})` : ""}
        </label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className="input-underline"
          placeholder="••••••••"
          autoComplete="new-password"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
            {t.admin.language}
          </label>
          <select
            value={form.language}
            onChange={(e) => setForm((f) => ({ ...f, language: e.target.value as "en" | "es" }))}
            className="input-underline"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
            {t.admin.submission}
          </label>
          <select
            value={form.submissionId}
            onChange={(e) => setForm((f) => ({ ...f, submissionId: e.target.value }))}
            className="input-underline"
          >
            <option value="">{t.admin.selectSubmission}</option>
            {submissions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.couple_name || `${s.partner_one} & ${s.partner_two}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {editTarget && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          />
          <label htmlFor="is_active" className="text-sm" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
            {t.admin.active}
          </label>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium mb-2" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
          {t.admin.features}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ALL_FEATURES.map((f) => {
            const on = form.features.includes(f);
            return (
              <button
                key={f}
                type="button"
                onClick={() => toggleFeature(f)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors"
                style={{
                  background: on ? "var(--secondary-container)" : "var(--surface-container-low)",
                  color: "var(--on-surface)",
                  fontFamily: "var(--font-work-sans)",
                }}
              >
                <div
                  className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                  style={{ background: on ? "var(--primary)" : "transparent", border: on ? "none" : "1px solid var(--outline-variant)" }}
                >
                  {on && <Check size={10} strokeWidth={2.5} color="white" />}
                </div>
                {FEATURE_LABELS[f]}
              </button>
            );
          })}
        </div>
      </div>

      {formError && (
        <div
          className="px-3 py-2 rounded-lg text-xs"
          style={{ background: "var(--secondary-container)", color: "var(--on-surface)", fontFamily: "var(--font-work-sans)" }}
        >
          {formError}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={() => { setShowCreate(false); setEditTarget(null); }}
          className="px-4 py-2 rounded-lg text-sm"
          style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}
        >
          {t.common.cancel}
        </button>
        <button
          onClick={editTarget ? handleUpdate : handleCreate}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--primary)", color: "white", fontFamily: "var(--font-work-sans)" }}
        >
          {saving ? t.common.save + "…" : editTarget ? t.common.save : t.admin.createUser}
        </button>
      </div>
      </div>
    );
  }

  return (
    <div>
      {(() => {
        const approvedUsers = users.filter((user) => user.access_status === "approved" && user.is_active);
        const solicitations = users.filter((user) => user.access_status !== "approved" || !user.is_active);
        const visibleUsers = tab === "users" ? approvedUsers : solicitations;

        return (
          <>
      <ModuleHeader
        title={t.admin.title}
        subtitle={t.admin.subtitle}
        actions={
          tab === "users" ? (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--primary)", color: "white", fontFamily: "var(--font-work-sans)" }}
          >
            <Plus size={14} strokeWidth={1.5} /> {t.admin.addUser}
          </button>
          ) : null
        }
      />

      <div className="mb-5 max-w-full overflow-x-auto">
        <div className="inline-flex rounded-lg p-1" style={{ background: "var(--surface-container-low)" }}>
        {[
          { key: "users" as const, label: "Users", count: approvedUsers.length },
          { key: "solicitations" as const, label: "Register solicitations", count: solicitations.length },
        ].map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className="rounded-md px-3 py-2 text-xs font-medium transition-colors"
              style={{
                background: active ? "var(--surface-container-lowest)" : "transparent",
                color: active ? "var(--primary)" : "var(--on-surface-variant)",
                fontFamily: "var(--font-work-sans)",
              }}
            >
              {item.label} ({item.count})
            </button>
          );
        })}
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}
      >
        {visibleUsers.length === 0 ? (
          <div className="p-12 text-center">
            <p style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)", fontSize: "1.125rem", fontWeight: "bold" }}>
              {tab === "users" ? t.admin.noUsers : "No pending register solicitations"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr style={{ background: "var(--surface-container-low)" }}>
                {[t.admin.username, "Email", t.admin.language, t.admin.submission, t.admin.features, tab === "users" ? t.admin.active : "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user, i) => (
                <tr
                  key={user.id}
                  style={{ background: i % 2 === 0 ? "var(--surface-container-lowest)" : "var(--surface-container-low)" }}
                >
                  <td className="px-4 py-3 font-bold" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)" }}>
                    {user.username}
                  </td>
                  <td className="px-4 py-3" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                    {user.email ?? "—"}
                  </td>
                  <td className="px-4 py-3" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                    {user.language === "es" ? "Español" : "English"}
                  </td>
                  <td className="px-4 py-3" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                    {submissionLabel(user.submission_id)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(user.features ?? []).map((f) => (
                        <span
                          key={f}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                          style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)", fontFamily: "var(--font-work-sans)" }}
                        >
                          {FEATURE_LABELS[f] ?? f}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ color: user.is_active ? "var(--primary)" : "var(--on-surface-variant)", fontFamily: "var(--font-work-sans)", fontSize: "0.75rem" }}>
                      {tab === "users" ? (user.is_active ? "Yes" : "No") : user.access_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {tab === "solicitations" && user.access_status !== "approved" && (
                        <>
                          <button
                            onClick={() => handleApprove(user.id)}
                            disabled={saving}
                            className="px-2 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                            style={{ background: "var(--primary)", color: "white", fontFamily: "var(--font-work-sans)" }}
                          >
                            Grant
                          </button>
                          <button
                            onClick={() => handleReject(user.id)}
                            disabled={saving}
                            className="px-2 py-1 rounded-lg text-xs transition-colors disabled:opacity-50"
                            style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-work-sans)" }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openEdit(user)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-container)]"
                        style={{ color: "var(--on-surface-variant)" }}
                      >
                        <Edit2 size={13} strokeWidth={1} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(user.id)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-[var(--secondary-container)]"
                        style={{ color: "var(--on-surface-variant)" }}
                      >
                        <Trash2 size={13} strokeWidth={1} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
          </>
        );
      })()}

      {showCreate && (
        <Overlay title={t.admin.createUser} onClose={() => setShowCreate(false)}>
          {renderUserForm()}
        </Overlay>
      )}

      {editTarget && (
        <Overlay title={`${t.admin.editUser}: ${editTarget.username}`} onClose={() => setEditTarget(null)}>
          {renderUserForm()}
        </Overlay>
      )}

      {deleteTarget && (
        <ConfirmOverlay
          title={t.admin.deleteUser}
          message={t.admin.deleteConfirm}
          confirmLabel={t.common.delete}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          destructive
        />
      )}
    </div>
  );
}
