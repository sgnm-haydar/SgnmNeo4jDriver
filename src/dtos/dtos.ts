import { AscendingEnum } from "../constant/pagination.enum";

export type queryObjectType = {
  skip: number;
  limit: number;
  orderBy: AscendingEnum;
  orderByColumn?: string[];
}
