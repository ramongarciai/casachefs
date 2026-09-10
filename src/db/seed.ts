import "./load-env";

import { db } from "./index";
import { menuItems } from "./schema/menu";
import { pricingBands, bandMenuItems } from "./schema/pricing";
import { feeRules } from "./schema/fee-rules";
import { packages, packageItems } from "./schema/packages";
import { addons, addonVariants } from "./schema/addons";
import { PRICING_BANDS_SEED_DATA as BANDS } from "./pricing-bands-data";
import type { menuCategoryEnum, allergenEnum } from "./schema/menu";
import type { addonCategoryEnum, addonUnitEnum } from "./schema/addons";

type Allergen = (typeof allergenEnum.enumValues)[number];
type Category = (typeof menuCategoryEnum.enumValues)[number];
type AddonCategory = (typeof addonCategoryEnum.enumValues)[number];
type AddonUnit = (typeof addonUnitEnum.enumValues)[number];

interface SeedItem {
  /** Stable lookup key used to reference this item from PACKAGES below. */
  key: string;
  category: Category;
  nameEn: string;
  nameEs: string;
  descriptionEn: string;
  descriptionEs: string;
  spiceLevel?: "none" | "mild" | "medium" | "hot";
  glutenFree?: boolean;
  kosher?: boolean;
  halal?: boolean;
  vegetarian?: boolean;
  vegan?: boolean;
  dairyFree?: boolean;
  nutFree?: boolean;
  porkFree?: boolean;
  allergens?: Allergen[];
  internalCostCents: number;
  bands?: string[];
  publishedPriceCents?: number;
  unit?: "lb" | "l";
  minQuantity?: number;
  leadTimeDays?: number;
}

const BOX_BANDS = ["BL_STD", "BL_PLUS"];
const CATERING_BANDS = ["CAT_STD", "CAT_PREM"];
const ALL_EVENT_BANDS = [...BOX_BANDS, ...CATERING_BANDS];

const ITEMS: SeedItem[] = [
  // Entradas
  {
    category: "entrada",
    key: "shrimp_ceviche",
    nameEn: "Shrimp Ceviche",
    nameEs: "Ceviche de Camarón",
    descriptionEn: "Gulf shrimp cured in lime with tomato, onion, and cilantro.",
    descriptionEs: "Camarón del Golfo curado en limón con tomate, cebolla y cilantro.",
    glutenFree: true,
    dairyFree: true,
    allergens: ["shellfish"],
    internalCostCents: 450,
    bands: CATERING_BANDS,
  },
  {
    category: "entrada",
    key: "beef_empanadas",
    nameEn: "Beef Empanadas",
    nameEs: "Empanadas de Res",
    descriptionEn: "Hand-folded pastry filled with seasoned ground beef.",
    descriptionEs: "Masa hojaldrada rellena de carne molida sazonada.",
    allergens: ["wheat_gluten", "egg"],
    internalCostCents: 220,
    bands: ALL_EVENT_BANDS,
  },
  {
    category: "entrada",
    key: "ham_croquettes",
    nameEn: "Ham Croquettes",
    nameEs: "Croquetas de Jamón",
    descriptionEn: "Crispy breaded croquettes with a creamy ham filling.",
    descriptionEs: "Croquetas empanizadas con relleno cremoso de jamón.",
    allergens: ["wheat_gluten", "dairy", "egg"],
    internalCostCents: 210,
    bands: CATERING_BANDS,
  },

  // Platos fuertes
  {
    category: "plato_fuerte",
    key: "chicken",
    nameEn: "Grilled Chicken Breast",
    nameEs: "Pollo a la Plancha",
    descriptionEn: "Marinated chicken breast grilled and sliced.",
    descriptionEs: "Pechuga de pollo marinada, asada y en rebanadas.",
    glutenFree: true,
    dairyFree: true,
    nutFree: true,
    porkFree: true,
    internalCostCents: 380,
    bands: ALL_EVENT_BANDS,
  },
  {
    category: "plato_fuerte",
    key: "carne_asada",
    nameEn: "Grilled Skirt Steak",
    nameEs: "Carne Asada",
    descriptionEn: "Skirt steak marinated in citrus and grilled over open flame.",
    descriptionEs: "Arrachera marinada en cítricos y asada a la parrilla.",
    glutenFree: true,
    porkFree: true,
    internalCostCents: 520,
    bands: [...BOX_BANDS, ...CATERING_BANDS],
  },
  {
    category: "plato_fuerte",
    key: "veracruz_fish",
    nameEn: "Veracruz-Style Fish",
    nameEs: "Pescado a la Veracruzana",
    descriptionEn: "White fish simmered in a tomato, olive, and caper sauce.",
    descriptionEs: "Pescado blanco en salsa de tomate, aceitunas y alcaparras.",
    spiceLevel: "mild",
    glutenFree: true,
    dairyFree: true,
    allergens: ["fish"],
    internalCostCents: 560,
    bands: CATERING_BANDS,
  },
  {
    category: "plato_fuerte",
    key: "chicken_enchiladas",
    nameEn: "Green Chicken Enchiladas",
    nameEs: "Enchiladas Verdes de Pollo",
    descriptionEn: "Corn tortillas filled with chicken, bathed in tomatillo sauce and crema.",
    descriptionEs: "Tortillas de maíz rellenas de pollo, bañadas en salsa verde y crema.",
    spiceLevel: "mild",
    glutenFree: true,
    allergens: ["dairy"],
    internalCostCents: 400,
    bands: ALL_EVENT_BANDS,
  },

  // Ensaladas
  {
    category: "ensalada",
    key: "caesar_salad",
    nameEn: "Caesar Salad",
    nameEs: "Ensalada César",
    descriptionEn: "Romaine, parmesan, croutons, and classic Caesar dressing.",
    descriptionEs: "Lechuga romana, parmesano, crutones y aderezo César clásico.",
    vegetarian: true,
    allergens: ["dairy", "egg", "wheat_gluten", "fish"],
    internalCostCents: 260,
    bands: ALL_EVENT_BANDS,
  },
  {
    category: "ensalada",
    key: "cactus_salad",
    nameEn: "Cactus Salad",
    nameEs: "Ensalada de Nopales",
    descriptionEn: "Grilled cactus paddles with tomato, onion, and queso fresco on the side.",
    descriptionEs: "Nopales asados con tomate, cebolla y queso fresco aparte.",
    vegan: true,
    glutenFree: true,
    internalCostCents: 230,
    bands: CATERING_BANDS,
  },
  {
    category: "ensalada",
    key: "tropical_salad",
    nameEn: "Tropical Salad",
    nameEs: "Ensalada Tropical",
    descriptionEn: "Mixed greens with mango, jicama, and a citrus vinaigrette.",
    descriptionEs: "Mezcla de lechugas con mango, jícama y vinagreta de cítricos.",
    vegan: true,
    glutenFree: true,
    nutFree: true,
    internalCostCents: 240,
    bands: ALL_EVENT_BANDS,
  },

  // Canapés
  {
    category: "canape",
    key: "salmon_canape",
    nameEn: "Smoked Salmon Canapé",
    nameEs: "Canapé de Salmón Ahumado",
    descriptionEn: "Toasted baguette, herbed cream cheese, and smoked salmon.",
    descriptionEs: "Baguette tostada, queso crema con hierbas y salmón ahumado.",
    allergens: ["fish", "dairy", "wheat_gluten"],
    internalCostCents: 300,
    bands: ["CAT_PREM"],
  },
  {
    category: "canape",
    key: "caprese_canape",
    nameEn: "Caprese Canapé",
    nameEs: "Canapé Caprese",
    descriptionEn: "Cherry tomato, fresh mozzarella, and basil on a skewer.",
    descriptionEs: "Tomate cherry, mozzarella fresca y albahaca en broqueta.",
    vegetarian: true,
    glutenFree: true,
    allergens: ["dairy"],
    internalCostCents: 190,
    bands: CATERING_BANDS,
  },

  // Entremeses
  {
    category: "entremes",
    key: "guacamole",
    nameEn: "Guacamole & Chips",
    nameEs: "Tabla de Guacamole y Totopos",
    descriptionEn: "Fresh guacamole with house-fried corn tortilla chips.",
    descriptionEs: "Guacamole fresco con totopos de maíz fritos en casa.",
    vegan: true,
    glutenFree: true,
    internalCostCents: 200,
    bands: ALL_EVENT_BANDS,
  },
  {
    category: "entremes",
    key: "queso_fundido",
    nameEn: "Melted Cheese Dip",
    nameEs: "Queso Fundido",
    descriptionEn: "Melted cheese with roasted poblano strips, served with tortillas.",
    descriptionEs: "Queso derretido con rajas de poblano, servido con tortillas.",
    spiceLevel: "mild",
    vegetarian: true,
    allergens: ["dairy"],
    internalCostCents: 240,
    bands: CATERING_BANDS,
  },

  // Tablas de charcutería
  {
    category: "tabla_charcuteria",
    key: "charcuterie_classic",
    nameEn: "Classic Charcuterie Board",
    nameEs: "Tabla Clásica de Quesos y Carnes Frías",
    descriptionEn: "Cured meats, artisan cheeses, nuts, and preserves.",
    descriptionEs: "Carnes frías, quesos artesanales, nueces y conservas.",
    allergens: ["dairy", "tree_nut"],
    internalCostCents: 620,
    bands: ["CAT_PREM"],
  },
  {
    category: "tabla_charcuteria",
    key: "charcuterie_mediterranean",
    nameEn: "Mediterranean Board",
    nameEs: "Tabla Mediterránea",
    descriptionEn: "Hummus, olives, feta, and crackers.",
    descriptionEs: "Hummus, aceitunas, queso feta y galletas saladas.",
    vegetarian: true,
    allergens: ["dairy", "wheat_gluten", "sesame"],
    internalCostCents: 340,
    bands: CATERING_BANDS,
  },

  // Postres
  {
    category: "postre",
    key: "tres_leches",
    nameEn: "Tres Leches Cake",
    nameEs: "Pastel de Tres Leches",
    descriptionEn: "Sponge cake soaked in three milks, topped with whipped cream.",
    descriptionEs: "Bizcocho remojado en tres leches, cubierto con crema batida.",
    vegetarian: true,
    allergens: ["dairy", "egg", "wheat_gluten"],
    internalCostCents: 210,
    bands: ALL_EVENT_BANDS,
  },
  {
    category: "postre",
    key: "flan",
    nameEn: "Vanilla Flan",
    nameEs: "Flan de Vainilla",
    descriptionEn: "Silky vanilla custard with caramel sauce.",
    descriptionEs: "Flan de vainilla sedoso con salsa de caramelo.",
    vegetarian: true,
    glutenFree: true,
    allergens: ["dairy", "egg"],
    internalCostCents: 190,
    bands: ALL_EVENT_BANDS,
  },
  {
    category: "postre",
    key: "brownie",
    nameEn: "Chocolate Brownie",
    nameEs: "Brownie de Chocolate",
    descriptionEn: "Fudgy chocolate brownie, walnuts optional.",
    descriptionEs: "Brownie de chocolate húmedo, nueces opcionales.",
    vegetarian: true,
    allergens: ["wheat_gluten", "dairy", "egg", "tree_nut"],
    internalCostCents: 160,
    bands: ALL_EVENT_BANDS,
  },

  // Bebidas
  {
    category: "bebida",
    key: "agua_fresca",
    nameEn: "Hibiscus Water",
    nameEs: "Agua Fresca de Jamaica",
    descriptionEn: "House-made hibiscus flower agua fresca.",
    descriptionEs: "Agua fresca de flor de jamaica hecha en casa.",
    vegan: true,
    glutenFree: true,
    internalCostCents: 90,
    bands: ALL_EVENT_BANDS,
  },
  {
    category: "bebida",
    key: "cafe_de_olla",
    nameEn: "Spiced Coffee Service",
    nameEs: "Café de Olla",
    descriptionEn: "Cinnamon and piloncillo spiced coffee, served hot.",
    descriptionEs: "Café endulzado con piloncillo y canela, servido caliente.",
    vegan: true,
    glutenFree: true,
    internalCostCents: 110,
    bands: CATERING_BANDS,
  },

  // Guarniciones
  {
    category: "guarnicion",
    key: "arroz_rojo",
    nameEn: "Mexican Red Rice",
    nameEs: "Arroz Rojo",
    descriptionEn: "Rice simmered with tomato, garlic, and vegetables.",
    descriptionEs: "Arroz cocido con tomate, ajo y verduras.",
    vegan: true,
    glutenFree: true,
    internalCostCents: 90,
    bands: ALL_EVENT_BANDS,
  },
  {
    category: "guarnicion",
    key: "frijoles_charros",
    nameEn: "Charro Beans",
    nameEs: "Frijoles Charros",
    descriptionEn: "Pinto beans simmered with bacon, tomato, and onion.",
    descriptionEs: "Frijoles pintos cocidos con tocino, tomate y cebolla.",
    glutenFree: true,
    dairyFree: true,
    internalCostCents: 100,
    bands: ALL_EVENT_BANDS,
  },

  // Frozen (public catalog, no bands — published price per unit)
  {
    category: "frozen",
    key: "frozen_tamales",
    nameEn: "Frozen Pork Tamales",
    nameEs: "Tamales de Puerco Congelados",
    descriptionEn: "Hand-made pork tamales, frozen and ready to steam.",
    descriptionEs: "Tamales de puerco hechos a mano, congelados y listos para vaporizar.",
    glutenFree: true,
    internalCostCents: 700,
    publishedPriceCents: 1200,
    unit: "lb",
    minQuantity: 5,
    leadTimeDays: 2,
  },
  {
    category: "frozen",
    key: "frozen_salsa",
    nameEn: "Frozen Green Salsa",
    nameEs: "Salsa Verde Congelada",
    descriptionEn: "Tomatillo and roasted poblano salsa, frozen in bulk.",
    descriptionEs: "Salsa de tomatillo y poblano asado, congelada a granel.",
    vegan: true,
    glutenFree: true,
    internalCostCents: 300,
    publishedPriceCents: 900,
    unit: "l",
    minQuantity: 2,
    leadTimeDays: 2,
  },
];

interface SeedPackage {
  bandCode: string;
  nameEn: string;
  nameEs: string;
  descriptionEn: string;
  descriptionEs: string;
  itemKeys: string[];
}

// 2 curated packages per band — the wizard's "recommended path" (step 5).
// Sample data, clearly flagged via isSample; not a substitute for real
// admin-curated packages (no admin UI for this yet, see PROGRESS.md).
const PACKAGES: SeedPackage[] = [
  {
    bandCode: "BL_STD",
    nameEn: "Everyday Lunch",
    nameEs: "Almuerzo del Día",
    descriptionEn: "A simple, reliable lunch for the whole office.",
    descriptionEs: "Un almuerzo simple y confiable para toda la oficina.",
    itemKeys: ["chicken", "arroz_rojo", "flan", "agua_fresca"],
  },
  {
    bandCode: "BL_STD",
    nameEn: "Taco Table Lunch",
    nameEs: "Mesa de Tacos",
    descriptionEn: "Enchiladas with beans and a sweet finish.",
    descriptionEs: "Enchiladas con frijoles y un final dulce.",
    itemKeys: ["chicken_enchiladas", "frijoles_charros", "brownie", "agua_fresca"],
  },
  {
    bandCode: "BL_PLUS",
    nameEn: "Executive Lunch",
    nameEs: "Almuerzo Ejecutivo",
    descriptionEn: "Grilled skirt steak with a fresh salad and dessert.",
    descriptionEs: "Arrachera asada con ensalada fresca y postre.",
    itemKeys: ["carne_asada", "caesar_salad", "tres_leches", "agua_fresca"],
  },
  {
    bandCode: "BL_PLUS",
    nameEn: "Fiesta Lunch Deluxe",
    nameEs: "Almuerzo Fiesta Deluxe",
    descriptionEn: "Enchiladas, tropical salad, guacamole, and flan.",
    descriptionEs: "Enchiladas, ensalada tropical, guacamole y flan.",
    itemKeys: ["chicken_enchiladas", "tropical_salad", "guacamole", "flan", "agua_fresca"],
  },
  {
    bandCode: "CAT_STD",
    nameEn: "Classic Buffet",
    nameEs: "Buffet Clásico",
    descriptionEn: "A full buffet spread with a crowd-pleasing main.",
    descriptionEs: "Un buffet completo con un plato principal para todos.",
    itemKeys: ["beef_empanadas", "chicken", "caesar_salad", "arroz_rojo", "tres_leches", "agua_fresca"],
  },
  {
    bandCode: "CAT_STD",
    nameEn: "Coastal Buffet",
    nameEs: "Buffet Costero",
    descriptionEn: "Veracruz-style fish with cactus salad and guacamole.",
    descriptionEs: "Pescado a la veracruzana con ensalada de nopales y guacamole.",
    itemKeys: ["veracruz_fish", "cactus_salad", "guacamole", "flan", "cafe_de_olla"],
  },
  {
    bandCode: "CAT_PREM",
    nameEn: "Premium Reception",
    nameEs: "Recepción Premium",
    descriptionEn: "Ceviche, salmon canapés, and a full charcuterie board.",
    descriptionEs: "Ceviche, canapés de salmón y una tabla de charcutería completa.",
    itemKeys: [
      "shrimp_ceviche",
      "salmon_canape",
      "charcuterie_classic",
      "carne_asada",
      "caprese_canape",
      "tres_leches",
      "cafe_de_olla",
    ],
  },
  {
    bandCode: "CAT_PREM",
    nameEn: "Elegant Fiesta",
    nameEs: "Fiesta Elegante",
    descriptionEn: "Ham croquettes, a Mediterranean board, and Veracruz-style fish.",
    descriptionEs: "Croquetas de jamón, tabla mediterránea y pescado a la veracruzana.",
    itemKeys: ["ham_croquettes", "charcuterie_mediterranean", "veracruz_fish", "tropical_salad", "flan", "cafe_de_olla"],
  },
];

interface SeedAddon {
  category: AddonCategory;
  nameEn: string;
  nameEs: string;
  unit: AddonUnit;
  unitPriceCents: number;
  variants?: { nameEn: string; nameEs: string }[];
}

const COLOR_VARIANTS = [
  { nameEn: "White", nameEs: "Blanco" },
  { nameEn: "Ivory", nameEs: "Marfil" },
  { nameEn: "Burgundy", nameEs: "Vino" },
  { nameEn: "Black", nameEs: "Negro" },
];

// Admin-managed event add-on catalog (section 4.2). Sample data.
const ADDONS: SeedAddon[] = [
  // Staff
  { category: "staff", nameEn: "Servers / Meseros", nameEs: "Meseros", unit: "per_person_per_hour", unitPriceCents: 800 },
  { category: "staff", nameEn: "Bartender", nameEs: "Bartender", unit: "per_hour", unitPriceCents: 3500 },
  { category: "staff", nameEn: "Chef on Site", nameEs: "Chef en Sitio", unit: "per_hour", unitPriceCents: 6000 },
  { category: "staff", nameEn: "Setup Crew", nameEs: "Equipo de Montaje", unit: "per_person_per_hour", unitPriceCents: 1000 },

  // Furniture
  { category: "furniture", nameEn: "Round Table (seats 8)", nameEs: "Mesa Redonda (8 personas)", unit: "per_item", unitPriceCents: 1500 },
  { category: "furniture", nameEn: "Rectangular Table", nameEs: "Mesa Rectangular", unit: "per_item", unitPriceCents: 1200 },
  { category: "furniture", nameEn: "Chair", nameEs: "Silla", unit: "per_item", unitPriceCents: 300 },
  { category: "furniture", nameEn: "Chair Cover", nameEs: "Funda de Silla", unit: "per_item", unitPriceCents: 250, variants: COLOR_VARIANTS },
  { category: "furniture", nameEn: "Sash", nameEs: "Faja", unit: "per_item", unitPriceCents: 150, variants: COLOR_VARIANTS },

  // Linens
  { category: "linens", nameEn: "Tablecloth", nameEs: "Mantel", unit: "per_item", unitPriceCents: 800, variants: COLOR_VARIANTS },
  { category: "linens", nameEn: "Napkins", nameEs: "Servilletas", unit: "per_item", unitPriceCents: 400, variants: COLOR_VARIANTS },

  // Tableware
  { category: "tableware", nameEn: "China Place Setting", nameEs: "Vajilla de Porcelana", unit: "per_person", unitPriceCents: 400 },
  { category: "tableware", nameEn: "Charger / Bajo Plato", nameEs: "Bajo Plato", unit: "per_item", unitPriceCents: 200, variants: [
    { nameEn: "Gold", nameEs: "Dorado" },
    { nameEn: "Silver", nameEs: "Plateado" },
    { nameEn: "Clear", nameEs: "Transparente" },
  ] },
  { category: "tableware", nameEn: "Specialty Plate", nameEs: "Plato Especial", unit: "per_item", unitPriceCents: 300 },
  { category: "tableware", nameEn: "Flatware Set", nameEs: "Set de Cubiertos", unit: "per_person", unitPriceCents: 250 },
  { category: "tableware", nameEn: "Glassware", nameEs: "Cristalería", unit: "per_person", unitPriceCents: 150 },
  { category: "tableware", nameEn: "Wine Glass", nameEs: "Copa de Vino", unit: "per_item", unitPriceCents: 100 },
  { category: "tableware", nameEn: "Tumbler", nameEs: "Vaso", unit: "per_item", unitPriceCents: 75 },

  // Decor
  { category: "decor", nameEn: "Centerpiece", nameEs: "Centro de Mesa", unit: "per_item", unitPriceCents: 2500 },
  { category: "decor", nameEn: "Uplighting", nameEs: "Iluminación", unit: "per_item", unitPriceCents: 2000 },
  { category: "decor", nameEn: "Signage", nameEs: "Señalización", unit: "flat", unitPriceCents: 5000 },

  // Beverages
  { category: "beverages", nameEn: "Wine Service", nameEs: "Servicio de Vino", unit: "per_person", unitPriceCents: 1200 },
  { category: "beverages", nameEn: "Beer Service", nameEs: "Servicio de Cerveza", unit: "per_person", unitPriceCents: 800 },
  { category: "beverages", nameEn: "Soda Service", nameEs: "Servicio de Refrescos", unit: "per_person", unitPriceCents: 250 },
  { category: "beverages", nameEn: "Water Service", nameEs: "Servicio de Agua", unit: "per_person", unitPriceCents: 150 },
  { category: "beverages", nameEn: "Coffee Service", nameEs: "Servicio de Café", unit: "per_person", unitPriceCents: 300 },
];

const DEFAULT_FEE_RULES = {
  id: "default",
  taxRateBps: 825, // 8.25% — Houston-area combined TX sales tax rate
  boxLunchMinGuests: 5,
  boxLunchMinLeadDays: 2,
  cateringMinGuests: 15,
  cateringMinLeadDays: 5,
  deliveryRadiusMiles: 30,
};

async function main() {
  console.log("Seeding fee rules...");
  await db
    .insert(feeRules)
    .values(DEFAULT_FEE_RULES)
    .onConflictDoUpdate({ target: feeRules.id, set: DEFAULT_FEE_RULES });

  console.log(`Seeding ${BANDS.length} pricing bands...`);
  for (const band of BANDS) {
    await db
      .insert(pricingBands)
      .values(band)
      .onConflictDoUpdate({ target: pricingBands.code, set: band });
  }

  console.log(`Seeding ${ITEMS.length} sample menu items...`);
  const itemIdByKey: Record<string, string> = {};
  for (const item of ITEMS) {
    const { key, bands, ...values } = item;
    const [inserted] = await db
      .insert(menuItems)
      .values({ ...values, isSample: true })
      .returning({ id: menuItems.id });
    itemIdByKey[key] = inserted.id;

    if (bands?.length) {
      await db
        .insert(bandMenuItems)
        .values(bands.map((bandCode) => ({ bandCode, menuItemId: inserted.id })));
    }
  }

  console.log(`Seeding ${PACKAGES.length} sample packages...`);
  for (const pkg of PACKAGES) {
    const { itemKeys, ...pkgValues } = pkg;
    const [insertedPkg] = await db
      .insert(packages)
      .values({ ...pkgValues, isSample: true })
      .returning({ id: packages.id });

    await db.insert(packageItems).values(
      itemKeys.map((itemKey) => {
        const menuItemId = itemIdByKey[itemKey];
        if (!menuItemId) throw new Error(`Unknown seed item key "${itemKey}" in package "${pkg.nameEn}"`);
        return { packageId: insertedPkg.id, menuItemId };
      }),
    );
  }

  console.log(`Seeding ${ADDONS.length} sample add-ons...`);
  for (const addon of ADDONS) {
    const { variants, ...addonValues } = addon;
    const [inserted] = await db
      .insert(addons)
      .values({ ...addonValues, isSample: true })
      .returning({ id: addons.id });

    if (variants?.length) {
      await db.insert(addonVariants).values(variants.map((v) => ({ addonId: inserted.id, ...v })));
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
