import type { EconomicEvent } from "@/lib/data/types";
import { EventsCard, JournalCard, RiskCard } from "./BottomCards";

export function BottomCards({ events }: { events: EconomicEvent[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
      <EventsCard events={events} />
      <JournalCard />
      <RiskCard />
    </div>
  );
}
