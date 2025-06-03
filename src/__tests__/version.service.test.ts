import { VersionServiceImpl } from '../services/version.service';

describe('VersionService', () => {
  let versionService: VersionServiceImpl;

  beforeEach(() => {
    versionService = new VersionServiceImpl();
  });

  describe('validate', () => {
    it('should return true for valid semver versions', () => {
      expect(versionService.validate('1.0.0')).toBe(true);
      expect(versionService.validate('2.3.4')).toBe(true);
      expect(versionService.validate('1.0.0-alpha.1')).toBe(true);
      expect(versionService.validate('1.0.0+build.1')).toBe(true);
    });

    it('should return false for invalid semver versions', () => {
      expect(versionService.validate('1.0')).toBe(false);
      expect(versionService.validate('1')).toBe(false);
      expect(versionService.validate('invalid')).toBe(false);
      expect(versionService.validate('')).toBe(false);
    });
  });

  describe('increment', () => {
    it('should increment patch version correctly', () => {
      expect(versionService.increment('1.0.0', 'patch')).toBe('1.0.1');
      expect(versionService.increment('2.3.4', 'patch')).toBe('2.3.5');
    });

    it('should increment minor version correctly', () => {
      expect(versionService.increment('1.0.0', 'minor')).toBe('1.1.0');
      expect(versionService.increment('2.3.4', 'minor')).toBe('2.4.0');
    });

    it('should increment major version correctly', () => {
      expect(versionService.increment('1.0.0', 'major')).toBe('2.0.0');
      expect(versionService.increment('2.3.4', 'major')).toBe('3.0.0');
    });

    it('should throw error for invalid version', () => {
      expect(() => versionService.increment('invalid', 'patch')).toThrow();
    });
  });
}); 