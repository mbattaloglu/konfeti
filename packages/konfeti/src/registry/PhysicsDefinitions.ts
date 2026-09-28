import type { PhysicsDefinition } from "../types/PhysicsDefinition";

/**
 * Static Custom Physics Definition Store.
 */
export class PhysicsDefinitions {
  /**
   * Built-in Physics Keys (cannot be redefined).
   */
  private static readonly BUILTIN = new Set([
    "gravity",
    "drag",
    "wind",
    "terminalVelocity",
    "swirl",
    "floor",
  ]);

  /**
   * Registered Definitions by Name.
   */
  private static readonly definitions = new Map<string, PhysicsDefinition<object>>();

  /**
   * Register Definition.
   *
   * @param name - Module Name (the `physics` key)
   * @param definition - Module Definition
   * @throws TypeError for built-in or empty names
   */
  public static define<T extends object>(name: string, definition: PhysicsDefinition<T>): void {
    if (name === "" || PhysicsDefinitions.BUILTIN.has(name)) {
      throw new TypeError(`konfeti: "${name}" is a built-in physics key and cannot be redefined`);
    }

    // options are only known per registry key; the store erases them once, callers re-narrow per shape
    PhysicsDefinitions.definitions.set(name, definition as unknown as PhysicsDefinition<object>);
  }

  /**
   * Return Registered Definitions.
   *
   * @returns Name / Definition Pairs
   */
  public static entries(): IterableIterator<[string, PhysicsDefinition<object>]> {
    return PhysicsDefinitions.definitions.entries();
  }

  /**
   * Remove Definition (tests and hot reload).
   *
   * @param name - Module Name
   */
  public static remove(name: string): void {
    PhysicsDefinitions.definitions.delete(name);
  }
}
