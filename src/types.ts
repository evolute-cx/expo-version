export interface AppJsonConfig {
  expo: {
    version: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface PackageJsonConfig {
  version: string;
  [key: string]: any;
}

export interface VersionOptions {
  noGitTagVersion?: boolean;
}

export interface VersionInfo {
  current: string;
  new: string;
}

// Abstractions for dependency injection
export interface FileSystemService {
  readAppJson(cwd: string): Promise<AppJsonConfig>;
  readPackageJson(cwd: string): Promise<PackageJsonConfig>;
  writeAppJson(appJson: AppJsonConfig, cwd: string): Promise<void>;
  writePackageJson(packageJson: PackageJsonConfig, cwd: string): Promise<void>;
}

export interface GitService {
  isRepository(cwd: string): Promise<boolean>;
  hasUncommittedChanges(cwd: string): Promise<boolean>;
  addToStaging(files: string[], cwd: string): Promise<void>;
  createCommit(message: string, cwd: string): Promise<void>;
  createTag(tag: string, cwd: string): Promise<void>;
}

export interface UserInteractionService {
  showCurrentVersion(version: string): void;
  showSuccess(message: string): void;
  showWarning(message: string): void;
  showError(message: string): void;
  confirmContinue(message: string): Promise<boolean>;
  promptForVersion(currentVersion: string): Promise<string>;
}

export interface VersionService {
  validate(version: string): boolean;
  increment(
    currentVersion: string,
    releaseType: "patch" | "minor" | "major"
  ): string;
}

export type ReleaseType = "patch" | "minor" | "major";
