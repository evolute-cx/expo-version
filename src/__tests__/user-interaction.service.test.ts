import { UserInteractionServiceImpl } from "../services/user-interaction.service";

// Mock prompts module
jest.mock("prompts", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock console methods
const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();
const mockConsoleError = jest.spyOn(console, "error").mockImplementation();

// Import prompts after mocking
import prompts from "prompts";
const mockPrompts = prompts as jest.MockedFunction<typeof prompts>;

describe("UserInteractionServiceImpl", () => {
  let userInteractionService: UserInteractionServiceImpl;

  beforeEach(() => {
    userInteractionService = new UserInteractionServiceImpl();
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe("showCurrentVersion", () => {
    it("should display current version in blue", () => {
      userInteractionService.showCurrentVersion("1.2.3");
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Current version: 1.2.3")
      );
    });
  });

  describe("showSuccess", () => {
    it("should display success message in green with checkmark", () => {
      userInteractionService.showSuccess("Operation completed");
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("✓ Operation completed")
      );
    });
  });

  describe("showWarning", () => {
    it("should display warning message in yellow", () => {
      userInteractionService.showWarning("This is a warning");
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("This is a warning")
      );
    });
  });

  describe("showError", () => {
    it("should display error message in red to stderr", () => {
      userInteractionService.showError("Something went wrong");
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("Error: Something went wrong")
      );
    });
  });

  describe("confirmContinue", () => {
    it("should return true when user confirms", async () => {
      mockPrompts.mockResolvedValueOnce({ continue: true });

      const result = await userInteractionService.confirmContinue(
        "Continue with operation?"
      );

      expect(result).toBe(true);
      expect(mockPrompts).toHaveBeenCalledWith({
        type: "confirm",
        name: "continue",
        message: "Continue with operation?",
        initial: false,
      });
    });

    it("should return false when user declines", async () => {
      mockPrompts.mockResolvedValueOnce({ continue: false });

      const result = await userInteractionService.confirmContinue(
        "Continue with operation?"
      );

      expect(result).toBe(false);
    });
  });

  describe("promptForVersion", () => {
    it("should return selected version when user chooses keep current", async () => {
      mockPrompts.mockResolvedValueOnce({ versionType: "1.2.3" });

      const result = await userInteractionService.promptForVersion("1.2.3");

      expect(result).toBe("1.2.3");
      expect(mockPrompts).toHaveBeenCalledWith({
        type: "select",
        name: "versionType",
        message: "Select version increment:",
        choices: expect.arrayContaining([
          { title: "keep current (1.2.3)", value: "1.2.3" },
          { title: "patch (1.2.4)", value: "1.2.4" },
          { title: "minor (1.3.0)", value: "1.3.0" },
          { title: "major (2.0.0)", value: "2.0.0" },
          { title: "custom", value: "custom" },
        ]),
      });
    });

    it("should return incremented version when user chooses patch", async () => {
      mockPrompts.mockResolvedValueOnce({ versionType: "1.2.4" });

      const result = await userInteractionService.promptForVersion("1.2.3");

      expect(result).toBe("1.2.4");
    });

    it("should return incremented version when user chooses minor", async () => {
      mockPrompts.mockResolvedValueOnce({ versionType: "1.3.0" });

      const result = await userInteractionService.promptForVersion("1.2.3");

      expect(result).toBe("1.3.0");
    });

    it("should return incremented version when user chooses major", async () => {
      mockPrompts.mockResolvedValueOnce({ versionType: "2.0.0" });

      const result = await userInteractionService.promptForVersion("1.2.3");

      expect(result).toBe("2.0.0");
    });

    it("should prompt for custom version when user chooses custom", async () => {
      mockPrompts
        .mockResolvedValueOnce({ versionType: "custom" })
        .mockResolvedValueOnce({ version: "5.0.0-beta.1" });

      const result = await userInteractionService.promptForVersion("1.2.3");

      expect(result).toBe("5.0.0-beta.1");
      expect(mockPrompts).toHaveBeenCalledTimes(2);
    });

    it("should validate custom version input", async () => {
      mockPrompts
        .mockResolvedValueOnce({ versionType: "custom" })
        .mockResolvedValueOnce({ version: "2.0.0" });

      await userInteractionService.promptForVersion("1.2.3");

      const customVersionCall = mockPrompts.mock.calls[1][0] as any;
      expect(customVersionCall.validate).toBeDefined();

      // Test validation function
      const validate = customVersionCall.validate;
      expect(validate("2.0.0")).toBe(true);
      expect(validate("invalid")).toBe("Invalid semver format");
    });
  });

  describe("createVersionChoices", () => {
    it("should create choices with keep current as first option", () => {
      const service = new UserInteractionServiceImpl();
      // Access private method through any to test it
      const choices = (service as any).createVersionChoices("1.2.3");

      expect(choices).toHaveLength(5);
      expect(choices[0]).toEqual({
        title: "keep current (1.2.3)",
        value: "1.2.3",
      });
      expect(choices[1]).toEqual({ title: "patch (1.2.4)", value: "1.2.4" });
      expect(choices[2]).toEqual({ title: "minor (1.3.0)", value: "1.3.0" });
      expect(choices[3]).toEqual({ title: "major (2.0.0)", value: "2.0.0" });
      expect(choices[4]).toEqual({ title: "custom", value: "custom" });
    });
  });
});
