"use client"

import { useRef, useState, useEffect } from "react"
import { useReveal } from "@/hooks/use-reveal"
import { fetchProductsDB } from "@/lib/db_actions"
import { Package } from "lucide-react"
import Image from "next/image"
import type { Product } from "@/lib/types"

export function ProductsSection() {
    const { ref, visible } = useReveal()
    const [products, setProducts] = useState<Product[]>([])

    useEffect(() => {
        fetchProductsDB().then(data => {
            // Filter visible products for landing page
            setProducts(data.filter(p => p.visible !== false).slice(0, 6))
        })
    }, [])

    return (
        <section id="produtos" className="relative bg-background py-24 lg:py-32">
            <div
                ref={ref}
                className={`mx-auto max-w-7xl px-6 lg:px-8 transition-all duration-1000 ${visible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                    }`}
            >
                <div className="mx-auto max-w-2xl text-center mb-16">
                    <div className="mb-6 flex items-center justify-center gap-4">
                        <div className="h-px w-8 bg-primary" />
                        <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">
                            Nossos Produtos
                        </span>
                        <div className="h-px w-8 bg-primary" />
                    </div>
                    <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Leve a experiência para casa
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Utilizamos e vendemos os melhores produtos do mercado para o cuidado da sua barba e cabelo.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
                        >
                            <div className="relative aspect-square overflow-hidden bg-secondary">
                                {product.imageUrl ? (
                                    <Image
                                        src={product.imageUrl || "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQoFtXs6jMUdf-fdRvv5I3rALGeIxSvMQQHeKSaz1VZxUA7c5z_cmZU1jFEWzafhQ2kvXymy4lCNCkeUN5qJZbbjkOgHn9bhSTPqxb4IY-D1w_LP6jXgzdbLKNEgscFz4KrLaoCD38&usqp=CAc"}
                                        alt={product.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
                                        <Package size={48} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            </div>

                            <div className="flex flex-1 flex-col p-2 sm:p-6">
                                <h3 className="font-display text-xs font-bold text-foreground sm:text-xl">
                                    {product.name}
                                </h3>
                                <p className="mt-1 hidden flex-1 text-sm text-muted-foreground sm:block sm:mt-2">
                                    {product.description}
                                </p>
                                <div className="mt-2 flex items-center justify-between border-t border-border pt-2 sm:mt-4 sm:pt-4">
                                    <span className="text-xs font-bold text-primary sm:text-lg">
                                        R$ {product.price.toFixed(2)}
                                    </span>
                                    <span className="hidden text-xs font-medium uppercase tracking-wider text-muted-foreground sm:block">
                                        Em estoque
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
