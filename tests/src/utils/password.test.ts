import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "../../../src/utils/password.util";

describe("password.util", () => {
  const password1 = "ClaveUno123!";
  const password2 = "ClaveDos456!";

  it("genera hashes no vacíos y distintos de la contraseña original", async () => {
    const hash1 = await hashPassword(password1);
    const hash2 = await hashPassword(password2);

    expect(typeof hash1).toBe("string");
    expect(hash1.length).toBeGreaterThan(0);
    expect(hash1).not.toBe(password1);

    expect(typeof hash2).toBe("string");
    expect(hash2.length).toBeGreaterThan(0);
    expect(hash2).not.toBe(password2);
  }, 15000);

  it("devuelve true cuando la contraseña es correcta", async () => {
    const hash1 = await hashPassword(password1);
    const hash2 = await hashPassword(password2);

    expect(await comparePassword(password1, hash1)).toBe(true);
    expect(await comparePassword(password2, hash2)).toBe(true);
  }, 15000);

  it("devuelve false cuando la contraseña es incorrecta", async () => {
    const hash1 = await hashPassword(password1);
    const hash2 = await hashPassword(password2);

    expect(await comparePassword(password2, hash1)).toBe(false);
    expect(await comparePassword(password1, hash2)).toBe(false);
  }, 15000);
});