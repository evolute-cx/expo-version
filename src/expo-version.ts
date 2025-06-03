import { 
  VersionOptions, 
  VersionInfo, 
  FileSystemService, 
  GitService, 
  UserInteractionService, 
  VersionService 
} from './types';

export class ExpoVersion {
  constructor(
    private readonly cwd: string,
    private readonly options: VersionOptions,
    private readonly fileSystemService: FileSystemService,
    private readonly gitService: GitService,
    private readonly userInteractionService: UserInteractionService,
    private readonly versionService: VersionService
  ) {}

  async run(newVersion?: string): Promise<void> {
    try {
      const currentVersion = await this.getCurrentVersion();
      this.userInteractionService.showCurrentVersion(currentVersion);

      const targetVersion = await this.determineTargetVersion(newVersion, currentVersion);
      
      if (!this.versionService.validate(targetVersion)) {
        throw new Error(`Invalid version format: ${targetVersion}. Please use semver format (e.g., 1.0.0)`);
      }

      if (await this.isVersionUnchanged(targetVersion, currentVersion)) {
        return;
      }

      await this.handleUncommittedChanges();
      
      await this.updateVersion({ current: currentVersion, new: targetVersion });

      this.userInteractionService.showSuccess(`Version updated from ${currentVersion} to ${targetVersion}`);

    } catch (error) {
      this.handleError(error);
    }
  }

  private async getCurrentVersion(): Promise<string> {
    const appJson = await this.fileSystemService.readAppJson(this.cwd);
    return appJson.expo.version;
  }

  private async determineTargetVersion(providedVersion: string | undefined, currentVersion: string): Promise<string> {
    return providedVersion || await this.userInteractionService.promptForVersion(currentVersion);
  }

  private async isVersionUnchanged(targetVersion: string, currentVersion: string): Promise<boolean> {
    if (targetVersion === currentVersion) {
      this.userInteractionService.showWarning('Version unchanged. No action taken.');
      return true;
    }
    return false;
  }

  private async handleUncommittedChanges(): Promise<void> {
    if (!(await this.gitService.isRepository(this.cwd))) {
      return;
    }

    if (await this.gitService.hasUncommittedChanges(this.cwd)) {
      const shouldContinue = await this.userInteractionService.confirmContinue(
        'You have uncommitted changes. Continue anyway?'
      );

      if (!shouldContinue) {
        this.userInteractionService.showWarning('Aborted due to uncommitted changes.');
        process.exit(0);
      }
    }
  }

  private async updateVersion(versionInfo: VersionInfo): Promise<void> {
    await this.updateVersionFiles(versionInfo);
    await this.updateVersionControl(versionInfo);
  }

  private async updateVersionFiles(versionInfo: VersionInfo): Promise<void> {
    const [appJson, packageJson] = await Promise.all([
      this.fileSystemService.readAppJson(this.cwd),
      this.fileSystemService.readPackageJson(this.cwd)
    ]);

    appJson.expo.version = versionInfo.new;
    packageJson.version = versionInfo.new;

    await Promise.all([
      this.fileSystemService.writeAppJson(appJson, this.cwd),
      this.fileSystemService.writePackageJson(packageJson, this.cwd)
    ]);
  }

  private async updateVersionControl(versionInfo: VersionInfo): Promise<void> {
    if (!(await this.gitService.isRepository(this.cwd))) {
      this.userInteractionService.showWarning('Not a git repository. Skipping git operations.');
      return;
    }

    await this.gitService.addToStaging(['app.json', 'package.json'], this.cwd);
    
    const commitMessage = `v${versionInfo.new}`;
    await this.gitService.createCommit(commitMessage, this.cwd);

    if (!this.options.noGitTagVersion) {
      const tagName = `v${versionInfo.new}`;
      await this.gitService.createTag(tagName, this.cwd);
      this.userInteractionService.showSuccess(`Created git tag: ${tagName}`);
    }

    this.userInteractionService.showSuccess(`Created git commit: ${commitMessage}`);
  }

  private handleError(error: unknown): never {
    const message = error instanceof Error ? error.message : String(error);
    this.userInteractionService.showError(message);
    process.exit(1);
  }
} 