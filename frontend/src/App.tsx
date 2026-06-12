import { Bell, Check, ClipboardList, Pencil, Search, Trash2, UserRound, UsersRound, Utensils, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { cancelReservation, getReservations, getTables, saveReservation } from "./api";
import type { Reservation, ReservationForm, ReservationStatus, RestaurantTable, TableStatus } from "./types";

const emptyForm: ReservationForm = {
  clienteNome: "",
  contato: "",
  numeroMesa: "1",
  quantidadePessoas: "2",
  dataHora: "",
  duracaoMin: "90",
  observacoes: ""
};

const statusLabel: Record<TableStatus, string> = {
  disponivel: "Disponivel",
  reservado: "Reservada",
  ocupado: "Ocupada",
  finalizado: "Finalizada",
  cancelado: "Cancelada"
};

type ModalState =
  | { mode: "create"; table: RestaurantTable }
  | { mode: "edit"; reservation: Reservation }
  | null;

type ToastState = {
  placement: "page" | "modal";
  text: string;
  type: "success" | "error";
} | null;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(date));
}

function toInputDate(date: string) {
  const value = new Date(date);
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 16);
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)} ${digits.slice(2, 6)}-${digits.slice(6)}`;
}

function getCapacity(tables: RestaurantTable[], tableNumber: string) {
  return tables.find((table) => String(table.numero) === tableNumber)?.capacidade ?? 1;
}

function getSeatStates(total: number, reserved: number) {
  return Array.from({ length: Math.min(total, 6) }, (_, index) => index < reserved);
}

export default function App() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [filters, setFilters] = useState({ cliente: "", mesa: "", data: "", status: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [modalForm, setModalForm] = useState<ReservationForm>(emptyForm);

  async function loadData(nextFilters = filters) {
    setIsLoading(true);

    try {
      const [tableResult, filteredReservationsResult, allReservationsResult] = await Promise.all([
        getTables(),
        getReservations(nextFilters),
        getReservations({})
      ]);
      setTables(tableResult.data);
      setReservations(filteredReservationsResult.data);
      setAllReservations(allReservationsResult.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao carregar dados.";
      showToast("error", errorMessage, modalState ? "modal" : "page");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData(filters);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const metrics = useMemo(() => {
    const active = allReservations.filter((reservation) => reservation.status !== "cancelado");

    return {
      total: allReservations.length,
      people: active.reduce((sum, reservation) => sum + reservation.quantidadePessoas, 0),
      freeTables: tables.filter((table) => table.status === "disponivel").length
    };
  }, [allReservations, tables]);

  const currentModalCapacity = getCapacity(tables, modalForm.numeroMesa);
  const maxTableNumber = tables.length;

  function showToast(type: "success" | "error", text: string, placement: "page" | "modal") {
    setToast({ type, text, placement });
  }

  function mergeFormState(current: ReservationForm, next: Partial<ReservationForm>) {
    const merged = { ...current, ...next };
    const capacity = getCapacity(tables, merged.numeroMesa);
    const people = Number(merged.quantidadePessoas || 0);

    if (people > capacity) {
      merged.quantidadePessoas = String(capacity);
    }

    return merged;
  }

  function updateModalForm(next: Partial<ReservationForm>) {
    setModalForm((current) => mergeFormState(current, next));
  }

  function validateReservationForm(targetForm: ReservationForm, capacity: number) {
    const phoneDigits = targetForm.contato.replace(/\D/g, "");

    if (phoneDigits.length !== 10) {
      return "Informe o contato no formato XX XXXX-XXXX.";
    }

    if (Number(targetForm.quantidadePessoas) > capacity) {
      return `A mesa selecionada comporta no maximo ${capacity} pessoas.`;
    }

    return null;
  }

  function openCreateModal(table: RestaurantTable) {
    const minimumDate = new Date(Date.now() + 65 * 60 * 1000);
    minimumDate.setMinutes(minimumDate.getMinutes() - minimumDate.getTimezoneOffset());

    setModalState({ mode: "create", table });
    setModalForm({
      ...emptyForm,
      numeroMesa: String(table.numero),
      quantidadePessoas: String(Math.min(table.capacidade, 2)),
      dataHora: minimumDate.toISOString().slice(0, 16)
    });
    setToast(null);
  }

  function openEditModal(reservation: Reservation) {
    setModalState({ mode: "edit", reservation });
    setModalForm({
      clienteNome: reservation.clienteNome,
      contato: reservation.contato,
      numeroMesa: String(reservation.numeroMesa),
      quantidadePessoas: String(reservation.quantidadePessoas),
      dataHora: toInputDate(reservation.dataHora),
      duracaoMin: String(reservation.duracaoMin),
      observacoes: reservation.observacoes
    });
    setToast(null);
  }

  function closeModal() {
    setModalState(null);
    setModalForm(emptyForm);
    setToast((current) => (current?.placement === "modal" ? null : current));
  }

  async function handleModalSubmit(event: FormEvent) {
    event.preventDefault();

    if (!modalState) {
      return;
    }

    const validationError = validateReservationForm(modalForm, currentModalCapacity);

    if (validationError) {
      showToast("error", validationError, "modal");
      return;
    }

    setIsLoading(true);

    try {
      const result = await saveReservation(
        modalForm,
        modalState.mode === "edit" ? modalState.reservation.id : undefined
      );
      showToast("success", result.message, "modal");
      await loadData();
      window.setTimeout(() => closeModal(), 900);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar reserva.";
      showToast("error", errorMessage, "modal");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setIsLoading(true);

    try {
      const result = await cancelReservation(id);
      showToast("success", result.message, "page");
      await loadData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao excluir reserva.";
      showToast("error", errorMessage, "page");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      {toast && toast.placement === "page" ? (
        <ToastBanner toast={toast} />
      ) : null}

      <section className="hero">
        <div className="hero-copy-block">
          <p className="eyebrow">Ristorante italiano</p>
          <h1>Lhama Mia</h1>
          <p className="hero-copy">Um mapa elegante do salao para receber reservas com clareza, sem ruido operacional na interface.</p>
        </div>
        <div className="hero-brand">
          <div className="brand-mark">
            <span className="arch" />
            <span className="arch arch-inner" />
            <span className="brand-stars">***</span>
          </div>
          <div className="hero-stripes">
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      <section className="metrics-grid">
        <Metric icon={<ClipboardList />} label="Reservas" value={metrics.total} />
        <Metric icon={<Utensils />} label="Mesas" value={tables.length} />
        <Metric icon={<UsersRound />} label="Pessoas previstas" value={metrics.people} />
        <Metric icon={<Check />} label="Mesas livres" value={metrics.freeTables} />
      </section>

      <section className="panel map-section">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Pianta della sala</p>
            <h2>Mapa interativo do restaurante</h2>
          </div>
          <div className="legend">
            <span className="dot free" /> Livre
            <span className="dot reserved" /> Reservada
            <span className="dot busy" /> Ocupada
          </div>
        </div>

        <div className="restaurant-map">
          <div className="map-stage">
            <div className="map-bar map-bar-top" />
            <div className="map-bar map-bar-left" />
            <div className="map-bar map-bar-right" />

            {tables.map((table) => {
              const reservedSeats = table.reservaAtual?.quantidadePessoas ?? 0;

              return (
                <button
                  key={table.id}
                  className={`table-node ${table.status}`}
                  type="button"
                  onClick={() => openCreateModal(table)}
                >
                  <span className="chair chair-top-left" />
                  <span className="chair chair-top-right" />
                  <span className="chair chair-bottom-left" />
                  <span className="chair chair-bottom-right" />
                  <div className="table-surface">
                    <strong>{table.numero}</strong>
                    <small>{table.localizacao}</small>
                  </div>
                  <div className="table-people" aria-label={`${reservedSeats} pessoas na mesa ${table.numero}`}>
                    {getSeatStates(table.capacidade, reservedSeats).map((isReserved, index) => (
                      <span
                        key={`${table.id}-person-${index}`}
                        className={`seat-icon ${isReserved ? `filled ${table.status}` : ""}`}
                      >
                        <UserRound size={12} />
                      </span>
                    ))}
                    {table.capacidade > 6 ? <span className="seat-more">+{table.capacidade - 6}</span> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="panel reservations-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Operacao</p>
            <h2>Reservas</h2>
          </div>
        </div>

        <div className="filters">
          <div className="filter-control">
            <Search size={16} />
            <input
              placeholder="Cliente"
              value={filters.cliente}
              onChange={(event) => setFilters({ ...filters, cliente: event.target.value })}
            />
            {filters.cliente ? (
              <button className="clear-input" type="button" onClick={() => setFilters({ ...filters, cliente: "" })} aria-label="Limpar busca por cliente">
                <X size={14} />
              </button>
            ) : null}
          </div>
          <input
            placeholder="Mesa"
            type="number"
            min="1"
            max={Math.max(1, maxTableNumber)}
            value={filters.mesa}
            onChange={(event) => {
              const nextValue = event.target.value;

              if (nextValue === "") {
                setFilters({ ...filters, mesa: "" });
                return;
              }

              const numericValue = Number(nextValue);

              if (Number.isNaN(numericValue)) {
                return;
              }

              const clampedValue = Math.min(Math.max(numericValue, 1), Math.max(1, maxTableNumber));
              setFilters({ ...filters, mesa: String(clampedValue) });
            }}
          />
          <input type="date" value={filters.data} onChange={(event) => setFilters({ ...filters, data: event.target.value })} />
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">Todos</option>
            {(["reservado", "ocupado", "finalizado", "cancelado"] as ReservationStatus[]).map((status) => (
              <option key={status} value={status}>{statusLabel[status]}</option>
            ))}
          </select>
        </div>

        <div className="reservation-list">
          {reservations.map((reservation) => (
            <article className="reservation-card" key={reservation.id}>
              <div>
                <span className={`badge ${reservation.status}`}>{statusLabel[reservation.status]}</span>
                <h3>{reservation.clienteNome}</h3>
                <p>Mesa {reservation.numeroMesa} - {reservation.quantidadePessoas} pessoas - {formatDate(reservation.dataHora)}</p>
                <small>{reservation.contato}{reservation.observacoes ? ` - ${reservation.observacoes}` : ""}</small>
              </div>
              <div className="card-actions">
                <button className="icon-button" type="button" title="Editar reserva" onClick={() => openEditModal(reservation)}>
                  <Pencil size={17} />
                </button>
                <button className="icon-button danger" type="button" title={reservation.status === "cancelado" ? "Apagar reserva" : "Cancelar reserva"} onClick={() => handleDelete(reservation.id)}>
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
          {!reservations.length ? <p className="empty-state">Nenhuma reserva encontrada para os filtros atuais.</p> : null}
        </div>
      </section>

      {modalState ? (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="reservation-modal-title" onClick={(event) => event.stopPropagation()}>
            {toast && toast.placement === "modal" ? <ToastBanner toast={toast} compact /> : null}

            <div className="panel-header modal-header">
              <div>
                <p className="eyebrow">{modalState.mode === "create" ? "Nova reserva" : "Editar reserva"}</p>
                <h2 id="reservation-modal-title">
                  {modalState.mode === "create" ? `Mesa ${modalState.table.numero}` : modalState.reservation.clienteNome}
                </h2>
              </div>
              <button className="icon-button" type="button" onClick={closeModal} title="Fechar modal">
                <X size={17} />
              </button>
            </div>

            <form className="form-panel" onSubmit={handleModalSubmit}>
              <div className="form-grid">
                <label>
                  Cliente
                  <input value={modalForm.clienteNome} onChange={(event) => updateModalForm({ clienteNome: event.target.value })} required />
                </label>
                <label>
                  Contato
                  <input
                    inputMode="numeric"
                    maxLength={12}
                    placeholder="11 2345-6789"
                    value={modalForm.contato}
                    onChange={(event) => updateModalForm({ contato: formatPhone(event.target.value) })}
                    required
                  />
                </label>
                <label>
                  Mesa
                  <select value={modalForm.numeroMesa} onChange={(event) => updateModalForm({ numeroMesa: event.target.value })}>
                    {tables.map((table) => (
                      <option key={table.id} value={table.numero}>
                        Mesa {table.numero} - {table.capacidade} lugares
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Pessoas
                  <input
                    min="1"
                    max={currentModalCapacity}
                    type="number"
                    value={modalForm.quantidadePessoas}
                    onChange={(event) => updateModalForm({ quantidadePessoas: event.target.value })}
                    required
                  />
                </label>
                <label>
                  Data e hora
                  <input type="datetime-local" value={modalForm.dataHora} onChange={(event) => updateModalForm({ dataHora: event.target.value })} required />
                </label>
                <label>
                  Duracao
                  <select value={modalForm.duracaoMin} onChange={(event) => updateModalForm({ duracaoMin: event.target.value })}>
                    <option value="60">1h</option>
                    <option value="90">1h30</option>
                    <option value="120">2h</option>
                  </select>
                </label>
              </div>

              <label>
                Observacoes
                <textarea value={modalForm.observacoes} onChange={(event) => updateModalForm({ observacoes: event.target.value })} rows={4} />
              </label>

              <div className="modal-actions">
                <button className="ghost-button" type="button" onClick={closeModal}>Fechar</button>
                <button className="primary-button" disabled={isLoading} type="submit">
                  <Check size={18} />
                  {modalState.mode === "create" ? "Criar reserva" : "Salvar alteracoes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function ToastBanner({ compact = false, toast }: { compact?: boolean; toast: Exclude<ToastState, null> }) {
  return (
    <div className={`toast ${toast.type} ${compact ? "compact" : ""}`} role="status" aria-live="polite">
      <Bell size={16} />
      <span>{toast.text}</span>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <article className="metric-card">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
