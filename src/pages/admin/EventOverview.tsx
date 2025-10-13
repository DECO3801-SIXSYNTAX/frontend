import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { EventItem } from "@/types";
import { api } from "@/lib/api";

export default function EventOverview() {
  const { id } = useParams<{ id: string }>();
  const [ev, setEv] = useState<EventItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getEvent(id).then(setEv).catch(e=>setError(String(e)));
  }, [id]);

  if (error) return <div className="text-red-600">{error}</div>;
  if (!ev) return <div>Loading…</div>;

  return (
    <div className="mx-auto max-w-[1000px] space-y-6">
      <Link to="/admin/events" className="text-sm text-blue-700">&larr; Back to Events</Link>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{ev.name}</h1>
          <div className="text-sm text-slate-500">{new Date(ev.date).toDateString()} • {ev.venue}</div>
        </div>
        <Badge>{ev.status}</Badge>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <Metric label="Guests" value="1,950" />
        <Metric label="Assigned Seats" value="1,847" />
        <Metric label="Dietary Needs" value="234" />
      </div>

      <section className="rounded-2xl bg-white p-4 shadow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Teams</h2>
          <div className="flex gap-2">
            <Button variant="secondary">Assign Planner</Button>
            <Button variant="secondary">Assign Vendor</Button>
          </div>
        </div>
        <ul className="text-sm text-slate-700 list-disc pl-5">
          <li>Planner Team A</li>
          <li>Vendor: Catering Co.</li>
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Compliance</h2>
        <ul className="text-sm list-disc pl-5">
          <li>Privacy statement attached</li>
          <li>Accessibility checklist completed</li>
        </ul>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
