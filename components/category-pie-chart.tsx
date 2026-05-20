"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface CategoryPieChartProps {
  data: Array<{ name: string; value: number }>;
}

const COLORS = ["#0f172a", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#f43f5e"];

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
         <p className="text-xs font-semibold text-slate-400 bg-slate-50 px-4 py-2 rounded-xl">Belum ada data</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie 
          data={data} 
          dataKey="value" 
          nameKey="name" 
          innerRadius={48} 
          outerRadius={75} 
          paddingAngle={3}
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} className="focus:outline-none hover:opacity-80 transition-opacity" />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => {
            const numeric = typeof value === "number" ? value : Number(value ?? 0);
            return idr.format(Number.isFinite(numeric) ? numeric : 0);
          }}
          contentStyle={{
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.05)",
            borderRadius: "16px",
            color: "#0f172a",
            boxShadow: "0 10px 25px rgba(0,0,0,0.05)"
          }}
          itemStyle={{
            color: "#0f172a",
            fontWeight: "bold",
            fontSize: "12px"
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

