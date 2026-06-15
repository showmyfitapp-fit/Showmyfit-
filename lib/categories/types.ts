export interface CategoryDocument {
  slug: string;
  name: string;
  parentSlug: string | null;
  icon?: string;
  image?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  displayOrder: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CategorySeedItem {
  slug: string;
  name: string;
  icon?: string;
  image?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  displayOrder: number;
  subcategories?: Array<{
    slug: string;
    name: string;
    seoTitle?: string;
    seoDescription?: string;
    keywords?: string[];
  }>;
}

export interface ProductCategoryFields {
  category: string;
  subcategory?: string;
  subcategoryName?: string;
  categoryPath?: string[];
  slug?: string;
  searchKeywords?: string[];
}
