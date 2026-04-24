import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const now = new Date().toISOString();
const reportDir = join(process.cwd(), "reports");
const reportPath = join(reportDir, "agent-scorecard.json");

const scorecard = {
  generatedAt: now,
  period: "weekly",
  owner: "engineering",
  kpis: {
    leadTimeHours: null,
    reworkRatePercent: null,
    regressionBugsCount: null,
    ciFirstPassRatePercent: null,
    testCoveragePercent: null,
    securityHighOrCriticalOpen: null,
  },
  actions: [
    {
      id: "action-1",
      description: "",
      owner: "",
      dueDate: "",
      status: "planned",
    },
  ],
  notes: "",
};

async function main() {
  await mkdir(reportDir, { recursive: true });
  await writeFile(reportPath, JSON.stringify(scorecard, null, 2), "utf8");
  console.log(`Agent scorecard template generated at: ${reportPath}`);
}

main().catch((error) => {
  console.error("Failed to generate scorecard:", error);
  process.exit(1);
});
