<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://kamilmysliwiec.com/public/nest-logo.png#1" alt="Nest Logo" />   </a>
  <a href="https://neo4j.com" target="_blank"><img src="https://dist.neo4j.com/wp-content/uploads/20140926224303/neo4j_logo-facebook.png" width="380"></a>
</p>

# Nest Neo4j

> Neo4j integration for Nest

## Description

This repository provides [Neo4j](https://www.neo4j.com) integration for [Nest](http://nestjs.com/).

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
    return this.neo4jService.updateById(id, updateClassificationDto);
  }
}
```

## Methods

```ts
getConfig(): Neo4jConfig;
getReadSession(database?: string): Session;
getWriteSession(database?: string): Session;
read(query: string, params?: object, database?: string): Result;
write(query: string, params?: object, database?: string): Result;
```
