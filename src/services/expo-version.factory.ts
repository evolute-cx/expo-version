import { VersionOptions } from '../types';
import { ExpoVersion } from '../expo-version';
import { FileSystemServiceImpl } from './file-system.service';
import { GitServiceImpl } from './git.service';
import { UserInteractionServiceImpl } from './user-interaction.service';
import { VersionServiceImpl } from './version.service';

export class ExpoVersionFactory {
  static create(cwd: string = process.cwd(), options: VersionOptions = {}): ExpoVersion {
    const fileSystemService = new FileSystemServiceImpl();
    const gitService = new GitServiceImpl();
    const userInteractionService = new UserInteractionServiceImpl();
    const versionService = new VersionServiceImpl();

    return new ExpoVersion(
      cwd,
      options,
      fileSystemService,
      gitService,
      userInteractionService,
      versionService
    );
  }
} 