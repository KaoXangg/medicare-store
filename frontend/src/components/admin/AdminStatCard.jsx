import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const COLOR_MAP = {
  sky: {
    iconBg: 'bg-gradient-to-br from-sky-400 to-blue-600',
    glow: 'shadow-sky-500/25',
    ring: 'group-hover:ring-sky-500/30',
    accentBar: 'bg-gradient-to-r from-sky-400 to-blue-500',
    line: '#38bdf8',
    fillFrom: '#38bdf8',
    softBg: 'from-sky-500/[0.07] via-transparent to-transparent',
  },
  emerald: {
    iconBg: 'bg-gradient-to-br from-emerald-400 to-teal-600',
    glow: 'shadow-emerald-500/25',
    ring: 'group-hover:ring-emerald-500/30',
    accentBar: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    line: '#34d399',
    fillFrom: '#34d399',
    softBg: 'from-emerald-500/[0.07] via-transparent to-transparent',
  },
  violet: {
    iconBg: 'bg-gradient-to-br from-violet-400 to-purple-600',
    glow: 'shadow-violet-500/25',
    ring: 'group-hover:ring-violet-500/30',
    accentBar: 'bg-gradient-to-r from-violet-400 to-purple-500',
    line: '#a78bfa',
    fillFrom: '#a78bfa',
    softBg: 'from-violet-500/[0.07] via-transparent to-transparent',
  },
  amber: {
    iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
    glow: 'shadow-amber-500/25',
    ring: 'group-hover:ring-amber-500/30',
    accentBar: 'bg-gradient-to-r from-amber-400 to-orange-500',
    line: '#fbbf24',
    fillFrom: '#fbbf24',
    softBg: 'from-amber-500/[0.07] via-transparent to-transparent',
  },
  orange: {
    iconBg: 'bg-gradient-to-br from-orange-400 to-rose-500',
    glow: 'shadow-orange-500/25',
    ring: 'group-hover:ring-orange-500/30',
    accentBar: 'bg-gradient-to-r from-orange-400 to-rose-500',
    line: '#fb923c',
    fillFrom: '#fb923c',
    softBg: 'from-orange-500/[0.07] via-transparent to-transparent',
  },
  cyan: {
    iconBg: 'bg-gradient-to-br from-cyan-400 to-sky-600',
    glow: 'shadow-cyan-500/25',
    ring: 'group-hover:ring-cyan-500/30',
    accentBar: 'bg-gradient-to-r from-cyan-400 to-sky-500',
    line: '#22d3ee',
    fillFrom: '#22d3ee',
    softBg: 'from-cyan-500/[0.07] via-transparent to-transparent',
  },
  purple: {
    iconBg: 'bg-gradient-to-br from-purple-400 to-fuchsia-600',
    glow: 'shadow-purple-500/25',
    ring: 'group-hover:ring-purple-500/30',
    accentBar: 'bg-gradient-to-r from-purple-400 to-fuchsia-500',
    line: '#c084fc',
    fillFrom: '#c084fc',
    softBg: 'from-purple-500/[0.07] via-transparent to-transparent',
  },
};

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

export default function AdminStatCard({
  title,
  value,
  icon: Icon,
  color = 'sky',
  growth = 0,
  compareLabel = '',
  sparklineData = [],
  index = 0,
  to,
}) {
  const { dark } = useTheme();
  const palette = COLOR_MAP[color] || COLOR_MAP.sky;
  const isPositive = growth >= 0;

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
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Wrapper
        {...wrapperProps}
        className={`relative block overflow-hidden rounded-3xl border p-4 transition-all duration-300 ${cardBg} hover:shadow-xl ${palette.glow} ring-1 ring-transparent ${palette.ring}`}
      >
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${palette.softBg} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
        <div className={`absolute inset-x-0 top-0 h-[3px] ${palette.accentBar} opacity-70`} />

        <div className="relative flex items-start justify-between gap-2">
          <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${titleColor}`}>{title}</p>
          <motion.div
            whileHover={{ rotate: -6, scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 350, damping: 15 }}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${palette.iconBg} ${palette.glow}`}
          >
            {Icon && <Icon size={18} />}
          </motion.div>
        </div>

        <p className={`relative mt-3 truncate text-2xl font-black tracking-tight ${valueColor}`}>{value}</p>

        <div className="relative mt-4 flex items-end justify-between gap-2">
          <div className="flex flex-col gap-1.5">
            <span className={`inline-flex w-fit items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold ${growthBg}`}>
              {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {isPositive ? '+' : ''}{growth}%
            </span>
            {compareLabel && (
              <span className={`text-[10px] font-medium ${compareColor}`}>so với {compareLabel}</span>
            )}
          </div>
          <div className="shrink-0 opacity-90">
            <Sparkline data={sparklineData} color={palette.line} />
          </div>
        </div>
      </Wrapper>
    </motion.div>
  );
}