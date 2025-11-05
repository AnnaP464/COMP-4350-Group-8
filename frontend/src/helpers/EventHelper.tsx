export type CleanEvent = {
  id: string;
  jobName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  createdAtDate: string;
  createdAtTime: string;
};

export function cleanEvents(rawEvents: any[], upComingOnly: boolean): CleanEvent[] {
  const result: CleanEvent[] = [];
  for (const event of rawEvents) {
    const item = cleanEvent(event, upComingOnly);
    if (item) result.push(item);
  }
  return result;
}

export function cleanEvent(rawEvent: any, upComingOnly: boolean){
  const startTime = new Date(rawEvent.startTime);
  const endTime = new Date(rawEvent.endTime);
  const createdAtTime = new Date(rawEvent.createdAt);
  const timeZone = "America/Winnipeg"

  if(upComingOnly && startTime.getTime() < Date.now()){
      return null;
  }
  else{
    return {
      id: rawEvent.id,
      jobName: (rawEvent.jobName || "").trim(),
      startDate: startTime.toLocaleDateString("en-CA", {
        timeZone: timeZone, year: "numeric", month: "short", day: "2-digit"
      }),
      endDate: endTime.toLocaleDateString("en-CA", {
        timeZone: timeZone, year: "numeric", month: "short", day: "2-digit"
      }),
      startTime: startTime.toLocaleTimeString("en-CA", {
        timeZone: timeZone, hour: "numeric", minute: "2-digit", hour12: true
      }),
      endTime: endTime.toLocaleTimeString("en-CA", {
        timeZone: timeZone, hour: "numeric", minute: "2-digit", hour12: true
      }),
      location: (rawEvent.location || "").trim(),
      description: (rawEvent.description || "").trim(),
      createdAtDate: createdAtTime.toLocaleDateString("en-Ca", {
        timeZone: timeZone, year: "numeric", month: "short", day: "2-digit"
      }),
      createdAtTime: createdAtTime.toLocaleTimeString("en-Ca", {
        timeZone: timeZone, hour: "numeric", minute: "2-digit", hour12: true
      })
    };
  }
}