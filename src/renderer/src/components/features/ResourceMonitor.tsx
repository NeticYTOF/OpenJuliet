import { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import {
  Cpu,
  HardDrive,
  Database,
  FileEdit,
  Clock,
  Zap,
  Timer
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Card } from '../ui/Card'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ResourceData {
  /** CPU usage percentage (0–100) */
  cpuUsage: number
  /** Memory usage percentage (0–100) */
  memoryUsage: number
  /** Disk I/O activity percentage (0–100) */
  diskIO: number
  /** Total tokens consumed */
  tokenCount: number
  /** Number of files modified */
  filesModified: number
  /** Elapsed time in milliseconds */
  elapsedMs: number
  /** Estimated time remaining in ms (optional) */
  estimatedRemainingMs?: number
}

export interface ResourceMonitorProps {
  /** Current resource usage data */
  data: ResourceData
  /** If true, show compact layout (smaller gauges, no labels) */
  compact?: boolean
  /** Optional class name override */
  className?: string
}

// ─── Constants ──────────────────────────────────────────────────────────────

const GAUGE_SIZE = 56
const GAUGE_STROKE = 5
const GAUGE_RADIUS = (GAUGE_SIZE - GAUGE_STROKE) / 2
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS

const COMPACT_GAUGE_SIZE = 44
const COMPACT_GAUGE_STROKE = 4
const COMPACT_GAUGE_RADIUS = (COMPACT_GAUGE_SIZE - COMPACT_GAUGE_STROKE) / 2
const COMPACT_GAUGE_CIRCUMFERENCE = 2 * Math.PI * COMPACT_GAUGE_RADIUS

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

function formatEstimate(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  if (totalSeconds < 60) return `~${totalSeconds}s remaining`
  const minutes = Math.ceil(totalSeconds / 60)
  return `~${minutes}m remaining`
}

function getGaugeColor(value: number): string {
  if (value >= 90) return 'var(--color-error)'
  if (value >= 70) return 'var(--color-warning)'
  return 'var(--color-accent)'
}

// ─── Animated Gauge ─────────────────────────────────────────────────────────

interface GaugeProps {
  value: number
  label: string
  icon: React.ReactNode
  compact?: boolean
  unit?: string
}

function Gauge({ value, label, icon, compact = false, unit = '%' }: GaugeProps): JSX.Element {
  const size = compact ? COMPACT_GAUGE_SIZE : GAUGE_SIZE
  const stroke = compact ? COMPACT_GAUGE_STROKE : GAUGE_STROKE
  const radius = compact ? COMPACT_GAUGE_RADIUS : GAUGE_RADIUS
  const circumference = compact ? COMPACT_GAUGE_CIRCUMFERENCE : GAUGE_CIRCUMFERENCE

  const motionValue = useMotionValue(0)
  const dashOffset = useTransform(motionValue, (v) => circumference - (v / 100) * circumference)
  const color = getGaugeColor(value)

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1]
    })
    return controls.stop
  }, [value, motionValue])

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1',
        compact ? 'px-0.5' : 'px-2'
      )}
    >
      {/* SVG Gauge */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-bg-tertiary)"
            strokeWidth={stroke}
            opacity={0.5}
          />
          {/* Animated foreground arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
        </svg>

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(compact ? 'scale-75' : 'scale-100')}>
            {icon}
          </div>
        </div>
      </div>

      {/* Value */}
      <span
        className={cn(
          'font-mono tabular-nums font-semibold',
          compact ? 'text-[11px]' : 'text-sm'
        )}
        style={{ color }}
      >
        {Math.round(value)}
        {unit}
      </span>

      {/* Label */}
      {!compact && (
        <span className="text-[10px] text-[var(--color-text-muted)] text-center leading-tight">
          {label}
        </span>
      )}
    </div>
  )
}

// ─── Animated Counter ───────────────────────────────────────────────────────

interface AnimatedCounterProps {
  value: number
  label: string
  icon: React.ReactNode
  compact?: boolean
  format?: (val: number) => string
}

function AnimatedCounter({
  value,
  label,
  icon,
  compact = false,
  format
}: AnimatedCounterProps): JSX.Element {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (v) => Math.round(v))
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const unsubscribe = rounded.on('change', (latest) => {
      setDisplayValue(latest)
    })
    const controls = animate(motionValue, value, {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1]
    })
    return () => {
      unsubscribe()
      controls.stop()
    }
  }, [value, motionValue, rounded])

  const display = format ? format(displayValue) : displayValue.toLocaleString()

  return (
    <div className={cn('flex items-center gap-2', compact ? 'py-0.5' : 'py-1')}>
      <div
        className={cn(
          'shrink-0 flex items-center justify-center rounded-md',
          compact ? 'w-6 h-6' : 'w-8 h-8',
          'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
        )}
      >
        <span className={compact ? 'scale-75' : 'scale-100'}>{icon}</span>
      </div>
      <div className="min-w-0">
        <span
          className={cn(
            'font-mono tabular-nums font-semibold text-[var(--color-text-primary)] block',
            compact ? 'text-[11px]' : 'text-sm'
          )}
        >
          {display}
        </span>
        {!compact && (
          <span className="text-[10px] text-[var(--color-text-muted)] block leading-tight">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ResourceMonitor({
  data,
  compact = false,
  className
}: ResourceMonitorProps): JSX.Element {
  const {
    cpuUsage,
    memoryUsage,
    diskIO,
    tokenCount,
    filesModified,
    elapsedMs,
    estimatedRemainingMs
  } = data

  // ── Compact layout ──
  if (compact) {
    return (
      <Card variant="default" padding="sm" className={className}>
        <div className="flex items-start gap-2">
          {/* Gauges row */}
          <div className="flex items-center gap-1 shrink-0">
            <Gauge value={cpuUsage} label="" icon={<Cpu size={12} className="text-[var(--color-accent)]" />} compact />
            <Gauge value={memoryUsage} label="" icon={<Database size={12} className="text-[var(--color-info)]" />} compact />
            <Gauge value={diskIO} label="" icon={<HardDrive size={12} className="text-[var(--color-success)]" />} compact />
          </div>

          {/* Divider */}
          <div className="w-px h-10 self-center bg-[var(--color-border)]" />

          {/* Counters */}
          <div className="flex flex-col gap-0.5">
            <AnimatedCounter value={tokenCount} label="Tokens" icon={<Zap size={10} />} compact />
            <AnimatedCounter value={filesModified} label="Files" icon={<FileEdit size={10} />} compact />
          </div>

          {/* Divider */}
          <div className="w-px h-10 self-center bg-[var(--color-border)]" />

          {/* Time */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <Clock size={10} className="text-[var(--color-text-muted)] shrink-0" />
              <span className="text-[11px] font-mono tabular-nums text-[var(--color-text-primary)]">
                {formatDuration(elapsedMs)}
              </span>
            </div>
            {estimatedRemainingMs !== undefined && estimatedRemainingMs > 0 && (
              <div className="flex items-center gap-1.5">
                <Timer size={10} className="text-[var(--color-accent)] shrink-0" />
                <span className="text-[10px] font-mono tabular-nums text-[var(--color-text-muted)]">
                  {formatEstimate(estimatedRemainingMs)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  // ── Full layout ──
  return (
    <Card variant="default" padding="md" className={cn('space-y-3', className)}>
      {/* Title */}
      <div className="flex items-center gap-2">
        <Timer size={14} className="text-[var(--color-accent)]" />
        <span className="text-xs font-semibold text-[var(--color-text-primary)]">
          Resource Monitor
        </span>
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-3 gap-2">
        <Gauge value={cpuUsage} label="CPU" icon={<Cpu size={16} className="text-[var(--color-accent)]" />} />
        <Gauge value={memoryUsage} label="Memory" icon={<Database size={16} className="text-[var(--color-info)]" />} />
        <Gauge value={diskIO} label="Disk I/O" icon={<HardDrive size={16} className="text-[var(--color-success)]" />} />
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--color-border)] my-1" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-1">
        <AnimatedCounter value={tokenCount} label="Tokens Consumed" icon={<Zap size={14} />} />
        <AnimatedCounter value={filesModified} label="Files Modified" icon={<FileEdit size={14} />} />
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--color-border)] my-1" />

      {/* Time info */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--color-text-muted)] font-medium">Elapsed</span>
          <span className="text-xs font-mono tabular-nums text-[var(--color-text-primary)]">
            {formatDuration(elapsedMs)}
          </span>
        </div>
        {estimatedRemainingMs !== undefined && estimatedRemainingMs > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--color-text-muted)] font-medium">Est. Remaining</span>
            <span className="text-xs font-mono tabular-nums text-[var(--color-accent)]">
              {formatEstimate(estimatedRemainingMs)}
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}

export default ResourceMonitor