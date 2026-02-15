// Script to fetch and save Kite instruments list
// Run with: node scripts/fetch-instruments.js

const fs = require('fs');
const path = require('path');

async function fetchInstruments() {
  console.log('Fetching instruments from Kite API...');
  
  try {
    const response = await fetch('https://api.kite.trade/instruments');
    const text = await response.text();
    
    // Parse CSV
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');
    
    const instruments = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const instrument = {};
      headers.forEach((header, index) => {
        instrument[header] = values[index];
      });
      instruments.push(instrument);
    }
    
    console.log(`Total instruments fetched: ${instruments.length}`);
    
    // Filter and save indices only (for sector performance)
    const indices = instruments.filter(inst => 
      inst.segment === 'INDICES' || 
      inst.instrument_type === 'INDEX'
    );
    console.log(`Indices found: ${indices.length}`);
    
    // Save indices to JSON file
    const indicesPath = path.join(__dirname, '../data/indices.json');
    fs.mkdirSync(path.dirname(indicesPath), { recursive: true });
    fs.writeFileSync(indicesPath, JSON.stringify(indices, null, 2));
    console.log(`Indices saved to: ${indicesPath}`);
    
    // Also save a mapping of common sector indices
    const sectorIndices = indices.filter(inst => {
      const name = (inst.tradingsymbol || '').toUpperCase();
      return name.includes('NIFTY') || name.includes('BANK') || name.includes('IT') || 
             name.includes('PHARMA') || name.includes('AUTO') || name.includes('METAL') ||
             name.includes('FMCG') || name.includes('REALTY') || name.includes('ENERGY') ||
             name.includes('MEDIA') || name.includes('FIN') || name.includes('PSU');
    });
    
    const sectorPath = path.join(__dirname, '../data/sector-indices.json');
    fs.writeFileSync(sectorPath, JSON.stringify(sectorIndices, null, 2));
    console.log(`Sector indices saved to: ${sectorPath}`);
    
    // Print some sector indices for reference
    console.log('\nSector indices found:');
    sectorIndices.slice(0, 20).forEach(idx => {
      console.log(`  ${idx.tradingsymbol} (${idx.exchange}) - Token: ${idx.instrument_token}`);
    });
    
  } catch (error) {
    console.error('Error fetching instruments:', error);
  }
}

fetchInstruments();
