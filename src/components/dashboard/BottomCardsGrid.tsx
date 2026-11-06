import { EventsCard, JournalCard, RiskCard } from "./BottomCards";

export function BottomCards() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
      <EventsCard />
      <JournalCard />
      <RiskCard />
    </div>
  );
}
