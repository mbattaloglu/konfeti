---
"konfeti": minor
---

`framesFromAtlas(atlas, prefix?)` turns the atlas JSON of a packed sprite sheet (TexturePacker, Aseprite, Free
Texture Packer, Phaser; "JSON Hash" or "JSON Array") into the `frames` of a `spritesheet` shape, in atlas order. A name
prefix picks one animation out of an atlas that holds several; a rotated frame or a malformed atlas throws a readable
error. New types: `SpriteAtlas`, `SpriteAtlasFrame`.
