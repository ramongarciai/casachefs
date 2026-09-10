import "./load-env";

import { db } from "./index";
import { menuItems } from "./schema/menu";
import { pricingBands, bandMenuItems } from "./schema/pricing";
import { feeRules } from "./schema/fee-rules";
import { PRICING_BANDS_SEED_DATA as BANDS } from "./pricing-bands-data";
import type { menuCategoryEnum, allergenEnum } from "./schema/menu";

type Allergen = (typeof allergenEnum.enumValues)[number];
type Category = (typeof menuCategoryEnum.enumValues)[number];

interface SeedItem {
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
  for (const item of ITEMS) {
    const { bands, ...values } = item;
    const [inserted] = await db
      .insert(menuItems)
      .values({ ...values, isSample: true })
      .returning({ id: menuItems.id });

    if (bands?.length) {
      await db
        .insert(bandMenuItems)
        .values(bands.map((bandCode) => ({ bandCode, menuItemId: inserted.id })));
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
