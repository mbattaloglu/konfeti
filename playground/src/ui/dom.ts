/**
 * Create Element with Optional Class and Text.
 *
 * @param tag - Tag Name
 * @param className - Class Attribute
 * @param text - Text Content
 * @returns Element
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (className !== undefined) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

/**
 * Query Required Element by Id.
 *
 * @param id - Element Id
 * @param type - Expected Element Constructor
 * @returns Element
 */
export function byId<T extends HTMLElement>(id: string, type: new () => T): T {
  const element = document.getElementById(id);

  if (!(element instanceof type)) {
    throw new Error(`playground: missing #${id}`);
  }

  return element;
}
