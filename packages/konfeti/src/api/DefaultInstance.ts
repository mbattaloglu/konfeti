import { KonfetiInstance } from "../core/KonfetiInstance";

/**
 * Lazily Created Shared Instance behind the `Konfeti` object.
 */
export class DefaultInstance {
  /**
   * Shared Instance.
   */
  private static instance: KonfetiInstance | null = null;

  /**
   * Return Shared Instance, Creating It on First Use.
   *
   * @returns Shared Konfeti Instance
   */
  public static getInstance(): KonfetiInstance {
    DefaultInstance.instance ??= new KonfetiInstance();
    return DefaultInstance.instance;
  }

  /**
   * Return Shared Instance if Created.
   *
   * @returns Shared Instance or Null
   */
  public static peek(): KonfetiInstance | null {
    return DefaultInstance.instance;
  }
}
