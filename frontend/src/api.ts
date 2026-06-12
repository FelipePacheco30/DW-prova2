import type { Reservation, ReservationForm, RestaurantTable } from "./types";

type ApiResponse<T> = {
  message: string;
  data: T;
};

async function request<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });
  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(result.message || "Nao foi possivel concluir a operacao.");
  }

  return result;
}

export async function getTables() {
  return request<RestaurantTable[]>("/api/mesas");
}

export async function getReservations(filters: Record<string, string>) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return request<Reservation[]>(`/api/reservas?${params.toString()}`);
}

export async function saveReservation(form: ReservationForm, id?: string) {
  const payload = {
    clienteNome: form.clienteNome,
    contato: form.contato,
    numeroMesa: Number(form.numeroMesa),
    quantidadePessoas: Number(form.quantidadePessoas),
    dataHora: form.dataHora,
    duracaoMin: Number(form.duracaoMin || 90),
    observacoes: form.observacoes
  };

  return request<Reservation>(id ? `/api/reservas/${id}` : "/api/reservas", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(payload)
  });
}

export async function cancelReservation(id: string) {
  return request<Reservation | { id: string }>(`/api/reservas/${id}`, {
    method: "DELETE"
  });
}
