'use client';

import React, { useEffect, useRef } from 'react';
import type ApexChartsType from 'apexcharts';
import type { ApexOptions } from 'apexcharts';

let cachedApexPromise: Promise<typeof ApexChartsType> | null = null;

function loadApexCharts(): Promise<typeof ApexChartsType> {
  if (!cachedApexPromise) {
    cachedApexPromise = import('apexcharts').then((mod) => mod.default);
  }
  return cachedApexPromise;
}

interface ApexChartProps {
  options: ApexOptions;
  series: ApexOptions['series'];
  type: 'bar' | 'line' | 'area' | 'donut' | 'radialBar';
  height?: number;
  className?: string;
}

export const ApexChart = React.memo(function ApexChart({
  options,
  series,
  type,
  height = 280,
  className = '',
}: ApexChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ApexChartsType | null>(null);
  const mountedTypeRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    let rafId = 0;

    rafId = window.requestAnimationFrame(() => {
      void (async () => {
        if (!active || !containerRef.current) return;
        const ApexCharts = await loadApexCharts();
        if (!active || !containerRef.current) return;

        const baseOptions: ApexOptions = {
          ...options,
          chart: {
            background: 'transparent',
            fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif',
            toolbar: {
              show: true,
              tools: {
                download: true,
                selection: false,
                zoom: false,
                zoomin: false,
                zoomout: false,
                pan: false,
                reset: false,
              },
            },
            animations: {
              enabled: true,
              speed: 220,
              dynamicAnimation: { enabled: false },
            },
            ...options.chart,
            type,
            height,
          },
        };

        if (chartRef.current && mountedTypeRef.current === type) {
          await chartRef.current.updateOptions(baseOptions, false, false, false);
          if (active && series) {
            await chartRef.current.updateSeries(series, false);
          }
          return;
        }

        if (chartRef.current) {
          chartRef.current.destroy();
          chartRef.current = null;
        }

        const instance = new ApexCharts(containerRef.current, {
          ...baseOptions,
          series,
        });
        await instance.render();
        if (!active) {
          instance.destroy();
          return;
        }
        chartRef.current = instance;
        mountedTypeRef.current = type;
      })();
    });

    return () => {
      active = false;
      window.cancelAnimationFrame(rafId);
    };
  }, [options, series, type, height]);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
        mountedTypeRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className={className} />;
});
