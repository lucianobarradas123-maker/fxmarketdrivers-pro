"use client";

import { createChart, LineSeries, LineStyle, type IChartApi, type Time } from "lightweight-charts";
import { useEffect, useRef } from "react";

export interface LineDef {
  name: string;
  color: string;
  width?: 1 | 2 | 3;
  dashed?: boolean;
  data: { time: string; value: number }[]; // time = AAAA-MM-DD
}
export interface HLine {
  value: number;
  color: string;
  label: string;
}

/** Gráfico de linhas (várias séries) com linhas horizontais de referência opcionais. */
export function LineChart({
  lines,
  hlines = [],
  height = 360,
  precision = 1,
  suffix = "",
  ariaLabel,
}: {
  lines: LineDef[];
  hlines?: HLine[];
  height?: number;
  precision?: number;
  suffix?: string;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      autoSize: true,
      layout: { background: { color: "#121820" }, textColor: "#93a0af", fontFamily: "var(--font-plex-mono), monospace", attributionLogo: true },
      grid: { vertLines: { color: "#1a222c" }, horzLines: { color: "#1a222c" } },
      rightPriceScale: { borderColor: "#1a222c" },
      timeScale: { borderColor: "#1a222c" },
      localization: { locale: "pt-PT", priceFormatter: (p: number) => `${p.toFixed(precision).replace(".", ",")}${suffix}` },
      crosshair: { mode: 0 },
    });
    chartRef.current = chart;
    lines.forEach((l, i) => {
      const s = chart.addSeries(LineSeries, {
        color: l.color,
        lineWidth: l.width ?? 2,
        lineStyle: l.dashed ? LineStyle.Dashed : LineStyle.Solid,
        priceLineVisible: false,
        lastValueVisible: true,
        title: l.name,
      });
      s.setData(l.data.map((p) => ({ time: p.time as Time, value: p.value })));
      if (i === 0)
        for (const h of hlines)
          s.createPriceLine({ price: h.value, color: h.color, lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: false, title: h.label });
    });
    chart.timeScale().fitContent();
    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [lines, hlines, precision, suffix]);

  return <div ref={ref} style={{ height }} className="w-full" role="img" aria-label={ariaLabel} />;
}
