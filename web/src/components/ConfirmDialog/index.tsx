import { createContext, useContext, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ConfirmDialogContextValue = {
  title: string;
  description: string;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

function useConfirmDialog() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) throw new Error("ConfirmDialog compound parts must be used within ConfirmDialog");
  return ctx;
}

function ConfirmDialogRoot({
  title,
  description,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <ConfirmDialogContext.Provider value={{ title, description }}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
}

function Trigger({ children }: { children: ReactNode }) {
  useConfirmDialog();
  return <DialogTrigger asChild>{children}</DialogTrigger>;
}

function Content({ children }: { children?: ReactNode }) {
  const { title, description } = useConfirmDialog();
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      {children}
    </DialogContent>
  );
}

function Footer({
  onConfirm,
  confirming,
  confirmLabel = "Confirmar",
}: {
  onConfirm: () => void;
  confirming?: boolean;
  confirmLabel?: string;
}) {
  useConfirmDialog();
  return (
    <DialogFooter>
      <Button type="button" variant="destructive" onClick={onConfirm} disabled={confirming}>
        {confirming ? "Removendo..." : confirmLabel}
      </Button>
    </DialogFooter>
  );
}

export const ConfirmDialog = Object.assign(ConfirmDialogRoot, {
  Trigger,
  Content,
  Footer,
});
