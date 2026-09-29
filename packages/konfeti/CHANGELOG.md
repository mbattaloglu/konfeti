# konfeti

## 0.2.0

### Minor Changes

- Worker rendering: `KonfetiFactory.createWorker()` runs simulation and drawing in a Web Worker through an
  `OffscreenCanvas`, with typed worker-safe options (`WorkerFireOptions`), a lazily loaded inlined worker script,
  a self-hostable `konfeti/worker.js` for strict CSP, and an automatic main-thread fallback.
