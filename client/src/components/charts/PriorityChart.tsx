import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };

interface PriorityChartProps {
  low: number;
  medium: number;
  high: number;
}

export function PriorityChart({ low, medium, high }: PriorityChartProps) {
  const data = [
    { name: 'Low', value: low },
    { name: 'Medium', value: medium },
    { name: 'High', value: high },
  ];

  const total = low + medium + high;
  if (total === 0) return <p className="text-sm text-muted-foreground text-center py-8">No data</p>;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
