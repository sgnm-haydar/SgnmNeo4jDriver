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
  create_node__must_entered_error,
  create_node__node_not_created_error,
  deleteParentRelationError,
  find_with_children_by_realm_as_tree__find_by_realm_error,
  node_not_found,
  parent_of_child_not_found,
  tree_structure_not_found_by_realm_name_error,
  library_server_error,
  invalid_direction_error,
  required_fields_must_entered,
} from "./constant/custom.error.object";
import { RelationDirection } from "./constant/relation.direction.enum";
import { queryObjectType } from "./dtos/dtos";
import { SearchType } from "./constant/pagination.enum";
import { otherNodesObjProps } from "./constant/pagination.object.type";
import { FilterPropertiesType } from "./constant/filter.properties.type.enum";
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
  onApplicationShutdown() {
    return this.driver.close();
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

  async findByIdAndFilters(
    id: number,
    labels: string[],
    filter_properties: object = {},
    excluded_labels: Array<string> = [],
    databaseOrTransaction?: string | Transaction
  ) {
    const LabelsWithoutEmptyString = filterArrayForEmptyString(labels);
    const excludedLabelsLabelsWithoutEmptyString =
      filterArrayForEmptyString(excluded_labels);
    let query =
      "match (n" +
      dynamicLabelAdder(LabelsWithoutEmptyString) +
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

    delete filter_properties["id"];

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
    labels: string[] = [""],
    filter_properties: object = {},
    update_labels: Array<string> = [],
    update_properties: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const labelsWithoutEmptyString = filterArrayForEmptyString(labels);
      const updateLabelsWithoutEmptyString =
        filterArrayForEmptyString(update_labels);
      const isNodeExist = await this.findByIdAndFilters(
        id,
        labelsWithoutEmptyString,
        filter_properties
      );

      if (!isNodeExist) {
        throw new HttpException(node_not_found, 404);
      }
      let query =
        `match (n` +
        dynamicLabelAdder(labelsWithoutEmptyString) +
        `)` +
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
    root_labels: string[] = [""],
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
      const rootNode = await this.findByIdAndFilters(
        root_id,
        rootLabelsWithoutEmptyString,
        root_filters
      );
      if (!rootNode || rootNode.length == 0) {
        throw new HttpException(
          find_with_children_by_realm_as_tree__find_by_realm_error,
          404
        );
      }
      const rootId = rootNode[0]["_fields"][0].identity.low;
      const cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        `)-[:PARENT_OF*]->(m` +
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
    root_labels: string[] = [""],
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
        root_labels,
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
        tree = await this.findByIdAndFilters(
          root_id,
          root_labels,
          root_filters
        );

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
    node_labels: string[] = [""],
    node_filters: object = {},
    parent_labels: string[] = [""],
    parent_filters: object = {},
    relation_name: string,
    relation_filters,
    relation_depth: number | "" = "",
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const nodeLabelsWithoutEmptyString =
        filterArrayForEmptyString(node_labels);
      const parentLabelsWithoutEmptyString =
        filterArrayForEmptyString(parent_labels);
      const node = await this.findByIdAndFilters(
        +id,
        node_labels,
        node_filters
      );
      if (!node) {
        throw new HttpException(node_not_found, 404);
      }
      const query =
        "MATCH (n" +
        dynamicLabelAdder(nodeLabelsWithoutEmptyString) +
        ") where id(n)= $id match(m" +
        dynamicLabelAdder(parentLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(parent_filters) +
        "match (m)-" +
        `[r:${relation_name}*1..${relation_depth}` +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          relation_filters,
          FilterPropertiesType.RELATION
        ) +
        `]->(n) return m as parent,n as children`;
      relation_filters = changeObjectKeyName(relation_filters);
      const parameters = { id, ...parent_filters, ...relation_filters };

      const res = await this.read(query, parameters, databaseOrTransaction);
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
          "library_server_error",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  async addRelationByLabelsAndFiltersAndRelationName(
    first_node_labels: Array<string> = [],
    first_node_properties: object = {},
    second_node_labels: Array<string> = [],
    second_node_properties: object = {},
    relation_name: string,
    relation_properties: object = {},
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
            `MERGE (n)-[:${relation_name} ` +
            dynamicFilterPropertiesAdderAndAddParameterKey(
              relation_properties,
              FilterPropertiesType.RELATION,
              "3"
            ) +
            `]-> (m) return n as parent,m as children`;
          second_node_properties = changeObjectKeyName(second_node_properties);
          relation_properties = changeObjectKeyName(relation_properties, "3");
          parameters = {
            ...second_node_properties,
            ...first_node_properties,
            ...relation_properties,
          };
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
            `MERGE (m)<-[:${relation_name}` +
            dynamicFilterPropertiesAdderAndAddParameterKey(
              relation_properties,
              FilterPropertiesType.RELATION,
              "3"
            ) +
            `]- (n) return n as parent,m as children`;
          second_node_properties = changeObjectKeyName(second_node_properties);
          relation_properties = changeObjectKeyName(relation_properties, "3");
          parameters = {
            ...second_node_properties,
            ...first_node_properties,
            ...relation_properties,
          };
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

  async findChildrensByIdsAsTreeOneLevel(
    id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const rootNode = await this.findByIdAndFilters(
        id,
        root_labels,
        root_filters
      );
      if (!rootNode || rootNode.length == 0) {
        throw new HttpException(
          find_with_children_by_realm_as_tree__find_by_realm_error,
          404
        );
      }
      const rootId = id;
      const cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootNode.labels) +
        `)-[:PARENT_OF]->(m` +
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
    root_labels: string[] = [""],
    root_filters: object = {},
    children_filters: object = {},
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      let tree = await this.findChildrensByIdsAsTreeOneLevel(
        id,
        root_labels,
        root_filters,
        children_filters
      );
      if (!tree) {
        throw new HttpException(
          tree_structure_not_found_by_realm_name_error,
          404
        );
      } else if (Object.keys(tree).length === 0) {
        tree = await this.findByIdAndFilters(id, root_labels, root_filters);
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

  async updateNodeChildrensByIdAndFilter(
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
  ) {
    try {
      if (!relation_name) {
        throw new HttpException(required_fields_must_entered, 404);
      }
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const updateLabelsWithoutEmptyString =
        filterArrayForEmptyString(update_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);
      await this.findByIdAndFilters(
        id,
        rootLabelsWithoutEmptyString,
        root_filters
      );

      let query =
        `match (m` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          root_filters,
          FilterPropertiesType.NODE,
          "3"
        ) +
        `match(n` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(children_filters) +
        ` match (m)-[:${relation_name}*1..${relation_depth} ` +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          relation_filters,
          FilterPropertiesType.RELATION,
          "2"
        ) +
        `]->(n)` +
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
      root_filters = changeObjectKeyName(root_filters, "3");
      update_properties = changeObjectKeyName(update_properties, "1");
      relation_filters = changeObjectKeyName(relation_filters, "2");
      const parameters = {
        ...root_filters,
        ...children_filters,
        ...update_properties,
        ...relation_filters,
      };
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
    first_node_labels: string[] = [""],
    first_node_filters: object = {},
    second_node_id: number,
    second_node_labels: string[] = [""],
    second_node_filters: object = {},
    relation_name: string,
    relation_direction: RelationDirection = RelationDirection.RIGHT,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      if (!first_node_id || !second_node_id || !relation_name) {
        throw new HttpException(required_fields_must_entered, 400);
      }
      const first_node = await this.findByIdAndFilters(
        first_node_id,
        first_node_labels,
        first_node_filters
      );
      const second_node = await this.findByIdAndFilters(
        second_node_id,
        second_node_labels,
        second_node_filters
      );

      const res = await this.deleteRelationByIdAndRelationNameWithoutFilters(
        first_node_id,
        first_node.labels,
        second_node_id,
        second_node.labels,
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
    first_node_labels: string[] = [""],
    second_node_id: number,
    second_node_labels: string[] = [""],
    relation_name: string,
    relation_direction: RelationDirection = RelationDirection.RIGHT,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      await this.findByIdAndFilters(first_node_id, first_node_labels, {});
      await this.findByIdAndFilters(second_node_id, second_node_labels, {});

      const parameters = { first_node_id, second_node_id };
      let res;
      switch (relation_direction) {
        case RelationDirection.RIGHT:
          res = await this.write(
            `MATCH (n` +
            dynamicLabelAdder(first_node_labels) +
            `) where id(n)= $first_node_id MATCH (m` +
            dynamicLabelAdder(second_node_labels) +
            ` ) where id(m)= $second_node_id match (n)-[R:${relation_name}]-> (m) delete R return n as parent,m as children`,
            parameters,
            databaseOrTransaction
          );
          break;
        case RelationDirection.LEFT:
          res = await this.write(
            `MATCH (m` +
            dynamicLabelAdder(first_node_labels) +
            `) where id(m)= $first_node_id MATCH (n` +
            dynamicLabelAdder(second_node_labels) +
            `) where id(n)= $second_node_id match (m)<-[R:${relation_name}]- (n) delete R return n as parent,m as children`,
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
    await this.findByIdAndFilters(root_id, [""], {});
    await this.findByIdAndFilters(target_root_id, [""], {});

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
    root_labels: string[] = [""],
    root_filters: object = {},
    children_labels: string[] = [],
    children_filters: object = {},
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "" = "",
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      if (!relation_name) {
        throw new HttpException(required_fields_must_entered, 404);
      }
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);

      let parameters = { root_id, ...root_filters };
      let cypher;
      let response;

      cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        `-[r:${relation_name}*1..${relation_depth}` +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          relation_filters,
          FilterPropertiesType.RELATION,
          "2"
        ) +
        ` ]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          children_filters,
          FilterPropertiesType.NODE,
          "3"
        ) +
        `  WHERE  id(n) = $root_id  RETURN n as parent,m as children, r as relation`;
      relation_filters = changeObjectKeyName(relation_filters, "2");
      children_filters = changeObjectKeyName(children_filters, "3");
      parameters = { ...parameters, ...children_filters, ...relation_filters };

      console.log(cypher);
      console.log(parameters);

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

  async findChildrensByIdAndFiltersTotalCount(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "" = "",
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      if (!relation_name) {
        throw new HttpException(required_fields_must_entered, 404);
      }
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);

      let parameters = { root_id, ...root_filters };
      let cypher;
      let response;

      cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        `-[r:${relation_name}*1..${relation_depth}` +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          relation_filters,
          FilterPropertiesType.RELATION,
          "2"
        ) +
        ` ]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          children_filters,
          FilterPropertiesType.NODE,
          "3"
        ) +
        `  WHERE  id(n) = $root_id  RETURN count(m) as count`;
      relation_filters = changeObjectKeyName(relation_filters, "2");
      children_filters = changeObjectKeyName(children_filters, "3");
      parameters = { ...parameters, ...children_filters, ...relation_filters };

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
  async findChildrensByLabelsAndFilters(
    root_labels: string[] = [],
    root_filters: object = {},
    children_labels: string[] = [],
    children_filters: object = {},
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "" = "",
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
        `-[r:${relation_name}*1..${relation_depth}` +
        dynamicFilterPropertiesAdder(
          relation_filters,
          FilterPropertiesType.RELATION
        ) +
        ` ]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(children_filters) +
        ` RETURN n as parent,m as children,r as relation`;

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
  async addRelationByIdWithRelationNameAndFilters(
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
  ) {
    try {
      const firstNode = await this.findByIdAndFilters(
        first_node_id,
        first_node_labels,
        first_node_filters
      );
      const secondNode = await this.findByIdAndFilters(
        second_node_id,
        second_node_labels,
        second_node_filters
      );

      let cyper;
      switch (relation_direction) {
        case RelationDirection.RIGHT:
          cyper =
            `MATCH (n` +
            dynamicLabelAdder(firstNode.labels) +
            `) where id(n)= $first_node_id MATCH (m` +
            dynamicLabelAdder(secondNode.labels) +
            ` ) where id(m)= $second_node_id MERGE (n)-[r:${relation_name}` +
            dynamicFilterPropertiesAdderAndAddParameterKey(
              relation_properties,
              FilterPropertiesType.RELATION
            ) +
            `]-> (m) return n as parent,m as children,r as relation`;
          break;
        case RelationDirection.LEFT:
          cyper =
            `MATCH (m` +
            dynamicLabelAdder(firstNode.labels) +
            `) where id(m)= $first_node_id MATCH (n` +
            dynamicLabelAdder(secondNode.labels) +
            `) where id(n)= $second_node_id MERGE (m)<-[:${relation_name}` +
            dynamicFilterPropertiesAdderAndAddParameterKey(
              relation_properties,
              FilterPropertiesType.RELATION
            ) +
            `]- (n) return n as parent,m as children,r as relation`;

          break;
        default:
          throw new HttpException(invalid_direction_error, 400);
      }
      relation_properties = changeObjectKeyName(relation_properties);
      const parameters = {
        first_node_id,
        second_node_id,
        ...relation_properties,
      };
      const res = await this.write(cyper, parameters, databaseOrTransaction);

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
  async addRelations(
    first_node_id: number,
    second_node_id: number,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const firstNode = await this.findByIdAndFilters(
        first_node_id,
        [],
        {}
      );
      const secondNode = await this.findByIdAndFilters(
        second_node_id,
        [],
        {}
      );

      let cyper;

      cyper =
        `MATCH (n) where id(n)= $first_node_id MATCH (m) where id(m)= $second_node_id MERGE (n)-[r:PARENT_OF]-> (m) return n as parent,m as children,r as relation`;
      const parameters = {
        first_node_id,
        second_node_id,
      };
      const res = await this.write(cyper, parameters, databaseOrTransaction);

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
  async updateRelationByIdWithRelationNameAndFilters(
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
  ) {
    try {
      let cyper;
      switch (relation_direction) {
        case RelationDirection.RIGHT:
          cyper =
            `MATCH (n` +
            dynamicLabelAdder(first_node_labels) +
            dynamicFilterPropertiesAdder(first_node_filters) +
            ` where id(n)= $first_node_id MATCH (m` +
            dynamicLabelAdder(second_node_labels) +
            dynamicFilterPropertiesAdderAndAddParameterKey(
              second_node_filters,
              FilterPropertiesType.NODE,
              "3"
            ) +
            `  where id(m)= $second_node_id MERGE (n)-[r:${relation_name}` +
            dynamicFilterPropertiesAdderAndAddParameterKey(
              relation_properties,
              FilterPropertiesType.RELATION
            ) +
            `]->(m) ` +
            `set ` +
            dynamicUpdatePropertyAdderAndAddParameterKey(
              "r",
              relation_update_properties,
              "2"
            ) +
            ` return n as parent,m as children,r as relation`;
          break;
        case RelationDirection.LEFT:
          cyper =
            `MATCH (m` +
            dynamicLabelAdder(first_node_labels) +
            `) where id(m)= $first_node_id MATCH (n` +
            dynamicLabelAdder(second_node_labels) +
            `) where id(n)= $second_node_id MERGE (m)<-[:${relation_name}` +
            dynamicFilterPropertiesAdderAndAddParameterKey(
              relation_properties,
              FilterPropertiesType.RELATION
            ) +
            `]- (n) ` +
            `set ` +
            dynamicUpdatePropertyAdderAndAddParameterKey(
              "r",
              relation_update_properties,
              "2"
            ) +
            `return n as parent,m as children,r as relation`;

          break;
        default:
          throw new HttpException(invalid_direction_error, 400);
      }
      relation_properties = changeObjectKeyName(relation_properties);
      second_node_filters = changeObjectKeyName(second_node_filters, "3");
      relation_update_properties = changeObjectKeyName(
        relation_update_properties,
        "2"
      );
      const parameters = {
        first_node_id,
        second_node_id,
        ...relation_properties,
        ...relation_update_properties,
        ...second_node_filters,
        ...first_node_filters,
      };

      const res = await this.write(cyper, parameters, databaseOrTransaction);

      if (!res) {
        throw new HttpException("something goes wrong", 400);
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

  async findChildrensByRootIdAndNotLabels(
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
  ) {
    try {
      if (!relation_name) {
        throw new HttpException(required_fields_must_entered, 404);
      }
      const rootExcludedLabelsWithoutEmptyString = filterArrayForEmptyString(
        root_exculuded_labels
      );
      const childrenExcludedLabelsLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_excluded_labels);
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);

      let parameters = { root_id, ...root_filters };
      let cypher;
      let response;

      cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        `-[r:${relation_name}*1..${relation_depth} ` +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          relation_filters,
          FilterPropertiesType.RELATION,
          "2"
        ) +
        `]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          children_filters,
          FilterPropertiesType.NODE,
          "3"
        ) +
        `  WHERE  id(n) = $root_id `;
      if (
        rootExcludedLabelsWithoutEmptyString &&
        rootExcludedLabelsWithoutEmptyString.length > 0
      ) {
        cypher =
          cypher +
          " and " +
          dynamicNotLabelAdder("n", rootExcludedLabelsWithoutEmptyString);
      }
      if (
        childrenExcludedLabelsLabelsWithoutEmptyString &&
        childrenExcludedLabelsLabelsWithoutEmptyString.length > 0
      ) {
        cypher =
          cypher +
          " and " +
          dynamicNotLabelAdder(
            "m",
            childrenExcludedLabelsLabelsWithoutEmptyString
          );
      }
      cypher = cypher + ` RETURN n as parent,m as children, r as relation`;
      relation_filters = changeObjectKeyName(relation_filters, "2");
      children_filters = changeObjectKeyName(children_filters, "3");
      parameters = { ...parameters, ...children_filters, ...relation_filters };

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
  async findChildrensByLabelAndNotLabels(
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
  ) {
    try {
      if (!relation_name) {
        throw new HttpException(required_fields_must_entered, 404);
      }
      const rootExcludedLabelsWithoutEmptyString = filterArrayForEmptyString(
        root_exculuded_labels
      );
      const childrenExcludedLabelsLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_excluded_labels);
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);

      let parameters = { ...root_filters };
      let cypher;
      let response;

      cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        `-[r:${relation_name}*1..${relation_depth} ` +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          relation_filters,
          FilterPropertiesType.RELATION,
          "2"
        ) +
        `]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          children_filters,
          FilterPropertiesType.NODE,
          "3"
        ) +
        "where ";
      if (
        rootExcludedLabelsWithoutEmptyString &&
        rootExcludedLabelsWithoutEmptyString.length > 0
      ) {
        cypher =
          cypher +
          dynamicNotLabelAdder("n", rootExcludedLabelsWithoutEmptyString);
      }
      if (
        childrenExcludedLabelsLabelsWithoutEmptyString &&
        childrenExcludedLabelsLabelsWithoutEmptyString.length > 0
      ) {
        if (
          rootExcludedLabelsWithoutEmptyString &&
          rootExcludedLabelsWithoutEmptyString.length > 0
        ) {
          cypher =
            cypher +
            " and " +
            dynamicNotLabelAdder(
              "m",
              childrenExcludedLabelsLabelsWithoutEmptyString
            );
        } else {
        }
        cypher =
          cypher +
          dynamicNotLabelAdder(
            "m",
            childrenExcludedLabelsLabelsWithoutEmptyString
          );
      }
      cypher = cypher + ` RETURN n as parent,m as children, r as relation`;
      relation_filters = changeObjectKeyName(relation_filters, "2");
      children_filters = changeObjectKeyName(children_filters, "3");
      parameters = { ...parameters, ...children_filters, ...relation_filters };

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

  async findAllRelationsById(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    relation_filters: object = {},
    relation_depth: number | "" = "",
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);

      const rootNode = await this.findByIdAndFilters(
        root_id,
        rootLabelsWithoutEmptyString,
        root_filters
      );
      if (!rootNode || Object.keys(rootNode).length == 0) {
        throw new HttpException(
          find_with_children_by_realm_as_tree__find_by_realm_error,
          404
        );
      }
      const rootId = rootNode.identity.low;

      let cypher;
      let response;

      cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootNode.labels) +
        `)
        -[:r*1..${relation_depth}` +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          relation_filters,
          FilterPropertiesType.RELATION,
          "3"
        ) +
        `]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(children_filters) +
        `  WHERE  id(m) = $rootId  RETURN n as parent,m as children`;
      relation_filters = changeObjectKeyName(relation_filters, "2");
      const parameters = { ...children_filters, ...relation_filters, rootId };
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

  async findAllRelationsByLabels(
    root_labels: Array<string> = [],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    relation_filters: object = {},
    relation_depth: number | "",
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
        `-[:r*1..${relation_depth} ` +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          relation_filters,
          FilterPropertiesType.RELATION,
          "3"
        ) +
        `]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(children_filters) +
        ` RETURN n as parent,m as children`;

      children_filters = changeObjectKeyName(children_filters);
      relation_filters = changeObjectKeyName(relation_filters, "3");
      const parameters = {
        ...root_filters,
        ...children_filters,
        ...relation_filters,
      };
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

  async findChildrensByIdAndFiltersWithPagination(
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
  ) {
    try {
      if (!relation_name) {
        throw new HttpException("required_fields_must_entered", 404);
      }
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);
      const rootExcludedLabelsWithoutEmptyString = filterArrayForEmptyString(
        root_exculuded_labels
      );
      const childrenExcludedLabelsLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_exculuded_labels);
      let parameters = { root_id, ...queryObject };
      parameters.skip = this.int(+queryObject.skip) as unknown as number;
      parameters.limit = this.int(+queryObject.limit) as unknown as number;

      let cypher;
      let response;

      cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        `-[r:${relation_name}*1..${relation_depth}` +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          relation_filters,
          FilterPropertiesType.RELATION,
          "2"
        ) +
        ` ]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          children_filters,
          FilterPropertiesType.NODE,
          "3"
        ) +
        `  WHERE  id(n) = $root_id `;
      if (
        rootExcludedLabelsWithoutEmptyString &&
        rootExcludedLabelsWithoutEmptyString.length > 0
      ) {
        cypher =
          cypher +
          " and " +
          dynamicNotLabelAdder("n", rootExcludedLabelsWithoutEmptyString);
      }
      if (
        childrenExcludedLabelsLabelsWithoutEmptyString &&
        childrenExcludedLabelsLabelsWithoutEmptyString.length > 0
      ) {
        cypher =
          cypher +
          " and " +
          dynamicNotLabelAdder(
            "m",
            childrenExcludedLabelsLabelsWithoutEmptyString
          );
      }
      cypher = cypher + ` RETURN n as parent,m as children, r as relation`;
      if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
        cypher =
          cypher +
          dynamicOrderByColumnAdder("m", queryObject.orderByColumn) +
          ` ${queryObject.orderBy} SKIP $skip LIMIT $limit  `;
      } else {
        cypher = cypher + ` SKIP $skip LIMIT $limit `;
      }

      relation_filters = changeObjectKeyName(relation_filters, "2");
      children_filters = changeObjectKeyName(children_filters, "3");
      parameters = { ...parameters, ...children_filters, ...relation_filters };
      // eslint-disable-next-line prefer-const
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

  async findChildrensAndParentOfChildrenByIdAndFilter(
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
  ) {
    try {
      if (!relation_name1 || !relation_name2) {
        throw new HttpException(required_fields_must_entered, 404);
      }
      const childrenLabelsWithoutEmptyString = children_labels;
      const parentofChildrenLabelsWithoutEmptyString = parentof_children_labels;
      const rootNode = await this.findByIdAndFilters(
        root_id,
        root_labels,
        root_filters
      );
      if (!rootNode || rootNode.length == 0) {
        throw new HttpException(
          find_with_children_by_realm_as_tree__find_by_realm_error,
          404
        );
      }
      const rootId = rootNode.identity.low;
      const parameters = {
        rootId,
        ...children_filters,
        ...parentof_children_filters,
        ...queryObject,
      };
      parameters.skip = this.int(+queryObject.skip) as unknown as number;
      parameters.limit = this.int(+queryObject.limit) as unknown as number;

      let cypher;
      let response;

      cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootNode.labels) +
        `)-[:${relation_name1}*]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(children_filters) +
        `<-[:${relation_name2}*]-(k` +
        dynamicLabelAdder(parentofChildrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(parentof_children_filters) +
        `  WHERE  id(n) = $rootId  RETURN n as parent,m as children, k as parentofchildren, count(m) as total `;
      if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
        cypher =
          cypher +
          `ORDER BY k.` +
          `${queryObject.orderByColumn} ${queryObject.orderBy} SKIP $skip LIMIT $limit  `;
      } else {
        cypher =
          cypher + `ORDER BY ${queryObject.orderBy} SKIP $skip LIMIT $limit `;
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
  ) {
    try {
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);
      const childrenExcludedLabelsLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_exculuded_labels);

      let parameters = { root_id, ...queryObject, ...root_filters };

      parameters["searchString"] = `(?i).*${searchString}.*`;
      parameters.skip = this.int(+queryObject.skip) as unknown as number;
      parameters.limit = this.int(+queryObject.limit) as unknown as number;

      let cypher;
      let response;

      cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        `-[r:${relation_name}*1..${relation_depth}` +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          relation_filters,
          FilterPropertiesType.RELATION
        ) +
        `]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          children_filters,
          FilterPropertiesType.NODE,
          "2"
        ) +
        `  WHERE  id(n) = $root_id and `;
      if (childrenExcludedLabelsLabelsWithoutEmptyString.length > 0) {
        cypher =
          cypher +
          dynamicNotLabelAdder(
            "m",
            childrenExcludedLabelsLabelsWithoutEmptyString
          ) +
          ` and (any(prop in keys(m) where m[prop]=~ $searchString)) ` +
          `RETURN n as parent,m as children,r as relation `;
      } else {
        cypher =
          cypher +
          `(any(prop in keys(m) where m[prop]=~ $searchString)) ` +
          `RETURN n as parent,m as children,r as relation `;
      }
      if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
        cypher =
          cypher +
          dynamicOrderByColumnAdder("m", queryObject.orderByColumn) +
          ` ${queryObject.orderBy} SKIP $skip LIMIT $limit  `;
      } else {
        cypher = cypher + `SKIP $skip LIMIT $limit `;
      }
      relation_filters = changeObjectKeyName(relation_filters);
      children_filters = changeObjectKeyName(children_filters, "2");
      parameters = { ...parameters, ...children_filters, ...relation_filters };

      // eslint-disable-next-line prefer-const
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

  async findChildrensByIdAndFiltersAndSearchStringsTotalCount(
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
  ) {
    try {
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);
      const childrenExcludedLabelsLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_exculuded_labels);

      let parameters = { root_id, ...root_filters };

      parameters["searchString"] = `(?i).*${search_string}.*`;

      let cypher;
      let response;

      cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        `-[r:${relation_name}*1..${relation_depth}` +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          relation_filters,
          FilterPropertiesType.RELATION
        ) +
        `]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          children_filters,
          FilterPropertiesType.NODE,
          "2"
        ) +
        `  WHERE  id(n) = $root_id and `;
      if (childrenExcludedLabelsLabelsWithoutEmptyString.length > 0) {
        cypher =
          cypher +
          dynamicNotLabelAdder(
            "m",
            childrenExcludedLabelsLabelsWithoutEmptyString
          ) +
          ` and (any(prop in keys(m) where m[prop]=~ $searchString)) ` +
          `RETURN count(m) as count  `;
      } else {
        cypher =
          cypher +
          `(any(prop in keys(m) where m[prop]=~ $searchString)) ` +
          `RETURN count(m) as count  `;
      }

      relation_filters = changeObjectKeyName(relation_filters);
      children_filters = changeObjectKeyName(children_filters, "2");
      parameters = { ...parameters, ...children_filters, ...relation_filters };

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
  ) {
    try {
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);
      const childrenExcludedLabelsLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_exculuded_labels);

      let parameters = { root_id, ...root_filters, ...queryObject };

      parameters["searchString"] = searchString;
      parameters.skip = this.int(+queryObject.skip) as unknown as number;
      parameters.limit = this.int(+queryObject.limit) as unknown as number;

      let cypher;
      let response;

      cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        `-[r:${relation_name}*1..${relation_depth}` +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          relation_filters,
          FilterPropertiesType.RELATION
        ) +
        ` ]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          children_filters,
          FilterPropertiesType.NODE,
          "2"
        ) +
        `  WHERE  id(n) = $root_id and `;
      if (childrenExcludedLabelsLabelsWithoutEmptyString.length > 0) {
        cypher =
          cypher +
          dynamicNotLabelAdder(
            "m",
            childrenExcludedLabelsLabelsWithoutEmptyString
          ) +
          ` and toLower(m.${queryObject.orderByColumn}) ${search_type}  toLower($searchString) ` +
          `RETURN n as parent,m as children,r as relation `;
      } else {
        cypher =
          cypher +
          ` toLower(m.${searchColumn}) ${search_type}  toLower($searchString) ` +
          `RETURN n as parent,m as children,r as relation `;
      }
      if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
        cypher =
          cypher +
          dynamicOrderByColumnAdder("m", queryObject.orderByColumn) +
          ` ${queryObject.orderBy} SKIP $skip LIMIT $limit  `;
      } else {
        cypher = cypher + `SKIP $skip LIMIT $limit `;
      }

      relation_filters = changeObjectKeyName(relation_filters);
      children_filters = changeObjectKeyName(children_filters, "2");
      parameters = { ...parameters, ...children_filters, ...relation_filters };
      // eslint-disable-next-line prefer-const
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

  async findChildrensByIdAndFiltersBySearcStringBySpecificColumnTotalCount(
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
  ) {
    try {
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_labels);
      const childrenExcludedLabelsLabelsWithoutEmptyString =
        filterArrayForEmptyString(children_exculuded_labels);

      let parameters = { root_id, ...root_filters };

      parameters["searchString"] = search_string;

      let cypher;
      let response;

      cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        `-[r:${relation_name}*1..${relation_depth}` +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          relation_filters,
          FilterPropertiesType.RELATION
        ) +
        ` ]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          children_filters,
          FilterPropertiesType.NODE,
          "2"
        ) +
        `  WHERE  id(n) = $root_id and `;
      if (childrenExcludedLabelsLabelsWithoutEmptyString.length > 0) {
        cypher =
          cypher +
          dynamicNotLabelAdder(
            "m",
            childrenExcludedLabelsLabelsWithoutEmptyString
          ) +
          ` and toLower(m.${search_column}) ${search_type}  toLower($searchString) ` +
          `RETURN count(m) as count `;
      } else {
        cypher =
          cypher +
          ` toLower(m.${search_column}) ${search_type}  toLower($searchString) ` +
          `RETURN count(m) as count `;
      }

      relation_filters = changeObjectKeyName(relation_filters);
      children_filters = changeObjectKeyName(children_filters, "2");
      parameters = { ...parameters, ...children_filters, ...relation_filters };
      // eslint-disable-next-line prefer-const
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

  async findMainNodesRelationsWithFilters(
    mainNodeLabels: string[],
    mainNodeFilters: object,
    otherNodesProps: otherNodesObjProps[],
    queryObject: queryObjectType,
    databaseOrTransaction?
  ) {
    try {
      let cypher =
        `MATCH (n` +
        dynamicLabelAdder(mainNodeLabels) +
        dynamicFilterPropertiesAdder(mainNodeFilters);
      const cyperNodeNameArr = ["n"];
      let parameters = { ...mainNodeFilters, ...queryObject };
      parameters.skip = this.int(+queryObject.skip) as unknown as number;
      parameters.limit = this.int(+queryObject.limit) as unknown as number;
      otherNodesProps.forEach((nodes, index) => {
        if (nodes.labels.includes("Virtual")) {
          nodes.filters["referenceKey"] = nodes.filters["key"];
          delete nodes.filters["key"];
        }
        const cyperNodeName = "n" + index;
        cypher =
          cypher +
          ` match (${cyperNodeName}` +
          dynamicLabelAdder(nodes.labels) +
          dynamicFilterPropertiesAdderAndAddParameterKey(
            nodes.filters,
            FilterPropertiesType.NODE,
            cyperNodeName
          ) +
          ` match (n)-[:${nodes.relationName}]-(${cyperNodeName})`;
        const children_filters = changeObjectKeyName(
          nodes.filters,
          cyperNodeName
        );
        parameters = { ...parameters, ...children_filters };
        cyperNodeNameArr.push(cyperNodeName);
        if (otherNodesProps.length - 1 === index) {
          cypher = cypher + " return ";
          cyperNodeNameArr.forEach((name, index) => {
            if (cyperNodeNameArr.length - 1 !== index) {
              cypher = cypher + name + ",";
            } else {
              cypher = cypher + name;
            }
          });
          if (
            queryObject.orderByColumn &&
            queryObject.orderByColumn.length >= 1
          ) {
            cypher =
              cypher +
              dynamicOrderByColumnAdder("n", queryObject.orderByColumn) +
              ` ${queryObject.orderBy} SKIP $skip LIMIT $limit  `;
          } else {
            cypher = cypher + ` SKIP $skip LIMIT $limit `;
          }
        }
      });

      const result = await this.read(cypher, parameters, databaseOrTransaction);
      return result["records"];
    } catch (error) {
      throw new HttpException(error, 500);
    }
  }
  async findTotalCountsOfMainNodesRelationsWithFilters(
    mainNodeLabels: string[],
    mainNodeFilters: object,
    otherNodesProps: otherNodesObjProps[],
    databaseOrTransaction?
  ) {
    try {
      let cypher =
        `MATCH (n` +
        dynamicLabelAdder(mainNodeLabels) +
        dynamicFilterPropertiesAdder(mainNodeFilters);

      let parameters = { ...mainNodeFilters };
      otherNodesProps.forEach((nodes, index) => {
        if (nodes.labels.includes("Virtual")) {
          nodes.filters["referenceKey"] = nodes.filters["key"];
          delete nodes.filters["key"];
        }
        const cyperNodeName = "n" + index;
        cypher =
          cypher +
          ` match (${cyperNodeName}` +
          dynamicLabelAdder(nodes.labels) +
          dynamicFilterPropertiesAdderAndAddParameterKey(
            nodes.filters,
            FilterPropertiesType.NODE,
            cyperNodeName
          ) +
          ` match (n)-[:${nodes.relationName}]-(${cyperNodeName})`;
        const children_filters = changeObjectKeyName(
          nodes.filters,
          cyperNodeName
        );
        parameters = { ...parameters, ...children_filters };
      });
      cypher = cypher + " return count(n) as count";
      const result = await this.read(cypher, parameters, databaseOrTransaction);
      return result["records"];
    } catch (error) {
      throw new HttpException(error, 500);
    }
  }
}
