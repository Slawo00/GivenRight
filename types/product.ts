import { BudgetRange } from "./common";
import { DecisionDirection } from "./decision";

export interface Product {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  affiliateUrl: string;
}

export interface ProductResolverInput {
  patternKey: string;
  direction: DecisionDirection;
  budgetRange: BudgetRange;
  country: string;
  locale: string;
  excludeCategories?: string[];
}

export interface ProductResolverResult {
  success: boolean;
  products: Product[];
  error?: string;
}

export type AmazonDomain = 
  | "amazon.com"
  | "amazon.de"
  | "amazon.co.uk"
  | "amazon.fr"
  | "amazon.it"
  | "amazon.es";

export const AMAZON_DOMAINS: Record<string, AmazonDomain> = {
  US: "amazon.com",
  DE: "amazon.de",
  GB: "amazon.co.uk",
  UK: "amazon.co.uk",
  FR: "amazon.fr",
  IT: "amazon.it",
  ES: "amazon.es",
};
