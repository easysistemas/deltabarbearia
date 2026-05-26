"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import type { Product } from "@/lib/types"

interface ProductDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    product?: Product
    onSave: (product: Product) => void
}

export function ProductDialog({
    open,
    onOpenChange,
    product,
    onSave,
}: ProductDialogProps) {
    const [formData, setFormData] = useState<Partial<Product>>({})

    useEffect(() => {
        if (product) {
            setFormData(product)
        } else {
            setFormData({
                name: "",
                description: "",
                price: 0,
                stock: 0,
                imageUrl: "",
                visible: true,
                commissioned: true,
            })
        }
    }, [product, open])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name || formData.price === undefined || formData.stock === undefined) return

        const newProduct: Product = {
            id: product?.id || crypto.randomUUID(),
            name: formData.name,
            description: formData.description || "",
            price: Number(formData.price),
            stock: Number(formData.stock),
            imageUrl: formData.imageUrl || "",
            visible: formData.visible !== undefined ? formData.visible : true,
            commissioned: formData.commissioned !== undefined ? formData.commissioned : true,
        }

        onSave(newProduct)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[90vw] rounded-lg sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{product ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                    <DialogDescription>
                        {product
                            ? "Edite as informações do produto abaixo."
                            : "Preencha as informações para criar um novo produto."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome do Produto</Label>
                            <Input
                                id="name"
                                value={formData.name || ""}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Pomada Modeladora"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                value={formData.description || ""}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Breve descrição do produto"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="imageUrl">URL da Imagem</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="imageUrl"
                                    value={formData.imageUrl || ""}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            {formData.imageUrl && (
                                <div className="mt-2 aspect-square w-24 overflow-hidden rounded-lg border bg-secondary">
                                    <img
                                        src={formData.imageUrl}
                                        alt="Preview"
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.style.display = "none"
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="price">Preço (R$)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.price || 0}
                                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="stock">Estoque</Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    min="0"
                                    value={formData.stock || 0}
                                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch
                            id="visible"
                            checked={formData.visible !== false}
                            onCheckedChange={(checked) => setFormData({ ...formData, visible: checked })}
                        />
                        <Label htmlFor="visible">Visível no site?</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch
                            id="commissioned"
                            checked={formData.commissioned !== false}
                            onCheckedChange={(checked) => setFormData({ ...formData, commissioned: checked })}
                        />
                        <Label htmlFor="commissioned">Gera Comissão? (10%)</Label>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">Salvar</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    )
}
