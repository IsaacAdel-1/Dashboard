import { CartesianGrid, Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { axisProps } from "./axisProps";

// series: [{ key, label, color }]
export default function LineChart({ data, xKey = "label", series, height = 260, valueFormatter, tickFormatter, yDomain }) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsLineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--grid)" />
                <XAxis dataKey={xKey} {...axisProps} minTickGap={20} interval="preserveStartEnd" />
                <YAxis {...axisProps} axisLine={false} tickFormatter={tickFormatter} width={56} domain={yDomain} allowDecimals={false} />
                <Tooltip content={<ChartTooltip formatter={valueFormatter} />} cursor={{ stroke: "var(--axis)", strokeWidth: 1 }} />
                {series.map((s) => (
                    <Line
                        key={s.key}
                        type="monotone"
                        dataKey={s.key}
                        name={s.label}
                        stroke={s.color}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        dot={false}
                        activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2, fill: s.color }}
                    />
                ))}
            </RechartsLineChart>
        </ResponsiveContainer>
    );
}
