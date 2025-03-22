const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors"); // ✅ CORS fix toegevoegd

const app = express();
const PORT = 3000;

app.use(cors()); // ✅ Laat frontend verbinding maken met backend
app.use(express.json());

app.post("/analyze", async (req, res) => {
  const { url } = req.body;

  if (!url || !url.includes("bol.com")) {
    return res.status(400).json({ error: "Geen geldige Bol.com link" });
  }

  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // ✅ Wacht 3 seconden extra met alternatief voor oudere Puppeteer versies
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 🔍 Haal data van de pagina
    const data = await page.evaluate(() => {
      const title = document.querySelector("h1")?.innerText || "Geen titel";
      const reviews = document.querySelector('[data-test="review-rating"]')?.innerText || "Geen reviews";
      const price = document.querySelector('[data-test="price"]')?.innerText || "Geen prijs";
      return { title, reviews, price };
    });

    console.log("📦 Gevonden productdata:", data); // Handig voor debuggen

    await browser.close();

    // 📊 Simpele scoreberekening (je kunt dit later uitbreiden)
    const score = data.reviews.includes("5") ? 9 : 6;

    res.json({ ...data, score });
  } catch (err) {
    console.error("❌ Scrape-fout:", err.message);
    res.status(500).json({ error: "Fout bij het scrapen", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server draait op http://localhost:${PORT}`);
});
