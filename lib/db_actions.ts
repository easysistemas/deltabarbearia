import { supabase } from "./supabase"
import type { Barber, Product, BusinessConfig, CustomerPlan, Customer, User } from "./types"

// ——— Business Config ———

export async function fetchBusinessConfig(): Promise<BusinessConfig | null> {
    const { data, error } = await supabase
        .from("business_config")
        .select("*")
        .eq("id", 1)
        .single()

    if (error) {
        console.error("Error fetching config:", error)
        return null
    }

    // Map snake_case to camelCase
    return {
        openTime: data.open_time,
        closeTime: data.close_time,
        bufferMin: 10, // Default or add to DB if needed
        daysOff: data.days_off || [],
        cancellationPolicy: data.cancellation_policy || "",
        gallery: data.gallery_images || [],
        heroBgImage: data.hero_bg_image,
        heroTitle: data.hero_title,
        heroSubtitle: data.hero_subtitle,

        // About
        aboutImage: data.about_image,
        aboutTitle: data.about_title,
        aboutDescription: data.about_description,

        // Location
        locationTitle: data.location_title,
        locationAddress: data.location_address,
        locationMapUrl: data.location_map_url,
        locationPhone: data.location_phone,
        contactWhatsapp: data.contact_whatsapp,

        // Differentials
        differentials: data.differentials || [],

        // Testimonials
        testimonials: data.testimonials || [],

        // RBAC
        allowedOperationalPages: data.allowed_operational_pages || ["Agenda"],

        // WhatsApp Template
        whatsappOverdueTemplate: data.whatsapp_overdue_template || 'Olá {cliente}! Notamos que faz tempo que você não vem fazer seu {servico}. Que tal agendar um horário?',

        // Customer Tags
        customerTags: data.customer_tags || [],
    }
}

export async function updateBusinessConfig(config: Partial<BusinessConfig>) {
    const updates: any = {}
    if (config.openTime !== undefined) updates.open_time = config.openTime
    if (config.closeTime !== undefined) updates.close_time = config.closeTime
    if (config.daysOff !== undefined) updates.days_off = config.daysOff
    if (config.cancellationPolicy !== undefined) updates.cancellation_policy = config.cancellationPolicy
    if (config.gallery !== undefined) updates.gallery_images = config.gallery
    if (config.heroBgImage !== undefined) updates.hero_bg_image = config.heroBgImage
    if (config.heroTitle !== undefined) updates.hero_title = config.heroTitle
    if (config.heroSubtitle !== undefined) updates.hero_subtitle = config.heroSubtitle

    // About
    if (config.aboutImage !== undefined) updates.about_image = config.aboutImage
    if (config.aboutTitle !== undefined) updates.about_title = config.aboutTitle
    if (config.aboutDescription !== undefined) updates.about_description = config.aboutDescription

    // Location
    if (config.locationTitle !== undefined) updates.location_title = config.locationTitle
    if (config.locationAddress !== undefined) updates.location_address = config.locationAddress
    if (config.locationMapUrl !== undefined) updates.location_map_url = config.locationMapUrl
    if (config.locationPhone !== undefined) updates.location_phone = config.locationPhone
    if (config.contactWhatsapp !== undefined) updates.contact_whatsapp = config.contactWhatsapp

    // Differentials
    if (config.differentials !== undefined) updates.differentials = config.differentials

    // Testimonials
    if (config.testimonials !== undefined) updates.testimonials = config.testimonials

    // RBAC
    if (config.allowedOperationalPages !== undefined) updates.allowed_operational_pages = config.allowedOperationalPages

    // WhatsApp Template
    if (config.whatsappOverdueTemplate !== undefined) updates.whatsapp_overdue_template = config.whatsappOverdueTemplate

    // Customer Tags
    if (config.customerTags !== undefined) updates.customer_tags = config.customerTags

    const { error } = await supabase
        .from("business_config")
        .update(updates)
        .eq("id", 1)

    if (error) {
        console.error("Error updating config:", error)
        throw error
    }
}

// ——— Barbers ———

export async function fetchBarbersDB(): Promise<Barber[]> {
    const { data, error } = await supabase
        .from("barbers")
        .select("*")
        .order("name")

    if (error) {
        console.error("Error fetching barbers:", error)
        return []
    }

    return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        role: row.role,
        specialties: row.specialties || [],
        avatarUrl: row.image_url,
        instagram: row.instagram,
        active: row.is_active
    }))
}

export async function saveBarberDB(barber: Partial<Barber>) {
    const payload: any = {
        name: barber.name,
        role: barber.role,
        specialties: barber.specialties,
        image_url: barber.avatarUrl,
        instagram: barber.instagram,
        is_active: barber.active
    }

    if (barber.id && !barber.id.startsWith("b_")) { // Assuming temp IDs start with b_ or similar if strictly local
        // Update
        const { error } = await supabase
            .from("barbers")
            .update(payload)
            .eq("id", barber.id)

        if (error) throw error
    } else {
        // Insert
        const { error } = await supabase
            .from("barbers")
            .insert([payload])

        if (error) throw error
    }
}

export async function deleteBarberDB(id: string) {
    const { error } = await supabase
        .from("barbers")
        .delete()
        .eq("id", id)

    if (error) throw error
}

// ——— Products ———

export async function fetchProductsDB(): Promise<Product[]> {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name")

    if (error) {
        console.error("Error fetching products:", error)
        return []
    }

    return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        price: Number(row.price),
        stock: row.stock,
        imageUrl: row.image_url,
        visible: row.visible,
        commissioned: row.commissioned !== false // Default to true if null/undefined
    }))
}

export async function saveProductDB(product: Partial<Product>) {
    const payload: any = {
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        image_url: product.imageUrl,
        visible: product.visible,
        commissioned: product.commissioned
    }

    if (product.id && !product.id.startsWith("p")) { // Check if it's a UUID or local ID
        // Update
        const { error } = await supabase
            .from("products")
            .update(payload)
            .eq("id", product.id)

        if (error) throw error
    } else {
        // Insert
        const { error } = await supabase
            .from("products")
            .insert([payload])

        if (error) throw error
    }
}

export async function deleteProductDB(id: string) {
    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id)

    if (error) throw error
}

// ——— Customer Plans ———

export async function fetchCustomerActivePlanDB(phone: string): Promise<CustomerPlan | null> {
    // Sanitize phone
    const cleanPhone = phone.replace(/\D/g, "")

    const { data, error } = await supabase
        .from("customer_plans")
        .select("*")
        .eq("customer_phone", cleanPhone)
        .eq("status", "active")
        .single()

    // console.log(`[Debug DB] Fetching plan for ${cleanPhone}. Result:`, { data, error })

    if (error) {
        // Silently fail if table doesn't exist yet or no rows returned
        return null
    }

    return {
        id: data.id,
        planId: data.plan_id,
        customerName: data.customer_name,
        customerPhone: data.customer_phone,
        startDate: data.start_date,
        renewsAt: data.renews_at,
        status: data.status,
        usageCount: data.usage_count || 0
    }
}

export async function createCustomerPlanDB(plan: Omit<CustomerPlan, "id" | "createdAt">) {
    const cleanPhone = plan.customerPhone.replace(/\D/g, "")

    const { error } = await supabase
        .from("customer_plans")
        .insert({
            id: crypto.randomUUID(),
            customer_name: plan.customerName,
            customer_phone: cleanPhone,
            plan_id: plan.planId,
            start_date: plan.startDate,
            status: plan.status,
            renews_at: plan.renewsAt,
            active: plan.active ?? true // Default to true if not provided, for legacy compatibility
        })

    if (error) throw error
}

// ——— Customers ———

export async function fetchCustomersDB(): Promise<any[]> {
    const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name")

    if (error) {
        console.error("Error fetching customers:", error)
        return []
    }

    return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        birthDate: row.birth_date,
        notes: row.notes,
        createdAt: row.created_at,
        tags: row.tags || []
    }))
}

export async function createCustomerDB(customer: { name: string, phone: string, birthDate?: string, notes?: string, tags?: string[] }) {
    const cleanPhone = customer.phone.replace(/\D/g, "")

    const { error } = await supabase
        .from("customers")
        .insert({
            name: customer.name,
            phone: cleanPhone,
            birth_date: customer.birthDate,
            notes: customer.notes,
            tags: customer.tags || []
        })

    if (error) throw error
}

export async function updateCustomerDB(id: string, updates: { name?: string, phone?: string, birthDate?: string, notes?: string, tags?: string[] }) {
    const payload: any = {}
    if (updates.name !== undefined) payload.name = updates.name
    if (updates.phone !== undefined) payload.phone = updates.phone.replace(/\D/g, "")
    if (updates.birthDate !== undefined) payload.birth_date = updates.birthDate
    if (updates.notes !== undefined) payload.notes = updates.notes
    if (updates.tags !== undefined) payload.tags = updates.tags

    const { error } = await supabase
        .from("customers")
        .update(payload)
        .eq("id", id)

    if (error) throw error
}

// ——— Expense Categories ———

export async function fetchExpenseCategoriesDB(): Promise<string[]> {
    const { data, error } = await supabase
        .from("expense_categories")
        .select("name")
        .order("name")

    if (error) {
        console.error("Error fetching expense categories:", error)
        return []
    }

    return data.map((row: any) => row.name)
}

export async function createExpenseCategoryDB(name: string) {
    const { error } = await supabase
        .from("expense_categories")
        .insert({ name })

    if (error) {
        console.error("Error creating expense category:", error)
        throw error
    }
}

// ——— Users ———

export async function fetchUsersDB(): Promise<User[]> {
    const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role")
        .order("name")

    if (error) {
        console.error("Error fetching users:", error)
        return []
    }

    return data as User[]
}

export async function updateUserDB(id: string, updates: { name?: string, email?: string, password?: string }) {
    const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", id)

    if (error) {
        console.error("Error updating user:", error)
        throw error
    }
}
