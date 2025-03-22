// Data loading and processing functions
class DataLoader {
    static async loadAllData() {
        try {
            console.log('Starting data load...');
            
            // Load GeoJSON
            const geoJsonResponse = await fetch('/countries.geo.json');
            if (!geoJsonResponse.ok) {
                throw new Error(`GeoJSON HTTP error! status: ${geoJsonResponse.status}`);
            }
            const geoData = await geoJsonResponse.json();
            console.log('GeoJSON loaded successfully');

            // Load Excel file
            const excelResponse = await fetch('/UNHDIGDPData.xlsx');
            if (!excelResponse.ok) {
                throw new Error(`Excel HTTP error! status: ${excelResponse.status}`);
            }
            const arrayBuffer = await excelResponse.arrayBuffer();
            console.log('Excel file loaded successfully');

            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            
            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                throw new Error('Excel file has no sheets');
            }
            
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            if (!worksheet) {
                throw new Error('Could not read worksheet');
            }

            // Convert to array of arrays first
            const rawData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                raw: true, 
                defval: null
            });

            if (!rawData || rawData.length < 2) {
                throw new Error('Excel file is empty or missing data');
            }

            // Get headers and clean them
            const headers = rawData[0].map(h => h ? h.toString().toLowerCase().trim() : '');
            console.log('Headers:', headers);

            // Convert to array of objects with strict validation
            const processedData = [];
            for (let i = 1; i < rawData.length; i++) {
                const row = rawData[i];
                if (!row || row.length === 0) continue;

                const obj = {};
                let hasData = false;
                
                headers.forEach((header, index) => {
                    if (header && row[index] !== undefined && row[index] !== null) {
                        let value = row[index];
                        if (typeof value === 'string') {
                            value = value.trim();
                            if (value && !isNaN(value.replace(/,/g, ''))) {
                                value = parseFloat(value.replace(/,/g, ''));
                            }
                        }
                        obj[header] = value;
                        hasData = true;
                    }
                });

                if (hasData) {
                    const countryId = (obj.id || obj.country || obj.name || '').toString().trim().toUpperCase();
                    const countryName = (obj.country || obj.name || '').toString().trim();
                    
                    if (countryId && countryName) {
                        processedData.push({
                            id: countryId,
                            name: countryName,
                            gdp: this.parseNumber(obj.gdp),
                            hdi: this.parseNumber(obj.hdi)
                        });
                    }
                }
            }

            console.log('Processed data count:', processedData.length);
            console.log('First processed item:', processedData[0]);

            if (processedData.length === 0) {
                throw new Error('No valid data rows found in Excel file');
            }

            return { 
                geoData, 
                excelData: processedData 
            };
        } catch (error) {
            console.error('Error in loadAllData:', error);
            throw error;
        }
    }

    static parseNumber(value) {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const cleaned = value.trim().replace(/,/g, '');
            if (!cleaned) return 0;
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    }
}
