const {createClient} = require("@supabase/supabase-js");
const c = createClient("https://dcoyjvbhrkarrmetrhiv.supabase.co", "sb_publishable_hEiOOmx4G4nXXpa7pA7nLg_N3bOxPSw");

async function seed() {
  const leads = [
    {nombre:"Juan Carlos",apellido:"Silva Munoz",rut:"16.567.890-1",email:"juan.silva@gmail.com",telefono:"+56987654321",origen:"REFERIDO",etapa:"DOCS_COMPLETAS",prioridad:"ALTA",banco:"Banco de Chile",tipocredito:"Credito Hipotecario",montosolicitado:150000000,valorpropiedad:220000000,piedisponible:70000000,situacionlaboral:"INDEPENDIENTE",notas:"Cliente interesado en credito hipotecario"},
    {nombre:"Maria",apellido:"Gonzalez",rut:"12.345.678-5",email:"maria.gonzalez@email.cl",telefono:"+56912345678",origen:"REFERIDO",etapa:"CONTACTADO",prioridad:"MEDIA",banco:"Santander",tipocredito:"Credito Hipotecario",montosolicitado:120000000,valorpropiedad:180000000,piedisponible:60000000,situacionlaboral:"DEPENDIENTE"},
    {nombre:"Carlos",apellido:"Rojas",rut:"15.234.567-8",email:"carlos.rojas@email.cl",telefono:"+56923456789",origen:"FACEBOOK",etapa:"INTERESADO",prioridad:"ALTA",banco:"Bci",tipocredito:"Credito Hipotecario",montosolicitado:95000000,valorpropiedad:140000000,piedisponible:45000000,situacionlaboral:"DEPENDIENTE"},
    {nombre:"Juan",apellido:"Perez",rut:"18.765.432-1",email:"juan.perez@email.cl",telefono:"+56934567890",origen:"GOOGLE",etapa:"PREAPROBADO",prioridad:"URGENTE",banco:"Itau",tipocredito:"Credito Hipotecario",montosolicitado:200000000,valorpropiedad:300000000,piedisponible:100000000,situacionlaboral:"INDEPENDIENTE"},
    {nombre:"Ana",apellido:"Torres",rut:"11.222.333-4",email:"ana.torres@email.cl",telefono:"+56945678901",origen:"WHATSAPP",etapa:"EVALUACION_BANCARIA",prioridad:"MEDIA",banco:"Scotiabank",tipocredito:"Credito de Consumo",montosolicitado:80000000,valorpropiedad:120000000,piedisponible:40000000,situacionlaboral:"DEPENDIENTE"},
    {nombre:"Laura",apellido:"Sanchez",rut:"19.876.543-2",email:"laura.sanchez@email.cl",telefono:"+56956789012",origen:"REFERIDO",etapa:"APROBADO",prioridad:"ALTA",banco:"Banco de Chile",tipocredito:"Credito Hipotecario",montosolicitado:175000000,valorpropiedad:250000000,piedisponible:75000000,situacionlaboral:"INDEPENDIENTE"},
    {nombre:"Roberto",apellido:"Silva",rut:"13.456.789-0",email:"roberto.silva@email.cl",telefono:"+56967890123",origen:"FACEBOOK",etapa:"DOCS_PENDIENTES",prioridad:"MEDIA",banco:"Santander",tipocredito:"Credito Hipotecario",montosolicitado:130000000,valorpropiedad:195000000,piedisponible:65000000,situacionlaboral:"DEPENDIENTE"},
    {nombre:"Fernanda",apellido:"Rojas",rut:"17.654.321-K",email:"fernanda.rojas@email.cl",telefono:"+56978901234",origen:"GOOGLE",etapa:"NUEVO_LEAD",prioridad:"BAJA",banco:"Bci",tipocredito:"Credito de Consumo",montosolicitado:50000000,valorpropiedad:75000000,piedisponible:25000000,situacionlaboral:"DEPENDIENTE"},
    {nombre:"Diego",apellido:"Diaz",rut:"14.321.678-9",email:"diego.diaz@email.cl",telefono:"+56989012345",origen:"WHATSAPP",etapa:"CONTACTO_INICIAL",prioridad:"MEDIA",banco:"Itau",tipocredito:"Credito Hipotecario",montosolicitado:160000000,valorpropiedad:240000000,piedisponible:80000000,situacionlaboral:"INDEPENDIENTE"},
    {nombre:"Valentina",apellido:"Morales",rut:"16.789.012-3",email:"valentina.morales@email.cl",telefono:"+56990123456",origen:"REFERIDO",etapa:"INTERESADO",prioridad:"ALTA",banco:"Scotiabank",tipocredito:"Credito Hipotecario",montosolicitado:140000000,valorpropiedad:210000000,piedisponible:70000000,situacionlaboral:"DEPENDIENTE"}
  ];
  const r = await c.from("leads").insert(leads).select();
  console.log("Insertados:", r.data?.length || 0);
  if (r.error) console.log("Error:", r.error.message);
}
seed();
