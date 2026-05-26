"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { useReveal } from "@/hooks/use-reveal"
import { fetchBusinessConfig } from "@/lib/db_actions"
import { Badge } from "@/components/ui/badge"

export function GallerySection() {
  const { ref, visible } = useReveal()
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    fetchBusinessConfig().then(config => {
      if (config && config.gallery && config.gallery.length > 0) {
        setImages(config.gallery)
      } else {
        setImages([
          "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80",
          "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80",
          "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80",
          "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80",
          "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&q=80",
          "https://images.unsplash.com/photo-1593702295094-aea8c5c13d7e?w=800&q=80",
        ])
      }
    })
  }, [])

  // Spans configuration for the 4-image grid
  const SPANS = [
    { span: "col-span-2 row-span-2", aspect: "aspect-square sm:aspect-auto" }, // Large item
    { span: "col-span-1 row-span-1", aspect: "aspect-square" },                 // Small item
    { span: "col-span-1 row-span-1", aspect: "aspect-square" },                 // Small item
    { span: "col-span-2 row-span-1", aspect: "aspect-square" },                 // Wide item
  ]

  // We need exactly 4 images for the grid. Fill with placeholders if needed.
  const displayImages = images.slice(0, 4)

  return (
    <section id="galeria" className="relative bg-card py-28 lg:py-36">
      <div
        ref={ref}
        className={`mx-auto max-w-7xl px-6 lg:px-10 transition-all duration-1000 ${visible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
      >
        <div className="mb-16 text-center">
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">
              Galeria
            </span>
            <div className="h-px w-8 bg-primary" />
          </div>
          <h2 className="font-display text-balance text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            Nosso trabalho fala por si
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {SPANS.map((layout, i) => {
            // Fallback if no dynamic image exists for this slot
            const src = displayImages[i] || "/placeholder.svg"

            return (
              <div
                key={i}
                className={`group relative overflow-hidden ${layout.span} ${layout.aspect}`}
              >
                <Image
                  src={src}
                  alt={`Galeria ${i + 1}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-background/0 transition-colors duration-500 group-hover:bg-background/30" />
              </div>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <a
            href="https://instagram.com/trivbarbearia"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 text-[13px] font-semibold uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-primary"
          >
            Ver mais no Instagram
            <span className="h-px w-8 bg-current" />
          </a>
        </div>
      </div>
    </section>
  )
}
