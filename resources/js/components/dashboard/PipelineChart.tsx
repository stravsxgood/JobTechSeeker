import React, { useState } from 'react';

interface StatusItem {
    label: string;
    count: number;
    is_active: boolean;
}

interface PipelineChartProps {
    statusDistribution: Record<string, StatusItem>;
    totalApplications: number;
}

const STATUS_COLORS: Record<string, string> = {
    saved: '#7c7c7c',
    applied: '#6798ff',
    screening: '#38bdf8',
    assessment: '#a78bfa',
    interview: '#f59e0b',
    offer: '#34d399',
    rejected: '#f87171',
    withdrawn: '#454545',
};

export function PipelineChart({ statusDistribution, totalApplications }: PipelineChartProps) {
    const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);

    const items = Object.entries(statusDistribution).filter(([, item]) => item.count > 0);
    const totalCount = totalApplications > 0 ? totalApplications : 1;

    return (
        <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-5">
            <div className="flex items-center justify-between">
                <div>
                    <span className="font-mono text-[11px] uppercase tracking-[0.85px] text-[#a7a7a7]">
                        DISTRIBUSI PIPELINE
                    </span>
                    <h3 className="text-[16px] font-semibold text-[#ffffff] tracking-[-0.2px]">
                        Status Lamaran Real-Time
                    </h3>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#a7a7a7]">
                    <span className="h-2 w-2 rounded-full bg-[#34d399] animate-pulse" />
                    <span>Sinkron</span>
                </div>
            </div>

            {/* Visual Progress Bar Strip */}
            <div className="mt-4">
                <div className="flex h-3 w-full overflow-hidden rounded-[4px] bg-[#1e1e1e] border border-[#313131]/60">
                    {items.length === 0 ? (
                        <div className="h-full w-full bg-[#1e1e1e]" />
                    ) : (
                        items.map(([key, item]) => {
                            const widthPercent = (item.count / totalCount) * 100;
                            const color = STATUS_COLORS[key] || '#6798ff';
                            const isHovered = hoveredStatus === key;

                            return (
                                <div
                                    key={key}
                                    style={{
                                        width: `${widthPercent}%`,
                                        backgroundColor: color,
                                        opacity: hoveredStatus && !isHovered ? 0.35 : 1,
                                    }}
                                    onMouseEnter={() => setHoveredStatus(key)}
                                    onMouseLeave={() => setHoveredStatus(null)}
                                    className="h-full transition-all duration-200 cursor-pointer"
                                    title={`${item.label}: ${item.count} (${widthPercent.toFixed(1)}%)`}
                                />
                            );
                        })
                    )}
                </div>
            </div>

            {/* Hover details or active breakdown */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {Object.entries(statusDistribution).map(([key, item]) => {
                    const color = STATUS_COLORS[key] || '#6798ff';
                    const percent = totalApplications > 0 ? ((item.count / totalApplications) * 100).toFixed(0) : '0';
                    const isHovered = hoveredStatus === key;

                    return (
                        <div
                            key={key}
                            onMouseEnter={() => setHoveredStatus(key)}
                            onMouseLeave={() => setHoveredStatus(null)}
                            className={`flex items-center justify-between rounded-[6px] border p-2.5 transition-colors cursor-pointer ${
                                isHovered
                                    ? 'border-[#6798ff] bg-[#1e1e1e]'
                                    : 'border-[#313131]/60 bg-[#0a0a0a]/60 hover:bg-[#1e1e1e]/60'
                            }`}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <span
                                    className="h-2 w-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="truncate text-[12px] text-[#a7a7a7]">
                                    {item.label}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-1 shrink-0 font-mono">
                                <span className="text-[13px] font-semibold text-[#ffffff]">
                                    {item.count}
                                </span>
                                <span className="text-[10px] text-[#7c7c7c]">
                                    ({percent}%)
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
