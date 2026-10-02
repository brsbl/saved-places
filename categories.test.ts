import { describe, expect, it } from "vitest";
import { categories, categoryIdSchema, groupOf, groups, includesCategory, resolveCategory } from "./categories";
import { categoryIcons } from "./category-icons";

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

describe("category taxonomy", () => {
  it("keeps every stored id valid and gives each one an icon and a group", () => {
    for (const id of ["ramen", "sushi", "food", "coffee", "bars", "records", "music", "culture", "outdoors", "stays", "other"]) expect(categoryIdSchema.safeParse(id).success).toBe(true);
    for (const id of categoryIdSchema.options) {
      expect(categoryIcons[id]).toBeDefined();
      expect(groups).toContain(groupOf(id));
    }
    expect(new Set(categories.map(c => c.id)).size).toBe(categoryIdSchema.options.length);
  });

  it("uses group colors that keep a white glyph readable", () => {
    for (const group of groups) expect(1.05 / (luminance(group.color) + 0.05)).toBeGreaterThanOrEqual(3);
  });

  it("maps each basemap POI class to one category", () => {
    const values = categories.flatMap(c => c.poi);
    expect(new Set(values).size).toBe(values.length);
  });

  it("refines broad stored categories from the place type or name", () => {
    expect(resolveCategory({ category: "culture", placeType: "Art museum", name: "Mori Art Museum", address: "" })).toBe("museum");
    expect(resolveCategory({ category: "culture", placeType: "Shinto shrine", name: "Kitsune Shrine", address: "" })).toBe("shrine");
    expect(resolveCategory({ category: "outdoors", placeType: "Theme park", name: "Fuji-Q", address: "" })).toBe("amusement");
    expect(resolveCategory({ category: "other", placeType: null, name: "Groove Record Store", address: "" })).toBe("records");
    expect(resolveCategory({ category: "music", placeType: "Music bar", name: "JBS", address: "" })).toBe("music");
    expect(resolveCategory({ category: "ramen", placeType: "Sushi restaurant", name: "Ichiran", address: "" })).toBe("ramen");
    expect(resolveCategory({ category: "other", placeType: null, name: "Somewhere", address: "" })).toBe("other");
  });

  it.each([
    ["Bar", "Groove Record Bar", "bars"],
    ["Dessert restaurant", "Kōri Corner", "dessert"],
    ["Restaurant", "Sushi Hana", "sushi"],
    ["Restaurant", "Harbor Fish Market", "food"],
    ["Standing sushi bar", "Tachigui Kaze", "sushi"],
    ["Sports bar", "The Local", "bars"],
    ["Cafe & bar", "Moonlight Jazz Cafe & Bar", "music"],
    ["Kitchen supply store", "Hamono Knives", "shop"],
    ["Dojo restaurant", "Dojo Table", "food"],
    ["Swimwear store", "Coral Swim Co.", "fashion"],
    ["Observation deck", "Harbor Tower", "viewpoint"],
    [null, "Riverside Garden Hotel", "stays"],
    [null, "Sneaker Palace", "fashion"],
    [null, "Beach Road Curry House", "food"],
    [null, "Lucky's Lounge", "bars"],
    [null, "Golden Lantern Cuisine", "food"],
    [null, "Ah Seng Bak Kut Teh 12 Harbor Road", "food"],
  ] as const)("puts a %s named %s in %s", (placeType, name, expected) => {
    expect(resolveCategory({ category: "other", placeType, name, address: "" })).toBe(expected);
  });

  it("files bare addresses and dropped pins under Addresses, and Google neighborhoods under Neighborhoods", () => {
    const resolve = (name: string, address = "", placeType: string | null = null) => resolveCategory({ category: "other", placeType, name, address });
    expect(resolve("123 Example St", "123 Example St, Springfield, IL 62701")).toBe("address");
    expect(resolve("12 Saemmul-ro 34-gil")).toBe("address");
    expect(resolve("Via Esempio, 12")).toBe("address");
    expect(resolve("77 Ficticia", "77 Ficticia, Ciudad Ejemplo")).toBe("address");
    expect(resolve(`10°00'00.0"N 20°00'00.0"E`)).toBe("address");
    expect(resolve("9 Lanterns", "500 Market Ave, Springfield")).toBe("other");
    expect(resolve("042", "Old Mill, Harbor Rd")).toBe("other");
    expect(resolveCategory({ category: "food", placeType: null, name: "9 Lanterns", address: "500 Market Ave" })).toBe("food");
    expect(resolve("Old Town", "", "Neighborhood")).toBe("neighborhood");
  });

  it("keeps each original broad filter id matching what it matched before the taxonomy grew", () => {
    expect(includesCategory("culture", "shrine")).toBe(true);
    expect(includesCategory("food", "pizza")).toBe(true);
    expect(includesCategory("food", "ramen")).toBe(false);
    expect(includesCategory("food", "sushi")).toBe(false);
    expect(includesCategory("bars", "wine")).toBe(true);
    expect(includesCategory("bars", "music")).toBe(false);
    expect(includesCategory("coffee", "bakery")).toBe(true);
    expect(includesCategory("museum", "shrine")).toBe(false);
    expect(includesCategory("music", "bars")).toBe(false);
  });
});
