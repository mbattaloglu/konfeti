// konfeti/lite — everything except auto-registered built-in shapes and presets.
// Only paper is available until you call registerShapes(starShape, …), so bundlers can drop unused shapes.
export { Konfeti } from "./api/Konfeti";
export { KonfetiFactory } from "./api/KonfetiFactory";
export { registerShapes } from "./api/registerShapes";
export { definePhysics } from "./api/definePhysics";
export { defineShape } from "./api/defineShape";
export { disableBanner } from "./api/disableBanner";
export { loadImage } from "./api/loadImage";
export { KonfetiPalettes } from "./palettes/KonfetiPalettes";
export type { KonfetiPaletteName } from "./palettes/KonfetiPalettes";
export { KonfetiInstance } from "./core/KonfetiInstance";
export { emojiShape } from "./shapes/handlers/emojiShape";
export { heartShape } from "./shapes/handlers/heartShape";
export { imageShape } from "./shapes/handlers/imageShape";
export { paperShape } from "./shapes/handlers/paperShape";
export { pathShape } from "./shapes/handlers/pathShape";
export { polygonShape } from "./shapes/handlers/polygonShape";
export { ribbonShape } from "./shapes/handlers/ribbonShape";
export { spritesheetShape } from "./shapes/handlers/spritesheetShape";
export { starShape } from "./shapes/handlers/starShape";
export { textShape } from "./shapes/handlers/textShape";
export { triangleShape } from "./shapes/handlers/triangleShape";

export type { AttractFalloff, AttractOptions } from "./types/AttractOptions";
export type { BurstHooks } from "./types/BurstHooks";
export type { ClickOptions } from "./types/ClickOptions";
export type { ClientPoint } from "./types/ClientPoint";
export type {
  ColorInput,
  CssColorName,
  HexColor,
  HslColor,
  ModernCssColor,
  RgbColor,
} from "./types/ColorInput";
export type { ColorMode } from "./types/ColorMode";
export type { ColorOverLifeOptions } from "./types/ColorOverLifeOptions";
export type { ColorSource } from "./types/ColorSource";
export type { CornerRadii, CornerRadius } from "./types/CornerRadius";
export type { CreateOptions } from "./types/CreateOptions";
export type { EmitOptions } from "./types/EmitOptions";
export type { EmitterTarget } from "./types/EmitterTarget";
export type { Easing, EasingFunction, EasingName } from "./types/Easing";
export type { EmissionOptions } from "./types/EmissionOptions";
export type { FadeOutOptions } from "./types/FadeOutOptions";
export type { FireInput } from "./types/FireInput";
export type { FireOptions } from "./types/FireOptions";
export type { FlipAxis } from "./types/FlipAxis";
export type { FlipOptions } from "./types/FlipOptions";
export type { FloorOptions } from "./types/FloorOptions";
export type { FrameRect } from "./types/FrameRect";
export type { FrameScheduler } from "./types/FrameScheduler";
export type { GradientOptions } from "./types/GradientOptions";
export type { ImageInput } from "./types/ImageInput";
export type { KonfetiEmitter } from "./types/KonfetiEmitter";
export type { KonfetiHandle } from "./types/KonfetiHandle";
export type { MutableParticle } from "./types/MutableParticle";
export type { OneOrMany } from "./types/OneOrMany";
export type { Origin } from "./types/Origin";
export type { OriginPoint } from "./types/OriginPoint";
export type { PaperForm } from "./types/PaperForm";
export type { PaperGeometry } from "./types/PaperGeometry";
export type { PaperStyle } from "./types/PaperStyle";
export type { ParticleState } from "./types/ParticleState";
export type { PhysicsDefinition } from "./types/PhysicsDefinition";
export type {
  BuiltinPhysicsOptions,
  CustomPhysicsOptions,
  PhysicsOptions,
} from "./types/PhysicsOptions";
export type { PhysicsRegistry } from "./types/PhysicsRegistry";
export type { PhysicsWorldState } from "./types/PhysicsWorldState";
export type { Range, RangeObject, RangeTuple } from "./types/Range";
export type { ScaleOverLifeOptions } from "./types/ScaleOverLifeOptions";
export type { ShadowOptions } from "./types/ShadowOptions";
export type { ShapeStyle } from "./types/ShapeStyle";
export type { SharedKonfeti } from "./types/SharedKonfeti";
export type { EmojiShapeOptions } from "./types/shapes/EmojiShapeOptions";
export type { HeartShapeOptions } from "./types/shapes/HeartShapeOptions";
export type { ImageShapeOptions } from "./types/shapes/ImageShapeOptions";
export type { PaperShapeOptions } from "./types/shapes/PaperShapeOptions";
export type { PathShapeOptions } from "./types/shapes/PathShapeOptions";
export type { PolygonShapeOptions } from "./types/shapes/PolygonShapeOptions";
export type { RibbonShapeOptions } from "./types/shapes/RibbonShapeOptions";
export type { ShapeEntryBase } from "./types/shapes/ShapeEntryBase";
export type { CustomShapeOptions } from "./types/shapes/CustomShapeOptions";
export type { CustomShapeParticle } from "./types/shapes/CustomShapeParticle";
export type {
  DrawShapeDefinition,
  PathShapeDefinition,
  ShapeDefinition,
} from "./types/shapes/ShapeDefinition";
export type {
  BuiltinShapeOptions,
  BuiltinShapeType,
  ShapeOptions,
  ShapeType,
} from "./types/shapes/ShapeOptions";
export type { ShapeRegistry } from "./types/shapes/ShapeRegistry";
export type {
  AnyShapeHandler,
  ShapeHandler,
  ShapeHandlerContext,
} from "./types/shapes/ShapeHandler";
export type { SpriteSheetShapeOptions } from "./types/shapes/SpriteSheetShapeOptions";
export type { StarShapeOptions } from "./types/shapes/StarShapeOptions";
export type { TextShapeOptions } from "./types/shapes/TextShapeOptions";
export type { TriangleShapeOptions } from "./types/shapes/TriangleShapeOptions";
export type { SpriteFrames } from "./types/SpriteFrames";
export type { StrokeOptions } from "./types/StrokeOptions";
export type { SwirlOptions } from "./types/SwirlOptions";
export type {
  Degrees,
  DegreesPerSecond,
  Hertz,
  Milliseconds,
  Multiplier,
  PerSecond,
  Pixels,
  PixelsPerSecond,
  PixelsPerSecondSquared,
  Ratio,
} from "./types/Units";
export type { Weighted } from "./types/Weighted";
export type { WeightedColor } from "./types/WeightedColor";
export type { WobbleOptions } from "./types/WobbleOptions";
export { VERSION } from "./Version";
