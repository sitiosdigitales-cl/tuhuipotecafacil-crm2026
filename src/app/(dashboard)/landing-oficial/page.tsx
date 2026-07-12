"use client";

import { useState, useRef, useEffect } from "react";
import {
  Home, Phone, MessageSquare, Mail, ChevronDown, ChevronRight,
  Shield, Clock, TrendingUp, Users, Star, CheckCircle, Globe,
  ArrowRight, Calculator, FileText, CreditCard, Building2,
  Briefcase, Target, Zap, Heart, Award, Search, Menu, X,
  Send, Calendar, MapPin, ExternalLink, Globe as GlobeIcon,
} from "lucide-react";

// Secciones de navegación
const NAV_ITEMS = [
  { id: "inicio", label: "Inicio" },
  { id: "quienes", label: "¿Quiénes Somos?" },
  { id: "servicios", label: "Servicios" },
  { id: "clientes", label: "Nuestros Clientes" },
  { id: "dudas", label: "¿Tienes Dudas?" },
  { id: "contacto", label: "Contacto" },
];

const SERVICIOS = [
  {
    titulo: "Crédito Hipotecario",
    descripcion: "Un financiamiento otorgado por una entidad financiera para la compra de una propiedad, pagado en cuotas mensuales durante un plazo determinado.",
    imagen: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80",
    color: "from-blue-500 to-blue-600",
  },
  {
    titulo: "Crédito de Consumo",
    descripcion: "Un financiamiento para cubrir gastos personales, proyectos o necesidades económicas, pagándolo en cuotas mensuales según el plazo acordado.",
    imagen: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=80",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    titulo: "Fines Generales",
    descripcion: "Un préstamo hipotecario que utiliza una propiedad como garantía, permitiendo obtener financiamiento para inversión, consolidación de deudas o proyectos.",
    imagen: "https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=400&q=80",
    color: "from-purple-500 to-purple-600",
  },
  {
    titulo: "Capital para Empresas",
    descripcion: "Financiamiento destinado a empresas y emprendedores para obtener liquidez, capital de trabajo o inversión para impulsar operaciones y crecimiento.",
    imagen: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    color: "from-amber-500 to-amber-600",
  },
];

const PORQUE_ELEGIRNOS = [
  { icono: Zap, titulo: "Agilidad", descripcion: "Optimizamos cada etapa de la evaluación y gestión bancaria para entregar respuestas rápidas.", color: "text-blue-500", bg: "bg-blue-50" },
  { icono: Home, titulo: "Comodidad", descripcion: "Simplificamos cada etapa del proceso para que gestiones tu financiamiento sin preocupaciones.", color: "text-emerald-500", bg: "bg-emerald-50" },
  { icono: TrendingUp, titulo: "Mayor alcance financiero", descripcion: "Estructuramos tu perfil financiero para ayudarte a acceder a mayor capacidad de financiamiento.", color: "text-purple-500", bg: "bg-purple-50" },
  { icono: Shield, titulo: "Confidencialidad", descripcion: "Protegemos tu información financiera con total privacidad y resguardo durante toda la gestión.", color: "text-amber-500", bg: "bg-amber-50" },
  { icono: Target, titulo: "Bajo pie", descripcion: "Gestionamos alternativas que pueden permitirte acceder a financiamiento sin el pie completo.", color: "text-red-500", bg: "bg-red-50" },
];

const FAQ_DATA = [
  { q: "¿Qué es una pre evaluación financiera?", a: "Es una revisión inicial que nos permite determinar si tu perfil cumple con las condiciones básicas para ser evaluado por las instituciones financieras." },
  { q: "¿Cuánto cuesta evaluarme?", a: "La preevaluación y evaluación financiera son completamente gratuitas. Analizamos tu perfil sin ningún costo ni compromiso." },
  { q: "¿Cuánto tiempo dura la evaluación?", a: "El proceso de evaluación tiene una duración aproximada de 7 días hábiles, contados desde que recibimos la totalidad de los documentos." },
  { q: "¿Puedo acceder a una evaluación si estoy en DICOM?", a: "Para iniciar una gestión hipotecaria es necesario no mantener antecedentes comerciales que impidan la evaluación. Sin embargo, podemos orientarte sobre tu situación particular." },
  { q: "¿Puedo acceder a un crédito siendo trabajador independiente?", a: "Sí, los trabajadores independientes también pueden acceder. Es fundamental acreditar ingresos de manera formal y demostrar estabilidad financiera." },
  { q: "¿Qué pasa si no tengo el pie completo?", a: "No tener el pie completo no significa que no puedas comprar. Existen estrategias que pueden reducir significativamente el ahorro inicial requerido." },
];

export default function LandingOficialPage() {
  const [seccionActiva, setSeccionActiva] = useState("inicio");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [faqAbierto, setFaqAbierto] = useState<number | null>(null);
  const [contador, setContador] = useState({ anios: 0, clientes: 0 });
  const seccionesRef = useRef<Record<string, HTMLElement | null>>({});

  // Animación de contadores
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            let frame = 0;
            const total = 120;
            const animate = () => {
              if (frame <= total) {
                const progress = frame / total;
                setContador({
                  anios: Math.round(progress * 2),
                  clientes: Math.round(progress * 500),
                });
                frame++;
                requestAnimationFrame(animate);
              }
            };
            animate();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    const statsEl = document.getElementById("stats-section");
    if (statsEl) observer.observe(statsEl);
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    setSeccionActiva(id);
    setMenuAbierto(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Home size={20} className="text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900">TuHipotecaFacil.cl</span>
                <span className="hidden sm:block text-[10px] text-slate-400">CRM Hipotecario Inteligente</span>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-6">
              {NAV_ITEMS.map((item) => (
                <button key={item.id} onClick={() => scrollTo(item.id)}
                  className={`text-[12px] font-semibold transition-colors ${seccionActiva === item.id ? "text-blue-600" : "text-slate-600 hover:text-blue-600"}`}>
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <a href="https://wa.me/56983300597" target="_blank" rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-[11px] font-semibold hover:bg-green-600 transition-colors">
                <MessageSquare size={14} /> WhatsApp
              </a>
              <button onClick={() => scrollTo("contacto")} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-700 transition-colors">
                Pre Evaluación
              </button>
              <button onClick={() => setMenuAbierto(!menuAbierto)} className="lg:hidden p-2">
                {menuAbierto ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {menuAbierto && (
          <div className="lg:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-2">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => scrollTo(item.id)}
                className="block w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="inicio" className="pt-16">
        <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full mb-6">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[11px] font-semibold text-blue-200">Evaluaciones 100% Gratuitas</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                  Revolucionando la forma de obtener tu <span className="text-blue-400">crédito hipotecario</span>
                </h1>
                <p className="text-lg text-blue-200/70 mb-8 leading-relaxed">
                  Te ayudamos a conseguir el mejor financiamiento para tu hogar con tasas competitivas y un proceso simple.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => scrollTo("contacto")}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-600/30">
                    <Calculator size={16} /> Comenzar Pre Evaluación
                  </button>
                  <a href="https://wa.me/56983300597" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors">
                    <MessageSquare size={16} /> Hablar por WhatsApp
                  </a>
                </div>
              </div>
              <div className="hidden lg:block">
                <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80"
                  alt="Casa moderna" className="rounded-2xl shadow-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icono: Clock, titulo: "Agilidad y Gestión", desc: "Hacemos tu evaluación crediticia más rápida, simple y eficiente.", color: "text-blue-500", bg: "bg-blue-50" },
              { icono: Shield, titulo: "Confidencialidad y Resguardo", desc: "Protegemos tus antecedentes financieros con altos estándares de privacidad.", color: "text-emerald-500", bg: "bg-emerald-50" },
              { icono: TrendingUp, titulo: "La mejor tasa para tu Crédito", desc: "Paga menos intereses y obtén mejores condiciones.", color: "text-purple-500", bg: "bg-purple-50" },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-100 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <f.icono size={22} className={f.color} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">{f.titulo}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quiénes Somos */}
      <section id="quienes" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Sobre nosotros</span>
              <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-6">¿QUIÉNES SOMOS?</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                En <strong>Tu Hipoteca Fácil</strong> somos una empresa especializada en gestión y asesoría financiera,
                enfocada en ayudar a personas y empresas a acceder a mejores oportunidades de financiamiento de manera rápida, segura y eficiente.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed mb-8">
                Nuestro objetivo es simplificar los procesos bancarios y entregar soluciones financieras adaptadas a cada cliente,
                brindando acompañamiento durante toda la gestión.
              </p>
              <div className="space-y-3">
                {[
                  "Gestión directa con entidades financieras",
                  "Comparación de tasas y condiciones crediticias",
                  "Evaluaciones rápidas y estratégicas",
                  "Equipo con más de 10 años de experiencia bancaria",
                  "Expertos en tasas de interés y políticas de financiamiento",
                  "Compromiso con la confidencialidad",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=600&q=80"
                alt="Oficina" className="rounded-2xl shadow-xl" />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Award size={20} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">10+</div>
                  <div className="text-[10px] text-slate-500">Años de experiencia</div>
                </div>
              </div>
            </div>
          </div>

          {/* Fundadores */}
          <div className="grid md:grid-cols-2 gap-6 mt-16">
            {[
              { nombre: "Alexander Del Valle", cargo: "CEO & Fundador", img: "AD" },
              { nombre: "Diego Villena", cargo: "CEO & Cofundador", img: "DV" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                  {f.img}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{f.nombre}</h3>
                  <p className="text-xs text-slate-500">{f.cargo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Nuestros servicios</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">Soluciones financieras a tu medida</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {SERVICIOS.map((s, i) => (
              <div key={i} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all">
                <div className="relative h-48 overflow-hidden">
                  <img src={s.imagen} alt={s.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${s.color} opacity-60`} />
                  <h3 className="absolute bottom-4 left-5 text-xl font-bold text-white">{s.titulo}</h3>
                </div>
                <div className="p-5">
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{s.descripcion}</p>
                  <button onClick={() => scrollTo("contacto")}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    Realizar evaluación <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Por qué elegirnos */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">¿Por qué elegirnos?</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">Por qué elegir a Tu Hipoteca Fácil</h2>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {PORQUE_ELEGIRNOS.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-lg transition-all text-center">
                <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <item.icono size={22} className={item.color} />
                </div>
                <h3 className="text-xs font-bold text-slate-800 mb-2">{item.titulo}</h3>
                <p className="text-[10px] text-slate-500 leading-relaxed">{item.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats-section" className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">{contador.anios}+</div>
              <div className="text-sm text-blue-200">Años de experiencia</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">{contador.clientes}+</div>
              <div className="text-sm text-blue-200">Clientes gestionados</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section id="clientes" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Testimonios reales</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">Cada hogar tiene una historia</h2>
            <p className="text-sm text-slate-500 mt-2">Estas son algunas experiencias de clientes que confiaron en nosotros.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  &ldquo;Excelente atención y profesionalismo. Nos ayudaron a conseguir el mejor crédito para nuestro hogar. 100% recomendados.&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">C{i}</div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Cliente {i}</div>
                    <div className="text-[10px] text-slate-400">Crédito Hipotecario</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="dudas" className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Preguntas frecuentes</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">Resolvemos tus dudas antes de empezar</h2>
          </div>
          <div className="space-y-3">
            {FAQ_DATA.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <button onClick={() => setFaqAbierto(faqAbierto === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-semibold text-slate-800 pr-4">{faq.q}</span>
                  <ChevronDown size={16} className={`text-slate-400 flex-shrink-0 transition-transform ${faqAbierto === i ? "rotate-180" : ""}`} />
                </button>
                {faqAbierto === i && (
                  <div className="px-5 pb-5">
                    <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Contáctanos</span>
              <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-2">Comienza tu Pre Evaluación Financiera SIN COSTO</h2>
              <p className="text-sm text-slate-500 mb-8">Completa el formulario y nos pondremos en contacto contigo.</p>
              <div className="space-y-4">
                <a href="https://wa.me/56983300597" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                    <MessageSquare size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">WhatsApp</div>
                    <div className="text-[11px] text-slate-500">(+56) 9 83300597</div>
                  </div>
                </a>
                <a href="mailto:contacto@tuhipotecafacil.cl"
                  className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Mail size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Correo Electrónico</div>
                    <div className="text-[11px] text-slate-500">contacto@tuhipotecafacil.cl</div>
                  </div>
                </a>
                <a href="tel:+56983300597"
                  className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                    <Phone size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Teléfono</div>
                    <div className="text-[11px] text-slate-500">(+56) 9 83300597</div>
                  </div>
                </a>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-lg">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Nombre *</label>
                    <input type="text" placeholder="Tu nombre" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Apellido *</label>
                    <input type="text" placeholder="Tu apellido" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">RUT *</label>
                    <input type="text" placeholder="12.345.678-9" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Edad *</label>
                    <input type="number" placeholder="33" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Teléfono *</label>
                  <input type="tel" placeholder="+56 9 1234 5678" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Email *</label>
                  <input type="email" placeholder="correo@ejemplo.cl" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Situación laboral *</label>
                  <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option>Dependiente</option><option>Independiente</option><option>Empresa / Pyme</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Tipo de crédito *</label>
                  <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option>Crédito Hipotecario</option><option>Crédito de Consumo</option><option>Fines Generales</option><option>Capital para Empresas</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Comentarios</label>
                  <textarea rows={3} placeholder="Cuéntanos tu situación..." className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                </div>
                <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                  <Send size={16} /> Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Home size={20} className="text-white" />
                </div>
                <span className="text-sm font-bold">TuHipotecaFacil.cl</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                «No somos otro intermediario. Estamos revolucionando la forma de obtener tu crédito hipotecario.»
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase mb-4">Menú</h4>
              <div className="space-y-2">
                {NAV_ITEMS.slice(0, 4).map((item) => (
                  <button key={item.id} onClick={() => scrollTo(item.id)}
                    className="block text-xs text-slate-400 hover:text-white transition-colors">{item.label}</button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase mb-4">Legal</h4>
              <div className="space-y-2">
                <span className="block text-xs text-slate-400">Términos y Condiciones</span>
                <span className="block text-xs text-slate-400">Políticas de Privacidad</span>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase mb-4">Contacto</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-400"><MapPin size={12} /> Santiago de Chile</div>
                <div className="flex items-center gap-2 text-xs text-slate-400"><Phone size={12} /> (+56) 9 83300597</div>
                <div className="flex items-center gap-2 text-xs text-slate-400"><Mail size={12} /> contacto@tuhipotecafacil.cl</div>
              </div>
              <div className="flex gap-2 mt-4">
                <a href="#" className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors">
                  <GlobeIcon size={14} />
                </a>
                <a href="#" className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors">
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-[10px] text-slate-500">© 2024 TuHipotecaFacil.cl — Todos los derechos reservados</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
