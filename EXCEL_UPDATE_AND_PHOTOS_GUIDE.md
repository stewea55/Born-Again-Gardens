# Excel Updates, Production, and Photos Guide

## 1. ✅ Updating Your Excel File

### How It Works:
**YES!** When you update your Excel file and run the import again, it will update Supabase automatically.

### Step-by-Step:
1. **Edit your Excel file** (`BAG Garden Plant Catalog.xlsx`)
   - Change prices
   - Update descriptions
   - Add new plants
   - Change harvest months
   - Update anything!

2. **Run the import command:**
   ```bash
   npm run import-plants "C:\Users\stewe\Desktop\Bornagain\BAG Garden Plant Catalog.xlsx"
   ```

3. **What happens:**
   - ✅ Existing plants get **updated** with new data
   - ✅ New plants get **created**
   - ✅ Formulas are converted to values automatically
   - ✅ Status is recalculated from harvest months

### Example:
- Change "Tomatoes" price from $2.50 to $3.00 in Excel
- Run import → Supabase price updates to $3.00
- Your website shows the new price immediately!

---

## 2. 🚀 Production Deployment

### Option A: Run Import on Production Server (Recommended)

**When you deploy to production:**

1. **Upload your Excel file to the server** (via FTP, SSH, or your hosting platform)

2. **SSH into your server** and run:
   ```bash
   npm run import-plants "path/to/your/excel/file.xlsx"
   ```

3. **Done!** Your production database is updated.

**Pros:** Simple, direct control  
**Cons:** Requires server access

---

### Option B: Admin Dashboard Upload (Best for Non-Technical Users)

**I can add this feature for you!** It would let you:
- Log into `/admin`
- Click "Import Plants"
- Upload Excel file through the browser
- Data updates automatically

**Pros:** No server access needed, easy to use  
**Cons:** Requires me to build this feature

---

### Option C: Update from Your Local Computer

**If your production Supabase is accessible from your computer:**

1. Make sure your `.env` has the **production** `DATABASE_URL`
2. Update Excel locally
3. Run: `npm run import-plants "your-file.xlsx"`
4. It updates production Supabase directly!

**Pros:** No server access needed  
**Cons:** Requires production database access from your computer

---

## 3. 📸 Adding Plant Photos

### Method 1: Add URLs Directly to Excel (Easiest)

**Step 1: Find Photos**
- Go to [Unsplash.com](https://unsplash.com) or [Pexels.com](https://pexels.com)
- Search for your plant (e.g., "tomato plant", "basil herb")
- Click on a photo you like
- Right-click → "Copy image address" or "Copy image URL"
- You'll get a URL like: `https://images.unsplash.com/photo-1234567890`

**Step 2: Add to Excel**
- Open your Excel file
- Find the plant row
- Paste the URL in the `Image URL` column (or `image_url` column)
- Save Excel

**Step 3: Import**
- Run: `npm run import-plants "your-file.xlsx"`
- Photos appear on your website!

---

### Method 2: Add URLs Directly in Supabase

1. Go to [supabase.com](https://supabase.com) → Your project
2. Click "Table Editor" → `plants` table
3. Find the plant row
4. Click to edit
5. Paste photo URL in `image_url` field
6. Save

**Pros:** Quick for individual plants  
**Cons:** Manual, one at a time

---

### Method 3: Use a Photo Search Script (I Can Create This!)

I can create a script that:
- Searches Unsplash/Pexels for each plant
- Finds the best matching photo
- Automatically adds URLs to your database

**Would you like me to create this?**

---

## 📋 Quick Reference

### To Update Data:
```bash
# 1. Edit Excel file
# 2. Run this command:
npm run import-plants "C:\Users\stewe\Desktop\Bornagain\BAG Garden Plant Catalog.xlsx"
```

### To Add Photos:
1. Find photo on Unsplash/Pexels
2. Copy image URL
3. Add to Excel `Image URL` column OR Supabase `image_url` field
4. Run import (if using Excel)

### For Production:
- Upload Excel to server → Run import command
- OR: I can add admin upload feature
- OR: Update from local if you have production DB access

---

## 💡 Tips

1. **Excel formulas are OK** - They're converted automatically ✅
2. **Photos can be added anytime** - Just update the `image_url` field
3. **Updates are safe** - The script updates existing plants, doesn't delete them
4. **Test locally first** - Make sure everything works before production

---

## 🎯 Next Steps

1. ✅ Your Excel file is compatible with Supabase
2. ✅ Import script works and creates/updates plants
3. 🔄 **Next:** Add photos to your Excel file or Supabase
4. 🚀 **Then:** Deploy to production using one of the methods above

Need help with any of this? Just ask!
