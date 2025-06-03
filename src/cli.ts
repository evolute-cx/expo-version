#!/usr/bin/env node

import { ExpoVersionFactory } from "./services/expo-version.factory";

interface CLIArgs {
  version?: string;
  noGitTagVersion?: boolean;
  help?: boolean;
}

class CLIArgumentParser {
  parse(args: string[]): CLIArgs {
    const parsed: CLIArgs = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === "--help" || arg === "-h") {
        parsed.help = true;
      } else if (arg === "--no-git-tag-version") {
        parsed.noGitTagVersion = true;
      } else if (!arg.startsWith("-") && !parsed.version) {
        // First non-flag argument is the version
        parsed.version = arg;
      }
    }

    return parsed;
  }
}

class HelpDisplay {
  show(): void {
    const helpText = `
expo-version - Version management for Expo React Native apps

Usage:
  expo-version [version] [options]

Arguments:
  version               New version in semver format (e.g., 1.2.3)
                        If not provided, you will be prompted to select

Options:
  --no-git-tag-version  Prevent git tag creation
  --help, -h           Show this help message

Examples:
  expo-version                    # Interactive version selection
  expo-version 1.2.3             # Set specific version
  expo-version 2.0.0 --no-git-tag-version  # Set version without git tag

This tool reads the current version from app.json, prompts for a new version,
and updates both app.json and package.json. It also creates a git commit and
tag (unless disabled with --no-git-tag-version).

Compatible with EAS Build lifecycle hooks.
`;

    console.log(helpText.trim());
  }
}

class CLI {
  constructor(
    private readonly argumentParser: CLIArgumentParser,
    private readonly helpDisplay: HelpDisplay
  ) {}

  async run(argv: string[]): Promise<void> {
    const args = this.argumentParser.parse(argv.slice(2));

    if (args.help) {
      this.helpDisplay.show();
      return;
    }

    const expoVersion = ExpoVersionFactory.create(process.cwd(), {
      noGitTagVersion: args.noGitTagVersion,
    });

    await expoVersion.run(args.version);
  }
}

// Bootstrap the application
async function main(): Promise<void> {
  const cli = new CLI(new CLIArgumentParser(), new HelpDisplay());

  await cli.run(process.argv);
}

// Run the CLI
main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
