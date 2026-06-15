export interface CategoryFieldConfig {
  type: 'select' | 'text' | 'multi-select' | 'multi-text';
  label: string;
  options?: string[];
  placeholder?: string;
}

export type CategoryFieldsMap = Record<string, CategoryFieldConfig>;

/**
 * Dynamic product attribute fields per category (excluding category/subcategory pickers).
 */
export function getCategorySpecificFields(
  category: string,
  categoryData?: Record<string, unknown>,
  subcategoryName?: string
): CategoryFieldsMap {
  const subcategory =
    subcategoryName || (categoryData?.subcategory as string | undefined);

  switch (category) {
    case 'women':
      return {
        sizes: {
          type: 'multi-select',
          options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Other'],
          label: 'Available Sizes',
        },
        sizeOther: {
          type: 'text',
          label: 'Custom Sizes',
          placeholder: 'Enter custom sizes separated by commas (e.g., Free Size, One Size, etc.)',
        },
        colors: {
          type: 'multi-text',
          label: 'Available Colors',
          placeholder: 'Enter colors separated by commas',
        },
        material: { type: 'text', label: 'Material' },
        occasion: {
          type: 'select',
          options: ['Casual', 'Formal', 'Party', 'Wedding', 'Office'],
          label: 'Occasion',
        },
        season: {
          type: 'select',
          options: ['Summer', 'Winter', 'All Season'],
          label: 'Season',
        },
        careInstructions: {
          type: 'text',
          label: 'Care Instructions',
          placeholder: 'e.g., Machine wash cold, hang dry',
        },
        fit: {
          type: 'select',
          options: ['Slim Fit', 'Regular Fit', 'Loose Fit', 'Oversized'],
          label: 'Fit Type',
        },
      };
    case 'men':
      return {
        sizes: {
          type: 'multi-select',
          options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Other'],
          label: 'Available Sizes',
        },
        sizeOther: {
          type: 'text',
          label: 'Custom Sizes',
          placeholder: 'Enter custom sizes separated by commas (e.g., Free Size, One Size, etc.)',
        },
        colors: {
          type: 'multi-text',
          label: 'Available Colors',
          placeholder: 'Enter colors separated by commas',
        },
        material: { type: 'text', label: 'Material' },
        occasion: {
          type: 'select',
          options: ['Casual', 'Formal', 'Business', 'Party', 'Sports'],
          label: 'Occasion',
        },
        season: {
          type: 'select',
          options: ['Summer', 'Winter', 'All Season'],
          label: 'Season',
        },
        careInstructions: {
          type: 'text',
          label: 'Care Instructions',
          placeholder: 'e.g., Machine wash cold, hang dry',
        },
        fit: {
          type: 'select',
          options: ['Slim Fit', 'Regular Fit', 'Loose Fit', 'Oversized'],
          label: 'Fit Type',
        },
      };
    case 'footwear': {
      const isFootwearKids = subcategory === 'Kids Footwear';
      const isFootwearMen = subcategory === "Men's Footwear";
      const isFootwearWomen = subcategory === "Women's Footwear";

      let footwearSizes: string[];
      if (isFootwearKids) {
        footwearSizes = ['S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'Other'];
      } else if (isFootwearMen) {
        footwearSizes = ['6', '7', '8', '9', '10', '11', '12', '13', '14', '15', 'Other'];
      } else if (isFootwearWomen) {
        footwearSizes = ['4', '5', '6', '7', '8', '9', '10', '11', '12', 'Other'];
      } else {
        footwearSizes = ['5', '6', '7', '8', '9', '10', '11', '12', 'Other'];
      }

      return {
        sizes: { type: 'multi-select', options: footwearSizes, label: 'Available Sizes' },
        sizeOther: {
          type: 'text',
          label: 'Custom Sizes',
          placeholder: 'Enter custom sizes separated by commas (e.g., Free Size, One Size, etc.)',
        },
        colors: {
          type: 'multi-text',
          label: 'Available Colors',
          placeholder: 'Enter colors separated by commas',
        },
        material: { type: 'text', label: 'Upper Material' },
        soleMaterial: { type: 'text', label: 'Sole Material' },
        heelHeight: {
          type: 'select',
          options: ['Flat', 'Low (1-2 inches)', 'Medium (2-3 inches)', 'High (3+ inches)'],
          label: 'Heel Height',
        },
        closure: {
          type: 'select',
          options: ['Lace-up', 'Slip-on', 'Buckle', 'Velcro'],
          label: 'Closure',
        },
        width: {
          type: 'select',
          options: ['Narrow', 'Medium', 'Wide', 'Extra Wide'],
          label: 'Width',
        },
      };
    }
    case 'jewellery':
      return {
        material: {
          type: 'select',
          options: ['Gold', 'Silver', 'Platinum', 'Diamond', 'Pearl', 'Gemstone'],
          label: 'Primary Material',
        },
        secondaryMaterial: {
          type: 'text',
          label: 'Secondary Material',
          placeholder: 'e.g., Gold plated, Sterling silver',
        },
        type: {
          type: 'select',
          options: ['Ring', 'Necklace', 'Earrings', 'Bracelet', 'Anklet'],
          label: 'Type',
        },
        occasion: {
          type: 'select',
          options: ['Daily Wear', 'Formal', 'Party', 'Wedding'],
          label: 'Occasion',
        },
        gender: {
          type: 'select',
          options: ['Women', 'Men', 'Unisex'],
          label: 'Gender',
        },
        gemstone: {
          type: 'text',
          label: 'Gemstone Details',
          placeholder: 'e.g., Diamond, Ruby, Emerald',
        },
        weight: { type: 'text', label: 'Weight (grams)', placeholder: 'e.g., 2.5g' },
      };
    case 'lingerie':
      return {
        sizes: {
          type: 'multi-select',
          options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
          label: 'Available Sizes',
        },
        colors: {
          type: 'multi-text',
          label: 'Available Colors',
          placeholder: 'Enter colors separated by commas',
        },
        material: { type: 'text', label: 'Material' },
        type: {
          type: 'select',
          options: ['Bra', 'Panties', 'Lingerie Set', 'Sleepwear'],
          label: 'Type',
        },
        cupSize: {
          type: 'select',
          options: ['A', 'B', 'C', 'D', 'DD', 'E', 'F'],
          label: 'Cup Size',
        },
        bandSize: {
          type: 'select',
          options: ['28', '30', '32', '34', '36', '38', '40', '42'],
          label: 'Band Size',
        },
      };
    case 'watches':
      return {
        brand: { type: 'text', label: 'Brand' },
        type: {
          type: 'select',
          options: ['Analog', 'Digital', 'Smartwatch', 'Chronograph'],
          label: 'Type',
        },
        material: {
          type: 'select',
          options: ['Stainless Steel', 'Leather', 'Rubber', 'Gold', 'Silver'],
          label: 'Band Material',
        },
        caseMaterial: {
          type: 'text',
          label: 'Case Material',
          placeholder: 'e.g., Stainless steel, ceramic',
        },
        waterResistance: {
          type: 'select',
          options: ['30m', '50m', '100m', '200m', 'Not Water Resistant'],
          label: 'Water Resistance',
        },
        movement: {
          type: 'select',
          options: ['Quartz', 'Automatic', 'Mechanical', 'Solar'],
          label: 'Movement Type',
        },
        features: {
          type: 'multi-text',
          label: 'Features',
          placeholder: 'e.g., Date display, chronograph, GPS',
        },
      };
    case 'kids': {
      const isKidsFootwear = subcategory === 'Footwear';
      return {
        ageGroup: {
          type: 'select',
          options: ['0-2 years', '3-5 years', '6-8 years', '9-12 years', '13+ years'],
          label: 'Age Group',
        },
        sizes: {
          type: 'multi-select',
          options: isKidsFootwear
            ? ['S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'Other']
            : ['XS', 'S', 'M', 'L', 'XL'],
          label: 'Available Sizes',
        },
        colors: {
          type: 'multi-text',
          label: 'Available Colors',
          placeholder: 'Enter colors separated by commas',
        },
        gender: {
          type: 'select',
          options: ['Boys', 'Girls', 'Unisex'],
          label: 'Gender',
        },
        occasion: {
          type: 'select',
          options: ['Casual', 'School', 'Party', 'Sports'],
          label: 'Occasion',
        },
        safetyFeatures: {
          type: 'multi-text',
          label: 'Safety Features',
          placeholder: 'e.g., Non-toxic, BPA-free, flame retardant',
        },
      };
    }
    case 'home-lifestyle':
      return {
        room: {
          type: 'select',
          options: ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Dining Room'],
          label: 'Room',
        },
        material: { type: 'text', label: 'Primary Material' },
        secondaryMaterial: {
          type: 'text',
          label: 'Secondary Material',
          placeholder: 'e.g., Wood frame, metal legs',
        },
        dimensions: {
          type: 'text',
          label: 'Dimensions (L x W x H)',
          placeholder: 'e.g., 120cm x 60cm x 75cm',
        },
        colors: {
          type: 'multi-text',
          label: 'Available Colors',
          placeholder: 'Enter colors separated by commas',
        },
        assembly: {
          type: 'select',
          options: ['Ready to Use', 'Assembly Required', 'Professional Installation'],
          label: 'Assembly Required',
        },
        warranty: {
          type: 'text',
          label: 'Warranty Period',
          placeholder: 'e.g., 1 year, 2 years',
        },
      };
    case 'accessories':
      return {
        material: { type: 'text', label: 'Primary Material' },
        colors: {
          type: 'multi-text',
          label: 'Available Colors',
          placeholder: 'Enter colors separated by commas',
        },
        gender: {
          type: 'select',
          options: ['Women', 'Men', 'Unisex'],
          label: 'Gender',
        },
        closure: {
          type: 'text',
          label: 'Closure Type',
          placeholder: 'e.g., Zipper, magnetic, snap',
        },
        capacity: {
          type: 'text',
          label: 'Capacity/Size',
          placeholder: 'e.g., 15L, 20cm x 15cm',
        },
      };
    case 'beauty':
      return {
        skinType: {
          type: 'multi-select',
          options: ['Dry', 'Oily', 'Combination', 'Sensitive', 'Normal'],
          label: 'Suitable Skin Types',
        },
        finish: {
          type: 'select',
          options: ['Matte', 'Dewy', 'Satin', 'Natural'],
          label: 'Finish',
        },
        coverage: {
          type: 'select',
          options: ['Light', 'Medium', 'Full'],
          label: 'Coverage',
        },
        shades: {
          type: 'multi-text',
          label: 'Available Shades',
          placeholder: 'Enter shades separated by commas',
        },
        volume: { type: 'text', label: 'Volume/Size', placeholder: 'e.g., 30ml, 50g' },
        ingredients: {
          type: 'text',
          label: 'Key Ingredients',
          placeholder: 'e.g., Hyaluronic acid, Vitamin C',
        },
        spf: { type: 'text', label: 'SPF Level', placeholder: 'e.g., SPF 30, SPF 50' },
      };
    case 'sportswear':
      return {
        activity: {
          type: 'multi-select',
          options: ['Running', 'Gym', 'Yoga', 'Swimming', 'Cycling', 'Tennis'],
          label: 'Suitable Activities',
        },
        sizes: {
          type: 'multi-select',
          options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
          label: 'Available Sizes',
        },
        colors: {
          type: 'multi-text',
          label: 'Available Colors',
          placeholder: 'Enter colors separated by commas',
        },
        gender: {
          type: 'select',
          options: ['Men', 'Women', 'Unisex'],
          label: 'Gender',
        },
        season: {
          type: 'select',
          options: ['Summer', 'Winter', 'All Season'],
          label: 'Season',
        },
        fabric: {
          type: 'text',
          label: 'Fabric Type',
          placeholder: 'e.g., Polyester, Cotton blend',
        },
        features: {
          type: 'multi-text',
          label: 'Features',
          placeholder: 'e.g., Moisture-wicking, UV protection',
        },
      };
    case 'gifting-guide':
      return {
        occasion: {
          type: 'multi-select',
          options: ['Birthday', 'Anniversary', 'Wedding', 'Holiday', 'Graduation'],
          label: 'Suitable Occasions',
        },
        recipient: {
          type: 'select',
          options: ['Men', 'Women', 'Kids', 'Couples', 'Family'],
          label: 'Recipient',
        },
        priceRange: {
          type: 'select',
          options: ['Under ₹1000', '₹1000-5000', '₹5000-10000', '₹10000+'],
          label: 'Price Range',
        },
        giftType: {
          type: 'select',
          options: ['Physical Product', 'Experience', 'Subscription', 'Digital'],
          label: 'Gift Type',
        },
        packaging: {
          type: 'select',
          options: ['Standard', 'Gift Box', 'Premium Packaging', 'Custom'],
          label: 'Packaging',
        },
      };
    default:
      return {};
  }
}
