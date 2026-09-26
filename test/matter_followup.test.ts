import assert from "node:assert/strict";
import { followUpDecision, intakeSchema } from "../src/legal_service.js";

const matter = intakeSchema.parse({ matterId: "m-1", clientName: "Northwind", summary: "Prepare a signed filing package for review.", deadline: "2030-01-04" });
assert.equal(matter.matterId, "m-1");
assert.equal(followUpDecision(matter.deadline, new Date("2030-01-01T12:00:00Z")), "follow-up");
assert.equal(followUpDecision(matter.deadline, new Date("2029-12-20T12:00:00Z")), "monitor");
console.log("matter follow-up decision: ok");
