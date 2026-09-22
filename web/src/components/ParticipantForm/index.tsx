import { createContext, useContext, type FormEvent, type ReactNode } from "react";
import { UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FieldErrors, ParticipantFormValues } from "@/lib/validation";

export type { ParticipantFormValues };

type ParticipantFormContextValue = {
  values: ParticipantFormValues;
  errors: FieldErrors;
  onChange: (values: ParticipantFormValues) => void;
  submitting: boolean;
  disabled: boolean;
  layout: "panel" | "plain";
};

const ParticipantFormContext = createContext<ParticipantFormContextValue | null>(null);

function useParticipantForm() {
  const ctx = useContext(ParticipantFormContext);
  if (!ctx) throw new Error("ParticipantForm compound parts must be used within ParticipantForm");
  return ctx;
}

function ParticipantFormRoot({
  values,
  errors = {},
  onChange,
  onSubmit,
  submitting,
  disabled,
  layout = "panel",
  children,
}: {
  values: ParticipantFormValues;
  errors?: FieldErrors;
  onChange: (values: ParticipantFormValues) => void;
  onSubmit: () => void;
  submitting: boolean;
  disabled?: boolean;
  layout?: "panel" | "plain";
  children: ReactNode;
}) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <ParticipantFormContext.Provider
      value={{ values, errors, onChange, submitting, disabled: Boolean(disabled), layout }}
    >
      <form
        className={cn(
          layout === "panel" ? "overflow-hidden rounded-2xl border bg-card shadow-sm" : "space-y-4",
        )}
        onSubmit={handleSubmit}
        noValidate
        data-testid="participant-form"
      >
        {children}
      </form>
    </ParticipantFormContext.Provider>
  );
}

function Header({ title = "Nova inscrição", description }: { title?: string; description?: string }) {
  const { disabled, layout } = useParticipantForm();
  return (
    <div className={cn(layout === "panel" ? "border-b bg-muted/40 px-6 py-5" : "space-y-1")}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserPlus className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold leading-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {description ??
              (disabled
                ? "Este evento não aceita novas inscrições."
                : "Nome e e-mail são obrigatórios. Telefone é opcional.")}
          </p>
        </div>
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

function Fields() {
  const { values, errors, onChange, disabled, layout } = useParticipantForm();
  return (
    <div className={cn("grid gap-4", layout === "panel" ? "px-6 py-5 md:grid-cols-3" : "grid-cols-1")}>
      <div className="space-y-1.5">
        <Label htmlFor="participant-name">Nome</Label>
        <Input
          id="participant-name"
          autoComplete="name"
          disabled={disabled}
          value={values.name}
          aria-invalid={Boolean(errors.name)}
          onChange={(event) => onChange({ ...values, name: event.target.value })}
        />
        <FieldError message={errors.name} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="participant-email">E-mail</Label>
        <Input
          id="participant-email"
          type="email"
          autoComplete="email"
          disabled={disabled}
          value={values.email}
          aria-invalid={Boolean(errors.email)}
          onChange={(event) => onChange({ ...values, email: event.target.value })}
        />
        <FieldError message={errors.email} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="participant-phone">
          Telefone <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id="participant-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 98888-7777"
          disabled={disabled}
          value={values.phone}
          aria-invalid={Boolean(errors.phone)}
          onChange={(event) => onChange({ ...values, phone: event.target.value })}
        />
        <FieldError message={errors.phone} />
      </div>
    </div>
  );
}

function Actions({ children }: { children?: ReactNode }) {
  const { submitting, disabled, layout } = useParticipantForm();
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-2",
        layout === "panel" ? "border-t bg-muted/20 px-6 py-4" : "",
      )}
    >
      {children ?? (
        <Button type="submit" disabled={submitting || disabled} data-testid="save-participant">
          {disabled ? "Evento lotado" : submitting ? "Inscrevendo..." : "Inscrever participante"}
        </Button>
      )}
    </div>
  );
}

export const ParticipantForm = Object.assign(ParticipantFormRoot, {
  Header,
  Fields,
  Actions,
});
