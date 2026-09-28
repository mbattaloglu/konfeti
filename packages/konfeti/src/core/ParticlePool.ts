import { Particle } from "../particles/Particle";

/**
 * Particle Object Pool.
 * Dead particles are reset and reused, so a warm pool allocates nothing while animating.
 */
export class ParticlePool {
  /**
   * Idle Particle List.
   */
  private readonly idle: Particle[] = [];

  /**
   * Total Particles Ever Created.
   */
  private createdCount = 0;

  /**
   * Take Particle from Pool.
   *
   * @returns Idle or Newly Created Particle
   */
  public acquire(): Particle {
    const particle = this.idle.pop();

    if (particle) {
      return particle;
    }

    this.createdCount++;
    return new Particle();
  }

  /**
   * Return Particle to Pool.
   *
   * @param particle - Dead Particle
   */
  public release(particle: Particle): void {
    particle.reset();
    this.idle.push(particle);
  }

  /**
   * Pre-Create Idle Particles.
   *
   * @param count - Target Idle Count
   */
  public warm(count: number): void {
    while (this.idle.length < count) {
      this.createdCount++;
      this.idle.push(new Particle());
    }
  }

  /**
   * Return Idle Particle Count.
   *
   * @returns Idle Particle Count
   */
  public getIdleCount(): number {
    return this.idle.length;
  }

  /**
   * Return Total Created Particle Count.
   *
   * @returns Created Particle Count
   */
  public getCreatedCount(): number {
    return this.createdCount;
  }
}
