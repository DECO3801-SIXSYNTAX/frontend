import { Link } from "react-router-dom";
import Badge from "@/components/ui/Badge";
import { useEffect, useState } from "react";
import type { EventItem, EventStatus } from "@/types";
import { api } from "@/lib/api";

const filters: ("All" | EventStatus)[] = ["All", "Active", "Planning", "Draft"];

export default function ViewEvents() {
  const [status, setStatus] = useState<"All" | EventStatus>("All");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.listEvents()
      .then((data) => { if (!active) return; setEvents(data as EventItem[]); setError(null); })
      .catch((e) => { if (!active) return; setError(String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = status === "All" ? events : events.filter(e => e.status === status);

  return (
    <div className="mx-auto max-w-[1200px] space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">View Events</h1>
        <select value={status} onChange={e=>setStatus(e.target.value as any)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          {filters.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr><Th>Event</Th><Th>Date</Th><Th>Venue</Th><Th>Status</Th><Th>Owner</Th><Th>Actions</Th></tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><Td colSpan={6}>Loading…</Td></tr>
            ) : (
              filtered.map(e => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <Td className="font-medium">{e.name}</Td>
                  <Td>{new Date(e.date).toDateString()}</Td>
                  <Td>{e.venue}</Td>
                  <Td><Badge>{e.status}</Badge></Td>
                  <Td>{e.owner}</Td>
                  <Td><Link to={`/admin/events/${e.id}`} className="text-blue-700 hover:underline">View</Link></Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 text-left font-medium text-slate-600">{children}</th>; }
function Td({ className = "", colSpan, children }: { className?: string; colSpan?: number; children: React.ReactNode }) { return <td colSpan={colSpan} className={`px-4 py-3 ${className}`}>{children}</td>; }
