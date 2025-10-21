import { Link } from "react-router-dom";
import Badge from "@/components/ui/Badge";
import { useEffect, useState } from "react";
import type { EventItem, EventStatus } from "@/types";
import { api } from "@/lib/api";

const filters: ("All" | EventStatus)[] = ["All", "Active", "Planning", "Draft"];

export default function ViewEvents() {
  const [status, setStatus] = useState<"All" | EventStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");
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

  const filtered = events.filter(e => {
    const matchesStatus = status === "All" || e.status === status;
    const matchesSearch = !searchQuery.trim() || 
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">View Events</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Browse and manage all events</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
        <div className="relative flex-1 w-full">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search events by name or venue..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>
        <select 
          value={status} 
          onChange={e=>setStatus(e.target.value as ("All" | EventStatus))} 
          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 whitespace-nowrap"
        >
          {filters.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Event Count */}
      <div className="text-sm text-slate-600 dark:text-slate-400">
        Showing <span className="font-semibold text-slate-900 dark:text-white">{filtered.length}</span> of <span className="font-semibold text-slate-900 dark:text-white">{events.length}</span> events
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <Th>Event</Th>
                <Th>Date</Th>
                <Th>Venue</Th>
                <Th>Status</Th>
                <Th>Owner</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr><Td colSpan={6} className="text-center text-slate-500 dark:text-slate-400 py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    <span>Loading events...</span>
                  </div>
                </Td></tr>
              ) : filtered.length === 0 ? (
                <tr><Td colSpan={6} className="text-center text-slate-500 dark:text-slate-400 py-12">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-12 h-12 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="font-medium">No events found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                </Td></tr>
              ) : (
                filtered.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <Td className="font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        {e.name}
                      </div>
                    </Td>
                    <Td className="text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {e.date ? new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                    </Td>
                    <Td className="text-slate-700 dark:text-slate-300">{e.venue || 'TBD'}</Td>
                    <Td><Badge>{e.status}</Badge></Td>
                    <Td className="text-slate-700 dark:text-slate-300">{e.owner || 'N/A'}</Td>
                    <Td>
                      <Link 
                        to={`/admin/events/${('slug' in e && (e as any).slug) ? (e as any).slug : e.id}`} 
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-medium transition-colors"
                      >
                        View
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) { 
  return <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{children}</th>; 
}

function Td({ className = "", colSpan, children }: { className?: string; colSpan?: number; children: React.ReactNode }) { 
  return <td colSpan={colSpan} className={`px-6 py-4 ${className}`}>{children}</td>; 
}