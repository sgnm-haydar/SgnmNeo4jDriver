import {
  Injectable,
  Inject,
  OnApplicationShutdown,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import neo4j, {
  Driver,
  Result,
  int,
  Transaction,
  QueryResult,
} from "neo4j-driver";
import { Neo4jConfig } from "./interfaces/neo4j-config.interface";
import { NEO4J_OPTIONS, NEO4J_DRIVER } from "./neo4j.constants";
import TransactionImpl from "neo4j-driver-core/lib/transaction";
import { newError } from "neo4j-driver-core";
import {
  changeObjectKeyName,
  createDynamicCyperCreateQuery,
  dynamicFilterPropertiesAdder,
  dynamicFilterPropertiesAdderAndAddParameterKey,
  dynamicLabelAdder,
  dynamicNotLabelAdder,
  dynamicOrderByColumnAdder,
  dynamicOrLabelAdder,
  dynamicUpdatePropertyAdder,
  dynamicUpdatePropertyAdderAndAddParameterKey,
  filterArrayForEmptyString,
  updateNodeQuery,
} from "./func/common.func";
import { successResponse } from "./constant/success.response.object";
import { failedResponse } from "./constant/failed.response.object";
import {
  add_relation_with_relation_name__create_relation_error,
  add_relation_with_relation_name__must_entered_error,
  create_node__must_entered_error,
  create_node__node_not_created_error,
  deleteParentRelationError,
  delete_children_relation_error,
  delete__get_parent_by_id_error,
  find_by_id__must_entered_error,
  find_by_realm__not_found_error,
  find_by_realm_with_tree_structure__not_entered_error,
  find_by_realm__not_entered_error,
  find_node_by_id_and_label__must_entered_error,
  find_node_by_id_and_label__not_found_error,
  find_with_children_by_realm_as_tree_error,
  find_with_children_by_realm_as_tree__find_by_realm_error,
  find_with_children_by_realm_as_tree__not_entered_error,
  get_children_count__must_entered_error,
  get_parent_by_id__must_entered_error,
  has_children_error,
  node_not_found,
  parent_of_child_not_found,
  tree_structure_not_found_by_realm_name_error,
  update_by_id__must_entered_error,
  update_by_id__update_error,
  delete_relation_must_entered_error,
  find_one_node_by_key_must_entered_error,
  delete__must_entered_error,
  remove_label__must_entered_error,
  update_label__must_entered_error,
  find_children_by_id__must_entered_error,
  delete__update_is_deleted_prop_error,
  incorret_operation,
  node_cannot_delete,
  library_server_error,
  invalid_direction_error,
  node_not_updated,
  required_fields_must_entered,
} from "./constant/custom.error.object";
import { RelationDirection } from "./constant/relation.direction.enum";
import { queryObjectType } from "./dtos/dtos";
import { SearchType } from "./constant/pagination.enum";
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
  async findNodeByIdAndLabel(id: string, label: string) {
    try {
      if (!id || !label) {
        throw new HttpException(
          find_node_by_id_and_label__must_entered_error,
          400
        );
      }
      const idNum = parseInt(id);
      const cypher = `MATCH (c: ${label} {isDeleted: false}) where id(c)=$idNum return c`;
      const result = await this.read(cypher, { idNum });
      if (!result["records"].length) {
        throw new HttpException(
          find_node_by_id_and_label__not_found_error,
          404
        );
      }
      return result["records"];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw newError(error, "500");
      }
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
      return res["records"][0]["_fields"][0];
      //return successResponse(res["records"][0]["_fields"][0]);  HATA Veriyor
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
  async deleteChildrenRelation(id: string) {
    try {
      const res = await this.write(
        "MATCH (node {isDeleted: false})<-[r:PARENT_OF]-(p {isDeleted: false}) where id(node)= $id delete r",
        { id: parseInt(id) }
      );
      const { relationshipsDeleted } = res.summary.updateStatistics.updates();
      if (relationshipsDeleted === 0) {
        throw new HttpException(delete_children_relation_error, 400);
      }
      return successResponse(res);
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
  async deleteParentRelation(id: string) {
    try {
      const res = await this.write(
        "MATCH (c {isDeleted: false})<-[r:PARENT_OF]-(p {isDeleted: false}) where id(c)= $id delete r",
        { id: parseInt(id) }
      );
      if (!res) {
        throw new HttpException(deleteParentRelationError, 400);
      }
      return successResponse(res.records[0]);
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw newError(failedResponse(error), "400");
      }
    }
  }
  onApplicationShutdown() {
    return this.driver.close();
  }
  async addParentRelationById(child_id: string, target_parent_id: string) {
    try {
      const res = await this.write(
        "MATCH (c {isDeleted: false}) where id(c)= $id MATCH (p {isDeleted: false}) where id(p)= $target_parent_id  MERGE (p)-[:PARENT_OF]-> (c)",
        { id: parseInt(child_id), target_parent_id: parseInt(target_parent_id) }
      );
      if (!res) {
        throw new HttpException(null, 400);
      }
      return res;
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(
          library_server_error,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }
  async deleteRelations(id: string) {
    const a = 1;
    try {
      if (!id) {
        throw new HttpException(delete_relation_must_entered_error, 400);
      }
      const parentNode = await this.getParentById(id);
      const parent_id = parentNode["_fields"][0]["identity"].low;
      //delete relation query
      if (parentNode) {
        await this.deleteChildrenRelation(id);
        await this.deleteParentRelation(id);
      }
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
  async addRelations(_id: string, _target_parent_id: string) {
    try {
      await this.addParentRelationById(_id, _target_parent_id);
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
  async findWithChildrenByRealmAsTree(label: string, realm: string) {
    try {
      if (!label || !realm) {
        throw new HttpException(
          find_with_children_by_realm_as_tree__not_entered_error,
          400
        );
      }
      const node = await this.findByRealm(label, realm);
      if (!node) {
        throw new HttpException(
          find_with_children_by_realm_as_tree__find_by_realm_error,
          404
        );
      }
      const cypher = `MATCH p=(n:${label})-[:PARENT_OF*]->(m) \
            WHERE  n.realm = $realm and n.isDeleted=false and m.isDeleted=false and m.canDisplay=true \
            WITH COLLECT(p) AS ps \
            CALL apoc.convert.toTree(ps) yield value \
            RETURN value`;

      const result = await this.read(cypher, { realm });
      if (!result["records"][0].length) {
        throw new HttpException(find_with_children_by_realm_as_tree_error, 404);
      }
      return result["records"][0]["_fields"][0];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw newError(error, "500");
      }
    }
  }
  async findByRealmWithTreeStructure(label: string, realm: string) {
    try {
      if (!label || !realm) {
        throw new HttpException(
          find_by_realm_with_tree_structure__not_entered_error,
          400
        );
      }
      let tree = await this.findWithChildrenByRealmAsTree(label, realm);
      if (!tree) {
        throw new HttpException(
          tree_structure_not_found_by_realm_name_error,
          404
        );
      } else if (Object.keys(tree).length === 0) {
        tree = await this.findByRealm(label, realm);
        const rootNodeObject = { root: tree };
        return rootNodeObject;
      } else {
        const rootNodeObject = { root: tree };
        return rootNodeObject;
      }
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw newError(error, "500");
      }
    }
  }
  async findByRealm(
    label: string,
    realm: string,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      if (!label || !realm) {
        throw new HttpException(find_by_realm__not_entered_error, 400);
      }
      const cypher = `MATCH (n:${label} {isDeleted: false}) where  n.realm = $realm return n`;
      const result = await this.read(cypher, { realm });
      if (!result["records"][0].length) {
        throw new HttpException(find_by_realm__not_found_error, 404);
      }
      return result["records"][0]["_fields"][0];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw newError(error, "500");
      }
    }
  }
  async findById(id: string, databaseOrTransaction?: string | Transaction) {
    try {
      if (!id) {
        throw new HttpException(find_by_id__must_entered_error, 400);
      }
      const idNum = parseInt(id);

      const cypher =
        "MATCH (n {isDeleted: false}) where id(n) = $idNum return n";

      const result = await this.read(cypher, { idNum });
      if (!result["records"].length) {
        throw new HttpException(node_not_found, 404);
      }
      return result["records"][0]["_fields"][0];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw newError(error, "500");
      }
    }
  }
  async removeLabel(id: string, label: string[]) {
    try {
      if (!id || !label) {
        throw new HttpException(remove_label__must_entered_error, 400);
      }
      const resArray = [];
      if (label && label.length > 0) {
        for (let i = 0; i < label.length; i++) {
          const res = await this.write(
            `MATCH (c {isDeleted: false}) where id(c)= $id remove c:${label[i]}`,
            {
              id: parseInt(id),
            }
          );
          resArray.push(res);
        }
      }
      return resArray;
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
  async updateLabel(id: string, label: string[]) {
    try {
      if (!id || !label) {
        throw new HttpException(update_label__must_entered_error, 400);
      }
      const resArray = [];
      if (label && label.length > 0) {
        for (let i = 0; i < label.length; i++) {
          const res = await this.write(
            `MATCH (c {isDeleted: false}) where id(c)= $id set c:${label[i]}`,
            {
              id: parseInt(id),
            }
          );
          resArray.push(res);
        }
      }
      return resArray;
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
  async updateById(id: string, params: object) {
    try {
      const a = 1;
      if (!id || !params) {
        throw new HttpException(update_by_id__must_entered_error, 400);
      }
      const cyperQuery = updateNodeQuery(id, params);
      const res = await this.write(cyperQuery, params);
      if (!res["records"][0]) {
        throw new HttpException(update_by_id__update_error, 400);
      }
      return res["records"][0]["_fields"][0];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw newError(error, "500");
      }
    }
  }

  async findOneNodeByKey(key: string) {
    try {
      if (!key) {
        throw new HttpException(find_one_node_by_key_must_entered_error, 400);
      }
      //find node by key
      let node = await this.read(
        `match(p {key:$key}) where NOT p:Virtual  return p`,
        {
          key,
        }
      );
      if (!node["records"].length) {
        return null;
      }
      node = node["records"][0]["_fields"][0];
      const result = {
        id: node["identity"].low,
        labels: node["labels"],
        properties: node["properties"],
      };
      return result;
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      }
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async findNodesWithRelationNameById(id, relationName) {
    try {
      if (!id || !relationName) {
        throw new HttpException(
          add_relation_with_relation_name__must_entered_error,
          400
        );
      }
      const res = await this.write(
        `MATCH (c {isDeleted: false}) where id(c)= $id MATCH (p {isDeleted: false}) match (c)-[r:${relationName}]-> (p) return count(r)`,
        {
          id,
        }
      );
      return res.records;
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response.message, code: error.response.code },
          error.status
        );
      } else {
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
  async getParentById(id: string) {
    try {
      if (!id) {
        throw new HttpException(get_parent_by_id__must_entered_error, 400);
      }
      const res = await this.read(
        "MATCH (c {isDeleted: false}) where id(c)= $id match(k {isDeleted: false}) match (k)-[:PARENT_OF]->(c) return k",
        { id: parseInt(id) }
      );
      if (!res["records"][0].length) {
        throw new HttpException(parent_of_child_not_found, 404);
      }
      return res["records"][0];
    } catch (error) {
      if (error.response.code) {
        throw new HttpException(
          { message: error.response.message, code: error.response.code },
          error.status
        );
      }
      throw newError(failedResponse(error), "400");
    }
  }
  async findChildrenById(id: string) {
    try {
      if (!id) {
        throw new HttpException(find_children_by_id__must_entered_error, 400);
      }
      const idNum = parseInt(id);
      await this.findById(id);
      const cypher =
        "match (n {isDeleted: false})-[:PARENT_OF]->(p {isDeleted: false}) where id(n)=$idNum  return p";
      const result = await this.read(cypher, { idNum });
      return result;
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw newError(error, "500");
      }
    }
  }
  async getChildrenCount(id: string) {
    try {
      if (!id) {
        throw new HttpException(get_children_count__must_entered_error, 400);
      }
      const res = await this.read(
        "MATCH (c {isDeleted: false}) where id(c)= $id MATCH (d {isDeleted: false}) where not d:JointSpaces MATCH (c)-[:PARENT_OF]->(d) return count(d)",
        { id: parseInt(id) }
      );
      return res["records"][0]["_fields"][0].low;
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      }
      throw newError(failedResponse(error), "400");
    }
  }
  async delete(id: string) {
    try {
      if (!id) {
        throw new HttpException(delete__must_entered_error, 400);
      }
      //children count query
      const node = await this.findById(id);

      if (!node) {
        throw new HttpException(node_not_found, 404);
      }
      const childrenCount = await this.getChildrenCount(id);
      if (childrenCount > 0) {
        throw new HttpException(has_children_error, 400);
      } else {
        const parent = await this.getParentById(id);

        if (!parent) {
          throw new HttpException(delete__get_parent_by_id_error, 404);
        }
        if (
          node["properties"]["canDelete"] == undefined ||
          node["properties"]["canDelete"] == null ||
          node["properties"]["canDelete"] == true
        ) {
          const deletedNode = await this.updateIsDeletedProp(id, true);
          if (!deletedNode) {
            throw new HttpException(delete__update_is_deleted_prop_error, 400);
          }
          return deletedNode;
        }
        throw new HttpException(node_cannot_delete, 400);
      }
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, HttpStatus.NOT_ACCEPTABLE);
      }
    }
  }
  async changeObjectChildOfPropToChildren(node: any) {
    node["root"]["children"] = node["root"]["parent_of"];
    delete node["root"]["parent_of"];
    if (node["root"]["children"]) {
      for (let i = 0; i < node["root"]["children"].length; i++) {
        node["root"]["children"][i]["children"] =
          node["root"]["children"][i]["parent_of"];
        delete node["root"]["children"][i]["parent_of"];
        if (node["root"]["children"][i]["children"]) {
          for (
            let j = 0;
            j < node["root"]["children"][i]["children"].length;
            j++
          ) {
            node["root"]["children"][i]["children"][j]["children"] =
              node["root"]["children"][i]["children"][j]["parent_of"];
            delete node["root"]["children"][i]["children"][j]["parent_of"];
            if (node["root"]["children"][i]["children"][j]["children"]) {
              for (
                let k = 0;
                k <
                node["root"]["children"][i]["children"][j]["children"].length;
                k++
              ) {
                node["root"]["children"][i]["children"][j]["children"][k][
                  "children"
                ] =
                  node["root"]["children"][i]["children"][j]["children"][k][
                  "parent_of"
                  ];
                delete node["root"]["children"][i]["children"][j]["children"][
                  k
                ]["parent_of"];
                if (
                  node["root"]["children"][i]["children"][j]["children"][k][
                  "children"
                  ]
                ) {
                  for (
                    let l = 0;
                    l <
                    node["root"]["children"][i]["children"][j]["children"][k][
                      "children"
                    ].length;
                    l++
                  ) {
                    node["root"]["children"][i]["children"][j]["children"][k][
                      "children"
                    ][l]["children"] =
                      node["root"]["children"][i]["children"][j]["children"][k][
                      "children"
                      ][l]["parent_of"];
                    delete node["root"]["children"][i]["children"][j][
                      "children"
                    ][k]["children"][l]["parent_of"];
                    if (
                      node["root"]["children"][i]["children"][j]["children"][k][
                      "children"
                      ][l]["children"]
                    ) {
                      for (
                        let m = 0;
                        m <
                        node["root"]["children"][i]["children"][j]["children"][
                          k
                        ]["children"][l]["children"].length;
                        m++
                      ) {
                        node["root"]["children"][i]["children"][j]["children"][
                          k
                        ]["children"][l]["children"][m]["children"] =
                          node["root"]["children"][i]["children"][j][
                          "children"
                          ][k]["children"][l]["children"][m]["parent_of"];
                        delete node["root"]["children"][i]["children"][j][
                          "children"
                        ][k]["children"][l]["children"][m]["parent_of"];
                        if (
                          node["root"]["children"][i]["children"][j][
                          "children"
                          ][k]["children"][l]["children"][m]["children"]
                        ) {
                          for (
                            let n = 0;
                            n <
                            node["root"]["children"][i]["children"][j][
                              "children"
                            ][k]["children"][l]["children"][m]["children"]
                              .length;
                            n++
                          ) {
                            node["root"]["children"][i]["children"][j][
                              "children"
                            ][k]["children"][l]["children"][m]["children"][n][
                              "children"
                            ] =
                              node["root"]["children"][i]["children"][j][
                              "children"
                              ][k]["children"][l]["children"][m]["children"][n][
                              "parent_of"
                              ];
                            delete node["root"]["children"][i]["children"][j][
                              "children"
                            ][k]["children"][l]["children"][m]["children"][n][
                              "parent_of"
                            ];
                            if (
                              node["root"]["children"][i]["children"][j][
                              "children"
                              ][k]["children"][l]["children"][m]["children"][n][
                              "children"
                              ]
                            ) {
                              for (
                                let o = 0;
                                o <
                                node["root"]["children"][i]["children"][j][
                                  "children"
                                ][k]["children"][l]["children"][m]["children"][
                                  n
                                ]["children"].length;
                                o++
                              ) {
                                node["root"]["children"][i]["children"][j][
                                  "children"
                                ][k]["children"][l]["children"][m]["children"][
                                  n
                                ]["children"][o]["children"] =
                                  node["root"]["children"][i]["children"][j][
                                  "children"
                                  ][k]["children"][l]["children"][m][
                                  "children"
                                  ][n]["children"][o]["parent_of"];
                                delete node["root"]["children"][i]["children"][
                                  j
                                ]["children"][k]["children"][l]["children"][m][
                                  "children"
                                ][n]["children"][o]["parent_of"];
                                if (
                                  node["root"]["children"][i]["children"][j][
                                  "children"
                                  ][k]["children"][l]["children"][m][
                                  "children"
                                  ][n]["children"][o]["children"]
                                ) {
                                  for (
                                    let p = 0;
                                    p <
                                    node["root"]["children"][i]["children"][j][
                                      "children"
                                    ][k]["children"][l]["children"][m][
                                      "children"
                                    ][n]["children"][o]["children"].length;
                                    p++
                                  ) {
                                    node["root"]["children"][i]["children"][j][
                                      "children"
                                    ][k]["children"][l]["children"][m][
                                      "children"
                                    ][n]["children"][o]["children"][p][
                                      "children"
                                    ] =
                                      node["root"]["children"][i]["children"][
                                      j
                                      ]["children"][k]["children"][l][
                                      "children"
                                      ][m]["children"][n]["children"][o][
                                      "children"
                                      ][p]["parent_of"];
                                    delete node["root"]["children"][i][
                                      "children"
                                    ][j]["children"][k]["children"][l][
                                      "children"
                                    ][m]["children"][n]["children"][o][
                                      "children"
                                    ][p]["parent_of"];
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return node;
  }
  async addRelationWithRelationName(
    first_node_id: string,
    second_node_id: string,
    relationName: string,
    relationDirection: RelationDirection = RelationDirection.RIGHT
  ) {
    try {
      let res: QueryResult;
      switch (relationDirection) {
        case RelationDirection.RIGHT:
          res = await this.write(
            `MATCH (c {isDeleted: false}) where id(c)= $first_node_id MATCH (p {isDeleted: false}) where id(p)= $second_node_id MERGE (c)-[:${relationName}]-> (p)`,
            {
              first_node_id: parseInt(first_node_id),
              second_node_id: parseInt(second_node_id),
            }
          );
          break;
        case RelationDirection.LEFT:
          res = await this.write(
            `MATCH (c {isDeleted: false}) where id(c)= $first_node_id MATCH (p {isDeleted: false}) where id(p)= $second_node_id MERGE (c)<-[:${relationName}]- (p)`,
            {
              first_node_id: parseInt(first_node_id),
              second_node_id: parseInt(second_node_id),
            }
          );
          break;
        default:
          throw new HttpException("uygun yön giriniz", 400);
      }

      const { relationshipsCreated } =
        await res.summary.updateStatistics.updates();
      if (relationshipsCreated === 0) {
        throw new HttpException(
          add_relation_with_relation_name__create_relation_error,
          400
        );
      }
      return successResponse(res);
    } catch (error) {
      if (error?.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
  async addRelationWithRelationNameByKey(
    first_node_key: string,
    second_node_key: string,
    relationName: string,
    relationDirection: RelationDirection = RelationDirection.RIGHT
  ) {
    try {
      if (
        !first_node_key ||
        !second_node_key ||
        relationName.trim() === "" ||
        !relationName
      ) {
        throw new HttpException(
          add_relation_with_relation_name__must_entered_error,
          400
        );
      }
      const values = Object.values(RelationDirection);
      if (!values.includes(relationDirection)) {
        throw new HttpException("uygun yön giriniz", 400);
      }
      let res: QueryResult;

      switch (relationDirection) {
        case RelationDirection.RIGHT:
          res = await this.write(
            `MATCH (c {isDeleted: false}) where c.key= $first_node_key MATCH (p {isDeleted: false}) where p.key= $second_node_key MERGE (c)-[:${relationName}]-> (p)`,
            {
              first_node_key,
              second_node_key,
            }
          );
          break;
        case RelationDirection.LEFT:
          res = await this.write(
            `MATCH (c {isDeleted: false}) where c.key= $first_node_key MATCH (p {isDeleted: false}) where p.key= $second_node_key MERGE (c)<-[:${relationName}]- (p)`,
            {
              first_node_key,
              second_node_key,
            }
          );
        default:
          throw new HttpException("uygun yön giriniz", 400);
      }
      if (relationDirection === RelationDirection.RIGHT) {
      } else {
      }
      const { relationshipsCreated } =
        await res.summary.updateStatistics.updates();
      if (relationshipsCreated === 0) {
        throw new HttpException(
          add_relation_with_relation_name__create_relation_error,
          400
        );
      }
      return successResponse(res);
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response.message, code: error.response.code },
          error.status
        );
      } else {
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
  //  Control down Control down Control down Control down Control down Control down Control down Control down Control down
  async findNodesByKeyWithRelationName(key: string, relationName: string) {
    const relations = await this.read(
      `match(p {key:$key}) match (c) where c.isDeleted=false match (p)-[:${relationName}]->(c) return c`,
      {
        key,
      }
    );
    if (relations.records.length === 0) {
      //throw new HttpException('hiç ilişkisi yok', 400);
      return null;
    }
    return relations.records;
  }
  async findNodeAndRelationByRelationNameAndId(
    id: string,
    relationName: string,
    direction: string
  ) {
    try {
      if (!id || !relationName) {
        let a = 1;
        //throw new HttpException(find_by_relation__must_entered_error, 400);
      }
      const idNum = parseInt(id);
      await this.findById(id);

      let cypher;
      if (direction == RelationDirection.LEFT) {
        cypher = `match (n {isDeleted: false})<-[r:${relationName}]-(p {isDeleted: false}) where id(n)=$idNum  return p,r`;
      } else if (direction == RelationDirection.RIGHT) {
        cypher = `match (n {isDeleted: false})-[r:${relationName}]->(p {isDeleted: false}) where id(n)=$idNum  return p,r`;
      }
      const result = await this.read(cypher, { idNum });
      return result;
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw newError(error, "500");
      }
    }
  }
  async deleteRelationByRelationId(id: string) {
    try {
      if (!id) {
        let a = 1;
        //throw new HttpException(delete_relation_by_relation_id__must_entered_error, 400);
      }
      const res = await this.write(
        `MATCH (c {isDeleted: false})-[r]-(p {isDeleted: false}) where id(r)= $id delete r`,
        { id: parseInt(id) }
      );
      let { relationshipsDeleted } =
        await res.summary.updateStatistics.updates();
      if (relationshipsDeleted === 0) {
        let a = 1;
        //throw new HttpException(delete_relation_by_relation_id__not_deleted_error, 400);
      }
      return successResponse(res);
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        //throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
  async findNodeByKeysAndRelationName(
    key: string,
    referenceKey: string,
    relationName: string,
    relationDirection: RelationDirection = RelationDirection.RIGHT
  ) {
    let relationExist: QueryResult;
    if (relationDirection === RelationDirection.RIGHT) {
      relationExist = await this.read(
        `match(p {isDeleted:false}) where p.key=$key match (c {isDeleted:false}) where c.referenceKey=$referenceKey match (p)-[:${relationName}]->(c) return p,c`,
        {
          key,
          referenceKey: referenceKey,
        }
      );
    } else if (relationDirection === RelationDirection.LEFT) {
      relationExist = await this.read(
        `match(p {isDeleted:false}) where p.key=$key match (c {isDeleted:false}) where c.referenceKey=$referenceKey match (p)<-[:${relationName}]-(c) return p,c`,
        {
          key,
          referenceKey: referenceKey,
        }
      );
    } else {
      throw new HttpException("uygun yön giriniz", 400);
    }
    return relationExist.records;
  }
  async checkSpecificVirtualNodeCountInDb(
    referenceKey: string,
    relationName: string
  ) {
    try {
      const node = await this.read(
        `match(p) match (c {referenceKey:$referenceKey,isDeleted:false}) match (p)-[:${relationName}]->(c) return c`,
        { referenceKey }
      );
      return node.records;
    } catch (error) {
      throw new HttpException(error, 500);
    }
  }
  async deleteVirtualNode(id: number) {
    try {
      const node = await this.write(
        `match (n:Virtual ) where id(n)=$id set n.isDeleted=true return n`,
        {
          id,
        }
      );
      return node.records[0]["_fields"][0];
    } catch (error) {
      throw new HttpException(error, 500);
    }
  }

  async findWithChildrenByRealmAsTreeOneLevel(label: string, realm: string) {
    try {
      if (!label || !realm) {
        throw new HttpException(
          find_with_children_by_realm_as_tree__not_entered_error,
          400
        );
      }
      const node = await this.findByRealm(label, realm);
      if (!node) {
        throw new HttpException(
          find_with_children_by_realm_as_tree__find_by_realm_error,
          404
        );
      }
      const cypher = `MATCH p=(n:${label})-[:PARENT_OF]->(m) \
            WHERE  n.realm = $realm and n.isDeleted=false and not n:Virtual and m.isDeleted=false and not m:Virtual and m.canDisplay=true \
            WITH COLLECT(p) AS ps \
            CALL apoc.convert.toTree(ps) yield value \
            RETURN value`;

      const result = await this.read(cypher, { realm });
      if (!result["records"][0].length) {
        throw new HttpException(find_with_children_by_realm_as_tree_error, 404);
      }
      return result["records"][0]["_fields"][0];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw newError(error, "500");
      }
    }
  }
  async findByRealmWithTreeStructureOneLevel(label: string, realm: string) {
    try {
      if (!label || !realm) {
        throw new HttpException(
          find_by_realm_with_tree_structure__not_entered_error,
          400
        );
      }
      let tree = await this.findWithChildrenByRealmAsTreeOneLevel(label, realm);
      if (!tree) {
        throw new HttpException(
          tree_structure_not_found_by_realm_name_error,
          404
        );
      } else if (Object.keys(tree).length === 0) {
        tree = await this.findByRealm(label, realm);
        const rootNodeObject = { root: tree };
        return rootNodeObject;
      } else {
        const rootNodeObject = { root: tree };
        return rootNodeObject;
      }
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw newError(error, "500");
      }
    }
  }

  async findChildNodesOfFirstParentNodeByLabelsRealmAndName(
    first_node_label: string,
    first_node_realm: string,
    second_child_node_label: string,
    second_child_node_name: string,
    children_nodes_label: string,
    relationName: string,
    relationDirection: RelationDirection = RelationDirection.RIGHT
  ) {
    try {
      if (
        !first_node_label ||
        !first_node_realm ||
        !second_child_node_label ||
        !second_child_node_name ||
        !children_nodes_label
      ) {
        throw new HttpException(
          add_relation_with_relation_name__must_entered_error, //DEĞİŞECEK
          400
        );
      }
      let res: QueryResult;
      switch (relationDirection) {
        case RelationDirection.RIGHT:
          res = await this.read(
            `MATCH (c:${first_node_label} {isDeleted: false}) where c.realm= $first_node_realm \
             MATCH (p:${second_child_node_label} {isDeleted: false}) where p.name= $second_child_node_name \
             MATCH  (c)-[:${relationName}]->(p)-[:${relationName}]->(z:${children_nodes_label} {isDeleted: false, isActive: true}) return z order by z.index asc`,
            {
              first_node_realm: first_node_realm,
              second_child_node_name: second_child_node_name,
            }
          );
          break;
        case RelationDirection.LEFT:
          res = await this.read(
            `MATCH (c:${first_node_label} {isDeleted: false}) where c.realm= $first_node_realm \
             MATCH (p:${second_child_node_label} {isDeleted: false}) where p.name= $second_child_node_name \
             MATCH  (c)<-[:${relationName}]-(p)<-[:${relationName}]-(z:${children_nodes_label} {isDeleted: false, isActive: true}) return z order by z.index asc`,
            {
              first_node_realm: first_node_realm,
              second_child_node_name: second_child_node_name,
            }
          );
          break;
        default:
          throw new HttpException("uygun yön giriniz", 400);
      }
      if (!res) {
        throw new HttpException(
          tree_structure_not_found_by_realm_name_error, //DEĞİŞECEK
          404
        );
      }
      return res;
    } catch (error) {
      if (error?.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async findByIdWithoutVirtualNode(id: string) {
    try {
      if (!id) {
        throw new HttpException(find_by_id__must_entered_error, 400);
      }
      const idNum = parseInt(id);

      const cypher =
        "MATCH (n {isDeleted: false}) where id(n) = $idNum and not n:Virtual return n";

      const result = await this.read(cypher, { idNum });
      if (!result["records"].length) {
        throw new HttpException(node_not_found, 404);
      }
      return result["records"][0]["_fields"][0];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw newError(error, "500");
      }
    }
  }

  async findStructureRootNode(key, label) {
    try {
      if (!key) {
        throw new HttpException(find_by_id__must_entered_error, 400); //DEĞİŞECEK
      }

      const cypher = `match(n:${label}) match(p {key:$key}) match (n)-[:PARENT_OF*]->(p) return n`;
      const structureRootNode = await this.read(cypher, { key });
      if (!structureRootNode || !structureRootNode["records"].length) {
        throw new HttpException(incorret_operation, 400);
      }
      return structureRootNode.records[0]["_fields"][0];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw newError(error, "500");
      }
    }
  }

  async getAllowedStructureTypeNode(realm, name) {
    const cypher =
      "match (n:FacilityTypes_EN {realm:$realm}) match(p {name:$name}) match(n)-[:PARENT_OF]->(p) return p";
    const allowedStructureTypeNode = this.read(cypher, { realm, name });
    return allowedStructureTypeNode;
  }
  async getAllowedStructures(key) {
    const cypher =
      "match(n {key:$key}) match(p:AllowedStructure) match (n)-[:PARENT_OF]->(p) return p";
    const allowedStructures = this.read(cypher, { key });
    return allowedStructures;
  }

  async deleteUnconditionally(id: string) {
    try {
      if (!id) {
        throw new HttpException(delete__must_entered_error, 400);
      }
      //children count query
      const node = await this.findById(id);
      if (!node) {
        throw new HttpException(node_not_found, 404);
      }
      if (node["properties"]["canDelete"] == true) {
        const deletedNode = await this.updateIsDeletedProp(id, true);
        return deletedNode;
      }
      throw new HttpException(node_cannot_delete, 400);
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, HttpStatus.NOT_ACCEPTABLE);
      }
    }
  }

  //---------------------------------------------- Yeni version ---------------------------

  async findByIdAndFilters(
    id: number,
    filter_properties: object = {},
    excluded_labels: Array<string> = [],
    databaseOrTransaction?: string | Transaction
  ) {
    const excludedLabelsLabelsWithoutEmptyString =
      filterArrayForEmptyString(excluded_labels);
    let query =
      "match (n" +
      dynamicFilterPropertiesAdder(filter_properties) +
      ` where id(n)=${id} `;
    if (
      excludedLabelsLabelsWithoutEmptyString &&
      excludedLabelsLabelsWithoutEmptyString.length > 0
    ) {
      query =
        query +
        " and " +
        dynamicNotLabelAdder("n", excludedLabelsLabelsWithoutEmptyString) +
        ` return n`;
    } else {
      query = query + ` return n`;
    }

    filter_properties["id"] = id;
    const node = await this.read(
      query,
      filter_properties,
      databaseOrTransaction
    );

    delete filter_properties["id"]

    if (node.records.length === 0) {
      throw new HttpException(node_not_found, 404);
    } else {
      return node.records[0]["_fields"][0];
    }
  }

  async findByLabelAndFilters(
    labels: Array<string> = [""],
    filter_properties: object = {},
    excluded_labels: Array<string> = [""],
    databaseOrTransaction?: string | Transaction
  ) {
    const excludedLabelsLabelsWithoutEmptyString =
      filterArrayForEmptyString(excluded_labels);
    let query =
      "match (n" +
      dynamicLabelAdder(labels) +
      dynamicFilterPropertiesAdder(filter_properties);

    if (
      excludedLabelsLabelsWithoutEmptyString &&
      excludedLabelsLabelsWithoutEmptyString.length > 0
    ) {
      query =
        query +
        " where " +
        dynamicNotLabelAdder("n", excludedLabelsLabelsWithoutEmptyString) +
        ` return n`;
    } else {
      query = query + ` return n`;
    }

    const node = await this.read(
      query,
      filter_properties,
      databaseOrTransaction
    );
    return node.records;
  }

  async findByOrLabelsAndFilters(
    or_labels: Array<string> = [""],
    filter_properties: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    const orLabelsWithoutEmptyString = filterArrayForEmptyString(or_labels);
    let query = "match (n " + dynamicFilterPropertiesAdder(filter_properties);

    if (orLabelsWithoutEmptyString && orLabelsWithoutEmptyString.length > 0) {
      query =
        query +
        " where " +
        dynamicOrLabelAdder("n", orLabelsWithoutEmptyString) +
        ` return n`;
    } else {
      query = query + ` return n`;
    }

    const node = await this.read(
      query,
      filter_properties,
      databaseOrTransaction
    );
    return node.records;
  }

  async findByIdAndOrLabelsAndFilters(
    id: number,
    or_labels: Array<string> = [""],
    filter_properties: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    const orLabelsWithoutEmptyString = filterArrayForEmptyString(or_labels);
    let query =
      "match (n " +
      dynamicFilterPropertiesAdder(filter_properties) +
      ` where id(n)=${id} `;

    if (orLabelsWithoutEmptyString && orLabelsWithoutEmptyString.length > 0) {
      query =
        query +
        " and" +
        dynamicOrLabelAdder("n", orLabelsWithoutEmptyString) +
        ` return n`;
    } else {
      query = query + ` return n`;
    }

    const node = await this.read(
      query,
      filter_properties,
      databaseOrTransaction
    );
    return node.records;
  }
  async updateByIdAndFilter(
    id: number,
    filter_properties: object = {},
    update_labels: Array<string> = [],
    update_properties: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const updateLabelsWithoutEmptyString =
        filterArrayForEmptyString(update_labels);
      const isNodeExist = await this.findByIdAndFilters(id, filter_properties);

      if (!isNodeExist) {
        throw new HttpException(node_not_found, 404);
      }
      let query =
        "match (n) " +
        ` where id(n)=${id} set ` +
        dynamicUpdatePropertyAdder("n", update_properties);

      if (
        updateLabelsWithoutEmptyString &&
        updateLabelsWithoutEmptyString.length > 0
      ) {
        if (!update_properties || Object.keys(update_properties).length === 0) {
          query =
            query +
            "  n" +
            dynamicLabelAdder(updateLabelsWithoutEmptyString) +
            " return n";
        } else {
          query =
            query +
            ", n" +
            dynamicLabelAdder(updateLabelsWithoutEmptyString) +
            " return n";
        }
      } else {
        query = query + " return n";
      }
      update_properties["id"] = id;
      const parameters = update_properties;
      const node = await this.write(query, parameters, databaseOrTransaction);
      if (node.records.length === 0) {
        return null;
      } else {
        return node.records[0]["_fields"][0];
      }
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(
          library_server_error,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }
  async updateByLabelAndFilter(
    labels: Array<string> = [],
    filter_properties: object = {},
    update_labels: Array<string> = [],
    update_properties: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const nodelabelsWithoutEmptyString = filterArrayForEmptyString(labels);
      const updateLabelsWithoutEmptyString =
        filterArrayForEmptyString(update_labels);

      let query =
        "match (n" +
        dynamicLabelAdder(nodelabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(filter_properties) +
        ` set ` +
        dynamicUpdatePropertyAdderAndAddParameterKey("n", update_properties);

      if (
        updateLabelsWithoutEmptyString &&
        updateLabelsWithoutEmptyString.length > 0
      ) {
        query =
          query +
          ", n" +
          dynamicLabelAdder(updateLabelsWithoutEmptyString) +
          " return n";
      } else {
        query = query + " return n";
      }

      const update_properties1 = changeObjectKeyName(update_properties, "1");
      const parameters = { ...filter_properties, ...update_properties1 };

      const result = this.write(query, parameters, databaseOrTransaction);
      return result;
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async findChildrensByLabelsAsTree(
    root_labels: Array<string> = [],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);

      const cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        "-[:PARENT_OF*]->(m" +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(children_filters) +
        ` WITH COLLECT(p) AS ps  CALL apoc.convert.toTree(ps) yield value  RETURN value`;

      children_filters = changeObjectKeyName(children_filters);
      const parameters = { ...root_filters, ...children_filters };

      const result = await this.read(cypher, parameters, databaseOrTransaction);

      return result["records"][0]["_fields"][0];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(
          library_server_error,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  async findByLabelAndFiltersWithTreeStructure(
    root_labels: Array<string> = [],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);

      let tree = await this.findChildrensByLabelsAsTree(
        rootLabelsWithoutEmptyString,
        root_filters,
        childrenLabelsWithoutEmptyString,
        children_filters
      );
      if (!tree) {
        throw new HttpException(
          tree_structure_not_found_by_realm_name_error,
          404
        );
      } else if (Object.keys(tree).length === 0) {
        tree = await this.findByLabelAndFilters(
          rootLabelsWithoutEmptyString,
          root_filters
        );
        if (!tree.length) {
          const rootNodeObject = { root: {} };
          return rootNodeObject;
        }
        const rootNodeObject = { root: tree[0]["_fields"][0] };
        return rootNodeObject;
      } else {
        const rootNodeObject = { root: tree };
        return rootNodeObject;
      }
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(
          library_server_error,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  async findChildrensByIdsAsTree(
    root_id: number,
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);
      const rootNode = await this.findByIdAndFilters(root_id, root_filters);
      if (!rootNode || rootNode.length == 0) {
        throw new HttpException(
          find_with_children_by_realm_as_tree__find_by_realm_error,
          404
        );
      }
      const rootId = rootNode[0]["_fields"][0].identity.low;
      const cypher =
        `MATCH p=(n)-[:PARENT_OF*]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(children_filters) +
        `  WHERE  id(n) = $rootId  WITH COLLECT(p) AS ps  CALL apoc.convert.toTree(ps) yield value  RETURN value`;

      children_filters["rootId"] = rootId;
      const result = await this.read(
        cypher,
        children_filters,
        databaseOrTransaction
      );
      return result["records"][0]["_fields"][0];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(
          library_server_error,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  async findByIdAndFiltersWithTreeStructure(
    root_id: number,
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);
      let tree = await this.findChildrensByIdsAsTree(
        root_id,
        root_filters,
        childrenLabelsWithoutEmptyString,
        children_filters
      );
      if (!tree) {
        throw new HttpException(
          tree_structure_not_found_by_realm_name_error,
          404
        );
      } else if (Object.keys(tree).length === 0) {
        tree = await this.findByIdAndFilters(root_id, root_filters);

        const rootNodeObject = { root: tree[0]["_fields"][0] };
        return rootNodeObject;
      } else {
        const rootNodeObject = { root: tree };
        return rootNodeObject;
      }
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(
          library_server_error,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  async getParentByIdAndFilters(
    id: number,
    node_filters: object = {},
    parent_filters: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const node = await this.findByIdAndFilters(+id, node_filters);
      if (!node) {
        throw new HttpException(node_not_found, 404);
      }
      const query =
        "MATCH (n) where id(n)= $id match(m" +
        dynamicFilterPropertiesAdder(parent_filters) +
        "match (m)-[:PARENT_OF]->(n) return m as parent,n as children";

      parent_filters["id"] = id;
      const res = await this.read(query, parent_filters, databaseOrTransaction);
      if (!res["records"][0].length) {
        throw new HttpException(parent_of_child_not_found, 404);
      }
      return res["records"][0];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response.message, code: error.response.code },
          error.status
        );
      } else {
        throw new HttpException(
          library_server_error,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }
  async addParentRelationByIdAndFilters(
    child_id: number,
    child_filters: object = {},
    target_parent_id: number,
    target_parent_filters: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      await this.findByIdAndFilters(child_id, child_filters);
      await this.findByIdAndFilters(target_parent_id, target_parent_filters);

      const parameters = { child_id, target_parent_id };

      const query = `MATCH (m)  where id(m)= $child_id MATCH (n) where id(n)= $target_parent_id  MERGE (n)-[:PARENT_OF]-> (m) return n as parent,m as children`;

      const res = await this.write(query, parameters, databaseOrTransaction);
      if (!res) {
        throw new HttpException(null, 400);
      }
      return res;
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(
          library_server_error,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }
  async addRelationByIdAndRelationNameWithoutFilters(
    first_node_id: number,
    second_node_id: number,
    relation_name: string,
    relation_direction: RelationDirection = RelationDirection.RIGHT,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      await this.findByIdAndFilters(first_node_id, {});
      await this.findByIdAndFilters(second_node_id, {});

      const parameters = { first_node_id, second_node_id };
      let res;
      switch (relation_direction) {
        case RelationDirection.RIGHT:
          res = await this.write(
            `MATCH (n) where id(n)= $first_node_id MATCH (m ) where id(m)= $second_node_id MERGE (n)-[:${relation_name}]-> (m) return n as parent,m as children`,
            parameters,
            databaseOrTransaction
          );
          break;
        case RelationDirection.LEFT:
          res = await this.write(
            `MATCH (m) where id(m)= $first_node_id MATCH (n) where id(n)= $second_node_id MERGE (m)<-[:${relation_name}]- (n) return n as parent,m as children`,
            parameters,
            databaseOrTransaction
          );
          break;
        default:
          throw new HttpException(invalid_direction_error, 400);
      }

      if (!res) {
        throw new HttpException(null, 400);
      }
      return res;
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException({}, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async addRelationByIdAndRelationNameWithFilters(
    first_node_id: number,
    first_node_filters: object = {},
    second_node_id: number,
    second_node_filters: object = {},
    relation_name: string,
    relation_direction: RelationDirection = RelationDirection.RIGHT,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      await this.findByIdAndFilters(first_node_id, first_node_filters);
      await this.findByIdAndFilters(second_node_id, second_node_filters);

      const res = await this.addRelationByIdAndRelationNameWithoutFilters(
        first_node_id,
        second_node_id,
        relation_name,
        relation_direction,
        databaseOrTransaction
      );

      const { relationshipsCreated } =
        await res.summary.updateStatistics.updates();
      if (relationshipsCreated === 0) {
        throw new HttpException(
          add_relation_with_relation_name__create_relation_error,
          400
        );
      }
      return res;
    } catch (error) {
      if (error?.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async addRelationByLabelsAndFiltersAndRelationName(
    first_node_labels: Array<string> = [],
    first_node_properties: object = {},
    second_node_labels: Array<string> = [],
    second_node_properties: object = {},
    relation_name: string,
    relation_direction: RelationDirection = RelationDirection.RIGHT,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      if (!relation_name) {
        throw new HttpException(required_fields_must_entered, 404);
      }
      const firstNodelabelsWithoutEmptyString =
        filterArrayForEmptyString(first_node_labels);

      const secondNodelabelsWithoutEmptyString =
        filterArrayForEmptyString(second_node_labels);

      let cyper;
      let res;
      let parameters;
      switch (relation_direction) {
        case RelationDirection.RIGHT:
          cyper =
            `MATCH (n` +
            dynamicLabelAdder(firstNodelabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdder(first_node_properties) +
            `MATCH (m` +
            dynamicLabelAdder(secondNodelabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdderAndAddParameterKey(
              second_node_properties
            ) +
            `MERGE (n)-[:${relation_name}]-> (m) return n as parent,m as children`;
          second_node_properties = changeObjectKeyName(second_node_properties);
          parameters = { ...second_node_properties, ...first_node_properties };
          res = await this.write(cyper, parameters, databaseOrTransaction);
          break;
        case RelationDirection.LEFT:
          cyper =
            `MATCH (m` +
            dynamicLabelAdder(firstNodelabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdder(first_node_properties) +
            `MATCH (n` +
            dynamicLabelAdder(secondNodelabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdderAndAddParameterKey(
              second_node_properties
            ) +
            `MERGE (m)<-[:${relation_name}]- (n) return n as parent,m as children`;
          second_node_properties = changeObjectKeyName(second_node_properties);
          parameters = { ...second_node_properties, ...first_node_properties };
          res = await this.write(cyper, parameters, databaseOrTransaction);
          break;
        default:
          throw new HttpException(invalid_direction_error, 400);
      }
      const { relationshipsCreated } =
        await res.summary.updateStatistics.updates();
      if (relationshipsCreated === 0) {
        throw new HttpException(
          add_relation_with_relation_name__create_relation_error,
          400
        );
      }
      return res;
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response.message, code: error.response.code },
          error.status
        );
      } else {
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async findChildrensByLabelsAsTreeOneLevel(
    root_labels: Array<string> = [],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);

      const cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        `-[:PARENT_OF]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(children_filters) +
        ` WITH COLLECT(p) AS ps  CALL apoc.convert.toTree(ps) yield value  RETURN value`;

      children_filters = changeObjectKeyName(children_filters);
      const parameters = { ...root_filters, ...children_filters };
      const result = await this.read(cypher, parameters, databaseOrTransaction);

      return result["records"][0]["_fields"][0];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async findByLabelAndFiltersWithTreeStructureOneLevel(
    root_labels: Array<string> = [],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const rootlabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenlabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);

      let tree = await this.findChildrensByLabelsAsTreeOneLevel(
        rootlabelsWithoutEmptyString,
        root_filters,
        childrenlabelsWithoutEmptyString,
        children_filters
      );
      if (!tree) {
        throw new HttpException(
          tree_structure_not_found_by_realm_name_error,
          404
        );
      } else if (Object.keys(tree).length === 0) {
        tree = await this.findByLabelAndFilters(
          rootlabelsWithoutEmptyString,
          root_filters
        );
        if (!tree.length) {
          const rootNodeObject = { root: {} };
          return rootNodeObject;
        }
        const rootNodeObject = { root: tree[0]["_fields"][0] };
        return rootNodeObject;
      } else {
        const rootNodeObject = { root: tree };
        return rootNodeObject;
      }
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async findChildrensByLabelsOneLevel(
    root_labels: Array<string> = [],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);

      const cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        `-[:PARENT_OF]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(children_filters) +
        ` RETURN n as parent,m as children`;

      children_filters = changeObjectKeyName(children_filters);
      const parameters = { ...root_filters, ...children_filters };
      const result = await this.read(cypher, parameters, databaseOrTransaction);
      return result["records"];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async findChildrensByIdOneLevel(
    root_id: number,
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    relation_name: string,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      if (!relation_name) {
        throw new HttpException(required_fields_must_entered, 404);
      }
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);
      const rootNode = await this.findByIdAndFilters(root_id, root_filters);
      if (!rootNode || rootNode.length == 0) {
        throw new HttpException(
          find_with_children_by_realm_as_tree__find_by_realm_error,
          404
        );
      }
      const rootId = rootNode.identity.low;
      const parameters = { rootId, ...children_filters };
      let cypher;
      let response;

      cypher =
        `MATCH p=(n)-[r:${relation_name}]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(children_filters) +
        `  WHERE  id(n) = $rootId  RETURN n as parent,m as children, r as relation`;
      children_filters["rootId"] = rootId;
      response = await this.write(cypher, parameters, databaseOrTransaction);

      return response["records"];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }
  async findChildrensByIdsAsTreeOneLevel(
    id: number,
    root_filters: object = {},
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const rootNode = await this.findByIdAndFilters(id, root_filters);
      if (!rootNode || rootNode.length == 0) {
        throw new HttpException(
          find_with_children_by_realm_as_tree__find_by_realm_error,
          404
        );
      }
      const rootId = rootNode[0]["_fields"][0].identity.low;
      const cypher =
        `MATCH p=(n)-[:PARENT_OF]->(m` +
        dynamicFilterPropertiesAdder(children_filters) +
        `  WHERE  id(n) = $rootId  WITH COLLECT(p) AS ps  CALL apoc.convert.toTree(ps) yield value  RETURN value`;

      children_filters["rootId"] = rootId;
      const result = await this.read(
        cypher,
        children_filters,
        databaseOrTransaction
      );
      return result["records"][0]["_fields"][0];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async findByIdAndFiltersWithTreeStructureOneLevel(
    id: number,
    root_filters: object = {},
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      let tree = await this.findChildrensByIdsAsTreeOneLevel(
        id,
        root_filters,
        children_filters
      );
      if (!tree) {
        throw new HttpException(
          tree_structure_not_found_by_realm_name_error,
          404
        );
      } else if (Object.keys(tree).length === 0) {
        tree = await this.findByIdAndFilters(id, root_filters);
        if (!tree.length) {
          const rootNodeObject = { root: {} };
          return rootNodeObject;
        }
        const rootNodeObject = { root: tree[0]["_fields"][0] };
        return rootNodeObject;
      } else {
        const rootNodeObject = { root: tree };
        return rootNodeObject;
      }
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async findChildrenNodesByLabelsAndRelationName(
    first_node_labels: Array<string> = [],
    first_node_filters: object = {},
    second_node_labels: Array<string> = [],
    second_node_filters: object = {},
    relation_name: string,
    relation_direction: RelationDirection = RelationDirection.RIGHT,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      if (!relation_name) {
        throw new HttpException(required_fields_must_entered, 404);
      }
      const firstNodeLabelsWithoutEmptyString =
        filterArrayForEmptyString(first_node_labels);
      const secondNodeLabelsWithoutEmptyString =
        filterArrayForEmptyString(second_node_labels);

      let parameters;
      let cypher: string;
      let result: QueryResult;

      switch (relation_direction) {
        case RelationDirection.RIGHT:
          cypher =
            `MATCH (n` +
            dynamicLabelAdder(firstNodeLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdder(first_node_filters) +
            `-[:${relation_name}*]->(m` +
            dynamicLabelAdder(secondNodeLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdderAndAddParameterKey(
              second_node_filters
            ) +
            ` RETURN n as parent,m as children`;

          second_node_filters = changeObjectKeyName(second_node_filters);
          parameters = { ...first_node_filters, ...second_node_filters };

          result = await this.read(cypher, parameters, databaseOrTransaction);
          break;
        case RelationDirection.LEFT:
          cypher =
            `MATCH (n` +
            dynamicLabelAdder(firstNodeLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdder(first_node_filters) +
            `<-[:${relation_name}*]-(m` +
            dynamicLabelAdder(secondNodeLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdderAndAddParameterKey(
              second_node_filters
            ) +
            `   RETURN m as parent,n as children`;

          second_node_filters = changeObjectKeyName(second_node_filters);
          parameters = { ...first_node_filters, ...second_node_filters };

          result = await this.read(cypher, parameters, databaseOrTransaction);
          break;
        default:
          throw new HttpException(invalid_direction_error, 400);
      }

      return result["records"];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async findChildrensByLabelsAndRelationNameOneLevel(
    first_node_labels: Array<string> = [],
    first_node_filters: object = {},
    second_node_labels: Array<string> = [],
    second_node_filters: object = {},
    relation_name: string,
    relation_direction: RelationDirection = RelationDirection.RIGHT,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      if (!relation_name) {
        throw new HttpException(required_fields_must_entered, 404);
      }
      const firstNodeLabelsWithoutEmptyString =
        filterArrayForEmptyString(first_node_labels);

      const secondNodeLabelsWithoutEmptyString =
        filterArrayForEmptyString(second_node_labels);

      let parameters;
      let cypher: string;
      let result: QueryResult;

      switch (relation_direction) {
        case RelationDirection.RIGHT:
          cypher =
            `MATCH (n` +
            dynamicLabelAdder(firstNodeLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdder(first_node_filters) +
            `-[:${relation_name}]->(m` +
            dynamicLabelAdder(secondNodeLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdderAndAddParameterKey(
              second_node_filters
            ) +
            ` RETURN n as parent,m as children`;

          second_node_filters = changeObjectKeyName(second_node_filters);
          parameters = { ...first_node_filters, ...second_node_filters };

          result = await this.read(cypher, parameters, databaseOrTransaction);
          break;
        case RelationDirection.LEFT:
          cypher =
            `MATCH (n` +
            dynamicLabelAdder(firstNodeLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdder(first_node_filters) +
            `<-[:${relation_name}]-(m` +
            dynamicLabelAdder(secondNodeLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdderAndAddParameterKey(
              second_node_filters
            ) +
            ` RETURN m as parent,n as children`;

          second_node_filters = changeObjectKeyName(second_node_filters);
          parameters = { ...first_node_filters, ...second_node_filters };

          result = await this.read(
            cypher,
            first_node_filters,
            databaseOrTransaction
          );
          break;
        default:
          throw new HttpException(invalid_direction_error, 400);
      }

      return result["records"];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }
  async updateNodeChildrensByIdAndFilter(
    id: number,
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    relation_name: string,
    update_labels: Array<string> = [],
    update_properties: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      if (!relation_name) {
        throw new HttpException(required_fields_must_entered, 404);
      }

      const updateLabelsWithoutEmptyString =
        filterArrayForEmptyString(update_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);
      await this.findByIdAndFilters(id, root_filters);

      let query =
        "match (m) " +
        `match(n` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(children_filters) +
        ` match (m)-[:${relation_name}*]->(n)` +
        ` where id(m)=$rootId set ` +
        dynamicUpdatePropertyAdderAndAddParameterKey("n", update_properties);

      if (
        updateLabelsWithoutEmptyString &&
        updateLabelsWithoutEmptyString.length > 0
      ) {
        query =
          query +
          ", n" +
          dynamicLabelAdder(updateLabelsWithoutEmptyString) +
          " return m as parent, n as children";
      } else {
        query = query + " return m as parent, n as children";
      }
      const update_properties1 = changeObjectKeyName(update_properties, "1");
      const parameters = { ...children_filters, ...update_properties1 };
      parameters["rootId"] = id;
      const node = await this.write(query, parameters, databaseOrTransaction);
      if (node.records.length === 0) {
        throw new HttpException("nodes not updates", 400);
      } else {
        return node.records;
      }
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async findChildrensByLabelsAndNotLabelsAsTreeOneLevel(
    root_labels: Array<string> = [],
    root_not_labels: Array<string> = [],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_not_labels: Array<string> = [],
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const rootNotLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_not_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);
      const childrenNotLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_not_labels);

      let cypher =
        `MATCH p=(n ` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        ` -[:PARENT_OF]->(m ` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(children_filters) +
        "where ";
      if (
        rootNotLabelsWithoutEmptyString &&
        rootNotLabelsWithoutEmptyString.length > 0
      ) {
        cypher =
          cypher + dynamicNotLabelAdder("n", rootNotLabelsWithoutEmptyString);
      }
      if (
        childrenNotLabelsWithoutEmptyString &&
        childrenNotLabelsWithoutEmptyString.length > 0
      ) {
        cypher =
          cypher +
          " and " +
          dynamicNotLabelAdder("m", childrenNotLabelsWithoutEmptyString);
      }
      cypher =
        cypher +
        ` WITH COLLECT(p) AS ps  CALL apoc.convert.toTree(ps) yield value  RETURN value`;

      Object.keys(root_filters).forEach((element_root) => {
        let i = 0;
        Object.keys(children_filters).forEach((element_child) => {
          if (element_root === element_child) {
            i = 1;
          }
        });
        if (i == 0) {
          children_filters[element_root] = root_filters[element_root];
        }
      });
      children_filters = changeObjectKeyName(children_filters);
      const parameters = { ...root_filters, ...children_filters };
      const result = await this.read(cypher, parameters, databaseOrTransaction);
      return result["records"][0]["_fields"][0];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async findByLabelAndNotLabelAndFiltersWithTreeStructureOneLevel(
    root_labels: Array<string> = [],
    root_not_labels: Array<string> = [],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_not_labels: Array<string> = [],
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const rootlabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenlabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);

      const rootNotLabelsWithoutEmptyString = root_not_labels.filter((item) => {
        if (item.trim() !== "") {
          return item;
        }
      });
      const childrenNotLabelsWithoutEmptyString = children_not_labels.filter(
        (item) => {
          if (item.trim() !== "") {
            return item;
          }
        }
      );

      let tree = await this.findChildrensByLabelsAndNotLabelsAsTreeOneLevel(
        rootlabelsWithoutEmptyString,
        rootNotLabelsWithoutEmptyString,
        root_filters,
        childrenlabelsWithoutEmptyString,
        childrenNotLabelsWithoutEmptyString,
        children_filters,
        databaseOrTransaction
      );
      if (!tree) {
        throw new HttpException(
          tree_structure_not_found_by_realm_name_error,
          404
        );
      } else if (Object.keys(tree).length === 0) {
        tree = await this.findByLabelAndFilters(
          rootlabelsWithoutEmptyString,
          root_filters
        );
        if (!tree.length) {
          const rootNodeObject = { root: {} };
          return rootNodeObject;
        }
        const rootNodeObject = { root: tree[0]["_fields"][0] };
        return rootNodeObject;
      } else {
        const rootNodeObject = { root: tree };
        return rootNodeObject;
      }
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async createNode(
    params: object,
    labels?: string[],
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      if (!params || Object.keys(params).length === 0) {
        throw new HttpException(create_node__must_entered_error, 400);
      }

      let cyperQuery;
      let labelsWithoutEmptyString;
      if (labels) {
        labelsWithoutEmptyString = filterArrayForEmptyString(labels);
        cyperQuery = createDynamicCyperCreateQuery(
          params,
          labelsWithoutEmptyString
        );
      } else {
        cyperQuery = createDynamicCyperCreateQuery(params);
      }

      const res = await this.write(cyperQuery, params, databaseOrTransaction);
      if (!res["records"][0].length) {
        throw new HttpException(create_node__node_not_created_error, 400);
      }
      return res["records"][0]["_fields"][0];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw newError(error, "500");
      }
    }
  }

  async deleteRelationByIdAndRelationNameWithFilters(
    first_node_id: number,
    first_node_filters: object = {},
    second_node_id: number,
    second_node_filters: object = {},
    relation_name: string,
    relation_direction: RelationDirection = RelationDirection.RIGHT,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      if (!first_node_id || !second_node_id || !relation_name) {
        throw new HttpException(required_fields_must_entered, 400);
      }
      await this.findByIdAndFilters(first_node_id, first_node_filters);
      await this.findByIdAndFilters(second_node_id, second_node_filters);

      const res = await this.deleteRelationByIdAndRelationNameWithoutFilters(
        first_node_id,
        second_node_id,
        relation_name,
        relation_direction,
        databaseOrTransaction
      );

      const { relationshipsCreated } =
        await res.summary.updateStatistics.updates();
      if (
        !res ||
        !res["records"] ||
        !res["records"].length ||
        res["records"].length == 0
      ) {
        throw new HttpException(deleteParentRelationError, 400);
      }
      return res;
    } catch (error) {
      if (error?.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async deleteRelationByIdAndRelationNameWithoutFilters(
    first_node_id: number,
    second_node_id: number,
    relation_name: string,
    relation_direction: RelationDirection = RelationDirection.RIGHT,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      await this.findByIdAndFilters(first_node_id, {});
      await this.findByIdAndFilters(second_node_id, {});

      const parameters = { first_node_id, second_node_id };
      let res;
      switch (relation_direction) {
        case RelationDirection.RIGHT:
          res = await this.write(
            `MATCH (n) where id(n)= $first_node_id MATCH (m ) where id(m)= $second_node_id match (n)-[R:${relation_name}]-> (m) delete R return n as parent,m as children`,
            parameters,
            databaseOrTransaction
          );
          break;
        case RelationDirection.LEFT:
          res = await this.write(
            `MATCH (m) where id(m)= $first_node_id MATCH (n) where id(n)= $second_node_id match (m)<-[R:${relation_name}]- (n) delete R return n as parent,m as children`,
            parameters,
            databaseOrTransaction
          );
          break;
        default:
          throw new HttpException(invalid_direction_error, 400);
      }
      return res;
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException({}, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
  async copySubGrapFromOneNodeToAnotherById(
    root_id: number,
    target_root_id: number,
    relation_name: string,
    databaseOrTransaction?: string | Transaction
  ) {
    await this.findByIdAndFilters(root_id, {});
    await this.findByIdAndFilters(target_root_id, {});

    try {
      const cypher = `MATCH  (rootA),
      (rootB) where id(rootA)=$root_id and id(rootB)=$target_root_id
      MATCH path = (rootA)-[:${relation_name}*]->(node)
      WITH rootA, rootB, collect(path) as paths
      CALL apoc.refactor.cloneSubgraphFromPaths(paths, {
      standinNodes:[[rootA, rootB]]
      })
      YIELD input, output, error
      RETURN input, output, error`;

      const result = await this.write(
        cypher,
        { root_id, target_root_id },
        databaseOrTransaction
      );
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async findChildrensByIdAndFilters(
    root_id: number,
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    relation_name: string,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      if (!relation_name) {
        throw new HttpException(required_fields_must_entered, 404);
      }
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);
      const rootNode = await this.findByIdAndFilters(root_id, root_filters);
      if (!rootNode || rootNode.length == 0) {
        throw new HttpException(
          find_with_children_by_realm_as_tree__find_by_realm_error,
          404
        );
      }
      const rootId = rootNode.identity.low;
      const parameters = { rootId, ...children_filters };
      let cypher;
      let response;

      cypher =
        `MATCH p=(n)-[:${relation_name}*]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(children_filters) +
        `  WHERE  id(n) = $rootId  RETURN n as parent,m as children`;
      children_filters["rootId"] = rootId;
      response = await this.write(cypher, parameters, databaseOrTransaction);

      return response["records"];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }
  async findChildrensByIdAndFiltersTotalCount(
    root_id: number,
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    relation_name: string,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      if (!relation_name) {
        throw new HttpException(required_fields_must_entered, 404);
      }
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);
      const rootNode = await this.findByIdAndFilters(root_id, root_filters);
      if (!rootNode || rootNode.length == 0) {
        throw new HttpException(
          find_with_children_by_realm_as_tree__find_by_realm_error,
          404
        );
      }
      const rootId = rootNode.identity.low;
      const parameters = { rootId, ...children_filters };
      let cypher;
      let response;

      cypher =
        `MATCH p=(n)-[:${relation_name}*]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(children_filters) +
        `  WHERE  id(n) = $rootId  RETURN count(m) as count`;
      children_filters["rootId"] = rootId;
      response = await this.write(cypher, parameters, databaseOrTransaction);

      return response["records"];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }
  async findChildrensByLabelsAndFilters(
    root_labels: Array<string> = [],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);

      const cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        `-[:PARENT_OF*]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(children_filters) +
        ` RETURN n as parent,m as children`;

      children_filters = changeObjectKeyName(children_filters);
      const parameters = { ...root_filters, ...children_filters };

      const result = await this.read(cypher, parameters, databaseOrTransaction);
      return result["records"];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async findNodesByIdAndRelationName(
    first_node_id: number,
    first_node_filters: object = {},
    second_node_id: number,
    second_node_filters: object = {},
    relation_name: string,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      if (!relation_name) {
        throw new HttpException(required_fields_must_entered, 404);
      }

      const firstNode = await this.findByIdAndFilters(
        first_node_id,
        first_node_filters
      );
      const secondNode = await this.findByIdAndFilters(
        second_node_id,
        second_node_filters
      );
      if (
        !firstNode ||
        Object.keys(firstNode).length === 0 ||
        !secondNode ||
        Object.keys(secondNode).length === 0
      ) {
        throw new HttpException(
          find_with_children_by_realm_as_tree__find_by_realm_error,
          404
        );
      }
      const firstNodeId = firstNode.identity.low;
      const secondNodeId = secondNode.identity.low;
      const parameters = { firstNodeId, secondNodeId };
      let cypher;
      let response;

      cypher = `MATCH p=(n)-[:${relation_name}*]->(m) WHERE  id(n) = $firstNodeId and  id(m) = $secondNodeId RETURN n as parent,m as children`;

      response = await this.write(cypher, parameters, databaseOrTransaction);

      return response["records"];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }
  async findChildrensByChildIdAndFilters(
    root_labels: Array<string> = [],
    root_filters: object = {},
    child_id: number,
    child_filters: object = {},
    relation_name: string,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      if (!relation_name) {
        throw new HttpException(required_fields_must_entered, 404);
      }

      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childNode = await this.findByIdAndFilters(child_id, child_filters);
      if (!childNode || childNode.length == 0) {
        throw new HttpException(
          find_with_children_by_realm_as_tree__find_by_realm_error,
          404
        );
      }
      const childId = childNode.identity.low;
      const parameters = { ...root_filters, childId };
      let cypher;
      let response;

      cypher =
        `MATCH p=(n ` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        `-[:${relation_name}*]->(m)` +
        `  WHERE  id(m) = $childId  RETURN n as parent,m as children`;
      response = await this.write(cypher, parameters, databaseOrTransaction);

      return response["records"];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }
  async findAllRelationsByIdOnOneLevel(
    root_id: number,
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);

      const rootNode = await this.findByIdAndFilters(root_id, root_filters);
      if (!rootNode || Object.keys(rootNode).length == 0) {
        throw new HttpException(
          find_with_children_by_realm_as_tree__find_by_realm_error,
          404
        );
      }
      const rootId = rootNode.identity.low;
      const parameters = { ...root_filters, rootId };
      let cypher;
      let response;

      cypher =
        `MATCH p=(n)
        -[:r*1]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(children_filters) +
        `  WHERE  id(m) = $rootId  RETURN n as parent,m as children`;
      response = await this.write(cypher, parameters, databaseOrTransaction);

      return response["records"];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async findAllRelationsByLabelsOnOneLevel(
    root_labels: Array<string> = [],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);

      let cypher;
      let response;

      cypher =
        `MATCH p=(n ` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        `-[:r*1]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(children_filters) +
        ` RETURN n as parent,m as children`;

      children_filters = changeObjectKeyName(children_filters);
      const parameters = { ...root_filters, ...children_filters };
      response = await this.write(cypher, parameters, databaseOrTransaction);

      return response["records"];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async findChildrensByIdAndNotLabelsOneLevel(
    root_id: number,
    root_filters: object = {},
    children_labels: Array<string> = [],
    excluded_labels: Array<string> = [],
    children_filters: object = {},
    relation_name: string,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      if (!relation_name) {
        throw new HttpException(required_fields_must_entered, 404);
      }

      const excludedLabelsLabelsWithoutEmptyString =
        filterArrayForEmptyString(excluded_labels);

      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);
      const rootNode = await this.findByIdAndFilters(root_id, root_filters);
      if (!rootNode || rootNode.length == 0) {
        throw new HttpException(
          find_with_children_by_realm_as_tree__find_by_realm_error,
          404
        );
      }
      const rootId = rootNode.identity.low;
      const parameters = { rootId, ...children_filters };
      let cypher;
      let response;

      cypher =
        `MATCH p=(n)-[r:${relation_name}]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(children_filters) +
        `  WHERE  id(n) = $rootId `;
      if (
        excludedLabelsLabelsWithoutEmptyString &&
        excludedLabelsLabelsWithoutEmptyString.length > 0
      ) {
        cypher =
          cypher +
          " and " +
          dynamicNotLabelAdder("m", excludedLabelsLabelsWithoutEmptyString) +
          ` RETURN n as parent,m as children, r as relation`;
      } else {
        cypher = cypher + ` RETURN n as parent,m as children, r as relation`;
      }

      children_filters["rootId"] = rootId;
      response = await this.write(cypher, parameters, databaseOrTransaction);

      return response["records"];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }
  async findChildrensByLabelsAndFiltersWithNotLabels(
    root_labels: Array<string> = [],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    root_exculuded_labels: Array<string> = [],
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);
      const excludedLabelsLabelsWithoutEmptyString = filterArrayForEmptyString(
        root_exculuded_labels
      );

      let cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        `-[:PARENT_OF*]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(children_filters);

      if (
        excludedLabelsLabelsWithoutEmptyString &&
        excludedLabelsLabelsWithoutEmptyString.length > 0
      ) {
        cypher =
          cypher +
          " where " +
          dynamicNotLabelAdder("n", excludedLabelsLabelsWithoutEmptyString) +
          ` RETURN n as parent,m as children`;
      } else {
        cypher = cypher + ` RETURN n as parent,m as children`;
      }
      ` RETURN n as parent,m as children`;

      children_filters = changeObjectKeyName(children_filters);
      const parameters = { ...root_filters, ...children_filters };

      const result = await this.read(cypher, parameters, databaseOrTransaction);
      return result["records"];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }
  async findChildrensByLabelsAndNotLabelsAsTree(
    root_labels: Array<string> = [],
    root_not_labels: Array<string> = [],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_not_labels: Array<string> = [],
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const rootNotLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_not_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);
      const childrenNotLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_not_labels);

      let cypher =
        `MATCH p=(n ` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        ` -[:PARENT_OF*]->(m ` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(children_filters) +
        "where ";

      let cypher1 = "";
      if (
        rootNotLabelsWithoutEmptyString &&
        rootNotLabelsWithoutEmptyString.length > 0
      ) {
        cypher1 = dynamicNotLabelAdder("n", rootNotLabelsWithoutEmptyString);
        cypher = cypher + cypher1;
      }
      if (
        childrenNotLabelsWithoutEmptyString &&
        childrenNotLabelsWithoutEmptyString.length > 0
      ) {
        if (cypher1 !== "") {
          cypher =
            cypher +
            " and " +
            dynamicNotLabelAdder("m", childrenNotLabelsWithoutEmptyString);
        } else {
          cypher =
            cypher +
            dynamicNotLabelAdder("m", childrenNotLabelsWithoutEmptyString);
        }
      }

      cypher =
        cypher +
        ` WITH COLLECT(p) AS ps  CALL apoc.convert.toTree(ps) yield value  RETURN value`;

      Object.keys(root_filters).forEach((element_root) => {
        let i = 0;
        Object.keys(children_filters).forEach((element_child) => {
          if (element_root === element_child) {
            i = 1;
          }
        });
        if (i == 0) {
          children_filters[element_root] = root_filters[element_root];
        }
      });
      children_filters = changeObjectKeyName(children_filters);
      const parameters = { ...root_filters, ...children_filters };
      const result = await this.read(cypher, parameters, databaseOrTransaction);
      return result["records"][0]["_fields"][0];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async findByLabelAndNotLabelAndFiltersWithTreeStructure(
    root_labels: Array<string> = [],
    root_not_labels: Array<string> = [],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_not_labels: Array<string> = [],
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const rootlabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenlabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);

      const rootNotLabelsWithoutEmptyString = root_not_labels.filter((item) => {
        if (item.trim() !== "") {
          return item;
        }
      });
      const childrenNotLabelsWithoutEmptyString = children_not_labels.filter(
        (item) => {
          if (item.trim() !== "") {
            return item;
          }
        }
      );

      let tree = await this.findChildrensByLabelsAndNotLabelsAsTree(
        rootlabelsWithoutEmptyString,
        rootNotLabelsWithoutEmptyString,
        root_filters,
        childrenlabelsWithoutEmptyString,
        childrenNotLabelsWithoutEmptyString,
        children_filters
      );
      if (!tree) {
        throw new HttpException(
          tree_structure_not_found_by_realm_name_error,
          404
        );
      } else if (Object.keys(tree).length === 0) {
        tree = await this.findByLabelAndFilters(
          rootlabelsWithoutEmptyString,
          root_filters
        );
        if (!tree.length) {
          const rootNodeObject = { root: {} };
          return rootNodeObject;
        }
        const rootNodeObject = { root: tree[0]["_fields"][0] };
        return rootNodeObject;
      } else {
        const rootNodeObject = { root: tree };
        return rootNodeObject;
      }
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async findChildrensByLabelsAndFiltersWithNotLabelsOneLevel(
    root_labels: Array<string> = [],
    root_filters: object = {},
    root_exculuded_labels: Array<string> = [],
    children_labels: Array<string> = [],
    children_filters: object = {},
    children_exculuded_labels: Array<string> = [],
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);
      const parentExcludedLabelsLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_exculuded_labels);
      const childrenExcludedLabelsLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_exculuded_labels);

      let cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        `-[:PARENT_OF]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(children_filters);

      if (
        (parentExcludedLabelsLabelsWithoutEmptyString &&
          parentExcludedLabelsLabelsWithoutEmptyString.length > 0) ||
        (childrenExcludedLabelsLabelsWithoutEmptyString &&
          childrenExcludedLabelsLabelsWithoutEmptyString.length > 0)
      ) {
        cypher =
          cypher +
          " where " +
          dynamicNotLabelAdder(
            "n",
            parentExcludedLabelsLabelsWithoutEmptyString
          ) +
          dynamicNotLabelAdder(
            "m",
            childrenExcludedLabelsLabelsWithoutEmptyString
          ) +
          ` RETURN n as parent,m as children`;
      } else {
        cypher = cypher + ` RETURN n as parent,m as children`;
      }
      ` RETURN n as parent,m as children`;

      children_filters = changeObjectKeyName(children_filters);
      const parameters = { ...root_filters, ...children_filters };

      const result = await this.read(cypher, parameters, databaseOrTransaction);
      return result["records"];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async findChildrensByIdAndFiltersWithPagination(
    root_id: number,
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    relation_name: string,
    queryObject: queryObjectType,
    databaseOrTransaction?: string,
  ) {
    try {
      if (!relation_name) {
        throw new HttpException(required_fields_must_entered, 404);
      }
      const now = Date.now();
      const childrenLabelsWithoutEmptyString = children_labels;
      const rootNode = await this.findByIdAndFilters(root_id, root_filters);
      if (!rootNode || rootNode.length == 0) {
        throw new HttpException(find_with_children_by_realm_as_tree__find_by_realm_error, 404);
      }
      const rootId = rootNode.identity.low;
      const parameters = { rootId, ...children_filters, ...queryObject };
      parameters.skip = this.int(+queryObject.skip) as unknown as number;
      parameters.limit = this.int(+queryObject.limit) as unknown as number;

      let cypher;
      let response;

      cypher =
        `MATCH p=(n)-[:${relation_name}*]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(children_filters) +
        `  WHERE  id(n) = $rootId  RETURN n as parent,m as children `;
      if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
        cypher =
          cypher +
          dynamicOrderByColumnAdder('m', queryObject.orderByColumn) +
          ` ${queryObject.orderBy} SKIP $skip LIMIT $limit  `;
      } else {
        cypher = cypher + ` SKIP $skip LIMIT $limit `;
      }

      children_filters['rootId'] = rootId;
      // eslint-disable-next-line prefer-const
      response = await this.read(cypher, parameters, databaseOrTransaction);
      const responseTime = `${Date.now() - now} ms`;
      console.log(responseTime);
      return response['records'];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException({ message: error.response?.message, code: error.response?.code }, error.status);
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async findChildrensAndParentOfChildrenByIdAndFilter(
    root_id: number,
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    relation_name1: string,
    parentof_children_labels: Array<string> = [],
    parentof_children_filters: object = {},
    relation_name2: string,
    queryObject: queryObjectType,
    databaseOrTransaction?: string
  ) {
    try {
      if (!relation_name1 || !relation_name2) {
        throw new HttpException(required_fields_must_entered, 404);
      }
      const childrenLabelsWithoutEmptyString =
        children_labels
      const parentofChildrenLabelsWithoutEmptyString =
        parentof_children_labels
      const rootNode = await this.findByIdAndFilters(root_id, root_filters);
      if (!rootNode || rootNode.length == 0) {
        throw new HttpException(
          find_with_children_by_realm_as_tree__find_by_realm_error,
          404
        );
      }
      const rootId = rootNode.identity.low;
      const parameters = { rootId, ...children_filters, ...parentof_children_filters, ...queryObject };
      parameters.skip = this.int(+queryObject.skip) as unknown as number
      parameters.limit = this.int(+queryObject.limit) as unknown as number

      let cypher;
      let response;

      cypher =
        `MATCH p=(n)-[:${relation_name1}*]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(children_filters) + `<-[:${relation_name2}*]-(k` +
        dynamicLabelAdder(parentofChildrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(parentof_children_filters) +
        `  WHERE  id(n) = $rootId  RETURN n as parent,m as children, k as parentofchildren, count(m) as total `;
      if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
        cypher = cypher + `ORDER BY k.` + `${queryObject.orderByColumn} ${queryObject.orderBy} SKIP $skip LIMIT $limit  `
      } else {
        cypher = cypher + `ORDER BY ${queryObject.orderBy} SKIP $skip LIMIT $limit `
      }

      children_filters["rootId"] = rootId;
      response = await this.write(cypher, parameters, databaseOrTransaction);

      return response["records"];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }
  async findChildrensByIdAndFiltersWithPaginationAndSearcString(
    root_id: number,
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    queryObject: queryObjectType,
    searchString: string,
    search_type: SearchType = SearchType.CONTAINS,
    databaseOrTransaction?: string,
  ) {
    try {
      const childrenLabelsWithoutEmptyString = children_labels;
      const childrenExcludedLabelsLabelsWithoutEmptyString = filterArrayForEmptyString(children_exculuded_labels);

      const rootNode = await this.findByIdAndFilters(root_id, root_filters);

      const rootId = rootNode.identity.low;
      const parameters = { rootId, ...children_filters, ...queryObject };

      parameters['searchString'] = searchString;
      parameters.skip = this.int(+queryObject.skip) as unknown as number;
      parameters.limit = this.int(+queryObject.limit) as unknown as number;

      let cypher;
      let response;

      cypher =
        `MATCH p=(n)-[:${relation_name}*]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(children_filters) +
        `  WHERE  id(n) = $rootId and `;
      if (childrenExcludedLabelsLabelsWithoutEmptyString.length > 0) {
        cypher =
          cypher +
          dynamicNotLabelAdder('m', childrenExcludedLabelsLabelsWithoutEmptyString) +
          ` and (any(prop in keys(m) where m[prop] ${search_type}  toLower($searchString))) ` +
          `RETURN n as parent,m as children `;
      } else {
        cypher =
          cypher +
          `(any(prop in keys(m) where m[prop] ${search_type}  toLower($searchString))) ` +
          `RETURN n as parent,m as children `;
      }
      if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
        cypher =
          cypher +
          dynamicOrderByColumnAdder('m', queryObject.orderByColumn) +
          ` ${queryObject.orderBy} SKIP $skip LIMIT $limit  `;
      } else {
        cypher = cypher + `SKIP $skip LIMIT $limit `;
      }

      // eslint-disable-next-line prefer-const
      response = await this.read(cypher, parameters, databaseOrTransaction);

      return response['records'];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException({ message: error.response?.message, code: error.response?.code }, error.status);
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async findChildrensByIdAndFiltersAndSearcStringsTotalCount(
    root_id: number,
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    search_string: string,
    search_type:SearchType=SearchType.CONTAINS,
    databaseOrTransaction?: string
  ) {
    try {

      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels)
      const childrenExcludedLabelsLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_exculuded_labels);
      const rootNode = await this.findByIdAndFilters(root_id, root_filters);

      const rootId = rootNode.identity.low;

      const parameters = { rootId, ...children_filters };
      parameters['searchString'] = search_string
      let cypher;
      let response;


      cypher =
        `MATCH p=(n)-[:${relation_name}*]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(children_filters) +
        `  WHERE  id(n) = $rootId and `
      if (childrenExcludedLabelsLabelsWithoutEmptyString.length > 0) {
        cypher = cypher + dynamicNotLabelAdder(
          "m",
          childrenExcludedLabelsLabelsWithoutEmptyString
        ) + ` and (any(prop in keys(m) where m[prop] ${search_type}  toLower($searchString))) ` + `RETURN count(m) as count `;
      } else {
        cypher = cypher + `(any(prop in keys(m) where m[prop] ${search_type}  toLower($searchString))) ` + `RETURN count(m) as count `;
      }


      response = await this.read(cypher, parameters, databaseOrTransaction);
      return response["records"];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException(
          { message: error.response?.message, code: error.response?.code },
          error.status
        );
      } else {
        throw new HttpException(error, 500);
      }
    }
  }


  async findChildrensByIdAndFiltersWithPaginationAndSearcStringBySpecificColumn(
    root_id: number,
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    queryObject: queryObjectType,
    searchColumn: string,
    searchString: string,
    search_type: SearchType = SearchType.CONTAINS,
    databaseOrTransaction?: string,
  ) {
    try {
      const childrenLabelsWithoutEmptyString = children_labels;
      const childrenExcludedLabelsLabelsWithoutEmptyString = filterArrayForEmptyString(children_exculuded_labels);

      const rootNode = await this.findByIdAndFilters(root_id, root_filters);

      const rootId = rootNode.identity.low;
      const parameters = { rootId, ...children_filters, ...queryObject };

      parameters['searchString'] = searchString;
      parameters.skip = this.int(+queryObject.skip) as unknown as number;
      parameters.limit = this.int(+queryObject.limit) as unknown as number;

      let cypher;
      let response;

      cypher =
        `MATCH p=(n)-[:${relation_name}*]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(children_filters) +
        `  WHERE  id(n) = $rootId and `;
      if (childrenExcludedLabelsLabelsWithoutEmptyString.length > 0) {
        cypher =
          cypher +
          dynamicNotLabelAdder('m', childrenExcludedLabelsLabelsWithoutEmptyString) +
          ` and toLower(m.${queryObject.orderByColumn}) ${search_type}  toLower($searchString) ` +
          `RETURN n as parent,m as children `;
      } else {
        cypher =
          cypher +
          ` toLower(m.${searchColumn}) ${search_type}  toLower($searchString) ` +
          `RETURN n as parent,m as children `;
      }
      if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
        cypher =
          cypher +
          dynamicOrderByColumnAdder('m', queryObject.orderByColumn) +
          ` ${queryObject.orderBy} SKIP $skip LIMIT $limit  `;
      } else {
        cypher = cypher + `SKIP $skip LIMIT $limit `;
      }
      // eslint-disable-next-line prefer-const
      response = await this.read(cypher, parameters, databaseOrTransaction);

      return response['records'];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException({ message: error.response?.message, code: error.response?.code }, error.status);
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

  async findChildrensByIdAndFiltersBySearcStringBySpecificColumnTotalCount(
    root_id: number,
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    search_column: string,
    search_string: string,
    search_type: SearchType = SearchType.CONTAINS,
    databaseOrTransaction?: string,
  ) {
    try {
      const childrenLabelsWithoutEmptyString = filterArrayForEmptyString(children_labels);
      const childrenExcludedLabelsLabelsWithoutEmptyString = filterArrayForEmptyString(children_exculuded_labels);
      const rootNode = await this.findByIdAndFilters(root_id, root_filters);

      const rootId = rootNode.identity.low;

      const parameters = { rootId, ...children_filters };

      parameters['searchString'] = search_string;
      let cypher;
      let response;

      cypher =
        `MATCH p=(n)-[:${relation_name}*]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(children_filters) +
        `  WHERE  id(n) = $rootId and `;
      if (childrenExcludedLabelsLabelsWithoutEmptyString.length > 0) {
        cypher =
          cypher +
          dynamicNotLabelAdder('m', childrenExcludedLabelsLabelsWithoutEmptyString) +
          ` and toLower(m.${search_column}) ${search_type} toLower($searchString) ` +
          `RETURN count(m) as count `;
      } else {
        cypher =
          cypher + ` toLower(m.${search_column}) ${search_type} toLower($searchString) ` + `RETURN count(m) as count `;
      }
      // eslint-disable-next-line prefer-const
      response = await this.read(cypher, parameters, databaseOrTransaction);

      return response['records'];
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException({ message: error.response?.message, code: error.response?.code }, error.status);
      } else {
        throw new HttpException(error, 500);
      }
    }
  }

}
