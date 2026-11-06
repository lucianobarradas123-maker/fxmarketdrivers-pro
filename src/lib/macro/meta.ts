/** Metadados leves (sem lógica) para componentes do browser, como a barra superior. */
import snapshot from "@/data/macro-snapshot.json";
import type { DataMeta } from "@/lib/data/types";

export const MACRO_META: DataMeta = { source: snapshot.source, fetchedAt: snapshot.fetchedAt, kind: "fim-de-dia" };
