export type ID = string;

export type BudgetRange =
  | "under_50"
  | "50_100"
  | "100_250"
  | "250_plus";

export interface BaseEntity {
  id: ID;
  createdAt: Date;
  updatedAt: Date;
}

export type LoadingState = "idle" | "loading" | "success" | "error";

export interface AppError {
  code: string;
  message: string;
}
