import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Cpu, Code, GitBranch, Zap } from 'lucide-react'
import { APP_NAME, APP_VERSION } from '../../lib/constants'

/* ──── Loading tips ──── */

const LOADING_TIPS = [
  'Warming up the neural networks…',
  'Brewing fresh code…',
  'Syncing with the singularity…',
  'Polishing the pixels…',
  'Calibrating the agents…',
  'Loading the matrix…',
  'Sharpening the algorithms…',
  'Connecting to the cloud…',
  'Initializing workspace…',
  'Preparing your tools…',
  'Spinning up the engines…',
  'Compiling thoughts…',
  'Gathering intelligence…',
  'Readying the dashboard…',
  'Almost there…'
]

/* ──── Icons that orbit the logo ──── */

const ORBIT_ICONS = [
  { Icon: Cpu, label: 'AI', color: 'var(--color-accent)' },
  { Icon: Code, label: 'Code', color: 'var(--color-info)' },
  { Icon: GitBranch, label: 'Git', color: 'var(--color-warning)' },
  { Icon: Zap, label: 'Speed', color: 'var(--color-success)' }
]

/* ──── Props ──── */

interface SplashScreenProps {
  /** Called when the splash screen should transition to the main app */
  onComplete?: () => void
  /** Minimum duration in ms (default: 3000) */
  minDuration?: number
}

/* ──── Particle / Star Background ──── */

interface Star {
  id: number
  x: number
  y: number
  size: number
  delay: number
  duration: number
  driftX: number
  driftY: number
}

function ParticleBackground(): JSX.Element {
  const particles = useMemo<Star[]>(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      delay: Math.random() * 5,
      duration: Math.random() * 4 + 3,
      driftX: (Math.random() - 0.5) * 30,
      driftY: (Math.random() - 0.5) * 30
    }))
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {particles.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            background: `var(--color-accent)`
          }}
          animate={{
            opacity: [0, 0.5, 0.2, 0.6, 0],
            scale: [0, 1, 0.5, 0.8, 0],
            x: [0, star.driftX * 0.5, star.driftX],
            y: [0, star.driftY * 0.5, star.driftY]
          }}
          transition={{
            duration: star.duration + 2,
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeInOut',
            times: [0, 0.3, 0.6, 0.8, 1]
          }}
        />
      ))}
    </div>
  )
}

/* ──── Orbiting Icons ──── */

function OrbitingIcons(): JSX.Element {
  return (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      {ORBIT_ICONS.map(({ Icon, label, color }, index) => {
        const angle = (index / ORBIT_ICONS.length) * Math.PI * 2
        const radius = 52
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius

        return (
          <motion.div
            key={label}
            className="absolute"
            style={{ color }}
            animate={{
              x: [x, x * -1, x],
              y: [y, y * -1, y],
              opacity: [0, 1, 0.5, 1, 0],
              scale: [0, 1, 0.8, 1, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: index * 0.8,
              ease: 'easeInOut'
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <Icon size={16} />
              <span
                className="text-[7px] font-medium uppercase tracking-widest"
                style={{ color }}
              >
                {label}
              </span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

/* ──── SplashScreen Component ──── */

/**
 * SplashScreen — Animated app launch screen with logo animation,
 * cycling tips, particle background, orbiting icons, and
 * auto-transition to main app after a minimum duration.
 */
export default function SplashScreen({
  onComplete,
  minDuration = 3000
}: SplashScreenProps): JSX.Element {
  const [tipIndex, setTipIndex] = useState(0)
  const [ready, setReady] = useState(false)

  /* Cycle through tips */
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  /* Wait for minimum duration + optional setup check, then complete */
  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true)
    }, minDuration)

    return () => clearTimeout(timer)
  }, [minDuration])

  /* Auto-transition after ready */
  useEffect(() => {
    if (!ready || !onComplete) return
    const transitionTimer = setTimeout(() => {
      onComplete()
    }, 800) // Brief pause so the user sees the "ready" state
    return () => clearTimeout(transitionTimer)
  }, [ready, onComplete])

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[var(--color-bg-primary)] overflow-hidden select-none">
      {/* Particle background */}
      <ParticleBackground />

      {/* Gradient orbs */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.03] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo animation */}
        <div className="relative">
          <motion.div
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{
              scale: 1,
              rotate: 0,
              opacity: 1
            }}
            transition={{
              type: 'spring',
              stiffness: 180,
              damping: 15,
              delay: 0.1
            }}
            className="relative"
          >
            {/* Logo icon container */}
            <motion.div
              className="relative w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden"
              style={{
                backgroundColor: 'var(--color-accent-subtle)',
                border: '1px solid var(--color-border)'
              }}
              animate={{
                boxShadow: [
                  '0 0 0px rgba(108,92,231,0)',
                  '0 0 30px rgba(108,92,231,0.3)',
                  '0 0 60px rgba(108,92,231,0.15)',
                  '0 0 30px rgba(108,92,231,0.3)',
                  '0 0 0px rgba(108,92,231,0)'
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              {/* Spin ring */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-transparent"
                style={{
                  borderTopColor: 'var(--color-accent)',
                  borderRightColor: 'var(--color-accent)'
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />

              {/* Inner glow */}
              <motion.div
                className="absolute inset-2 rounded-xl"
                style={{
                  background: `radial-gradient(circle, var(--color-accent) 0%, transparent 70%)`,
                  opacity: 0.2
                }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />

              <Sparkles
                size={32}
                className="relative z-10"
                style={{ color: 'var(--color-accent)' }}
              />
            </motion.div>

            {/* Orbiting icons */}
            <OrbitingIcons />
          </motion.div>
        </div>

        {/* App name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {APP_NAME}
          </h1>
          <motion.p
            className="text-xs mt-1"
            style={{ color: 'var(--color-text-secondary)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            v{APP_VERSION}
          </motion.p>
        </motion.div>

        {/* Loading indicator */}
        <div className="flex flex-col items-center gap-3">
          {/* Tip text */}
          <div className="h-5 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={tipIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs text-[var(--color-text-muted)] text-center whitespace-nowrap"
              >
                {LOADING_TIPS[tipIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className="w-48 h-1 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: 'var(--color-accent)' }}
              initial={{ scaleX: 0, originX: 0 }}
              animate={{
                scaleX: ready ? 1 : [0, 0.3, 0.6, 0.4, 0.7, 0.5, 0.8, 0.6, 0.9]
              }}
              transition={
                ready
                  ? { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
                  : {
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      times: [0, 0.15, 0.3, 0.4, 0.55, 0.65, 0.8, 0.9, 1]
                    }
              }
            />
          </div>

          {/* Ready indicator */}
          <AnimatePresence>
            {ready && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-1.5"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--color-success)' }}
                />
                <span
                  className="text-[10px] font-medium"
                  style={{ color: 'var(--color-success)' }}
                >
                  Ready
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Decorative dots at the bottom */}
        <motion.div
          className="flex items-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {Array.from({ length: 3 }, (_, i) => (
            <motion.div
              key={i}
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: 'var(--color-border)' }}
              animate={{
                opacity: [0.2, 0.6, 0.2],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeInOut'
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}