import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Palette, Sun, Type, Sparkles, RotateCcw, Check } from 'lucide-react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '../../lib/utils'
import { useSettingsStore } from '../../stores/settingsStore'
import { THEME_PRESET_COLORS } from '../../lib/constants'
import type { AnimationSpeed } from '../../types'

/* ──── Animation config ──── */

const springConfig = { type: 'spring' as const, stiffness: 300, damping: 25 }

/* ──── Slider component (inline to avoid Radix import quirks) ──── */

interface ThemedSliderProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  label: string
  icon: React.ReactNode
  formatValue?: (value: number) => string
}

function ThemedSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  icon,
  formatValue = (v) => `${v}`
}: ThemedSliderProps): JSX.Element {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-text-muted)]">{icon}</span>
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            {label}
          </label>
        </div>
        <span className="text-xs font-mono text-[var(--color-text-muted)] tabular-nums">
          {formatValue(value)}
        </span>
      </div>
      <SliderPrimitive.Root
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="relative flex items-center w-full h-5 select-none touch-none"
      >
        <SliderPrimitive.Track className="relative grow h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-[var(--color-accent)]" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            'block w-4 h-4 rounded-full bg-white border-2 border-[var(--color-accent)] shadow-sm',
            'focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2',
            'hover:scale-110 transition-transform'
          )}
        />
      </SliderPrimitive.Root>
    </div>
  )
}

/* ──── Animation speed toggle ──── */

interface SpeedOption {
  value: AnimationSpeed
  label: string
  description: string
}

const SPEED_OPTIONS: SpeedOption[] = [
  {
    value: 'normal',
    label: 'Normal',
    description: 'Full animations'
  },
  {
    value: 'reduced',
    label: 'Reduced',
    description: 'Minimal movement'
  },
  {
    value: 'none',
    label: 'None',
    description: 'No animations'
  }
]

/* ──── Preview card ──── */

function PreviewCard(): JSX.Element {
  const { accentColor, bgDensity, fontSize, animationSpeed } = useSettingsStore()

  return (
    <div
      className="rounded-xl border border-[var(--color-border)] p-4 space-y-3 overflow-hidden"
      style={{ background: bgDensity >= 80 ? '#0d0d14' : undefined }}
    >
      <div className="flex items-center gap-3">
        {/* Preview logo */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accentColor}20` }}
        >
          <Sparkles size={16} style={{ color: accentColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="h-3 rounded-full w-28 mb-1.5"
            style={{
              backgroundColor: accentColor,
              opacity: 0.8
            }}
          />
          <div
            className="h-2 rounded-full w-20"
            style={{ backgroundColor: 'var(--color-text-muted)', opacity: 0.4 }}
          />
        </div>
      </div>

      {/* Simulated content lines */}
      <div className="space-y-2">
        <div
          className="h-2 rounded-full w-full"
          style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
        />
        <div
          className="h-2 rounded-full w-3/4"
          style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
        />
        <div
          className="h-2 rounded-full w-5/6"
          style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
        />
      </div>

      {/* Simulated accent elements */}
      <div className="flex gap-2">
        <div
          className="h-6 rounded-md flex-1"
          style={{ backgroundColor: accentColor, opacity: 0.7 }}
        />
        <div
          className="h-6 rounded-md flex-1 border"
          style={{
            borderColor: accentColor,
            backgroundColor: `${accentColor}10`
          }}
        />
      </div>

      {/* Animation indicator */}
      <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            animationSpeed === 'normal' && 'bg-[var(--color-success)]',
            animationSpeed === 'reduced' && 'bg-[var(--color-warning)]',
            animationSpeed === 'none' && 'bg-[var(--color-error)]'
          )}
        />
        {animationSpeed === 'normal' && 'Animations active'}
        {animationSpeed === 'reduced' && 'Reduced motion'}
        {animationSpeed === 'none' && 'Animations off'}
      </div>
    </div>
  )
}

/* ──── Color picker section ──── */

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

function ColorPicker({ value, onChange }: ColorPickerProps): JSX.Element {
  const [customHex, setCustomHex] = useState(value)
  const [showCustom, setShowCustom] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[var(--color-text-muted)]">
          <Palette size={14} />
        </span>
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
          Accent Color
        </label>
      </div>

      {/* Preset colors */}
      <div className="flex items-center gap-2 flex-wrap">
        {THEME_PRESET_COLORS.map((preset) => {
          const isActive = value.toLowerCase() === preset.value.toLowerCase()
          return (
            <motion.button
              key={preset.value}
              type="button"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                onChange(preset.value)
                setCustomHex(preset.value)
                setShowCustom(false)
              }}
              className={cn(
                'relative w-7 h-7 rounded-full border-2 transition-all',
                isActive
                  ? 'border-[var(--color-text-primary)] scale-110'
                  : 'border-transparent hover:border-[var(--color-border)]'
              )}
              style={{ backgroundColor: preset.value }}
              aria-label={preset.name}
              title={preset.name}
            >
              {isActive && (
                <Check
                  size={12}
                  className="absolute inset-0 m-auto text-white drop-shadow-sm"
                  strokeWidth={3}
                />
              )}
            </motion.button>
          )
        })}

        {/* Custom color button */}
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className={cn(
            'w-7 h-7 rounded-full border-2 border-dashed flex items-center justify-center text-[10px] font-bold transition-colors',
            showCustom
              ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
              : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-secondary)]'
          )}
          title="Custom color"
          aria-label="Custom color"
        >
          +
        </button>
      </div>

      {/* Custom hex input */}
      <AnimatePresence>
        {showCustom && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 pt-1">
              <div
                className="w-7 h-7 rounded border border-[var(--color-border)] shrink-0"
                style={{ backgroundColor: customHex }}
              />
              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs text-[var(--color-text-muted)]">#</span>
                <input
                  type="text"
                  value={customHex.replace('#', '')}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
                    setCustomHex(`#${raw}`)
                    if (raw.length === 6) {
                      onChange(`#${raw}`)
                    }
                  }}
                  placeholder="6c5ce7"
                  className="flex-1 px-2 py-1.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded text-xs font-mono text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <input
                type="color"
                value={customHex}
                onChange={(e) => {
                  const v = e.target.value
                  setCustomHex(v)
                  onChange(v)
                }}
                className="w-7 h-7 rounded cursor-pointer border border-[var(--color-border)] p-0 bg-transparent"
                aria-label="Pick custom color"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ──── ThemeCustomizer Component ──── */

interface ThemeCustomizerProps {
  /** When true, render as a standalone panel. Otherwise as a compact card. */
  standalone?: boolean
  className?: string
}

/**
 * ThemeCustomizer — Theme customization panel with accent color picker,
 * bg darkness slider, font size slider, animation speed toggle,
 * real-time preview, and reset to defaults.
 */
export default function ThemeCustomizer({
  standalone = false,
  className
}: ThemeCustomizerProps): JSX.Element {
  const {
    accentColor,
    bgDensity,
    fontSize,
    animationSpeed,
    setAccentColor,
    setBgDensity,
    setFontSize,
    setAnimationSpeed,
    resetSettings
  } = useSettingsStore()

  const handleReset = (): void => {
    resetSettings()
  }

  return (
    <div
      className={cn(
        standalone
          ? 'space-y-6'
          : 'rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-5',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-accent-subtle)]">
            <Palette size={16} className="text-[var(--color-accent)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Theme Customizer
            </h3>
            <p className="text-[10px] text-[var(--color-text-secondary)]">
              Personalize your experience
            </p>
          </div>
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleReset}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg transition-colors"
          title="Reset to defaults"
        >
          <RotateCcw size={12} />
          Reset
        </motion.button>
      </div>

      {/* Controls */}
      <div className="space-y-5">
        {/* Accent color */}
        <ColorPicker value={accentColor} onChange={setAccentColor} />

        {/* Divider */}
        <div className="border-t border-[var(--color-border)]" />

        {/* Background density */}
        <ThemedSlider
          value={bgDensity}
          min={0}
          max={100}
          step={1}
          onChange={setBgDensity}
          label="Background Depth"
          icon={<Sun size={14} />}
          formatValue={(v) => {
            if (v <= 20) return 'Light'
            if (v <= 40) return 'Soft'
            if (v <= 60) return 'Balanced'
            if (v <= 80) return 'Deep'
            return 'Darkest'
          }}
        />

        {/* Font size */}
        <ThemedSlider
          value={fontSize}
          min={10}
          max={24}
          step={1}
          onChange={setFontSize}
          label="Font Size"
          icon={<Type size={14} />}
          formatValue={(v) => `${v}px`}
        />

        {/* Animation speed */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-text-muted)]">
              <Sparkles size={14} />
            </span>
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">
              Animation Speed
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {SPEED_OPTIONS.map((option) => {
              const isActive = animationSpeed === option.value
              return (
                <motion.button
                  key={option.value}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAnimationSpeed(option.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 px-3 py-2 rounded-lg border text-center transition-all',
                    isActive
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
                  )}
                >
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      isActive
                        ? 'text-[var(--color-accent)]'
                        : 'text-[var(--color-text-primary)]'
                    )}
                  >
                    {option.label}
                  </span>
                  <span className="text-[9px] text-[var(--color-text-muted)] leading-tight">
                    {option.description}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--color-border)]" />

        {/* Preview */}
        <div className="space-y-2">
          <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Preview
          </span>
          <PreviewCard />
        </div>
      </div>
    </div>
  )
}