export type ReservationStatus = "reservado" | "ocupado" | "finalizado" | "cancelado";
export type TableStatus = ReservationStatus | "disponivel";

export type Reservation = {
  id: string;
  clienteNome: string;
  contato: string;
  numeroMesa: number;
  quantidadePessoas: number;
  dataHora: string;
  duracaoMin: number;
  observacoes: string;
  status: ReservationStatus;
};

export type RestaurantTable = {
  id: string;
  numero: number;
  capacidade: number;
  localizacao: string;
  status: TableStatus;
  reservaAtual: {
    id: string;
    clienteNome: string;
    dataHora: string;
    quantidadePessoas: number;
  } | null;
};

export type ReservationForm = {
  clienteNome: string;
  contato: string;
  numeroMesa: string;
  quantidadePessoas: string;
  dataHora: string;
  duracaoMin: string;
  observacoes: string;
};
