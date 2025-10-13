import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { EventItem } from "@/types";
import { api } from "@/lib/api";

export default function EventOverview() {
  const { slug } = useParams<{ slug: string }>();
  const [ev, setEv] = useState<EventItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    api.getEvent(slug).then(setEv).catch(e=>setError(String(e)));
  }, [slug]);

  if (error) return <div className="text-red-600 p-6">{error}</div>;
  if (!ev) return <div className="p-6 text-slate-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-[1000px] space-y-6 p-6">
      <Link to="/admin/events" className="text-sm text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Events
      </Link>
      
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{ev.name}</h1>
          <div className="text-sm text-slate-500 mt-1">
            {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {ev.venue}
          </div>
        </div>
        <Badge>{ev.status}</Badge>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <Metric label="Guests" value="1,950" />
        <Metric label="Assigned Seats" value="1,847" />
        <Metric label="Dietary Needs" value="234" />
      </div>

      <section className="rounded-lg bg-white border border-slate-200 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Teams</h2>
          <div className="flex gap-2">
            <Button variant="secondary" className="border border-slate-300 bg-white text-slate-700">
              Assign Planner
            </Button>
            <Button variant="secondary" className="border border-slate-300 bg-white text-slate-700">
              Assign Vendor
            </Button>
          </div>
        </div>
        <ul className="text-sm text-slate-700 space-y-2">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Planner Team A
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Vendor: Catering Co.
          </li>
        </ul>
      </section>

      <section className="rounded-lg bg-white border border-slate-200 p-6">
        <h2 className="mb-3 font-semibold text-slate-900">Compliance</h2>
        <ul className="text-sm text-slate-700 space-y-2">
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Privacy statement attached
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Accessibility checklist completed
          </li>
        </ul>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-white border border-slate-200 p-5">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold text-slate-900 mt-2">{value}</div>
    </div>
  );
}