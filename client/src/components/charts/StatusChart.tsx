import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#f59e0b', '#3b82f6', '#22c55e'];

interface StatusChartProps {
  pending: number;
  inProgress: number;
  completed: number;
}

export function StatusChart({ pending, inProgress, completed }: StatusChartProps) {
  const data = [
    { name: 'Pending', value: pending },
    { name: 'In Progress', value: inProgress },
    { name: 'Completed', value: completed },
  ];

  const total = pending + inProgress + completed;
  if (total === 0) return <p className="text-sm text-muted-foreground text-center py-8">No data</p>;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
