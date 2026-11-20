"use client"

import React, { useEffect, useRef } from "react"
import * as THREE from "three"

interface ThreeVaultCanvasProps {
  scrollProgress?: number
}

export default function ThreeVaultCanvas({ scrollProgress = 0 }: ThreeVaultCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    vaultMesh: THREE.Mesh
    innerCore: THREE.Mesh
    ring1: THREE.Mesh
    ring2: THREE.Mesh
    particles: THREE.Points
    pointLight1: THREE.PointLight
    pointLight2: THREE.PointLight
  } | null>(null)

  const mousePos = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })
  const scrollRef = useRef(scrollProgress)

  // Keep scroll progress updated in ref for smooth lerping in the animation loop
  useEffect(() => {
    scrollRef.current = scrollProgress
  }, [scrollProgress])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 1. Scene Setup
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x06080c, 0.035)

    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000)
    camera.position.z = 7

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)

    // 2. 3D Geometries & Materials
    // Central Vault Icosahedron
    const vaultGeo = new THREE.IcosahedronGeometry(1.8, 1)
    const vaultMat = new THREE.MeshPhysicalMaterial({
      color: 0xf4c542,
      metalness: 0.92,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      wireframe: false,
      flatShading: true,
      reflectivity: 0.9
    })
    const vaultMesh = new THREE.Mesh(vaultGeo, vaultMat)
    scene.add(vaultMesh)

    // Inner Glowing Core (Wireframe)
    const coreGeo = new THREE.IcosahedronGeometry(1.2, 2)
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    })
    const innerCore = new THREE.Mesh(coreGeo, coreMat)
    scene.add(innerCore)

    // Orbiting Ring 1 (Gold Torus)
    const ring1Geo = new THREE.TorusGeometry(2.7, 0.04, 16, 100)
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0xf4c542,
      metalness: 0.9,
      roughness: 0.2
    })
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat)
    ring1.rotation.x = Math.PI / 3
    scene.add(ring1)

    // Orbiting Ring 2 (Emerald Torus)
    const ring2Geo = new THREE.TorusGeometry(3.2, 0.03, 16, 100)
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0x00e676,
      metalness: 0.8,
      roughness: 0.3,
      transparent: true,
      opacity: 0.8
    })
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat)
    ring2.rotation.y = Math.PI / 4
    scene.add(ring2)

    // 3. Floating Particle Field (Starfield / Stardust)
    const particleCount = 700
    const particleGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)

    const colorGold = new THREE.Color(0xf4c542)
    const colorEmerald = new THREE.Color(0x10b981)
    const colorCyan = new THREE.Color(0x38bdf8)

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3
      positions[idx] = (Math.random() - 0.5) * 25
      positions[idx + 1] = (Math.random() - 0.5) * 25
      positions[idx + 2] = (Math.random() - 0.5) * 20

      // Distribute luxury colors
      const randColor = Math.random()
      const chosenColor = randColor > 0.6 ? colorGold : randColor > 0.3 ? colorEmerald : colorCyan
      colors[idx] = chosenColor.r
      colors[idx + 1] = chosenColor.g
      colors[idx + 2] = chosenColor.b
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3))

    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    })

    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const pointLight1 = new THREE.PointLight(0xf4c542, 25, 20)
    pointLight1.position.set(4, 4, 4)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0x10b981, 20, 20)
    pointLight2.position.set(-4, -3, 3)
    scene.add(pointLight2)

    const pointLight3 = new THREE.PointLight(0x6366f1, 15, 20)
    pointLight3.position.set(0, 5, -2)
    scene.add(pointLight3)

    sceneRef.current = {
      renderer,
      scene,
      camera,
      vaultMesh,
      innerCore,
      ring1,
      ring2,
      particles,
      pointLight1,
      pointLight2
    }

    // 5. Mouse Parallax Tracker
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = -(e.clientY / window.innerHeight) * 2 + 1
      mousePos.current.targetX = x * 0.4
      mousePos.current.targetY = y * 0.4
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })

    // 6. Resize Handler
    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth || window.innerWidth
      const h = container.clientHeight || window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener("resize", handleResize)

    // 7. Animation Loop with Smooth Lerping
    let animationFrameId: number
    let clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      const delta = clock.getDelta()
      const time = clock.getElapsedTime()

      // Smooth mouse lerp
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.05
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.05

      const scroll = scrollRef.current

      // Vault Mesh Rotation & Dynamics
      if (vaultMesh) {
        vaultMesh.rotation.x = time * 0.2 + mousePos.current.y + scroll * Math.PI * 2
        vaultMesh.rotation.y = time * 0.3 + mousePos.current.x + scroll * Math.PI * 1.5
        // Pulse scale gently
        const scale = 1 + Math.sin(time * 1.5) * 0.04
        vaultMesh.scale.set(scale, scale, scale)
      }

      // Inner Core Counter-Rotation
      if (innerCore) {
        innerCore.rotation.x = -time * 0.25 - scroll * Math.PI
        innerCore.rotation.y = -time * 0.35 + scroll * Math.PI
      }

      // Orbiting Rings
      if (ring1) {
        ring1.rotation.z = time * 0.4 + scroll * 3
        ring1.rotation.x = Math.PI / 3 + Math.sin(time * 0.5) * 0.2
      }
      if (ring2) {
        ring2.rotation.z = -time * 0.3 - scroll * 2.5
        ring2.rotation.y = Math.PI / 4 + Math.cos(time * 0.5) * 0.2
      }

      // Particles Gentle Drift + Speedup on Scroll
      if (particles) {
        particles.rotation.y = time * 0.04 + scroll * 0.5
        particles.rotation.x = Math.sin(time * 0.02) * 0.2
      }

      // Camera Position Linked to Scroll (3D Traveling Camera)
      camera.position.x = mousePos.current.x * 1.2
      camera.position.y = mousePos.current.y * 1.2 - scroll * 1.5
      camera.position.z = 7 - scroll * 2.5
      camera.lookAt(0, -scroll * 0.5, 0)

      renderer.render(scene, camera)
    }

    animate()

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
      vaultGeo.dispose()
      vaultMat.dispose()
      coreGeo.dispose()
      coreMat.dispose()
      ring1Geo.dispose()
      ring1Mat.dispose()
      ring2Geo.dispose()
      ring2Mat.dispose()
      particleGeo.dispose()
      particleMat.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ opacity: 0.9 }}
    />
  )
}
