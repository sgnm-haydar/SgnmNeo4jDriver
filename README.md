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
For pagination and search string from node properties there is already  functions implemented

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
      { isActive : true },
      [],
      updateDto
    );
  }
}
```

```ts
getConfig(): Neo4jConfig;
getReadSession(database?: string): Session;
getWriteSession(database?: string): Session;
read(query: string, params?: object, database?: string): Result;
write(query: string, params?: object, database?: string): Result;
findByIdAndFilters(id: number,filter_properties: object = {},excluded_labels: Array<string> = [])
findByLabelAndFilters(labels: Array<string> = [""],filter_properties: object = {},excluded_labels: Array<string> = [""])
findByOrLabelsAndFilters(or_labels: Array<string> = [""],filter_properties: object = {})
findByIdAndOrLabelsAndFilters(id: number,or_labels: Array<string> = [""],filter_properties: object = {})
updateByLabelAndFilter(labels: Array<string> = [],filter_properties: object = {},update_labels: Array<string> = [],update_properties: object = {} )
updateByIdAndFilter(id: number,filter_properties: object = {},update_labels: Array<string> = [],update_properties: object = {})
createNode(params: object, labels?: string[])
findChildrensByLabelsAsTree(root_labels: Array<string> = [],root_filters: object = {},children_labels: Array<string> = [],children_filters: object = {})
findByLabelAndFiltersWithTreeStructure(root_labels: Array<string> = [],root_filters: object = {},children_labels: Array<string> = [], children_filters: object = {})
findChildrensByIdsAsTree(root_id: number,root_filters: object = {},children_labels: Array<string> = [],children_filters: object = {})
findByIdAndFiltersWithTreeStructure(root_id: number,root_filters: object = {},children_labels: Array<string> = [],children_filters: object = {})
getParentByIdAndFilters(id: number,node_filters: object = {},parent_filters: object = {})
addParentRelationByIdAndFilters(child_id: number,child_filters: object = {},target_parent_id: number,target_parent_filters: object = {})
addRelationByIdAndRelationNameWithoutFilters(first_node_id: number,second_node_id: number,relation_name: string,relation_direction: RelationDirection = RelationDirection.RIGHT)
addRelationByIdAndRelationNameWithFilters(
    first_node_id: number,
    first_node_filters: object = {},
    second_node_id: number,
    second_node_filters: object = {},
    relation_name: string,
    relation_direction: RelationDirection = RelationDirection.RIGHT
  )
  addRelationByLabelsAndFiltersAndRelationName(
    first_node_labels: Array<string> = [],
    first_node_properties: object = {},
    second_node_labels: Array<string> = [],
    second_node_properties: object = {},
    relation_name: string,
    relation_direction: RelationDirection = RelationDirection.RIGHT
  )
 findChildrensByLabelsAsTreeOneLevel(
    root_labels: Array<string> = [],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {}
  )
findByLabelAndFiltersWithTreeStructureOneLevel(
    root_labels: Array<string> = [],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {}
  )
findChildrensByLabelsOneLevel(
    root_labels: Array<string> = [],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {}
  )
findChildrensByIdOneLevel(
    root_id: number,
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    relation_name: string
  )
findChildrensByIdsAsTreeOneLevel(
    id: number,
    root_filters: object = {},
    children_filters: object = {}
  )
findByIdAndFiltersWithTreeStructureOneLevel(
    id: number,
    root_filters: object = {},
    children_filters: object = {}
  )
 findChildrenNodesByLabelsAndRelationName(
    first_node_labels: Array<string> = [],
    first_node_filters: object = {},
    second_node_labels: Array<string> = [],
    second_node_filters: object = {},
    relation_name: string,
    relation_direction: RelationDirection = RelationDirection.RIGHT
  )
findChildrensByLabelsAndRelationNameOneLevel(
    first_node_labels: Array<string> = [],
    first_node_filters: object = {},
    second_node_labels: Array<string> = [],
    second_node_filters: object = {},
    relation_name: string,
    relation_direction: RelationDirection = RelationDirection.RIGHT
  )
 updateNodeChildrensByIdAndFilter(
    id: number,
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    relation_name: string,
    update_labels: Array<string> = [],
    update_properties: object = {},
    databaseOrTransaction?: string | Transaction
  )
findChildrensByLabelsAndNotLabelsAsTreeOneLevel(
    root_labels: Array<string> = [],
    root_not_labels: Array<string> = [],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_not_labels: Array<string> = [],
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction
  )
findByLabelAndNotLabelAndFiltersWithTreeStructureOneLevel(
    root_labels: Array<string> = [],
    root_not_labels: Array<string> = [],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_not_labels: Array<string> = [],
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction
  )
copySubGrapFromOneNodeToAnotherById(
    root_id: number,
    target_root_id: number,
    relation_name: string,
    databaseOrTransaction?: string | Transaction
  )
findChildrensByIdAndFiltersWithPagination(
    root_id: number,
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    relation_name: string,
    queryObject: queryObjectType,
    databaseOrTransaction?: string
  ) {
findChildrensByIdAndFiltersWithPaginationAndSearcString(
    root_id: number,
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    queryObject: queryObjectType,
    searchString: string,
    databaseOrTransaction?: string
  ) 
findChildrensByIdAndFiltersWithoutPaginationAndSearcString(
    root_id: number,
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    search_string: string,
    databaseOrTransaction?: string
  ) {
findChildrensByIdAndFiltersWithPaginationAndSearcStringBySpecificColumn(
    root_id: number,
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    queryObject: queryObjectType,
    searchColumn: string,
    searchString: string,
    databaseOrTransaction?: string
  )
findChildrensByIdAndFiltersWithoutPaginationAndSearcStringBySpecificColumn(
    root_id: number,
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    searchColumn: string,
    search_string: string,
    databaseOrTransaction?: string
  )
```
