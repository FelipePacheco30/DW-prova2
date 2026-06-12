import mongoose, { HydratedDocument, Schema } from "mongoose";
import type { ReservationStatus } from "../types.js";

const statuses: ReservationStatus[] = ["reservado", "ocupado", "finalizado", "cancelado"];

const reservationSchema = new Schema(
  {
    clienteNome: {
      type: String,
      required: [true, "Informe o nome do cliente."],
      trim: true,
      minlength: [2, "O nome precisa ter pelo menos 2 caracteres."]
    },
    contato: {
      type: String,
      required: [true, "Informe o contato do cliente."],
      trim: true
    },
    numeroMesa: {
      type: Number,
      required: [true, "Informe o numero da mesa."]
    },
    quantidadePessoas: {
      type: Number,
      required: [true, "Informe a quantidade de pessoas."],
      min: [1, "A reserva precisa ter pelo menos 1 pessoa."]
    },
    dataHora: {
      type: Date,
      required: [true, "Informe a data e hora da reserva."]
    },
    duracaoMin: {
      type: Number,
      default: 90,
      min: [30, "A duracao minima e de 30 minutos."]
    },
    observacoes: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: {
        values: statuses,
        message: "Status invalido."
      },
      default: "reservado"
    }
  },
  { timestamps: true }
);

reservationSchema.index({ numeroMesa: 1, dataHora: 1 });

export type ReservationDocument = HydratedDocument<mongoose.InferSchemaType<typeof reservationSchema>>;

export const Reservation = mongoose.model("Reservation", reservationSchema);
