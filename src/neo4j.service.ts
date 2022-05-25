import {
  Injectable,
  Inject,
  OnApplicationShutdown,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import neo4j, { Driver, Result, int, Transaction } from "neo4j-driver";
import { Neo4jConfig } from "./interfaces/neo4j-config.interface";
import { NEO4J_OPTIONS, NEO4J_DRIVER } from "./neo4j.constants";
import TransactionImpl from "neo4j-driver-core/lib/transaction";
import { newError } from "neo4j-driver-core";
import { findNodeCountByClassNameDto } from "./dtos/dtos";
import {
  createDynamicCyperCreateQuery,
  createDynamiCyperParam,
  updateNodeQuery,
} from "./func/common.func";
import { successResponse } from "./constant/success.response.object";
import { failedResponse } from "./constant/failed.response.object";
import { PaginationNeo4jParams } from "./constant/pagination.param";

@Injectable()
export class Neo4jService implements OnApplicationShutdown {
  private readonly driver: Driver;
  private readonly config: Neo4jConfig;

  constructor(
    @Inject(NEO4J_OPTIONS) config: Neo4jConfig,
    @Inject(NEO4J_DRIVER) driver: Driver
  ) {
    this.driver = driver;
    this.config = config;
  }

  getDriver(): Driver {
    return this.driver;
  }

  getConfig(): Neo4jConfig {
    return this.config;
  }

  int(value: number) {
    return int(value);
  }

  beginTransaction(database?: string): Transaction {
    const session = this.getWriteSession(database);

    return session.beginTransaction();
  }

  getReadSession(database?: string) {
    return this.driver.session({
      database: database || this.config.database,
      defaultAccessMode: neo4j.session.READ,
    });
  }

  getWriteSession(database?: string) {
    return this.driver.session({
      database: database || this.config.database,
      defaultAccessMode: neo4j.session.WRITE,
    });
  }

  read(
    cypher: string,
    params?: Record<string, any>,
    databaseOrTransaction?: string | Transaction
  ): Result {
    if (databaseOrTransaction instanceof TransactionImpl) {
      return (<Transaction>databaseOrTransaction).run(cypher, params);
    }

    const session = this.getReadSession(<string>databaseOrTransaction);
    return session.run(cypher, params);
  }

  write(
    cypher: string,
    params?: Record<string, any>,
    databaseOrTransaction?: string | Transaction
  ): Result {
    if (databaseOrTransaction instanceof TransactionImpl) {
      return (<Transaction>databaseOrTransaction).run(cypher, params);
    }

    const session = this.getWriteSession(<string>databaseOrTransaction);
    return session.run(cypher, params);
  }

  async findWithChildrenByIdAsTree(id: string) {
    try {
      const node = await this.findById(id);
      if (!node) {
        return null;
      }
      const idNum = parseInt(id);

      const cypher =
        "MATCH p=(n)-[:CHILDREN*]->(m) \
            WHERE  id(n) = $idNum and n.isDeleted=false and m.isDeleted=false \
            WITH COLLECT(p) AS ps \
            CALL apoc.convert.toTree(ps) yield value \
            RETURN value";

      const result = await this.read(cypher, { idNum });
      if (!result["records"][0]) {
        return null;
      }
      return result["records"][0]["_fields"];
    } catch (error) {
      throw newError(error, "500");
    }
  }
  async findByIdWithTreeStructure(id: string) {
    let tree = await this.findWithChildrenByIdAsTree(id);

    if (!tree) {
      return tree;
    } else if (Object.keys(tree[0]).length === 0) {
      tree = await this.findById(id);
      const rootNodeObject = { root: tree };
      return rootNodeObject;
    } else {
      const rootNodeObject = { root: tree };
      return rootNodeObject;
    }
  }

  async findById(id: string, databaseOrTransaction?: string | Transaction) {
    try {
      const idNum = parseInt(id);

      const cypher =
        "MATCH (n {isDeleted: false}) where id(n) = $idNum return n";

      const result = await this.read(cypher, { idNum });
      if (!result["records"][0]) {
        return null;
      }

      return result["records"][0]["_fields"];
    } catch (error) {
      throw newError(error, "500");
    }
  }

  async findNodeCountWithoutChildrenByClassName(
    class_name: string,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const cypher = `MATCH (c {isDeleted: false}) where c.hasParent = false and c.class_name=$class_name RETURN count(c)`;

      const res = await this.read(cypher, { class_name });

      return successResponse(res["records"][0]["_fields"][0].low);
    } catch (error) {
      throw newError(error, "500");
    }
  }

  async findRootNodeByClassName(
    params: findNodeCountByClassNameDto,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const cypher = `MATCH (node {isDeleted: false}) where node.hasParent = false and node.class_name=$class_name return node`;

      const res = await this.read(cypher, params);

      return successResponse(res);
    } catch (error) {
      throw newError(error, "500");
    }
  }

  async createNode(
    params: object,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const cyperQuery = createDynamicCyperCreateQuery(params);

      if (databaseOrTransaction instanceof TransactionImpl) {
        return (<Transaction>databaseOrTransaction).run(cyperQuery, params);
      }

      const res = await this.write(cyperQuery, params);

      return res["records"][0]["_fields"][0];
    } catch (error) {
      throw newError(error, "500");
    }
  }

  async updateById(id: string, params: object) {
    try {
      const node = await this.findById(id);
      if (!node) {
        return null;
      }
      const cyperQuery = updateNodeQuery(id, params);

      const res = await this.write(cyperQuery, params);

      return res["records"][0]["_fields"][0];
    } catch (error) {
      throw newError(error, "500");
    }
  }

  async deleteRelations(id: string) {
    try {
      //parentı getirme querisi
      await this.findById(id);
      const parentNode = await this.getParentById(id);
      const parent_id = parentNode["_fields"][0]["properties"].self_id.low;
      //delete relation query
      if (parentNode) {
        await this.deleteChildrenRelation(id);
        await this.deleteParentRelation(id);
        //-------------------------------------------------

        //nodun bir propertisini güncelleme
        await this.updateHasParentProp(id, false);

        //nodun bir relationınında kaç node olduğunu bulma
        const parentChildCount = await this.getChildrenCount(parent_id);

        if (parentChildCount === 0) {
          //nodun bir propertisini güncelleme
          this.updateSelectableProp(parent_id, true);
        }
      }
    } catch (error) {
      throw newError(error, "500");
    }
  }
  async addRelations(_id: string, _target_parent_id: string) {
    try {
      await this.addChildrenRelationById(_id, _target_parent_id);

      await this.addParentRelationById(_id, _target_parent_id);

      //update 1 property of node
      await this.updateHasParentProp(_id, true);

      //update 1 property of node
      await this.updateSelectableProp(_target_parent_id, false);
    } catch (error) {
      throw newError(error, "500");
    }
  }
  async findOneNodeByKey(key: string) {
    try {
      //find node by key
      const result = await this.read(
        "match (n {isDeleted: false, key:$key})  return n",
        { key: key }
      );

      if (!result) {
        return null;
      }
      var node = result["records"][0]["_fields"][0];

      return node;
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateHasParentProp(id: string, hasParent: boolean) {
    try {
      const res = await this.write(
        "MATCH (node {isDeleted: false}) where id(node)= $id set node.hasParent=$hasParent return node",
        {
          id: parseInt(id),
          hasParent,
        }
      );

      return successResponse(res["records"][0]["_fields"][0]);
    } catch (error) {
      throw newError(failedResponse(error), "400");
    }
  }

  async updateIsDeletedProp(id: string, isDeleted: boolean) {
    try {
      const res = await this.write(
        "MATCH (node {isDeleted: false}) where id(node)= $id set node.isDeleted=$isDeleted return node",
        {
          id: parseInt(id),
          isDeleted,
        }
      );

      return successResponse(res["records"][0]["_fields"][0]);
    } catch (error) {
      throw newError(failedResponse(error), "400");
    }
  }

  async updateSelectableProp(id: string, selectable: boolean) {
    try {
      const res = await this.write(
        "MATCH (node {isDeleted: false}) where id(node)= $id set node.selectable=$selectable return node",
        {
          id: parseInt(id),
          selectable,
        }
      );

      return successResponse(res["records"][0]["_fields"][0]);
    } catch (error) {
      throw newError(failedResponse(error), "400");
    }
  }

  async addRelationWithRelationName(
    first_node_id: string,
    second_node_id: string,
    relationName: string
  ) {
    try {
      const res = await this.write(
        `MATCH (c {isDeleted: false}) where id(c)= $first_node_id MATCH (p {isDeleted: false}) where id(p)= $second_node_id create (p)-[:${relationName}]-> (c)`,
        {
          first_node_id: parseInt(first_node_id),
          target_parent_id: parseInt(second_node_id),
        }
      );

      return successResponse(res);
    } catch (error) {
      throw newError(failedResponse(error), "400");
    }
  }

  async addChildrenRelationById(child_id: string, target_parent_id: string) {
    try {
      const res = await this.write(
        "MATCH (c {isDeleted: false}) where id(c)= $id MATCH (p {isDeleted: false}) where id(p)= $target_parent_id  create (p)-[:CHILDREN]-> (c)",
        { id: parseInt(child_id), target_parent_id: parseInt(target_parent_id) }
      );

      return successResponse(res);
    } catch (error) {
      throw newError(failedResponse(error), "400");
    }
  }

  async addParentRelationById(child_id: string, parent_id: string) {
    try {
      const res = await this.write(
        "MATCH (c {isDeleted: false}) where id(c)= $id MATCH (p {isDeleted: false}) where id(p)= $target_parent_id  create (c)-[:CHILD_OF]-> (p)",
        { id: parseInt(child_id), target_parent_id: parseInt(parent_id) }
      );

      return successResponse(res);
    } catch (error) {
      throw newError(failedResponse(error), "400");
    }
  }

  async createChildrenByLabelClass(entity: object) {
    try {
      const dynamicCyperParameter = createDynamiCyperParam(entity);
      const query =
        ` match (y: ${entity["labelclass"]} {isDeleted: false}) where id(y)= $parent_id  create (y)-[:CHILDREN]->` +
        dynamicCyperParameter;

      const res = await this.write(query, entity);

      return successResponse(res);
    } catch (error) {
      throw newError(failedResponse(error), "400");
    }
  }

  async addParentByLabelClass(entity) {
    const query = `match (x: ${entity.labelclass} {isDeleted: false, code: $code}) \
    match (y: ${entity.labelclass} {isDeleted: false}) where id(y)= $parent_id \
    create (x)-[:CHILD_OF]->(y)`;
    try {
      const res = await this.write(query, entity);

      return successResponse(res);
    } catch (error) {
      throw newError(failedResponse(error), "400");
    }
  }

  async deleteRelationWithRelationName(id: string, relationName: string) {
    try {
      const res = await this.write(
        `MATCH (c {isDeleted: false})<-[r:${relationName}]-(p {isDeleted: false}) where id(c)= $id delete r`,
        { id: parseInt(id) }
      );

      return successResponse(res);
    } catch (error) {
      throw newError(failedResponse(error), "400");
    }
  }

  async deleteChildrenRelation(id: string) {
    try {
      const res = await this.write(
        "MATCH (node {isDeleted: false})<-[r:CHILDREN]-(p {isDeleted: false}) where id(node)= $id delete r",
        { id: parseInt(id) }
      );

      return successResponse(res);
    } catch (error) {
      throw newError(failedResponse(error), "400");
    }
  }

  async deleteParentRelation(id: string) {
    try {
      const res = await this.write(
        "MATCH (c {isDeleted: false})-[r:CHILD_OF]->(p {isDeleted: false}) where id(c)= $id delete r",
        { id: parseInt(id) }
      );

      return successResponse(res.records[0]);
    } catch (error) {
      throw newError(failedResponse(error), "400");
    }
  }

  async delete(id: string) {
    try {
      //children count query
      const node = await this.findById(id);

      if (!node) {
        return null;
      }

      const childrenCount = await this.getChildrenCount(id);

      if (childrenCount > 0) {
        throw new HttpException("cannot delete node with children", 400);
      } else {
        const parent = await this.getParentById(id);

        if (parent) {
          const parent_id = parent["_fields"][0]["properties"].self_id;
          const childrenCount = await this.getChildrenCount(parent_id);
          if (childrenCount === 0) {
            this.updateSelectableProp(parent_id, true);
          }
        }
        const deletedNode = await this.updateIsDeletedProp(id, true);
        return deletedNode;
      }
    } catch (error) {
      throw new HttpException(
        { message: "error", code: 200 },
        HttpStatus.NOT_ACCEPTABLE
      );
    }
  }

  async findAllByClassName(data: PaginationNeo4jParams) {
    let { page = 0, orderByColumn = "name" } = data;
    const { limit = 10, class_name, orderBy = "DESC" } = data;

    if (orderByColumn == "undefined") {
      orderByColumn = "name";
    }
    const res = await this.findNodeCountWithoutChildrenByClassName(class_name);
    const count = res.result;

    const pagecount = Math.ceil(count / limit);

    if (page > pagecount) {
      page = pagecount;
    }
    let skip = page * limit;
    if (skip >= count) {
      skip = count - limit;
      if (skip < 0) {
        skip = 0;
      }
    }
    const getNodeWithoutParent =
      "MATCH (x {isDeleted: false}) where x.hasParent = false and x.class_name=$class_name return x ORDER BY x." +
      orderByColumn +
      " " +
      orderBy +
      " SKIP $skip LIMIT $limit";
    const result = await this.read(getNodeWithoutParent, {
      class_name,
      skip: int(skip),
      limit: int(limit),
    });
    const arr = [];
    for (let i = 0; i < result["records"].length; i++) {
      arr.push(result["records"][i]["_fields"][0]);
    }
    const pagination = { count, page, limit };
    const nodes = [];
    nodes.push(arr);
    nodes.push(pagination);
    return nodes;
  }

  async create(entity) {
    if (entity["parent_id"]) {
      const createdNode = await this.createChildrenByLabelClass(entity);

      await this.write(
        `match (x: ${entity["labelclass"]} {isDeleted: false, key: $key}) set x.self_id = id(x)`,
        {
          key: entity.key,
        }
      );
      //Add relation between parent and created node by CHILD_OF relation
      await this.addParentByLabelClass(entity);

      //set parent node selectable prop false
      await this.updateSelectableProp(entity["parent_id"], false);

      return createdNode.result["records"][0]["_fields"][0];
    } else {
      entity["hasParent"] = false;

      const createdNode = await this.createNode(entity);

      await this.write(
        `match (x:${entity["labelclass"]}  {isDeleted: false,  key: $key}) set x.self_id = id(x)`,
        {
          key: entity["key"],
        }
      );
      return createdNode;
    }
  }

  async getParentById(id: string) {
    try {
      const res = await this.read(
        "MATCH (c {isDeleted: false}) where id(c)= $id match(k {isDeleted: false}) match (c)-[:CHILD_OF]->(k) return k",
        { id: parseInt(id) }
      );

      return res["records"][0];
    } catch (error) {
      throw newError(failedResponse(error), "400");
    }
  }

  async getChildrenCount(id: string) {
    try {
      const res = await this.read(
        "MATCH (c {isDeleted: false}) where id(c)= $id MATCH (d {isDeleted: false}) MATCH (c)-[:CHILDREN]->(d) return count(d)",
        { id: parseInt(id) }
      );

      return res["records"][0]["_fields"][0].low;
    } catch (error) {
      throw newError(failedResponse(error), "400");
    }
  }

  onApplicationShutdown() {
    return this.driver.close();
  }
}
