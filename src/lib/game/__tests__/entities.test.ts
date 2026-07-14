import { describe, expect, it } from "vitest";
import { findEntityByInput, getEntityById } from "../entities";

describe("curated entities", () => {
  it("represents Lazarus as Lazarus of Bethany", () => {
    expect(getEntityById("lazaro")).toMatchObject({
      name: "Lázaro de Betânia",
      primaryRole: "disciple_follower",
      books: ["Joao"]
    });
    expect(getEntityById("lazaro-da-parabola")).toBeUndefined();
  });

  it("accepts the short name for Lazarus of Bethany", () => {
    expect(findEntityByInput("Lazaro")?.id).toBe("lazaro");
  });
});
