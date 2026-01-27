import ExcelJS from "exceljs";
import { readFile } from "fs/promises";

const excelPath = process.argv[2];

if (!excelPath) {
  console.error("Usage: tsx script/validate-excel.ts <path-to-excel-file>");
  process.exit(1);
}

const validMonths = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

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
  if (validMonths.some(m => m.toLowerCase() === lower)) {
    return trimmed;
  }
  // Check if it's an abbreviation
  const abbr = lower.substring(0, 3);
  if (monthAbbrMap[abbr]) {
    return monthAbbrMap[abbr];
  }
  return trimmed; // Return as-is if can't normalize
}

const validCategories = ["fruit", "vegetable", "herb", "flower"];

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

function normalizeCategory(cat: string): string | null {
  const lower = cat.toLowerCase().trim();
  if (validCategories.includes(lower)) {
    return lower;
  }
  // Check mappings
  if (categoryMap[lower]) {
    return categoryMap[lower];
  }
  return null;
}
const validStatuses = ["ready", "coming_soon", "out_of_season"];

async function validateExcel() {
  try {
    console.log(`\n🔍 Validating Excel file: ${excelPath}\n`);
    
    const fileBuffer = await readFile(excelPath);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    
    if (workbook.worksheets.length === 0) {
      console.error("❌ No worksheets found!");
      process.exit(1);
    }
    
    const worksheet = workbook.worksheets[0];
    const sheetName = worksheet.name;
    
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
    
    if (rows.length === 0) {
      console.error("❌ No data rows found!");
      process.exit(1);
    }
    
    console.log(`✅ Found ${rows.length} rows\n`);
    
    // Accept multiple column name formats
    const requiredColumns = ["Plant Name", "name", "plant name", "plant_name"];
    // Convert headers object to array of header values
    const columns = Object.values(headers).filter(h => h && !h.startsWith("Column"));
    console.log("📋 Detected columns:");
    columns.forEach(col => console.log(`   - ${col}`));
    console.log();
    
    // Check if we have a name column (any format)
    const hasNameColumn = columns.some(col => {
      const colLower = col.toLowerCase();
      return colLower === "name" || 
             colLower === "plant name" || 
             colLower === "plant_name" ||
             colLower.includes("name");
    });
    
    if (!hasNameColumn) {
      console.error(`❌ Missing required column: Plant Name (or 'name')`);
      console.error(`   Found columns: ${columns.join(", ")}`);
      process.exit(1);
    }
    
    let errors: string[] = [];
    let warnings: string[] = [];
    let rowNum = 2;
    
    for (const row of rows) {
      // Try multiple column name variations
      const plantName = row["Plant Name"] || row["plant name"] || row["Name"] || row["name"] || row["plant_name"];
      
      if (!plantName || String(plantName).trim() === "") {
        warnings.push(`Row ${rowNum}: Missing plant name`);
        rowNum++;
        continue;
      }
      
      const category = row["Category"] || row["category"];
      if (category) {
        const normalized = normalizeCategory(String(category));
        if (!normalized) {
          errors.push(`Row ${rowNum} (${plantName}): Invalid category "${category}". Must be: ${validCategories.join(", ")}`);
        }
      }
      
      const harvestStart = row["Harvest Start"] || row["harvest start"] || row["harvest_start"];
      if (harvestStart) {
        const normalized = normalizeMonth(String(harvestStart));
        if (!validMonths.includes(normalized)) {
          warnings.push(`Row ${rowNum} (${plantName}): Harvest start "${harvestStart}" will be converted to "${normalized}"`);
        }
      }
      
      const harvestEnd = row["Harvest End"] || row["harvest end"] || row["harvest_end"];
      if (harvestEnd) {
        const normalized = normalizeMonth(String(harvestEnd));
        if (!validMonths.includes(normalized)) {
          warnings.push(`Row ${rowNum} (${plantName}): Harvest end "${harvestEnd}" will be converted to "${normalized}"`);
        }
      }
      
      const donation = row["Suggested Donation"] || row["suggested donation"] || row["suggested_donation"] || row["Suggested Donation"];
      if (donation !== undefined && donation !== null && donation !== "") {
        const num = parseFloat(String(donation).replace(/[$,\s]/g, ""));
        if (isNaN(num)) {
          errors.push(`Row ${rowNum} (${plantName}): Invalid price "${donation}". Must be a number.`);
        }
      }
      
      rowNum++;
    }
    
    console.log("=".repeat(60));
    if (errors.length === 0 && warnings.length === 0) {
      console.log("✅ VALIDATION PASSED - Your Excel file is ready to import!");
    } else {
      if (errors.length > 0) {
        console.log(`❌ ${errors.length} ERROR(S) FOUND (must fix before import):`);
        errors.forEach(e => console.log(`   ${e}`));
      }
      if (warnings.length > 0) {
        console.log(`\n⚠️  ${warnings.length} WARNING(S) (will be handled automatically):`);
        warnings.forEach(w => console.log(`   ${w}`));
      }
    }
    console.log("=".repeat(60));
    console.log("\n💡 Tips:");
    console.log("   - Excel formulas are automatically converted to values ✅");
    console.log("   - Missing Status will be calculated from Harvest Start/End ✅");
    console.log("\n");
    
    if (errors.length > 0) {
      process.exit(1);
    }
    
  } catch (error: any) {
    console.error("\n❌ Validation error:", error.message);
    process.exit(1);
  }
}

validateExcel();
