import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { FullResult, Reporter, TestCase, TestResult } from "@playwright/test/reporter";

type Row = {
  title: string;
  status: TestResult["status"];
  durationMs: number;
  error?: string;
};

const statusLabel: Record<string, string> = {
  passed: "PASSOU",
  failed: "FALHOU",
  timedOut: "TIMEOUT",
  skipped: "PULADO",
  interrupted: "INTERROMPIDO",
};

export default class FinalReport implements Reporter {
  private rows: Row[] = [];
  private startedAt = new Date();

  onTestEnd(test: TestCase, result: TestResult) {
    this.rows.push({
      title: test.titlePath().filter(Boolean).join(" > "),
      status: result.status,
      durationMs: result.duration,
      error: result.error?.message?.split("\n")[0],
    });
  }

  onEnd(result: FullResult) {
    const finishedAt = new Date();
    const passed = this.rows.filter((row) => row.status === "passed").length;
    const failed = this.rows.filter((row) => row.status !== "passed").length;
    const overall =
      result.status === "passed" && failed === 0 ? "SUCESSO" : result.status === "interrupted" ? "INTERROMPIDO" : "FALHA";

    const lines = [
      "# Relatório E2E — VB Eventos",
      "",
      `- **Status geral:** ${overall}`,
      `- **Início:** ${this.startedAt.toLocaleString("pt-BR")}`,
      `- **Fim:** ${finishedAt.toLocaleString("pt-BR")}`,
      `- **Duração da suíte:** ${((finishedAt.getTime() - this.startedAt.getTime()) / 1000).toFixed(1)}s`,
      `- **Testes:** ${this.rows.length} (${passed} passaram, ${failed} falharam)`,
      "",
      "## Casos",
      "",
      "| Caso | Status | Duração | Observação |",
      "| --- | --- | --- | --- |",
      ...this.rows.map((row) => {
        const note = row.error ? row.error.replace(/\|/g, "/") : "—";
        return `| ${row.title} | ${statusLabel[row.status] ?? row.status} | ${(row.durationMs / 1000).toFixed(1)}s | ${note} |`;
      }),
      "",
      "## O que o fluxo cobriu",
      "",
      "- Alternância Cards ↔ Lista sem precisar clicar duas vezes",
      "- Cadastro de 5 eventos pelo formulário",
      "- Inscrição de participantes aleatórios até lotar 3 eventos",
      "- Validação do status Lotado na listagem e no detalhe",
      "- Validação da lista de inscritos",
      "- Tentativa de inscrição extra em evento lotado",
      "",
      "Artefatos do Playwright: `web/playwright-report/` (HTML, JSON, vídeos e traces).",
      "",
    ];

    const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
    const markdownPath = resolve(repoRoot, "RELATORIO-E2E.md");
    mkdirSync(dirname(markdownPath), { recursive: true });
    writeFileSync(markdownPath, lines.join("\n"), "utf8");

    const jsonPath = resolve(repoRoot, "web/playwright-report/final-status.json");
    mkdirSync(dirname(jsonPath), { recursive: true });
    writeFileSync(
      jsonPath,
      JSON.stringify(
        {
          overall,
          startedAt: this.startedAt.toISOString(),
          finishedAt: finishedAt.toISOString(),
          passed,
          failed,
          tests: this.rows,
        },
        null,
        2,
      ),
      "utf8",
    );
  }
}
