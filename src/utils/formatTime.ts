export const MAX_FOCUS_SECONDS = 43_200;

export function formatTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.min(Math.floor(totalSeconds), MAX_FOCUS_SECONDS));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}
