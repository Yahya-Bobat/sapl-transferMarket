"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type CaptainRow = {
  id: string;
  email: string;
  teamName: string | null;
  approvalStatus: string;
  listed: boolean;
  createdAt: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [captains, setCaptains] = useState<CaptainRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) router.replace("/admin/login");
      });
  }, [router]);

  useEffect(() => {
    fetch("/api/admin/captains", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCaptains(data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleAction(captainId: string, action: "approve" | "reject") {
    setActionId(captainId);
    try {
      const res = await fetch("/api/admin/captains", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ captainId, action }),
      });
      if (res.ok) {
        setCaptains((prev) =>
          prev.map((c) =>
            c.id === captainId
              ? { ...c, approvalStatus: action === "approve" ? "approved" : "rejected" }
              : c
          )
        );
      }
    } finally {
      setActionId(null);
    }
  }

  const pending = captains.filter((c) => c.approvalStatus === "pending");
  const approved = captains.filter((c) => c.approvalStatus === "approved");
  const rejected = captains.filter((c) => c.approvalStatus === "rejected");

  function StatusBadge({ status }: { status: string }) {
    const colours: Record<string, string> = {
      pending: "bg-yellow-500/15 text-yellow-400",
      approved: "bg-green-500/15 text-green-400",
      rejected: "bg-red-500/15 text-red-400",
    };
    return (
      <span className={`rounded px-2 py-0.5 text-xs font-medium ${colours[status] ?? ""}`}>
        {status}
      </span>
    );
  }

  function CaptainTable({ rows }: { rows: CaptainRow[] }) {
    if (rows.length === 0) return <p className="text-sm text-[var(--muted)]">None.</p>;
    return (
      <ul className="space-y-3">
        {rows.map((c) => (
          <li key={c.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-[var(--text)]">{c.teamName || "(no team name)"}</p>
              <p className="text-sm text-[var(--muted)]">{c.email}</p>
              <p className="text-xs text-[var(--muted)]">
                Registered {new Date(c.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={c.approvalStatus} />
              {c.approvalStatus === "pending" && (
                <>
                  <button
                    type="button"
                    disabled={actionId === c.id}
                    onClick={() => handleAction(c.id, "approve")}
                    className="rounded bg-green-600/20 px-3 py-1.5 text-sm text-green-400 hover:bg-green-600/30"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={actionId === c.id}
                    onClick={() => handleAction(c.id, "reject")}
                    className="rounded bg-red-600/20 px-3 py-1.5 text-sm text-red-400 hover:bg-red-600/30"
                  >
                    Reject
                  </button>
                </>
              )}
              {c.approvalStatus === "approved" && (
                <button
                  type="button"
                  disabled={actionId === c.id}
                  onClick={() => handleAction(c.id, "reject")}
                  className="rounded border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-white/5"
                >
                  Revoke
                </button>
              )}
              {c.approvalStatus === "rejected" && (
                <button
                  type="button"
                  disabled={actionId === c.id}
                  onClick={() => handleAction(c.id, "approve")}
                  className="rounded border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-white/5"
                >
                  Re-approve
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--text)]">Admin dashboard</h1>
        <div className="flex gap-2">
          <Link href="/market" className="btn-ghost">Market</Link>
          <form action="/api/auth/admin/logout" method="POST">
            <button type="submit" className="btn-ghost">Sign out</button>
          </form>
        </div>
      </div>

      {loading ? (
        <p className="text-[var(--muted)]">Loading…</p>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">
              Pending approval{" "}
              {pending.length > 0 && (
                <span className="ml-1 rounded bg-yellow-500/20 px-2 py-0.5 text-sm text-yellow-400">
                  {pending.length}
                </span>
              )}
            </h2>
            <CaptainTable rows={pending} />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Approved</h2>
            <CaptainTable rows={approved} />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Rejected</h2>
            <CaptainTable rows={rejected} />
          </section>
        </>
      )}
    </div>
  );
}
