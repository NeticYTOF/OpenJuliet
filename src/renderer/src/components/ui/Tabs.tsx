import { useState, useRef, useCallback, type ReactNode, type CSSProperties } from 'react'
import { motion, LayoutGroup } from 'framer-motion'
import { cn } from '../../lib/utils'

/**
 * Tab size options.
 */
export type TabsSize = 'sm' | 'md' | 'lg'

/**
 * Tab orientation.
 */
export type TabsOrientation = 'horizontal' | 'vertical'

/**
 * A single tab definition.
 */
export interface Tab {
  /** Tab value (used for selection) */
  value: string
  /** Display label */
  label: string
  /** Optional icon */
  icon?: ReactNode
  /** Optional badge count or element */
  badge?: ReactNode
  /** Disabled state */
  disabled?: boolean
}

/**
 * Tabs component props (uncontrolled).
 */
export interface TabsUncontrolledProps {
  /** Tab definitions */
  tabs: Tab[]
  /** Default selected value (uncontrolled) */
  defaultValue?: string
  /** Called when selected tab changes (uncontrolled) */
  onChange?: (value: string) => void
  /** Size preset */
  size?: TabsSize
  /** Orientation */
  orientation?: TabsOrientation
  /** Additional className */
  className?: string
  /** Tab list className */
  tabListClassName?: string
  /** Whether to render tab content panels */
  children?: ReactNode
}

/**
 * Tabs component props (controlled).
 */
export interface TabsControlledProps {
  /** Tab definitions */
  tabs: Tab[]
  /** Currently selected value (controlled) */
  value: string
  /** Called when selected tab changes */
  onChange: (value: string) => void
  /** Size preset */
  size?: TabsSize
  /** Orientation */
  orientation?: TabsOrientation
  /** Additional className */
  className?: string
  /** Tab list className */
  tabListClassName?: string
  /** Whether to render tab content panels */
  children?: ReactNode
}

export type TabsProps = TabsUncontrolledProps | TabsControlledProps

/* ──── Size presets ──── */

const sizeStyles: Record<TabsSize, { tab: string; label: string; gap: string }> = {
  sm: {
    tab: 'px-2.5 py-1.5 gap-1',
    label: 'text-xs',
    gap: 'gap-1'
  },
  md: {
    tab: 'px-3.5 py-2 gap-1.5',
    label: 'text-sm',
    gap: 'gap-1.5'
  },
  lg: {
    tab: 'px-5 py-2.5 gap-2',
    label: 'text-base',
    gap: 'gap-2'
  }
}

/* ──── Indicator variants ──── */

const indicatorVariants = {
  initial: { scaleX: 0, opacity: 0 },
  animate: { scaleX: 1, opacity: 1, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
  exit: { scaleX: 0, opacity: 0, transition: { duration: 0.15 } }
}

const indicatorVerticalVariants = {
  initial: { scaleY: 0, opacity: 0 },
  animate: { scaleY: 1, opacity: 1, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
  exit: { scaleY: 0, opacity: 0, transition: { duration: 0.15 } }
}

/**
 * Tabs — Animated tab component with underline indicator, sizes, horizontal/vertical orientation,
 * and controlled/uncontrolled modes.
 *
 * @example
 * // Uncontrolled
 * <Tabs tabs={myTabs} defaultValue="tab1" onChange={handleChange} />
 *
 * // Controlled
 * <Tabs tabs={myTabs} value={activeTab} onChange={setActiveTab} orientation="vertical" />
 *
 * // With content panels
 * <Tabs tabs={myTabs} defaultValue="tab1">
 *   <div>Tab 1 content</div>
 *   <div>Tab 2 content</div>
 * </Tabs>
 */
export function Tabs(props: TabsProps): JSX.Element {
  const {
    tabs,
    size = 'md',
    orientation = 'horizontal',
    className,
    tabListClassName,
    children
  } = props

  /* Controlled vs uncontrolled */
  const isControlled = 'value' in props && 'onChange' in props
  const [internalValue, setInternalValue] = useState(
    isControlled ? undefined : (props as TabsUncontrolledProps).defaultValue ?? tabs[0]?.value ?? ''
  )

  const activeValue: string = isControlled
    ? (props as TabsControlledProps).value
    : (internalValue ?? '')

  const handleChange = useCallback(
    (value: string) => {
      if (isControlled) {
        ;(props as TabsControlledProps).onChange(value)
      } else {
        setInternalValue(value)
        ;(props as TabsUncontrolledProps).onChange?.(value)
      }
    },
    [isControlled, props]
  )

  const sizes = sizeStyles[size]
  const isVertical = orientation === 'vertical'

  /* Keep track of tab element positions for the animated indicator */
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const getIndicatorStyle = useCallback((): CSSProperties => {
    const el = tabRefs.current.get(activeValue)
    if (!el) return {}
    const parent = el.parentElement
    if (!parent) return {}

    if (isVertical) {
      return {
        top: el.offsetTop,
        height: el.offsetHeight,
        left: 0,
        width: 2
      }
    }

    return {
      left: el.offsetLeft,
      width: el.offsetWidth,
      bottom: 0,
      height: 2
    }
  }, [activeValue, isVertical])

  const activeIndex = tabs.findIndex((t) => t.value === activeValue)

  /* ──── Render ──── */

  const indicator = isVertical ? indicatorVerticalVariants : indicatorVariants

  return (
    <div
      className={cn(
        'flex',
        isVertical ? 'flex-row gap-4' : 'flex-col gap-0',
        className
      )}
    >
      {/* Tab list */}
      <div
        className={cn(
          'relative flex',
          isVertical
            ? 'flex-col border-l border-[var(--color-border)]'
            : 'flex-row border-b border-[var(--color-border)]',
          'shrink-0',
          tabListClassName
        )}
        role="tablist"
        aria-orientation={orientation}
      >
        <LayoutGroup id={`tabs-${tabs.map((t) => t.value).join('-')}`}>
          {tabs.map((tab) => {
            const isActive = tab.value === activeValue
            return (
              <button
                key={tab.value}
                ref={(el) => {
                  if (el) tabRefs.current.set(tab.value, el)
                  else tabRefs.current.delete(tab.value)
                }}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.value}`}
                tabIndex={isActive ? 0 : -1}
                disabled={tab.disabled}
                onClick={() => !tab.disabled && handleChange(tab.value)}
                className={cn(
                  'relative flex items-center justify-center whitespace-nowrap font-medium transition-colors duration-150 outline-none',
                  sizes.tab,
                  sizes.gap,
                  isActive
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
                  tab.disabled && 'opacity-40 cursor-not-allowed'
                )}
              >
                {tab.icon && (
                  <span className="shrink-0">{tab.icon}</span>
                )}
                <span className={cn('truncate', sizes.label)}>
                  {tab.label}
                </span>
                {tab.badge !== undefined && tab.badge !== null && (
                  <span className="shrink-0">{tab.badge}</span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    variants={indicator}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className={cn(
                      'absolute bg-[var(--color-accent)] rounded-full',
                      isVertical
                        ? 'left-0 top-0 w-0.5'
                        : 'bottom-0 left-0 h-0.5'
                    )}
                    style={getIndicatorStyle()}
                  />
                )}
              </button>
            )
          })}
        </LayoutGroup>
      </div>

      {/* Content panels */}
      {children && (
        <div className={cn('flex-1 min-h-0', isVertical ? 'ml-0' : 'mt-0')}>
          {React.Children.toArray(children).map((child, i) => (
            <div
              key={tabs[i]?.value ?? i}
              id={`tabpanel-${tabs[i]?.value ?? i}`}
              role="tabpanel"
              aria-labelledby={tabs[i]?.value}
              hidden={i !== activeIndex}
              className={cn('focus:outline-none', i === activeIndex ? 'block' : 'hidden')}
            >
              {child}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

Tabs.displayName = 'Tabs'

export default Tabs
