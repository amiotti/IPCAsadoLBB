export type Categoria = "Bebida" | "Carne" | "Guarnicion" | "Picada";

export const PRODUCTOS_BASE = [
  { producto: "Coca", codigo: "54637", categoria: "Bebida", qty: 4, um: "Un", diciembre: 3230.0, ene: 3330.0 },
  { producto: "Soda", codigo: "22814", categoria: "Bebida", qty: 2, um: "Un", diciembre: 1321.0, ene: 1413.0 },
  { producto: "Fernet", codigo: "10191", categoria: "Bebida", qty: 1, um: "Un", diciembre: 15974.0, ene: 15974.0 },
  { producto: "Vino", codigo: "33516", categoria: "Bebida", qty: 3, um: "Un", diciembre: 7859.0, ene: 9500.0 },
  { producto: "Cerveza", codigo: "11201", categoria: "Bebida", qty: 3, um: "Un", diciembre: 4299.0, ene: 4859.0 },
  { producto: "Matambre", codigo: "2816", categoria: "Carne", qty: 1, um: "Kg", diciembre: 22294.0, ene: 23633.0 },
  { producto: "Vacio", codigo: "2581", categoria: "Carne", qty: 2, um: "Kg", diciembre: 22000.0, ene: 23000.0 },
  { producto: "Costilla", codigo: "2485", categoria: "Carne", qty: 2, um: "Kg", diciembre: 19700.0, ene: 20500.0 },
  { producto: "Carbon", codigo: "32506", categoria: "Carne", qty: 2, um: "Un", diciembre: 3136.0, ene: 3136.0 },
  { producto: "Papa", codigo: "2150", categoria: "Guarnicion", qty: 4, um: "Kg", diciembre: 790.0, ene: 790.0 },
  { producto: "Lechuga", codigo: "2091", categoria: "Guarnicion", qty: 1, um: "Kg", diciembre: 3990.0, ene: 5990.0 },
  { producto: "Tomate", codigo: "2221", categoria: "Guarnicion", qty: 2, um: "Kg", diciembre: 1990.0, ene: 2990.0 },
  { producto: "Queso", codigo: "1604", categoria: "Picada", qty: 0.5, um: "Kg", diciembre: 23134.0, ene: 23828.0 },
  { producto: "Mani", codigo: "10699", categoria: "Picada", qty: 1, um: "Un", diciembre: 3486.0, ene: 3486.0 },
  { producto: "Salame", codigo: "1553", categoria: "Picada", qty: 0.5, um: "Kg", diciembre: 24405.0, ene: 25870.0 },
  { producto: "Pan", codigo: "1230", categoria: "Picada", qty: 1, um: "Kg", diciembre: 2500.0, ene: 2500.0 }
] as const;

export const PERSONAS_CANASTA = 10;
export const ENE_ANIO = 2026;
export const ENE_MES = 1;
export const BASE_ANIO = ENE_ANIO;
export const BASE_MES = ENE_MES;
export const BASE_LABEL = "enero";
export const MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic"
] as const;
