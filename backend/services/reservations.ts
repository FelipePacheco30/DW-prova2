import { Reservation } from "../models/Reservation.js";
import { Table } from "../models/Table.js";
import type { ReservationDocument } from "../models/Reservation.js";
import type { ReservationInput, ReservationStatus } from "../types.js";

const DEFAULT_DURATION_MIN = 90;
const MIN_ADVANCE_MS = 60 * 60 * 1000;

export function getComputedStatus(reservation: Pick<ReservationDocument, "dataHora" | "duracaoMin" | "status">): ReservationStatus {
  if (reservation.status === "cancelado") {
    return "cancelado";
  }

  const start = new Date(reservation.dataHora).getTime();
  const end = start + reservation.duracaoMin * 60 * 1000;
  const now = Date.now();

  if (now < start) {
    return "reservado";
  }

  if (now >= start && now <= end) {
    return "ocupado";
  }

  return "finalizado";
}

export async function syncReservationStatus(reservation: ReservationDocument) {
  const computed = getComputedStatus(reservation);

  if (reservation.status !== computed) {
    reservation.status = computed;
    await reservation.save();
  }

  return reservation;
}

export async function syncAllStatuses() {
  const reservations = await Reservation.find({ status: { $ne: "cancelado" } });
  await Promise.all(reservations.map((reservation) => syncReservationStatus(reservation as ReservationDocument)));
}

export async function validateReservation(input: ReservationInput, ignoreId?: string) {
  const table = await Table.findOne({ numero: input.numeroMesa });

  if (!table) {
    throw new Error("Mesa nao encontrada.");
  }

  if (input.quantidadePessoas > table.capacidade) {
    throw new Error(`A mesa ${table.numero} comporta ate ${table.capacidade} pessoas.`);
  }

  const start = new Date(input.dataHora);

  if (Number.isNaN(start.getTime())) {
    throw new Error("Data e hora da reserva invalidas.");
  }

  if (start.getTime() - Date.now() < MIN_ADVANCE_MS) {
    throw new Error("Reservas devem ser feitas com antecedencia minima de 1 hora.");
  }

  const duration = input.duracaoMin ?? DEFAULT_DURATION_MIN;
  const end = new Date(start.getTime() + duration * 60 * 1000);

  const query = {
    numeroMesa: input.numeroMesa,
    status: { $ne: "cancelado" },
    ...(ignoreId ? { _id: { $ne: ignoreId } } : {})
  };

  const reservations = await Reservation.find(query);
  const hasConflict = reservations.some((reservation) => {
    const otherStart = new Date(reservation.dataHora).getTime();
    const otherEnd = otherStart + reservation.duracaoMin * 60 * 1000;
    return start.getTime() < otherEnd && end.getTime() > otherStart;
  });

  if (hasConflict) {
    throw new Error("Esta mesa ja possui reserva no mesmo horario.");
  }
}

export function formatReservation(reservation: ReservationDocument) {
  return {
    id: reservation._id.toString(),
    clienteNome: reservation.clienteNome,
    contato: reservation.contato,
    numeroMesa: reservation.numeroMesa,
    quantidadePessoas: reservation.quantidadePessoas,
    dataHora: reservation.dataHora,
    duracaoMin: reservation.duracaoMin,
    observacoes: reservation.observacoes,
    status: reservation.status,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt
  };
}
