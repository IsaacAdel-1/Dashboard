import { Area, AreaChart as RechartsAreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { axisProps } from "./axisProps";

/**
 * series: [{ key, label, color }]
 * valueFormatter formats tooltip values, tickFormatter formats the y-axis.
 */
export default function AreaChart({ data, xKey = "label", series, height = 260, valueFormatter, tickFormatter }) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsAreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--grid)" />
                <XAxis dataKey={xKey} {...axisProps} minTickGap={20} interval="preserveStartEnd" />
                <YAxis {...axisProps} axisLine={false} tickFormatter={tickFormatter} width={56} allowDecimals={false} />
                <Tooltip content={<ChartTooltip formatter={valueFormatter} />} cursor={{ stroke: "var(--axis)", strokeWidth: 1 }} />
                {series.map((s) => (
                    <Area
                        key={s.key}
                        type="monotone"
                        dataKey={s.key}
                        name={s.label}
                        stroke={s.color}
                        strokeWidth={2}
                        fill={s.color}
                        fillOpacity={0.1}
                        dot={false}
                        activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2, fill: s.color }}
                    />
                ))}
            </RechartsAreaChart>
        </ResponsiveContainer>
    );
}
