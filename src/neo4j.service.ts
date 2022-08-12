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
  createDynamicCyperCreateQuery,
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
  find_by_id_and_labels_with_active_child_nodes__must_entered_error,
  find_by_id_and_labels_with_active_child_nodes__not_found_error,
  find_by_id_and_labels_with_active_child_node__not_found_error,
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
} from "./constant/custom.error.object";
import { RelationDirection } from "./constant/relation.direction.enum";
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
      if (!child_id || !target_parent_id) {
        throw new HttpException("id must entered", 404);
      }
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
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
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
      if (!_id || !_target_parent_id) {
        throw new HttpException("id must entered", 400);
      }
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
  async createNode(params: object, labels?: string[]) {
    try {
      if (!params) {
        throw new HttpException(create_node__must_entered_error, 400);
      }
      let cyperQuery;
      if (!labels) {
        cyperQuery = createDynamicCyperCreateQuery(params);
      } else {
        cyperQuery = createDynamicCyperCreateQuery(params, labels);
      }

      const res = await this.write(cyperQuery, params);
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
        if(!id){
          throw new HttpException(get_parent_by_id__must_entered_error,400);
        }
        const res = await this.read(
          "MATCH (c {isDeleted: false}) where id(c)= $id match(k {isDeleted: false}) match (k)-[:PARENT_OF]->(c) return k",
          { id: parseInt(id) }
        );
        if(!res["records"][0].length){
        throw new HttpException(parent_of_child_not_found,404)
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
        if (node['properties']['canDelete'] == undefined || node['properties']['canDelete'] == null ||  node['properties']['canDelete'] == true ) {
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
      if (!first_node_id || !second_node_id || !relationName) {
        throw new HttpException(
          add_relation_with_relation_name__must_entered_error,
          400
        );
      }
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
      if (!first_node_label || !first_node_realm || !second_child_node_label || !second_child_node_name || !children_nodes_label ) {
        throw new HttpException(
          add_relation_with_relation_name__must_entered_error,   //DEĞİŞECEK
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
          tree_structure_not_found_by_realm_name_error,  //DEĞİŞECEK
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

  async findStructureRootNode(key, label){

    try {
      if (!key) {
        throw new HttpException(find_by_id__must_entered_error, 400);  //DEĞİŞECEK
      }

      const cypher = `match(n:${label}) match(p {key:$key}) match (n)-[:PARENT_OF*]->(p) return n`;
      const structureRootNode = await this.read(cypher, { key });
      if (!structureRootNode || !structureRootNode["records"].length) {
        throw new HttpException(incorret_operation, 400);
      }
      return structureRootNode.records[0]['_fields'][0];

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


   async getAllowedStructureTypeNode(realm, name){
     const cypher = 'match (n:FacilityTypes_EN {realm:$realm}) match(p {name:$name}) match(n)-[:PARENT_OF]->(p) return p';
     const allowedStructureTypeNode = this.read(cypher, { realm, name });
     return allowedStructureTypeNode;
   }
   async getAllowedStructures(key){
    const cypher = 'match(n {key:$key}) match(p:AllowedStructure) match (n)-[:PARENT_OF]->(p) return p';
    const allowedStructures = this.read(cypher, { key });
    return allowedStructures;
   }
  }
