"use client"

import React, { useRef, useState } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

interface ThreeDCardProps {
  children: React.ReactNode
  className?: string
  glowColor?: "gold" | "emerald" | "cyan" | "indigo" | "rose"
  depth?: number
  onClick?: () => void
}

export default function ThreeDCard({
  children,
  className = "",
  glowColor = "gold",
  depth = 30,
  onClick
}: ThreeDCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  // Motion values for smooth 3D tilt
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Spring physics for buttery-smooth reaction
  const springConfig = { stiffness: 350, damping: 25 }
  const smoothMouseX = useSpring(mouseX, springConfig)
  const smoothMouseY = useSpring(mouseY, springConfig)

  // Map mouse coordinate (-0.5 to 0.5) to tilt degrees
  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [12, -12])
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-12, 12])

  // Specular sheen highlight coordinate
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    const x = (e.clientX - rect.left) / width - 0.5
    const y = (e.clientY - rect.top) / height - 0.5

    mouseX.set(x)
    mouseY.set(y)

    setGlarePos({
      x: ((e.clientX - rect.left) / width) * 100,
      y: ((e.clientY - rect.top) / height) * 100
    })
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    mouseX.set(0)
    mouseY.set(0)
  }

  const glowStyles = {
    gold: "hover:border-[#F4C542]/40 hover:shadow-2xl hover:shadow-[#F4C542]/15",
    emerald: "hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/15",
    cyan: "hover:border-cyan-500/40 hover:shadow-2xl hover:shadow-cyan-500/15",
    indigo: "hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/15",
    rose: "hover:border-rose-500/40 hover:shadow-2xl hover:shadow-rose-500/15"
  }

  return (
    <div
      style={{ perspective: 1200 }}
      className="relative w-full"
      onClick={onClick}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d"
        }}
        className={`relative rounded-3xl transition-colors duration-300 backdrop-blur-2xl border border-white/10 dark:border-white/10 bg-[#0E131F]/80 overflow-hidden cursor-pointer ${glowStyles[glowColor]} ${className}`}
      >
        {/* Dynamic Specular Sheen / Glare overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 rounded-3xl"
          style={{
            opacity: isHovered ? 0.45 : 0,
            background: `radial-gradient(circle 320px at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.2), transparent 70%)`
          }}
        />

        {/* Ambient subtle border rim */}
        <div className="absolute inset-0 rounded-3xl border border-white/[0.08] pointer-events-none z-10" />

        {/* Card Content with elevated 3D depth */}
        <div
          style={{
            transform: isHovered ? `translateZ(${depth}px)` : "translateZ(0px)",
            transition: "transform 0.25s ease-out"
          }}
          className="relative z-10 p-6 sm:p-8"
        >
          {children}
        </div>
      </motion.div>
    </div>
  )
}
