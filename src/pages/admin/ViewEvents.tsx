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
    <div className="mx-auto max-w-[1200px] space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">View Events</h1>
        <div className="flex items-center gap-3">
          <select 
            value={status} 
            onChange={e=>setStatus(e.target.value as ("All" | EventStatus))} 
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {filters.map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="p-2 hover:bg-slate-100 rounded-lg">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <Th>Event</Th>
              <Th>Date</Th>
              <Th>Venue</Th>
              <Th>Status</Th>
              <Th>Owner</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><Td colSpan={6} className="text-center text-slate-500">Loading…</Td></tr>
            ) : (
              filtered.map(e => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <Td className="font-medium text-slate-900">{e.name}</Td>
                  <Td className="text-slate-700">{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Td>
                  <Td className="text-slate-700">{e.venue}</Td>
                  <Td><Badge>{e.status}</Badge></Td>
                  <Td className="text-slate-700">{e.owner}</Td>
                  <Td>
                    <Link 
                      to={`/admin/events/${('slug' in e && (e as any).slug) ? (e as any).slug : e.id}`} 
                      className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                    >
                      View
                    </Link>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) { 
  return <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">{children}</th>; 
}

function Td({ className = "", colSpan, children }: { className?: string; colSpan?: number; children: React.ReactNode }) { 
  return <td colSpan={colSpan} className={`px-6 py-4 ${className}`}>{children}</td>; 
}