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

// Map characters for url safe encoding
const ENCODE: { [key: string]: string } = {
  '+': '-',
  '/': '_',
  '=': '.',
};

// Map characters for decoding from url safe encoding
const DECODE: { [key: string]: string } = {
  '-': '+',
  _: '/',
  '.': '=',
};

/**
 * Encode an object into url-safe base64 text
 * @param object the object to encode as url-safe base64 text
 */
export const urlSafeBase64Encode = (object: Object): string => {
  const base64 = Buffer.from(JSON.stringify(object)).toString('base64');
  return base64.replace(/[+/=]/g, (c: any) => ENCODE[c]);
};

/**
 * Decode and return the object represented by url-safe base64 encoded text
 * @param encoded the url-safe base64 encoded text to decode
 */
export const urlSafeBase64Decode = (encoded: string): Object => {
  const base64 = encoded.replace(/[-_.]/g, (c: any) => DECODE[c]);
  const ascii = Buffer.from(base64, 'base64').toString('ascii');
  return JSON.parse(ascii);
};
