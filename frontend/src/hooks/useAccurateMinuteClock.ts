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
