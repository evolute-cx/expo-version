import chalk from "chalk";
import prompts from "prompts";
import { UserInteractionService, ReleaseType } from "../types";
import { VersionServiceImpl } from "./version.service";

export class UserInteractionServiceImpl implements UserInteractionService {
  private versionService = new VersionServiceImpl();

  showCurrentVersion(version: string): void {
    console.log(chalk.blue(`Current version: ${version}`));
  }

  showSuccess(message: string): void {
    console.log(chalk.green(`✓ ${message}`));
  }

  showWarning(message: string): void {
    console.log(chalk.yellow(message));
  }

  showError(message: string): void {
    console.error(chalk.red(`Error: ${message}`));
  }

  async confirmContinue(message: string): Promise<boolean> {
    const response = await prompts({
      type: "confirm",
      name: "continue",
      message,
      initial: false,
    });

    return response.continue;
  }

  async promptForVersion(currentVersion: string): Promise<string> {
    const choices = this.createVersionChoices(currentVersion);

    const response = await prompts({
      type: "select",
      name: "versionType",
      message: "Select version increment:",
      choices,
    });

    if (response.versionType === "custom") {
      return this.promptForCustomVersion();
    }

    return response.versionType;
  }

  private createVersionChoices(currentVersion: string) {
    const releaseTypes: ReleaseType[] = ["patch", "minor", "major"];

    return [
      { title: `keep current (${currentVersion})`, value: currentVersion },
      ...releaseTypes.map((type) => ({
        title: `${type} (${this.versionService.increment(
          currentVersion,
          type
        )})`,
        value: this.versionService.increment(currentVersion, type),
      })),
      { title: "custom", value: "custom" },
    ];
  }

  private async promptForCustomVersion(): Promise<string> {
    const response = await prompts({
      type: "text",
      name: "version",
      message: "Enter custom version:",
      validate: (value: string) =>
        this.versionService.validate(value) || "Invalid semver format",
    });

    return response.version;
  }
}
