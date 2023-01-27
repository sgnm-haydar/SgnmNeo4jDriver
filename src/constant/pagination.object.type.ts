import { AscendingEnum } from "./pagination.enum";

export type PaginationDto = {
  skip: number;
  limit: number;
  order_by: string[];
  ascending: AscendingEnum;
};

export type otherNodesObjProps = {
  labels: string[];
  filters: object;
  relationName: string;
  id: string;
};
