import Link from "next/link"
import { Instagram, MessageCircle } from "lucide-react"

export function LandingFooter() {
  const whatsappLink =
    "https://wa.me/5585991694689?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20a%20TRIV%20Barbearia"

  return (
    <footer className="border-t border-border/50 py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col items-center gap-10">
          {/* Logo */}
          <Link href="/" className="flex flex-col items-center gap-2">
            <span className="font-display text-3xl font-bold tracking-wide text-foreground">
              TRIV
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">
              Barbearia
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex flex-wrap justify-center gap-8">
            {[
              { label: "Sobre", href: "#sobre" },
              { label: "Servicos", href: "#servicos" },
              { label: "Planos", href: "#planos" },
              { label: "Equipe", href: "#equipe" },
              { label: "Galeria", href: "#galeria" },
              { label: "Contato", href: "#contato" },
              { label: "Agendar", href: "/agendar" },
            ].map((item) =>
              item.href.startsWith("#") ? (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-[12px] font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[12px] font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          {/* Social */}
          <div className="flex items-center gap-5">
            <a
              href="https://instagram.com/trivbarbearia"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition-all duration-300 hover:border-primary hover:text-primary"
              aria-label="Instagram TRIV Barbearia"
            >
              <Instagram size={16} />
            </a>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition-all duration-300 hover:border-primary hover:text-primary"
              aria-label="WhatsApp TRIV Barbearia"
            >
              <MessageCircle size={16} />
            </a>
          </div>

          {/* Divider */}
          <div className="h-px w-16 bg-border" />

          {/* Address & copyright */}
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60">
              Rua Apolo, n. 28 - Damas, Fortaleza / CE
            </p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/40">
              {`\u00A9 ${new Date().getFullYear()} TRIV Barbearia. Todos os direitos reservados.`}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
