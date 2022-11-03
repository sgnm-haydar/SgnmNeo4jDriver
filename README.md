<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://kamilmysliwiec.com/public/nest-logo.png#1" alt="Nest Logo" />   </a>
  <a href="https://neo4j.com" target="_blank"><img src="https://dist.neo4j.com/wp-content/uploads/20140926224303/neo4j_logo-facebook.png" width="380"></a>
</p>

# Nest Neo4j

> Neo4j integration for Nest

## Description

This repository provides [Neo4j](https://www.neo4j.com) integration for [Nest](http://nestjs.com/).

## Description of Library

(as default u can use `read()` and `write()` method for your own cyper query)
This package convenient for tree structure and normal cyper usage .
For parent relation default we use PARENT_OF relation but u can change it with functions.
For pagination and search string from node properties there is already functions implemented

## Installation

```
$ npm i sgnm-neo4j
```

## Quick Start

Register the Neo4j Module in your application using the `forRoot` method or `forRootAsync`, passing the neo4j connection information as an object:

```ts
import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { Neo4jModule } from "sgnm-neo4j";

@Module({
  imports: [
    Neo4jModule.forRoot({
      scheme: "neo4j",
      host: "localhost",
      port: 7687,
      username: "neo4j",
      password: "neo",
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

```ts
import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { Neo4jModule } from "sgnm-neo4j";

@Module({
  imports: [
    Neo4jModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        host: configService.get("NEO4J_HOST"),
        password: configService.get("NEO4J_PASSWORD"),
        port: configService.get("NEO4J_PORT"),
        scheme: configService.get("NEO4J_SCHEME"),
        username: configService.get("NEO4J_USERNAME"),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

## Querying Neo4j

The `Neo4jService` is `@Injectable`, so can be passed into any constructor:

```ts
import { Neo4jService } from "sgnm-neo4j";

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly neo4jService: Neo4jService
  ) {}

  @Get()
  async getHello(): Promise<any> {
    const res = await this.neo4jService.read(
      `MATCH (n) RETURN count(n) AS count`
    );

    return `There are ${res.records[0].get("count")} nodes in the database`;
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateDto: UpdateDto) {
    return await this.neo4jService.updateByIdAndFilter(
      id,
      { isActive: true },
      [],
      updateDto
    );
  }
}
export class AppModule {}
```

## LazyLoading Functions implemented for general search,by specific column,ordering etc... 

For the big data, required lazyLoading functions already implemented.Required params listed 
```ts
type queryObjectType = {
  skip: number;
  limit: number;
  orderBy?: AscendingEnum;
  orderByColumn?: string[];
}

enum SearchType {
    CONTAINS = 'CONTAINS',
    START_WITH='STARTS WITH',
    ENDS_WITH='ENDS WITH'
  }

enum AscendingEnum {
    ASCENDING = 'ASC',
    DESCANDING='DESC'
}

findChildrensByIdAndFiltersWithPagination(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    root_exculuded_labels: string[] = [""],
    children_labels: Array<string> = [],
    children_filters: object = {},
    children_exculuded_labels: string[] = [""],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "" = "",
    queryObject: queryObjectType,
    databaseOrTransaction?: string
  ) ;

findChildrensByIdAndFiltersTotalCount(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "" = "",
    databaseOrTransaction?: string | Transaction
  )

findChildrensByIdAndFiltersWithPaginationAndSearcString(
    root_id: number,
    root_labels: string[],
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "" = "",
    queryObject: queryObjectType,
    searchString: string,
    databaseOrTransaction?: string
  )

findChildrensByIdAndFiltersAndSearchStringsTotalCount(
    root_id: number,
    root_labels: string[],
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "" = "",
    search_string: string,
    databaseOrTransaction?: string
  )

findChildrensByIdAndFiltersWithPaginationAndSearcStringBySpecificColumn(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "" = "",
    queryObject: queryObjectType,
    searchColumn: string,
    searchString: string,
    search_type: SearchType = SearchType.CONTAINS,
    databaseOrTransaction?: string
  )

findChildrensByIdAndFiltersBySearcStringBySpecificColumnTotalCount(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "" = "",
    search_column: string,
    search_string: string,
    search_type: SearchType = SearchType.CONTAINS,
    databaseOrTransaction?: string
  )
  ```
## There is list of some of functions in service 

For the details,you can check  git repository
```ts
getConfig(): Neo4jConfig;
getReadSession(database?: string): Session;
getWriteSession(database?: string): Session;
read(query: string, params?: object, database?: string): Result;
write(query: string, params?: object, database?: string): Result;
findByIdAndFilters(
    id: number,
    labels: string[],
    filter_properties: object = {},
    excluded_labels: Array<string> = [],
    databaseOrTransaction?: string | Transaction
  );
findByLabelAndFilters(labels: Array<string> = [""],filter_properties: object = {},excluded_labels: Array<string> = [""]);
findByOrLabelsAndFilters(or_labels: Array<string> = [""],filter_properties: object = {}),
findByIdAndOrLabelsAndFilters(id: number,or_labels: Array<string> = [""],filter_properties: object = {}),
updateByLabelAndFilter(labels: Array<string> = [],filter_properties: object = {},update_labels: Array<string> = [],update_properties: object = {} );updateByIdAndFilter(
    id: number,
    labels: string[] = [""],
    filter_properties: object = {},
    update_labels: Array<string> = [],
    update_properties: object = {},
    databaseOrTransaction?: string | Transaction
  );
createNode(
    params: object,
    labels?: string[],
    databaseOrTransaction?: string | Transaction
  );
findChildrensByLabelsAsTree(root_labels: Array<string> = [],root_filters: object = {},children_labels: Array<string> = [],children_filters: object = {}),
findByLabelAndFiltersWithTreeStructure(root_labels: Array<string> = [],root_filters: object = {},children_labels: Array<string> = [], children_filters: object = {});
findChildrensByIdsAsTree(root_id: number, root_labels: string[] = [""],root_filters: object = {},children_labels: Array<string> = [],children_filters: object = {});
findByIdAndFiltersWithTreeStructure(root_id: number,root_filters: object = {},children_labels: Array<string> = [],children_filters: object = {});
getParentByIdAndFilters(
    id: number,
    node_labels: string[] = [""],
    node_filters: object = {},
    parent_labels: string[] = [""],
    parent_filters: object = {},
    relation_name: string,
    relation_filters,
    relation_depth: number | "" = "",
    databaseOrTransaction?: string | Transaction
  );
addRelationByLabelsAndFiltersAndRelationName(
    first_node_labels: Array<string> = [],
    first_node_properties: object = {},
    second_node_labels: Array<string> = [],
    second_node_properties: object = {},
    relation_name: string,
    relation_properties: object = {},
    relation_direction: RelationDirection = RelationDirection.RIGHT,
    databaseOrTransaction?: string | Transaction
  );
addRelationByIdWithRelationNameAndFilters(
    first_node_id: number,
    first_node_labels: string[] = [""],
    first_node_filters: object = {},
    second_node_id: number,
    second_node_labels: string[] = [""],
    second_node_filters: object = {},
    relation_name: string,
    relation_properties: object = {},
    relation_direction: RelationDirection = RelationDirection.RIGHT,
    databaseOrTransaction?: string | Transaction
  );
findChildrensByLabelsAsTreeOneLevel(
    root_labels: Array<string> = [],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction
  );
updateNodeChildrensByIdAndFilter(
    id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "" = "",
    update_labels: Array<string> = [],
    update_properties: object = {},
    databaseOrTransaction?: string | Transaction
  );
deleteRelationByIdAndRelationNameWithFilters(
    first_node_id: number,
    first_node_labels: string[] = [""],
    first_node_filters: object = {},
    second_node_id: number,
    second_node_labels: string[] = [""],
    second_node_filters: object = {},
    relation_name: string,
    relation_direction: RelationDirection = RelationDirection.RIGHT,
    databaseOrTransaction?: string | Transaction
  );
deleteRelationByIdAndRelationNameWithoutFilters(
    first_node_id: number,
    first_node_labels: string[] = [""],
    second_node_id: number,
    second_node_labels: string[] = [""],
    relation_name: string,
    relation_direction: RelationDirection = RelationDirection.RIGHT,
    databaseOrTransaction?: string | Transaction
  );
copySubGrapFromOneNodeToAnotherById(
    root_id: number,
    target_root_id: number,
    relation_name: string,
    databaseOrTransaction?: string | Transaction
  );
findChildrensByIdAndFilters(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    children_labels: string[] = [],
    children_filters: object = {},
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "" = "",
    databaseOrTransaction?: string | Transaction
  );
findChildrensByIdAndFiltersTotalCount(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "" = "",
    databaseOrTransaction?: string | Transaction
  );
findChildrensByLabelsAndFilters(
    root_labels: string[] = [],
    root_filters: object = {},
    children_labels: string[] = [],
    children_filters: object = {},
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "" = "",
    databaseOrTransaction?: string | Transaction
  );
updateRelationByIdWithRelationNameAndFilters(
    first_node_id: number,
    first_node_labels: string[] = [""],
    first_node_filters: object = {},
    second_node_id: number,
    second_node_labels: string[] = [""],
    second_node_filters: object = {},
    relation_name: string,
    relation_properties: object = {},
    relation_update_properties: object = {},
    relation_direction: RelationDirection = RelationDirection.RIGHT,
    databaseOrTransaction?: string | Transaction
  );
findChildrensByRootIdAndNotLabels(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    root_exculuded_labels: string[] = [""],
    children_labels: Array<string> = [""],
    children_filters: object = {},
    children_excluded_labels: string[] = [""],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "" = "",
    databaseOrTransaction?: string | Transaction
  );
findChildrensByLabelAndNotLabels(
    root_labels: string[] = [""],
    root_filters: object = {},
    root_exculuded_labels: string[] = [""],
    children_labels: Array<string> = [""],
    children_filters: object = {},
    children_excluded_labels: string[] = [""],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "" = "",
    databaseOrTransaction?: string | Transaction
  );
findChildrensByIdAndFiltersWithPagination(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    root_exculuded_labels: string[] = [""],
    children_labels: Array<string> = [],
    children_filters: object = {},
    children_exculuded_labels: string[] = [""],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "" = "",
    queryObject: queryObjectType,
    databaseOrTransaction?: string
  );
findChildrensAndParentOfChildrenByIdAndFilter(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    relation_name1: string,
    parentof_children_labels: Array<string> = [],
    parentof_children_filters: object = {},
    relation_name2: string,
    queryObject: queryObjectType,
    databaseOrTransaction?: string
  );
findChildrensByIdAndFiltersWithPaginationAndSearcString(
    root_id: number,
    root_labels: string[],
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "" = "",
    queryObject: queryObjectType,
    searchString: string,
    databaseOrTransaction?: string
  );
findChildrensByIdAndFiltersAndSearchStringsTotalCount(
    root_id: number,
    root_labels: string[],
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "" = "",
    search_string: string,
    databaseOrTransaction?: string
  );
findChildrensByIdAndFiltersWithPaginationAndSearcStringBySpecificColumn(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "" = "",
    queryObject: queryObjectType,
    searchColumn: string,
    searchString: string,
    search_type: SearchType = SearchType.CONTAINS,
    databaseOrTransaction?: string
  );
findChildrensByIdAndFiltersBySearcStringBySpecificColumnTotalCount(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "" = "",
    search_column: string,
    search_string: string,
    search_type: SearchType = SearchType.CONTAINS,
    databaseOrTransaction?: string
  );
findMainNodesRelationsWithFilters(
    mainNodeLabels: string[],
    mainNodeFilters: object,
    otherNodesProps: otherNodesObjProps[],
    queryObject: queryObjectType,
    databaseOrTransaction?
  );
findTotalCountsOfMainNodesRelationsWithFilters(
    mainNodeLabels: string[],
    mainNodeFilters: object,
    otherNodesProps: otherNodesObjProps[],
    databaseOrTransaction?
  )
```
