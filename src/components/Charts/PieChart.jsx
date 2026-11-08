import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartTooltip from "./ChartTooltip";

/**
 * Donut chart for a part-to-whole split with a few (<= 6) parts.
 * data: [{ name, value, color }]
 * The total (or any headline) is printed in the hole.
 */
export default function PieChart({ data, height = 200, centerValue, centerLabel, valueFormatter }) {
    const hasData = data.some((d) => d.value > 0);

    return (
        <div className="relative w-full" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                    <Tooltip content={<ChartTooltip formatter={valueFormatter} />} />
                    <Pie
                        data={hasData ? data : [{ name: "No data", value: 1, color: "var(--line)" }]}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="70%"
                        outerRadius="100%"
                        startAngle={90}
                        endAngle={-270}
                        stroke="var(--surface)"
                        strokeWidth={2}
                        isAnimationActive={hasData}
                    >
                        {(hasData ? data : [{ name: "No data", color: "var(--line)" }]).map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                        ))}
                    </Pie>
                </RechartsPieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold text-ink">{centerValue}</span>
                {centerLabel && <span className="text-xs text-muted">{centerLabel}</span>}
            </div>
        </div>
    );
}
