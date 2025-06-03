import semver from 'semver';
import { VersionService, ReleaseType } from '../types';

export class VersionServiceImpl implements VersionService {
  validate(version: string): boolean {
    return semver.valid(version) !== null;
  }

  increment(currentVersion: string, releaseType: ReleaseType): string {
    const newVersion = semver.inc(currentVersion, releaseType);
    if (!newVersion) {
      throw new Error(`Failed to increment version ${currentVersion} with type ${releaseType}`);
    }
    return newVersion;
  }
} 