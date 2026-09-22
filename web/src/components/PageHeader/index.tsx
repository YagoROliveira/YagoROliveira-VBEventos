import { createContext, useContext, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderContextValue = {
  title?: string;
  description?: string;
};

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

function usePageHeader() {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) throw new Error("PageHeader compound parts must be used within PageHeader");
  return ctx;
}

function PageHeaderRoot({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <PageHeaderContext.Provider value={{ title, description }}>
      <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
        {children}
      </header>
    </PageHeaderContext.Provider>
  );
}

function Title({ children }: { children?: ReactNode }) {
  const { title } = usePageHeader();
  return <h1 className="text-2xl font-semibold tracking-tight">{children ?? title}</h1>;
}

function Description({ children }: { children?: ReactNode }) {
  const { description } = usePageHeader();
  const content = children ?? description;
  if (!content) return null;
  return <p className="text-sm text-muted-foreground">{content}</p>;
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

function Copy({ children }: { children?: ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

export const PageHeader = Object.assign(PageHeaderRoot, {
  Copy,
  Title,
  Description,
  Actions,
});
