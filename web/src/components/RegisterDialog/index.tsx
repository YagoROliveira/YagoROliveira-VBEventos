import { createContext, useContext, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ParticipantForm, type ParticipantFormValues } from "@/components/ParticipantForm";
import { ApiError, api } from "@/lib/api";
import { validateParticipantForm, type FieldErrors } from "@/lib/validation";
import type { PublicEvent } from "@/lib/types";

const emptyValues: ParticipantFormValues = { name: "", email: "", phone: "" };

type RegisterDialogContextValue = {
  event: PublicEvent;
  disabled: boolean;
  setOpen: (open: boolean) => void;
};

const RegisterDialogContext = createContext<RegisterDialogContextValue | null>(null);

function useRegisterDialog() {
  const ctx = useContext(RegisterDialogContext);
  if (!ctx) throw new Error("RegisterDialog compound parts must be used within RegisterDialog");
  return ctx;
}

function RegisterDialogRoot({ event, children }: { event: PublicEvent; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <RegisterDialogContext.Provider value={{ event, disabled: event.status === "full", setOpen }}>
      <Dialog open={open} onOpenChange={setOpen}>
        {children}
      </Dialog>
    </RegisterDialogContext.Provider>
  );
}

function Trigger({ children }: { children: ReactNode }) {
  useRegisterDialog();
  return <DialogTrigger asChild>{children}</DialogTrigger>;
}

function Content() {
  const { event, disabled, setOpen } = useRegisterDialog();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<ParticipantFormValues>(emptyValues);
  const [errors, setErrors] = useState<FieldErrors>({});

  const mutation = useMutation({
    mutationFn: () =>
      api.registerParticipant(event.id, {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || null,
      }),
    onSuccess: async () => {
      toast.success("Participante inscrito");
      setValues(emptyValues);
      setErrors({});
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      await queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      await queryClient.invalidateQueries({ queryKey: ["participants", event.id] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.code === "DUPLICATE_PARTICIPANT") {
          setErrors({ email: "Este e-mail já está inscrito neste evento." });
        }
        toast.error(
          error.code === "EVENT_FULL"
            ? "Este evento está lotado."
            : error.code === "DUPLICATE_PARTICIPANT"
              ? "Este e-mail já está inscrito neste evento."
              : error.message,
        );
        return;
      }
      toast.error("Não foi possível inscrever o participante.");
    },
  });

  function submit() {
    const nextErrors = validateParticipantForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    mutation.mutate();
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Registrar em {event.name}</DialogTitle>
      </DialogHeader>
      <ParticipantForm
        layout="plain"
        values={values}
        errors={errors}
        onChange={(next) => {
          setValues(next);
          setErrors({});
        }}
        onSubmit={submit}
        submitting={mutation.isPending}
        disabled={disabled}
      >
        <ParticipantForm.Fields />
        <ParticipantForm.Actions />
      </ParticipantForm>
    </DialogContent>
  );
}

export const RegisterDialog = Object.assign(RegisterDialogRoot, {
  Trigger,
  Content,
});
