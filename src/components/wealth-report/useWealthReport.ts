"use client"

import { useState } from "react"

interface WealthReportData {
  user: any
  holdings: any[]
  sips: any[]
  chartData: any[]
  totalInvestment: number
  currentValue: number
  goldPrice: number
  silverPrice: number
  niftyPrice: number
  currentDate: string
}

export function useWealthReport() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)
  const [statusText, setStatusText] = useState("")
  const TOTAL_PAGES = 10

  const triggerWealthReportPdf = async (data: WealthReportData) => {
    try {
      setIsGenerating(true)
      setGenerationStep(0)
      setStatusText("Initializing Render Pipeline...")

      // Dynamically Import to prevent server bundling issues
      const html2canvas = (await import("html2canvas")).default
      const { jsPDF } = await import("jspdf")

      // Small delay to allow off-screen DOM element to completely render with hydrated props and recharts
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Initialize A4 jsPDF Instance (Standard A4 measures 210mm x 297mm)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      })

      const pdfWidth = 210 // mm
      const pdfHeight = 297 // mm

      for (let pageNum = 1; pageNum <= TOTAL_PAGES; pageNum++) {
        setGenerationStep(pageNum)
        setStatusText(`Rasterizing Page ${pageNum} of ${TOTAL_PAGES}...`)

        const elementId = `report-page-${pageNum}`
        const element = document.getElementById(elementId)

        if (!element) {
          console.error(`PDF Generation Error: Element ID ${elementId} not found in template container.`)
          continue
        }

        // Render container to high-quality Retina Canvas
        const canvas = await html2canvas(element, {
          scale: 2, // 2x for ultra-crisp vector rendering
          useCORS: true, // enable loading cross-origin company logos if present
          backgroundColor: "#020617", // Slate-950 fallback
          logging: false,
          windowWidth: 1000, // Lock layout boundaries for consistency
          windowHeight: 1414
        })

        const imgData = canvas.toDataURL("image/jpeg", 0.95) // High quality JPEG to preserve gradient dithering

        // For first page, replace initial empty page, for subsequent pages add a new page
        if (pageNum > 1) {
          pdf.addPage()
        }

        // Append image exactly covering full page canvas boundaries
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST")

        // Tiny macro-task yield to allow Browser thread breathing room and UI updates
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      setStatusText("Finalizing System Package...")
      const safeEmail = data.user?.email?.split('@')[0] || "Investor"
      const filename = `BunVault_WealthReport_${safeEmail}_${new Date().toISOString().slice(0,10)}.pdf`

      pdf.save(filename)
      setStatusText("Report Dispatched Successfully!")

      // Let completion state linger briefly before teardown
      await new Promise((resolve) => setTimeout(resolve, 800))
    } catch (error) {
      console.error("Failed to compile Wealth Report PDF Pack:", error)
      alert("PDF generation failed during rasterization. Please ensure dynamic chart packages are hydrated.")
    } finally {
      setIsGenerating(false)
      setGenerationStep(0)
      setStatusText("")
    }
  }

  return {
    triggerWealthReportPdf,
    isGenerating,
    generationStep,
    totalSteps: TOTAL_PAGES,
    statusText
  }
}
