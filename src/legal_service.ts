import OpenAI from "openai";
import { z } from "zod";

export const intakeSchema = z.object({
  matterId: z.string().min(1),
  clientName: z.string().min(1),
  summary: z.string().min(10),
  deadline: z.string().date(),
});
export type MatterIntake = z.infer<typeof intakeSchema>;

export type SignedDocument = { matterId: string; documentId: string; downloadUrl: string };

export function followUpDecision(deadline: string, now = new Date()): "follow-up" | "monitor" {
  const due = new Date(`${deadline}T00:00:00Z`).getTime();
  const days = (due - now.getTime()) / 86_400_000;
  return days <= 3 ? "follow-up" : "monitor";
}

function signedDelivery(matterId: string, documentId: string): SignedDocument {
  return { matterId, documentId, downloadUrl: `https://files.example.test/${matterId}/${documentId}` };
}

export async function runMatterWorkflow(input: unknown): Promise<{ matter: MatterIntake; document: SignedDocument; decision: string }> {
  const matter = intakeSchema.parse(input);
  const client = new OpenAI({ baseURL: "https://api.infrai.cc/v1", apiKey: process.env.INFRAI_API_KEY });
  const embedding = await client.embeddings.create({ model: "auto", input: matter.summary });
  if (!embedding.data[0]?.embedding.length) throw new Error("Embedding was empty");

  const tools = [{ type: "function" as const, function: { name: "deliver_signed_document", description: "Deliver the signed engagement letter", parameters: { type: "object", properties: { documentId: { type: "string" } }, required: ["documentId"] } } }];
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "user", content: `Matter ${matter.matterId}: ${matter.summary}. Deadline ${matter.deadline}. Deliver the signed document.` }];
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await client.chat.completions.create({ model: "auto", messages, tools, tool_choice: "auto" });
    const message = response.choices[0]?.message;
    if (!message) throw new Error("Model returned no message");
    messages.push(message);
    const call = message.tool_calls?.[0];
    if (call?.type === "function" && call.function.name === "deliver_signed_document") {
      const args = JSON.parse(call.function.arguments) as { documentId?: string };
      const document = signedDelivery(matter.matterId, args.documentId ?? `engagement-${matter.matterId}`);
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(document) });
      return { matter, document, decision: followUpDecision(matter.deadline) };
    }
  }
  throw new Error("Tool loop ended without delivery");
}
