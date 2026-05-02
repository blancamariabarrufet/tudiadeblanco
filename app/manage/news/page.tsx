"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { PostStatusChip } from "@/components/ui/StatusChip";
import { Overlay, ConfirmOverlay } from "@/components/ui/Overlay";
import { useT } from "@/context/UserContext";
import { createNewsPost, deleteNewsPost, listNewsPosts, updateNewsPost } from "@/app/actions/panel";
import type { NewsPost } from "@/lib/types";
import { Plus, Trash2, Edit2 } from "lucide-react";

const EMPTY_POST: Omit<NewsPost, "id" | "submission_id" | "created_at"> = {
  title: "",
  body: "",
  status: "draft",
  date: new Date().toISOString().split("T")[0],
  scheduled_at: null,
  image_url: null,
};

function PostEditor({
  post,
  onChange,
  onSave,
  onCancel,
  title,
}: {
  post: typeof EMPTY_POST;
  onChange: (p: typeof EMPTY_POST) => void;
  onSave: (status: NewsPost["status"]) => void;
  onCancel: () => void;
  title: string;
}) {
  const t = useT();

  return (
    <Overlay title={title} onClose={onCancel} width="max-w-2xl">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
            {t.news.postTitle}
          </label>
          <input
            value={post.title}
            onChange={(e) => onChange({ ...post, title: e.target.value })}
            className="input-underline text-base"
            style={{ fontFamily: "var(--font-newsreader)" }}
            placeholder="Post title…"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
            {t.news.date}
          </label>
          <input
            type="date"
            value={post.date}
            onChange={(e) => onChange({ ...post, date: e.target.value })}
            className="input-underline"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
            {t.news.body}
          </label>
          <textarea
            value={post.body}
            onChange={(e) => onChange({ ...post, body: e.target.value })}
            rows={8}
            className="input-underline resize-none text-sm"
            style={{ lineHeight: "1.8", fontFamily: "var(--font-newsreader)" }}
            placeholder="Write your update here…"
          />
        </div>

        {post.status === "scheduled" && (
          <div>
            <label className="block text-xs font-medium mb-1" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
              {t.news.scheduleFor}
            </label>
            <input
              type="datetime-local"
              value={post.scheduled_at ?? ""}
              onChange={(e) => onChange({ ...post, scheduled_at: e.target.value || null })}
              className="input-underline"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mt-6 flex-wrap">
        <button
          onClick={() => onSave("draft")}
          className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--surface-container-low)]"
          style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}
        >
          {t.news.saveAsDraft}
        </button>
        <button
          onClick={() => onSave("scheduled")}
          className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--surface-container)]"
          style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface)", border: "1px solid rgba(204,198,188,0.3)" }}
        >
          {t.news.schedule}
        </button>
        <button
          onClick={() => onSave("published")}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--primary)", color: "white", fontFamily: "var(--font-work-sans)" }}
        >
          {t.news.publishNow}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm ml-auto"
          style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}
        >
          {t.common.cancel}
        </button>
      </div>
    </Overlay>
  );
}

export default function NewsPage() {
  const t = useT();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editPost, setEditPost] = useState<NewsPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newPost, setNewPost] = useState<typeof EMPTY_POST>({ ...EMPTY_POST });

  const load = useCallback(async () => {
    const data = await listNewsPosts();
    setPosts(data);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  async function createPost(status: NewsPost["status"]) {
    const data = await createNewsPost({ ...newPost, status });
    setPosts((p) => [data, ...p]);
    setShowNew(false);
    setNewPost({ ...EMPTY_POST });
  }

  async function updatePost(status: NewsPost["status"]) {
    if (!editPost) return;
    const data = await updateNewsPost(editPost.id, {
      title: editPost.title,
      body: editPost.body,
      date: editPost.date,
      status,
      scheduled_at: editPost.scheduled_at,
      image_url: editPost.image_url,
    });
    setPosts((p) => p.map((post) => (post.id === data.id ? data : post)));
    setEditPost(null);
  }

  async function deletePost(id: string) {
    await deleteNewsPost(id);
    setPosts((p) => p.filter((post) => post.id !== id));
    setDeleteTarget(null);
  }

  if (loading) return <div className="p-12 text-center text-sm" style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-work-sans)" }}>{t.common.loading}</div>;

  return (
    <div>
      <ModuleHeader
        title={t.news.title}
        subtitle={t.news.subtitle}
        actions={
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--primary)", color: "white", fontFamily: "var(--font-work-sans)" }}
          >
            <Plus size={14} strokeWidth={1.5} /> {t.news.newPost}
          </button>
        }
      />

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}
      >
        {posts.length === 0 ? (
          <div className="p-12 text-center">
            <p style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)", fontSize: "1.125rem" }}>{t.news.noPostsTitle}</p>
            <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
              {t.news.noPostsSubtitle}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr style={{ background: "var(--surface-container-low)" }}>
                {[t.news.postTitle, "Status", t.news.date, ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map((post, i) => (
                <tr
                  key={post.id}
                  style={{ background: i % 2 === 0 ? "var(--surface-container-lowest)" : "var(--surface-container-low)" }}
                >
                  <td className="px-4 py-3">
                    <p style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)", fontSize: "0.9375rem" }}>
                      {post.title || <span style={{ color: "var(--on-surface-variant)", fontStyle: "italic" }}>Untitled</span>}
                    </p>
                    {post.status === "scheduled" && post.scheduled_at && (
                      <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                        Scheduled for {new Date(post.scheduled_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <PostStatusChip status={post.status} />
                  </td>
                  <td className="px-4 py-3" style={{ fontFamily: "var(--font-work-sans)", color: "var(--on-surface-variant)" }}>
                    {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditPost({ ...post })}
                        className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-container)]"
                        style={{ color: "var(--on-surface-variant)" }}
                      >
                        <Edit2 size={13} strokeWidth={1} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(post.id)}
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

      {showNew && (
        <PostEditor
          post={newPost}
          onChange={setNewPost}
          onSave={createPost}
          onCancel={() => { setShowNew(false); setNewPost({ ...EMPTY_POST }); }}
          title={t.news.newPost}
        />
      )}

      {editPost && (
        <PostEditor
          post={editPost}
          onChange={(p) => setEditPost((prev) => prev && { ...prev, ...p })}
          onSave={updatePost}
          onCancel={() => setEditPost(null)}
          title={`${t.common.edit} ${t.news.newPost}`}
        />
      )}

      {deleteTarget && (
        <ConfirmOverlay
          title="Delete Post"
          message="This post will be permanently deleted and removed from the guest site."
          confirmLabel="Delete"
          onConfirm={() => deletePost(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          destructive
        />
      )}
    </div>
  );
}
