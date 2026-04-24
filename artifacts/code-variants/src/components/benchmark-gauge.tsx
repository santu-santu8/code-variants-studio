import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface BenchmarkGaugeProps {
  timeComplexity: string;
  spaceComplexity: string;
  estimatedTimeMs: number;
  estimatedMemoryKb: number;
  balanceScore: number;
}

export function BenchmarkGauge({
  timeComplexity,
  spaceComplexity,
  estimatedTimeMs,
  estimatedMemoryKb,
  balanceScore,
}: BenchmarkGaugeProps) {
  const data = [
    { name: "Time (ms)", value: estimatedTimeMs },
    { name: "Mem (kb)", value: estimatedMemoryKb },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
      <div className="flex flex-col gap-2 p-3 bg-secondary/30 border border-border/50">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Time:</span>
          <span className="text-foreground font-bold">{timeComplexity}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Space:</span>
          <span className="text-foreground font-bold">{spaceComplexity}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground pt-2 border-t border-border/40 mt-1">
          <span>Balance:</span>
          <span className={`font-bold ${balanceScore > 80 ? 'text-primary' : balanceScore > 50 ? 'text-yellow-400' : 'text-destructive'}`}>
            {balanceScore}/100
          </span>
        </div>
      </div>
      
      <div className="h-[90px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{ fill: "hsl(var(--muted)/0.4)" }}
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: '12px' }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Bar dataKey="value" radius={0} barSize={12}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? "hsl(var(--chart-2))" : "hsl(var(--chart-3))"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
