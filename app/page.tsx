"use client";

import React, { useState, useEffect } from "react";
import { 
  Scissors, Menu, X, Star, MapPin, Instagram, Youtube, Phone, 
  Clock, Check, ChevronRight, Award, Wind, ShieldCheck 
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeCategory, setActiveCategory] = useState("Cabelo");

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

  const WHATSAPP_URL = "https://wa.me/5585998655372";
  const INSTAGRAM_URL = "https://instagram.com/sr.brisola_";

  const allServices = [
    { name: "Corte Brisola", price: "R$ 60,00", from: false, category: "Cabelo" },
    { name: "Corte", price: "R$ 60,00", from: false, category: "Cabelo" },
    { name: "Corte na Tesoura", price: "R$ 60,00", from: false, category: "Cabelo" },
    { name: "Pintura Capilar", price: "R$ 40,00", from: false, category: "Cabelo" },
    { name: "Pigmentação Cabelo", price: "R$ 25,00", from: true, category: "Cabelo" },
    { name: "Penteado", price: "R$ 20,00", from: true, category: "Cabelo" },
    { name: "Luzes", price: "R$ 80,00", from: true, category: "Cabelo" },
    { name: "Hidratação", price: "R$ 20,00", from: true, category: "Cabelo" },
    { name: "Escova Progressiva", price: "R$ 90,00", from: true, category: "Cabelo" },
    { name: "Descoloração Tintura", price: "R$ 150,00", from: true, category: "Cabelo" },
    { name: "Camuflagem de Cabelo", price: "R$ 30,00", from: true, category: "Cabelo" },
    
    { name: "Barba Brisola", price: "R$ 60,00", from: false, category: "Barba & Rosto" },
    { name: "Barba", price: "R$ 60,00", from: false, category: "Barba & Rosto" },
    { name: "Sobrancelha", price: "R$ 10,00", from: false, category: "Barba & Rosto" },
    { name: "Pigmentação do Pezinho", price: "R$ 20,00", from: true, category: "Barba & Rosto" },
    { name: "Pigmentação Barba", price: "R$ 30,00", from: true, category: "Barba & Rosto" },
    { name: "Pezinho", price: "R$ 10,00", from: false, category: "Barba & Rosto" },
    { name: "Camuflagem de Barba", price: "R$ 30,00", from: true, category: "Barba & Rosto" },
    { name: "Bigode", price: "R$ 10,00", from: true, category: "Barba & Rosto" },
  ];

  const filteredServices = allServices.filter((s) => s.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#002B26] text-white font-sans overflow-x-hidden selection:bg-white">
      {/* Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-white z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Floating WhatsApp Button */}
      <a 
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 bg-white rounded-full shadow-lg hover:scale-110 transition-transform duration-300"
      >
        <div className="absolute inset-0 rounded-full bg-white animate-ping opacity-75"></div>
        <Phone className="w-6 h-6 text-[#002B26] relative z-10" />
      </a>

      {/* Header */}
      <header className={`fixed top-0 w-full z-40 transition-colors duration-300 ${isScrolled ? 'bg-[#002B26] shadow-md border-b border-[#1A4A44]' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 md:px-6 h-20 md:h-24 flex items-center justify-between">
          <Link href="/" className="relative flex items-center h-full w-40 sm:w-56">
            <img src="https://i.imgur.com/StI8iHb.png" alt="Logo Sr. Brisola" className="absolute -left-2 top-[58%] -translate-y-1/2 w-56 sm:w-72 max-w-none drop-shadow-lg" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {['Sobre', 'Serviços', 'Planos', 'Equipe', 'Contato'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-white hover:text-[#A8CCC8] transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden md:block">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="bg-white text-[#002B26] px-6 py-2.5 rounded-sm font-semibold hover:bg-[#E0F2EF] transition-colors inline-block">
              Agendar
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div className={`fixed inset-0 bg-[#002B26] z-30 transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} md:hidden pt-28 px-6`}>
        <nav className="flex flex-col gap-6">
          {['Sobre', 'Serviços', 'Planos', 'Equipe', 'Contato'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`}
              onClick={() => setMobileMenuOpen(false)}
              className="text-2xl font-display font-medium text-white border-b border-[#1A4A44] pb-4"
            >
              {item}
            </a>
          ))}
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="mt-4 bg-white text-[#002B26] px-6 py-4 rounded-sm font-semibold text-center text-lg">
            Agendar Agora
          </a>
        </nav>
      </div>

      {/* Hero */}
      <section className="relative pt-40 pb-36 md:pt-56 md:pb-40 overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=2000')" }}
        >
          <div className="absolute inset-0 bg-[#002B26]/85 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#002B26] to-transparent opacity-90"></div>
        </div>

        {/* Subtle geometric background patterns */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 border border-white rounded-full"></div>
          <div className="absolute bottom-10 right-20 w-96 h-96 border border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-white transform -rotate-45"></div>
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#1A4A44] bg-[#003D36]/80 backdrop-blur-sm mb-8 text-xs sm:text-sm font-medium">
            <span>💈</span>
            <span className="text-[#E0F2EF]">Barbearia por Assinatura · Fortaleza-CE</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold mb-6 max-w-4xl leading-tight text-white animate-in slide-in-from-bottom-8 duration-700">
            Onde o estilo encontra a tradição
          </h1>
          
          <p className="text-lg md:text-xl text-[#A8CCC8] mb-10 max-w-2xl leading-relaxed animate-in slide-in-from-bottom-8 duration-700 delay-150 drop-shadow-md">
            A primeira barbearia por assinatura de Fortaleza. Corte, barba e muito mais com profissionais dedicados.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in slide-in-from-bottom-8 duration-700 delay-300">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="bg-white text-[#002B26] px-8 py-4 rounded-sm font-semibold hover:bg-[#E0F2EF] transition-colors flex items-center justify-center gap-2 shadow-lg">
              Agendar Agora
              <ChevronRight className="w-5 h-5" />
            </a>
            <a href="#serviços" className="border border-white text-white px-8 py-4 rounded-sm font-semibold hover:bg-white hover:text-[#002B26] transition-colors flex items-center justify-center backdrop-blur-sm bg-black/10">
              Ver Serviços
            </a>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="sobre" className="py-20 bg-[#003D36] border-y border-[#1A4A44]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
            <div className="lg:w-1/2">
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 relative pb-6">
                Tradição, Estilo e Precisão
                <span className="absolute bottom-0 left-0 w-20 h-1 bg-white"></span>
              </h2>
              <p className="text-[#A8CCC8] text-lg leading-relaxed mb-6">
                A Barbearia Sr. Brisola nasceu com um propósito: elevar o cuidado masculino em Fortaleza. Somos a primeira barbearia por assinatura da cidade, com uma equipe de profissionais dedicados, ambiente climatizado e atendimento de excelência.
              </p>
            </div>
            <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { icon: Scissors, title: "Precisão" },
                { icon: Award, title: "Excelência" },
                { icon: Wind, title: "Ambiente Climatizado" },
                { icon: ShieldCheck, title: "Por Assinatura" }
              ].map((item, i) => (
                <div key={i} className="bg-[#002B26] p-6 rounded-sm border border-[#1A4A44] flex flex-col items-center sm:items-start text-center sm:text-left hover:border-white transition-colors duration-300 group">
                  <div className="w-12 h-12 rounded-full bg-[#003D36] flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="serviços" className="py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 relative pb-6 inline-block">
              Serviços & Preços
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-white"></span>
            </h2>
          </div>

          {/* Categorias Menu */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12">
            {['Cabelo', 'Barba & Rosto'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full font-medium transition-colors duration-300 border ${
                  activeCategory === cat 
                    ? 'bg-white text-[#002B26] border-white shadow-md' 
                    : 'bg-[#003D36] text-[#A8CCC8] border-[#1A4A44] hover:border-white hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredServices.map((service, i) => (
              <div key={i} className="bg-[#003D36] border border-[#1A4A44] p-6 rounded-sm hover:border-white hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between h-full shadow-sm hover:shadow-lg">
                <Scissors className="w-6 h-6 text-[#A8CCC8] mb-4 opacity-50 group-hover:opacity-100 group-hover:text-white transition-colors" />
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-white">{service.name}</h3>
                  <div className="flex flex-col">
                    {service.from && <span className="text-xs text-[#A8CCC8] uppercase tracking-wider mb-1">A partir de</span>}
                    <span className="text-xl font-display font-bold text-white">{service.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="bg-white text-[#002B26] px-8 py-4 rounded-sm font-semibold hover:bg-[#E0F2EF] transition-colors inline-flex items-center gap-2 text-lg shadow-md">
              Agendar meu horário
            </a>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="planos" className="py-24 bg-[#001A16]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 relative pb-6 inline-block">
              Sr. Brisola Club — Assine e Economize
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-white"></span>
            </h2>
            <p className="text-[#A8CCC8] text-lg max-w-2xl mx-auto">
              A primeira barbearia por assinatura de Fortaleza. Mensalidade com benefícios exclusivos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
            {/* Plano 1 */}
            <div className="bg-[#003D36] border border-[#1A4A44] p-8 rounded-sm flex flex-col hover:border-[#A8CCC8] transition-colors relative">
              <h3 className="font-display text-xl font-bold mb-2">Barba - Segunda a Quarta</h3>
              <p className="text-[#A8CCC8] text-sm mb-6 flex-grow">Tempo de vigência: Indeterminado</p>
              
              <div className="mb-6">
                <span className="text-3xl font-display font-bold text-white">R$ 109,90</span>
                <span className="text-sm text-[#A8CCC8] block mt-1">Por mês</span>
              </div>
              
              <p className="text-[#E0F2EF] text-sm mb-6 font-medium bg-[#002B26] py-2 px-3 rounded-sm border border-[#1A4A44] inline-block w-fit">
                Resta(m) 1 vaga(s) para esse plano.
              </p>
              
              <div className="flex flex-col gap-3 mt-auto">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="w-full text-center bg-white text-[#002B26] py-3 rounded-sm font-semibold hover:bg-[#E0F2EF] transition-colors">
                  Assinar Plano
                </a>
                <div className="flex justify-between text-xs text-[#A8CCC8] underline">
                  <a href="#" className="hover:text-white">Confira as vantagens</a>
                  <a href="#" className="hover:text-white">Termos de uso</a>
                </div>
              </div>
            </div>

            {/* Plano 2 */}
            <div className="bg-[#003D36] border border-[#1A4A44] p-8 rounded-sm flex flex-col hover:border-[#A8CCC8] transition-colors relative">
              <h3 className="font-display text-xl font-bold mb-2">Corte - Segunda a Quarta</h3>
              <p className="text-[#A8CCC8] text-sm mb-6 flex-grow">Tempo de vigência: Indeterminado</p>
              
              <div className="mb-6">
                <span className="text-3xl font-display font-bold text-white">R$ 79,90</span>
                <span className="text-sm text-[#A8CCC8] block mt-1">Por mês</span>
              </div>
              
              {/* Espaçamento vazio para alinhar os botões com os cards que têm vagas */}
              <div className="h-[44px] mb-6"></div>
              
              <div className="flex flex-col gap-3 mt-auto">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="w-full text-center bg-white text-[#002B26] py-3 rounded-sm font-semibold hover:bg-[#E0F2EF] transition-colors">
                  Assinar Plano
                </a>
                <div className="flex justify-between text-xs text-[#A8CCC8] underline">
                  <a href="#" className="hover:text-white">Confira as vantagens</a>
                  <a href="#" className="hover:text-white">Termos de uso</a>
                </div>
              </div>
            </div>

            {/* Plano 3 (Destaque) */}
            <div className="bg-white text-[#002B26] border-2 border-white p-8 rounded-sm flex flex-col relative transform lg:-translate-y-4 shadow-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#002B26] text-white px-4 py-1 text-xs font-bold tracking-wider uppercase rounded-sm border border-white whitespace-nowrap">
                Mais Popular
              </div>
              <h3 className="font-display text-xl font-bold mb-2">Corte e Barba - 1x por semana</h3>
              <p className="text-gray-600 text-sm mb-6 flex-grow">Tempo de vigência: Indeterminado</p>
              
              <div className="mb-6">
                <span className="text-3xl font-display font-bold">R$ 169,90</span>
                <span className="text-sm text-gray-600 block mt-1">Por mês</span>
              </div>
              
              <p className="text-[#002B26] text-sm mb-6 font-semibold bg-[#E0F2EF] py-2 px-3 rounded-sm border border-[#A8CCC8] inline-block w-fit">
                Resta(m) 9 vaga(s) para esse plano.
              </p>
              
              <div className="flex flex-col gap-3 mt-auto">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="w-full text-center bg-[#002B26] text-white py-3 rounded-sm font-semibold hover:bg-[#003D36] transition-colors">
                  Assinar Plano
                </a>
                <div className="flex justify-between text-xs text-gray-600 underline">
                  <a href="#" className="hover:text-[#002B26]">Confira as vantagens</a>
                  <a href="#" className="hover:text-[#002B26]">Termos de uso</a>
                </div>
              </div>
            </div>

            {/* Plano 4 */}
            <div className="bg-[#003D36] border border-[#1A4A44] p-8 rounded-sm flex flex-col hover:border-[#A8CCC8] transition-colors relative">
              <h3 className="font-display text-xl font-bold mb-2">Corte - 1x por semana</h3>
              <p className="text-[#A8CCC8] text-sm mb-6 flex-grow">Tempo de vigência: Indeterminado</p>
              
              <div className="mb-6">
                <span className="text-3xl font-display font-bold text-white">R$ 109,90</span>
                <span className="text-sm text-[#A8CCC8] block mt-1">Por mês</span>
              </div>
              
              <p className="text-[#E0F2EF] text-sm mb-6 font-medium bg-[#002B26] py-2 px-3 rounded-sm border border-[#1A4A44] inline-block w-fit">
                Resta(m) 13 vaga(s) para esse plano.
              </p>
              
              <div className="flex flex-col gap-3 mt-auto">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="w-full text-center bg-white text-[#002B26] py-3 rounded-sm font-semibold hover:bg-[#E0F2EF] transition-colors">
                  Assinar Plano
                </a>
                <div className="flex justify-between text-xs text-[#A8CCC8] underline">
                  <a href="#" className="hover:text-white">Confira as vantagens</a>
                  <a href="#" className="hover:text-white">Termos de uso</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="equipe" className="py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 relative pb-6 inline-block">
              Nossa Equipe
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-white"></span>
            </h2>
            <p className="text-[#A8CCC8] text-lg max-w-2xl mx-auto">
              Profissionais dedicados ao seu visual
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {['Brisola', 'Beto', 'Mateus Castro', 'Liedson'].map((name, i) => (
              <div key={i} className="bg-[#003D36] border border-[#1A4A44] p-6 text-center rounded-sm hover:border-white transition-colors duration-300">
                <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center mb-4">
                  <span className="font-display text-3xl font-bold text-[#002B26]">{name.charAt(0)}</span>
                </div>
                <h3 className="font-bold text-lg text-white mb-1">{name}</h3>
                <p className="text-[#A8CCC8] text-sm">
                  {i === 0 ? "Fundador & Master Barbeiro" : "Barbeiro Profissional"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-24 bg-[#003D36] border-y border-[#1A4A44]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 relative pb-6 inline-block">
              Nosso Trabalho Fala Por Si
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-white"></span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-12 max-w-5xl mx-auto">
            {[
              "https://images.unsplash.com/photo-1585747860115-9ddf52d7ee8a?auto=format&fit=crop&q=80&w=800&h=800",
              "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=800&h=800",
              "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=800&h=800",
              "https://images.unsplash.com/photo-1508898578281-c7436f7560a8?auto=format&fit=crop&q=80&w=800&h=800",
              "https://images.unsplash.com/photo-1512496229562-b91c12be5188?auto=format&fit=crop&q=80&w=800&h=800",
              "https://images.unsplash.com/photo-1593720213428-28a5b209426c?auto=format&fit=crop&q=80&w=800&h=800"
            ].map((src, i) => (
              <div key={i} className="aspect-square bg-[#002B26] flex items-center justify-center rounded-sm border border-[#1A4A44] hover:border-white transition-colors overflow-hidden group relative">
                {/* Fallback icon in case image still fails for some reason */}
                <Scissors className="absolute w-12 h-12 text-[#A8CCC8] opacity-10 z-0" />
                <img 
                  src={src} 
                  alt={`Galeria Sr. Brisola ${i+1}`} 
                  className="relative z-10 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300 group-hover:scale-105 transform bg-[#002B26]" 
                  onError={(e) => {
                    // Fallback to a solid proven image if one fails
                    e.currentTarget.src = "https://images.unsplash.com/photo-1585747860115-9ddf52d7ee8a?auto=format&fit=crop&q=80&w=800&h=800";
                  }}
                />
              </div>
            ))}
          </div>

          <div className="text-center">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="border border-white text-white px-8 py-4 rounded-sm font-semibold hover:bg-white hover:text-[#002B26] transition-colors inline-flex items-center gap-2">
              <Instagram className="w-5 h-5" />
              Ver mais no Instagram @sr.brisola_
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 relative pb-6 inline-block">
              O Que Nossos Clientes Dizem
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-white"></span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                text: "O melhor corte que já tive em Fortaleza. Ambiente incrível e profissionais atenciosos.",
                author: "Rafael M."
              },
              {
                text: "Assino o plano há 6 meses e não troco por nada. Vale muito a pena!",
                author: "Diego S."
              },
              {
                text: "O Brisola tem um talento único. Sempre saio com o visual impecável.",
                author: "Thiago L."
              }
            ].map((testi, i) => (
              <div key={i} className="bg-[#003D36] border border-[#1A4A44] p-8 rounded-sm relative mt-8 hover:border-[#A8CCC8] transition-colors shadow-lg">
                <div className="absolute -top-6 left-8 text-6xl text-white font-display opacity-20">"</div>
                <div className="flex text-[#A8CCC8] mb-6">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current text-white" />
                  ))}
                </div>
                <p className="text-lg mb-8 relative z-10 italic text-white">"{testi.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <span className="font-bold text-[#002B26]">{testi.author.charAt(0)}</span>
                  </div>
                  <span className="font-semibold text-white">{testi.author}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contato" className="py-24 bg-[#003D36] border-t border-[#1A4A44]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 max-w-6xl mx-auto">
            <div className="lg:w-1/2">
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 relative pb-6">
                Venha Nos Visitar
                <span className="absolute bottom-0 left-0 w-20 h-1 bg-white"></span>
              </h2>
              
              <div className="space-y-6 mb-10 text-lg">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 shrink-0 mt-1" />
                  <p>Av. Monsenhor Tabosa, 633<br/>Fortaleza, CE</p>
                </div>
                <div className="flex items-center gap-4">
                  <Phone className="w-6 h-6 shrink-0" />
                  <p>(85) 99865-5372</p>
                </div>
                <div className="flex items-center gap-4">
                  <Instagram className="w-6 h-6 shrink-0" />
                  <p>@sr.brisola_</p>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 shrink-0 mt-1" />
                  <div>
                    <p>Seg-Sex: 09:00–19:00</p>
                    <p>Sáb: 09:00–18:00</p>
                    <p className="text-[#A8CCC8]">Dom: Fechado</p>
                  </div>
                </div>
              </div>
              
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="bg-white text-[#002B26] px-8 py-4 rounded-sm font-semibold hover:bg-[#E0F2EF] transition-colors inline-flex items-center gap-3 text-lg w-full sm:w-auto justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-green-600" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                Agendar pelo WhatsApp
              </a>
            </div>
            <div className="lg:w-1/2 h-80 lg:h-auto min-h-[400px]">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3981.36531398822!2d-38.51737718468761!3d-3.7314545972851457!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7c748f5e714d643%3A0x6b80ad2d5e219ba5!2sAv.%20Monsenhor%20Tabosa%2C%20633%20-%20Praia%20de%20Iracema%2C%20Fortaleza%20-%20CE%2C%2060165-065!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr" 
                width="100%" 
                height="100%" 
                style={{ border: 0, borderRadius: '4px' }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="filter grayscale opacity-90 hover:grayscale-0 transition-all duration-500"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#001A16] pt-16 pb-8 border-t border-[#1A4A44]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
            <Link href="/" className="flex items-center gap-2">
              <img src="https://i.imgur.com/StI8iHb.png" alt="Logo Sr. Brisola" className="w-56 md:w-64 h-auto object-contain drop-shadow-md" />
            </Link>

            <nav className="flex flex-wrap justify-center gap-6">
              {['Sobre', 'Serviços', 'Planos', 'Equipe', 'Contato'].map((item) => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase()}`}
                  className="text-sm font-medium text-[#A8CCC8] hover:text-white transition-colors"
                >
                  {item}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-[#1A4A44] flex items-center justify-center hover:bg-white hover:text-[#002B26] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-[#1A4A44] flex items-center justify-center hover:bg-white hover:text-[#002B26] transition-colors">
                <Phone className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="text-center border-t border-[#1A4A44] pt-8 text-sm text-[#A8CCC8]">
            <p>© 2025 Barbearia Sr. Brisola. Todos os direitos reservados. Fortaleza-CE</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
