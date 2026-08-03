import { describe, it, expect, vi, afterEach } from "vitest";
import { logger } from "@infra/logging/logger";

describe("logger técnico (infraestrutura, Sprint 0)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registra mensagem de nível info como JSON estruturado com timestamp e nível", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    logger.info("mensagem de teste", { modulo: "sprint0" });

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const [output] = consoleSpy.mock.calls[0] as [string];
    const parsed = JSON.parse(output);

    expect(parsed.level).toBe("info");
    expect(parsed.message).toBe("mensagem de teste");
    expect(parsed.modulo).toBe("sprint0");
    expect(typeof parsed.timestamp).toBe("string");
  });

  it("registra mensagem de erro usando console.error, não console.log", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    logger.error("falha de teste");

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).not.toHaveBeenCalled();
  });
});
