"use client";

import { CandlestickSeries, createChart, LineSeries, LineStyle, type IChartApi, type UTCTimestamp } from "lightweight-charts";
import { useEffect, useRef } from "react";

export interface Frame {
  candles: { time: number; open: number; high: number; low: number; close: number }[];
  ema8: { time: number; value: number }[];
  ema21: { time: number; value: number }[];
}
export interface ChartLevel {
  price: number;
  touches: number;
  kind: "suporte" | "resistência";
}

// Cores do estilo aprovado (D13/D14): azul = subida, laranja = descida.
const C = {
  bg: "#121820",
  grid: "#1a222c",
  text: "#93a0af",
  up: "#5aa9ff",
  down: "#f5a04a",
  ema8: "#e7ecf2",
  ema21: "#c084fc",
  sup: "#9cc8ff",
  res: "#f5c28a",
};

export function PairChart({ frame, levels, digits }: { frame: Frame; levels: ChartLevel[]; digits: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      autoSize: true,
      layout: { background: { color: C.bg }, textColor: C.text, fontFamily: "var(--font-plex-mono), monospace", attributionLogo: true },
      grid: { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
      rightPriceScale: { borderColor: C.grid },
      timeScale: { borderColor: C.grid, timeVisible: true, secondsVisible: false },
      localization: { locale: "pt-PT" },
      crosshair: { mode: 0 },
    });
    chartRef.current = chart;
    const fmt = { type: "price" as const, precision: digits, minMove: 1 / 10 ** digits };
    const candles = chart.addSeries(CandlestickSeries, {
      upColor: C.up,
      downColor: C.down,
      borderVisible: false,
      wickUpColor: C.up,
      wickDownColor: C.down,
      priceFormat: fmt,
    });
    candles.setData(frame.candles.map((c) => ({ ...c, time: c.time as UTCTimestamp })));
    const e8 = chart.addSeries(LineSeries, { color: C.ema8, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, title: "EMA 8", priceFormat: fmt });
    e8.setData(frame.ema8.map((p) => ({ ...p, time: p.time as UTCTimestamp })));
    const e21 = chart.addSeries(LineSeries, { color: C.ema21, lineWidth: 2, priceLineVisible: false, lastValueVisible: false, title: "EMA 21", priceFormat: fmt });
    e21.setData(frame.ema21.map((p) => ({ ...p, time: p.time as UTCTimestamp })));
    for (const l of levels) {
      candles.createPriceLine({
        price: l.price,
        color: l.kind === "suporte" ? C.sup : C.res,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `${l.kind === "suporte" ? "S" : "R"} ×${l.touches}`,
      });
    }
    chart.timeScale().fitContent();
    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [frame, levels, digits]);

  return <div ref={ref} className="h-[420px] w-full sm:h-[520px]" role="img" aria-label="Gráfico de velas com médias móveis EMA 8 e 21 e linhas de suporte e resistência" />;
}
