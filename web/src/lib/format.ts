import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDateTime(iso: string) {
  return format(parseISO(iso), "dd MMM yyyy, HH:mm", { locale: ptBR });
}

export function toDateTimeLocal(iso: string) {
  const date = parseISO(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDateTimeLocal(value: string) {
  return new Date(value).toISOString();
}

export function occupancyLabel(registered: number, capacity: number) {
  return `${registered}/${capacity} vagas`;
}

export function excerpt(text: string | null | undefined, max = 140) {
  if (!text) return "";
  const normalized = text.trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max).trimEnd()}…`;
}
