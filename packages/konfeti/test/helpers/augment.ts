// test-only registry augmentation through the public entry, exactly like a user would write it
declare module "../../src/index" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- augmentation must be an interface
  interface ShapeRegistry {
    diamond: { sharpness?: number };
    ring: { thickness?: number };
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- augmentation must be an interface
  interface PhysicsRegistry {
    magnet: { x: number; y: number; strength: number };
  }
}

export {};
