"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface CardData {
  id: string
  title: string
  src: string
}

export const Card = React.memo(
  ({
    card,
    index,
    hovered,
    setHovered,
    canHover,
  }: {
    card: CardData
    index: number
    hovered: number | null
    setHovered: React.Dispatch<React.SetStateAction<number | null>>
    canHover: boolean
  }) => (
    <div
      onMouseEnter={canHover ? () => setHovered(index) : undefined}
      onMouseLeave={canHover ? () => setHovered(null) : undefined}
      className={cn(
        "rounded-lg relative bg-muted overflow-hidden aspect-square w-full transition-all duration-300 ease-out cursor-pointer border border-border/60",
        canHover && hovered !== null && hovered !== index && "blur-sm scale-[0.98]",
      )}
      style={{ willChange: "transform, opacity" }}
    >
      <Image
        src={card.src || "/placeholder.svg"}
        alt={card.title}
        width={400}
        height={400}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover absolute inset-0"
        draggable={false}
        decoding="async"
        loading="lazy"
      />
      <div
        className={cn(
          "absolute inset-0 bg-black/50 dark:bg-black/60 flex items-end py-8 px-4 transition-opacity duration-300",
          canHover ? (hovered === index ? "opacity-100" : "opacity-0") : "opacity-0 md:opacity-0",
        )}
      >
        <div className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-200 dark:from-neutral-50 dark:to-neutral-300">
          {card.title}
        </div>
      </div>
    </div>
  ),
)

Card.displayName = "Card"

export function FocusCards({ cards }: { cards: CardData[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [canHover, setCanHover] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)")
    const update = () => setCanHover(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto md:px-8 w-full">
      {cards.map((card, index) => (
        <Card key={card.id} card={card} index={index} hovered={hovered} setHovered={setHovered} canHover={canHover} />
      ))}
    </div>
  )
}
