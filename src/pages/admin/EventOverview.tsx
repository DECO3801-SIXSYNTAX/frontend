import { useParams, Link } from "react-router-dom";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { useEvent } from "../../hooks/useEvents";

export default function EventOverview() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading, error } = useEvent(id!);

  if (isLoading) return <div className="flex justify-center p-8">Loading event...</div>;
  if (error || !event) return <div className="flex justify-center p-8 text-red-600">Event not found</div>;

  return (
    <div className="mx-auto max-w-[1000px] space-y-6">
      <Link to="/admin/events" className="text-sm text-blue-700">&larr; Back to Events</Link>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{event.name}</h1>
          <div className="text-sm text-slate-500">{new Date(event.date).toDateString()} • {event.venue}</div>
        </div>
        <Badge>{event.status}</Badge>
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
