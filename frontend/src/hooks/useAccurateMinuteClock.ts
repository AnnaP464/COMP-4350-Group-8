/*--------------------------------------------------------------------------------------------
Used by MyAttendance.tsx

useState(Data.now()) sets nowMS to current timestamp
useEffect runs onces and calls scheduleNextTick() and sets a timeout for the next full minute
When timeout fires, setNowMs updates React state of MyAttendance, and MyAttendance re-renders to show live time update
---------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";

export default function useAccurateMinuteClock() {
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    function scheduleNextTick() {
      const now = Date.now();
      const msToNextMinute = 60000 - (now % 60000); 
      // e.g. if time is 12:03:12.500 → next tick in 47,500ms

      setTimeout(() => {
        setNowMs(Date.now());
        scheduleNextTick(); // schedule again for next minute
      }, msToNextMinute);
    }

    scheduleNextTick();
  }, []);

  return nowMs;
}
