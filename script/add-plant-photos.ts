import "dotenv/config";
import { db } from "../server/db";
import { plants } from "../shared/schema";
import { eq } from "drizzle-orm";

// Photo search using Unsplash API (free, reliable)
// Get your free API key: https://unsplash.com/developers (takes 2 minutes)

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || "";

async function searchUnsplashPhoto(query: string): Promise<string | null> {
  try {
    if (!UNSPLASH_ACCESS_KEY) {
      console.warn("  ⚠️  No Unsplash API key. Add UNSPLASH_ACCESS_KEY to .env file.");
      console.warn("  💡 Get free key: https://unsplash.com/developers");
      return null;
    }
    
    const searchQuery = encodeURIComponent(query);
    const url = `https://api.unsplash.com/search/photos?query=${searchQuery}&per_page=1&orientation=squarish`;
    
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
  // Clean plant name (remove parenthetical info)
  const cleanName = plantName.split("(")[0].trim();
  
  // Create search queries in order of preference
  const queries = [
    `${cleanName} plant`,        // e.g., "tomato plant"
    `${cleanName} ${category}`,  // e.g., "tomato vegetable"  
    cleanName,                   // e.g., "tomato"
  ];
  
  return queries[0];
}

async function addPlantPhotos() {
  try {
    console.log("\n📸 Finding photos for your plants...\n");
    
    if (!UNSPLASH_ACCESS_KEY) {
      console.log("⚠️  No Unsplash API key found!");
      console.log("\n📝 To get photos automatically:");
      console.log("   1. Go to: https://unsplash.com/developers");
      console.log("   2. Click 'Register as a developer' (free)");
      console.log("   3. Create a new application");
      console.log("   4. Copy your 'Access Key'");
      console.log("   5. Add to .env file: UNSPLASH_ACCESS_KEY=your_key_here");
      console.log("\n   Then run this script again!\n");
      process.exit(0);
    }
    
    // Get all plants from database
    const allPlants = await db.select().from(plants);
    console.log(`Found ${allPlants.length} plants in database\n`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const plant of allPlants) {
      // Skip if plant already has an image
      if (plant.imageUrl && plant.imageUrl.trim() !== "") {
        console.log(`⏭️  Skipping "${plant.name}" (already has photo)`);
        skipped++;
        continue;
      }
      
      try {
        console.log(`🔍 Searching for: "${plant.name}"...`);
        
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
          
          console.log(`  ✅ Added photo!`);
          updated++;
        } else {
          console.log(`  ⚠️  No photo found for "${plant.name}"`);
          errors++;
        }
        
        // Small delay to avoid rate limiting (Unsplash allows 50 requests/hour in demo mode)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: any) {
        console.error(`  ❌ Error processing "${plant.name}":`, error.message);
        errors++;
      }
    }
    
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📊 PHOTO SEARCH SUMMARY`);
    console.log(`${"=".repeat(60)}`);
    console.log(`✅ Added photos: ${updated} plants`);
    console.log(`⏭️  Skipped (already have photos): ${skipped} plants`);
    console.log(`⚠️  Not found/errors: ${errors} plants`);
    console.log(`${"=".repeat(60)}\n`);
    
    if (updated > 0) {
      console.log("✨ Photos are now visible on your website!");
      console.log("💡 Tip: Run this script again anytime to add photos to new plants.\n");
    }
    
    if (errors > 0) {
      console.log("💡 For plants without photos, you can:");
      console.log("   1. Manually add URLs in Supabase Table Editor");
      console.log("   2. Add URLs to Excel and re-import\n");
    }
    
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

addPlantPhotos();
