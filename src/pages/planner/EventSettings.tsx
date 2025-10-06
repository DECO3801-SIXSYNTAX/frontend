import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";

type Tab =
  | "Overview"
  | "Basics"
  | "Venue & Rooms"
  | "Layout & Seating"
  | "Groups & Tags"
  | "Vendors & Roles"
  | "Check-in & Kiosk"
  | "Communications"
  | "Accessibility & Privacy"
  | "Integrations"
  | "Publish";

type EventStatus = "DRAFT" | "PLANNING" | "PUBLISHED" | "ARCHIVED";
type VendorType = "CATERING" | "AV" | "LOGISTICS" | "OTHER";

interface Room {
  id: string;
  name: string;
  capacity?: number;
}

interface Vendor {
  id: string;
  type: VendorType;
  name: string;
  contact?: string;
}

export interface EventSettings {
  id?: string;
  name: string;
  status: EventStatus;
  timezone: string;
  date: string; // YYYY-MM-DD format for backend
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  description?: string;
  venue: {
    name: string;
    address?: string;
    map_url?: string;
    capacity?: number;
    rooms: Room[];
  };
  seating_rules: {
    table_size_default?: number;
    max_per_table?: number;
    keep_groups_together: boolean;
    separate_dietary: boolean;
    aisle_width?: number;
    layout_template_id?: string;
  };
  groups: string[];
  tags: { 
    dietary: string[]; 
    access: string[] 
  };
  vendors: Vendor[];
  roles: { 
    planner_uids: string[]; 
    vendor_uids: string[] 
  };
  checkin: { 
    enabled: boolean; 
    qr_prefix?: string; 
    kiosk_pin?: string; 
    opens_at?: string; 
    closes_at?: string; 
    offline_hint?: string 
  };
  comms: { 
    rsvp_template?: string; 
    reminder_template?: string; 
    day_of_sms_template?: string 
  };
  accessibility: { 
    statement?: string; 
    evacuation_note?: string 
  };
  privacy: { 
    consent_text?: string; 
    retention_days?: number 
  };
  exports: { 
    caterer_preset?: string; 
    seating_preset?: string 
  };
  integrations?: { 
    sheet_sync?: { 
      enabled: boolean; 
      sheet_id?: string 
    } 
  };
  created_at?: string;
  updated_at?: string;
}

// Empty EventSettings template without dummy data
const emptyEventSettings = (): EventSettings => ({
  name: "",
  status: "DRAFT",
  timezone: "Australia/Brisbane",
  date: "",
  start_time: "09:00",
  end_time: "18:00",
  description: "",
  venue: {
    name: "",
    address: "",
    map_url: "",
    capacity: undefined,
    rooms: [],
  },
  seating_rules: {
    table_size_default: 10,
    max_per_table: 12,
    keep_groups_together: true,
    separate_dietary: true,
    aisle_width: 180,
    layout_template_id: "",
  },
  groups: [],
  tags: {
    dietary: [],
    access: [],
  },
  vendors: [],
  roles: { planner_uids: [], vendor_uids: [] },
  checkin: { enabled: false },
  comms: {},
  accessibility: {},
  privacy: { retention_days: 90 },
  exports: {},
  integrations: { sheet_sync: { enabled: false } },
});

export default function EventSettingsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("Overview");
  const [settings, setSettings] = useState<EventSettings>(emptyEventSettings());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const issues = useValidation(settings);

  // Load event data on mount
  useEffect(() => {
    if (eventId && eventId !== "new") {
      loadEventSettings(eventId);
    }
  }, [eventId]);

  const loadEventSettings = async (id: string) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call to your Django backend
      // Example:
      // import { api } from '../../lib/api';
      // const response = await api.get(`/api/events/${id}/settings/`);
      // setSettings(response.data);
      
      // Placeholder - remove when API is connected
      console.log(`Loading event settings for ID: ${id}`);
      flash("Event settings loaded (placeholder)");
    } catch (error) {
      console.error("Failed to load event settings:", error);
      flash("Failed to load event settings");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...settings,
        updated_at: new Date().toISOString(),
      };

      if (eventId && eventId !== "new") {
        // TODO: Replace with actual API call to your Django backend
        // Example:
        // await api.put(`/api/events/${eventId}/settings/`, payload);
        console.log("Updating event settings:", payload);
      } else {
        // TODO: Replace with actual API call to your Django backend
        // Example:
        // const response = await api.post('/api/events/', payload);
        // navigate(`/planner/events/${response.data.id}/settings`);
        console.log("Creating new event:", payload);
      }
      
      flash("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      flash("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (issues.length > 0) {
      setShowPublish(true);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...settings,
        status: "PUBLISHED" as EventStatus,
        updated_at: new Date().toISOString(),
      };

      // TODO: Replace with actual API call to your Django backend
      // Example:
      // await api.put(`/api/events/${eventId}/publish/`, payload);
      console.log("Publishing event:", payload);
      
      setSettings(prev => ({ ...prev, status: "PUBLISHED" }));
      setShowPublish(false);
      flash("Event published successfully");
    } catch (error) {
      console.error("Failed to publish event:", error);
      flash("Failed to publish event");
    } finally {
      setSaving(false);
    }
  };

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-600">Loading event settings...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">
            <button 
              onClick={() => navigate('/planner/events')}
              className="hover:underline"
            >
              Planner
            </button>
            {" • "}
            <span>Event Settings</span>
          </div>
          <h1 className="text-2xl font-semibold">
            {settings.name || "New Event"}
          </h1>
          <div className="text-sm text-slate-500">
            {settings.timezone} • {formatEventTime(settings)}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button 
            onClick={() => setShowPublish(true)}
            disabled={saving}
          >
            {settings.status === "PUBLISHED" ? "Update" : "Publish"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <TabBar current={tab} onChange={setTab} />

      {/* Content */}
      <div className="rounded-2xl bg-white p-5 shadow">
        {tab === "Overview" && <Overview settings={settings} />}
        {tab === "Basics" && <Basics settings={settings} onChange={setSettings} />}
        {tab === "Venue & Rooms" && <VenueRooms settings={settings} onChange={setSettings} />}
        {tab === "Layout & Seating" && <LayoutSeating settings={settings} onChange={setSettings} />}
        {tab === "Groups & Tags" && <GroupsTags settings={settings} onChange={setSettings} />}
        {tab === "Vendors & Roles" && <VendorsRoles settings={settings} onChange={setSettings} />}
        {tab === "Check-in & Kiosk" && <CheckinKiosk settings={settings} onChange={setSettings} />}
        {tab === "Communications" && <Communications settings={settings} onChange={setSettings} />}
        {tab === "Accessibility & Privacy" && <AccessPrivacy settings={settings} onChange={setSettings} />}
        {tab === "Integrations" && <Integrations settings={settings} onChange={setSettings} />}
        {tab === "Publish" && <PublishSummary settings={settings} issues={issues} onPublish={publish} />}
      </div>

      {/* Publish modal (validation checklist) */}
      <Modal open={showPublish} title="Publish checklist" onClose={() => setShowPublish(false)}>
        <div className="space-y-3">
          {issues.length === 0 ? (
            <div className="rounded-lg bg-green-50 p-3 text-green-700">
              All checks passed. Ready to publish!
            </div>
          ) : (
            <div>
              <div className="mb-2 text-sm font-medium">Please fix these issues before publishing:</div>
              <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                {issues.map((issue, index) => <li key={index}>{issue}</li>)}
              </ul>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="secondary" onClick={() => setShowPublish(false)}>
              Cancel
            </Button>
            <Button onClick={publish} disabled={issues.length > 0 || saving}>
              {saving ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

/* -------------------------- Sections -------------------------- */

function Overview({ settings }: { settings: EventSettings }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card title="Status">
        <div className="text-lg font-semibold">{settings.status}</div>
        <div className="text-sm text-slate-500">
          {settings.created_at ? `Created ${new Date(settings.created_at).toLocaleDateString()}` : "New event"}
        </div>
      </Card>
      <Card title="Venue">
        <div className="font-medium">{settings.venue.name || "—"}</div>
        <div className="text-sm text-slate-500">{settings.venue.address || "—"}</div>
        <div className="text-sm">Capacity: {settings.venue.capacity ?? "—"}</div>
        <div className="text-sm">Rooms: {settings.venue.rooms.length}</div>
      </Card>
      <Card title="Seating rules">
        <div className="text-sm">Table size: {settings.seating_rules.table_size_default ?? "—"}</div>
        <div className="text-sm">Max / table: {settings.seating_rules.max_per_table ?? "—"}</div>
        <div className="text-sm">Keep groups: {settings.seating_rules.keep_groups_together ? "Yes" : "No"}</div>
      </Card>
    </div>
  );
}

function Basics({ settings, onChange }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Event name">
        <input 
          className="input" 
          value={settings.name} 
          onChange={(e) => onChange({ ...settings, name: e.target.value })} 
          placeholder="Enter event name"
        />
      </Field>
      <Field label="Status">
        <select 
          className="input" 
          value={settings.status} 
          onChange={(e) => onChange({ ...settings, status: e.target.value as EventStatus })}
        >
          <option value="DRAFT">Draft</option>
          <option value="PLANNING">Planning</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </Field>
      <Field label="Timezone">
        <select 
          className="input" 
          value={settings.timezone} 
          onChange={(e) => onChange({ ...settings, timezone: e.target.value })}
        >
          <option value="Australia/Brisbane">Australia/Brisbane</option>
          <option value="Australia/Sydney">Australia/Sydney</option>
          <option value="Australia/Melbourne">Australia/Melbourne</option>
          <option value="UTC">UTC</option>
        </select>
      </Field>
      <Field label="Event date">
        <input 
          type="date" 
          className="input" 
          value={settings.date} 
          onChange={(e) => onChange({ ...settings, date: e.target.value })} 
        />
      </Field>
      <Field label="Start time">
        <input 
          type="time" 
          className="input" 
          value={settings.start_time} 
          onChange={(e) => onChange({ ...settings, start_time: e.target.value })} 
        />
      </Field>
      <Field label="End time">
        <input 
          type="time" 
          className="input" 
          value={settings.end_time} 
          onChange={(e) => onChange({ ...settings, end_time: e.target.value })} 
        />
      </Field>
      <Field label="Description" full>
        <textarea 
          className="input min-h-[120px]" 
          value={settings.description ?? ""} 
          onChange={(e) => onChange({ ...settings, description: e.target.value })}
          placeholder="Describe your event..."
        />
      </Field>
    </div>
  );
}

function VenueRooms({ settings, onChange }: Props) {
  const addRoom = () => {
    const newRoom: Room = {
      id: crypto.randomUUID(),
      name: `Room ${settings.venue.rooms.length + 1}`,
      capacity: undefined
    };
    onChange({
      ...settings,
      venue: { 
        ...settings.venue, 
        rooms: [...settings.venue.rooms, newRoom] 
      },
    });
  };

  const editRoom = (id: string, patch: Partial<Room>) =>
    onChange({ 
      ...settings, 
      venue: { 
        ...settings.venue, 
        rooms: settings.venue.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) 
      } 
    });

  const removeRoom = (id: string) =>
    onChange({ 
      ...settings, 
      venue: { 
        ...settings.venue, 
        rooms: settings.venue.rooms.filter((r) => r.id !== id) 
      } 
    });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Venue name">
          <input 
            className="input" 
            value={settings.venue.name} 
            onChange={(e) => onChange({ ...settings, venue: { ...settings.venue, name: e.target.value } })}
            placeholder="Enter venue name"
          />
        </Field>
        <Field label="Capacity">
          <input 
            type="number" 
            className="input" 
            value={settings.venue.capacity ?? ""} 
            onChange={(e) => onChange({ ...settings, venue: { ...settings.venue, capacity: toNum(e.target.value) } })}
            placeholder="Total capacity"
          />
        </Field>
        <Field label="Address">
          <input 
            className="input" 
            value={settings.venue.address ?? ""} 
            onChange={(e) => onChange({ ...settings, venue: { ...settings.venue, address: e.target.value } })}
            placeholder="Venue address"
          />
        </Field>
        <Field label="Map URL">
          <input 
            className="input" 
            value={settings.venue.map_url ?? ""} 
            onChange={(e) => onChange({ ...settings, venue: { ...settings.venue, map_url: e.target.value } })}
            placeholder="Google Maps or other map URL"
          />
        </Field>
      </div>

      <div>
        <div className="mb-2 font-semibold">Rooms</div>
        {settings.venue.rooms.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No rooms added yet. Add rooms to organize your event space.
          </div>
        ) : (
          <div className="space-y-2">
            {settings.venue.rooms.map((room) => (
              <div key={room.id} className="grid items-end gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-4">
                <Field label="Name">
                  <input 
                    className="input" 
                    value={room.name} 
                    onChange={(e) => editRoom(room.id, { name: e.target.value })}
                    placeholder="Room name"
                  />
                </Field>
                <Field label="Capacity">
                  <input 
                    type="number" 
                    className="input" 
                    value={room.capacity ?? ""} 
                    onChange={(e) => editRoom(room.id, { capacity: toNum(e.target.value) })}
                    placeholder="Room capacity"
                  />
                </Field>
                <div className="md:col-span-2 flex justify-end">
                  <Button variant="secondary" onClick={() => removeRoom(room.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3">
          <Button onClick={addRoom}>Add room</Button>
        </div>
      </div>
    </div>
  );
}

function LayoutSeating({ settings, onChange }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Layout template ID">
        <input 
          className="input" 
          value={settings.seating_rules.layout_template_id ?? ""} 
          onChange={(e) => onChange({ 
            ...settings, 
            seating_rules: { ...settings.seating_rules, layout_template_id: e.target.value } 
          })}
          placeholder="Template identifier"
        />
      </Field>
      <Field label="Default table size">
        <input 
          type="number" 
          className="input" 
          value={settings.seating_rules.table_size_default ?? ""} 
          onChange={(e) => onChange({ 
            ...settings, 
            seating_rules: { ...settings.seating_rules, table_size_default: toNum(e.target.value) } 
          })}
          placeholder="e.g. 8"
        />
      </Field>
      <Field label="Max per table">
        <input 
          type="number" 
          className="input" 
          value={settings.seating_rules.max_per_table ?? ""} 
          onChange={(e) => onChange({ 
            ...settings, 
            seating_rules: { ...settings.seating_rules, max_per_table: toNum(e.target.value) } 
          })}
          placeholder="e.g. 10"
        />
      </Field>
      <Field label="Aisle width (cm)">
        <input 
          type="number" 
          className="input" 
          value={settings.seating_rules.aisle_width ?? ""} 
          onChange={(e) => onChange({ 
            ...settings, 
            seating_rules: { ...settings.seating_rules, aisle_width: toNum(e.target.value) } 
          })}
          placeholder="e.g. 120"
        />
      </Field>
      <Toggle
        label="Keep groups together"
        checked={settings.seating_rules.keep_groups_together}
        onChange={(v) => onChange({ 
          ...settings, 
          seating_rules: { ...settings.seating_rules, keep_groups_together: v } 
        })}
      />
      <Toggle
        label="Separate dietary needs by table where possible"
        checked={settings.seating_rules.separate_dietary}
        onChange={(v) => onChange({ 
          ...settings, 
          seating_rules: { ...settings.seating_rules, separate_dietary: v } 
        })}
      />
      <div className="md:col-span-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        Changing seating rules won't move guests automatically. Re-run auto-seating from the Seating page.
      </div>
    </div>
  );
}

function GroupsTags({ settings, onChange }: Props) {
  const [groupInput, setGroupInput] = useState("");
  
  const addGroup = () => {
    const v = groupInput.trim();
    if (!v) return;
    if (!settings.groups.includes(v)) {
      onChange({ ...settings, groups: [...settings.groups, v] });
    }
    setGroupInput("");
  };
  
  const removeGroup = (g: string) => 
    onChange({ ...settings, groups: settings.groups.filter((x) => x !== g) });

  const addTag = (kind: "dietary" | "access", v: string) => {
    v = v.trim();
    if (!v) return;
    const tags = settings.tags[kind];
    if (!tags.includes(v)) {
      onChange({ 
        ...settings, 
        tags: { ...settings.tags, [kind]: [...tags, v] } 
      });
    }
  };
  
  const removeTag = (kind: "dietary" | "access", v: string) =>
    onChange({ 
      ...settings, 
      tags: { ...settings.tags, [kind]: settings.tags[kind].filter((x) => x !== v) } 
    });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card title="Groups">
        <div className="mb-2 flex gap-2">
          <input 
            className="input flex-1" 
            placeholder="Add group (e.g. VIP, Staff, Speakers)..." 
            value={groupInput} 
            onChange={(e) => setGroupInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addGroup()}
          />
          <Button onClick={addGroup}>Add</Button>
        </div>
        {settings.groups.length === 0 ? (
          <div className="text-sm text-slate-500 py-4">No groups added yet</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {settings.groups.map((g) => (
              <Chip key={g} onRemove={() => removeGroup(g)}>{g}</Chip>
            ))}
          </div>
        )}
      </Card>

      <Card title="Tags">
        <div className="mb-2 text-sm font-medium">Dietary Requirements</div>
        <TagEditor 
          items={settings.tags.dietary} 
          onAdd={(v) => addTag("dietary", v)} 
          onRemove={(v) => removeTag("dietary", v)}
          placeholder="Add dietary tag (e.g. Vegetarian, Gluten-free)..."
        />
        <div className="mt-4 mb-2 text-sm font-medium">Accessibility Needs</div>
        <TagEditor 
          items={settings.tags.access} 
          onAdd={(v) => addTag("access", v)} 
          onRemove={(v) => removeTag("access", v)}
          placeholder="Add accessibility tag (e.g. Wheelchair, Hearing)..."
        />
      </Card>
    </div>
  );
}

function VendorsRoles({ settings, onChange }: Props) {
  const addVendor = () => {
    const newVendor: Vendor = {
      id: crypto.randomUUID(),
      type: "OTHER",
      name: "",
      contact: ""
    };
    onChange({
      ...settings,
      vendors: [...settings.vendors, newVendor],
    });
  };
  
  const patchVendor = (id: string, patch: Partial<Vendor>) =>
    onChange({ 
      ...settings, 
      vendors: settings.vendors.map((v) => (v.id === id ? { ...v, ...patch } : v)) 
    });
  
  const removeVendor = (id: string) => 
    onChange({ ...settings, vendors: settings.vendors.filter((v) => v.id !== id) });

  return (
    <div className="grid gap-6">
      <Card title="Vendors">
        {settings.vendors.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No vendors added yet. Add vendors to manage your event suppliers.
          </div>
        ) : (
          <div className="space-y-4">
            {settings.vendors.map((vendor) => (
              <div key={vendor.id} className="grid items-end gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-4">
                <Field label="Type">
                  <select 
                    className="input" 
                    value={vendor.type} 
                    onChange={(e) => patchVendor(vendor.id, { type: e.target.value as VendorType })}
                  >
                    <option value="CATERING">Catering</option>
                    <option value="AV">AV/Tech</option>
                    <option value="LOGISTICS">Logistics</option>
                    <option value="OTHER">Other</option>
                  </select>
                </Field>
                <Field label="Name">
                  <input 
                    className="input" 
                    value={vendor.name} 
                    onChange={(e) => patchVendor(vendor.id, { name: e.target.value })}
                    placeholder="Vendor name"
                  />
                </Field>
                <Field label="Contact">
                  <input 
                    className="input" 
                    value={vendor.contact ?? ""} 
                    onChange={(e) => patchVendor(vendor.id, { contact: e.target.value })}
                    placeholder="Email or phone"
                  />
                </Field>
                <div className="flex justify-end">
                  <Button variant="secondary" onClick={() => removeVendor(vendor.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3">
          <Button onClick={addVendor}>Add vendor</Button>
        </div>
      </Card>

      <Card title="Roles (per event)">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Planner user IDs (comma separated)">
            <input 
              className="input" 
              value={settings.roles.planner_uids.join(", ")} 
              onChange={(e) => onChange({ 
                ...settings, 
                roles: { ...settings.roles, planner_uids: splitCsv(e.target.value) } 
              })}
              placeholder="user1, user2, user3"
            />
          </Field>
          <Field label="Vendor user IDs (comma separated)">
            <input 
              className="input" 
              value={settings.roles.vendor_uids.join(", ")} 
              onChange={(e) => onChange({ 
                ...settings, 
                roles: { ...settings.roles, vendor_uids: splitCsv(e.target.value) } 
              })}
              placeholder="vendor1, vendor2"
            />
          </Field>
        </div>
      </Card>
    </div>
  );
}

function CheckinKiosk({ settings, onChange }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Toggle 
        label="Enable check-in" 
        checked={settings.checkin.enabled} 
        onChange={(v) => onChange({ ...settings, checkin: { ...settings.checkin, enabled: v } })} 
      />
      <Field label="QR prefix">
        <input 
          className="input" 
          value={settings.checkin.qr_prefix ?? ""} 
          onChange={(e) => onChange({ ...settings, checkin: { ...settings.checkin, qr_prefix: e.target.value } })}
          placeholder="e.g. TC24"
        />
      </Field>
      <Field label="Kiosk PIN">
        <input 
          className="input" 
          value={settings.checkin.kiosk_pin ?? ""} 
          onChange={(e) => onChange({ ...settings, checkin: { ...settings.checkin, kiosk_pin: e.target.value } })}
          placeholder="4-digit PIN"
        />
      </Field>
      <Field label="Opens at">
        <input 
          type="time" 
          className="input" 
          value={settings.checkin.opens_at ?? ""} 
          onChange={(e) => onChange({ ...settings, checkin: { ...settings.checkin, opens_at: e.target.value } })} 
        />
      </Field>
      <Field label="Closes at">
        <input 
          type="time" 
          className="input" 
          value={settings.checkin.closes_at ?? ""} 
          onChange={(e) => onChange({ ...settings, checkin: { ...settings.checkin, closes_at: e.target.value } })} 
        />
      </Field>
      <Field label="Offline hint text" full>
        <textarea 
          className="input min-h-[100px]" 
          value={settings.checkin.offline_hint ?? ""} 
          onChange={(e) => onChange({ ...settings, checkin: { ...settings.checkin, offline_hint: e.target.value } })}
          placeholder="Message to show when check-in is offline"
        />
      </Field>
    </div>
  );
}

function Communications({ settings, onChange }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Field label="RSVP template ID">
        <input 
          className="input" 
          value={settings.comms.rsvp_template ?? ""} 
          onChange={(e) => onChange({ ...settings, comms: { ...settings.comms, rsvp_template: e.target.value } })}
          placeholder="Template ID"
        />
      </Field>
      <Field label="Reminder template ID">
        <input 
          className="input" 
          value={settings.comms.reminder_template ?? ""} 
          onChange={(e) => onChange({ ...settings, comms: { ...settings.comms, reminder_template: e.target.value } })}
          placeholder="Template ID"
        />
      </Field>
      <Field label="Day-of SMS template ID">
        <input 
          className="input" 
          value={settings.comms.day_of_sms_template ?? ""} 
          onChange={(e) => onChange({ ...settings, comms: { ...settings.comms, day_of_sms_template: e.target.value } })}
          placeholder="Template ID"
        />
      </Field>
      <div className="md:col-span-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        Templates support variables like {"{{guest.name}}"}, {"{{seat}}"}, {"{{map_url}}"}.
      </div>
    </div>
  );
}

function AccessPrivacy({ settings, onChange }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Accessibility statement" full>
        <textarea 
          className="input min-h-[120px]" 
          value={settings.accessibility.statement ?? ""} 
          onChange={(e) => onChange({ 
            ...settings, 
            accessibility: { ...settings.accessibility, statement: e.target.value } 
          })}
          placeholder="Describe accessibility features and accommodations..."
        />
      </Field>
      <Field label="Evacuation note" full>
        <textarea 
          className="input min-h-[120px]" 
          value={settings.accessibility.evacuation_note ?? ""} 
          onChange={(e) => onChange({ 
            ...settings, 
            accessibility: { ...settings.accessibility, evacuation_note: e.target.value } 
          })}
          placeholder="Emergency evacuation procedures..."
        />
      </Field>
      <Field label="Consent text" full>
        <textarea 
          className="input min-h-[120px]" 
          value={settings.privacy.consent_text ?? ""} 
          onChange={(e) => onChange({ 
            ...settings, 
            privacy: { ...settings.privacy, consent_text: e.target.value } 
          })}
          placeholder="Data collection and usage consent text..."
        />
      </Field>
      <Field label="Data retention (days)">
        <input 
          type="number" 
          className="input" 
          value={settings.privacy.retention_days ?? ""} 
          onChange={(e) => onChange({ 
            ...settings, 
            privacy: { ...settings.privacy, retention_days: toNum(e.target.value) } 
          })}
          placeholder="e.g. 90"
        />
      </Field>
    </div>
  );
}

function Integrations({ settings, onChange }: Props) {
  const enabled = settings.integrations?.sheet_sync?.enabled ?? false;
  const sheetId = settings.integrations?.sheet_sync?.sheet_id ?? "";
  
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Toggle
        label="Enable Google Sheet sync"
        checked={enabled}
        onChange={(v) => onChange({ 
          ...settings, 
          integrations: { sheet_sync: { enabled: v, sheet_id: sheetId } } 
        })}
      />
      <Field label="Sheet ID">
        <input 
          className="input" 
          value={sheetId} 
          onChange={(e) => onChange({ 
            ...settings, 
            integrations: { sheet_sync: { enabled, sheet_id: e.target.value } } 
          })}
          placeholder="Google Sheet ID"
        />
      </Field>
      <Field label="Caterer CSV preset">
        <input 
          className="input" 
          value={settings.exports.caterer_preset ?? ""} 
          onChange={(e) => onChange({ 
            ...settings, 
            exports: { ...settings.exports, caterer_preset: e.target.value } 
          })}
          placeholder="Preset name"
        />
      </Field>
      <Field label="Seating CSV preset">
        <input 
          className="input" 
          value={settings.exports.seating_preset ?? ""} 
          onChange={(e) => onChange({ 
            ...settings, 
            exports: { ...settings.exports, seating_preset: e.target.value } 
          })}
          placeholder="Preset name"
        />
      </Field>
    </div>
  );
}

function PublishSummary({ settings, issues, onPublish }: { settings: EventSettings; issues: string[]; onPublish: () => void }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-600">
        Review your settings before going live. Status: <span className="font-medium">{settings.status}</span>
      </div>
      {issues.length ? (
        <Card title="Issues to resolve">
          <ul className="list-disc pl-5 text-sm space-y-1">
            {issues.map((issue, index) => <li key={index}>{issue}</li>)}
          </ul>
        </Card>
      ) : (
        <Card title="All checks passed">
          <div className="text-green-700">Everything looks good! ✨</div>
        </Card>
      )}
      <div className="flex justify-end">
        <Button onClick={onPublish} disabled={issues.length > 0}>
          {settings.status === "PUBLISHED" ? "Update" : "Publish"}
        </Button>
      </div>
    </div>
  );
}

/* -------------------------- UI Components -------------------------- */

function TabBar({ current, onChange }: { current: Tab; onChange: (t: Tab) => void }) {
  const tabs: Tab[] = [
    "Overview","Basics","Venue & Rooms","Layout & Seating","Groups & Tags","Vendors & Roles",
    "Check-in & Kiosk","Communications","Accessibility & Privacy","Integrations","Publish",
  ];
  
  return (
    <div className="flex w-full snap-x overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${
            current === t ? "bg-blue-600 text-white" : "hover:bg-slate-50"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      {title && <div className="mb-3 font-semibold">{title}</div>}
      {children}
    </div>
  );
}

function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input 
        type="checkbox" 
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)} 
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-2 py-1 text-xs">
      {children}
      <button 
        className="text-slate-500 hover:text-slate-700 ml-1" 
        onClick={onRemove}
        type="button"
      >
        ✕
      </button>
    </span>
  );
}

function TagEditor({ 
  items, 
  onAdd, 
  onRemove, 
  placeholder 
}: { 
  items: string[]; 
  onAdd: (v: string) => void; 
  onRemove: (v: string) => void;
  placeholder: string;
}) {
  const [val, setVal] = useState("");
  
  const handleAdd = () => {
    onAdd(val);
    setVal("");
  };
  
  return (
    <div>
      <div className="mb-2 flex gap-2">
        <input 
          className="input flex-1" 
          placeholder={placeholder} 
          value={val} 
          onChange={(e) => setVal(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button onClick={handleAdd}>Add</Button>
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-slate-500 py-2">No tags added yet</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((t) => <Chip key={t} onRemove={() => onRemove(t)}>{t}</Chip>)}
        </div>
      )}
    </div>
  );
}

/* -------------------------- Utilities -------------------------- */

type Props = { 
  settings: EventSettings; 
  onChange: React.Dispatch<React.SetStateAction<EventSettings>> 
};

const toNum = (v: string) => (v === "" ? undefined : Number(v));
const splitCsv = (v: string) => v.split(",").map((x) => x.trim()).filter(Boolean);

const formatEventTime = (settings: EventSettings) => {
  if (!settings.date || !settings.start_time || !settings.end_time) {
    return "Not set";
  }
  
  const date = new Date(settings.date).toLocaleDateString();
  return `${date} ${settings.start_time} → ${settings.end_time}`;
};

function useValidation(settings: EventSettings) {
  return useMemo(() => {
    const errors: string[] = [];
    
    if (!settings.name.trim()) {
      errors.push("Event name is required");
    }
    
    if (!settings.date) {
      errors.push("Event date is required");
    }
    
    if (!settings.start_time || !settings.end_time) {
      errors.push("Start and end times are required");
    }
    
    if (settings.start_time && settings.end_time && settings.start_time >= settings.end_time) {
      errors.push("End time must be after start time");
    }
    
    if (!settings.venue.name.trim()) {
      errors.push("Venue name is required");
    }
    
    if (!settings.timezone) {
      errors.push("Timezone is required");
    }
    
    return errors;
  }, [settings]);

  
}
