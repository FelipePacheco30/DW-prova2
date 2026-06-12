import { Router } from "express";
import { Reservation } from "../models/Reservation.js";
import { formatReservation, syncAllStatuses, syncReservationStatus, validateReservation } from "../services/reservations.js";

export const reservationsRouter = Router();

reservationsRouter.get("/", async (request, response, next) => {
  try {
    await syncAllStatuses();

    const { cliente, mesa, data, status } = request.query;
    const query: Record<string, unknown> = {};

    if (cliente) {
      query.clienteNome = { $regex: String(cliente), $options: "i" };
    }

    if (mesa) {
      query.numeroMesa = Number(mesa);
    }

    if (status) {
      query.status = status;
    }

    if (data) {
      const start = new Date(`${String(data)}T00:00:00`);
      const end = new Date(`${String(data)}T23:59:59`);
      query.dataHora = { $gte: start, $lte: end };
    }

    const reservations = await Reservation.find(query).sort({ dataHora: 1 });
    response.json({
      message: "Reservas listadas com sucesso.",
      data: reservations.map((reservation) => formatReservation(reservation))
    });
  } catch (error) {
    next(error);
  }
});

reservationsRouter.post("/", async (request, response, next) => {
  try {
    await validateReservation(request.body);

    const reservation = await Reservation.create({
      ...request.body,
      status: "reservado",
      duracaoMin: request.body.duracaoMin || 90
    });

    console.log(`[log] Reserva criada: mesa ${reservation.numeroMesa}, cliente ${reservation.clienteNome}`);
    response.status(201).json({
      message: "Reserva criada com sucesso.",
      data: formatReservation(reservation)
    });
  } catch (error) {
    next(error);
  }
});

reservationsRouter.put("/:id", async (request, response, next) => {
  try {
    const reservation = await Reservation.findById(request.params.id);

    if (!reservation) {
      response.status(404).json({ message: "Reserva nao encontrada." });
      return;
    }

    await validateReservation(request.body, request.params.id);

    reservation.set({
      clienteNome: request.body.clienteNome,
      contato: request.body.contato,
      numeroMesa: request.body.numeroMesa,
      quantidadePessoas: request.body.quantidadePessoas,
      dataHora: request.body.dataHora,
      duracaoMin: request.body.duracaoMin || 90,
      observacoes: request.body.observacoes ?? "",
      status: request.body.status === "cancelado" ? "cancelado" : "reservado"
    });

    await reservation.save();
    await syncReservationStatus(reservation);
    console.log(`[log] Reserva atualizada: ${reservation._id.toString()}`);

    response.json({
      message: "Reserva atualizada com sucesso.",
      data: formatReservation(reservation)
    });
  } catch (error) {
    next(error);
  }
});

reservationsRouter.delete("/:id", async (request, response, next) => {
  try {
    const reservation = await Reservation.findById(request.params.id);

    if (!reservation) {
      response.status(404).json({ message: "Reserva nao encontrada." });
      return;
    }

    if (reservation.status === "cancelado") {
      await reservation.deleteOne();
      console.log(`[log] Reserva removida: ${reservation._id.toString()}`);

      response.json({
        message: "Reserva removida com sucesso.",
        data: { id: request.params.id }
      });
      return;
    }

    reservation.status = "cancelado";
    await reservation.save();
    console.log(`[log] Reserva cancelada: ${reservation._id.toString()}`);

    response.json({
      message: "Reserva cancelada com sucesso.",
      data: formatReservation(reservation)
    });
  } catch (error) {
    next(error);
  }
});
