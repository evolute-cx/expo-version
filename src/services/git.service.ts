import simpleGit from 'simple-git';
import { GitService } from '../types';

export class GitServiceImpl implements GitService {
  private static readonly FILES_TO_STAGE = ['app.json', 'package.json'];

  async isRepository(cwd: string): Promise<boolean> {
    try {
      await simpleGit().cwd(cwd).status();
      return true;
    } catch {
      return false;
    }
  }

  async hasUncommittedChanges(cwd: string): Promise<boolean> {
    const status = await simpleGit().cwd(cwd).status();
    return !status.isClean();
  }

  async addToStaging(files: string[], cwd: string): Promise<void> {
    await simpleGit().cwd(cwd).add(files);
  }

  async createCommit(message: string, cwd: string): Promise<void> {
    await simpleGit().cwd(cwd).commit(message);
  }

  async createTag(tag: string, cwd: string): Promise<void> {
    await simpleGit().cwd(cwd).addTag(tag);
  }

  async stageVersionFiles(cwd: string): Promise<void> {
    await this.addToStaging(GitServiceImpl.FILES_TO_STAGE, cwd);
  }

  async createVersionCommitAndTag(version: string, cwd: string, createTag: boolean = true): Promise<void> {
    const commitMessage = this.formatVersionCommitMessage(version);
    await this.createCommit(commitMessage, cwd);

    if (createTag) {
      const tagName = this.formatVersionTag(version);
      await this.createTag(tagName, cwd);
    }
  }

  private formatVersionCommitMessage(version: string): string {
    return `v${version}`;
  }

  private formatVersionTag(version: string): string {
    return `v${version}`;
  }
} 