'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface UsageChartProps {
  data: {
    daily: Array<{ date: string; tokens: number; requests: number }>;
    byProvider: Array<{ name: string; tokens: number; requests: number }>;
    byEndpoint: Array<{ name: string; tokens: number; requests: number }>;
    roleDistribution?: Array<{ role: string; count: number; percentage: number }>;
    costByProvider?: Array<{ name: string; tokens: number; cost: number }>;
  };
}

const COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#f43f5e', '#84cc16'];

const PROVIDER_COLORS: Record<string, string> = {
  gemini: '#06b6d4',
  openai: '#10b981',
  claude: '#f59e0b',
};

const ROLE_COLORS: Record<string, string> = {
  planner: '#f59e0b',
  developer: '#06b6d4',
  designer: '#ec4899',
  qa: '#10b981',
  marketer: '#8b5cf6',
  analyst: '#6366f1',
  security: '#f43f5e',
  user: '#94a3b8',
};

const ROLE_NAMES: Record<string, string> = {
  planner: 'Planner',
  developer: 'Developer',
  designer: 'Designer',
  qa: 'QA',
  marketer: 'Marketer',
  analyst: 'Analyst',
  security: 'Security',
  user: 'User',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// 커스텀 툴팁 스타일
const tooltipStyle = {
  backgroundColor: '#1a1a2e',
  border: '1px solid #2d2d44',
  borderRadius: '12px',
  padding: '12px 16px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
};

const tooltipLabelStyle = {
  color: '#e0e0e0',
  fontWeight: 600,
  marginBottom: '8px',
};

const tooltipItemStyle = {
  color: '#a0a0b0',
};

export default function UsageChart({ data }: UsageChartProps) {
  return (
    <div className="space-y-6">
      {/* 역할 분포 & 비용 (PPT 스타일) */}
      {(data.roleDistribution?.length || data.costByProvider?.length) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 역할 분포 */}
          {data.roleDistribution && data.roleDistribution.length > 0 && (
            <div className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Role Distribution
              </h3>
              <div className="flex items-center gap-6">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.roleDistribution}
                        dataKey="count"
                        nameKey="role"
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={70}
                        paddingAngle={2}
                      >
                        {data.roleDistribution.map((entry) => (
                          <Cell
                            key={entry.role}
                            fill={ROLE_COLORS[entry.role] || COLORS[0]}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number | undefined, name: string | undefined) => [value ?? 0, ROLE_NAMES[name ?? ''] || name || '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {data.roleDistribution.map((item) => (
                    <div key={item.role} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ROLE_COLORS[item.role] || COLORS[0] }}
                        />
                        <span className="text-[var(--text-secondary)]">{ROLE_NAMES[item.role] || item.role}</span>
                      </div>
                      <span className="font-medium">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 프로바이더별 비용 */}
          {data.costByProvider && data.costByProvider.length > 0 && (
            <div className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                Cost per Provider
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.costByProvider} layout="vertical" barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d2d44" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#6b7280"
                      fontSize={12}
                      width={100}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => {
                        const labels: Record<string, string> = {
                          gemini: 'Gemini (Primary)',
                          openai: 'OpenAI (Fallback)',
                          claude: 'Claude',
                        };
                        return labels[value.toLowerCase()] || value;
                      }}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number | undefined) => [`$${(value ?? 0).toFixed(2)}`, '비용']}
                      cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
                    />
                    <Bar
                      dataKey="cost"
                      radius={[0, 6, 6, 0]}
                      maxBarSize={30}
                    >
                      {data.costByProvider.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={PROVIDER_COLORS[entry.name.toLowerCase()] || COLORS[0]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* 비용 합계 */}
              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Total Estimated Cost</span>
                <span className="text-xl font-bold text-green-400">
                  ${data.costByProvider.reduce((sum, p) => sum + p.cost, 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 일별 토큰 사용량 */}
      <div className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          일별 토큰 사용량
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.daily}>
              <defs>
                <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d44" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={formatNumber}
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
                formatter={(value: number | undefined) => [formatNumber(value ?? 0), '토큰']}
                labelFormatter={(label) => `날짜: ${formatDate(label)}`}
              />
              <Line
                type="monotone"
                dataKey="tokens"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{ fill: '#06b6d4', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 8, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 프로바이더별 사용량 */}
        <div className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            프로바이더별 사용량
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.byProvider}
                  dataKey="tokens"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: '#6b7280', strokeWidth: 1 }}
                >
                  {data.byProvider.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={PROVIDER_COLORS[entry.name.toLowerCase()] || COLORS[index % COLORS.length]}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(value: number | undefined) => [formatNumber(value ?? 0), '토큰']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* 범례 */}
          <div className="flex justify-center gap-6 mt-4">
            {data.byProvider.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: PROVIDER_COLORS[entry.name.toLowerCase()] || COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-[var(--text-muted)]">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 엔드포인트별 요청 수 */}
        <div className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            엔드포인트별 요청 수
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byEndpoint} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d44" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#6b7280"
                  fontSize={12}
                  width={70}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(value: number | undefined) => [formatNumber(value ?? 0), '요청']}
                  cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                />
                <Bar
                  dataKey="requests"
                  fill="url(#barGradient)"
                  radius={[0, 8, 8, 0]}
                  maxBarSize={40}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
