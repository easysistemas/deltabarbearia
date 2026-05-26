"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Menu, X, MapPin, Instagram, Phone, 
  Clock, Check, Plus, Minus, Star,
  Calendar, Scissors, Smartphone
} from "lucide-react";
import Link from "next/link";

// ----------------------------------------------------------------------
// SVG Components & Utilities
// ----------------------------------------------------------------------
const DeltaTriangle = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
    <path d="M50 0 L100 100 L0 100 Z" />
  </svg>
);

function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1, ...options });

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }
    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [options]);

  return [elementRef, isIntersecting] as const;
}

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const [ref, isVisible] = useIntersectionObserver();
  return (
    <div 
      ref={ref} 
      className={`${className} transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const AccordionItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`border-b border-border transition-colors duration-300 ${isOpen ? 'border-primary' : ''}`}>
      <button 
        className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`font-sans font-semibold text-lg md:text-xl transition-colors duration-300 ${isOpen ? 'text-primary' : 'text-text group-hover:text-primary'}`}>
          {question}
        </span>
        <span className={`flex-shrink-0 ml-4 transition-transform duration-300 ${isOpen ? 'text-primary rotate-45' : 'text-text-muted group-hover:text-primary'}`}>
          <Plus className="w-6 h-6" />
        </span>
      </button>
      <div 
        className="accordion-content overflow-hidden"
        style={{ 
          maxHeight: isOpen ? '500px' : '0px',
          opacity: isOpen ? 1 : 0 
        }}
      >
        <p className="pb-6 text-text-muted leading-relaxed text-lg">
          {answer}
        </p>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Main Page Component
// ----------------------------------------------------------------------
export default function DeltaLanding() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress((totalScroll / windowHeight) * 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const CTA_LINK = "https://cashbarber.com.br/deltabarbearia";
  const WHATSAPP_LINK = "https://wa.me/5585992179655?text=Vim%20pelo%20Site%20e%20gostaria%20de%20agendar";
  const LOGO_URL = "/logo.png";

  return (
    <div className="min-h-screen bg-background text-text font-sans selection:bg-primary selection:text-white">
      
      {/* Scroll Progress */}
      <div className="fixed top-0 left-0 h-[3px] bg-primary z-50 transition-all duration-100" style={{ width: `${scrollProgress}%` }} />

      {/* Floating WhatsApp */}
      <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 bg-primary rounded-full shadow-lg hover:scale-110 transition-transform duration-300 group">
        <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-50"></div>
        <Phone className="w-6 h-6 text-white relative z-10" />
      </a>

      {/* Header */}
      <header className={`fixed top-0 w-full z-40 transition-all duration-300 ${isScrolled ? 'bg-background shadow-[0_4px_30px_rgba(0,0,0,0.8)] border-b border-border py-2' : 'bg-background py-4'}`}>
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="relative flex items-center h-full w-32 md:w-48 z-50">
            <img src={LOGO_URL} alt="Delta Barbearia" className="absolute top-1/2 -translate-y-1/2 left-0 h-16 md:h-24 w-auto max-w-none object-contain drop-shadow-2xl" />
          </Link>
          
          <nav className="hidden lg:flex items-center gap-8">
            {['Sobre', 'Planos', 'Galeria', 'Serviços', 'FAQ', 'Contato'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-semibold tracking-wider uppercase text-text-muted hover:text-white transition-colors">
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <Link href="/admin" className="text-sm font-bold tracking-widest uppercase text-text-muted hover:text-white transition-colors border border-border px-4 py-2 rounded-sm hover:border-primary">
              Admin
            </Link>
            <a href={CTA_LINK} target="_blank" rel="noopener noreferrer" className="bg-primary text-white px-6 py-3 rounded-sm font-bold hover:bg-primary-hover transition-colors uppercase tracking-widest text-sm">
              Assinar Agora
            </a>
          </div>

          <button className="lg:hidden text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div className={`fixed inset-0 bg-background z-30 transform transition-transform duration-300 ease-out ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} lg:hidden pt-28 px-8 flex flex-col`}>
        <nav className="flex flex-col gap-6">
          {['Sobre', 'Planos', 'Galeria', 'Serviços', 'FAQ', 'Contato'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="font-display text-5xl text-white hover:text-primary transition-colors">
              {item}
            </a>
          ))}
          <div className="flex flex-col gap-4 mt-8">
            <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="border border-border text-white px-6 py-4 rounded-sm font-bold text-center text-xl uppercase tracking-widest hover:border-primary">
              Acesso Admin
            </Link>
            <a href={CTA_LINK} target="_blank" rel="noopener noreferrer" className="bg-primary text-white px-6 py-5 rounded-sm font-bold text-center text-xl uppercase tracking-widest">
              Assinar Agora
            </a>
          </div>
        </nav>
        <DeltaTriangle className="absolute -bottom-10 -right-10 w-96 h-96 text-surface-light opacity-20 -z-10 rotate-12" />
      </div>

      {/* 2. HERO */}
      <section className="relative min-h-[100svh] flex items-center pt-24 md:pt-24 pb-10 md:pb-16 overflow-hidden bg-background">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img src="/images/barbearia-em-fortaleza-7.webp" alt="Barbearia Delta" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background"></div>
        </div>

        {/* Giant Watermark Triangle */}
        <DeltaTriangle className="absolute top-1/2 -translate-y-1/2 -right-48 w-[800px] h-[800px] text-white opacity-[0.02] pointer-events-none transform rotate-12 z-0" />

        <div className="container mx-auto px-4 md:px-8 relative z-10 flex flex-col lg:flex-row items-center gap-6 md:gap-12">
          
          <div className="w-full lg:w-[60%] flex flex-col items-start pt-6 md:pt-10">
            <FadeIn className="w-full sm:w-auto">
              <div className="inline-flex bg-primary text-white px-3 py-1.5 md:px-4 md:py-1.5 rounded-full text-[9px] sm:text-xs font-mono font-bold tracking-[0.1em] md:tracking-[0.2em] mb-4 md:mb-8 shadow-[0_0_15px_rgba(197,154,34,0.4)] text-center leading-tight sm:leading-normal">
                BARBEARIA POR ASSINATURA EM FORTALEZA
              </div>
            </FadeIn>
            
            <FadeIn delay={100}>
              <h1 className="font-display text-6xl sm:text-7xl lg:text-[10rem] leading-[0.85] text-white mb-4 md:mb-6 uppercase">
                Corte e Barba <br />
                <span className="relative inline-block">
                  Ilimitados
                  <span className="absolute bottom-1 sm:bottom-2 left-0 w-full h-[8px] sm:h-[12px] bg-primary -z-10"></span>
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={200}>
              <p className="text-base sm:text-xl md:text-2xl text-text-muted mb-6 md:mb-10 max-w-2xl font-light">
                Cortes ilimitados, Barba Sempre Alinhada. Assine um Plano e Venha Sempre que Quiser!
              </p>
            </FadeIn>

            <FadeIn delay={300} className="w-full">
              <div className="flex flex-wrap gap-2 md:gap-3 mb-8 md:mb-12">
                {["Cortes e Barba Ilimitados", "Preço Fixo Mensal", "Atendimento Sem Filas", "Estilo Garantido o Mês Inteiro"].map((badge, i) => (
                  <div key={i} className="flex items-center gap-1.5 md:gap-2 bg-surface-light border border-border px-2 py-1.5 md:px-4 md:py-2 rounded-sm">
                    <Check className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                    <span className="text-[10px] md:text-sm font-semibold text-white tracking-wide uppercase">{badge}</span>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={400} className="w-full flex flex-col sm:flex-row items-center gap-4 md:gap-6">
              <a href={CTA_LINK} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto bg-primary text-white px-6 py-4 md:px-10 md:py-5 rounded-sm font-bold text-sm md:text-lg hover:bg-primary-hover transition-colors flex items-center justify-center uppercase tracking-widest text-center">
                Assinar Agora — a partir de R$ 97/mês
              </a>
              <a href="#planos" className="text-sm md:text-base text-text-muted hover:text-white font-semibold transition-colors underline underline-offset-4 decoration-border hover:decoration-white">
                Ver todos os planos ↓
              </a>
            </FadeIn>
          </div>

          <div className="hidden lg:flex w-[40%] justify-end relative">
            <FadeIn delay={500} className="w-full max-w-md relative">
              <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full"></div>
              {/* Preview Cards Stack */}
              <div className="relative z-10 flex flex-col gap-4 transform rotate-2">
                <div className="bg-surface-light border border-border p-6 rounded-sm shadow-2xl transform hover:-translate-y-2 transition-transform">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-display text-3xl">CORTE</span>
                    <span className="font-sans font-bold text-xl">R$ 97</span>
                  </div>
                  <p className="text-sm text-text-muted">Cortes ilimitados no mês</p>
                </div>
                <div className="bg-primary text-white p-6 rounded-sm shadow-[0_20px_40px_rgba(230,57,70,0.2)] transform -translate-x-4 hover:-translate-y-2 transition-transform">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-display text-3xl">CORTE + BARBA</span>
                    <span className="font-sans font-bold text-xl">R$ 179,90</span>
                  </div>
                  <p className="text-sm text-white/80">Ilimitado o mês inteiro</p>
                </div>
              </div>
            </FadeIn>
          </div>

        </div>
      </section>

      {/* 3. PROVA SOCIAL (Marquee) */}
      <section className="py-6 bg-surface border-y border-border overflow-hidden marquee-wrapper">
        <div className="whitespace-nowrap inline-flex animate-marquee">
          {/* Double content for infinite loop */}
          {[1, 2].map((loop) => (
            <div key={loop} className="flex items-center gap-12 px-6">
              {[
                { txt: "Melhor assinatura de barbearia em Fortaleza", author: "Abilton G." },
                { txt: "Qualidade muito boa nos serviços e profissionais", author: "Marcus C." },
                { txt: "Atendimento sensacional, experiência incrível", author: "Renan M." },
                { txt: "Pontual, prestativo, corte ficou uma maravilha", author: "Silas S." },
                { txt: "Local limpo, organizado, equipe preparada", author: "Railson T." }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-primary text-primary" />)}
                  </div>
                  <span className="text-white font-medium">"{item.txt}"</span>
                  <span className="text-text-muted">— {item.author}</span>
                  <span className="text-border mx-4">|</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* 4. SOBRE */}
      <section id="sobre" className="py-24 md:py-32 bg-surface relative overflow-hidden">
        <DeltaTriangle className="absolute bottom-0 left-0 w-96 h-96 text-white opacity-[0.03] transform -translate-x-1/2 translate-y-1/4" />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            <div className="lg:w-1/2">
              <FadeIn>
                <div className="font-mono text-primary font-bold tracking-[0.2em] text-sm mb-4">NOSSA HISTÓRIA</div>
                <h2 className="font-display text-5xl md:text-7xl leading-none text-white mb-8">
                  A NOVA FORMA DE CUIDAR DO SEU ESTILO
                </h2>
                <div className="h-1 w-20 bg-primary mb-8"></div>
              </FadeIn>
            </div>
            <div className="lg:w-1/2">
              <FadeIn delay={200}>
                <div className="text-xl text-text-muted leading-relaxed mb-12 space-y-6">
                  <p>
                    A Delta Barbearia nasceu em Fortaleza (2024) para transformar a forma como você cuida de si. Unimos tradição, técnica e inovação em um ambiente acolhedor e totalmente pensado para o seu conforto.
                  </p>
                  <p>
                    Trabalhamos com um modelo exclusivo de <strong>assinatura mensal</strong>: você paga um valor fixo e tem acesso a cortes e barba ilimitados. É só assinar, agendar pelo app e vir sempre que quiser. Simples assim. Mais praticidade, estilo constante e economia real para o seu dia a dia.
                  </p>
                  <p className="text-white font-medium border-l-2 border-primary pl-4">
                    "Aqui, cada corte é um compromisso com a sua evolução. Porque acreditamos que mudar o visual também é uma forma de crescer."
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { val: "2024", lbl: "Fundada em", Icon: Calendar },
                    { val: "Ilimitados", lbl: "Cortes", Icon: Scissors },
                    { val: "Via App", lbl: "Agendamento", Icon: Smartphone },
                    { val: "5 Estrelas", lbl: "No Google", Icon: Star },
                  ].map((stat, i) => (
                    <div key={i} className="bg-surface-light p-6 border border-border rounded-sm group hover:border-primary transition-colors">
                      <stat.Icon className="w-8 h-8 text-white mb-4 group-hover:text-primary transition-colors" />
                      <div className="font-display text-3xl text-primary">{stat.val}</div>
                      <div className="text-sm font-semibold text-text-muted tracking-wider uppercase">{stat.lbl}</div>
                    </div>
                  ))}
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PLANOS (CLUBE DELTA) */}
      <section id="planos" className="py-24 md:py-32 bg-background relative">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-20">
            <FadeIn>
              <div className="font-mono text-primary font-bold tracking-[0.2em] text-sm mb-4">CLUBE DELTA</div>
              <h2 className="font-display text-6xl md:text-8xl text-white mb-4">ESCOLHA SEU PLANO</h2>
              <p className="text-xl text-text-muted max-w-2xl mx-auto">Assine, agende pelo app e venha sempre que quiser.</p>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center max-w-7xl mx-auto mb-16">
            
            {/* Card 1 */}
            <FadeIn delay={100} className="h-full">
              <div className="bg-surface-light border border-border p-8 md:p-12 flex flex-col h-full rounded-sm hover:border-primary transition-colors">
                <h3 className="font-display text-5xl mb-2">CORTE</h3>
                <div className="mb-2">
                  <span className="text-5xl font-bold font-sans">R$ 97</span>
                  <span className="text-text-muted text-lg">/mês</span>
                </div>
                <div className="inline-block bg-background px-3 py-1 text-sm text-text-muted border border-border rounded-sm mb-10 w-max">
                  Corte avulso: R$ 65,00
                </div>
                
                <ul className="space-y-4 mb-10 flex-1">
                  {["Cortes de Cabelo Ilimitados", "Preço Fixo Mensal", "Sem Filas — Agendamento pelo App", "10% off em serviços extras e produtos", "Estilo garantido o mês inteiro"].map((ben, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-text-muted">{ben}</span>
                    </li>
                  ))}
                </ul>
                <a href={CTA_LINK} target="_blank" rel="noopener noreferrer" className="w-full block text-center border-2 border-primary text-primary px-8 py-4 font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-colors rounded-sm">
                  Assinar Agora
                </a>
              </div>
            </FadeIn>

            {/* Card 3 (Center) */}
            <FadeIn delay={200} className="h-full lg:scale-105 z-10 relative">
              <div className="bg-primary p-8 md:p-12 flex flex-col h-full rounded-sm shadow-[0_20px_50px_rgba(197,154,34,0.3)]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-primary px-6 py-2 rounded-full text-xs font-mono font-bold tracking-[0.2em] shadow-lg flex items-center gap-2 w-max">
                  <Star className="w-3 h-3 fill-primary" /> MAIS ASSINADO
                </div>
                <h3 className="font-display text-5xl text-white mb-2 mt-4">CORTE + BARBA</h3>
                <div className="mb-2">
                  <span className="text-5xl font-bold font-sans text-white">R$ 179,90</span>
                  <span className="text-white/80 text-lg">/mês</span>
                </div>
                <div className="inline-block bg-black/20 px-3 py-1 text-sm text-white/90 rounded-sm mb-10 w-max border border-white/10">
                  Avulsos: R$ 130,00
                </div>
                
                <ul className="space-y-4 mb-10 flex-1">
                  {["Cortes de Cabelo Ilimitados", "Cortes de Barba Ilimitados", "Preço Fixo Mensal", "Sem Filas — Agendamento pelo App", "10% off em serviços extras e produtos", "Estilo garantido o mês inteiro"].map((ben, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                      <span className="text-white/90">{ben}</span>
                    </li>
                  ))}
                </ul>
                <a href={CTA_LINK} target="_blank" rel="noopener noreferrer" className="w-full block text-center bg-white text-primary px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors rounded-sm shadow-lg">
                  Assinar Agora
                </a>
              </div>
            </FadeIn>

            {/* Card 2 */}
            <FadeIn delay={300} className="h-full">
              <div className="bg-surface-light border border-border p-8 md:p-12 flex flex-col h-full rounded-sm hover:border-primary transition-colors">
                <h3 className="font-display text-5xl mb-2">BARBA</h3>
                <div className="mb-2">
                  <span className="text-5xl font-bold font-sans">R$ 107</span>
                  <span className="text-text-muted text-lg">/mês</span>
                </div>
                <div className="inline-block bg-background px-3 py-1 text-sm text-text-muted border border-border rounded-sm mb-10 w-max">
                  Barba avulsa: R$ 65,00
                </div>
                
                <ul className="space-y-4 mb-10 flex-1">
                  {["Cortes de Barba Ilimitados", "Preço Fixo Mensal", "Sem Filas — Agendamento pelo App", "10% off em serviços extras e produtos", "Estilo garantido o mês inteiro"].map((ben, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-text-muted">{ben}</span>
                    </li>
                  ))}
                </ul>
                <a href={CTA_LINK} target="_blank" rel="noopener noreferrer" className="w-full block text-center border-2 border-primary text-primary px-8 py-4 font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-colors rounded-sm">
                  Assinar Agora
                </a>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={400} className="text-center">
            <p className="text-text-muted mb-12">Cancele quando quiser, sem taxas ou burocracia.</p>
            <div className="bg-surface-light border border-primary/30 p-8 rounded-sm inline-flex flex-col md:flex-row items-center gap-6 justify-center w-full max-w-4xl relative overflow-hidden">
              <div className="absolute left-0 top-0 w-2 h-full bg-primary"></div>
              <p className="text-lg text-white font-medium text-left">
                <strong className="text-primary block mb-1">Ainda na dúvida?</strong>
                Faça um corte avulso por R$ 65 e se assinar no mesmo dia, pague só mais R$ 32 pelo mês inteiro.
              </p>
              <a href={CTA_LINK} target="_blank" rel="noopener noreferrer" className="bg-white text-black px-6 py-3 font-bold uppercase tracking-widest whitespace-nowrap hover:bg-gray-200 transition-colors rounded-sm flex-shrink-0">
                Agendar Avulso
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 6. SERVIÇOS AVULSOS */}
      <section id="serviços" className="py-24 bg-surface border-t border-border">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <FadeIn>
              <div className="font-mono text-primary font-bold tracking-[0.2em] text-sm mb-4">SERVIÇOS</div>
              <h2 className="font-display text-5xl md:text-6xl text-white">SEM COMPROMISSO DE ASSINATURA</h2>
            </FadeIn>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">
            {[{ n: "Corte de Cabelo", p: "65,00" }, { n: "Barba", p: "65,00" }].map((s, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="bg-surface-light border border-border p-8 rounded-sm flex items-center justify-between group hover:border-primary transition-colors">
                  <span className="font-display text-4xl text-white group-hover:text-primary transition-colors">{s.n}</span>
                  <div className="text-right">
                    <span className="text-sm text-text-muted block">R$</span>
                    <span className="font-sans font-bold text-3xl text-primary">{s.p}</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={300} className="text-center">
            <p className="text-text-muted mb-8">Outros serviços adicionais disponíveis — consulte na barbearia</p>
          </FadeIn>
        </div>
      </section>

      {/* 6.5. GALERIA / PORTFÓLIO */}
      <section id="galeria" className="py-24 bg-background relative border-y border-border">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <FadeIn>
              <div className="font-mono text-primary font-bold tracking-[0.2em] text-sm mb-4">PORTFÓLIO</div>
              <h2 className="font-display text-5xl md:text-6xl text-white">NOSSO TRABALHO</h2>
            </FadeIn>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-6xl mx-auto">
            {[
              "/images/barbearia-em-fortaleza-3-reeqa9v287cmkhvg3vgarx9von9a0900rclj9vgo8c.webp",
              "/images/barbearia-em-fortaleza-4-reeqa9v287cmkhvg3vgarx9von9a0900rclj9vgo8c.webp",
              "/images/barbearia-em-fortaleza-5-reeqa9v287cmkhvg3vgarx9von9a0900rclj9vgo8c.webp",
              "/images/barbearia-em-fortaleza-6-reeqa9v287cmkhvg3vgarx9von9a0900rclj9vgo8c.webp",
              "/images/barbearia-em-fortaleza-7.webp",
              "/images/f245aa54bc9744b29b6923d2484791bb-min.webp"
            ].map((src, i) => (
              <FadeIn key={i} delay={i * 100}>
                <a href="https://instagram.com/delta_barbearia" target="_blank" rel="noopener noreferrer" className="block aspect-square bg-surface flex items-center justify-center overflow-hidden group relative border border-border hover:border-primary transition-colors">
                  <img src={src} alt={`Trabalho Delta ${i+1}`} className="w-full h-full object-cover filter grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" />
                  <div className="absolute inset-0 bg-background/50 group-hover:bg-transparent transition-colors duration-300"></div>
                  <Instagram className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                </a>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 7. EQUIPE */}
      <section id="equipe" className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <FadeIn>
              <div className="font-mono text-primary font-bold tracking-[0.2em] text-sm mb-4">EQUIPE DELTA</div>
              <h2 className="font-display text-5xl md:text-6xl text-white">QUEM FAZ ACONTECER</h2>
            </FadeIn>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {['Pedro', 'Anderson', 'Lucas', 'Thiago'].map((name, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="bg-surface-light border border-border p-6 md:p-8 rounded-sm text-center group hover:border-primary transition-colors">
                  <div className="w-24 h-24 md:w-32 md:h-32 mx-auto bg-background rounded-sm flex items-center justify-center mb-6 relative overflow-hidden border border-border group-hover:border-primary transition-colors">
                    <DeltaTriangle className="absolute inset-0 w-full h-full text-primary opacity-10 transform scale-150" />
                    <span className="font-display text-4xl text-white relative z-10">{name.charAt(0)}</span>
                  </div>
                  <h3 className="font-display text-3xl text-white mb-1">{name}</h3>
                  <p className="text-text-muted text-sm font-semibold tracking-wider uppercase">Barbeiro Especialista</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section id="faq" className="py-24 bg-surface border-y border-border">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <div className="text-center mb-16">
            <FadeIn>
              <div className="font-mono text-primary font-bold tracking-[0.2em] text-sm mb-4">DÚVIDAS</div>
              <h2 className="font-display text-5xl md:text-6xl text-white">PERGUNTAS FREQUENTES</h2>
            </FadeIn>
          </div>

          <FadeIn delay={200}>
            <div className="bg-surface-light p-6 md:p-10 border border-border rounded-sm">
              {[
                {
                  q: "O plano realmente permite vir quantas vezes quiser?",
                  a: "Sim! Corte e/ou barba ilimitados dentro do mês. Venha quantas vezes precisar para manter seu estilo em dia."
                },
                {
                  q: "Como funciona o agendamento?",
                  a: "Assinantes agendam pelo app CashBarber, de forma rápida e sem fila. Disponível para Android e iOS."
                },
                {
                  q: "Posso cancelar quando quiser?",
                  a: "Sim, cancele quando quiser, sem taxas ou burocracia."
                },
                {
                  q: "Vocês atendem sem assinatura?",
                  a: "Sim! Oferecemos corte de cabelo ou barba avulsos por R$ 65,00 cada. E se assinar no mesmo dia, desconta o valor já pago."
                },
                {
                  q: "Onde fica a Delta Barbearia?",
                  a: "R. Gonçalves Lêdo, 539 - Praia de Iracema, Fortaleza-CE. Fácil acesso, com estacionamento próximo."
                },
                {
                  q: "Quais são os horários de atendimento?",
                  a: "Segunda a Sexta: 09h às 19h | Sábado: 09h às 17h | Domingo: Fechado."
                }
              ].map((item, i) => (
                <AccordionItem key={i} question={item.q} answer={item.a} />
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 9. DEPOIMENTOS */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <FadeIn>
              <div className="font-mono text-primary font-bold tracking-[0.2em] text-sm mb-4">CLIENTES</div>
              <h2 className="font-display text-5xl md:text-6xl text-white">O QUE DIZEM NOSSOS ASSINANTES</h2>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto mb-16">
            {[
              { txt: "Melhor assinatura de barbearia em Fortaleza, atendimento e os melhores barbeiros da cidade. Top, sou assinante e falo com propriedade.", auth: "Abilton Gadelha Dias" },
              { txt: "Excelente barbearia! Local top! Qualidade muito boa nos serviços e profissionais. Ambiente aconchegante. Super recomendo a assinatura!", auth: "Marcus Cesar Morais" },
              { txt: "Pontual no atendimento. O profissional Pedro foi impecável, muito prestativo e simpático. O corte ficou uma maravilha.", auth: "Silas S." },
              { txt: "Local limpo, bem organizado. Agradecer ao meu barbeiro Anderson pelo cuidado e zelo em cada detalhe do meu corte.", auth: "Railson Tavares" },
              { txt: "Atendimento sensacional e o ambiente proporciona uma experiência incrível. O serviço de assinatura vai me fazer voltar toda semana.", auth: "Renan Melo" }
            ].map((dep, i) => (
              <FadeIn key={i} delay={i * 100} className={i === 4 ? "md:col-span-2 lg:col-span-1" : ""}>
                <div className="bg-surface-light border border-border p-8 h-full rounded-sm relative group hover:border-primary transition-colors">
                  <div className="text-primary font-display text-6xl absolute top-4 right-6 opacity-20">"</div>
                  <div className="flex gap-1 mb-6">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-primary text-primary" />)}
                  </div>
                  <p className="text-text-muted mb-8 leading-relaxed relative z-10">"{dep.txt}"</p>
                  <div className="font-sans font-bold text-white mt-auto block border-t border-border pt-4">
                    {dep.auth}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={200} className="text-center">
            <a href={CTA_LINK} target="_blank" rel="noopener noreferrer" className="inline-block text-primary font-bold uppercase tracking-widest hover:text-white transition-colors border-b-2 border-primary pb-1">
              QUERO SER UM ASSINANTE VIP
            </a>
          </FadeIn>
        </div>
      </section>

      {/* 10. CONTATO & LOCALIZAÇÃO */}
      <section id="contato" className="py-24 bg-surface border-t border-border">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <FadeIn>
              <div className="font-mono text-primary font-bold tracking-[0.2em] text-sm mb-4">LOCALIZAÇÃO</div>
              <h2 className="font-display text-5xl md:text-6xl text-white">VENHA NOS VISITAR</h2>
            </FadeIn>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 max-w-7xl mx-auto">
            <div className="lg:w-1/2">
              <FadeIn>
                <div className="bg-surface-light border border-border p-8 md:p-12 rounded-sm h-full flex flex-col justify-center">
                  <ul className="space-y-8 mb-10">
                    <li className="flex items-start gap-4">
                      <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <strong className="block text-white mb-1">Endereço</strong>
                        <span className="text-text-muted">R. Gonçalves Lêdo, 539<br/>Praia de Iracema, Fortaleza-CE</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <Phone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <strong className="block text-white mb-1">Contato</strong>
                        <span className="text-text-muted">(85) 99217-9655<br/>contato@deltabarbearia.com.br</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <strong className="block text-white mb-1">Horários</strong>
                        <span className="text-text-muted">Seg-Sex: 09h–19h<br/>Sáb: 09h–17h | Dom: Fechado</span>
                      </div>
                    </li>
                  </ul>
                  <div className="flex gap-4">
                    <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="bg-primary text-white p-4 rounded-sm hover:bg-primary-hover transition-colors flex-1 flex justify-center">
                      <Phone className="w-6 h-6" />
                    </a>
                    <a href="https://instagram.com/delta_barbearia" target="_blank" rel="noopener noreferrer" className="bg-surface border border-border text-white p-4 rounded-sm hover:border-primary transition-colors flex-1 flex justify-center">
                      <Instagram className="w-6 h-6" />
                    </a>
                  </div>
                </div>
              </FadeIn>
            </div>

            <div className="lg:w-1/2 h-[450px] lg:h-auto">
              <FadeIn delay={200} className="h-full">
                <div className="w-full h-full border-2 border-primary rounded-sm overflow-hidden bg-surface-light">
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3981.365313988636!2d-38.5146059!3d-3.7191419!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7c7486851610447%3A0xc39218df9dfec82d!2sR.%20Gon%C3%A7alves%20L%C3%AAdo%2C%20539%20-%20Praia%20de%20Iracema%2C%20Fortaleza%20-%20CE%2C%2060110-260!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen={true} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    className="filter grayscale contrast-125 opacity-80 hover:opacity-100 hover:grayscale-0 transition-all duration-500"
                  ></iframe>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* 11. CTA FINAL */}
      <section className="py-24 md:py-32 bg-primary relative overflow-hidden">
        <DeltaTriangle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] text-white opacity-10" />
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center">
          <FadeIn>
            <h2 className="font-display text-6xl md:text-8xl text-white mb-6">PRONTO PARA EVOLUIR?</h2>
            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto">Assine agora e transforme seu visual o mês inteiro, sem se preocupar com a conta.</p>
            <a href={CTA_LINK} target="_blank" rel="noopener noreferrer" className="inline-block bg-white text-primary px-12 py-5 font-bold text-lg uppercase tracking-widest hover:bg-gray-100 transition-colors rounded-sm shadow-xl hover:scale-105 transform">
              Assinar Agora
            </a>
          </FadeIn>
        </div>
      </section>

      {/* 12. FOOTER */}
      <footer className="bg-[#050505] py-12 border-t border-border">
        <div className="container mx-auto px-4 md:px-8 flex flex-col items-center text-center">
          <img src={LOGO_URL} alt="Delta Barbearia" className="h-16 w-auto mb-6 opacity-80 grayscale" />
          <p className="text-text-muted font-medium mb-8">Delta é Estilo Sem Complicação.</p>
          
          <nav className="flex flex-wrap justify-center gap-6 mb-8">
            {['Sobre', 'Planos', 'Galeria', 'FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-semibold tracking-widest uppercase text-text-muted hover:text-white transition-colors">
                {item}
              </a>
            ))}
            <Link href="/admin" className="text-sm font-semibold tracking-widest uppercase text-primary hover:text-white transition-colors">
              Acesso Admin
            </Link>
          </nav>

          <div className="flex gap-6 mb-8">
            <a href="https://instagram.com/delta_barbearia" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary transition-colors">
              <Instagram className="w-6 h-6" />
            </a>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary transition-colors">
              <Phone className="w-6 h-6" />
            </a>
          </div>

          <p className="text-xs text-text-muted/60 uppercase tracking-widest">
            © 2025 Delta Barbearia. Todos os direitos reservados.<br className="md:hidden"/> Fortaleza-CE · Praia de Iracema
          </p>
        </div>
      </footer>
    </div>
  );
}
