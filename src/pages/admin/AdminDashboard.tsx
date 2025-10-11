import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import type { EventItem, UserItem } from "@/types";
import { api } from "@/lib/api";

export default function AdminDashboard() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [activity, setActivity] = useState<string[]>([]);

  useEffect(() => {
    api.listEvents().then(setEvents).catch(()=>{});
    api.listUsers().then(setUsers).catch(()=>{});
  }, []);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <div className="flex gap-2">
          <Link to="/admin/users"><Button>Invite User</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-8 rounded-2xl bg-white p-4 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Upcoming Events</h2>
            <Link to="/admin/events" className="text-sm text-blue-700">View all</Link>
          </div>
          <div className="divide-y">
            {events.map(e => (
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
          <Card title="Org Metrics">
            <Metric label="Total Events" value={events.length} />
            <Metric label="Active Events" value={events.filter(x=>x.status==="Active").length} />
            <Metric label="Total Users" value={users.length} />
          </Card>
          <Card title="Active Team">
            <ul className="space-y-2">
              {users.slice(0,4).map(u=>(
                <li key={u.id} className="flex items-center justify-between">
                  <span>{u.name}</span>
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                </li>
              ))}
            </ul>
          </Card>
        </aside>

        <section className="col-span-12 rounded-2xl bg-white p-4 shadow">
          <h2 className="mb-3 font-semibold">Recent Activity</h2>
          {activity.length === 0 ? (
            <div className="text-sm text-slate-500">No recent activity yet.</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {activity.map((a, i) => (<li key={i}>{a}</li>))}
            </ul>
          )}
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
