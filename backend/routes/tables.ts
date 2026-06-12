import { Router } from "express";
import { Reservation } from "../models/Reservation.js";
import { Table } from "../models/Table.js";
import { getComputedStatus, syncAllStatuses } from "../services/reservations.js";

export const tablesRouter = Router();

tablesRouter.get("/", async (_request, response, next) => {
  try {
    await syncAllStatuses();
    const [tables, reservations] = await Promise.all([
      Table.find().sort({ numero: 1 }),
      Reservation.find({ status: { $ne: "cancelado" } })
    ]);

    const data = tables.map((table) => {
      const relevantReservations = reservations
        .filter((reservation) => reservation.numeroMesa === table.numero)
        .map((reservation) => ({
          reservation,
          computedStatus: getComputedStatus(reservation),
          startAt: new Date(reservation.dataHora).getTime()
        }))
        .filter(({ computedStatus }) => computedStatus === "reservado" || computedStatus === "ocupado")
        .sort((left, right) => {
          if (left.computedStatus === "ocupado" && right.computedStatus !== "ocupado") {
            return -1;
          }

          if (right.computedStatus === "ocupado" && left.computedStatus !== "ocupado") {
            return 1;
          }

          return left.startAt - right.startAt;
        });

      const activeReservation = relevantReservations[0];

      return {
        id: table._id.toString(),
        numero: table.numero,
        capacidade: table.capacidade,
        localizacao: table.localizacao,
        status: activeReservation ? activeReservation.computedStatus : "disponivel",
        reservaAtual: activeReservation
          ? {
              id: activeReservation.reservation._id.toString(),
              clienteNome: activeReservation.reservation.clienteNome,
              dataHora: activeReservation.reservation.dataHora,
              quantidadePessoas: activeReservation.reservation.quantidadePessoas
            }
          : null
      };
    });

    response.json({ message: "Mesas listadas com sucesso.", data });
  } catch (error) {
    next(error);
  }
});
