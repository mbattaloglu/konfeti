import {
  DEFAULT_ATTRACT,
  DEFAULT_FLOOR,
  DEFAULT_PHYSICS,
  DEFAULT_SWIRL,
} from "../../config/FireDefaults";
import type { AttractOptions } from "../../types/AttractOptions";
import type { FloorOptions } from "../../types/FloorOptions";
import type { PhysicsOptions } from "../../types/PhysicsOptions";
import type { ResolvedPhysics } from "../../types/resolved/ResolvedPhysics";
type CustomPhysics = ResolvedPhysics["custom"];
import type { SwirlOptions } from "../../types/SwirlOptions";
import { PhysicsDefinitions } from "../../registry/PhysicsDefinitions";
import { MathUtils } from "../../utils/MathUtils";
import { RangeUtils } from "../../utils/RangeUtils";
import { ResolveUtils } from "./ResolveUtils";

/**
 * Static Physics Resolver.
 */
export class PhysicsResolver {
  /**
   * Resolve Physics Layers.
   *
   * @param layers - Physics Layers, Lowest Priority First
   * @returns Resolved Physics
   */
  public static resolve(layers: readonly (PhysicsOptions | undefined)[]): ResolvedPhysics {
    const all: readonly (PhysicsOptions | undefined)[] = [DEFAULT_PHYSICS, ...layers];
    const terminalVelocity =
      ResolveUtils.pick(all, "terminalVelocity") ?? DEFAULT_PHYSICS.terminalVelocity;
    const swirl = ResolveUtils.mergeToggle<Required<SwirlOptions>>(
      all.map((layer) => layer?.swirl),
      DEFAULT_SWIRL,
    );
    const floor = ResolveUtils.mergeToggle<Required<FloorOptions>>(
      all.map((layer) => layer?.floor),
      DEFAULT_FLOOR,
    );
    const attract = ResolveUtils.mergeToggle<Required<AttractOptions>>(
      all.map((layer) => layer?.attract),
      DEFAULT_ATTRACT,
    );

    if (attract !== false && (Number.isNaN(attract.radius) || attract.radius <= 0)) {
      throw new TypeError(
        `konfeti: "physics.attract.radius" must be a positive number or Infinity`,
      );
    }

    if (Number.isNaN(terminalVelocity) || terminalVelocity <= 0) {
      throw new TypeError(
        `konfeti: "physics.terminalVelocity" must be a positive number or Infinity`,
      );
    }

    return {
      gravity: RangeUtils.toTuple(
        ResolveUtils.pick(all, "gravity") ?? DEFAULT_PHYSICS.gravity,
        "physics.gravity",
      ),
      drag: RangeUtils.toTuple(
        ResolveUtils.pick(all, "drag") ?? DEFAULT_PHYSICS.drag,
        "physics.drag",
      ),
      wind: RangeUtils.toTuple(
        ResolveUtils.pick(all, "wind") ?? DEFAULT_PHYSICS.wind,
        "physics.wind",
      ),
      terminalVelocity,
      swirl:
        swirl === false
          ? null
          : {
              strength: RangeUtils.toTuple(swirl.strength, "physics.swirl.strength"),
              frequency: RangeUtils.toTuple(swirl.frequency, "physics.swirl.frequency"),
            },
      floor:
        floor === false
          ? null
          : {
              y: MathUtils.clamp(floor.y, 0, 1),
              bounce: MathUtils.clamp(floor.bounce, 0, 1),
              friction: MathUtils.clamp(floor.friction, 0, 1),
            },
      attract:
        attract === false
          ? null
          : {
              target: attract.target,
              strength: RangeUtils.toTuple(attract.strength, "physics.attract.strength"),
              radius: attract.radius,
              falloff: attract.falloff,
            },
      custom: PhysicsResolver.resolveCustom(layers),
    };
  }

  /**
   * Resolve Enabled Custom Modules.
   * Custom modules are off unless a layer sets `true` or an options object.
   *
   * @param layers - Physics Layers, Lowest Priority First
   * @returns Enabled Modules with Merged Options
   */
  private static resolveCustom(layers: readonly (PhysicsOptions | undefined)[]): CustomPhysics {
    const enabled: { definition: CustomPhysics[number]["definition"]; options: object }[] = [];

    for (const [name, definition] of PhysicsDefinitions.entries()) {
      const values = layers.map((layer) => PhysicsResolver.readCustom(layer, name));
      const options = ResolveUtils.mergeToggle<object>([false, ...values], definition.defaults);

      if (options !== false) {
        enabled.push({ definition, options });
      }
    }

    return enabled;
  }

  /**
   * Read Custom Module Value from Layer.
   *
   * @param layer - Physics Layer
   * @param name - Module Name
   * @returns Toggle / Options Value or Undefined
   * @throws TypeError for values that are neither boolean nor object
   */
  private static readCustom(
    layer: PhysicsOptions | undefined,
    name: string,
  ): boolean | object | undefined {
    // registry keys are only known at runtime, so read through a string-indexed view
    const value: unknown = (layer as Readonly<Record<string, unknown>> | undefined)?.[name];

    if (
      value === undefined ||
      typeof value === "boolean" ||
      (typeof value === "object" && value !== null)
    ) {
      return value ?? undefined;
    }

    throw new TypeError(`konfeti: "physics.${name}" must be a boolean or an options object`);
  }
}
