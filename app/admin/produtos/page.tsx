"use client"

import { useState, useEffect } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Plus, Search, Edit2, Trash2, X, Eye, EyeOff, Pencil, Package } from "lucide-react"
import type { Product } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { fetchProductsDB, saveProductDB, deleteProductDB } from "@/lib/db_actions"
import { ProductDialog } from "@/components/admin/product-dialog"
import { toast } from "sonner"

export default function ProductsPage() {
    const [products, setProductsState] = useState<Product[]>([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined)

    const load = () => {
        fetchProductsDB().then(setProductsState)
    }

    useEffect(() => {
        load()
    }, [])

    const handleSave = async (product: Product) => {
        try {
            if (editingProduct) {
                await saveProductDB(product)
                toast.success("Produto atualizado com sucesso")
            } else {
                // New product: remove temporary ID to ensure insertion
                const { id, ...data } = product
                await saveProductDB(data)
                toast.success("Produto criado com sucesso")
            }
            load()
            setDialogOpen(false)
        } catch (error: any) {
            console.error(error)
            toast.error("Erro ao salvar produto: " + (error.message || JSON.stringify(error)))
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm("Tem certeza que deseja excluir este produto?")) {
            try {
                await deleteProductDB(id)
                load()
                toast.success("Produto removido com sucesso")
            } catch (error) {
                console.error(error)
                toast.error("Erro ao excluir produto")
            }
        }
    }

    return (
        <AdminShell>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Produtos</h1>
                    <p className="text-sm text-muted-foreground">
                        Gerencie o estoque e preços dos produtos
                    </p>
                </div>
                <Button onClick={() => {
                    setEditingProduct(undefined)
                    setDialogOpen(true)
                }} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" /> Novo Produto
                </Button>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Nome</TableHead>
                                <TableHead>Preço</TableHead>
                                <TableHead className="w-[100px]">Estoque</TableHead>
                                <TableHead className="w-[100px]">Visível</TableHead>
                                <TableHead className="w-[100px]">Comissão</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        Nenhum produto cadastrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.map((product) => (
                                    <TableRow key={product.id} className="hover:bg-secondary/50">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
                                                    {product.imageUrl ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Package size={20} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-foreground">{product.name}</div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>R$ {product.price.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.stock > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                                                {product.stock} un
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={product.visible !== false ? "default" : "secondary"} className={product.visible !== false ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" : "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"}>
                                                {product.visible ? "Sim" : "Não"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={product.commissioned !== false ? "default" : "secondary"} className={product.commissioned !== false ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25" : "bg-muted text-muted-foreground"}>
                                                {product.commissioned !== false ? "Sim" : "Não"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                    onClick={() => {
                                                        setEditingProduct(product)
                                                        setDialogOpen(true)
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDelete(product.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <ProductDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                product={editingProduct}
                onSave={handleSave}
            />
        </AdminShell>
    )
}
