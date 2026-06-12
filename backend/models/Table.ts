import mongoose, { Schema } from "mongoose";

export type TableDocument = mongoose.InferSchemaType<typeof tableSchema>;

const tableSchema = new Schema(
  {
    numero: {
      type: Number,
      required: [true, "Informe o numero da mesa."],
      unique: true,
      min: [1, "O numero da mesa deve ser positivo."]
    },
    capacidade: {
      type: Number,
      required: [true, "Informe a capacidade da mesa."],
      min: [1, "A capacidade deve ser maior que zero."]
    },
    localizacao: {
      type: String,
      required: [true, "Informe a localizacao da mesa."],
      trim: true
    }
  },
  { timestamps: true }
);

export const Table = mongoose.model("Table", tableSchema);
