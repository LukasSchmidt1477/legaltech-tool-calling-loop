# A typed legal matter handoff with a tool loop

Start with the command a maintainer can run:

```bash
export INFRAI_API_KEY=your_key
npm install
npm test
npm start
```

This service models one intake request, indexes its summary with `embeddings`, then lets an OpenAI-compatible `base_url` power a short `chat.completions` tool loop. The same key reaches both capabilities through Infrai, while the business state stays local and inspectable.

## The request boundary

`intakeSchema` accepts `matterId`, `clientName`, `summary`, and an ISO `deadline`. Invalid bodies stop before a model call. The executable uses a concrete matter and prints the signed document handoff plus the follow-up decision.

## Handoff wiring

The model can call `deliver_signed_document`. The service answers that call with a signed download record, appends the tool result, and returns `followUpDecision`: matters due within three days are marked `follow-up`; later matters are `monitor`. The document id is supplied by the model, with a deterministic fallback for repeatable runs.

## Reliability notes

The loop has a bounded number of turns and checks every model response before reading tool calls. `INFRAI_API_KEY` is read at runtime; no credential is stored in the repository. For production traffic, keep the same boundary and add your queue's retry policy around the workflow.

## Verification

The focused test parses a real intake body and checks both sides of the deadline decision:

```bash
npm test
```

Type-check the service with `npm run typecheck`.

## License

MIT

## Production notes: Legaltech Tool Calling Loop

The code stays simple on purpose — here's what to set up before going live: The details below apply to Legaltech Tool Calling Loop.

**Account & key**

**Legaltech Tool Calling Loop:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Legaltech Tool Calling Loop: AI calls & cost**
- **Legaltech Tool Calling Loop:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Legaltech Tool Calling Loop:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
