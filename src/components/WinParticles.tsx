import { useEffect, useRef } from 'react'

type WinParticlesProps = {
  active: boolean
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  radius: number
  alpha: number
  decay: number
  gravity: number
  friction: number
}

const GLOW_COLORS = [
  '#ff3b30', // Hot Crimson
  '#ff9500', // Warm Amber
  '#ffcc00', // Bright Gold
  '#ff2d55', // Neon Coral
  '#ffffff', // Sparkle White
]

export function WinParticles({ active }: WinParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameId = useRef<number | null>(null)

  useEffect(() => {
    if (!active) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
      particlesRef.current = []
      const canvas = canvasRef.current
      if (canvas) {
        const context = canvas.getContext('2d')
        context?.clearRect(0, 0, canvas.width, canvas.height)
      }
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    // Resize handler
    const resizeCanvas = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio
      canvas.height = window.innerHeight * window.devicePixelRatio
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      context.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Spawn burst
    const spawnBurst = (centerX: number, centerY: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 2 + Math.random() * 8
        particlesRef.current.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (1 + Math.random() * 3), // Initial upward boost
          color: GLOW_COLORS[Math.floor(Math.random() * GLOW_COLORS.length)],
          radius: 1.5 + Math.random() * 3.5,
          alpha: 1,
          decay: 0.008 + Math.random() * 0.012,
          gravity: 0.12,
          friction: 0.97,
        })
      }
    }

    // Spawn bursts at multiple screen positions for maximum impact
    const w = window.innerWidth
    const h = window.innerHeight
    spawnBurst(w / 2, h * 0.45, 90) // Main center burst
    
    // Delayed secondary bursts for dynamic firework feel
    const timer1 = setTimeout(() => spawnBurst(w * 0.3, h * 0.35, 50), 350)
    const timer2 = setTimeout(() => spawnBurst(w * 0.7, h * 0.35, 50), 700)

    const tick = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight)

      const particles = particlesRef.current
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        
        // Physics update
        p.vx *= p.friction
        p.vy = (p.vy + p.gravity) * p.friction
        p.x += p.vx
        p.y += p.vy
        p.alpha -= p.decay

        if (p.alpha <= 0) {
          particles.splice(i, 1)
          continue
        }

        // Render p
        context.save()
        context.globalAlpha = p.alpha
        context.shadowBlur = 10
        context.shadowColor = p.color
        context.fillStyle = p.color
        context.beginPath()
        context.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        context.fill()
        context.restore()
      }

      if (particles.length > 0) {
        animationFrameId.current = requestAnimationFrame(tick)
      }
    }

    tick()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      clearTimeout(timer1)
      clearTimeout(timer2)
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  )
}
