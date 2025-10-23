/**
 * Vehicle Database - Realistic makes, models, and years
 * Each vehicle entry includes make, model, base price range, and typical segment
 */
export const VEHICLE_DATABASE = [
    // Compact Cars
    { make: 'Toyota', model: 'Corolla', basePriceRange: [18, 28], typicalSegment: 'compact', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Honda', model: 'Civic', basePriceRange: [19, 29], typicalSegment: 'compact', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Mazda', model: 'Mazda3', basePriceRange: [20, 30], typicalSegment: 'compact', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Nissan', model: 'Sentra', basePriceRange: [18, 26], typicalSegment: 'compact', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Hyundai', model: 'Elantra', basePriceRange: [17, 27], typicalSegment: 'compact', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Kia', model: 'Forte', basePriceRange: [17, 26], typicalSegment: 'compact', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Ford', model: 'Focus', basePriceRange: [18, 24], typicalSegment: 'compact', years: [2019, 2020] },
    { make: 'Chevrolet', model: 'Cruze', basePriceRange: [17, 23], typicalSegment: 'compact', years: [2019] },
    // Sedans
    { make: 'Toyota', model: 'Camry', basePriceRange: [24, 38], typicalSegment: 'sedan', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Honda', model: 'Accord', basePriceRange: [24, 40], typicalSegment: 'sedan', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Nissan', model: 'Altima', basePriceRange: [23, 36], typicalSegment: 'sedan', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Hyundai', model: 'Sonata', basePriceRange: [23, 35], typicalSegment: 'sedan', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Kia', model: 'Optima', basePriceRange: [22, 34], typicalSegment: 'sedan', years: [2019, 2020, 2021] },
    { make: 'Kia', model: 'K5', basePriceRange: [23, 35], typicalSegment: 'sedan', years: [2021, 2022, 2023, 2024] },
    { make: 'Ford', model: 'Fusion', basePriceRange: [21, 33], typicalSegment: 'sedan', years: [2019, 2020] },
    { make: 'Chevrolet', model: 'Malibu', basePriceRange: [21, 32], typicalSegment: 'sedan', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Mazda', model: 'Mazda6', basePriceRange: [22, 36], typicalSegment: 'sedan', years: [2019, 2020, 2021] },
    { make: 'Subaru', model: 'Legacy', basePriceRange: [23, 33], typicalSegment: 'sedan', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    // Crossovers
    { make: 'Honda', model: 'CR-V', basePriceRange: [28, 42], typicalSegment: 'crossover', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Toyota', model: 'RAV4', basePriceRange: [28, 43], typicalSegment: 'crossover', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Nissan', model: 'Rogue', basePriceRange: [27, 41], typicalSegment: 'crossover', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Mazda', model: 'CX-5', basePriceRange: [27, 42], typicalSegment: 'crossover', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Hyundai', model: 'Tucson', basePriceRange: [25, 38], typicalSegment: 'crossover', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Kia', model: 'Sportage', basePriceRange: [24, 37], typicalSegment: 'crossover', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Ford', model: 'Escape', basePriceRange: [26, 40], typicalSegment: 'crossover', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Chevrolet', model: 'Equinox', basePriceRange: [25, 39], typicalSegment: 'crossover', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Subaru', model: 'Forester', basePriceRange: [26, 41], typicalSegment: 'crossover', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Jeep', model: 'Cherokee', basePriceRange: [28, 46], typicalSegment: 'crossover', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    // SUVs
    { make: 'Toyota', model: 'Highlander', basePriceRange: [35, 52], typicalSegment: 'suv', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Honda', model: 'Pilot', basePriceRange: [36, 51], typicalSegment: 'suv', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Ford', model: 'Explorer', basePriceRange: [37, 54], typicalSegment: 'suv', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Chevrolet', model: 'Tahoe', basePriceRange: [52, 72], typicalSegment: 'suv', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Jeep', model: 'Grand Cherokee', basePriceRange: [35, 58], typicalSegment: 'suv', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Jeep', model: 'Wrangler', basePriceRange: [30, 55], typicalSegment: 'suv', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'GMC', model: 'Yukon', basePriceRange: [54, 75], typicalSegment: 'suv', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Dodge', model: 'Durango', basePriceRange: [34, 56], typicalSegment: 'suv', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Nissan', model: 'Pathfinder', basePriceRange: [34, 48], typicalSegment: 'suv', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Mazda', model: 'CX-9', basePriceRange: [35, 48], typicalSegment: 'suv', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    // Luxury Sedans
    { make: 'BMW', model: '3 Series', basePriceRange: [42, 58], typicalSegment: 'luxury', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'BMW', model: '5 Series', basePriceRange: [55, 72], typicalSegment: 'luxury', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Mercedes-Benz', model: 'C-Class', basePriceRange: [43, 60], typicalSegment: 'luxury', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Mercedes-Benz', model: 'E-Class', basePriceRange: [56, 75], typicalSegment: 'luxury', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Audi', model: 'A4', basePriceRange: [41, 57], typicalSegment: 'luxury', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Audi', model: 'A6', basePriceRange: [56, 74], typicalSegment: 'luxury', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Lexus', model: 'ES', basePriceRange: [41, 55], typicalSegment: 'luxury', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Lexus', model: 'LS', basePriceRange: [78, 102], typicalSegment: 'luxury', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Genesis', model: 'G80', basePriceRange: [50, 68], typicalSegment: 'luxury', years: [2020, 2021, 2022, 2023, 2024] },
    { make: 'Genesis', model: 'G90', basePriceRange: [75, 95], typicalSegment: 'luxury', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    // Luxury SUVs
    { make: 'BMW', model: 'X3', basePriceRange: [44, 62], typicalSegment: 'luxury', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'BMW', model: 'X5', basePriceRange: [61, 82], typicalSegment: 'luxury', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'BMW', model: 'X7', basePriceRange: [76, 102], typicalSegment: 'luxury', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Mercedes-Benz', model: 'GLC', basePriceRange: [44, 63], typicalSegment: 'luxury', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Mercedes-Benz', model: 'GLE', basePriceRange: [59, 81], typicalSegment: 'luxury', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Audi', model: 'Q5', basePriceRange: [45, 64], typicalSegment: 'luxury', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Audi', model: 'Q7', basePriceRange: [58, 82], typicalSegment: 'luxury', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Lexus', model: 'RX', basePriceRange: [46, 65], typicalSegment: 'luxury', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Lexus', model: 'GX', basePriceRange: [56, 75], typicalSegment: 'luxury', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Cadillac', model: 'Escalade', basePriceRange: [78, 108], typicalSegment: 'luxury', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    // Performance Cars
    { make: 'BMW', model: 'M3', basePriceRange: [72, 92], typicalSegment: 'performance', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'BMW', model: 'M4', basePriceRange: [75, 95], typicalSegment: 'performance', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Mercedes-Benz', model: 'AMG C63', basePriceRange: [74, 94], typicalSegment: 'performance', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Audi', model: 'S4', basePriceRange: [52, 68], typicalSegment: 'performance', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Audi', model: 'RS5', basePriceRange: [76, 96], typicalSegment: 'performance', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Lexus', model: 'RC F', basePriceRange: [65, 82], typicalSegment: 'performance', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Ford', model: 'Mustang GT', basePriceRange: [38, 52], typicalSegment: 'performance', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Chevrolet', model: 'Camaro SS', basePriceRange: [40, 54], typicalSegment: 'performance', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Dodge', model: 'Challenger', basePriceRange: [30, 48], typicalSegment: 'performance', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Chevrolet', model: 'Corvette', basePriceRange: [62, 88], typicalSegment: 'performance', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    // EVs
    { make: 'Tesla', model: 'Model 3', basePriceRange: [42, 58], typicalSegment: 'ev', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Tesla', model: 'Model Y', basePriceRange: [48, 66], typicalSegment: 'ev', years: [2020, 2021, 2022, 2023, 2024] },
    { make: 'Tesla', model: 'Model S', basePriceRange: [92, 118], typicalSegment: 'ev', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Tesla', model: 'Model X', basePriceRange: [102, 128], typicalSegment: 'ev', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Ford', model: 'Mustang Mach-E', basePriceRange: [45, 65], typicalSegment: 'ev', years: [2021, 2022, 2023, 2024] },
    { make: 'Chevrolet', model: 'Bolt EV', basePriceRange: [32, 42], typicalSegment: 'ev', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Chevrolet', model: 'Bolt EUV', basePriceRange: [34, 44], typicalSegment: 'ev', years: [2022, 2023, 2024] },
    { make: 'Nissan', model: 'Leaf', basePriceRange: [32, 42], typicalSegment: 'ev', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Hyundai', model: 'IONIQ 5', basePriceRange: [42, 58], typicalSegment: 'ev', years: [2022, 2023, 2024] },
    { make: 'Hyundai', model: 'IONIQ 6', basePriceRange: [44, 60], typicalSegment: 'ev', years: [2023, 2024] },
    { make: 'Kia', model: 'EV6', basePriceRange: [43, 59], typicalSegment: 'ev', years: [2022, 2023, 2024] },
    { make: 'BMW', model: 'i4', basePriceRange: [56, 74], typicalSegment: 'ev', years: [2022, 2023, 2024] },
    { make: 'BMW', model: 'iX', basePriceRange: [86, 110], typicalSegment: 'ev', years: [2022, 2023, 2024] },
    { make: 'Mercedes-Benz', model: 'EQS', basePriceRange: [105, 132], typicalSegment: 'ev', years: [2022, 2023, 2024] },
    { make: 'Audi', model: 'e-tron', basePriceRange: [68, 88], typicalSegment: 'ev', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Rivian', model: 'R1T', basePriceRange: [75, 95], typicalSegment: 'ev', years: [2022, 2023, 2024] },
    { make: 'Rivian', model: 'R1S', basePriceRange: [78, 98], typicalSegment: 'ev', years: [2022, 2023, 2024] },
    { make: 'Polestar', model: '2', basePriceRange: [48, 66], typicalSegment: 'ev', years: [2021, 2022, 2023, 2024] },
    // Convertibles
    { make: 'BMW', model: '4 Series Convertible', basePriceRange: [55, 72], typicalSegment: 'convertible', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Mercedes-Benz', model: 'C-Class Cabriolet', basePriceRange: [52, 68], typicalSegment: 'convertible', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Audi', model: 'A5 Cabriolet', basePriceRange: [51, 67], typicalSegment: 'convertible', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Ford', model: 'Mustang Convertible', basePriceRange: [32, 48], typicalSegment: 'convertible', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Chevrolet', model: 'Camaro Convertible', basePriceRange: [33, 49], typicalSegment: 'convertible', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Mini', model: 'Cooper Convertible', basePriceRange: [28, 38], typicalSegment: 'convertible', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Jaguar', model: 'F-Type Convertible', basePriceRange: [62, 88], typicalSegment: 'convertible', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { make: 'Porsche', model: '718 Boxster', basePriceRange: [62, 88], typicalSegment: 'convertible', years: [2019, 2020, 2021, 2022, 2023, 2024] },
];
/**
 * Get a random vehicle from the database matching the given segment
 */
export function getRandomVehicleForSegment(segment, rng) {
    const matchingVehicles = VEHICLE_DATABASE.filter(v => v.typicalSegment === segment);
    if (matchingVehicles.length === 0) {
        // Fallback to generic if no matches
        return {
            make: 'Generic',
            model: segment.charAt(0).toUpperCase() + segment.slice(1),
            basePriceRange: [25, 40],
            typicalSegment: segment,
            year: 2024,
        };
    }
    const vehicle = rng.pick(matchingVehicles);
    const year = rng.pick(vehicle.years);
    return {
        make: vehicle.make,
        model: vehicle.model,
        basePriceRange: vehicle.basePriceRange,
        typicalSegment: vehicle.typicalSegment,
        year,
    };
}
/**
 * Calculate a price multiplier based on vehicle year
 */
export function getYearPriceMultiplier(year) {
    const currentYear = 2024;
    const age = currentYear - year;
    // Older vehicles are cheaper, but not as dramatically
    // Used car dealers typically see 15-20% depreciation per year
    if (age === 0)
        return 1.0; // Current year
    if (age === 1)
        return 0.92; // 1 year old (8% depreciation)
    if (age === 2)
        return 0.85; // 2 years old (15% depreciation)
    if (age === 3)
        return 0.78; // 3 years old (22% depreciation)
    if (age === 4)
        return 0.72; // 4 years old (28% depreciation)
    if (age === 5)
        return 0.66; // 5 years old (34% depreciation)
    return 0.60; // 6+ years old (40% depreciation)
}
