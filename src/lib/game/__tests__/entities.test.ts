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

  it("keeps Mary of Bethany distinct from Mary the mother of Jesus", () => {
    expect(findEntityByInput("Maria")?.id).toBe("maria-mae-de-jesus");
    expect(findEntityByInput("Maria de Betania")?.id).toBe(
      "maria-de-betania"
    );
    expect(getEntityById("lazaro")?.roleTags).toContain("bethany_family");
    expect(getEntityById("maria-mae-de-jesus")?.roleTags).not.toContain(
      "bethany_family"
    );
  });

  it.each([
    ["adam", "patriarch_matriarch"],
    ["eva", "patriarch_matriarch"],
    ["rute", "patriarch_matriarch"],
    ["jose", "political_ruler"],
    ["betsabe", "political_ruler"]
  ])("assigns %s its defining role", (id, role) => {
    expect(getEntityById(id)?.primaryRole).toBe(role);
  });

  it("distinguishes Philip the Evangelist by name", () => {
    expect(getEntityById("filipe")?.name).toBe("Filipe, o Evangelista");
    expect(findEntityByInput("Filipe")?.id).toBe("filipe");
  });
});
