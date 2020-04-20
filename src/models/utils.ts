/**
 * Compose an object by applying the mixins properties/functionality to the derived constructor.
 * @see https://www.typescriptlang.org/docs/handbook/mixins.html
 * @param derivedCtor the object being composed with mixins
 * @param baseCtors the mixins to apply to the object
 */
export const applyMixins = (derivedCtor: any, baseCtors: any[]) => {
  baseCtors.forEach((base) => {
    Object.getOwnPropertyNames(base.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(base.prototype, name)!,
      );
    });
  });
};

export default applyMixins;
