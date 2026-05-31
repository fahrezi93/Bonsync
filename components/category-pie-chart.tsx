"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface CategoryPieChartProps {
  data: Array<{ name: string; value: number }>;
}

const COLORS = ["#059669", "#10b981", "#34d399", "#047857", "#0f172a", "#64748b"];

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

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full h-full">
      <div className="w-[200px] h-[200px] shrink-0" style={{ position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              data={data} 
              dataKey="value" 
              nameKey="name" 
              innerRadius={60} 
              outerRadius={85} 
              paddingAngle={3}
              stroke="none"
              labelLine={false}
              label={(props) => {
                const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props as any;
                if (percent < 0.05) return null; // Sembunyikan label kalau terlalu kecil
                const RADIAN = Math.PI / 180;
                const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
                const x = Number(cx) + radius * Math.cos(-Number(midAngle) * RADIAN);
                const y = Number(cy) + radius * Math.sin(-Number(midAngle) * RADIAN);
                
                return (
                  <text 
                    x={x} 
                    y={y} 
                    fill="white" 
                    textAnchor="middle" 
                    dominantBaseline="central"
                    className="text-[11px] font-bold pointer-events-none"
                  >
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
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
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle" 
              className="text-xs font-bold text-slate-400 pointer-events-none"
            >
              Total
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Keterangan List Kategori */}
      <div className="flex flex-col gap-2.5 w-full max-w-[200px] overflow-y-auto custom-scrollbar max-h-[180px] sm:max-h-[200px]">
        {data.map((entry, index) => {
          const percent = total > 0 ? (entry.value / total) * 100 : 0;
          return (
            <div key={entry.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <div 
                  className="size-3 rounded-full shrink-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                />
                <span className="font-medium text-slate-700 truncate" title={entry.name}>
                  {entry.name}
                </span>
              </div>
              <span className="font-bold text-slate-900 shrink-0 ml-2">
                {percent.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

