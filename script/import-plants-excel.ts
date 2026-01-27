import "dotenv/config";
import ExcelJS from "exceljs";
import { readFile } from "fs/promises";
import { db } from "../server/db";
import { plants } from "../shared/schema";
import { eq, ilike } from "drizzle-orm";
import type { PlantCategory, PlantStatus } from "../shared/schema";

const excelPath = process.argv[2];

if (!excelPath) {
  console.error("Usage: tsx script/import-plants-excel.ts <path-to-excel-file>");
  process.exit(1);
}

const monthMap: Record<string, number> = {
  "january": 0, "february": 1, "march": 2, "april": 3, "may": 4, "june": 5,
  "july": 6, "august": 7, "september": 8, "october": 9, "november": 10, "december": 11,
};

// Month abbreviation mapping
const monthAbbrMap: Record<string, string> = {
  "jan": "January", "feb": "February", "mar": "March", "apr": "April",
  "may": "May", "jun": "June", "jul": "July", "aug": "August",
  "sep": "September", "oct": "October", "nov": "November", "dec": "December"
};

function normalizeMonth(month: string): string {
  const trimmed = month.trim();
  const lower = trimmed.toLowerCase();
  // Check if it's already a full month name
  const validMonths = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  if (validMonths.some(m => m.toLowerCase() === lower)) {
    return trimmed;
  }
  // Check if it's an abbreviation
  const abbr = lower.substring(0, 3);
  if (monthAbbrMap[abbr]) {
    return monthAbbrMap[abbr];
  }
  return trimmed;
}

// Category mapping for variations
const categoryMap: Record<string, string> = {
  "fruit tree": "fruit",
  "berry": "fruit",
  "vine fruit": "fruit",
  "fruits": "fruit",
  "vegetables": "vegetable",
  "herbs": "herb",
  "flowers": "flower"
};

function calculateStatusFromHarvest(harvestStart: string | null, harvestEnd: string | null): PlantStatus {
  if (!harvestStart || !harvestEnd) return "out_of_season";

  const currentMonth = new Date().getMonth();
  const start = monthMap[harvestStart.toLowerCase().trim()];
  const end = monthMap[harvestEnd.toLowerCase().trim()];

  if (start === undefined || end === undefined) return "out_of_season";

  const isInSeason = start <= end
    ? (currentMonth >= start && currentMonth <= end)
    : (currentMonth >= start || currentMonth <= end);

  if (isInSeason) return "ready";

  const nextMonth = (currentMonth + 1) % 12;
  const twoMonthsOut = (currentMonth + 2) % 12;
  const comingSoon = start <= end
    ? (nextMonth >= start && nextMonth <= end) || (twoMonthsOut >= start && twoMonthsOut <= end)
    : (nextMonth >= start || nextMonth <= end) || (twoMonthsOut >= start || twoMonthsOut <= end);

  return comingSoon ? "coming_soon" : "out_of_season";
}

function getValue(row: any, ...names: string[]): any {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== "") {
      return row[name];
    }
  }
  return undefined;
}

function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,\s]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}

function toBoolean(value: any): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    return ["true", "yes", "1", "y"].includes(lower);
  }
  if (typeof value === "number") return value !== 0;
  return false;
}

function validateCategory(cat: any): PlantCategory | null {
  if (!cat) return null;
  const normalized = String(cat).toLowerCase().trim();
  const valid: PlantCategory[] = ["fruit", "vegetable", "herb", "flower"];
  if (valid.includes(normalized as PlantCategory)) {
    return normalized as PlantCategory;
  }
  // Check category mappings
  if (categoryMap[normalized]) {
    return categoryMap[normalized] as PlantCategory;
  }
  return null;
}

function validateStatus(status: any): PlantStatus | null {
  if (!status) return null;
  const normalized = String(status).toLowerCase().trim().replace(/\s+/g, "_");
  const valid: PlantStatus[] = ["ready", "coming_soon", "out_of_season"];
  if (valid.includes(normalized as PlantStatus)) return normalized as PlantStatus;
  if (normalized.includes("ready") || normalized === "available") return "ready";
  if (normalized.includes("soon") || normalized.includes("coming")) return "coming_soon";
  if (normalized.includes("out") || normalized.includes("season")) return "out_of_season";
  return null;
}

async function findPlant(name: string) {
  if (!name) return null;
  const cleanName = name.trim();
  const [exact] = await db.select().from(plants).where(ilike(plants.name, cleanName));
  if (exact) return exact;
  const allPlants = await db.select().from(plants);
  return allPlants.find(p => 
    p.name.toLowerCase().includes(cleanName.toLowerCase()) ||
    cleanName.toLowerCase().includes(p.name.toLowerCase())
  ) || null;
}

async function importPlants() {
  try {
    console.log(`\n📖 Reading Excel file: ${excelPath}...`);
    const fileBuffer = await readFile(excelPath);
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    if (workbook.worksheets.length === 0) {
      console.error("❌ No worksheets found!");
      process.exit(1);
    }

    const worksheet = workbook.worksheets[0];
    const sheetName = worksheet.name;
    console.log(`📄 Using sheet: "${sheetName}"`);
    
    // Convert ExcelJS rows to objects (similar to sheet_to_json)
    const rows: any[] = [];
    const headers: Record<number, string> = {};
    
    // Get headers from first row and determine column count
    const headerRow = worksheet.getRow(1);
    let maxColumn = 0;
    headerRow.eachCell((cell, colNumber) => {
      const headerValue = cell.value;
      headers[colNumber] = headerValue ? String(headerValue).trim() : `Column${colNumber}`;
      maxColumn = Math.max(maxColumn, colNumber);
    });
    
    // Convert data rows to objects
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      
      const rowData: any = {};
      // Iterate through all columns up to maxColumn
      for (let colNumber = 1; colNumber <= maxColumn; colNumber++) {
        const header = headers[colNumber];
        if (header) {
          const cell = row.getCell(colNumber);
          // ExcelJS returns values as their actual types (numbers, strings, dates)
          // For formulas, ExcelJS automatically evaluates them
          const value = cell.value;
          rowData[header] = value !== null && value !== undefined ? value : null;
        }
      }
      rows.push(rowData);
    });
    
    console.log(`✅ Found ${rows.length} rows\n`);
    
    if (rows.length === 0) {
      console.error("❌ No data found!");
      process.exit(1);
    }
    
    let updated = 0;
    let created = 0;
    let notFound: string[] = [];
    let errors: Array<{ name: string; error: string }> = [];
    let skipped = 0;
    let statusUpdated = 0;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        const plantName = getValue(row, "Plant Name", "name", "plant name", "plant_name", "Name");
        
        if (!plantName || String(plantName).trim() === "") {
          skipped++;
          continue;
        }
        
        const nameStr = String(plantName).trim();
        const plant = await findPlant(nameStr);
        
        // Get all the data from Excel row (try both formats: with spaces and with underscores)
        const scientificName = getValue(row, "Scientific Name", "scientific_name", "scientific name");
        const category = getValue(row, "Category", "category");
        const description = getValue(row, "Description", "description");
        const harvestStart = getValue(row, "Harvest Start", "harvest_start", "harvest start");
        const harvestEnd = getValue(row, "Harvest End", "harvest_end", "harvest end");
        const companionPlants = getValue(row, "Companion Plants", "companion_plants", "companion plants");
        const price = getValue(row, "Suggested Donation", "suggested_donation", "suggested donation");
        const imageUrl = getValue(row, "Image URL", "image_url", "image url");
        const status = getValue(row, "Status", "status");
        const inStock = getValue(row, "In Stock", "in_stock", "in stock");
        const unit = getValue(row, "Unit", "unit");
        
        // Prepare plant data
        const plantData: any = {
          name: nameStr,
        };
        
        if (scientificName) plantData.scientificName = String(scientificName).trim();
        if (category) {
          const valid = validateCategory(category);
          if (valid) plantData.category = valid;
          else plantData.category = "vegetable"; // Default if invalid
        } else {
          plantData.category = "vegetable"; // Required field, use default
        }
        
        if (description) plantData.description = String(description).trim();
        if (harvestStart) plantData.harvestStart = normalizeMonth(String(harvestStart));
        if (harvestEnd) plantData.harvestEnd = normalizeMonth(String(harvestEnd));
        if (companionPlants) plantData.companionPlants = String(companionPlants).trim();
        if (price !== undefined) {
          const priceNum = toNumber(price);
          if (priceNum !== null) plantData.suggestedDonation = priceNum.toFixed(2);
        }
        if (imageUrl) plantData.imageUrl = String(imageUrl).trim();
        if (unit) plantData.unit = String(unit).trim();
        
        // Calculate status from harvest months
        let calculatedStatus: PlantStatus | null = null;
        if (status) {
          const valid = validateStatus(status);
          if (valid) plantData.status = valid;
        }
        
        if (!plantData.status) {
          const start = plantData.harvestStart || (plant?.harvestStart || null);
          const end = plantData.harvestEnd || (plant?.harvestEnd || null);
          calculatedStatus = calculateStatusFromHarvest(start, end);
          if (calculatedStatus) {
            plantData.status = calculatedStatus;
            statusUpdated++;
          } else {
            plantData.status = "out_of_season"; // Default
          }
        }
        
        // Set inStock
        if (inStock !== undefined) {
          plantData.inStock = toBoolean(inStock);
        } else if (calculatedStatus) {
          plantData.inStock = calculatedStatus === "ready";
        } else {
          plantData.inStock = plantData.status === "ready";
        }
        
        if (plant) {
          // Update existing plant
          const updateData: any = {};
          Object.keys(plantData).forEach(key => {
            if (key !== "name" && plantData[key] !== undefined && plantData[key] !== null) {
              updateData[key] = plantData[key];
            }
          });
          
          if (Object.keys(updateData).length > 0) {
            await db.update(plants).set(updateData).where(eq(plants.id, plant.id));
            console.log(`✅ Updated: ${nameStr}`);
            updated++;
          }
        } else {
          // Create new plant
          try {
            await db.insert(plants).values(plantData);
            console.log(`✨ Created: ${nameStr}`);
            created++;
          } catch (error: any) {
            console.error(`❌ Failed to create ${nameStr}:`, error.message);
            errors.push({ name: nameStr, error: error.message });
          }
        }
      } catch (error: any) {
        const name = getValue(row, "Plant Name", "name") || `Row ${i + 2}`;
        errors.push({ name: String(name), error: error.message });
      }
    }
    
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📊 IMPORT SUMMARY`);
    console.log(`${"=".repeat(60)}`);
    console.log(`✨ Created: ${created} new plants`);
    console.log(`✅ Updated: ${updated} existing plants`);
    if (statusUpdated > 0) {
      console.log(`📅 Auto-calculated status: ${statusUpdated} plants`);
    }
    console.log(`⏭️  Skipped: ${skipped} rows`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`${"=".repeat(60)}\n`);
    
    console.log("✨ All Excel formulas were converted to values!");
    console.log("✅ Data is now compatible with Supabase!\n");
    
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

importPlants();