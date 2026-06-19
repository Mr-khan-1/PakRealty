import express from 'express';
import Property from '../models/Property.js';

const router = express.Router();

// Helper to convert units to Marla for area price standardization
const convertAreaToMarla = (value, unit) => {
  if (!value) return 0;
  const u = unit.toLowerCase();
  if (u === 'marla') return value;
  if (u === 'kanal') return value * 20;
  if (u === 'canal') return value * 20;
  if (u === 'sqft') return value / 225; // standard Pakistani marla is 225 sqft
  if (u === 'sqm') return value / 20.9;
  return value;
};

// Route: Get general investor statistics and bargains
router.get('/stats', async (req, res) => {
  try {
    const properties = await Property.find({ isVerified: true });
    
    // Group properties by City + Area + Purpose
    const groups = {};
    
    properties.forEach((prop) => {
      const city = prop.location?.city;
      const area = prop.location?.area;
      const purpose = prop.purpose; // 'sale' or 'rent'
      
      if (!city || !area || !purpose) return;
      
      const key = `${city}::${area}`;
      if (!groups[key]) {
        groups[key] = { city, area, salePrices: [], rentPrices: [], saleAreas: [], rentAreas: [] };
      }
      
      const marlaVal = convertAreaToMarla(prop.area?.value, prop.area?.unit || 'marla');
      
      if (purpose === 'sale') {
        groups[key].salePrices.push(prop.price);
        if (marlaVal > 0) groups[key].saleAreas.push({ price: prop.price, marlas: marlaVal });
      } else {
        groups[key].rentPrices.push(prop.price);
        if (marlaVal > 0) groups[key].rentAreas.push({ price: prop.price, marlas: marlaVal });
      }
    });

    const stats = [];
    
    // Process groups to calculate yields and averages
    Object.keys(groups).forEach((key) => {
      const g = groups[key];
      const avgSale = g.salePrices.length > 0 ? (g.salePrices.reduce((a, b) => a + b, 0) / g.salePrices.length) : 0;
      const avgRent = g.rentPrices.length > 0 ? (g.rentPrices.reduce((a, b) => a + b, 0) / g.rentPrices.length) : 0;
      
      // Yield calculation: (avgRent * 12) / avgSale * 100
      const yieldPct = (avgSale > 0 && avgRent > 0) ? ((avgRent * 12) / avgSale) * 100 : 0;
      
      // Calculate average price per Marla
      let totalSaleMarlaPrice = 0;
      g.saleAreas.forEach((item) => {
        totalSaleMarlaPrice += item.price / item.marlas;
      });
      const avgPricePerMarla = g.saleAreas.length > 0 ? (totalSaleMarlaPrice / g.saleAreas.length) : 0;

      stats.push({
        city: g.city,
        area: g.area,
        averageSalePrice: Math.round(avgSale),
        averageRentPrice: Math.round(avgRent),
        rentalYield: parseFloat(yieldPct.toFixed(2)),
        averagePricePerMarla: Math.round(avgPricePerMarla),
        totalListings: g.salePrices.length + g.rentPrices.length
      });
    });

    // Detect under-valued properties (bargains)
    // A property is under-valued if its price per Marla is >15% lower than the area average price per Marla
    const bargains = [];
    for (const prop of properties) {
      if (prop.purpose !== 'sale' || !prop.location?.city || !prop.location?.area) continue;
      
      const city = prop.location.city;
      const area = prop.location.area;
      const areaStats = stats.find((s) => s.city === city && s.area === area);
      
      if (!areaStats || areaStats.averagePricePerMarla === 0) continue;
      
      const marlaVal = convertAreaToMarla(prop.area?.value, prop.area?.unit || 'marla');
      if (marlaVal <= 0) continue;
      
      const propPricePerMarla = prop.price / marlaVal;
      const discount = (areaStats.averagePricePerMarla - propPricePerMarla) / areaStats.averagePricePerMarla;
      
      if (discount >= 0.15) {
        bargains.push({
          property: {
            _id: prop._id,
            title: prop.title,
            price: prop.price,
            city: prop.location.city,
            area: prop.location.area,
            thumbnail: prop.thumbnail || prop.images?.[0]?.url,
            bedrooms: prop.bedrooms,
            bathrooms: prop.bathrooms,
            areaValue: prop.area.value,
            areaUnit: prop.area.unit
          },
          averageAreaPrice: Math.round(areaStats.averageSalePrice),
          pricePerMarla: Math.round(propPricePerMarla),
          areaAveragePerMarla: Math.round(areaStats.averagePricePerMarla),
          discountPercentage: parseFloat((discount * 100).toFixed(1))
        });
      }
    }

    // Sort bargains by highest discount percentage
    bargains.sort((a, b) => b.discountPercentage - a.discountPercentage);

    res.json({
      success: true,
      stats: stats.sort((a, b) => b.rentalYield - a.rentalYield),
      bargains: bargains.slice(0, 10) // top 10 bargains
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route: Evaluation Wizard for custom investment plan
router.post('/wizard', async (req, res) => {
  try {
    const { budget, city, strategy } = req.body;
    
    if (!budget || !city || !strategy) {
      return res.status(400).json({ error: 'Please provide budget, city, and investment strategy' });
    }

    const budgetNum = parseInt(budget);
    const properties = await Property.find({ isVerified: true, 'location.city': city });
    
    // Group properties by area
    const areaMap = {};
    properties.forEach((prop) => {
      const area = prop.location?.area;
      if (!area) return;
      
      if (!areaMap[area]) {
        areaMap[area] = { area, city, salePrices: [], rentPrices: [], areaSizes: [] };
      }
      
      if (prop.purpose === 'sale') {
        areaMap[area].salePrices.push(prop.price);
        const marlaVal = convertAreaToMarla(prop.area?.value, prop.area?.unit || 'marla');
        if (marlaVal > 0) areaMap[area].areaSizes.push(marlaVal);
      } else {
        areaMap[area].rentPrices.push(prop.price);
      }
    });

    const sectorsList = [];
    Object.keys(areaMap).forEach((areaName) => {
      const a = areaMap[areaName];
      const avgSale = a.salePrices.length > 0 ? (a.salePrices.reduce((x, y) => x + y, 0) / a.salePrices.length) : 0;
      const avgRent = a.rentPrices.length > 0 ? (a.rentPrices.reduce((x, y) => x + y, 0) / a.rentPrices.length) : 0;
      const yieldPct = (avgSale > 0 && avgRent > 0) ? ((avgRent * 12) / avgSale) * 100 : 0;
      const avgSize = a.areaSizes.length > 0 ? (a.areaSizes.reduce((x, y) => x + y, 0) / a.areaSizes.length) : 0;
      
      sectorsList.push({
        area: a.area,
        averagePrice: avgSale,
        averageRent: avgRent,
        rentalYield: parseFloat(yieldPct.toFixed(2)),
        averageSizeMarla: parseFloat(avgSize.toFixed(1))
      });
    });

    // Score and rank sectors based on budget fit and strategy
    // If strategy = rental: prioritize higher yield
    // If strategy = capital: prioritize prestigious areas with higher base prices (historical appreciation indicator)
    const scoredSectors = sectorsList.map((sector) => {
      let score = 0;
      
      // 1. Budget Fit Score
      // Standard size in marlas that can be bought with user's budget in this area
      const pricePerMarla = sector.averageSizeMarla > 0 ? (sector.averagePrice / sector.averageSizeMarla) : (sector.averagePrice / 5 || 1);
      const purchasableMarlas = budgetNum / pricePerMarla;
      
      let budgetFitScore = 0;
      if (purchasableMarlas >= 5 && purchasableMarlas <= 20) {
        budgetFitScore = 100; // sweet spot: user can buy a complete house (5 to 20 marla)
      } else if (purchasableMarlas > 20) {
        budgetFitScore = 80; // easily purchasable, could buy multiple properties
      } else if (purchasableMarlas >= 2 && purchasableMarlas < 5) {
        budgetFitScore = 60; // can buy a smaller apartment or plot
      } else {
        budgetFitScore = 30; // area is too expensive for user budget
      }
      
      // 2. Strategy Score
      let strategyScore = 0;
      if (strategy === 'rental') {
        // Higher yield = higher score
        strategyScore = Math.min(sector.rentalYield * 12.5, 100); // e.g. 8% yield yields 100
      } else {
        // Capital growth: premium societies like DHA/Clifton have higher appreciation
        const isPremium = sector.area.toLowerCase().includes('dha') || 
                          sector.area.toLowerCase().includes('clifton') || 
                          sector.area.toLowerCase().includes('e-7') ||
                          sector.area.toLowerCase().includes('f-7');
        strategyScore = isPremium ? 100 : 60;
      }
      
      // Combined score: 40% budget fit, 60% strategy
      score = (budgetFitScore * 0.4) + (strategyScore * 0.6);
      
      return {
        ...sector,
        pricePerMarla: Math.round(pricePerMarla),
        purchasableMarlas: parseFloat(purchasableMarlas.toFixed(1)),
        score: parseFloat(score.toFixed(1))
      };
    });

    // Sort by highest score
    const recommendations = scoredSectors
      .filter((s) => s.averagePrice > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Build automated explanation text based on metrics
    let explanation = '';
    if (recommendations.length > 0) {
      const primary = recommendations[0];
      const budgetInCrores = (budgetNum / 10000000).toFixed(2);
      
      explanation += `Based on your budget of PKR ${budgetInCrores} Crore in ${city}, our analytics engine recommends **${primary.area}** as your top choice. `;
      
      if (strategy === 'rental') {
        explanation += `This sector shows a highly attractive **rental yield of ${primary.rentalYield}%**, which is above average for ${city}. With your budget, you can expect to acquire approximately **${primary.purchasableMarlas} Marla** of built area or equivalent plot segments. In comparison, rents in this sector average PKR ${primary.averageRent.toLocaleString()}/month, offering stable monthly cashflow. `;
      } else {
        explanation += `This area is categorized as a premium sector showing strong buyer demand and high historical capital growth. Purchasing here at an average price of PKR ${primary.pricePerMarla.toLocaleString()} per Marla fits your profile, enabling you to acquire a **${primary.purchasableMarlas} Marla** property. DHA and select sectors represent institutional-grade assets with maximum liquidity and security. `;
      }
      
      if (recommendations.length > 1) {
        const secondary = recommendations[1];
        explanation += `\n\nYour secondary recommendation is **${secondary.area}** (Yield: ${secondary.rentalYield}%, Score: ${secondary.score}/100). `;
        if (secondary.averagePrice < primary.averagePrice) {
          explanation += `It offers a lower entry price point, allowing you to buy a larger space (**${secondary.purchasableMarlas} Marla**) for the same capital outlay.`;
        } else {
          explanation += `It represents an even more premium layout with average listings valued around PKR ${(secondary.averagePrice / 10000000).toFixed(2)} Crore.`;
        }
      }
    } else {
      explanation = `No active properties matching the criteria in ${city} were found to run the calculation. Please select a city with active scraped listings.`;
    }

    res.json({
      success: true,
      recommendations,
      explanation
    });
  } catch (error) {
    console.error('Error in wizard recommendation:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
