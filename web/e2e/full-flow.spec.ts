import { expect, test, type Page } from "@playwright/test";

const runId = Date.now().toString(36);
const firstNames = ["Marina", "Rafael", "Beatriz", "Caio", "Helena", "Otávio", "Lívia", "Theo"];
const lastNames = ["Costa", "Nogueira", "Pires", "Andrade", "Farias", "Melo", "Ribeiro", "Lopes"];

type PlannedEvent = {
  name: string;
  description: string;
  location: string;
  capacity: number;
  fill: boolean;
};

const plannedEvents: PlannedEvent[] = [
  { name: `E2E ${runId} Degustação`, description: "Degustação da nova linha.", location: "São Paulo, SP", capacity: 2, fill: true },
  { name: `E2E ${runId} Workshop`, description: "Workshop de qualidade.", location: "Campinas, SP", capacity: 2, fill: true },
  { name: `E2E ${runId} Feira`, description: "Feira de fornecedores.", location: "Recife, PE", capacity: 2, fill: true },
  { name: `E2E ${runId} Meetup`, description: "Meetup aberto da comunidade.", location: "Curitiba, PR", capacity: 5, fill: false },
  { name: `E2E ${runId} Tour`, description: "Tour pela fábrica.", location: "Uberlândia, MG", capacity: 5, fill: false },
];

function futureDateTimeLocal(daysAhead: number) {
  const date = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function randomParticipant(index: number) {
  const name = `${firstNames[index % firstNames.length]} ${lastNames[index % lastNames.length]} ${runId}${index}`;
  const email = `e2e.${runId}.${index}@example.com`;
  const phone = index % 2 === 0 ? `1199${String(1000000 + index).slice(-7)}` : "";
  return { name, email, phone };
}

function eventCard(page: Page, name: string) {
  return page.locator('[data-testid="event-card"]', { hasText: name });
}

async function createEvent(page: Page, event: PlannedEvent, dayOffset: number) {
  await page.getByTestId("new-event").click();
  await expect(page.getByTestId("event-form")).toBeVisible();
  await page.locator("#name").fill(event.name);
  await page.locator("#description").fill(event.description);
  await page.locator("#startsAt").fill(futureDateTimeLocal(dayOffset));
  await page.locator("#capacity").fill(String(event.capacity));
  await page.locator("#location").fill(event.location);
  await page.getByTestId("save-event").click();
  await expect(page.getByRole("heading", { name: event.name, level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Voltar" }).click();
  await expect(eventCard(page, event.name)).toBeVisible();
}

async function registerOnCard(page: Page, eventName: string, participant: ReturnType<typeof randomParticipant>) {
  const card = eventCard(page, eventName);
  await card.getByTestId("register-button").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator("#participant-name").fill(participant.name);
  await dialog.locator("#participant-email").fill(participant.email);
  if (participant.phone) {
    await dialog.locator("#participant-phone").fill(participant.phone);
  }
  await dialog.getByTestId("save-participant").click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Participante inscrito").first()).toBeVisible();
}

test.describe.configure({ mode: "serial" });

test.describe("Fluxo completo de gestão de eventos", () => {
  test("alterna Cards e Lista em um clique", async ({ page }) => {
    await page.goto("/events");
    await expect(page.getByTestId("events-grid")).toBeVisible();

    await page.getByTestId("view-list").click();
    await expect(page.getByTestId("events-rows")).toBeVisible();
    await expect(page).toHaveURL(/view=list/);
    await expect(page.getByTestId("view-list")).toHaveAttribute("aria-pressed", "true");

    await page.getByTestId("view-cards").click();
    await expect(page.getByTestId("events-grid")).toBeVisible();
    await expect(page.getByTestId("events-rows")).toHaveCount(0);
    await expect(page).not.toHaveURL(/view=list/);
    await expect(page.getByTestId("view-cards")).toHaveAttribute("aria-pressed", "true");
  });

  test("cadastra 5 eventos, lota 3 e valida inscritos e status", async ({ page }) => {
    const registered = new Map<string, ReturnType<typeof randomParticipant>[]>();
    let participantIndex = 0;

    await page.goto("/events");
    await expect(page.getByTestId("new-event")).toBeVisible();

    for (const [index, event] of plannedEvents.entries()) {
      await test.step(`criar ${event.name}`, async () => {
        await createEvent(page, event, index + 3);
      });
    }

    for (const event of plannedEvents.filter((item) => item.fill)) {
      const people: ReturnType<typeof randomParticipant>[] = [];
      await test.step(`lotar ${event.name}`, async () => {
        for (let seat = 0; seat < event.capacity; seat += 1) {
          const person = randomParticipant(participantIndex);
          participantIndex += 1;
          await registerOnCard(page, event.name, person);
          people.push(person);
        }
        registered.set(event.name, people);
        await expect(eventCard(page, event.name).getByTestId("status-badge")).toHaveAttribute("data-status", "full");
        await expect(eventCard(page, event.name).getByTestId("status-badge")).toHaveText("Lotado");
        await expect(eventCard(page, event.name).getByTestId("register-button")).toBeDisabled();
      });
    }

    for (const event of plannedEvents.filter((item) => item.fill)) {
      await test.step(`validar inscritos de ${event.name}`, async () => {
        await eventCard(page, event.name).getByRole("link", { name: event.name }).click();
        await expect(page.getByRole("heading", { name: event.name, level: 1 })).toBeVisible();
        await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "full");

        for (const person of registered.get(event.name) ?? []) {
          await expect(page.getByText(person.name)).toBeVisible();
          await expect(page.getByText(person.email)).toBeVisible();
        }

        await expect(page.getByTestId("save-participant")).toBeDisabled();
        await page.getByRole("link", { name: "Voltar" }).click();
        await expect(eventCard(page, event.name)).toBeVisible();
      });
    }

    await test.step("recusar inscrição extra em evento lotado", async () => {
      const fullEvent = plannedEvents.find((item) => item.fill)!;
      await expect(eventCard(page, fullEvent.name).getByTestId("register-button")).toBeDisabled();
    });

    await test.step("eventos não lotados continuam abertos", async () => {
      for (const event of plannedEvents.filter((item) => !item.fill)) {
        await expect(eventCard(page, event.name).getByTestId("status-badge")).toHaveAttribute("data-status", "upcoming");
        await expect(eventCard(page, event.name).getByTestId("register-button")).toBeEnabled();
      }
    });

    await test.step("resumo da listagem reflete lotados", async () => {
      const summary = page.getByTestId("results-summary");
      await expect(summary).toContainText("lotados");
      const text = (await summary.textContent()) ?? "";
      const fullCount = Number(/(\d+)\s+lotados/.exec(text)?.[1] ?? 0);
      expect(fullCount).toBeGreaterThanOrEqual(3);
    });
  });
});
