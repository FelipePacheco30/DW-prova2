export type ReservationStatus = "reservado" | "ocupado" | "finalizado" | "cancelado";

export type ReservationInput = {
  clienteNome: string;
  contato: string;
  numeroMesa: number;
  quantidadePessoas: number;
  dataHora: string | Date;
  duracaoMin?: number;
  observacoes?: string;
  status?: ReservationStatus;
};
