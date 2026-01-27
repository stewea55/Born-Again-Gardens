import "dotenv/config";
import { db } from "../server/db";
import { plants } from "../shared/schema";
import { eq, or, ilike } from "drizzle-orm";

// Photo search using Unsplash API (free, reliable)
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || "";

async function searchUnsplashPhoto(query: string): Promise<string | null> {
  try {
    if (!UNSPLASH_ACCESS_KEY) {
      console.warn("  ⚠️  No Unsplash API key. Add UNSPLASH_ACCESS_KEY to .env file.");
      return null;
    }
    
    const searchQuery = encodeURIComponent(query);
    const url = `https://api.unsplash.com/search/photos?query=${searchQuery}&per_page=3&orientation=squarish`;
    
    const response = await fetch(url, {
      headers: {
        "Authorization": `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Get the regular-sized image (good quality, reasonable size)
      const photo = data.results[0];
      return photo.urls.regular || photo.urls.small || photo.urls.full;
    }
    
    return null;
  } catch (error: any) {
    console.warn(`  ⚠️  Could not fetch photo: ${error.message}`);
    return null;
  }
}

function findBestPhotoQuery(plantName: string, category: string): string {
  const cleanName = plantName.split("(")[0].trim();
  return `${cleanName} plant`;
}

async function fixPlantPhotos() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    const forceUpdate = args.includes("--force") || args.includes("-f");
    const plantNames = args.filter(arg => !arg.startsWith("--") && !arg.startsWith("-"));
    
    console.log("\n📸 Fix Plant Photos\n");
    
    if (!UNSPLASH_ACCESS_KEY) {
      console.log("⚠️  No Unsplash API key found!");
      console.log("   Add UNSPLASH_ACCESS_KEY to your .env file\n");
      process.exit(1);
    }
    
    // Get plants from database
    let allPlants;
    if (plantNames.length > 0) {
      // Search for specific plants by name
      const conditions = plantNames.map(name => ilike(plants.name, `%${name}%`));
      allPlants = await db.select().from(plants).where(or(...conditions));
      console.log(`Found ${allPlants.length} plants matching: ${plantNames.join(", ")}\n`);
    } else {
      allPlants = await db.select().from(plants);
      console.log(`Found ${allPlants.length} plants in database\n`);
    }
    
    if (allPlants.length === 0) {
      console.log("No plants found to update.\n");
      process.exit(0);
    }
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const plant of allPlants) {
      // Skip if plant already has an image and not forcing update
      if (!forceUpdate && plant.imageUrl && plant.imageUrl.trim() !== "") {
        console.log(`⏭️  Skipping "${plant.name}" (already has photo)`);
        console.log(`    Current: ${plant.imageUrl.substring(0, 60)}...`);
        skipped++;
        continue;
      }
      
      try {
        if (forceUpdate && plant.imageUrl) {
          console.log(`🔄 Updating "${plant.name}"...`);
          console.log(`   Old: ${plant.imageUrl.substring(0, 60)}...`);
        } else {
          console.log(`🔍 Searching for: "${plant.name}"...`);
        }
        
        // Create search query
        const searchQuery = findBestPhotoQuery(plant.name, plant.category || "plant");
        
        // Search for photo
        const photoUrl = await searchUnsplashPhoto(searchQuery);
        
        if (photoUrl) {
          // Update plant with photo URL
          await db
            .update(plants)
            .set({ imageUrl: photoUrl })
            .where(eq(plants.id, plant.id));
          
          console.log(`   ✅ Updated!`);
          console.log(`   New: ${photoUrl.substring(0, 60)}...`);
          updated++;
        } else {
          console.log(`   ⚠️  No photo found for "${plant.name}"`);
          errors++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: any) {
        console.error(`   ❌ Error processing "${plant.name}":`, error.message);
        errors++;
      }
    }
    
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📊 PHOTO UPDATE SUMMARY`);
    console.log(`${"=".repeat(60)}`);
    console.log(`✅ Updated photos: ${updated} plants`);
    if (!forceUpdate) {
      console.log(`⏭️  Skipped (already have photos): ${skipped} plants`);
    }
    console.log(`⚠️  Not found/errors: ${errors} plants`);
    console.log(`${"=".repeat(60)}\n`);
    
    if (updated > 0) {
      console.log("✨ Photos have been updated!");
    }
    
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

// Show usage if help requested
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
📸 Fix Plant Photos Script

Usage:
  npm run fix-photos                    # Update only plants without photos
  npm run fix-photos -- --force         # Force update ALL plants (replace existing)
  npm run fix-photos -- Radishes        # Update specific plant(s) by name
  npm run fix-photos -- --force Radishes Fig  # Force update specific plants

Options:
  --force, -f    Force update even if plant already has a photo
  --help, -h     Show this help message

Examples:
  npm run fix-photos -- --force                    # Replace all photos
  npm run fix-photos -- Tomatoes                  # Update only Tomatoes
  npm run fix-photos -- --force Radishes Carrots  # Force update Radishes and Carrots
`);
  process.exit(0);
}

fixPlantPhotos();
