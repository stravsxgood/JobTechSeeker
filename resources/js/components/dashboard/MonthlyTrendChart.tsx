import React, { useState } from 'react';

interface MonthlyItem {
    month: string;
    label: string;
    count: number;
}

interface MonthlyTrendChartProps {
    monthlyTrend: MonthlyItem[];
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export function MonthlyTrendChart({
    monthlyTrend,
    onRefresh,
    isRefreshing = false,
}: MonthlyTrendChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const counts = monthlyTrend.map((m) => m.count);
    const maxCount = Math.max(...counts, 5);
    const totalSent = counts.reduce((acc, c) => acc + c, 0);

    // SVG coordinate parameters
    const svgHeight = 160;
    const svgWidth = 500;
    const paddingX = 30;
    const paddingY = 24;
    const usableWidth = svgWidth - paddingX * 2;
    const usableHeight = svgHeight - paddingY * 2;

    const points = monthlyTrend.map((item, idx) => {
        const x =
            paddingX +
            (usableWidth / Math.max(monthlyTrend.length - 1, 1)) * idx;
        const y =
            paddingY + usableHeight - (item.count / maxCount) * usableHeight;
        return { x, y, ...item };
    });

    const pathD =
        points.length > 0
            ? points.reduce(
                  (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`,
                  '',
              )
            : '';

    const areaD =
        points.length > 0
            ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
            : '';

    return (
        <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-5">
            <div className="flex items-center justify-between">
                <div>
                    <span className="font-mono text-[11px] tracking-[0.85px] text-[#a7a7a7] uppercase">
                        AKTIVITAS & TREN
                    </span>
                    <h3 className="text-[16px] font-semibold tracking-[-0.2px] text-[#ffffff]">
                        Tren Lamaran 6 Bulan Terakhir
                    </h3>
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-mono text-[12px] text-[#6798ff]">
                        {totalSent} Total Lamaran
                    </span>
                    {onRefresh && (
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            aria-label="Segarkan data grafik"
                            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#313131] bg-[#1e1e1e] text-[#a7a7a7] transition-colors hover:border-[#6798ff] hover:text-[#ffffff] focus-visible:ring-1 focus-visible:ring-[#6798ff] focus-visible:outline-none disabled:opacity-50"
                        >
                            <svg
                                className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#6798ff]' : ''}`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="23 4 23 10 17 10" />
                                <polyline points="1 20 1 14 7 14" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* SVG Trend Graph (Dovetail Midnight Blueprint) */}
            <div className="mt-4 w-full overflow-hidden">
                <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="h-44 w-full overflow-visible"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient
                            id="trendGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="#6798ff"
                                stopOpacity="0.28"
                            />
                            <stop
                                offset="100%"
                                stopColor="#6798ff"
                                stopOpacity="0.0"
                            />
                        </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    {[0, 0.5, 1].map((ratio) => {
                        const y = paddingY + usableHeight * (1 - ratio);
                        return (
                            <line
                                key={ratio}
                                x1={paddingX}
                                y1={y}
                                x2={svgWidth - paddingX}
                                y2={y}
                                stroke="#313131"
                                strokeDasharray="3 3"
                                strokeWidth="0.8"
                            />
                        );
                    })}

                    {/* Area under curve */}
                    {areaD && <path d={areaD} fill="url(#trendGradient)" />}

                    {/* Line path */}
                    {pathD && (
                        <path
                            d={pathD}
                            fill="none"
                            stroke="#6798ff"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}

                    {/* Data Points */}
                    {points.map((p, idx) => {
                        const isHovered = hoveredIndex === idx;
                        return (
                            <g key={p.month}>
                                <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={isHovered ? 6 : 4}
                                    fill="#0a0a0a"
                                    stroke="#6798ff"
                                    strokeWidth={isHovered ? 2.5 : 1.75}
                                    className="cursor-pointer transition-all"
                                    onMouseEnter={() => setHoveredIndex(idx)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                />
                                {isHovered && (
                                    <text
                                        x={p.x}
                                        y={p.y - 10}
                                        textAnchor="middle"
                                        fill="#ffffff"
                                        fontSize="11"
                                        fontFamily="monospace"
                                        fontWeight="bold"
                                    >
                                        {p.count}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* X-Axis Month Labels */}
                <div className="flex justify-between border-t border-[#313131] px-4 pt-2 font-mono text-[11px] text-[#a7a7a7]">
                    {monthlyTrend.map((m) => (
                        <span key={m.month}>{m.label}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}
