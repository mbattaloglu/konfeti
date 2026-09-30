---
"konfeti": patch
---

Types for `konfeti/lite` and `konfeti/worker` now resolve in projects using the older
`moduleResolution: "node"` (common with webpack + ts-loader), which ignores `exports`: the package adds a
`typesVersions` map.
