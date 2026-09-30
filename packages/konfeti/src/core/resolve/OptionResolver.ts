import { DEFAULT_CREATE_OPTIONS } from "../../config/CreateDefaults";
import { DEFAULT_FIRE_OPTIONS, DEFAULT_ORIGIN } from "../../config/FireDefaults";
import { DEFAULT_FORMATION_RELEASE_VELOCITY } from "../../config/FormationDefaults";
import type { BurstHooks } from "../../types/BurstHooks";
import type { ClientPoint } from "../../types/ClientPoint";
import type { CreateOptions } from "../../types/CreateOptions";
import type { EmissionOptions } from "../../types/EmissionOptions";
import type { FireOptions } from "../../types/FireOptions";
import type { Origin } from "../../types/Origin";
import type { ResolvedCreateOptions } from "../../types/resolved/ResolvedCreateOptions";
import type { ResolvedEmission } from "../../types/resolved/ResolvedEmission";
import type { ResolvedFireOptions } from "../../types/resolved/ResolvedFireOptions";
import type { PlacedOrigin } from "../../types/resolved/PlacedOrigin";
import { FormationSupport } from "../../registry/FormationSupport";
import { Random } from "../../utils/Random";
import { RangeUtils } from "../../utils/RangeUtils";
import { PhysicsResolver } from "./PhysicsResolver";
import { ResolveUtils } from "./ResolveUtils";
import type { ResolveContext } from "./ShapeResolver";
import { ShapeResolver } from "./ShapeResolver";

/**
 * Static Public-to-Resolved Option Converter.
 * Merges option layers (defaults → instance defaults → fire options), validates them and produces the
 * all-required internal form used by the engine.
 */
export class OptionResolver {
  /**
   * Hook Keys Merged across Layers.
   */
  private static readonly HOOK_KEYS = [
    "onStart",
    "onParticleSpawn",
    "onParticleUpdate",
    "onParticleDeath",
    "onComplete",
  ] as const satisfies readonly (keyof BurstHooks)[];

  /**
   * Default Resolution Context.
   */
  private static readonly DEFAULT_CONTEXT: ResolveContext = { pixelRatio: 1 };

  /**
   * Resolve Instance Options.
   *
   * @param options - Public Instance Options
   * @returns Resolved Instance Options
   */
  public static resolveCreate(options: CreateOptions = {}): ResolvedCreateOptions {
    const maxParticles = options.maxParticles ?? DEFAULT_CREATE_OPTIONS.maxParticles;
    const maxDevicePixelRatio =
      options.maxDevicePixelRatio ?? DEFAULT_CREATE_OPTIONS.maxDevicePixelRatio;

    ResolveUtils.assertFinite(maxParticles, "maxParticles");
    ResolveUtils.assertFinite(maxDevicePixelRatio, "maxDevicePixelRatio");

    return {
      resize: options.resize ?? DEFAULT_CREATE_OPTIONS.resize,
      zIndex: options.zIndex ?? DEFAULT_CREATE_OPTIONS.zIndex,
      maxParticles: Math.max(0, Math.floor(maxParticles)),
      maxDevicePixelRatio: Math.max(1, maxDevicePixelRatio),
      disableForReducedMotion:
        options.disableForReducedMotion ?? DEFAULT_CREATE_OPTIONS.disableForReducedMotion,
      defaults: options.defaults ?? {},
      frameScheduler: options.frameScheduler ?? null,
    };
  }

  /**
   * Resolve Burst Options.
   *
   * @param layers - Option Layers, Lowest Priority First
   * @param context - Resolution Context
   * @returns Resolved Burst Options
   */
  public static resolveFire(
    layers: readonly FireOptions[],
    context: ResolveContext = OptionResolver.DEFAULT_CONTEXT,
  ): ResolvedFireOptions {
    const particleCount =
      ResolveUtils.pick(layers, "particleCount") ?? DEFAULT_FIRE_OPTIONS.particleCount;
    const spread = ResolveUtils.pick(layers, "spread") ?? DEFAULT_FIRE_OPTIONS.spread;

    ResolveUtils.assertFinite(particleCount, "particleCount");
    ResolveUtils.assertFinite(spread, "spread");

    const emission = OptionResolver.resolveEmission(
      ResolveUtils.pick(layers, "emission") ?? DEFAULT_FIRE_OPTIONS.emission,
    );
    const formation = ResolveUtils.pick(layers, "formation");

    if (formation !== undefined && emission.mode !== "burst") {
      throw new TypeError(
        `konfeti: "formation" needs emission mode "burst", got "${emission.mode}"`,
      );
    }

    return {
      particleCount: Math.max(0, Math.floor(particleCount)),
      origin: OptionResolver.resolveOrigin(ResolveUtils.pick(layers, "origin")),
      angle: RangeUtils.toTuple(
        ResolveUtils.pick(layers, "angle") ?? DEFAULT_FIRE_OPTIONS.angle,
        "angle",
      ),
      spread,
      startVelocity: RangeUtils.toTuple(
        ResolveUtils.pick(layers, "startVelocity") ??
          (formation === undefined
            ? DEFAULT_FIRE_OPTIONS.startVelocity
            : DEFAULT_FORMATION_RELEASE_VELOCITY),
        "startVelocity",
      ),
      lifetime: RangeUtils.toTuple(
        ResolveUtils.pick(layers, "lifetime") ?? DEFAULT_FIRE_OPTIONS.lifetime,
        "lifetime",
      ),
      emission,
      shapes: ShapeResolver.resolveAll(layers, context),
      physics: PhysicsResolver.resolve(layers.map((layer) => layer.physics)),
      hooks: OptionResolver.resolveHooks(layers),
      seed: ResolveUtils.pick(layers, "seed") ?? Random.createSeed(),
      // an explicit particleCount caps a formation; otherwise its spacing decides
      formation:
        formation === undefined
          ? null
          : FormationSupport.create(
              formation,
              ResolveUtils.pick(layers, "particleCount") === undefined
                ? Infinity
                : Math.max(0, Math.floor(particleCount)),
            ),
    };
  }

  /**
   * Resolve Spawn Origin.
   *
   * @param origin - Public Origin
   * @returns Placed Origin
   */
  public static resolveOrigin(origin: Origin | undefined): PlacedOrigin {
    if (origin === undefined) {
      return {
        kind: "point",
        x: [DEFAULT_ORIGIN.x, DEFAULT_ORIGIN.x],
        y: [DEFAULT_ORIGIN.y, DEFAULT_ORIGIN.y],
      };
    }

    if (OptionResolver.isElement(origin)) {
      return { kind: "element", element: origin };
    }

    if (OptionResolver.isClientPoint(origin)) {
      ResolveUtils.assertFinite(origin.clientX, "origin.clientX");
      ResolveUtils.assertFinite(origin.clientY, "origin.clientY");
      return { kind: "client", clientX: origin.clientX, clientY: origin.clientY };
    }

    return {
      kind: "point",
      x: RangeUtils.toTuple(origin.x ?? DEFAULT_ORIGIN.x, "origin.x"),
      y: RangeUtils.toTuple(origin.y ?? DEFAULT_ORIGIN.y, "origin.y"),
    };
  }

  /**
   * Resolve Emission Timing.
   *
   * @param emission - Public Emission Options
   * @returns Resolved Emission
   */
  private static resolveEmission(emission: EmissionOptions): ResolvedEmission {
    switch (emission.mode) {
      case "burst":
        return { mode: "burst" };
      case "stream":
        ResolveUtils.assertPositive(emission.duration, "emission.duration");
        return { mode: "stream", duration: emission.duration };
      case "interval":
        ResolveUtils.assertPositive(emission.every, "emission.every");
        ResolveUtils.assertPositive(Math.floor(emission.times), "emission.times");
        return { mode: "interval", every: emission.every, times: Math.floor(emission.times) };
    }
  }

  /**
   * Merge Hooks (highest-priority definition wins per hook).
   *
   * @param layers - Option Layers, Lowest Priority First
   * @returns Merged Hooks
   */
  private static resolveHooks(layers: readonly FireOptions[]): BurstHooks {
    const entries = OptionResolver.HOOK_KEYS.map(
      (key) => [key, ResolveUtils.pick(layers, key)] as const,
    );
    return Object.fromEntries(entries.filter(([, hook]) => hook !== undefined));
  }

  /**
   * Check Element Origin.
   *
   * @param origin - Public Origin
   * @returns Element Flag
   */
  private static isElement(origin: Origin): origin is Element {
    return typeof Element !== "undefined" && origin instanceof Element;
  }

  /**
   * Check Client Point Origin.
   *
   * @param origin - Public Origin
   * @returns Client Point Flag
   */
  private static isClientPoint(origin: Origin): origin is ClientPoint {
    return "clientX" in origin && "clientY" in origin;
  }
}
