import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import { useT } from "@/lib/lang-context";
import type { Anchor, AnchorReminder } from "@/lib/storage";

interface AnchorReminderSheetProps {
  anchor: Anchor | null;
  open: boolean;
  onClose: () => void;
  onSave: (anchor: Anchor, reminder: AnchorReminder | undefined) => Promise<void>;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function AnchorReminderSheet({ anchor, open, onClose, onSave }: AnchorReminderSheetProps) {
  const t = useT();

  const existing = anchor?.reminder;
  const [enabled, setEnabled] = useState(existing?.enabled ?? true);
  const [days, setDays] = useState<number[]>(existing?.days ?? []);
  const [hour, setHour] = useState(existing?.hour ?? 20);
  const [minute, setMinute] = useState(existing?.minute ?? 0);
  const [saving, setSaving] = useState(false);

  // Re-initialise when the anchor changes
  function resetToAnchor() {
    const r = anchor?.reminder;
    setEnabled(r?.enabled ?? true);
    setDays(r?.days ?? []);
    setHour(r?.hour ?? 20);
    setMinute(r?.minute ?? 0);
  }

  function toggleDay(d: number) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );
  }

  async function handleSave() {
    if (!anchor) return;
    setSaving(true);
    try {
      const reminder: AnchorReminder = { enabled, days, hour, minute };
      await onSave(anchor, reminder);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!anchor) return;
    setSaving(true);
    try {
      await onSave(anchor, undefined);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  // Friendly summary of selected days
  function daysSummary() {
    if (days.length === 0) return t.reminder.everyday;
    return days.map((d) => t.reminder.days[d]).join(", ");
  }

  // 12-hour format for display
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? "AM" : "PM";
  const timeValue = `${pad2(hour)}:${pad2(minute)}`;

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
        else resetToAnchor();
      }}
    >
      <DrawerContent className="px-4 pb-8">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center gap-2">
            <span className="text-xl">{anchor?.emoji ?? "⚓"}</span>
            <span>{t.reminder.title}</span>
          </DrawerTitle>
          {anchor && (
            <p className="text-sm text-muted-foreground mt-0.5">{anchor.name}</p>
          )}
        </DrawerHeader>

        <div className="space-y-6 mt-2">
          {/* Days of week */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Days
            </p>
            <div className="flex gap-2 flex-wrap">
              {t.reminder.days.map((label: string, i: number) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    days.includes(i)
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:border-emerald-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {days.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                ✓ {t.reminder.everyday}
              </p>
            )}
          </div>

          {/* Time */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              {t.reminder.timeLabel}
            </p>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={timeValue}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  if (!isNaN(h)) setHour(h);
                  if (!isNaN(m)) setMinute(m);
                }}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-base font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
              />
              <span className="text-sm text-muted-foreground">
                {displayHour}:{pad2(minute)} {ampm}
              </span>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-2xl px-4 py-3">
            <p className="text-sm text-gray-700">
              🔔 {t.reminder.reminderSummary(daysSummary(), `${displayHour}:${pad2(minute)} ${ampm}`)}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {anchor?.reminder && (
              <button
                onClick={handleRemove}
                disabled={saving}
                className="flex-1 py-3 rounded-2xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {t.reminder.removeReminder}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-[2] py-3 rounded-2xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 shadow-md"
            >
              {saving ? "…" : t.reminder.save}
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
