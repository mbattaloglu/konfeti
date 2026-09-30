---
"konfeti": minor
---

Attractor / repulsor physics: `physics.attract` pulls particles toward the pointer, an element or a point
(`{ target, strength, radius, falloff }`); a negative `strength` pushes them away. The target is located once per
frame, and pointer tracking stops when the burst ends.
