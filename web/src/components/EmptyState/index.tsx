import { createContext, useContext, type ReactNode } from "react";

const EmptyStateContext = createContext(true);

function EmptyStateRoot({ children }: { children: ReactNode }) {
  return (
    <EmptyStateContext.Provider value={true}>
      <div className="rounded-xl border border-dashed bg-card px-6 py-12 text-center">{children}</div>
    </EmptyStateContext.Provider>
  );
}

function useEmpty() {
  const ctx = useContext(EmptyStateContext);
  if (!ctx) throw new Error("EmptyState compound parts must be used within EmptyState");
}

function Title({ children }: { children: ReactNode }) {
  useEmpty();
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

function Description({ children }: { children: ReactNode }) {
  useEmpty();
  return <p className="mt-2 text-sm text-muted-foreground">{children}</p>;
}

function Action({ children }: { children: ReactNode }) {
  useEmpty();
  return <div className="mt-4">{children}</div>;
}

export const EmptyState = Object.assign(EmptyStateRoot, {
  Title,
  Description,
  Action,
});
