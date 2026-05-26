import { useState, useEffect } from "react"
import { fetchCustomerActivePlanDB } from "@/lib/db_actions"
import { CustomerPlan } from "@/lib/types"

export function useCustomerPlan(phone: string | undefined) {
    const [plan, setPlan] = useState<CustomerPlan | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!phone) {
            setPlan(null)
            return
        }

        let isMounted = true

        async function load() {
            setLoading(true)
            try {
                // Sanitize phone just in case, though db action also does it
                const cleanPhone = phone!.replace(/\D/g, "")
                if (!cleanPhone) {
                    if (isMounted) setPlan(null)
                    return
                }

                const activePlan = await fetchCustomerActivePlanDB(cleanPhone)
                if (isMounted) {
                    setPlan(activePlan)
                }
            } catch (error) {
                console.error("Error fetching customer plan:", error)
                if (isMounted) setPlan(null)
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        load()

        return () => {
            isMounted = false
        }
    }, [phone])

    return { plan, loading }
}
