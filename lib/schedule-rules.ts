export function scheduleIsDue(schedule: { is_active: boolean; start_date: string | null; end_date: string | null; frequency?: string | null }, dateKey: string) {
  if (!schedule.is_active || (schedule.start_date && schedule.start_date > dateKey) || (schedule.end_date && schedule.end_date < dateKey)) return false;
  if (schedule.frequency === "weekly") {
    if (!schedule.start_date) return false;
    return (Date.parse(dateKey) - Date.parse(schedule.start_date)) % (7 * 86400000) === 0;
  }
  return !schedule.frequency || schedule.frequency === "daily";
}
