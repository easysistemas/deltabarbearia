"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, User, Mail, Lock, Shield, Save, X } from "lucide-react"
import { fetchUsersDB, updateUserDB } from "@/lib/db_actions"
import type { User as UserType } from "@/lib/types"

export function UserSettingsDialog() {
    const [users, setUsers] = useState<UserType[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")
    const [isOpen, setIsOpen] = useState(false)

    async function loadUsers() {
        setLoading(true)
        const data = await fetchUsersDB()
        setUsers(data)
        setLoading(false)
    }

    useEffect(() => {
        if (isOpen) {
            loadUsers()
        }
    }, [isOpen])

    const handleSelectUser = (user: UserType) => {
        setSelectedUser(user)
        setEmail(user.email)
        setName(user.name)
        setPassword("") // Don't show current password
    }

    const handleSave = async () => {
        if (!selectedUser) return

        try {
            const updates: any = { name, email }
            if (password) updates.password = password

            await updateUserDB(selectedUser.id, updates)
            alert("Usuário atualizado com sucesso!")
            loadUsers()
            setSelectedUser(null)
            setPassword("")
        } catch (error) {
            alert("Erro ao atualizar usuário.")
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary">
                    <Settings size={18} />
                    Gerenciar Contas
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-background border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="text-primary" size={20} />
                        Gerenciamento de Usuários
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {!selectedUser ? (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">Selecione um usuário para editar as credenciais:</p>
                            <div className="grid gap-2">
                                {users.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleSelectUser(user)}
                                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${user.role === 'ADMIN' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'}`}>
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${user.role === 'ADMIN' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'}`}>
                                            {user.role}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-foreground">Editando: {selectedUser.name}</h3>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                                    <X size={16} className="mr-1" /> Voltar
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Nome</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <Input
                                        id="edit-name"
                                        className="pl-9"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-email">E-mail</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <Input
                                        id="edit-email"
                                        className="pl-9"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-password">Nova Senha (deixe em branco para não alterar)</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <Input
                                        id="edit-password"
                                        type="password"
                                        className="pl-9"
                                        value={password}
                                        placeholder="••••••••"
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button className="w-full mt-4" onClick={handleSave}>
                                <Save size={16} className="mr-2" /> Salvar Alterações
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
