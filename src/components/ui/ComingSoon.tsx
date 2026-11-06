import { Card } from "./Card";
import { Disclaimer, PageHeader } from "./PageHeader";

export function ComingSoon({ title, stage, items }: { title: string; stage: string; items: string[] }) {
  return (
    <>
      <PageHeader title={title} subtitle={`Em construção · ${stage}`} />
      <Card className="fade-in flex flex-col gap-3">
        <h2 className="text-base font-semibold">O que vai aparecer aqui</h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-ink-2">
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </Card>
      <div className="flex-1" />
      <Disclaimer />
    </>
  );
}
