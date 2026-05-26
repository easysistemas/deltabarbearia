"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Menu, X, MapPin, Instagram, Phone, 
  Clock, ChevronRight, Music, Scissors, 
  GlassWater, Sparkles, MessageCircle
} from "lucide-react";
import Link from "next/link";

// Intersection Observer Hook for fade-in animations
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

// FadeIn Component Wrapper
const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const [ref, isVisible] = useIntersectionObserver();
  return (
    <div 
      ref={ref} 
      className={`${className} transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${totalScroll / windowHeight}`;
      setScrollProgress(Number(scroll) * 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const WHATSAPP_URL = "https://wa.me/5500000000000"; // PLACEHOLDER
  const INSTAGRAM_URL = "https://instagram.com/barbearia.whiskyeblues";
  const LOGO_URL = "/logo.png";

  return (
    <div className="min-h-screen bg-background text-creme-100 font-sans overflow-x-hidden selection:bg-gold-500 selection:text-background">
      
      {/* Top Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-[3px] bg-gold-500 z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Floating WhatsApp Button */}
      <a 
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-40 flex items-center justify-center w-14 h-14 bg-gold-500 rounded-full shadow-lg hover:scale-110 transition-transform duration-300 group"
      >
        <div className="absolute inset-0 rounded-full bg-gold-500 animate-ping opacity-75"></div>
        <Phone className="w-6 h-6 text-background relative z-10 group-hover:scale-110 transition-transform" />
      </a>

      {/* Header */}
      <header className={`fixed top-0 w-full z-40 transition-all duration-500 ${isScrolled ? 'bg-background/95 backdrop-blur-md shadow-lg border-b border-border py-0' : 'bg-transparent py-2'}`}>
        <div className="container mx-auto px-4 md:px-6 h-20 md:h-24 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group h-full py-1">
            <img src={LOGO_URL} alt="Whisky Blues Logo" className="h-16 md:h-20 w-auto object-contain drop-shadow-md mix-blend-screen" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {['Sobre', 'Serviços', 'Equipe', 'Galeria', 'Contato'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className="text-sm tracking-widest uppercase font-medium text-creme-200 hover:text-gold-500 transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden md:block">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="bg-gold-500 text-background px-8 py-3 rounded-sm font-semibold hover:bg-gold-400 transition-colors inline-block tracking-wider uppercase text-sm">
              Agendar
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-gold-500 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div className={`fixed inset-0 bg-background z-30 transform transition-transform duration-500 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} md:hidden pt-24 px-8 flex flex-col overflow-y-auto`}>
        <div className="flex justify-center mb-10 mt-4">
           <img src={LOGO_URL} alt="Whisky Blues Logo" className="h-32 w-auto mix-blend-screen opacity-90" />
        </div>
        <nav className="flex flex-col gap-8 text-center">
          {['Sobre', 'Serviços', 'Equipe', 'Galeria', 'Contato'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`}
              onClick={() => setMobileMenuOpen(false)}
              className="font-display text-3xl text-creme-100 hover:text-gold-500 transition-colors"
            >
              {item}
            </a>
          ))}
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="mt-8 bg-gold-500 text-background px-6 py-4 rounded-sm font-semibold text-center text-lg uppercase tracking-widest">
            Agendar Agora
          </a>
        </nav>
      </div>

      {/* Hero */}
      <section className="relative min-h-[100svh] flex items-center justify-center pt-28 pb-16 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img src="/images/hero-barber.jpg" alt="Ambiente Barbearia Clássica" className="w-full h-full object-cover filter grayscale opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background"></div>
        </div>

        {/* Watermark Logo */}
        <div className="absolute inset-0 flex items-center justify-center z-0 opacity-[0.04] mix-blend-screen pointer-events-none overflow-hidden">
          <img src={LOGO_URL} alt="" className="w-[120%] md:w-auto md:h-[120%] object-cover grayscale" />
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center flex flex-col items-center">
          <FadeIn delay={100}>
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-sm border border-border bg-surface/50 backdrop-blur-sm mb-10 text-xs sm:text-sm font-medium tracking-widest uppercase text-gold-400">
              <GlassWater className="w-4 h-4" />
              <span>Estilo com personalidade · Barbearia Clássica</span>
            </div>
          </FadeIn>
          
          <FadeIn delay={300}>
            <h1 className="font-display text-5xl sm:text-6xl md:text-8xl font-bold mb-6 max-w-5xl leading-[1.1] text-creme-100 drop-shadow-lg">
              Onde Clássicos <br className="hidden sm:block"/>
              <span className="text-gold-500 italic font-normal">se tornam Lendas</span>
            </h1>
          </FadeIn>
          
          <FadeIn delay={500}>
            <p className="font-script text-3xl md:text-5xl text-creme-200 mb-8 tracking-wide">
              Tradição, estilo e um toque de Blues
            </p>
          </FadeIn>

          <FadeIn delay={700}>
            <p className="text-lg text-creme-200 mb-12 max-w-2xl leading-relaxed mx-auto">
              Na Whisky Blues, cada visita é uma experiência completa. 
              Ambiente climatizado, profissionais dedicados e a melhor conversa da cidade.
            </p>
          </FadeIn>
          
          <FadeIn delay={900} className="w-full">
            <div className="flex flex-col sm:flex-row justify-center gap-6 w-full sm:w-auto">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="bg-gold-500 text-background px-10 py-5 rounded-sm font-bold hover:bg-gold-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(201,160,90,0.3)] hover:shadow-[0_0_30px_rgba(201,160,90,0.5)] tracking-widest uppercase">
                Agendar Agora
                <ChevronRight className="w-5 h-5" />
              </a>
              <a href="#sobre" className="border border-creme-200 text-creme-100 px-10 py-5 rounded-sm font-bold hover:bg-creme-100 hover:text-background transition-colors flex items-center justify-center backdrop-blur-sm tracking-widest uppercase">
                Conheça a Casa
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="py-20 md:py-32 bg-surface-hover relative">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-20">
            <FadeIn>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 text-creme-100">
                A Casa do Bom Gosto
              </h2>
              {/* Ornato Vintage */}
              <div className="flex justify-center items-center gap-4 mb-8">
                <div className="h-[1px] w-16 bg-gold-500/50"></div>
                <Sparkles className="text-gold-500 w-5 h-5" />
                <div className="h-[1px] w-16 bg-gold-500/50"></div>
              </div>
              <p className="text-creme-200 text-lg md:text-xl leading-relaxed font-light">
                A Whisky Blues nasceu para os homens que entendem que um bom corte vai muito além da tesoura — é ritual, conversa, tradição. Aqui o ambiente é climatizado, o atendimento é personalizado e o estilo é levado a sério.
              </p>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: GlassWater, title: "Ambiente Único" },
              { icon: Scissors, title: "Precisão no Corte" },
              { icon: Music, title: "Atmosfera Blues" },
              { icon: Sparkles, title: "Climatizado" }
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 150}>
                <div className="bg-surface p-8 rounded-sm border border-border flex flex-col items-center text-center hover:border-gold-500 hover:-translate-y-2 transition-all duration-300 group">
                  <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center mb-6 group-hover:bg-gold-500 group-hover:border-gold-500 transition-colors">
                    <item.icon className="w-7 h-7 text-gold-500 group-hover:text-background transition-colors" />
                  </div>
                  <h3 className="font-display font-semibold text-xl text-creme-100 tracking-wide">{item.title}</h3>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="serviços" className="py-20 md:py-32 bg-background relative">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center mb-20">
            <FadeIn>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-creme-100">
                Serviços & Preços
              </h2>
              <p className="font-script text-3xl text-gold-500 mb-8">
                Do clássico ao contemporâneo
              </p>
              <div className="flex justify-center items-center gap-4">
                <div className="h-[1px] w-24 bg-border"></div>
                <Scissors className="text-border w-5 h-5" />
                <div className="h-[1px] w-24 bg-border"></div>
              </div>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              { name: "Corte Clássico", price: "R$ 45,00", category: "Cabelo" },
              { name: "Corte + Barba", price: "R$ 75,00", category: "Combo" },
              { name: "Barba na Navalha", price: "R$ 40,00", category: "Rosto" },
              { name: "Sobrancelha", price: "R$ 15,00", category: "Rosto" },
              { name: "Pigmentação", price: "R$ 35,00", category: "Estética", from: true },
              { name: "Platinado", price: "R$ 120,00", category: "Química", from: true },
              { name: "Selagem", price: "R$ 80,00", category: "Tratamento", from: true },
              { name: "Dia do Noivo", price: "R$ 250,00", category: "Especial" },
            ].map((service, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="bg-surface border border-border p-8 rounded-sm hover:border-gold-500 hover:shadow-[0_0_15px_rgba(201,160,90,0.15)] transition-all duration-300 group flex flex-col justify-between h-full relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Scissors className="w-24 h-24 text-gold-500 transform rotate-45" />
                  </div>
                  <div>
                    <span className="text-xs text-gold-400 uppercase tracking-widest font-semibold mb-3 block">{service.category}</span>
                    <h3 className="font-display font-semibold text-2xl mb-4 text-creme-100">{service.name}</h3>
                  </div>
                  <div className="flex flex-col mt-6 border-t border-border pt-4">
                    {service.from && <span className="text-xs text-creme-200 uppercase tracking-wider mb-1">A partir de</span>}
                    <span className="text-2xl font-sans font-bold text-gold-500 tracking-wide">{service.price}</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={300}>
            <div className="mt-20 text-center">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="border-2 border-gold-500 text-gold-500 px-10 py-5 rounded-sm font-bold hover:bg-gold-500 hover:text-background transition-all inline-flex items-center gap-3 text-sm tracking-widest uppercase">
                <MessageCircle className="w-5 h-5" />
                Agendar pelo WhatsApp
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Equipe */}
      <section id="equipe" className="py-20 md:py-32 bg-surface-hover relative">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center mb-20">
            <FadeIn>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-creme-100">
                Os Mestres da Casa
              </h2>
              <p className="font-script text-3xl text-gold-500">
                Profissionais que entendem de estilo
              </p>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { name: 'Arthur "Navalha"', role: 'Mestre Barbeiro', img: '/images/barber-carlos.jpg' },
              { name: 'Thiago Costa', role: 'Barbeiro Clássico', img: '/images/barber-rafael.jpg' },
              { name: 'Ricardo Silva', role: 'Especialista em Barba', img: '/images/about-space.jpg' },
              { name: 'Victor Hugo', role: 'Estilista', img: '/images/gallery-1.jpg' },
            ].map((barber, i) => (
              <FadeIn key={i} delay={i * 150}>
                <div className="bg-surface border border-border p-8 text-center rounded-sm hover:border-gold-500 hover:-translate-y-2 transition-all duration-300 group shadow-lg">
                  <div className="w-32 h-32 mx-auto rounded-full bg-background border-2 border-border group-hover:border-gold-500 flex items-center justify-center mb-6 relative overflow-hidden transition-colors">
                    <img src={barber.img} alt={barber.name} className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-creme-100 mb-2">{barber.name}</h3>
                  <p className="text-gold-400 text-sm tracking-widest uppercase">
                    {barber.role}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Galeria */}
      <section id="galeria" className="py-20 md:py-32 bg-background relative">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center mb-20">
            <FadeIn>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-creme-100">
                Nosso Trabalho
              </h2>
              <p className="font-script text-3xl text-gold-500 mb-8">
                Cada corte conta uma história
              </p>
            </FadeIn>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4 mb-16 max-w-6xl mx-auto">
            {[
              "/images/gallery-1.jpg",
              "/images/gallery-2.jpg",
              "/images/gallery-3.jpg",
              "/images/gallery-4.jpg",
              "/images/hero-barber.jpg",
              "/images/about-space.jpg"
            ].map((src, i) => (
              <FadeIn key={i} delay={i * 100}>
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="block aspect-square bg-surface flex items-center justify-center border border-border hover:border-gold-500 transition-colors overflow-hidden group relative">
                  <img src={src} alt="Corte na Whisky Blues" className="absolute inset-0 w-full h-full object-cover filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 z-0" />
                  
                  {/* Decorative Icon - Hidden on hover */}
                  <Scissors className="w-12 h-12 text-gold-500/80 relative z-10 transform -rotate-45 group-hover:opacity-0 transition-opacity duration-300" />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                    <Instagram className="w-8 h-8 text-gold-500" />
                    <span className="font-display text-lg text-creme-100 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-100">Ver no Instagram</span>
                  </div>
                </a>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={300}>
            <div className="text-center">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="border-b-2 border-gold-500 text-creme-100 pb-1 font-semibold hover:text-gold-500 transition-colors inline-flex items-center gap-2 uppercase tracking-widest text-sm">
                <Instagram className="w-4 h-4" />
                Ver portfólio completo
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 md:py-32 bg-surface-hover relative border-y border-border">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center mb-24">
            <FadeIn>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-creme-100">
                O Que Dizem Nossos Clientes
              </h2>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                text: "Ambiente incrível, parece que voltei aos anos 50. O corte ficou perfeito e a barba impecável.",
                author: "Carlos A."
              },
              {
                text: "Melhor barbearia que já fui. O ambiente tem personalidade e os barbeiros são verdadeiros artistas.",
                author: "Bruno M."
              },
              {
                text: "Vou toda semana. É o tipo de lugar que você vai pelo corte e fica pela experiência.",
                author: "Felipe R."
              }
            ].map((testi, i) => (
              <FadeIn key={i} delay={i * 200}>
                <div className="bg-surface border border-border p-10 rounded-sm relative mt-8 hover:border-gold-500 transition-colors group">
                  <div className="absolute -top-10 left-10 text-8xl text-gold-500/20 font-display font-serif group-hover:text-gold-500/40 transition-colors">"</div>
                  
                  <p className="text-lg mb-10 relative z-10 font-light text-creme-100 leading-relaxed italic">
                    "{testi.text}"
                  </p>
                  
                  <div className="flex items-center gap-4 mt-auto border-t border-border pt-6">
                    <div className="w-12 h-12 bg-background border border-gold-500 rounded-sm flex items-center justify-center transform rotate-45">
                      <span className="font-display font-bold text-gold-500 transform -rotate-45">{testi.author.charAt(0)}</span>
                    </div>
                    <span className="font-display font-semibold text-lg text-creme-100 tracking-wide ml-2">{testi.author}</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="py-20 md:py-32 bg-background relative">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 max-w-7xl mx-auto items-center">
            
            <div className="lg:w-1/2 w-full">
              <FadeIn>
                <h2 className="font-display text-4xl md:text-5xl font-bold mb-10 text-creme-100 leading-tight">
                  Venha Tomar um <span className="text-gold-500 italic">Whisky</span> <br/>
                  e Dar um Trato
                </h2>
                
                <div className="space-y-8 mb-12 text-lg text-creme-200 font-light">
                  <div className="flex items-start gap-6 group">
                    <div className="mt-1 p-3 bg-surface border border-border rounded-sm group-hover:border-gold-500 transition-colors">
                      <MapPin className="w-6 h-6 text-gold-500" />
                    </div>
                    <div>
                      <h4 className="font-display text-creme-100 font-semibold mb-1 text-xl">Endereço</h4>
                      <p>[ INSERIR ENDEREÇO AQUI ]<br/>[ BAIRRO, CIDADE ]</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-6 group">
                    <div className="mt-1 p-3 bg-surface border border-border rounded-sm group-hover:border-gold-500 transition-colors">
                      <Phone className="w-6 h-6 text-gold-500" />
                    </div>
                    <div>
                      <h4 className="font-display text-creme-100 font-semibold mb-1 text-xl">WhatsApp</h4>
                      <p>[ INSERIR WHATSAPP ]</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6 group">
                    <div className="mt-1 p-3 bg-surface border border-border rounded-sm group-hover:border-gold-500 transition-colors">
                      <Clock className="w-6 h-6 text-gold-500" />
                    </div>
                    <div>
                      <h4 className="font-display text-creme-100 font-semibold mb-1 text-xl">Horário de Funcionamento</h4>
                      <p>[ INSERIR HORÁRIOS ]<br/>[ EX: SEG - SÁB, 09h às 19h ]</p>
                    </div>
                  </div>
                </div>
                
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="bg-gold-500 text-background px-10 py-5 rounded-sm font-bold hover:bg-gold-400 transition-colors inline-flex items-center gap-3 text-sm tracking-widest uppercase shadow-lg w-full sm:w-auto justify-center">
                  <MessageCircle className="w-5 h-5" />
                  Agendar pelo WhatsApp
                </a>
              </FadeIn>
            </div>

            <div className="lg:w-1/2 w-full h-[500px]">
              <FadeIn delay={200} className="h-full">
                <div className="h-full w-full border border-gold-500 p-2 bg-surface rounded-sm">
                  {/* Google Maps iframe placeholder - to be updated with real address */}
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15925.688849683935!2d-38.5283405!3d-3.7291129!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7c748f5e714d643%3A0x6b80ad2d5e219ba5!2sFortaleza%2C%20CE!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen={true} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    className="filter grayscale contrast-125 opacity-80 hover:opacity-100 hover:grayscale-0 transition-all duration-700 rounded-sm"
                  ></iframe>
                </div>
              </FadeIn>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#060E18] pt-20 pb-10 border-t border-border">
        <div className="container mx-auto px-4 md:px-6 flex flex-col items-center">
          
          <img src={LOGO_URL} alt="Whisky Blues Logo" className="h-32 w-auto object-contain mix-blend-screen opacity-75 mb-8" />
          
          <div className="flex justify-center items-center gap-4 w-full max-w-md mb-10 opacity-50">
            <div className="h-[1px] flex-grow bg-gold-500"></div>
            <Sparkles className="text-gold-500 w-4 h-4" />
            <div className="h-[1px] flex-grow bg-gold-500"></div>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-10">
            {['Sobre', 'Serviços', 'Equipe', 'Contato'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className="text-xs font-semibold tracking-widest uppercase text-creme-200 hover:text-gold-500 transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-6 mb-12">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:text-gold-400 hover:scale-110 transition-all">
              <Instagram className="w-6 h-6" />
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:text-gold-400 hover:scale-110 transition-all">
              <Phone className="w-6 h-6" />
            </a>
          </div>

          <div className="text-center">
            <p className="font-script text-3xl text-gold-500 mb-6 opacity-90">Tradição que se bebe. Estilo que se vê.</p>
            <p className="text-xs text-creme-200/50 uppercase tracking-widest">
              © 2025 Whisky Blues Barbearia. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
