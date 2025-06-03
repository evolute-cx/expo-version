import { ExpoVersion } from "../expo-version";
import { 
  FileSystemService, 
  GitService, 
  UserInteractionService, 
  VersionService,
  AppJsonConfig,
  PackageJsonConfig 
} from "../types";

// Mock implementations
class MockFileSystemService implements FileSystemService {
  private appJsonData: AppJsonConfig = {
    expo: { version: "1.0.0" }
  };
  private packageJsonData: PackageJsonConfig = {
    version: "1.0.0"
  };

  async readAppJson(): Promise<AppJsonConfig> {
    return this.appJsonData;
  }

  async readPackageJson(): Promise<PackageJsonConfig> {
    return this.packageJsonData;
  }

  async writeAppJson(appJson: AppJsonConfig): Promise<void> {
    this.appJsonData = appJson;
  }

  async writePackageJson(packageJson: PackageJsonConfig): Promise<void> {
    this.packageJsonData = packageJson;
  }

  getAppJsonData(): AppJsonConfig {
    return this.appJsonData;
  }

  getPackageJsonData(): PackageJsonConfig {
    return this.packageJsonData;
  }
}

class MockGitService implements GitService {
  public isRepositoryResult = true;
  public hasUncommittedChangesResult = false;
  public addToStagingCalled = false;
  public createCommitCalled = false;
  public createTagCalled = false;

  async isRepository(): Promise<boolean> {
    return this.isRepositoryResult;
  }

  async hasUncommittedChanges(): Promise<boolean> {
    return this.hasUncommittedChangesResult;
  }

  async addToStaging(): Promise<void> {
    this.addToStagingCalled = true;
  }

  async createCommit(): Promise<void> {
    this.createCommitCalled = true;
  }

  async createTag(): Promise<void> {
    this.createTagCalled = true;
  }
}

class MockUserInteractionService implements UserInteractionService {
  public messages: string[] = [];
  public promptResult = "1.1.0";
  public confirmResult = true;

  showCurrentVersion(version: string): void {
    this.messages.push(`Current version: ${version}`);
  }

  showSuccess(message: string): void {
    this.messages.push(`Success: ${message}`);
  }

  showWarning(message: string): void {
    this.messages.push(`Warning: ${message}`);
  }

  showError(message: string): void {
    this.messages.push(`Error: ${message}`);
  }

  async confirmContinue(): Promise<boolean> {
    return this.confirmResult;
  }

  async promptForVersion(): Promise<string> {
    return this.promptResult;
  }
}

class MockVersionService implements VersionService {
  validate(version: string): boolean {
    return /^\d+\.\d+\.\d+$/.test(version);
  }

  increment(currentVersion: string, releaseType: "patch" | "minor" | "major"): string {
    const [major, minor, patch] = currentVersion.split(".").map(Number);
    
    switch (releaseType) {
      case "patch":
        return `${major}.${minor}.${patch + 1}`;
      case "minor":
        return `${major}.${minor + 1}.0`;
      case "major":
        return `${major + 1}.0.0`;
    }
  }
}

describe("ExpoVersion", () => {
  let expoVersion: ExpoVersion;
  let mockFileSystem: MockFileSystemService;
  let mockGit: MockGitService;
  let mockUserInteraction: MockUserInteractionService;
  let mockVersionService: MockVersionService;

  beforeEach(() => {
    mockFileSystem = new MockFileSystemService();
    mockGit = new MockGitService();
    mockUserInteraction = new MockUserInteractionService();
    mockVersionService = new MockVersionService();
    
    expoVersion = new ExpoVersion(
      "/test/path",
      {},
      mockFileSystem,
      mockGit,
      mockUserInteraction,
      mockVersionService
    );
  });

  describe("run", () => {
    it("should update version when provided directly", async () => {
      await expoVersion.run("1.2.0");

      expect(mockFileSystem.getAppJsonData().expo.version).toBe("1.2.0");
      expect(mockFileSystem.getPackageJsonData().version).toBe("1.2.0");
      expect(mockGit.addToStagingCalled).toBe(true);
      expect(mockGit.createCommitCalled).toBe(true);
      expect(mockGit.createTagCalled).toBe(true);
    });

    it("should prompt for version when not provided", async () => {
      mockUserInteraction.promptResult = "1.3.0";

      await expoVersion.run();

      expect(mockFileSystem.getAppJsonData().expo.version).toBe("1.3.0");
      expect(mockFileSystem.getPackageJsonData().version).toBe("1.3.0");
    });

    it("should skip git operations when not a repository", async () => {
      mockGit.isRepositoryResult = false;

      await expoVersion.run("1.2.0");

      expect(mockGit.addToStagingCalled).toBe(false);
      expect(mockGit.createCommitCalled).toBe(false);
      expect(mockGit.createTagCalled).toBe(false);
    });

    it("should skip git tag when noGitTagVersion is true", async () => {
      const expoVersionNoTag = new ExpoVersion(
        "/test/path",
        { noGitTagVersion: true },
        mockFileSystem,
        mockGit,
        mockUserInteraction,
        mockVersionService
      );

      await expoVersionNoTag.run("1.2.0");

      expect(mockGit.createCommitCalled).toBe(true);
      expect(mockGit.createTagCalled).toBe(false);
    });

    it("should handle unchanged version gracefully", async () => {
      await expoVersion.run("1.0.0");

      expect(mockUserInteraction.messages).toContain("Warning: Version unchanged. No action taken.");
      expect(mockGit.addToStagingCalled).toBe(false);
    });

    it("should validate version format", async () => {
      const consoleSpy = jest.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("Process exit called");
      });

      try {
        await expoVersion.run("invalid-version");
      } catch (error: unknown) {
        expect((error as Error).message).toBe("Process exit called");
      }

      expect(mockUserInteraction.messages.some(msg => 
        msg.includes("Invalid version format")
      )).toBe(true);

      consoleSpy.mockRestore();
    });
  });
}); 