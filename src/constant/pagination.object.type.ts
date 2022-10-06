import { AscendingEnum } from "./pagination.enum";

export type PaginationDto = {
  skip: number;
  limit: number;
  order_by: string[];
  ascending: AscendingEnum;
};
