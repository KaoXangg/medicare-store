import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/* ---------- màu accent suy ra từ chuỗi gradient Tailwind (from-x-500 to-y-500) ---------- */

const TAILWIND_HEX = {
  slate: '#64748b', gray: '#6b7280', zinc: '#71717a', red: '#ef4444',
  orange: '#f97316', amber: '#f59e0b', yellow: '#eab308', lime: '#84cc16',
  green: '#22c55e', emerald: '#10b981', teal: '#14b8a6', cyan: '#06b6d4',
  sky: '#0ea5e9', blue: '#3b82f6', indigo: '#6366f1', violet: '#8b5cf6',
  purple: '#a855f7', fuchsia: '#d946ef', pink: '#ec4899', rose: '#f43f5e',
};

function extractAccentColor(gradient) {
  if (!gradient) return TAILWIND_HEX.sky;
  const match = gradient.match(/from-([a-z]+)-\d{2,3}/) || gradient.match(/([a-z]+)-\d{2,3}/);
  return TAILWIND_HEX[match?.[1]] || TAILWIND_HEX.sky;
}

/* ---------- sparkline mặc định khi không truyền sparklineData ---------- */

function generateSparklinePoints(seed, isPositive) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1000;
  }
  const count = 7;
  const points = [];
  for (let i = 0; i < count; i++) {
    const noise = ((hash * (i + 7)) % 17) - 8;
    const trendBias = isPositive ? i * 2.4 : -i * 2.4;
    points.push(Math.max(10, Math.min(90, 50 + trendBias + noise * 0.6)));
  }
  return points;
}

/* ---------- sparkline recharts — y hệt AdminStatCard, không phải SVG tự vẽ ---------- */

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return <div className="h-9 w-20" />;
  const chartData = data.map((v, i) => ({ i, v }));
  const gradId = `spark-${color.replace('#', '')}`;
  return (
    <AreaChart width={84} height={36} data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.45} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gradId})`} dot={false} isAnimationActive />
    </AreaChart>
  );
}

/* ---------- component chính ---------- */
/*
  Nhận nguyên props cũ (title, value, icon, gradient, trend, trendValue, delay)
  để Coupons/Liên hệ KHÔNG cần đổi call site.
  Map sang đúng ngôn ngữ hiển thị của AdminStatCard:
  rounded-3xl, accent bar trên cùng, icon xoay khi hover, badge TrendingUp/Down,
  sparkline bằng recharts, nền/màu chữ đổi theo useTheme (dark/light).
*/
export default function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  trend,
  trendValue,
  compareLabel = '',
  sparklineData,
  delay = 0,
  to,
}) {
  const { dark } = useTheme();
  const isPositive = trend !== false;
  const accentColor = extractAccentColor(gradient);
  const points = sparklineData ?? generateSparklinePoints(title || 'stat', isPositive);

  const cardBg = dark
    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
    : 'bg-white border-slate-200 hover:border-slate-300';
  const titleColor = dark ? 'text-slate-400' : 'text-slate-500';
  const valueColor = dark ? 'text-white' : 'text-slate-900';
  const compareColor = dark ? 'text-slate-500' : 'text-slate-400';
  const growthBg = isPositive
    ? dark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
    : dark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-600';

  const Wrapper = to ? Link : 'div';
  const wrapperProps = to ? { to } : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group h-full"
    >
      <Wrapper
        {...wrapperProps}
        className={`relative flex h-full flex-col overflow-hidden rounded-3xl border p-4 transition-all duration-300 ${cardBg} ring-1 ring-transparent group-hover:ring-slate-300/50 dark:group-hover:ring-slate-600/50`}
        style={{
          boxShadow: dark
            ? `0 10px 30px -12px ${accentColor}30`
            : `0 10px 30px -14px ${accentColor}45`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ backgroundImage: `linear-gradient(135deg, ${accentColor}1f, transparent 60%)` }}
        />
        <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${gradient} opacity-70`} />

        <div className="relative flex items-start justify-between gap-2">
          <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${titleColor}`}>{title}</p>
          <motion.div
            whileHover={{ rotate: -6, scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 350, damping: 15 }}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
            style={{ boxShadow: `0 8px 20px -6px ${accentColor}80` }}
          >
            {Icon && <Icon size={18} />}
          </motion.div>
        </div>

        <p className={`relative mt-3 truncate text-2xl font-black tracking-tight ${valueColor}`}>{value}</p>

        <div className="relative mt-4 flex flex-1 items-end justify-between gap-2">
          <div className="flex flex-col gap-1.5">
            {trendValue !== undefined && (
              <span className={`inline-flex w-fit items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold ${growthBg}`}>
                {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {isPositive ? '+' : ''}{trendValue}%
              </span>
            )}
            <span className={`text-[10px] font-medium ${compareColor}`}>{compareLabel || 'hôm nay'}</span>
          </div>
          <div className="shrink-0 opacity-90">
            <Sparkline data={points} color={accentColor} />
          </div>
        </div>
      </Wrapper>
    </motion.div>
  );
}