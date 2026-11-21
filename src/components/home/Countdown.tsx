import { useEffect, useState } from "react";
import { useHydrated } from "@tanstack/react-router";

function untilMidnight() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const s = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60];
}

export function Countdown() {
  const hydrated = useHydrated();
  const [t, setT] = useState<number[]>([0, 0, 0]);
  useEffect(() => {
    setT(untilMidnight());
    const id = setInterval(() => setT(untilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex gap-2" aria-label="Time left in today's offer" role="timer">
      {["Hours", "Mins", "Secs"].map((label, i) => (
        <div key={label} className="min-w-16 rounded-xl bg-navy-foreground/10 px-3 py-2 text-center backdrop-blur">
          <div className="text-2xl font-extrabold tabular-nums">{hydrated ? String(t[i] ?? 0).padStart(2, "0") : "--"}</div>
          <div className="text-[10px] uppercase tracking-widest text-navy-foreground/70">{label}</div>
        </div>
      ))}
    </div>
  );
}
