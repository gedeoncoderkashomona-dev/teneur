'use client';

import React, { useEffect, useRef } from 'react';
import type ApexChartsType from 'apexcharts';
import type { ApexOptions } from 'apexcharts';

interface ApexChartProps {
  options: ApexOptions;
  series: ApexOptions['series'];
  type: 'bar' | 'line' | 'area' | 'donut' | 'radialBar';
  height?: number;
  className?: string;
}

export function ApexChart({
  options,
  series,
  type,
  height = 280,
  className = '',
}: ApexChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ApexChartsType | null>(null);

  useEffect(() => {
    let mounted = true;

    async function mountChart() {
      if (!containerRef.current) return;
      const ApexChartsModule = await import('apexcharts');
      if (!mounted || !containerRef.current) return;

      const ApexCharts = ApexChartsModule.default;
      const mergedOptions: ApexOptions = {
        ...options,
        chart: {
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
            speed: 380,
          },
          ...options.chart,
          type,
          height,
        },
        series,
      };

      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      const instance = new ApexCharts(containerRef.current, mergedOptions);
      await instance.render();
      if (!mounted) {
        instance.destroy();
        return;
      }
      chartRef.current = instance;
    }

    void mountChart();

    return () => {
      mounted = false;
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [options, series, type, height]);

  return <div ref={containerRef} className={className} />;
}
