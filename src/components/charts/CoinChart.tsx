'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, AreaData, Time, ColorType, CandlestickSeries, AreaSeries } from 'lightweight-charts';
import { ChartDataPoint, TimePeriod } from '@/hooks/useCoinChart';
import { TrendingUp, CandlestickChart, AlertCircle, RefreshCw } from 'lucide-react';

interface CoinChartProps {
  data: ChartDataPoint[];
  height?: number;
  showControls?: boolean;
  timePeriod?: TimePeriod;
  onTimePeriodChange?: (period: TimePeriod) => void;
  error?: string | null;
  onRetry?: () => void;
  isLoading?: boolean;
}

type ChartType = 'candlestick' | 'area';

export function CoinChart({ data, height = 400, showControls = true, timePeriod = '7d', onTimePeriodChange, error, onRetry, isLoading: isLoadingProp }: CoinChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Area'> | null>(null);
  const [chartType, setChartType] = useState<ChartType>('area');

  // Derive loading state from data or explicit prop
  const isLoading = isLoadingProp !== undefined ? isLoadingProp : data.length === 0;

  // Time period options
  const timePeriods: { value: TimePeriod; label: string }[] = [
    { value: '24h', label: '24H' },
    { value: '7d', label: '7D' },
    { value: '1m', label: '1M' },
    { value: '3m', label: '3M' },
    { value: '1y', label: '1Y' },
  ];

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Determine if price is going up or down
    const isPositive = data.length >= 2 && data[data.length - 1].close >= data[0].open;

    // Create chart with enhanced styling
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748b',
      },
      grid: {
        vertLines: { 
          color: 'rgba(255, 255, 255, 0.03)',
          style: 1,
        },
        horzLines: { 
          color: 'rgba(255, 255, 255, 0.03)',
          style: 1,
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderVisible: false,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'rgba(138, 99, 255, 0.5)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#8a63ff',
        },
        horzLine: {
          color: 'rgba(138, 99, 255, 0.5)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#8a63ff',
        },
      },
    });

    chartRef.current = chart;

    // Create series based on type
    if (chartType === 'candlestick') {
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#f43f5e',
        borderUpColor: '#10b981',
        borderDownColor: '#f43f5e',
        wickUpColor: '#10b981',
        wickDownColor: '#f43f5e',
      });

      const chartData: CandlestickData<Time>[] = data.map((d) => ({
        time: d.time as Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

      candlestickSeries.setData(chartData);
      seriesRef.current = candlestickSeries;
    } else {
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: isPositive ? '#8a63ff' : '#f43f5e',
        topColor: isPositive ? 'rgba(138, 99, 255, 0.4)' : 'rgba(244, 63, 94, 0.4)',
        bottomColor: isPositive ? 'rgba(138, 99, 255, 0.0)' : 'rgba(244, 63, 94, 0.0)',
        lineWidth: 2,
        priceLineVisible: false,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 6,
        crosshairMarkerBorderColor: isPositive ? '#8a63ff' : '#f43f5e',
        crosshairMarkerBackgroundColor: isPositive ? '#8a63ff' : '#f43f5e',
      });

      const areaData: AreaData<Time>[] = data.map((d) => ({
        time: d.time as Time,
        value: d.close,
      }));

      areaSeries.setData(areaData);
      seriesRef.current = areaSeries;
    }

    // Fit content with slight padding
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, height, chartType]);

  const handleChartTypeChange = (type: ChartType) => {
    setChartType(type);
  };

  return (
    <div className="relative w-full">
      {/* Compact Controls Row */}
      {showControls && (
        <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
          {/* Time Period Selector */}
          {onTimePeriodChange && (
            <div className="inline-flex items-center rounded-lg bg-bg-tertiary p-0.5 gap-0.5">
              {timePeriods.map((period) => (
                <button
                  key={period.value}
                  onClick={() => onTimePeriodChange(period.value)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    timePeriod === period.value
                      ? 'bg-brand-primary text-bg-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          )}

          {/* Chart Type Pills - Icon Based */}
          <div className="inline-flex items-center rounded-full bg-bg-tertiary p-1 gap-1">
            <button
              onClick={() => handleChartTypeChange('area')}
              className={`p-1.5 rounded-full transition-all ${
                chartType === 'area'
                  ? 'bg-brand-primary text-bg-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
              }`}
              title="Area Chart"
            >
              <TrendingUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleChartTypeChange('candlestick')}
              className={`p-1.5 rounded-full transition-all ${
                chartType === 'candlestick'
                  ? 'bg-brand-primary text-bg-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
              }`}
              title="Candlestick Chart"
            >
              <CandlestickChart className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Chart Container with enhanced styling */}
      <div className="relative rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-4 backdrop-blur-sm border border-white/5 shadow-2xl overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
        
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Error state */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded-2xl z-10">
            <div className="flex flex-col items-center gap-3 max-w-sm text-center px-4">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <p className="text-sm text-gray-300">{error}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-2 px-4 py-2 bg-brand-primary hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try again
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded-2xl z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading chart...</p>
            </div>
          </div>
        )}

        {/* Chart */}
        <div ref={chartContainerRef} className="w-full relative z-0" />
      </div>

      
    </div>
  );
}