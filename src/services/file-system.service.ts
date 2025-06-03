import fs from 'fs';
import path from 'path';
import { AppJsonConfig, PackageJsonConfig, FileSystemService } from '../types';

export class FileSystemServiceImpl implements FileSystemService {
  private static readonly APP_JSON_FILENAME = 'app.json';
  private static readonly PACKAGE_JSON_FILENAME = 'package.json';

  async readAppJson(cwd: string): Promise<AppJsonConfig> {
    const filePath = path.join(cwd, FileSystemServiceImpl.APP_JSON_FILENAME);
    
    this.ensureFileExists(filePath, 'app.json not found. Make sure you are in an Expo project directory.');
    
    const appJson = this.parseJsonFile<AppJsonConfig>(filePath, 'app.json contains invalid JSON.');
    
    this.validateAppJsonStructure(appJson);
    
    return appJson;
  }

  async readPackageJson(cwd: string): Promise<PackageJsonConfig> {
    const filePath = path.join(cwd, FileSystemServiceImpl.PACKAGE_JSON_FILENAME);
    
    this.ensureFileExists(filePath, 'package.json not found.');
    
    return this.parseJsonFile<PackageJsonConfig>(filePath, 'package.json contains invalid JSON.');
  }

  async writeAppJson(appJson: AppJsonConfig, cwd: string): Promise<void> {
    const filePath = path.join(cwd, FileSystemServiceImpl.APP_JSON_FILENAME);
    this.writeJsonFile(appJson, filePath);
  }

  async writePackageJson(packageJson: PackageJsonConfig, cwd: string): Promise<void> {
    const filePath = path.join(cwd, FileSystemServiceImpl.PACKAGE_JSON_FILENAME);
    this.writeJsonFile(packageJson, filePath);
  }

  private ensureFileExists(filePath: string, errorMessage: string): void {
    if (!fs.existsSync(filePath)) {
      throw new Error(errorMessage);
    }
  }

  private parseJsonFile<T>(filePath: string, errorMessage: string): T {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  private writeJsonFile(data: any, filePath: string): void {
    const content = JSON.stringify(data, null, 2) + '\n';
    fs.writeFileSync(filePath, content, 'utf8');
  }

  private validateAppJsonStructure(appJson: AppJsonConfig): void {
    if (!appJson.expo || !appJson.expo.version) {
      throw new Error('app.json must contain expo.version field.');
    }
  }
} 