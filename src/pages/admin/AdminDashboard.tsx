import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useEvents } from "@/hooks/useEvents";
import { useUsers } from "@/hooks/useUsers";
import type { Event, User } from "@/types/api";

export default function AdminDashboard() {
  const { data: eventsData, isLoading: eventsLoading } = useEvents({ page_size: 5 });
  const { data: usersData, isLoading: usersLoading } = useUsers({ page_size: 4 });

  const events = eventsData?.results || [];
  const users = usersData?.results || [];

  if (eventsLoading || usersLoading) {
    return <div className="flex justify-center p-8">Loading dashboard...</div>;
  }
  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <div className="flex gap-2">
          <Link to="/admin/users"><Button>Invite User</Button></Link>
          <Link to="/admin/settings"><Button variant="secondary">Open Settings</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-8 rounded-2xl bg-white p-4 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Upcoming Events</h2>
            <Link to="/admin/events" className="text-sm text-blue-700">View all</Link>
          </div>
          <div className="divide-y">
            {events.map((e: Event) => (
              <Link key={e.id} to={`/admin/events/${e.id}`} className="flex items-center justify-between py-3 hover:bg-slate-50 rounded-lg px-2">
                <div>
                  <div className="font-medium">{e.name}</div>
                  <div className="text-sm text-slate-500">{new Date(e.date).toDateString()} • {e.venue}</div>
                </div>
                <Badge>{e.status}</Badge>
              </Link>
            ))}
          </div>
        </section>

        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <Card title="Activity">
            <Metric label="Total Events" value={eventsData?.count || 0} />
            <Metric label="Active Events" value={events.filter((x: Event) => x.status === "Active").length} />
            <Metric label="Total Users" value={usersData?.count || 0} />
            <Metric label="Active Users" value={users.filter((u: User) => u.is_active).length} />
          </Card>
          <Card title="Active Team">
            <ul className="space-y-2">
              {users.slice(0,4).map((u: User) => (
                <li key={u.id} className="flex items-center justify-between">
                  <span>{u.first_name} {u.last_name}</span>
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                </li>
              ))}
            </ul>
          </Card>
        </aside>

        <section className="col-span-12 rounded-2xl bg-white p-4 shadow">
          <h2 className="mb-3 font-semibold">Recent Activity</h2>
          <ul className="space-y-2 text-sm">
            <li>System sent reminder emails to 120 guests for Tech Conference 2024</li>
            <li>David Park created a new floor plan template</li>
            <li>Lisa imported 45 new guests for Annual Graduation</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <div className="mb-3 font-semibold">{title}</div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
