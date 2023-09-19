export interface IFindMultipleNodesWithFiltersAndId {
    id: number,
    labels: string[],
    filters?: { [key: string]: any },
    relationWithNextNode?: {
        id?: number,
        depth?: string,
        direction?: string,
        name: string,
        filters?:
        {
            [key: string]: any,
        }
    }
}