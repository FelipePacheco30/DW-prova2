import mongoose from "mongoose";
import { Table } from "./models/Table.js";

const initialTables = [
  { numero: 1, capacidade: 2, localizacao: "Janela" },
  { numero: 2, capacidade: 2, localizacao: "Varanda" },
  { numero: 3, capacidade: 4, localizacao: "Salao principal" },
  { numero: 4, capacidade: 4, localizacao: "Salao principal" },
  { numero: 5, capacidade: 6, localizacao: "Area interna" },
  { numero: 6, capacidade: 6, localizacao: "Varanda" },
  { numero: 7, capacidade: 8, localizacao: "Espaco familia" },
  { numero: 8, capacidade: 10, localizacao: "Espaco reservado" }
];

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/reserva";
  await mongoose.connect(uri);
  console.log("[db] Conectado ao MongoDB");
  await seedTables();
}

async function seedTables() {
  const count = await Table.countDocuments();

  if (count === 0) {
    await Table.insertMany(initialTables);
    console.log("[seed] Mesas iniciais cadastradas");
  }
}
