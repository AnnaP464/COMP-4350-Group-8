export function getAvatarInitials(name?: string) {
  if (!name) return "";
  const [t1, t2] = name.trim().split(/\s+/);
  const first = t1?.charAt(0) ?? "";
  const second = t2 && t2.length >= 2 ? t2.charAt(1) : "";
  return (first + second).toUpperCase();
}

export function formatMonthYear(input: string | number | Date): string {
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return "";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]},${d.getFullYear()}`;
}
