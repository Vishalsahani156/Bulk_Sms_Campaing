import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  backgroundColor: "oklch(0.2 0.015 270 / 95%)",
  border: "1px solid oklch(1 0 0 / 10%)",
  borderRadius: "10px",
  backdropFilter: "blur(12px)",
  fontSize: "12px",
  padding: "8px 12px",
  boxShadow: "0 10px 30px -10px oklch(0 0 0 / 50%)",
};

interface FailurePoint {
  date: string;
  failed: number;
  delivered: number;
}

export function FailureBarChart({ data }: { data: FailurePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" vertical={false} />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          interval={Math.max(0, Math.floor(data.length / 6))}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(1 0 0 / 5%)" }} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value) => <span className="text-muted-foreground capitalize">{value}</span>}
        />
        <Bar
          dataKey="delivered"
          name="Delivered"
          fill="var(--color-chart-2)"
          radius={[4, 4, 0, 0]}
          stackId="stack"
        />
        <Bar
          dataKey="failed"
          name="Failed"
          fill="var(--color-destructive)"
          radius={[4, 4, 0, 0]}
          stackId="stack"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface StatusSlice {
  name: string;
  value: number;
  color: string;
}

export function CampaignStatusPie({ data }: { data: StatusSlice[] }) {
  if (data.length === 0) {
    return (
      <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
        No campaign data
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          stroke="none"
        >
          {data.map((s, i) => (
            <Cell key={i} fill={s.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface GroupRow {
  name: string;
  count: number;
  pct: number;
}

export function ContactGroupsChart({ data }: { data: GroupRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          width={88}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number, _name, item) => [
            `${value} (${(item.payload as GroupRow).pct}%)`,
            "Contacts",
          ]}
        />
        <Bar dataKey="count" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
