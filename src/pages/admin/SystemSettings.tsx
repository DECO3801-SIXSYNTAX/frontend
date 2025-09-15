import { useState } from "react";
import Button from "@/components/ui/Button";

type Tab = "Organization" | "Roles & Permissions" | "Integrations" | "Notifications";

export default function SystemSettings() {
  const [tab, setTab] = useState<Tab>("Organization");
  return (
    <div className="mx-auto max-w-[900px] space-y-4">
      <h1 className="text-2xl font-semibold">System Settings</h1>
      <div className="flex gap-2">
        {(["Organization","Roles & Permissions","Integrations","Notifications"] as Tab[]).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`rounded-lg px-3 py-2 text-sm ${tab===t ? "bg-blue-600 text-white" : "bg-white border border-slate-300"}`}>{t}</button>
        ))}
      </div>
      <div className="rounded-2xl bg-white p-4 shadow">
        {tab === "Organization" && <Org />}
        {tab === "Roles & Permissions" && <Roles />}
        {tab === "Integrations" && <Integrations />}
        {tab === "Notifications" && <Notifications />}
      </div>
    </div>
  );
}

function Org() {
  return (
    <form className="space-y-3" onSubmit={(e)=>{ e.preventDefault(); alert("Saved"); }}>
      <Field label="Organization name"><input className="w-full rounded-lg border border-slate-300 px-3 py-2" defaultValue="SiPanit Pty Ltd" /></Field>
      <Field label="Default timezone">
        <select className="w-full rounded-lg border border-slate-300 px-3 py-2"><option>Australia/Brisbane</option><option>UTC</option></select>
      </Field>
      <Button type="submit">Save</Button>
    </form>
  );
}
function Roles() {
  const rows = ["Events","Users","Seating","Reports"];
  const cols = ["View","Create","Edit","Export"];
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead><tr><th className="px-3 py-2 text-left">Capability</th>{cols.map(c=><th key={c} className="px-3 py-2">{c}</th>)}</tr></thead>
        <tbody className="divide-y">
          {rows.map(r=>(
            <tr key={r}>
              <td className="px-3 py-2 font-medium">{r}</td>
              {cols.map(c=>(
                <td key={c} className="px-3 py-2 text-center"><input type="checkbox" defaultChecked={c==="View"} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3"><Button onClick={()=>alert("Saved")}>Save</Button></div>
    </div>
  );
}
function Integrations() {
  return (
    <form className="space-y-3" onSubmit={(e)=>{ e.preventDefault(); alert("Saved"); }}>
      <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> <span>Enable QR / Check-in</span></label>
      <Field label="Email provider">
        <select className="w-full rounded-lg border border-slate-300 px-3 py-2"><option>SendGrid</option><option>SES</option></select>
      </Field>
      <Button type="submit">Save</Button>
    </form>
  );
}
function Notifications() {
  return (
    <form className="space-y-2" onSubmit={(e)=>{ e.preventDefault(); alert("Saved"); }}>
      {["Imports finished","Export ready","System error"].map(n=>(
        <label key={n} className="flex items-center gap-2"><input type="checkbox" defaultChecked /> <span>{n}</span></label>
      ))}
      <Button type="submit">Save</Button>
    </form>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><div className="mb-1 text-sm text-slate-600">{label}</div>{children}</label>);
}
