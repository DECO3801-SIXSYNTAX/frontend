import { Link } from "react-router-dom";
import Badge from "@/components/ui/Badge";
import { useState } from "react";
import { useEvents } from "@/hooks/useEvents";
import type { Event } from "@/types/api";

const filters: ("All" | Event['status'])[] = ["All", "Active", "Planning", "Draft"];

export default function ViewEvents() {
  const [status, setStatus] = useState<"All" | Event['status']>("All");
  
  const { data: eventsData, isLoading, error } = useEvents({
    status: status === "All" ? undefined : status,
  });

  const filtered = eventsData?.results || [];

  if (isLoading) return <div className="flex justify-center p-8">Loading...</div>;
  if (error) return <div className="flex justify-center p-8 text-red-600">Error loading events</div>;

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
            {filtered.map((e: Event) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <Td className="font-medium">{e.name}</Td>
                <Td>{new Date(e.date).toDateString()}</Td>
                <Td>{e.venue}</Td>
                <Td><Badge>{e.status}</Badge></Td>
                <Td>{e.owner}</Td>
                <Td><Link to={`/admin/events/${e.id}`} className="text-blue-700 hover:underline">View</Link></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 text-left font-medium text-slate-600">{children}</th>; }
function Td({ className = "", children }: { className?: string; children: React.ReactNode }) { return <td className={`px-4 py-3 ${className}`}>{children}</td>; }
