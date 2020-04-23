import { urlSafeBase64Encode, urlSafeBase64Decode } from '@src/models/utils';

describe('utils', () => {
  const bob = { bob: 'ross' };
  const encodedBob = 'eyJib2IiOiJyb3NzIn0.';
  describe('urlSafeBase64Encode', () => {
    it('should encode an object', async () => {
      expect(urlSafeBase64Encode(bob)).toBe(encodedBob);
    });
  });
  describe('urlSafeBase64Decode', () => {
    it('should decode the string', async () => {
      expect(urlSafeBase64Decode(encodedBob)).toEqual(bob);
    });
  });
});
