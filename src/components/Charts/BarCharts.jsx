import { Bar, BarChart as RechartsBarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { axisProps } from "./axisProps";

/**
 * Columns (vertical bars) or horizontal bars.
 *
 * orientation: "columns" (categories along the bottom) | "bars" (categories down the side)
 * series:      [{ key, label, color }]
 * showValues:  print the value at the bar tip (only for single-series ranked bars)
 */
export default function BarChart({
    data,
    xKey = "label",
    series,
    orientation = "columns",
    height = 260,
    valueFormatter = (v) => v,
    tickFormatter,
    categoryWidth = 110,
    showValues = false,
}) {
    const horizontal = orientation === "bars";

    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsBarChart
                data={data}
                layout={horizontal ? "vertical" : "horizontal"}
                margin={{ top: 8, right: showValues ? 56 : 12, left: 0, bottom: 0 }}
                barGap={2}
                barCategoryGap="24%"
            >
                {/* bars that carry their own value labels don't need a grid */}
                {!(horizontal && showValues) && <CartesianGrid horizontal={!horizontal} vertical={horizontal} stroke="var(--grid)" />}
                {horizontal ? (
                    <>
                        <XAxis type="number" {...axisProps} tickFormatter={tickFormatter} hide={showValues} />
                        <YAxis type="category" dataKey={xKey} {...axisProps} width={categoryWidth} interval={0} />
                    </>
                ) : (
                    <>
                        <XAxis dataKey={xKey} {...axisProps} minTickGap={8} />
                        <YAxis {...axisProps} axisLine={false} tickFormatter={tickFormatter} width={56} allowDecimals={false} />
                    </>
                )}
                <Tooltip content={<ChartTooltip formatter={valueFormatter} />} cursor={{ fill: "var(--hover)" }} />
                {series.map((s) => (
                    <Bar
                        key={s.key}
                        dataKey={s.key}
                        name={s.label}
                        fill={s.color}
                        maxBarSize={24}
                        radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                    >
                        {showValues && (
                            <LabelList
                                dataKey={s.key}
                                position={horizontal ? "right" : "top"}
                                formatter={valueFormatter}
                                fill="var(--ink-2)"
                                fontSize={12}
                            />
                        )}
                    </Bar>
                ))}
            </RechartsBarChart>
        </ResponsiveContainer>
    );
}
