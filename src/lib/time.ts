/** Horas: o utilizador escreve em hora de Lisboa; a base de dados guarda em UTC. */
export const TZ = "Europe/Lisbon";

function offsetMinutes(utcMs: number, timeZone = TZ): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(utcMs))
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return Math.round((asUtc - utcMs) / 60000);
}

/** "2026-11-06T13:30" (hora de Lisboa) → Date em UTC. Trata a mudança de hora. */
export function lisbonToUtc(local: string): Date {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) throw new Error("Data/hora inválida");
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let ms = guess - offsetMinutes(guess) * 60000;
  ms = guess - offsetMinutes(ms) * 60000;
  return new Date(ms);
}

/** Date → "2026-11-06T13:30" em hora de Lisboa (para preencher campos de formulário). */
export function utcToLisbonInput(d: Date): string {
  const local = new Date(d.getTime() + offsetMinutes(d.getTime()) * 60000);
  return local.toISOString().slice(0, 16);
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(iso));
}

export function formatDay(iso: string) {
  return new Intl.DateTimeFormat("pt-PT", { weekday: "long", day: "numeric", month: "long", timeZone: TZ }).format(new Date(iso));
}

export function dayKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
}
