"use client";

import { useState, useEffect, useRef } from "react";
import {
  Home, Phone, MessageSquare, Mail, Globe, Code, Smartphone,
  ShoppingCart, BarChart3, Layers, Zap, Shield, Clock,
  ChevronRight, ChevronDown, Star, ArrowRight, Menu, X,
  Send, MapPin, ExternalLink, Check, Users, TrendingUp,
  Calendar, FileText, CreditCard, Building2, Calculator,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

// Secciones del sitio
const SERVICIOS = [
  { icono: Globe, titulo: "Landing Pages", desc: "Páginas de alta conversión diseñadas para convertir visitantes en clientes potenciales.", color: "from-orange-500 to-amber-500" },
  { icono: ShoppingCart, titulo: "Tiendas Online", desc: "E-commerce completo con pasarela de pagos, inventario y gestión de pedidos.", color: "from-blue-500 to-cyan-500" },
  { icono: BarChart3, titulo: "Sistemas ERP/CRM", desc: "Software de gestión empresarial a medida para controlar ventas, inventario y más.", color: "from-purple-500 to-pink-500" },
  { icono: Smartphone, titulo: "Apps Móviles", desc: "Aplicaciones nativas e híbridas para iOS y Android que potencian tu negocio.", color: "from-emerald-500 to-teal-500" },
];

const PORTAFOLIO = [
  { titulo: "E-Commerce Moda", categoria: "Tienda Online", imagen: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80", color: "bg-purple-500" },
  { titulo: "CRM Inmobiliario", categoria: "Sistema ERP", imagen: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80", color: "bg-blue-500" },
  { titulo: "App Delivery", categoria: "App Móvil", imagen: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80", color: "bg-emerald-500" },
  { titulo: "Landing Fintech", categoria: "Landing Page", imagen: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80", color: "bg-orange-500" },
  { titulo: "Portal Clientes", categoria: "Sistema Web", imagen: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80", color: "bg-indigo-500" },
  { titulo: "App Salud", categoria: "App Móvil", imagen: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80", color: "bg-rose-500" },
];

const PASOS = [
  { num: "01", titulo: "Descubrimiento", desc: "Analizamos tu negocio, objetivos y público objetivo para diseñar la solución perfecta." },
  { num: "02", titulo: "Diseño", desc: "Creamos prototipos interactivos y diseños modernos que reflejan tu marca." },
  { num: "03", titulo: "Desarrollo", desc: "Programamos con tecnologías de vanguardia: React, Next.js, Node.js, PostgreSQL." },
  { num: "04", titulo: "Lanzamiento", desc: "Desplegamos, optimizamos y entregamos tu proyecto listo para conquistar el mercado." },
];

const TESTIMONIOS = [
  { nombre: "Carlos Mendoza", empresa: "TechStart", texto: "WebMaker transformó nuestra presencia digital. Nuestras ventas online aumentaron un 340% en 6 meses.", rating: 5 },
  { nombre: "María García", empresa: "HealthPlus", texto: "El CRM que nos desarrollaron revolucionó la gestión de pacientes. Ahora todo es automático.", rating: 5 },
  { nombre: "Roberto Díaz", empresa: "InmoPro", texto: "La landing page que crearon genera 50 leads calificados por semana. Resultados increíbles.", rating: 5 },
];

const STATS = [
  { valor: "200+", label: "Proyectos Entregados" },
  { valor: "98%", label: "Clientes Satisfechos" },
  { valor: "15+", label: "Países Atendidos" },
  { valor: "5+", label: "Años de Experiencia" },
];

export default function WebmakerPage() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState("inicio");
  const [statsAnimados, setStatsAnimados] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStatsAnimados(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    setSeccionActiva(id);
    setMenuAbierto(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="text-lg font-bold text-white font-['Space_Grotesk']">WebMaker</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {["inicio", "servicios", "portafolio", "proceso", "testimonios", "contacto"].map((id) => (
              <button key={id} onClick={() => scrollTo(id)}
                className={`text-[12px] font-medium transition-colors ${seccionActiva === id ? "text-orange-400" : "text-slate-400 hover:text-white"}`}>
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <a href="https://wa.me/56953657460" target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-[11px] font-semibold hover:bg-orange-600 transition-colors">
              <MessageSquare size={13} /> Cotizar
            </a>
            <button onClick={() => setMenuAbierto(!menuAbierto)} className="md:hidden p-2 text-white">
              {menuAbierto ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menuAbierto && (
          <div className="md:hidden bg-[#0f1419] border-t border-white/5 px-6 py-4 space-y-3">
            {["inicio", "servicios", "portafolio", "proceso", "testimonios", "contacto"].map((id) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="block text-sm text-slate-300 hover:text-orange-400 transition-colors">
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="inicio" className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full mb-8">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-[11px] font-bold text-orange-400 tracking-wider">AGENCIA DE DESARROLLO · CONSOLIDADA EN LATAM</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6 font-['Inter'] max-w-3xl">
            Diseño web y <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">software a medida</span> para tu empresa
          </h1>
          <p className="text-lg text-slate-400 mb-10 max-w-xl leading-relaxed">
            Creamos soluciones digitales personalizadas: desde sitios web que convierten visitantes en clientes, hasta sistemas de gestión empresarial.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#contacto" className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">
              Cotizar Gratis <ArrowRight size={16} />
            </a>
            <a href="#portafolio" className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white border border-white/10 rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors">
              Ver Proyectos
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div ref={statsRef} className="py-16 px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-bold text-white font-['Space_Grotesk']">{s.valor}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Servicios */}
      <section id="servicios" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold text-orange-400 tracking-wider">NUESTROS SERVICIOS</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 font-['Inter']">Soluciones digitales a tu medida</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {SERVICIOS.map((s, i) => (
              <div key={i} className="group p-8 bg-[#0f1419] border border-white/5 rounded-2xl hover:border-orange-500/20 transition-all duration-300">
                <div className={`w-14 h-14 bg-gradient-to-br ${s.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <s.icono size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 font-['Inter']">{s.titulo}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                <button className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors">
                  Saber más <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portafolio */}
      <section id="portafolio" className="py-24 px-6 bg-[#0f1419]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold text-orange-400 tracking-wider">PORTAFOLIO</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 font-['Inter']">Proyectos que hablan por sí solos</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PORTAFOLIO.map((p, i) => (
              <div key={i} className="group relative overflow-hidden rounded-2xl bg-[#0a0a0f] border border-white/5 hover:border-orange-500/20 transition-all">
                <div className="relative h-56 overflow-hidden">
                  <img src={p.imagen} alt={p.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
                </div>
                <div className="p-5">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${p.color} text-white`}>{p.categoria}</span>
                  <h3 className="text-lg font-bold text-white mt-2 font-['Inter']">{p.titulo}</h3>
                  <button className="mt-3 flex items-center gap-1 text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors">
                    Ver proyecto <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proceso */}
      <section id="proceso" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold text-orange-400 tracking-wider">NUESTRO PROCESO</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 font-['Inter']">De la idea al lanzamiento</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {PASOS.map((p, i) => (
              <div key={i} className="relative p-6 bg-[#0f1419] border border-white/5 rounded-2xl">
                <div className="text-4xl font-bold text-orange-500/20 font-['Space_Grotesk'] mb-4">{p.num}</div>
                <h3 className="text-lg font-bold text-white mb-2 font-['Inter']">{p.titulo}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
                {i < 3 && <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center"><ChevronRight size={12} className="text-orange-400" /></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section id="testimonios" className="py-24 px-6 bg-[#0f1419]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold text-orange-400 tracking-wider">TESTIMONIOS</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 font-['Inter']">Lo que dicen nuestros clientes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIOS.map((t, i) => (
              <div key={i} className="p-6 bg-[#0a0a0f] border border-white/5 rounded-2xl">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => <Star key={j} size={14} className="fill-orange-400 text-orange-400" />)}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">&ldquo;{t.texto}&rdquo;</p>
                <div>
                  <div className="text-sm font-bold text-white">{t.nombre}</div>
                  <div className="text-[11px] text-slate-500">{t.empresa}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold text-orange-400 tracking-wider">CONTACTO</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 font-['Inter']">¿Listo para empezar?</h2>
            <p className="text-sm text-slate-400 mt-3">Cuéntanos tu proyecto y te damos una cotización gratis.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-[#0f1419] border border-white/5 rounded-xl">
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center"><Phone size={20} className="text-orange-400" /></div>
                <div><div className="text-sm font-bold text-white">+56 9 5365 7460</div><div className="text-[11px] text-slate-500">Llámanos</div></div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-[#0f1419] border border-white/5 rounded-xl">
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center"><Mail size={20} className="text-orange-400" /></div>
                <div><div className="text-sm font-bold text-white">correos@webmakerlatam.com</div><div className="text-[11px] text-slate-500">Escríbenos</div></div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-[#0f1419] border border-white/5 rounded-xl">
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center"><MapPin size={20} className="text-orange-400" /></div>
                <div><div className="text-sm font-bold text-white">LATAM</div><div className="text-[11px] text-slate-500">Trabajamos remoto en toda Latinoamérica</div></div>
              </div>
              <a href="https://wa.me/56953657460" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-colors">
                <MessageSquare size={16} /> WhatsApp Directo
              </a>
            </div>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast("¡Mensaje enviado! Te contactaremos pronto."); }}>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Nombre" required className="w-full px-4 py-3 bg-[#0f1419] border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50 transition-colors" />
                <input type="email" placeholder="Email" required className="w-full px-4 py-3 bg-[#0f1419] border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50 transition-colors" />
              </div>
              <select className="w-full px-4 py-3 bg-[#0f1419] border border-white/10 rounded-xl text-sm text-slate-400 focus:outline-none focus:border-orange-500/50 transition-colors">
                <option>Selecciona un servicio</option>
                <option>Landing Page</option>
                <option>Tienda Online</option>
                <option>Sistema ERP/CRM</option>
                <option>App Móvil</option>
                <option>Otro</option>
              </select>
              <textarea rows={4} placeholder="Cuéntanos tu proyecto..." required className="w-full px-4 py-3 bg-[#0f1419] border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50 transition-colors resize-none" />
              <button type="submit" className="w-full py-3 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
                <Send size={14} /> Enviar Mensaje
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">W</span>
            </div>
            <span className="text-sm font-bold text-white font-['Space_Grotesk']">WebMaker</span>
          </div>
          <div className="text-[11px] text-slate-500">© 2026 WebMaker LATAM. Todos los derechos reservados.</div>
          <div className="flex gap-4">
            <a href="https://www.instagram.com/webmakerlatam" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-orange-400 transition-colors">
              <Globe size={16} />
            </a>
            <a href="https://www.tiktok.com/@webmakerlatam" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-orange-400 transition-colors">
              <Smartphone size={16} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function toast(msg: string) { alert(msg); }
