/*-----------------------------------------------------------------
 Used by MyAttendance.tsx page
 Displays the hours and minutes attended as a hour, minute string
 
 If hr is 0    , display only mins (eg: 45mins)
 If hr is non 0, display hrs, mins (eg: 1hr 45mins)
-------------------------------------------------------------------*/

export default function formatMinutes(totalMinutes: number): string {
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (mins === 0) {
    return `${hours} hr${hours > 1 ? "s" : ""}`;
  }

  return `${hours} hr${hours > 1 ? "s" : ""} ${mins} min`;
}
