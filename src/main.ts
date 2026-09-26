import { runMatterWorkflow } from "./legal_service.js";

const result = await runMatterWorkflow({
  matterId: "matter-1042",
  clientName: "Aster Holdings",
  summary: "Review and sign the acquisition engagement letter before the filing window closes.",
  deadline: "2030-06-15",
});
console.log(JSON.stringify(result, null, 2));
