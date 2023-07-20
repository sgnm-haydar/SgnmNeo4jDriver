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
  dynamicFilterPropertiesAdderAndAddParameterKeyNew,
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
      if (!rootNode) {
        throw new HttpException(
          find_with_children_by_realm_as_tree__find_by_realm_error,
          404
        );
      }
      const rootId = rootNode.identity.low;
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
    relation_depth: number | "",
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
    relation_depth: number | "",
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
    relation_depth: number | "",
    reverseRelation: boolean = false,
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
        `${reverseRelation ? '<' : ''}-[r:${relation_name}*1..${relation_depth}` +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          relation_filters,
          FilterPropertiesType.RELATION,
          "2"
        ) +
        ` ]-${reverseRelation ? '' : '>'}(m` +
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
  async findChildrensByIdAndFiltersAndRelationArray(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    children_labels: string[] = [],
    children_filters: object = {},
    relation_names: string[],
    relation_filters: object = {},
    relation_depth: number | "",
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      if (!relation_names) {
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
        `-[r:${await this.relationArray(relation_names)}*1..${relation_depth}` +
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
    relation_depth: number | "",
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

  async findChildrensByIdAndFiltersAndRelationArrayTotalCount(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    relation_names: string[],
    relation_filters: object = {},
    relation_depth: number | "",
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      if (!relation_names) {
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
        `-[r:${await this.relationArray(relation_names)}*1..${relation_depth}` +
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
    relation_depth: number | "",
    reverseRelationDirection: boolean = false,
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
        `${reverseRelationDirection ? '<' : ''}-[r:${relation_name}*1..${relation_depth}` +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          relation_filters,
          FilterPropertiesType.RELATION,
          "2"
        ) +
        ` ]-${reverseRelationDirection ? '' : '>'}(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(children_filters) +
        ` RETURN n as parent,m as children,r as relation`;

      children_filters = changeObjectKeyName(children_filters);
      relation_filters = changeObjectKeyName(relation_filters, "2");
      const parameters = {
        ...root_filters,
        ...children_filters,
        ...relation_filters,
      };
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
  async findChildrensByLabelsAndFiltersAndRelationArray(
    root_labels: string[] = [],
    root_filters: object = {},
    children_labels: string[] = [],
    children_filters: object = {},
    relation_names: string[],
    relation_filters: object = {},
    relation_depth: number | "",
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
        `-[r:${await this.relationArray(relation_names)}*1..${relation_depth}` +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          relation_filters,
          FilterPropertiesType.RELATION,
          "2"
        ) +
        ` ]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(children_filters) +
        ` RETURN n as parent,m as children,r as relation`;

      children_filters = changeObjectKeyName(children_filters);
      relation_filters = changeObjectKeyName(relation_filters, "2");
      const parameters = {
        ...root_filters,
        ...children_filters,
        ...relation_filters,
      };
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
        throw new HttpException("null", 400);
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
      const firstNode = await this.findByIdAndFilters(first_node_id, [], {});
      const secondNode = await this.findByIdAndFilters(second_node_id, [], {});

      let cyper;

      cyper = `MATCH (n) where id(n)= $first_node_id MATCH (m) where id(m)= $second_node_id MERGE (n)<-[r:PARENT_OF {isDeleted:false}]- (m) return n as parent,m as children,r as relation`;
      const parameters = {
        first_node_id,
        second_node_id,
      };
      const res = await this.write(cyper, parameters, databaseOrTransaction);

      if (!res) {
        throw new HttpException("null", 400);
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
          if (Object.keys(relation_update_properties).length == 0) {
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
              ` return n as parent,m as children,r as relation`;
          } else {
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
              "set " +
              dynamicUpdatePropertyAdderAndAddParameterKey(
                "r",
                relation_update_properties,
                "2"
              ) +
              ` return n as parent,m as children,r as relation`;
          }
          break;
        case RelationDirection.LEFT:
          if (Object.keys(relation_update_properties).length == 0) {
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
              `return n as parent,m as children,r as relation`;
          } else {
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
          }

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
  async updateRelationByIdWithRelationNameAndFiltersAndRelationArray(
    first_node_id: number,
    first_node_labels: string[] = [""],
    first_node_filters: object = {},
    second_node_id: number,
    second_node_labels: string[] = [""],
    second_node_filters: object = {},
    relation_names: string[],
    relation_properties: object = {},
    relation_update_properties: object = {},
    relation_direction: RelationDirection = RelationDirection.RIGHT,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      let cyper;
      switch (relation_direction) {
        case RelationDirection.RIGHT:
          if (Object.keys(relation_update_properties).length == 0) {
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
              `  where id(m)= $second_node_id MERGE (n)-[r:${await this.relationArray(
                relation_names
              )}` +
              dynamicFilterPropertiesAdderAndAddParameterKey(
                relation_properties,
                FilterPropertiesType.RELATION
              ) +
              `]->(m) ` +
              ` return n as parent,m as children,r as relation`;
          } else {
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
              `  where id(m)= $second_node_id MERGE (n)-[r:${await this.relationArray(
                relation_names
              )}` +
              dynamicFilterPropertiesAdderAndAddParameterKey(
                relation_properties,
                FilterPropertiesType.RELATION
              ) +
              `]->(m) ` +
              "set " +
              dynamicUpdatePropertyAdderAndAddParameterKey(
                "r",
                relation_update_properties,
                "2"
              ) +
              ` return n as parent,m as children,r as relation`;
          }
          break;
        case RelationDirection.LEFT:
          if (Object.keys(relation_update_properties).length == 0) {
            cyper =
              `MATCH (m` +
              dynamicLabelAdder(first_node_labels) +
              `) where id(m)= $first_node_id MATCH (n` +
              dynamicLabelAdder(second_node_labels) +
              `) where id(n)= $second_node_id MERGE (m)<-[:${await this.relationArray(
                relation_names
              )}` +
              dynamicFilterPropertiesAdderAndAddParameterKey(
                relation_properties,
                FilterPropertiesType.RELATION
              ) +
              `]- (n) ` +
              `return n as parent,m as children,r as relation`;
          } else {
            cyper =
              `MATCH (m` +
              dynamicLabelAdder(first_node_labels) +
              `) where id(m)= $first_node_id MATCH (n` +
              dynamicLabelAdder(second_node_labels) +
              `) where id(n)= $second_node_id MERGE (m)<-[:${await this.relationArray(
                relation_names
              )}` +
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
          }

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
  async findChildrensByIdAndNotLabels(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    root_exculuded_labels: string[] = [""],
    children_labels: Array<string> = [""],
    children_filters: object = {},
    children_excluded_labels: string[] = [""],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "",
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
    relation_depth: number | "",
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
        );

      if (
        rootExcludedLabelsWithoutEmptyString &&
        rootExcludedLabelsWithoutEmptyString.length > 0
      ) {
        cypher =
          cypher +
          " where " +
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
          cypher =
            cypher +
            " where " +
            dynamicNotLabelAdder(
              "m",
              childrenExcludedLabelsLabelsWithoutEmptyString
            );
        }
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
    relation_depth: number | "",
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

  async findRelationByLabelAndNodeLabels(
    root_labels: Array<string> = [],
    root_filters: object = {},
    children_labels: Array<string> = [],
    children_filters: object = {},
    relation_or_names: Array<string> = [],
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
        `-[r:${await this.relationArray(relation_or_names)}*1..${relation_depth} ` +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          relation_filters,
          FilterPropertiesType.RELATION,
          "3"
        ) +
        `]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(children_filters) +
        ` RETURN n as parent,m as children,r as relation`;

      children_filters = changeObjectKeyName(children_filters);
      relation_filters = changeObjectKeyName(relation_filters, "3");
      const parameters = {
        ...root_filters,
        ...children_filters,
        ...relation_filters,
      };
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
    relation_depth: number | "",
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
      cypher = cypher + ` RETURN n as parent,m as children, r as relation `;
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
      parameters = {
        ...parameters,
        ...children_filters,
        ...relation_filters,
        ...root_filters,
      };
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
  async findChildrensByIdAndFiltersAndRelationArrayWithPagination(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    root_exculuded_labels: string[] = [""],
    children_labels: Array<string> = [],
    children_filters: object = {},
    children_exculuded_labels: string[] = [""],
    relation_names: string[],
    relation_filters: object = {},
    relation_depth: number | "",
    queryObject: queryObjectType,
    databaseOrTransaction?: string
  ) {
    try {
      if (!relation_names) {
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
        `-[r:${await this.relationArray(relation_names)}*1..${relation_depth}` +
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
      cypher = cypher + ` RETURN n as parent,m as children, r as relation `;
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
      parameters = {
        ...parameters,
        ...children_filters,
        ...relation_filters,
        ...root_filters,
      };
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

  async findChildrenByIdOrFiltersWithPaginationAndSearchString(
    root_id: number,
    root_labels: string[],
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "",
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
        `]->(m${dynamicFilterPropertiesAdderAndAddParameterKey(
          children_filters,
          FilterPropertiesType.NODE,
          "2"
        )} WHERE`+
        `(${dynamicOrLabelAdder("m", childrenLabelsWithoutEmptyString)}) AND id(n) = $root_id and `;
      if (childrenExcludedLabelsLabelsWithoutEmptyString.length > 0) {
        cypher =
          cypher +
          dynamicNotLabelAdder(
            "m",
            childrenExcludedLabelsLabelsWithoutEmptyString
          ) +
          ` and (any(prop in keys(m) where (m[prop]=~ $searchString and prop <> 'key'))) or ('${searchString}' IN m.tag)` +
          `RETURN n as parent,m as children,r as relation `;
      } else {
        cypher =
          cypher +
          `(any(prop in keys(m) where (m[prop]=~ $searchString and prop <> 'key'))) or ('${searchString}' IN m.tag) ` +
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
  
  async getTreeStructureOfChildrenWithOrFilterBySearchString(
    root_id: number,
    root_labels: string[],
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "",
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
        `]->(m${dynamicFilterPropertiesAdderAndAddParameterKey(
          children_filters,
          FilterPropertiesType.NODE,
          "2"
        )} WHERE `+
        `(${dynamicOrLabelAdder("m", childrenLabelsWithoutEmptyString)}) AND id(n) = $root_id AND `;
      if (childrenExcludedLabelsLabelsWithoutEmptyString.length > 0) {
        cypher =
          cypher +
          dynamicNotLabelAdder(
            "m",
            childrenExcludedLabelsLabelsWithoutEmptyString
          ) +
          `m.name =~ $searchString ` +
          `WITH COLLECT(p) AS ps CALL apoc.convert.toTree(ps) yield value  RETURN value `;
        } else {
        cypher =
          cypher +
          `m.name =~ $searchString ` +
          `WITH COLLECT(p) AS ps  CALL apoc.convert.toTree(ps) yield value  RETURN value `;
        }
      // cypher = cypher + `SKIP $skip LIMIT $limit `;
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

  async findChildrensByIdAndFiltersWithPaginationAndSearcString(
    root_id: number,
    root_labels: string[],
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "",
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
          ` and (any(prop in keys(m) where (m[prop]=~ $searchString and prop <> 'key'))) or ('${searchString}' IN m.tag)` +
          `RETURN n as parent,m as children,r as relation `;
      } else {
        cypher =
          cypher +
          `(any(prop in keys(m) where (m[prop]=~ $searchString and prop <> 'key'))) or ('${searchString}' IN m.tag) ` +
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

  async findChildrensByIdAndFiltersWithPaginationAndSearchStringWithCount(
    root_id: number,
    root_labels: string[],
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "",
    queryObject: queryObjectType,
    searchString: string,
    isCount: boolean=false,
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
          ` and (any(prop in keys(m) where (m[prop]=~ $searchString and prop <> 'key' and prop <> 'url' ))) ` +
          `RETURN n as parent,m as children,r as relation, count(m) as totalCount `;
        
      
      } else {
  
          cypher =
          cypher +
          `(any(prop in keys(m) where (m[prop]=~ $searchString and prop <> 'key' and prop <> 'url' )))  ` +
          `RETURN n as parent,m as children,r as relation, count(m) as totalCount `;
        
       
      }

      if(isCount){
        if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
          cypher =
            cypher +
            dynamicOrderByColumnAdder("m", queryObject.orderByColumn) +
            ` ${queryObject.orderBy} `;
      }else {
        if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
          cypher =
            cypher +
            dynamicOrderByColumnAdder("m", queryObject.orderByColumn) +
            ` ${queryObject.orderBy} `;
      }
    
      } }
      else {
        if(isCount){
          cypher
        }
        else {
          cypher = cypher + `SKIP $skip LIMIT $limit `;
        }
        
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

  async findChildrensByIdAndFiltersWithPaginationAndSearcStringAndRelationArray(
    root_id: number,
    root_labels: string[],
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_names: string[],
    relation_filters: object = {},
    relation_depth: number | "",
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
        `-[r:${await this.relationArray(relation_names)}*1..${relation_depth}` +
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
    relation_depth: number | "",
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
          ` and (any(prop in keys(m) where (m[prop]=~ $searchString and prop <> 'key'))) or ('${search_string}' IN m.tag)` +
          `RETURN count(m) as count  `;
      } else {
        cypher =
          cypher +
          `(any(prop in keys(m) where (m[prop]=~ $searchString and prop <> 'key'))) or ('${search_string}' IN m.tag)` +
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

  async findChildrensByIdAndFiltersAndSearchStringsAndRelationArrayTotalCount(
    root_id: number,
    root_labels: string[],
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_names: string[],
    relation_filters: object = {},
    relation_depth: number | "",
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
        `-[r:${await this.relationArray(relation_names)}*1..${relation_depth}` +
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
    relation_depth: number | "",
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
  async findChildrensByIdAndFiltersAndRelationArrayWithPaginationAndSearcStringBySpecificColumn(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_names: string[],
    relation_filters: object = {},
    relation_depth: number | "",
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
        `-[r:${await this.relationArray(relation_names)}*1..${relation_depth}` +
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
    relation_depth: number | "",
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
  async findChildrensByIdAndFiltersAndRelationArrayBySearcStringBySpecificColumnTotalCount(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_names: string[],
    relation_filters: object = {},
    relation_depth: number | "",
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
        `-[r:${await this.relationArray(relation_names)}*1..${relation_depth}` +
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
    rootLabels: string[],
    rootFilters: object,
    mainNodeLabels: string[],
    mainNodeFilters: object,
    otherNodesProps: otherNodesObjProps[],
    queryObject: queryObjectType,
    databaseOrTransaction?
  ) {
    try {
      let cypher =
        `MATCH(m` +
        dynamicLabelAdder(rootLabels) +
        dynamicFilterPropertiesAdder(rootFilters) +
        ` MATCH (n` +
        dynamicLabelAdder(mainNodeLabels) +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          mainNodeFilters,
          FilterPropertiesType.NODE,
          "n"
        ) +
        "match(n)<-[*]-(m)";
      const cyperNodeNameArr = ["n"];
      let parameters = { ...mainNodeFilters, ...queryObject };
      parameters.skip = this.int(+queryObject.skip) as unknown as number;
      parameters.limit = this.int(+queryObject.limit) as unknown as number;
      otherNodesProps.forEach((nodes, index) => {
        if (nodes.labels.includes("Virtual")) {
          nodes.filters["referenceId"] = nodes.filters["id"];
          delete nodes.filters["id"];
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
      const main_node_filters = changeObjectKeyName(mainNodeFilters, "n");

      parameters = { ...parameters, ...main_node_filters, ...rootFilters };

      const result = await this.read(cypher, parameters, databaseOrTransaction);
      return result["records"];
    } catch (error) {
      throw new HttpException(error, 500);
    }
  }
  async findTotalCountsOfMainNodesRelationsWithFilters(
    rootLabels: string[],
    rootFilters: object,
    mainNodeLabels: string[],
    mainNodeFilters: object,
    otherNodesProps: otherNodesObjProps[],
    databaseOrTransaction?,
  ) {
    try {
      let cypher =
        `MATCH(m` +
        dynamicLabelAdder(rootLabels) +
        dynamicFilterPropertiesAdder(rootFilters) +
        `MATCH (n` +
        dynamicLabelAdder(mainNodeLabels) +
        dynamicFilterPropertiesAdderAndAddParameterKey(mainNodeFilters, FilterPropertiesType.NODE, 'n') +
        'match(n)<-[*]-(m)';

      let parameters = { ...mainNodeFilters };
      otherNodesProps.forEach((nodes, index) => {
        if (nodes.labels.includes('Virtual')) {
          nodes.filters['referenceId'] = nodes.filters['id'];
          delete nodes.filters['id'];
        }
        const cyperNodeName = 'n' + index;
        cypher =
          cypher +
          ` match (${cyperNodeName}` +
          dynamicLabelAdder(nodes.labels) +
          dynamicFilterPropertiesAdderAndAddParameterKey(nodes.filters, FilterPropertiesType.NODE, cyperNodeName) +
          ` match (n)-[:${nodes.relationName}]-(${cyperNodeName})`;
        const children_filters = changeObjectKeyName(nodes.filters, cyperNodeName);
        parameters = { ...parameters, ...children_filters };
      });
      cypher = cypher + ' return count(n) as count';

      const main_node_filters = changeObjectKeyName(mainNodeFilters, 'n');

      parameters = { ...parameters, ...main_node_filters, ...rootFilters };
      const result = await this.read(cypher, parameters, databaseOrTransaction);
      return result['records'];
    } catch (error) {
      throw new HttpException(error, 500);
    }
  }
  async getNodeRelationsArray(
    root_labels: Array<string> = [""],
    root_filters: object = {},
    child_labels: Array<string> = [""],
    children_filters: object = {},
    children_excluded_labels: Array<string> = [""],
    relation_direction: RelationDirection = RelationDirection.RIGHT
  ) {
    const rootLabelsLabelsWithoutEmptyString =
      filterArrayForEmptyString(root_labels);
    const childLabelsLabelsWithoutEmptyString =
      filterArrayForEmptyString(child_labels);
    const childExcludedLabelsLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_excluded_labels);
    let query =
      `MATCH (n` +
      dynamicLabelAdder(rootLabelsLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdder(root_filters);
    if (relation_direction == RelationDirection.RIGHT) {
      query = query + `-[r]->(m `;
    } else {
      query = query + `<-[r]-(m `;
    }
    query =
      query +
      dynamicLabelAdder(child_labels) +
      dynamicFilterPropertiesAdderAndAddParameterKey(children_filters);

    if (
      childExcludedLabelsLabelsWithoutEmptyString &&
      childExcludedLabelsLabelsWithoutEmptyString.length > 0
    ) {
      query =
        query +
        ` where ` +
        dynamicNotLabelAdder("n", childExcludedLabelsLabelsWithoutEmptyString);
    }

    query =
      query +
      ` WITH type(r) as type, startNode(r) as startNode, endNode(r) as endNode
    WITH  type, labels(startNode) as startLabel, labels(endNode) as endLabel, COUNT(*) as rCount
    ORDER BY  startLabel, endLabel
    RETURN collect({count: rCount, relationName: type, node: {source: startLabel, target: endLabel}}) as relationships`;
    children_filters = changeObjectKeyName(children_filters);
    const parameters = { ...root_filters, ...children_filters };
      
       
    const node = await this.read(query, parameters);
    return node.records;
  }

  async relationArray(data: string[]) {
    let cypher: string = "";
    for (let index = 0; index < data.length; index++) {
      cypher += `${data[index]}|`;
    }
    let result = cypher.substring(0, cypher.length - 1);
    return result;
  }
  async getParentByIdAndFiltersWithExcludedLabels(
    id: number,
    node_labels: string[] = [""],
    node_filters: object = {},
    parent_labels: string[] = [""],
    parent_filters: object = {},
    parent_excluded_labels: string[] = [""],
    relation_name: string,
    relation_filters,
    relation_depth?: number | "",
    databaseOrTransaction?: string
  ) {
    try {
      const nodeLabelsWithoutEmptyString =
        filterArrayForEmptyString(node_labels);
      const parentLabelsWithoutEmptyString =
        filterArrayForEmptyString(parent_labels);
      const parentExcludedLabelsWithoutEmptyString = filterArrayForEmptyString(
        parent_excluded_labels
      );
      const node = await this.findByIdAndFilters(
        +id,
        node_labels,
        node_filters
      );

      let query =
        "MATCH (n" +
        dynamicLabelAdder(nodeLabelsWithoutEmptyString) +
        ") where id(n)= $id match(m" +
        dynamicLabelAdder(parentLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(parent_filters) +
        " match (m)-" +
        `[r:${relation_name}*1..${relation_depth}` +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          relation_filters,
          FilterPropertiesType.RELATION
        ) +
        `]->(n)`;
      if (
        parentExcludedLabelsWithoutEmptyString &&
        parentExcludedLabelsWithoutEmptyString.length > 0
      ) {
        query =
          query +
          " where " +
          dynamicNotLabelAdder("m", parentExcludedLabelsWithoutEmptyString) +
          ` return m as parent,n as children`;
      } else {
        query = query + ` return m as parent,n as children`;
      }

      relation_filters = changeObjectKeyName(relation_filters);
      const parameters = { id, ...parent_filters, ...relation_filters };
        

      const res = await this.read(query, parameters, databaseOrTransaction);
      if (!res || !res["records"] || res["records"].length == 0) {
        return [];
        //throw new HttpException(parent_of_child_not_found, 404);
      }
      return res["records"];
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
  async findChildrensByParentIdAndOrChildrenLabelsAsTree(
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

      let orChidrenLabelcondition = "";
      if (childrenLabelsWithoutEmptyString.length > 0) {
        orChidrenLabelcondition =
          " and (m:" + childrenLabelsWithoutEmptyString[0];

        childrenLabelsWithoutEmptyString.forEach((item) => {
          if (item != childrenLabelsWithoutEmptyString[0]) {
            orChidrenLabelcondition = orChidrenLabelcondition + " or m:" + item;
          }
        });
        orChidrenLabelcondition = orChidrenLabelcondition + ") ";
      }

      const rootNode = await this.findByIdAndFilters(
        root_id,
        rootLabelsWithoutEmptyString,
        root_filters
      );
      if (!rootNode) {
        throw new HttpException(
          find_with_children_by_realm_as_tree__find_by_realm_error,
          404
        );
      }
      const rootId = rootNode.identity.low;
      const cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        `)-[:PARENT_OF*]->(m ` +
        dynamicFilterPropertiesAdder(children_filters) +
        `  WHERE  id(n) = $rootId ` +
        orChidrenLabelcondition +
        ` WITH COLLECT(p) AS ps  CALL apoc.convert.toTree(ps) yield value  RETURN value`;

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

  async findChildrensByParentIdAndOrChildrenLabelsWithTreeStructure(
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
      let tree = await this.findChildrensByParentIdAndOrChildrenLabelsAsTree(
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
        tree.properties["_type"] = root_labels[0];
        tree.properties._id = tree.identity;
        const rootNodeObject = { root: tree.properties };
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

  async findChildrensByIdAndOrChildrenLabelsFiltersWithPaginationAndSearcString(
    root_id: number,
    root_labels: string[],
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "",
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
        `]->(m ` +
        // dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
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
          ` and (any(prop in keys(m) where m[prop]=~ $searchString)) `;
      } else {
        cypher =
          cypher + `(any(prop in keys(m) where m[prop]=~ $searchString)) `;
      }
      let orChidrenLabelcondition = "";
      if (childrenLabelsWithoutEmptyString.length > 0) {
        orChidrenLabelcondition =
          " and (m:" + childrenLabelsWithoutEmptyString[0];

        childrenLabelsWithoutEmptyString.forEach((item) => {
          if (item != childrenLabelsWithoutEmptyString[0]) {
            orChidrenLabelcondition = orChidrenLabelcondition + " or m:" + item;
          }
        });
        orChidrenLabelcondition = orChidrenLabelcondition + ") ";
      }
      cypher =
        cypher +
        orChidrenLabelcondition +
        ` RETURN n as parent,m as children,r as relation `;
      cypher = cypher + `SKIP $skip LIMIT $limit `;
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

  /////////////////////////////////////////////////////////////////////////////////////////////////////////

  async findChildrensByLabelsAndNotLabelsAndOrChildrenLabelsAsTree(
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
        //dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
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

      if (
        childrenLabelsWithoutEmptyString &&
        childrenLabelsWithoutEmptyString.length > 0
      ) {
        let childrenOrLabelsCondition =
          " (m:" + childrenLabelsWithoutEmptyString[0];
        childrenLabelsWithoutEmptyString.forEach((item) => {
          if (item != childrenLabelsWithoutEmptyString[0]) {
            childrenOrLabelsCondition =
              childrenOrLabelsCondition + " or m:" + item;
          }
        });
        childrenOrLabelsCondition = childrenOrLabelsCondition + ")";

        if (cypher1 !== "") {
          cypher = cypher + " and " + childrenOrLabelsCondition;
        } else {
          cypher = cypher + childrenOrLabelsCondition;
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

  async findChildrensByIdAndChildrenOrLabels(
    root_id: number,
    root_labels: string[] = [''],
    root_filters: object = {},
    children_labels: Array<string> = [''],
    children_filters: object = {},
    children_or_labels: string[] = [''],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | '',
    isReverseDirection: boolean = false,
    databaseOrTransaction?: string | Transaction,
  ) {
    try {
      if (!relation_name) {
        throw new HttpException(required_fields_must_entered, 404);
      }
      const childrenOrLabelsLabelsWithoutEmptyString = filterArrayForEmptyString(children_or_labels);
      const rootLabelsWithoutEmptyString = filterArrayForEmptyString(root_labels);
      const childrenLabelsWithoutEmptyString = filterArrayForEmptyString(children_labels);

      let parameters = { root_id, ...root_filters };
      let cypher;
      let response;

      cypher =
        `MATCH (n` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        ` WHERE  id(n) = $root_id `;

      cypher =
        cypher +
        `MATCH (m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(children_filters, FilterPropertiesType.NODE, '3') +
        ` WHERE `
      if (childrenOrLabelsLabelsWithoutEmptyString && childrenOrLabelsLabelsWithoutEmptyString.length > 0) {
        cypher = cypher + dynamicOrLabelAdder('m', childrenOrLabelsLabelsWithoutEmptyString);
      }
      cypher=cypher+' match(n)' +

        `${isReverseDirection ? '<': ''}-[r:${relation_name}*1..${relation_depth} ` +
        dynamicFilterPropertiesAdderAndAddParameterKey(relation_filters, FilterPropertiesType.RELATION, '2') +
        `]-${isReverseDirection ? '': '>'}(m)`;

     if(isReverseDirection) cypher = cypher + ` RETURN n as children,m as parent, r as relation`;
     else cypher = cypher + ` RETURN n as parent,m as children, r as relation`;
     
      relation_filters = changeObjectKeyName(relation_filters, '2');
      children_filters = changeObjectKeyName(children_filters, '3');
      parameters = { ...parameters, ...children_filters, ...relation_filters };

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

  async findByLabelAndNotLabelAndOrChildrenLabelsAndFiltersWithTreeStructure(
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

      let tree =
        await this.findChildrensByLabelsAndNotLabelsAndOrChildrenLabelsAsTree(
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
  async delete(
    id: number,
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      const firstNode = await this.findByIdAndFilters(id, [], {});
      
      let cyper;
  
      cyper = `MATCH (n) where id(n)= $id detach delete n`;
      const parameters = {
        id
      };
      const res = await this.write(cyper, parameters, databaseOrTransaction);
  
      if (!res) {
        throw new HttpException("null", 400);
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
  async findChildrensByIdsAndFiltersWithPaginationAndSearcStringBySpecificColumn(
    root_ids: number[],
    root_labels: string[] = [""],
    root_filters: object = {},
    children_labels: string[],
    children_filters: object = {},
    children_exculuded_labels: string[],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "",
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
      
  
      let idCondition = " (id(n) = "+ root_ids[0];
      root_ids.forEach((item) => {
        if (item != root_ids[0]) {
          idCondition = idCondition + ' or id(n)='+item;
        }

      });
      idCondition = idCondition + ') ';  

      let parameters = { ...root_filters, ...queryObject };

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
        `  WHERE  ${idCondition} and `;
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

  async getParentByIdsLabelsAndFiltersWithExcludedLabels(
    idsLabels: object[],
    node_filters: object = {},
    parent_labels: string[] = [""],
    parent_filters: object = {},
    parent_excluded_labels: string[] = [""],
    relation_name: string,
    relation_filters,
    relation_depth?: number | "",
    databaseOrTransaction?: string
  ) {
    try {

      const parentLabelsWithoutEmptyString =
        filterArrayForEmptyString(parent_labels);
      const parentExcludedLabelsWithoutEmptyString = filterArrayForEmptyString(
        parent_excluded_labels
      );
      // const node = await this.findByIdAndFilters(
      //   +id,
      //   node_labels,
      //   node_filters
      // );
      let idLabelCondition = ` ((id(n) = ${idsLabels[0]['identifier']} and  n:${idsLabels[0]['label']}) `    ;
      idsLabels.forEach((item) => {
        if (item['identifier'] !=idsLabels[0]['identifier']) {
          idLabelCondition = idLabelCondition + ` or (id(n) = ${item['identifier']} and n:${item['label']}) `    ;
        }

      });
      idLabelCondition = idLabelCondition + ') ';  
      let query =
      `MATCH (n ` + dynamicFilterPropertiesAdder(node_filters) +
      ` where ${idLabelCondition} ` +
      ` match(m` +
      dynamicLabelAdder(parentLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdder(parent_filters) +
      ` match (m)-` +
      `[r:${relation_name}*1..${relation_depth}` +
      dynamicFilterPropertiesAdderAndAddParameterKey(
        relation_filters,
        FilterPropertiesType.RELATION
      ) +
      `]->(n)`;
      if (
        parentExcludedLabelsWithoutEmptyString &&
        parentExcludedLabelsWithoutEmptyString.length > 0
      ) {
        query =
          query +
          " where " +
          dynamicNotLabelAdder("m", parentExcludedLabelsWithoutEmptyString) +
          ` return m as parent,n as children`;
      } else {
        query = query + ` return m as parent,n as children`;
      }

      relation_filters = changeObjectKeyName(relation_filters);
      const parameters = { ...node_filters, ...parent_filters, ...relation_filters };
         

      const res = await this.read(query, parameters, databaseOrTransaction);
      if (!res || !res["records"] || res["records"].length == 0) {
        return [];
        //throw new HttpException(parent_of_child_not_found, 404);
      }
      return res["records"];
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

  async findChildrensByIdAndNotLabelsAndChildrenIdsAndLabels(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    root_exculuded_labels: string[] = [""],
    idsLabels: object[] ,
    children_filters: object = {},
    children_excluded_labels: string[] = [""],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "",
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

     

      let idLabelCondition = ` and ((id(m) = ${idsLabels[0]['identifier']} and  m:${idsLabels[0]['label']}) `    ;
      idsLabels.forEach((item) => {
        if (item['identifier'] !=idsLabels[0]['identifier']) {
          idLabelCondition = idLabelCondition + ` or (id(m) = ${item['identifier']} and m:${item['label']}) `    ;
        }

      });
      idLabelCondition = idLabelCondition + ') ';  
      cypher = cypher + idLabelCondition;


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

  // async getParentByIdsLabelsAndFiltersWithExcludedLabelsAndParentIds(
  //   idsLabels: object[],
  //   node_filters: object = {},
  //   parent_labels: string[] = [""],
  //   parent_filters: object = {},
  //   parent_excluded_labels: string[] = [""],
  //   parentIds: string[] = [""],
  //   relation_name: string,
  //   relation_filters,
  //   relation_depth?: number | "",
  //   databaseOrTransaction?: string
  // ) {
  //   try {

  //     const parentLabelsWithoutEmptyString =
  //       filterArrayForEmptyString(parent_labels);
  //     const parentExcludedLabelsWithoutEmptyString = filterArrayForEmptyString(
  //       parent_excluded_labels
  //     );
  //     // const node = await this.findByIdAndFilters(
  //     //   +id,
  //     //   node_labels,
  //     //   node_filters
  //     // );
  //     let idLabelCondition = ` ((id(n) = ${idsLabels[0]['identifier']} and  n:${idsLabels[0]['label']}) `    ;
  //     idsLabels.forEach((item) => {
  //       if (item['identifier'] !=idsLabels[0]['identifier']) {
  //         idLabelCondition = idLabelCondition + ` or (id(n) = ${item['identifier']} and n:${item['label']}) `    ;
  //       }
  //     });
  //     idLabelCondition = idLabelCondition + ') ';   


  //     let parentIdsCondition = "";
  //     if (parentIds.length > 0) {
  //       parentIdsCondition = ` ((id(n) = ${parentIds[0]}) `    ;
  //       parentIds.forEach((item) => {
  //         if (item != parentIds[0]) {
  //           parentIdsCondition = parentIdsCondition + ` or (id(n) = ${item} ) `    ;
  //         }
  //       });
  //       parentIdsCondition = parentIdsCondition + ') ';  
  //     }
     





      
  //     let query =
  //     `MATCH (n ` + dynamicFilterPropertiesAdder(node_filters) +
  //     ` where ${idLabelCondition} and ${parentIdsCondition} ` +
  //     ` match(m` +
  //     dynamicLabelAdder(parentLabelsWithoutEmptyString) +
  //     dynamicFilterPropertiesAdder(parent_filters) +
  //     ` match (m)-` +
  //     `[r:${relation_name}*1..${relation_depth}` +
  //     dynamicFilterPropertiesAdderAndAddParameterKey(
  //       relation_filters,
  //       FilterPropertiesType.RELATION
  //     ) +
  //     `]->(n)`;


     
  //     if (
  //       parentExcludedLabelsWithoutEmptyString &&
  //       parentExcludedLabelsWithoutEmptyString.length > 0
  //     ) {
  //       query =
  //         query +
  //         " where " +
  //         dynamicNotLabelAdder("m", parentExcludedLabelsWithoutEmptyString) +
  //         ` return m as parent,n as children`;
  //     } else {
  //       query = query + ` return m as parent,n as children`;
  //     }

  //     relation_filters = changeObjectKeyName(relation_filters);
  //     const parameters = { ...node_filters, ...parent_filters, ...relation_filters };
    

  //     const res = await this.read(query, parameters, databaseOrTransaction);
  //     if (!res || !res["records"] || res["records"].length == 0) {
  //       return [];
  //       //throw new HttpException(parent_of_child_not_found, 404);
  //     }
  //     return res["records"];
  //   } catch (error) {
  //     if (error.response?.code) {
  //       throw new HttpException(
  //         { message: error.response.message, code: error.response.code },
  //         error.status
  //       );
  //     } else {
  //       throw new HttpException(
  //         "library_server_error",
  //         HttpStatus.INTERNAL_SERVER_ERROR
  //       );
  //     }
  //   }
  // }

  async findChildrensByIdAndNotLabelsAndChildrenIds(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    root_exculuded_labels: string[] = [""],
    children_labels: Array<string> = [""],
    children_filters: object = {},
    children_excluded_labels: string[] = [""],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "",
    childrenIds,
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

      const childrenIdsWithoutEmptyString =
        filterArrayForEmptyString(childrenIds);

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

      if (childrenIdsWithoutEmptyString.length > 0) {
        let childrenIdsCondition = ` and (id(m) = ${childrenIdsWithoutEmptyString[0]} `;
        childrenIdsWithoutEmptyString.forEach((item) => {
          if (item !=childrenIdsWithoutEmptyString[0]) {
            childrenIdsCondition = childrenIdsCondition + ` or id(m) = ${item} `    ;
          }
        });
        childrenIdsCondition = childrenIdsCondition + ') ';  
        cypher =
          cypher + childrenIdsCondition;
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


  async findChildOfParentByParentIdAndChildIdWithFilters(
    root_id: number,
    root_labels: string[] = [],
    root_filters: object = {},
    child_id: number,
    child_labels: string[] = [],
    child_filters: object = {},
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "",
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      if (!relation_name) {
        throw new HttpException(required_fields_must_entered, 404);
      }
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(child_labels);

      let parameters = { root_id,child_id, ...root_filters };
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
          child_filters,
          FilterPropertiesType.NODE,
          "3"
        ) +
        `  WHERE  id(n) = $root_id and id(m)=$child_id RETURN n as parent,m as children, r as relation`;
      relation_filters = changeObjectKeyName(relation_filters, "2");
      child_filters = changeObjectKeyName(child_filters, "3");
      parameters = { ...parameters, ...child_filters, ...relation_filters };

       
         

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

  async findChildOfParentByParentIdAndChildIdWithFiltersAndRelationArray(
    root_id: number,
    root_labels: string[] = [],
    root_filters: object = {},
    child_id: number,
    child_labels: string[] = [],
    child_filters: object = {},
    relation_names: string[],
    relation_filters: object = {},
    relation_depth: number | "",
    databaseOrTransaction?: string | Transaction
  ) {
    try {
      if (!relation_names) {
        throw new HttpException(required_fields_must_entered, 404);
      }
      const rootLabelsWithoutEmptyString =
        filterArrayForEmptyString(root_labels);
      const childrenLabelsWithoutEmptyString =
        filterArrayForEmptyString(child_labels);

      let parameters = { root_id,child_id, ...root_filters };
      let cypher;
      let response;

      cypher =
        `MATCH p=(n` +
        dynamicLabelAdder(rootLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdder(root_filters) +
        `-[r:${await this.relationArray(relation_names)}*1..${relation_depth}` +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          relation_filters,
          FilterPropertiesType.RELATION,
          "2"
        ) +
        ` ]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          child_filters,
          FilterPropertiesType.NODE,
          "3"
        ) +
        `  WHERE  id(n) = $root_id and id(m)=$child_id RETURN n as parent,m as children, r as relation`;
      relation_filters = changeObjectKeyName(relation_filters, "2");
      child_filters = changeObjectKeyName(child_filters, "3");
      parameters = { ...parameters, ...child_filters, ...relation_filters };

       
         

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

  async sortByParentIdAndChildrenFiltersWithCreatedAtOrUpdatedAt(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    children_labels: string[] = [],
    children_filters: object = {},
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "",
    sortProperty:'createdAt' | 'updatedAt' = 'createdAt',
    afterThisDate:string,
    beforeThisDate?:string,
    orderBy: 'DESC' | 'ASC' = 'DESC',
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


        `  WHERE  id(n) = $root_id and ${await this.sortCondition(sortProperty,beforeThisDate,afterThisDate)}  RETURN n as parent,m as children, r as relation ORDER BY  m.${sortProperty}  ${orderBy}`
      
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


  async sortByParentFiltersAndChildrenFiltersWithCreatedAtOrUpdatedAt(
    root_labels: string[] = [],
    root_filters: object = {},
    children_labels: string[] = [],
    children_filters: object = {},
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "",
    sortProperty:'createdAt' | 'updatedAt' = 'createdAt',
    afterThisDate:string,
    beforeThisDate?:string,
    orderBy: 'DESC' | 'ASC' = 'DESC',
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
        dynamicFilterPropertiesAdderAndAddParameterKey(
          relation_filters,
          FilterPropertiesType.RELATION,
          "2"
        ) +
        ` ]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(children_filters) +
        ` WHERE ${await this.sortCondition(sortProperty,beforeThisDate,afterThisDate)}`+
        ` RETURN n as parent,m as children,r as relation ORDER BY  m.${sortProperty}  ${orderBy}`;

      children_filters = changeObjectKeyName(children_filters);
      relation_filters = changeObjectKeyName(relation_filters, "2");
      const parameters = {
        ...root_filters,
        ...children_filters,
        ...relation_filters,
      };
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


  async sortCondition(sortProperty:'createdAt' | 'updatedAt',
    beforeThisDate?:string,
    afterThisDate?:string){

      if(sortProperty == 'createdAt'){

        if(!beforeThisDate && afterThisDate){

          return `'${afterThisDate}' < m.${sortProperty}`
        }
        else if(beforeThisDate && !afterThisDate){
          return  `m.${sortProperty} < '${beforeThisDate}'`
        }
        else if(afterThisDate && beforeThisDate){
          return `'${afterThisDate}' < m.${sortProperty} < '${beforeThisDate}'`
        }
        
      }
      else if(sortProperty == 'updatedAt'){
        if(!beforeThisDate && afterThisDate){

          return `'${afterThisDate}' < m.${sortProperty}`
        }
        else if(beforeThisDate && !afterThisDate){
          return  `m.${sortProperty} < '${beforeThisDate}'`
        }
        else if(afterThisDate && beforeThisDate){
          return `'${afterThisDate}' < m.${sortProperty} < '${beforeThisDate}'`
        }

      }
  }


 async getCountOfNodesByLabelsAndFilters(
    root_labels: string[] = [],
    root_filters: object = {},
    children_labels: string[] = [],
    children_filters: object = {},
    relation_name: string="*",
    relation_filters: object = {},
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
        `-[${relation_name}` +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          relation_filters,
          FilterPropertiesType.RELATION,
          "2"
        ) +
        ` ]->(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(children_filters) +
        ` RETURN Count(m);`;

      children_filters = changeObjectKeyName(children_filters);
      relation_filters = changeObjectKeyName(relation_filters, "2");
      const parameters = {
        ...root_filters,
        ...children_filters,
        ...relation_filters,
      };
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
  async findChildrensByIdAndNotLabelsAndOrChildrenLabels(
    root_id: number,
    root_labels: string[] = [""],
    root_filters: object = {},
    root_exculuded_labels: string[] = [""],
    children_labels: Array<string> = [""],
    children_filters: object = {},
    children_excluded_labels: string[] = [""],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "",
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
      let   childrenLabelsCondition = "";
      if (childrenLabelsWithoutEmptyString.length > 0) {
        childrenLabelsCondition = childrenLabelsCondition + ` and ( m:${childrenLabelsWithoutEmptyString[0]} `;
     
      childrenLabelsWithoutEmptyString.map((item) => {
        if (item != childrenLabelsWithoutEmptyString[0]) {
          childrenLabelsCondition = childrenLabelsCondition + ` or m:${item} `;
        }
      });
      childrenLabelsCondition = childrenLabelsCondition + ') ';
      }
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
      cypher =  cypher +childrenLabelsCondition;
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

  async findChildrensByLabelAndFiltersWithPagination(
    root_labels: string[] = [""],
    root_filters: object = {},
    root_exculuded_labels: string[] = [""],
    children_labels: Array<string> = [],
    children_filters: object = {},
    children_exculuded_labels: string[] = [""],
    relation_name: string,
    relation_filters: object = {},
    relation_depth: number | "",
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
      let parameters = {  ...queryObject };
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
        ` ]-(m` +
        dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
        dynamicFilterPropertiesAdderAndAddParameterKey(
          children_filters,
          FilterPropertiesType.NODE,
          "3"
        ) 
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
      cypher = cypher + ` RETURN n as parent,m as children, r as relation `;
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
      parameters = {
        ...parameters,
        ...children_filters,
        ...relation_filters,
        ...root_filters,
      };
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


  async findParentsOfChildrenByIdAndFilters(
    root_filters: object = {},
    children_id:string,
    children_labels: string[] = [],
    children_filters: object = {},
    relation_name: string,
    relation_filters:object = {}
  ) {
    try {
      if (!relation_name) {
        throw new HttpException(required_fields_must_entered, 404);
      }
      const parentsId=[]
  
      let parameters = { ...root_filters };
    const childrenLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_labels);
  
      let cypher;
      let response;
  
      cypher = `MATCH (n:${childrenLabelsWithoutEmptyString} ${ dynamicFilterPropertiesAdderAndAddParameterKey(
        children_filters,
        FilterPropertiesType.NODE,
        "3"
      )} WITH n, [(n)<-[:${relation_name}* ${dynamicFilterPropertiesAdderAndAddParameterKey(
        relation_filters,
        FilterPropertiesType.RELATION,
        "2"
      )}]-(x ${dynamicFilterPropertiesAdder(root_filters)} | x] as parents where id(n)=${children_id} RETURN  parents;`
  
  
      relation_filters = changeObjectKeyName(relation_filters, "2");
        children_filters = changeObjectKeyName(children_filters, "3");
        parameters = { ...parameters, ...children_filters, ...relation_filters };
      response = await this.read(cypher,parameters);
  
      const parents=response["records"][0]['_fields'][0]
  
       for (let index = 0; index < parents.length; index++) {
       
        if(parents[index]['labels']!='Root'){
          let value=parents[index].identity.low.toString();
          parentsId.push(value);
        }
    
       }
  
       return parentsId;
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
    async findChildrensByIdWithLimitedChilderenIdsAndFiltersWithPaginationAndSearcStringBySpecificColumn(
      root_id: number,
      root_labels: string[] = [""],
      root_filters: object = {},
      children_labels: string[],
      children_filters: object = {},
      children_exculuded_labels: string[],
      relation_name: string,
      relation_filters: object = {},
      relation_depth: number | "",
      queryObject: queryObjectType,
      searchColumn: string,
      searchString: string,
      search_type: SearchType = SearchType.CONTAINS,
      idArray:number[],
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
          `  WHERE  id(n) = $root_id and id(m) in [${idArray}] and `;
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
  
  
    async findChildrensByIdWithLimitedChilderenIdsAndFiltersWithPaginationAndSearcString(
      root_id: number,
      root_labels: string[],
      root_filters: object = {},
      children_labels: string[],
      children_filters: object = {},
      children_exculuded_labels: string[],
      relation_name: string,
      relation_filters: object = {},
      relation_depth: number | "",
      queryObject: queryObjectType,
      searchString: string,
      idArray:number[],
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
          `  WHERE  id(n) = $root_id and id(m) in [${idArray}] and `;
        if (childrenExcludedLabelsLabelsWithoutEmptyString.length > 0) {
          cypher =
            cypher +
            dynamicNotLabelAdder(
              "m",
              childrenExcludedLabelsLabelsWithoutEmptyString
            ) +
            ` and (any(prop in keys(m) where (m[prop]=~ $searchString and prop <> 'key'))) or ('${searchString}' IN m.tag)` +
            `RETURN n as parent,m as children,r as relation `;
        } else {
          cypher =
            cypher +
            `(any(prop in keys(m) where (m[prop]=~ $searchString and prop <> 'key'))) or ('${searchString}' IN m.tag) ` +
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
        console.log('cyper',cypher);
        
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
  
    async findChildrensByIdAndFiltersWithLimitedChilderenIdsBySearcStringBySpecificColumnTotalCount(
      root_id: number,
      root_labels: string[] = [""],
      root_filters: object = {},
      children_labels: string[],
      children_filters: object = {},
      children_exculuded_labels: string[],
      relation_name: string,
      relation_filters: object = {},
      relation_depth: number | "",
      search_column: string,
      search_string: string,
      search_type: SearchType = SearchType.CONTAINS,
      idArray:number[],
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
          `  WHERE  id(n) = $root_id and id(m) in [${idArray}] and `;
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
  
    async findChildrensByIdAndFiltersWithLimitedChilderenIdsAndSearchStringsTotalCount(
      root_id: number,
      root_labels: string[],
      root_filters: object = {},
      children_labels: string[],
      children_filters: object = {},
      children_exculuded_labels: string[],
      relation_name: string,
      relation_filters: object = {},
      relation_depth: number | "",
      search_string: string,
      idArray:number[],
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
          `  WHERE  id(n) = $root_id and id(m) in [${idArray}] and `;
        if (childrenExcludedLabelsLabelsWithoutEmptyString.length > 0) {
          cypher =
            cypher +
            dynamicNotLabelAdder(
              "m",
              childrenExcludedLabelsLabelsWithoutEmptyString
            ) +
            ` and (any(prop in keys(m) where (m[prop]=~ $searchString and prop <> 'key'))) or ('${search_string}' IN m.tag)` +
            `RETURN count(m) as count  `;
        } else {
          cypher =
            cypher +
            `(any(prop in keys(m) where (m[prop]=~ $searchString and prop <> 'key'))) or ('${search_string}' IN m.tag)` +
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
    async findChildrensByIdAndChildOrLabelWithLimitedChilderenIdsAndFiltersWithPaginationAndSearcString(
      root_id: number,
      root_labels: string[] = [''],
      root_filters: object = {},
      children_labels: Array<string> = [''],
      children_filters: object = {},
      children_or_labels: string[] = [''],
      relation_name: string,
      relation_filters: object = {},
      relation_depth: number | '',
      queryObject: queryObjectType,
      searchString: string,
      idArray:number[],
      databaseOrTransaction?: string
    ) {
      try {
        if (!relation_name) {
          throw new HttpException(required_fields_must_entered, 404);
        }
        const childrenOrLabelsLabelsWithoutEmptyString = filterArrayForEmptyString(children_or_labels);
        const rootLabelsWithoutEmptyString = filterArrayForEmptyString(root_labels);
        const childrenLabelsWithoutEmptyString = filterArrayForEmptyString(children_labels);
  
        let parameters = { root_id, ...queryObject, ...root_filters };
    
        parameters["searchString"] = `(?i).*${searchString}.*`;
        parameters.skip = this.int(+queryObject.skip) as unknown as number;
        parameters.limit = this.int(+queryObject.limit) as unknown as number;
        let cypher;
        let response;
  
        cypher =
          `MATCH (n` +
          dynamicLabelAdder(rootLabelsWithoutEmptyString) +
          dynamicFilterPropertiesAdder(root_filters) +
          ` WHERE  id(n)=$root_id `;
  
        cypher =
          cypher +
          `MATCH (m` +
          dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
          dynamicFilterPropertiesAdderAndAddParameterKey(children_filters, FilterPropertiesType.NODE, '3') +
          ` WHERE id(m) in [${idArray}] and (`
        if (childrenOrLabelsLabelsWithoutEmptyString && childrenOrLabelsLabelsWithoutEmptyString.length > 0) {
          cypher = cypher + dynamicOrLabelAdder('m', childrenOrLabelsLabelsWithoutEmptyString);
        }
        cypher=cypher+  `) and (any(prop in keys(m) where (m[prop]=~ $searchString and prop <> 'key'))) or ('${searchString}' IN m.tag)`
        cypher=cypher+' match(n)' +
  
          `-[r:${relation_name}*1..${relation_depth} ` +
          dynamicFilterPropertiesAdderAndAddParameterKey(relation_filters, FilterPropertiesType.RELATION, '2') +
          `]->(m)`;
  
        cypher = cypher + ` RETURN n as parent,m as children, r as relation`;
        if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
          cypher =
            cypher +
            dynamicOrderByColumnAdder("m", queryObject.orderByColumn) +
            ` ${queryObject.orderBy} SKIP $skip LIMIT $limit  `;
        } else {
          cypher = cypher + ` SKIP $skip LIMIT $limit `;
        }
        relation_filters = changeObjectKeyName(relation_filters, '2');
        children_filters = changeObjectKeyName(children_filters, '3');
        parameters = { ...parameters, ...children_filters, ...relation_filters };
  console.log('cypher',cypher);
  
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
    async findChildrensByIdAndChildOrLabelWithLimitedChilderenIdsAndFiltersWithPaginationAndSearcStringTotalCount(
      root_id: number,
      root_labels: string[] = [''],
      root_filters: object = {},
      children_labels: Array<string> = [''],
      children_filters: object = {},
      children_or_labels: string[] = [''],
      relation_name: string,
      relation_filters: object = {},
      relation_depth: number | '',
      searchString: string,
      idArray:number[],
      databaseOrTransaction?: string
    ) {
      try {
        if (!relation_name) {
          throw new HttpException(required_fields_must_entered, 404);
        }
        const childrenOrLabelsLabelsWithoutEmptyString = filterArrayForEmptyString(children_or_labels);
        const rootLabelsWithoutEmptyString = filterArrayForEmptyString(root_labels);
        const childrenLabelsWithoutEmptyString = filterArrayForEmptyString(children_labels);
  
        let parameters = { root_id, ...root_filters };
    
        parameters["searchString"] = `(?i).*${searchString}.*`;
        
        let cypher;
        let response;
  
        cypher =
          `MATCH (n` +
          dynamicLabelAdder(rootLabelsWithoutEmptyString) +
          dynamicFilterPropertiesAdder(root_filters) +
          ` WHERE  id(n)=$root_id `;
  
        cypher =
          cypher +
          `MATCH (m` +
          dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
          dynamicFilterPropertiesAdderAndAddParameterKey(children_filters, FilterPropertiesType.NODE, '3') +
          ` WHERE id(m) in [${idArray}] and (`
        if (childrenOrLabelsLabelsWithoutEmptyString && childrenOrLabelsLabelsWithoutEmptyString.length > 0) {
          cypher = cypher + dynamicOrLabelAdder('m', childrenOrLabelsLabelsWithoutEmptyString);
        }
        cypher=cypher+  `) and (any(prop in keys(m) where (m[prop]=~ $searchString and prop <> 'key'))) or ('${searchString}' IN m.tag)`
        cypher=cypher+' match(n)' +
  
          `-[r:${relation_name}*1..${relation_depth} ` +
          dynamicFilterPropertiesAdderAndAddParameterKey(relation_filters, FilterPropertiesType.RELATION, '2') +
          `]->(m)`;
  
        cypher = cypher + ` RETURN count(m) as count`;
      
        relation_filters = changeObjectKeyName(relation_filters, '2');
        children_filters = changeObjectKeyName(children_filters, '3');
        parameters = { ...parameters, ...children_filters, ...relation_filters };
  
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
    
    async findByIdAndFiltersWithoutError(
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
        return [];
      } else {
        return node.records[0]["_fields"][0];
      }
    }
    
    // async findParentsOfChildrenByIdAndFiltersWithExclutedLabels(
    //   root_filters: object = {},
      
    //   children_id:string,
    //   children_labels: string[] = [],
    //   children_filters: object = {},
    //   relation_name: string,
    //   excluted_relation_name:string,
    //   relation_filters:object = {}
    // ) {
    //   try {
    //     if (!relation_name) {
    //       throw new HttpException(required_fields_must_entered, 404);
    //     }
    //     const parentsId=[]
    
       
        
    //     let parameters = { ...root_filters };
    //   const childrenLabelsWithoutEmptyString =
    //     filterArrayForEmptyString(children_labels);
    
    //     let cypher;
    //     let response;
    
    //     cypher = `MATCH (n:${childrenLabelsWithoutEmptyString} ${ dynamicFilterPropertiesAdderAndAddParameterKey(
    //       children_filters,
    //       FilterPropertiesType.NODE,
    //       "3"
    //     )} WITH n, [(n)<-[:${relation_name} ${dynamicFilterPropertiesAdderAndAddParameterKey(
    //       relation_filters,
    //       FilterPropertiesType.RELATION,
    //       "2"
    //     )}]-(x ${dynamicFilterPropertiesAdder(root_filters)} | x] as parents where id(n)=${children_id} and NONE(rel in r Where type(rel)=${excluted_relation_name} ) RETURN  parents;`
    
    
    //     relation_filters = changeObjectKeyName(relation_filters, "2");
    //       children_filters = changeObjectKeyName(children_filters, "3");
    //       parameters = { ...parameters, ...children_filters, ...relation_filters };
    //     response = await this.read(cypher,parameters);
    
    //     const parents=response["records"][0]['_fields'][0]
    
    //      for (let index = 0; index < parents.length; index++) {
         
    //       if(parents[index]['labels']!='Root'){
    //         let value=parents[index].identity.low.toString();
    //         parentsId.push(value);
    //       }
      
    //      }
    
    //      return parentsId;
    //   } catch (error) {
    //     if (error.response?.code) {
    //       throw new HttpException(
    //         { message: error.response?.message, code: error.response?.code },
    //         error.status
    //       );
    //     } else {
    //       throw new HttpException(error, 500);
    //     }
    //   }
    //   }


      async getWintegrationHistory(
        root_id:string,
        root_labels: string[] = [],
        root_filters: object = {},
        child_id:string,
        children_labels: string[] = [],
        children_filters: object = {},
        excluted_relation_name:string,
        relation_filters: object = {},
        sortProperty:'createdAt' | 'updatedAt' = 'createdAt',
        orderBy: 'DESC' | 'ASC' = 'DESC'
      ) {
        try {
          const rootLabelsWithoutEmptyString =
            filterArrayForEmptyString(root_labels);
          const childrenLabelsWithoutEmptyString =
            filterArrayForEmptyString(children_labels);
    
          const cypher =
            `MATCH p=(n` +
            dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdder(children_filters) +
            `<-[r` +
            dynamicFilterPropertiesAdderAndAddParameterKey(
              relation_filters,
              FilterPropertiesType.RELATION,
              "2"
            ) +
            `]-(m` +
            dynamicLabelAdder(rootLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdderAndAddParameterKey(root_filters) +
            `WHERE ALL( rel in relationships(p) WHERE type(rel)<>"${excluted_relation_name}")`+
            ` AND id(n)=${child_id} AND id(m)<>${root_id}`+
            ` RETURN n,m ORDER BY  m.${sortProperty}  ${orderBy}`;
    
          children_filters = changeObjectKeyName(children_filters);
          relation_filters = changeObjectKeyName(relation_filters, "2");
          const parameters = {
            ...root_filters,
            ...children_filters,
            ...relation_filters,
          };
          const result = await this.read(cypher, parameters);
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

      async getWintegrationHistoryV2(
        root_id:string,
        root_labels: string[] = [],
        root_filters: object = {},
        child_id:string,
        children_labels: string[] = [],
        children_filters: object = {},
        excluted_relation_name:string,
        relation_filters: object = {},
        sortProperty:'createdAt' | 'updatedAt' = 'createdAt',
        orderBy: 'DESC' | 'ASC' = 'DESC'
      ) {
        try {
          const rootLabelsWithoutEmptyString =
            filterArrayForEmptyString(root_labels);
          const childrenLabelsWithoutEmptyString =
            filterArrayForEmptyString(children_labels);
    
          const cypher =
            `MATCH p=(n` +
            dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdder(children_filters) +
            `<-[:PARENT_OF` +
            dynamicFilterPropertiesAdderAndAddParameterKey(
              relation_filters,
              FilterPropertiesType.RELATION,
              "2"
            ) +
            `]-(m` +
            dynamicLabelAdder(rootLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdderAndAddParameterKey(root_filters) +
            `WHERE  id(n)=${child_id}`+
            ` RETURN m ORDER BY  m.${sortProperty}  ${orderBy}`;
    
          children_filters = changeObjectKeyName(children_filters);
          relation_filters = changeObjectKeyName(relation_filters, "2");
          const parameters = {
            ...root_filters,
            ...children_filters,
            ...relation_filters,
          };
          const result = await this.read(cypher, parameters);
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

      async findChildrensByIdAndFiltersWithChildrenOfChildrensCriteriaAndPagination(
        main_root_id: string,
        main_root_labels: string[] = [""],
        main_root_filters: object = {},
        main_relation_name: string,
        main_relation_filters: object = {},
        main_relation_depth: number | "",
        root_labels: string[] = [""],
        root_filters: object = {},
        root_exculuded_labels: string[] = [""],
        children_labels: Array<string> = [],
        children_filters: object = {},
        children_exculuded_labels: string[] = [""],
        children_children_labels: Array<string> = [],
        children_children_filters: object = {},
        children_children_exculuded_labels: string[] = [""],
        relation_name: string,
        relation_filters: object = {},
        relation_depth: number | "",
        relation_name_child: string,
        relation_filters_child: object = {},
        relation_depth_child: number | "",
        queryObject: queryObjectType,
        isCount: boolean = false,
        databaseOrTransaction?: string
      ) {
        try {
          if (!relation_name) {
            throw new HttpException("required_fields_must_entered", 404);
          }
          const mainRootLabelsWithoutEmptyString =
            filterArrayForEmptyString(main_root_labels);
          const rootLabelsWithoutEmptyString =
            filterArrayForEmptyString(root_labels);
          const childrenLabelsWithoutEmptyString =
            filterArrayForEmptyString(children_labels);
          const childrenChildrenLabelsWithoutEmptyString =
            filterArrayForEmptyString(children_children_labels);  
          const rootExcludedLabelsWithoutEmptyString = filterArrayForEmptyString(
            root_exculuded_labels
          );
          const childrenExcludedLabelsLabelsWithoutEmptyString =
            filterArrayForEmptyString(children_exculuded_labels);
          const childrenChildrenExcludedLabelsLabelsWithoutEmptyString =
            filterArrayForEmptyString(children_children_exculuded_labels);  
          let parameters = {  ...queryObject };
          parameters.skip = int(+queryObject.skip) as unknown as number;
          parameters.limit = int(+queryObject.limit) as unknown as number;
      
           let cypher;
           let response;
      
           let relation_filters_child_parametric = {};
      
           Object.entries(relation_filters_child).forEach((element, index) => {
           
            if (typeof element[1] != 'object') {
                relation_filters_child_parametric[element[0]] = element[1];
            }
           });
      
      
          cypher =
          `MATCH p=(w` +
          dynamicLabelAdder(mainRootLabelsWithoutEmptyString) +
          dynamicFilterPropertiesAdderAndAddParameterKeyNew(
            main_root_filters,
            FilterPropertiesType.NODE,
            "9"
          )+
          `-[h:${main_relation_name}*1..${main_relation_depth} ` +
          dynamicFilterPropertiesAdderAndAddParameterKeyNew(
            main_relation_filters,
            FilterPropertiesType.RELATION,
            "8"
          ) +
            ` ]->(n` +
            dynamicLabelAdder(rootLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdder(root_filters) +
            `-[r:${relation_name}*1..${relation_depth}` +
            dynamicFilterPropertiesAdderAndAddParameterKeyNew(
              relation_filters,
              FilterPropertiesType.RELATION,
              "2"
            ) +
            ` ]->(m` +
            dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdderAndAddParameterKeyNew(
              children_filters,
              FilterPropertiesType.NODE,
              "3"
            )+
            `-[t:${relation_name_child}*1..${relation_depth_child}` + 
            //child_child_filter +
      
            dynamicFilterPropertiesAdderAndAddParameterKeyNew(
              relation_filters_child,
              FilterPropertiesType.RELATION,
              "4"
            )+
            ` ]->(k` +
            dynamicLabelAdder(childrenChildrenLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdderAndAddParameterKeyNew(
              children_children_filters,
              FilterPropertiesType.NODE,
              "5"
            )
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
          if (
            childrenChildrenExcludedLabelsLabelsWithoutEmptyString &&
            childrenChildrenExcludedLabelsLabelsWithoutEmptyString.length > 0
          ) {
            cypher =
              cypher +
              " and " +
              dynamicNotLabelAdder(
                "m",
                childrenChildrenExcludedLabelsLabelsWithoutEmptyString
              );
          }
          if (isCount) {
            cypher = cypher + ` where id(w) = ${main_root_id}  RETURN count(m) as totalCount `;
          }
          else {
            cypher = cypher + ` where id(w) = ${main_root_id}  RETURN n as parent,m as children, r as relation , count(n) as count `;
          }
          
          if (!isCount) {
            if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
              cypher =
                cypher +
                dynamicOrderByColumnAdder("n", queryObject.orderByColumn) +
                ` ${queryObject.orderBy} SKIP $skip LIMIT $limit  `;
            } else {
              cypher = cypher + ` SKIP $skip LIMIT $limit `;
            } 
          }
          
      
          relation_filters = changeObjectKeyName(relation_filters, "2");
          children_filters = changeObjectKeyName(children_filters, "3");
          relation_filters_child = changeObjectKeyName(relation_filters_child_parametric, "4");
          children_children_filters = changeObjectKeyName(children_children_filters, "5");
          main_root_filters = changeObjectKeyName(main_root_filters, "9");
          main_relation_filters= changeObjectKeyName(main_relation_filters, "8");
      
          parameters = {
            ...parameters,
            ...children_children_filters,
            ...relation_filters_child,
            ...children_filters,
            ...relation_filters,
            ...root_filters,
            ...main_root_filters,
            ...main_relation_filters
          };
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
      async findChildrensByLabelAndFiltersWithChildrenOfChildrensCriteriaAndPagination(
        root_labels: string[] = [""],
        root_filters: object = {},
        root_exculuded_labels: string[] = [""],
        children_labels: Array<string> = [],
        children_filters: object = {},
        children_exculuded_labels: string[] = [""],
        children_children_labels: Array<string> = [],
        children_children_filters: object = {},
        children_children_exculuded_labels: string[] = [""],
        relation_name: string,
        relation_filters: object = {},
        relation_depth: number | "",
        relation_name_child: string,
        relation_filters_child: object = {},
        relation_depth_child: number | "",
        queryObject: queryObjectType,
        isCount: boolean = false,
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
          const childrenChildrenLabelsWithoutEmptyString =
            filterArrayForEmptyString(children_children_labels);  
          const rootExcludedLabelsWithoutEmptyString = filterArrayForEmptyString(
            root_exculuded_labels
          );
          const childrenExcludedLabelsLabelsWithoutEmptyString =
            filterArrayForEmptyString(children_exculuded_labels);
          const childrenChildrenExcludedLabelsLabelsWithoutEmptyString =
            filterArrayForEmptyString(children_children_exculuded_labels);  
          let parameters = {  ...queryObject };
          parameters.skip = int(+queryObject.skip) as unknown as number;
          parameters.limit = int(+queryObject.limit) as unknown as number;
      
           let cypher;
           let response;
      
           let relation_filters_child_parametric = {};
      
           Object.entries(relation_filters_child).forEach((element, index) => {
           
            if (typeof element[1] != 'object') {
                relation_filters_child_parametric[element[0]] = element[1];
            }
           });
      
      
          cypher =
            `MATCH p=(n` +
            dynamicLabelAdder(rootLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdder(root_filters) +
            `-[r:${relation_name}*1..${relation_depth}` +
            dynamicFilterPropertiesAdderAndAddParameterKeyNew(
              relation_filters,
              FilterPropertiesType.RELATION,
              "2"
            ) +
            ` ]->(m` +
            dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdderAndAddParameterKeyNew(
              children_filters,
              FilterPropertiesType.NODE,
              "3"
            )+
            `-[t:${relation_name_child}*1..${relation_depth_child}` + 
            //child_child_filter +
      
            dynamicFilterPropertiesAdderAndAddParameterKeyNew(
              relation_filters_child,
              FilterPropertiesType.RELATION,
              "4"
            )+
            ` ]->(k` +
            dynamicLabelAdder(childrenChildrenLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdderAndAddParameterKeyNew(
              children_children_filters,
              FilterPropertiesType.NODE,
              "5"
            )
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
          if (
            childrenChildrenExcludedLabelsLabelsWithoutEmptyString &&
            childrenChildrenExcludedLabelsLabelsWithoutEmptyString.length > 0
          ) {
            cypher =
              cypher +
              " and " +
              dynamicNotLabelAdder(
                "m",
                childrenChildrenExcludedLabelsLabelsWithoutEmptyString
              );
          }
          if (isCount) {
            cypher = cypher + ` RETURN count(m) as totalCount `;
          }
          else {
            cypher = cypher + ` RETURN n as parent,m as children, r as relation, count(n) as count `;
          }
          if (!isCount) {
            if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
              cypher =
                cypher +
                dynamicOrderByColumnAdder("n", queryObject.orderByColumn) +
                ` ${queryObject.orderBy} SKIP $skip LIMIT $limit  `;
            } else {
              cypher = cypher + ` SKIP $skip LIMIT $limit `;
            }
          }

         
      
          relation_filters = changeObjectKeyName(relation_filters, "2");
          children_filters = changeObjectKeyName(children_filters, "3");
          relation_filters_child = changeObjectKeyName(relation_filters_child_parametric, "4");
          children_children_filters = changeObjectKeyName(children_children_filters, "5");
      
          parameters = {
            ...parameters,
            ...children_children_filters,
            ...relation_filters_child,
            ...children_filters,
            ...relation_filters,
            ...root_filters,
          };
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

      async findChildrensByLabelAndFiltersWithChildrenOfChildrensCriteria4AndPagination(
        root_labels: string[] = [""],
        root_filters: object = {},
        root_exculuded_labels: string[] = [""],
        children_labels: Array<string> = [],
        children_filters: object = {},
        children_exculuded_labels: string[] = [""],
        children_children_labels: Array<string> = [],
        children_children_filters: object = {},
        children_children_exculuded_labels: string[] = [""],
        children_children_children_labels: Array<string> = [],
        children_children_children_filters: object = {},
        children_children_children_exculuded_labels: string[] = [""],
        relation_name: string,
        relation_filters: object = {},
        relation_depth: number | "",
        relation_name_child: string,
        relation_filters_child: object = {},
        relation_depth_child: number | "",
        relation_name_child_child: string,
        relation_filters_child_child: object = {},
        relation_depth_child_child: number | "",
        queryObject: queryObjectType,
        isCount: boolean = false,
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
          const childrenChildrenLabelsWithoutEmptyString =
            filterArrayForEmptyString(children_children_labels);  
          const childrenChildrenChildrenLabelsWithoutEmptyString =
            filterArrayForEmptyString(children_children_children_labels);
      
          const rootExcludedLabelsWithoutEmptyString = filterArrayForEmptyString(
            root_exculuded_labels
          );
          const childrenExcludedLabelsLabelsWithoutEmptyString =
            filterArrayForEmptyString(children_exculuded_labels);
          const childrenChildrenExcludedLabelsLabelsWithoutEmptyString =
            filterArrayForEmptyString(children_children_exculuded_labels);  
          const childrenChildrenChildrenExcludedLabelsLabelsWithoutEmptyString =
            filterArrayForEmptyString(children_children_children_exculuded_labels);  
          let parameters = {  ...queryObject };
          parameters.skip = int(+queryObject.skip) as unknown as number;
          parameters.limit = int(+queryObject.limit) as unknown as number;
      
           let cypher;
           let response;
      
           let relation_filters_child_parametric = {};
      
           Object.entries(relation_filters_child).forEach((element, index) => {
           
            if (typeof element[1] != 'object') {
                relation_filters_child_parametric[element[0]] = element[1];
            }
           });
      
      
          cypher =
            `MATCH p=(n` +
            dynamicLabelAdder(rootLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdder(root_filters) +
            `-[r:${relation_name}*1..${relation_depth}` +
            dynamicFilterPropertiesAdderAndAddParameterKeyNew(
              relation_filters,
              FilterPropertiesType.RELATION,
              "2"
            ) +
            ` ]->(m` +
            dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdderAndAddParameterKeyNew(
              children_filters,
              FilterPropertiesType.NODE,
              "3"
            )+
            `-[t:${relation_name_child}*1..${relation_depth_child}` + 
            //child_child_filter +
      
            dynamicFilterPropertiesAdderAndAddParameterKeyNew(
              relation_filters_child,
              FilterPropertiesType.RELATION,
              "4"
            )+
            ` ]->(k` +
            dynamicLabelAdder(childrenChildrenLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdderAndAddParameterKeyNew(
              children_children_filters,
              FilterPropertiesType.NODE,
              "5"
            )
            +
            `-[u:${relation_name_child_child}*1..${relation_depth_child_child}` + 
            
            dynamicFilterPropertiesAdderAndAddParameterKeyNew(
              relation_filters_child_child,
              FilterPropertiesType.RELATION,
              "6"
            )+
            ` ]->(c` +
            dynamicLabelAdder(childrenChildrenChildrenLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdderAndAddParameterKeyNew(
              children_children_children_filters,
              FilterPropertiesType.NODE,
              "7"
            )
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
          if (
            childrenChildrenExcludedLabelsLabelsWithoutEmptyString &&
            childrenChildrenExcludedLabelsLabelsWithoutEmptyString.length > 0
          ) {
            cypher =
              cypher +
              " and " +
              dynamicNotLabelAdder(
                "k",
                childrenChildrenExcludedLabelsLabelsWithoutEmptyString
              );
          }
          if (
            childrenChildrenChildrenExcludedLabelsLabelsWithoutEmptyString &&
            childrenChildrenChildrenExcludedLabelsLabelsWithoutEmptyString.length > 0
          ) {
            cypher =
              cypher +
              " and " +
              dynamicNotLabelAdder(
                "c",
                childrenChildrenChildrenExcludedLabelsLabelsWithoutEmptyString
              );
          }
          if (isCount) {
            cypher = cypher + ` RETURN count(m) as totalCount `;
          }
          else {
            cypher = cypher + ` RETURN n as parent,m as children, r as relation, count(n) as count `;
          }
          if (!isCount) {
          if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
            cypher =
              cypher +
              dynamicOrderByColumnAdder("n", queryObject.orderByColumn) +
              ` ${queryObject.orderBy} SKIP $skip LIMIT $limit  `;
          } else {
            cypher = cypher + ` SKIP $skip LIMIT $limit `;
           }
          }
          relation_filters = changeObjectKeyName(relation_filters, "2");
          children_filters = changeObjectKeyName(children_filters, "3");
          relation_filters_child = changeObjectKeyName(relation_filters_child_parametric, "4");
          children_children_filters = changeObjectKeyName(children_children_filters, "5");
          relation_filters_child_child = changeObjectKeyName(relation_filters_child_child, "6");
          children_children_children_filters = changeObjectKeyName(children_children_children_filters, "7");
      
          parameters = {
            ...parameters,
            ...children_children_children_filters,
            ...relation_filters_child_child,
            ...children_children_filters,
            ...relation_filters_child,
            ...children_filters,
            ...relation_filters,
            ...root_filters,
          };
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
      
      
      async findChildrensByIdAndFiltersWithChildrenOfChildrensCriteria4AndPagination(
        main_root_id: string,
        main_root_labels: string[] = [""],
        main_root_filters: object = {},
        main_relation_name: string,
        main_relation_filters: object = {},
        main_relation_depth: number | "",
        root_labels: string[] = [""],
        root_filters: object = {},
        root_exculuded_labels: string[] = [""],
        children_labels: Array<string> = [],
        children_filters: object = {},
        children_exculuded_labels: string[] = [""],
        children_children_labels: Array<string> = [],
        children_children_filters: object = {},
        children_children_exculuded_labels: string[] = [""],
        children_children_children_labels: Array<string> = [],
        children_children_children_filters: object = {},
        children_children_children_exculuded_labels: string[] = [""],
        relation_name: string,
        relation_filters: object = {},
        relation_depth: number | "",
        relation_name_child: string,
        relation_filters_child: object = {},
        relation_depth_child: number | "",
        relation_name_child_child: string,
        relation_filters_child_child: object = {},
        relation_depth_child_child: number | "",
        queryObject: queryObjectType,
        isCount :  boolean =false,
        databaseOrTransaction?: string
      ) {
        try {
          if (!relation_name) {
            throw new HttpException("required_fields_must_entered", 404);
          }
          const mainRootLabelsWithoutEmptyString =
            filterArrayForEmptyString(main_root_labels);
          const rootLabelsWithoutEmptyString =
            filterArrayForEmptyString(root_labels);
          const childrenLabelsWithoutEmptyString =
            filterArrayForEmptyString(children_labels);
          const childrenChildrenLabelsWithoutEmptyString =
            filterArrayForEmptyString(children_children_labels);  
          const childrenChildrenChildrenLabelsWithoutEmptyString =
            filterArrayForEmptyString(children_children_children_labels); 
      
          const rootExcludedLabelsWithoutEmptyString = filterArrayForEmptyString(
            root_exculuded_labels
          );
          const childrenExcludedLabelsLabelsWithoutEmptyString =
            filterArrayForEmptyString(children_exculuded_labels);
          const childrenChildrenExcludedLabelsLabelsWithoutEmptyString =
            filterArrayForEmptyString(children_children_exculuded_labels);  
          const childrenChildrenChildrenExcludedLabelsLabelsWithoutEmptyString =
            filterArrayForEmptyString(children_children_children_exculuded_labels);  
      
          let parameters = {  ...queryObject };
          parameters.skip = int(+queryObject.skip) as unknown as number;
          parameters.limit = int(+queryObject.limit) as unknown as number;
      
           let cypher;
           let response;
      
           let relation_filters_child_parametric = {};
      
           Object.entries(relation_filters_child).forEach((element, index) => {
           
            if (typeof element[1] != 'object') {
                relation_filters_child_parametric[element[0]] = element[1];
            }
           });
      
      
          cypher =
          `MATCH p=(w` +
          dynamicLabelAdder(mainRootLabelsWithoutEmptyString) +
          dynamicFilterPropertiesAdderAndAddParameterKeyNew(
            main_root_filters,
            FilterPropertiesType.NODE,
            "9"
          )+
          `-[h:${main_relation_name}*1..${main_relation_depth} ` +
          dynamicFilterPropertiesAdderAndAddParameterKeyNew(
            main_relation_filters,
            FilterPropertiesType.RELATION,
            "8"
          ) +
            ` ]->(n` +
            dynamicLabelAdder(rootLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdder(root_filters) +
            `-[r:${relation_name}*1..${relation_depth}` +
            dynamicFilterPropertiesAdderAndAddParameterKeyNew(
              relation_filters,
              FilterPropertiesType.RELATION,
              "2"
            ) +
            ` ]->(m` +
            dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdderAndAddParameterKeyNew(
              children_filters,
              FilterPropertiesType.NODE,
              "3"
            )+
            `-[t:${relation_name_child}*1..${relation_depth_child}` + 
            dynamicFilterPropertiesAdderAndAddParameterKeyNew(
              relation_filters_child,
              FilterPropertiesType.RELATION,
              "4"
            )+
            ` ]->(k` +
            dynamicLabelAdder(childrenChildrenLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdderAndAddParameterKeyNew(
              children_children_filters,
              FilterPropertiesType.NODE,
              "5"
            )+
            `-[p1:${relation_name_child_child}*1..${relation_depth_child_child}` + 
            dynamicFilterPropertiesAdderAndAddParameterKeyNew(
              relation_filters_child_child,
              FilterPropertiesType.RELATION,
              "6"
            )+
            ` ]->(usr` +
            dynamicLabelAdder(childrenChildrenChildrenLabelsWithoutEmptyString) +
            dynamicFilterPropertiesAdderAndAddParameterKeyNew(
              children_children_children_filters,
              FilterPropertiesType.NODE,
              "7"
            )
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
          if (
            childrenChildrenExcludedLabelsLabelsWithoutEmptyString &&
            childrenChildrenExcludedLabelsLabelsWithoutEmptyString.length > 0
          ) {
            cypher =
              cypher +
              " and " +
              dynamicNotLabelAdder(
                "k",
                childrenChildrenExcludedLabelsLabelsWithoutEmptyString
              );
          }
          if (
            childrenChildrenChildrenExcludedLabelsLabelsWithoutEmptyString &&
            childrenChildrenChildrenExcludedLabelsLabelsWithoutEmptyString.length > 0
          ) {
            cypher =
              cypher +
              " and " +
              dynamicNotLabelAdder(
                "usr",
                childrenChildrenChildrenExcludedLabelsLabelsWithoutEmptyString
              );
          }
          if (isCount) {
            cypher = cypher + ` where id(w) = ${main_root_id}  RETURN count(m) as totalCount `;
          }
          else {
            cypher = cypher + ` where id(w) = ${main_root_id}  RETURN n as parent,m as children, r as relation,  count(n) as count `;

            
          }
         if (!isCount) {
          if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
            cypher =
              cypher +
              dynamicOrderByColumnAdder("n", queryObject.orderByColumn) +
              ` ${queryObject.orderBy} SKIP $skip LIMIT $limit  `;
          } else {
            cypher = cypher + ` SKIP $skip LIMIT $limit `;
          }
        }
          relation_filters = changeObjectKeyName(relation_filters, "2");
          children_filters = changeObjectKeyName(children_filters, "3");
          relation_filters_child = changeObjectKeyName(relation_filters_child_parametric, "4");
          children_children_filters = changeObjectKeyName(children_children_filters, "5");
          main_root_filters = changeObjectKeyName(main_root_filters, "9");
          main_relation_filters= changeObjectKeyName(main_relation_filters, "8");
          relation_filters_child_child = changeObjectKeyName(relation_filters_child_child, "6");
          children_children_children_filters = changeObjectKeyName(children_children_children_filters, "7");
      
          parameters = {
            ...parameters,
            ...children_children_children_filters,
            ...relation_filters_child_child,
            ...children_children_filters,
            ...relation_filters_child,
            ...children_filters,
            ...relation_filters,
            ...root_filters,
            ...main_root_filters,
            ...main_relation_filters
          };
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


////////////////////////////////////////////////////// 17-05-2023 sonrası ////////////////////////////////////////////// 
async findChildrensByLabelAndFiltersWithChildrenOfChildrensCriteria(
  root_labels: string[] = [""],
  root_filters: object = {},
  root_exculuded_labels: string[] = [""],
  children_labels: Array<string> = [],
  children_filters: object = {},
  children_exculuded_labels: string[] = [""],
  children_children_labels: Array<string> = [],
  children_children_filters: object = {},
  children_children_exculuded_labels: string[] = [""],
  relation_name: string,
  relation_filters: object = {},
  relation_depth: number | "",
  relation_name_child: string,
  relation_filters_child: object = {},
  relation_depth_child: number | "",
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
    const childrenChildrenLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_children_labels);  
    const rootExcludedLabelsWithoutEmptyString = filterArrayForEmptyString(
      root_exculuded_labels
    );
    const childrenExcludedLabelsLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_exculuded_labels);
    const childrenChildrenExcludedLabelsLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_children_exculuded_labels);  
    let parameters = {  ...queryObject };
    parameters.skip = int(+queryObject.skip) as unknown as number;
    parameters.limit = int(+queryObject.limit) as unknown as number;

     let cypher;
     let response;

     let relation_filters_child_parametric = {};

     Object.entries(relation_filters_child).forEach((element, index) => {
     
      if (typeof element[1] != 'object') {
          relation_filters_child_parametric[element[0]] = element[1];
      }
     });


    cypher =
      `MATCH p=(n` +
      dynamicLabelAdder(rootLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdder(root_filters) +
      `-[r:${relation_name}*1..${relation_depth}` +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        relation_filters,
        FilterPropertiesType.RELATION,
        "2"
      ) +
      ` ]->(m` +
      dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        children_filters,
        FilterPropertiesType.NODE,
        "3"
      )+
      `-[t:${relation_name_child}*1..${relation_depth_child}` + 
      //child_child_filter +

      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        relation_filters_child,
        FilterPropertiesType.RELATION,
        "4"
      )+
      ` ]->(k` +
      dynamicLabelAdder(childrenChildrenLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        children_children_filters,
        FilterPropertiesType.NODE,
        "5"
      )
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
    if (
      childrenChildrenExcludedLabelsLabelsWithoutEmptyString &&
      childrenChildrenExcludedLabelsLabelsWithoutEmptyString.length > 0
    ) {
      cypher =
        cypher +
        " and " +
        dynamicNotLabelAdder(
          "m",
          childrenChildrenExcludedLabelsLabelsWithoutEmptyString
        );
    }
    cypher = cypher + ` RETURN n as parent,m as children, r as relation, k as children_children, t as relation_children , count(n) as count `;
    // if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
    //   cypher =
    //     cypher +
    //     dynamicOrderByColumnAdder("m", queryObject.orderByColumn) +
    //     ` ${queryObject.orderBy} SKIP $skip LIMIT $limit  `;
    // } else {
    //   cypher = cypher + ` SKIP $skip LIMIT $limit `;
    // }

    relation_filters = changeObjectKeyName(relation_filters, "2");
    children_filters = changeObjectKeyName(children_filters, "3");
    relation_filters_child = changeObjectKeyName(relation_filters_child_parametric, "4");
    children_children_filters = changeObjectKeyName(children_children_filters, "5");

    parameters = {
      ...parameters,
      ...children_children_filters,
      ...relation_filters_child,
      ...children_filters,
      ...relation_filters,
      ...root_filters,
    };
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
async findChildrensByLabelAndFiltersWithChildrenOfChildrensCriteria4(
  root_labels: string[] = [""],
  root_filters: object = {},
  root_exculuded_labels: string[] = [""],
  children_labels: Array<string> = [],
  children_filters: object = {},
  children_exculuded_labels: string[] = [""],
  children_children_labels: Array<string> = [],
  children_children_filters: object = {},
  children_children_exculuded_labels: string[] = [""],
  children_children_children_labels: Array<string> = [],
  children_children_children_filters: object = {},
  children_children_children_exculuded_labels: string[] = [""],
  relation_name: string,
  relation_filters: object = {},
  relation_depth: number | "",
  relation_name_child: string,
  relation_filters_child: object = {},
  relation_depth_child: number | "",
  relation_name_child_child: string,
  relation_filters_child_child: object = {},
  relation_depth_child_child: number | "",
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
    const childrenChildrenLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_children_labels);  
    const childrenChildrenChildrenLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_children_children_labels);

    const rootExcludedLabelsWithoutEmptyString = filterArrayForEmptyString(
      root_exculuded_labels
    );
    const childrenExcludedLabelsLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_exculuded_labels);
    const childrenChildrenExcludedLabelsLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_children_exculuded_labels);  
    const childrenChildrenChildrenExcludedLabelsLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_children_children_exculuded_labels);  
    let parameters = {  ...queryObject };
    parameters.skip = int(+queryObject.skip) as unknown as number;
    parameters.limit = int(+queryObject.limit) as unknown as number;

     let cypher;
     let response;

     let relation_filters_child_parametric = {};

     Object.entries(relation_filters_child).forEach((element, index) => {
     
      if (typeof element[1] != 'object') {
          relation_filters_child_parametric[element[0]] = element[1];
      }
     });


    cypher =
      `MATCH p=(n` +
      dynamicLabelAdder(rootLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdder(root_filters) +
      `-[r:${relation_name}*1..${relation_depth}` +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        relation_filters,
        FilterPropertiesType.RELATION,
        "2"
      ) +
      ` ]->(m` +
      dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        children_filters,
        FilterPropertiesType.NODE,
        "3"
      )+
      `-[t:${relation_name_child}*1..${relation_depth_child}` + 
      //child_child_filter +

      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        relation_filters_child,
        FilterPropertiesType.RELATION,
        "4"
      )+
      ` ]->(k` +
      dynamicLabelAdder(childrenChildrenLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        children_children_filters,
        FilterPropertiesType.NODE,
        "5"
      )
      +
      `-[u:${relation_name_child_child}*1..${relation_depth_child_child}` + 
      
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        relation_filters_child_child,
        FilterPropertiesType.RELATION,
        "6"
      )+
      ` ]->(c` +
      dynamicLabelAdder(childrenChildrenChildrenLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        children_children_children_filters,
        FilterPropertiesType.NODE,
        "7"
      )
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
    if (
      childrenChildrenExcludedLabelsLabelsWithoutEmptyString &&
      childrenChildrenExcludedLabelsLabelsWithoutEmptyString.length > 0
    ) {
      cypher =
        cypher +
        " and " +
        dynamicNotLabelAdder(
          "k",
          childrenChildrenExcludedLabelsLabelsWithoutEmptyString
        );
    }
    if (
      childrenChildrenChildrenExcludedLabelsLabelsWithoutEmptyString &&
      childrenChildrenChildrenExcludedLabelsLabelsWithoutEmptyString.length > 0
    ) {
      cypher =
        cypher +
        " and " +
        dynamicNotLabelAdder(
          "c",
          childrenChildrenChildrenExcludedLabelsLabelsWithoutEmptyString
        );
    }
    cypher = cypher + ` RETURN n as parent,m as children, r as relation, k as children_children, t as relation_children, 
                                   c as children_children_children, u as relation_children_children , count(n) as count `;
    // if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
    //   cypher =
    //     cypher +
    //     dynamicOrderByColumnAdder("m", queryObject.orderByColumn) +
    //     ` ${queryObject.orderBy} SKIP $skip LIMIT $limit  `;
    // } else {
    //   cypher = cypher + ` SKIP $skip LIMIT $limit `;
    // }

    relation_filters = changeObjectKeyName(relation_filters, "2");
    children_filters = changeObjectKeyName(children_filters, "3");
    relation_filters_child = changeObjectKeyName(relation_filters_child_parametric, "4");
    children_children_filters = changeObjectKeyName(children_children_filters, "5");
    relation_filters_child_child = changeObjectKeyName(relation_filters_child_child, "6");
    children_children_children_filters = changeObjectKeyName(children_children_children_filters, "7");

    parameters = {
      ...parameters,
      ...children_children_children_filters,
      ...relation_filters_child_child,
      ...children_children_filters,
      ...relation_filters_child,
      ...children_filters,
      ...relation_filters,
      ...root_filters,
    };
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

// .......
async findChildrensByIdAndFiltersWithChildrenOfChildrensCriteria4(
  root_id: string,
  root_labels: string[] = [""],
  root_filters: object = {},
  root_exculuded_labels: string[] = [""],
  children_labels: Array<string> = [],
  children_filters: object = {},
  children_exculuded_labels: string[] = [""],
  children_children_labels: Array<string> = [],
  children_children_filters: object = {},
  children_children_exculuded_labels: string[] = [""],
  children_children_children_labels: Array<string> = [],
  children_children_children_filters: object = {},
  children_children_children_exculuded_labels: string[] = [""],
  relation_name: string,
  relation_filters: object = {},
  relation_depth: number | "",
  relation_name_child: string,
  relation_filters_child: object = {},
  relation_depth_child: number | "",
  relation_name_child_child: string,
  relation_filters_child_child: object = {},
  relation_depth_child_child: number | "",
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
    const childrenChildrenLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_children_labels);  
    const childrenChildrenChildrenLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_children_children_labels);

    const rootExcludedLabelsWithoutEmptyString = filterArrayForEmptyString(
      root_exculuded_labels
    );
    const childrenExcludedLabelsLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_exculuded_labels);
    const childrenChildrenExcludedLabelsLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_children_exculuded_labels);  
    const childrenChildrenChildrenExcludedLabelsLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_children_children_exculuded_labels);  
    let parameters = {  ...queryObject, root_id};
    parameters.skip = int(+queryObject.skip) as unknown as number;
    parameters.limit = int(+queryObject.limit) as unknown as number;

     let cypher;
     let response;

     let relation_filters_child_parametric = {};

     Object.entries(relation_filters_child).forEach((element, index) => {
     
      if (typeof element[1] != 'object') {
          relation_filters_child_parametric[element[0]] = element[1];
      }
     });


    cypher =
      `MATCH p=(n` +
      dynamicLabelAdder(rootLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdder(root_filters) +
      `-[r:${relation_name}*1..${relation_depth}` +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        relation_filters,
        FilterPropertiesType.RELATION,
        "2"
      ) +
      ` ]->(m` +
      dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        children_filters,
        FilterPropertiesType.NODE,
        "3"
      )+
      `-[t:${relation_name_child}*1..${relation_depth_child}` + 
      //child_child_filter +

      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        relation_filters_child,
        FilterPropertiesType.RELATION,
        "4"
      )+
      ` ]->(k` +
      dynamicLabelAdder(childrenChildrenLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        children_children_filters,
        FilterPropertiesType.NODE,
        "5"
      )
      +
      `-[u:${relation_name_child_child}*1..${relation_depth_child_child}` + 
      
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        relation_filters_child_child,
        FilterPropertiesType.RELATION,
        "6"
      )+
      ` ]->(c` +
      dynamicLabelAdder(childrenChildrenChildrenLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        children_children_children_filters,
        FilterPropertiesType.NODE,
        "7"
      )
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
    if (
      childrenChildrenExcludedLabelsLabelsWithoutEmptyString &&
      childrenChildrenExcludedLabelsLabelsWithoutEmptyString.length > 0
    ) {
      cypher =
        cypher +
        " and " +
        dynamicNotLabelAdder(
          "k",
          childrenChildrenExcludedLabelsLabelsWithoutEmptyString
        );
    }
    if (
      childrenChildrenChildrenExcludedLabelsLabelsWithoutEmptyString &&
      childrenChildrenChildrenExcludedLabelsLabelsWithoutEmptyString.length > 0
    ) {
      cypher =
        cypher +
        " and " +
        dynamicNotLabelAdder(
          "c",
          childrenChildrenChildrenExcludedLabelsLabelsWithoutEmptyString
        );
    }
    cypher = cypher + ` where id(n) = $root_id `;
    cypher = cypher + ` RETURN n as parent,m as children, r as relation, k as children_children, t as relation_children, 
                                   c as children_children_children, u as relation_children_children , count(n) as count `;


    // if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
    //   cypher =
    //     cypher +
    //     dynamicOrderByColumnAdder("m", queryObject.orderByColumn) +
    //     ` ${queryObject.orderBy} SKIP $skip LIMIT $limit  `;
    // } else {
    //   cypher = cypher + ` SKIP $skip LIMIT $limit `;
    // }

    relation_filters = changeObjectKeyName(relation_filters, "2");
    children_filters = changeObjectKeyName(children_filters, "3");
    relation_filters_child = changeObjectKeyName(relation_filters_child_parametric, "4");
    children_children_filters = changeObjectKeyName(children_children_filters, "5");
    relation_filters_child_child = changeObjectKeyName(relation_filters_child_child, "6");
    children_children_children_filters = changeObjectKeyName(children_children_children_filters, "7");

    parameters = {
      ...parameters,
      ...children_children_children_filters,
      ...relation_filters_child_child,
      ...children_children_filters,
      ...relation_filters_child,
      ...children_filters,
      ...relation_filters,
      ...root_filters,
    };
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

// .......

async findChildrensByIdAndFiltersWithChildrenOfChildrensCriteria5(
  main_root_id: string,
  main_root_labels: string[] = [""],
  main_root_filters: object = {},
  main_relation_name: string,
  main_relation_filters: object = {},
  main_relation_depth: number | "",
  root_labels: string[] = [""],
  root_filters: object = {},
  root_exculuded_labels: string[] = [""],
  children_labels: Array<string> = [],
  children_filters: object = {},
  children_exculuded_labels: string[] = [""],
  children_children_labels: Array<string> = [],
  children_children_filters: object = {},
  children_children_exculuded_labels: string[] = [""],
  children_children_children_labels: Array<string> = [],
  children_children_children_filters: object = {},
  children_children_children_exculuded_labels: string[] = [""],
  relation_name: string,
  relation_filters: object = {},
  relation_depth: number | "",
  relation_name_child: string,
  relation_filters_child: object = {},
  relation_depth_child: number | "",
  relation_name_child_child: string,
  relation_filters_child_child: object = {},
  relation_depth_child_child: number | "",
  queryObject: queryObjectType,
  databaseOrTransaction?: string
) {
  try {
    if (!relation_name) {
      throw new HttpException("required_fields_must_entered", 404);
    }
    const mainRootLabelsWithoutEmptyString =
      filterArrayForEmptyString(main_root_labels);
    const rootLabelsWithoutEmptyString =
      filterArrayForEmptyString(root_labels);
    const childrenLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_labels);
    const childrenChildrenLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_children_labels);  
    const childrenChildrenChildrenLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_children_children_labels); 

    const rootExcludedLabelsWithoutEmptyString = filterArrayForEmptyString(
      root_exculuded_labels
    );
    const childrenExcludedLabelsLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_exculuded_labels);
    const childrenChildrenExcludedLabelsLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_children_exculuded_labels);  
    const childrenChildrenChildrenExcludedLabelsLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_children_children_exculuded_labels);  

    let parameters = {  ...queryObject };
    parameters.skip = int(+queryObject.skip) as unknown as number;
    parameters.limit = int(+queryObject.limit) as unknown as number;

     let cypher;
     let response;

     let relation_filters_child_parametric = {};

     Object.entries(relation_filters_child).forEach((element, index) => {
     
      if (typeof element[1] != 'object') {
          relation_filters_child_parametric[element[0]] = element[1];
      }
     });


    cypher =
    `MATCH p=(w` +
    dynamicLabelAdder(mainRootLabelsWithoutEmptyString) +
    dynamicFilterPropertiesAdderAndAddParameterKeyNew(
      main_root_filters,
      FilterPropertiesType.NODE,
      "9"
    )+
    `-[h:${main_relation_name}*1..${main_relation_depth} ` +
    dynamicFilterPropertiesAdderAndAddParameterKeyNew(
      main_relation_filters,
      FilterPropertiesType.RELATION,
      "8"
    ) +
      ` ]->(n` +
      dynamicLabelAdder(rootLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdder(root_filters) +
      `-[r:${relation_name}*1..${relation_depth}` +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        relation_filters,
        FilterPropertiesType.RELATION,
        "2"
      ) +
      ` ]->(m` +
      dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        children_filters,
        FilterPropertiesType.NODE,
        "3"
      )+
      `-[t:${relation_name_child}*1..${relation_depth_child}` + 
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        relation_filters_child,
        FilterPropertiesType.RELATION,
        "4"
      )+
      ` ]->(k` +
      dynamicLabelAdder(childrenChildrenLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        children_children_filters,
        FilterPropertiesType.NODE,
        "5"
      )+
      `-[p1:${relation_name_child_child}*1..${relation_depth_child_child}` + 
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        relation_filters_child_child,
        FilterPropertiesType.RELATION,
        "6"
      )+
      ` ]->(usr` +
      dynamicLabelAdder(childrenChildrenChildrenLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        children_children_children_filters,
        FilterPropertiesType.NODE,
        "7"
      )
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
    if (
      childrenChildrenExcludedLabelsLabelsWithoutEmptyString &&
      childrenChildrenExcludedLabelsLabelsWithoutEmptyString.length > 0
    ) {
      cypher =
        cypher +
        " and " +
        dynamicNotLabelAdder(
          "k",
          childrenChildrenExcludedLabelsLabelsWithoutEmptyString
        );
    }
    if (
      childrenChildrenChildrenExcludedLabelsLabelsWithoutEmptyString &&
      childrenChildrenChildrenExcludedLabelsLabelsWithoutEmptyString.length > 0
    ) {
      cypher =
        cypher +
        " and " +
        dynamicNotLabelAdder(
          "usr",
          childrenChildrenChildrenExcludedLabelsLabelsWithoutEmptyString
        );
    }
    cypher = cypher + ` where id(w) = ${main_root_id}  RETURN n as parent,m as children, r as relation, k as children_children, t as relation_children,
                                                               usr as children_children_children, p1 as relation_children_children , count(n) as count `;
    // if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
    //   cypher =
    //     cypher +
    //     dynamicOrderByColumnAdder("m", queryObject.orderByColumn) +
    //     ` ${queryObject.orderBy} SKIP $skip LIMIT $limit  `;
    // } else {
    //   cypher = cypher + ` SKIP $skip LIMIT $limit `;
    // }

    relation_filters = changeObjectKeyName(relation_filters, "2");
    children_filters = changeObjectKeyName(children_filters, "3");
    relation_filters_child = changeObjectKeyName(relation_filters_child_parametric, "4");
    children_children_filters = changeObjectKeyName(children_children_filters, "5");
    main_root_filters = changeObjectKeyName(main_root_filters, "9");
    main_relation_filters= changeObjectKeyName(main_relation_filters, "8");
    relation_filters_child_child = changeObjectKeyName(relation_filters_child_child, "6");
    children_children_children_filters = changeObjectKeyName(children_children_children_filters, "7");

    parameters = {
      ...parameters,
      ...children_children_children_filters,
      ...relation_filters_child_child,
      ...children_children_filters,
      ...relation_filters_child,
      ...children_filters,
      ...relation_filters,
      ...root_filters,
      ...main_root_filters,
      ...main_relation_filters
    };
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




async findChildrensByIdAndByChildrenIdAndFilters(
  root_id: number,
  root_labels: string[] = [""],
  root_filters: object = {},
  children_labels: string[] = [],
  children_filters: object = {},
  relation_name: string,
  relation_filters: object = {},
  relation_depth: number | "",
  children_id:string,
  databaseOrTransaction?: string
) {
  try {
    if (!relation_name) {
      throw new HttpException(required_fields_must_entered, 404);
    }
    const rootLabelsWithoutEmptyString =
      filterArrayForEmptyString(root_labels);
    const childrenLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_labels);
      let chId;
      let parameters;
      if (children_id && children_id != '') {
        chId = +children_id;
      }
      else {
        chId = -1;
      }
      parameters = { root_id, children_id:chId, ...root_filters };

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
      `  WHERE  id(n) = $root_id  and id(m) =  $children_id `;

      // if (children_id && children_id != null && children_id != undefined && children_id != "") {
      //   cypher = cypher + ` and id(m) =  $children_id `;
      // }
     

      cypher = cypher + `  RETURN n as parent,m as children, r as relation`;
       

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


//revised at 02-06-2022
async findChildrensByIdAndFiltersWithChildrenOfChildrensCriteria(
  main_root_id: string,
  main_root_labels: string[] = [""],
  main_root_filters: object = {},
  main_relation_name: string,
  main_relation_filters: object = {},
  main_relation_depth: number | "",
  root_labels: string[] = [""],
  root_filters: object = {},
  root_exculuded_labels: string[] = [""],
  children_labels: Array<string> = [],
  children_filters: object = {},
  children_exculuded_labels: string[] = [""],
  children_children_labels: Array<string> = [],
  children_children_filters: object = {},
  children_children_exculuded_labels: string[] = [""],
  relation_name: string,
  relation_filters: object = {},
  relation_depth: number | "",
  relation_name_child: string,
  relation_filters_child: object = {},
  relation_depth_child: number | "",
  queryObject: queryObjectType,
  databaseOrTransaction?: string
) {
  try {
    if (!relation_name) {
      throw new HttpException("required_fields_must_entered", 404);
    }
    const mainRootLabelsWithoutEmptyString =
      filterArrayForEmptyString(main_root_labels);
    const rootLabelsWithoutEmptyString =
      filterArrayForEmptyString(root_labels);
    const childrenLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_labels);
    const childrenChildrenLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_children_labels);  
    const rootExcludedLabelsWithoutEmptyString = filterArrayForEmptyString(
      root_exculuded_labels
    );
    const childrenExcludedLabelsLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_exculuded_labels);
    const childrenChildrenExcludedLabelsLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_children_exculuded_labels);  
    let parameters = {  ...queryObject };
    parameters.skip = int(+queryObject.skip) as unknown as number;
    parameters.limit = int(+queryObject.limit) as unknown as number;

     let cypher;
     let response;

     let relation_filters_child_parametric = {};

     Object.entries(relation_filters_child).forEach((element, index) => {
     
      if (typeof element[1] != 'object') {
          relation_filters_child_parametric[element[0]] = element[1];
      }
     });

     let relation_filters_parametric = {};

     Object.entries(relation_filters).forEach((element, index) => {
     
      if (typeof element[1] != 'object') {
          relation_filters_parametric[element[0]] = element[1];
      }
     });

    cypher =
    `MATCH p=(w` +
    dynamicLabelAdder(mainRootLabelsWithoutEmptyString) +
    dynamicFilterPropertiesAdderAndAddParameterKeyNew(
      main_root_filters,
      FilterPropertiesType.NODE,
      "9"
    )+
    `-[h:${main_relation_name}*1..${main_relation_depth} ` +
    dynamicFilterPropertiesAdderAndAddParameterKeyNew(
      main_relation_filters,
      FilterPropertiesType.RELATION,
      "8"
    ) +
      ` ]->(n` +
      dynamicLabelAdder(rootLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdder(root_filters) +
      `-[r:${relation_name}*1..${relation_depth}` +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        relation_filters,
        FilterPropertiesType.RELATION,
        "2"
      ) +
      ` ]->(m` +
      dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        children_filters,
        FilterPropertiesType.NODE,
        "3"
      )+
      `-[t:${relation_name_child}*1..${relation_depth_child}` + 
      //child_child_filter +

      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        relation_filters_child,
        FilterPropertiesType.RELATION,
        "4"
      )+
      ` ]->(k` +
      dynamicLabelAdder(childrenChildrenLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        children_children_filters,
        FilterPropertiesType.NODE,
        "5"
      )
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
    if (
      childrenChildrenExcludedLabelsLabelsWithoutEmptyString &&
      childrenChildrenExcludedLabelsLabelsWithoutEmptyString.length > 0
    ) {
      cypher =
        cypher +
        " and " +
        dynamicNotLabelAdder(
          "m",
          childrenChildrenExcludedLabelsLabelsWithoutEmptyString
        );
    }
    cypher = cypher + ` where id(w) = ${main_root_id}  RETURN n as parent,m as children, r as relation, k as children_children, t as relation_children , count(n) as count `;
    // if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
    //   cypher =
    //     cypher +
    //     dynamicOrderByColumnAdder("m", queryObject.orderByColumn) +
    //     ` ${queryObject.orderBy} SKIP $skip LIMIT $limit  `;
    // } else {
    //   cypher = cypher + ` SKIP $skip LIMIT $limit `;
    // }

    relation_filters = changeObjectKeyName(relation_filters_parametric, "2");
    children_filters = changeObjectKeyName(children_filters, "3");
    relation_filters_child = changeObjectKeyName(relation_filters_child_parametric, "4");
    children_children_filters = changeObjectKeyName(children_children_filters, "5");
    main_root_filters = changeObjectKeyName(main_root_filters, "9");
    main_relation_filters= changeObjectKeyName(main_relation_filters, "8");

    parameters = {
      ...parameters,
      ...children_children_filters,
      ...relation_filters_child,
      ...children_filters,
      ...relation_filters,
      ...root_filters,
      ...main_root_filters,
      ...main_relation_filters
    };
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

async updateRelationByIdWithRelationNameAndWithNoRelationCreationFilters(
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
            `  where id(m)= $second_node_id MATCH (n)-[r:${relation_name}` +
            dynamicFilterPropertiesAdderAndAddParameterKey(
              relation_properties,
              FilterPropertiesType.RELATION
            ) +
            `]->(m) ` +
            "set " +
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
            `) where id(n)= $second_node_id MATCH (m)<-[:${relation_name}` +
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

    // if (!res) {
    //   throw new HttpException("something goes wrong", 400);
    // }
    if (!res) {
      return 'relation not found'
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


////////////////////////////////

async findChildrensByIdAndFiltersWithChildrenOfChildrens3Criteria(
  main_root_id: number,
  main_root_labels: string[] = [""],
  main_root_filters: object = {},
  main_relation_name: string,
  main_relation_filters: object = {},
  main_relation_depth: number | "",
  root_labels: string[] = [""],
  root_filters: object = {},
  root_exculuded_labels: string[] = [""],
  children_labels: Array<string> = [],
  children_filters: object = {},
  children_exculuded_labels: string[] = [""],
  relation_name: string,
  relation_filters: object = {},
  relation_depth: number | "",
  isCount: boolean = false,
  databaseOrTransaction?: string
) {
  try {
    if (!relation_name) {
      throw new HttpException("required_fields_must_entered", 404);
    }
    const mainRootLabelsWithoutEmptyString =
      filterArrayForEmptyString(main_root_labels);
    const rootLabelsWithoutEmptyString =
      filterArrayForEmptyString(root_labels);
    const childrenLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_labels);
    const rootExcludedLabelsWithoutEmptyString = filterArrayForEmptyString(
      root_exculuded_labels
    );
    const childrenExcludedLabelsLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_exculuded_labels);
  
      let parameters = {};

     let cypher;
     let response;

     let relation_filters_child_parametric = {};

     
     let relation_filters_parametric = {};

     Object.entries(relation_filters).forEach((element, index) => {
     
      if (typeof element[1] != 'object') {
          relation_filters_parametric[element[0]] = element[1];
      }
     });

    cypher =
    `MATCH p=(w` +
    dynamicLabelAdder(mainRootLabelsWithoutEmptyString) +
    dynamicFilterPropertiesAdderAndAddParameterKeyNew(
      main_root_filters,
      FilterPropertiesType.NODE,
      "9"
    )+
    `-[h:${main_relation_name}*1..${main_relation_depth} ` +
    dynamicFilterPropertiesAdderAndAddParameterKeyNew(
      main_relation_filters,
      FilterPropertiesType.RELATION,
      "8"
    ) +
      ` ]->(n` +
      dynamicLabelAdder(rootLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdder(root_filters) +
      `-[r:${relation_name}*1..${relation_depth}` +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        relation_filters,
        FilterPropertiesType.RELATION,
        "2"
      ) +
      ` ]->(m` +
      dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        children_filters,
        FilterPropertiesType.NODE,
        "3"
      )
      
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
    if (isCount) {
      cypher = cypher + ` where id(w) = ${main_root_id}  RETURN  count(n) as totalCount `;
    }
    else {
      cypher = cypher + ` where id(w) = ${main_root_id}  RETURN w as parent,n as children, h as relation, m as children_children, r as relation_children , count(n) as count `;
    }
    

    relation_filters = changeObjectKeyName(relation_filters_parametric, "2");
    children_filters = changeObjectKeyName(children_filters, "3");
    main_root_filters = changeObjectKeyName(main_root_filters, "9");
    main_relation_filters= changeObjectKeyName(main_relation_filters, "8");

    parameters = {
      ...parameters,

      ...children_filters,
      ...relation_filters,
      ...root_filters,
      ...main_root_filters,
      ...main_relation_filters
    };
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

async findChildrensByLabelAndFiltersWithChildrenOfChildrens3Criteria(
 
  root_labels: string[] = [""],
  root_filters: object = {},
  root_exculuded_labels: string[] = [""],
  children_labels: Array<string> = [],
  children_filters: object = {},
  children_exculuded_labels: string[] = [""],
  relation_name: string,
  relation_filters: object = {},
  relation_depth: number | "",
  isCount: boolean=false,
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
  
      let parameters = {};
      
     let cypher;
     let response;

     
     let relation_filters_parametric = {};

     Object.entries(relation_filters).forEach((element, index) => {
     
      if (typeof element[1] != 'object') {
          relation_filters_parametric[element[0]] = element[1];
      }
     });

    cypher =

      ` MATCH p=(n` +
      dynamicLabelAdder(rootLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdder(root_filters) +
      `-[r:${relation_name}*1..${relation_depth}` +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        relation_filters,
        FilterPropertiesType.RELATION,
        "2"
      ) +
      ` ]->(m` +
      dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        children_filters,
        FilterPropertiesType.NODE,
        "3"
      )
      
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
    if (isCount) {
      cypher = cypher + `  RETURN count(n)  as totalCount `;
    }
    else {
      cypher = cypher + `  RETURN n as parent,  m as children, r as relation, count(n) as count `;
    }
   
   
    relation_filters = changeObjectKeyName(relation_filters_parametric, "2");
    children_filters = changeObjectKeyName(children_filters, "3");
   

    parameters = {
      ...parameters,
      ...children_filters,
      ...relation_filters,
      ...root_filters
    };
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



async findChildrensByIdAndFiltersWithChildrenOfChildrens3CriteriaPagination(
  main_root_id: number,
  main_root_labels: string[] = [""],
  main_root_filters: object = {},
  main_relation_name: string,
  main_relation_filters: object = {},
  main_relation_depth: number | "",
  root_labels: string[] = [""],
  root_filters: object = {},
  root_exculuded_labels: string[] = [""],
  children_labels: Array<string> = [],
  children_filters: object = {},
  children_exculuded_labels: string[] = [""],
  relation_name: string,
  relation_filters: object = {},
  relation_depth: number | "",
  queryObject: queryObjectType,
  isCount:boolean = false,
  databaseOrTransaction?: string
) {
  try {
    if (!relation_name) {
      throw new HttpException("required_fields_must_entered", 404);
    }
    const mainRootLabelsWithoutEmptyString =
      filterArrayForEmptyString(main_root_labels);
    const rootLabelsWithoutEmptyString =
      filterArrayForEmptyString(root_labels);
    const childrenLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_labels);
    const rootExcludedLabelsWithoutEmptyString = filterArrayForEmptyString(
      root_exculuded_labels
    );
    const childrenExcludedLabelsLabelsWithoutEmptyString =
      filterArrayForEmptyString(children_exculuded_labels);
  
      let parameters = {  ...queryObject };
      parameters.skip = int(+queryObject.skip) as unknown as number;
      parameters.limit = int(+queryObject.limit) as unknown as number;

     let cypher;
     let response;

     let relation_filters_child_parametric = {};

     
     let relation_filters_parametric = {};

     Object.entries(relation_filters).forEach((element, index) => {
     
      if (typeof element[1] != 'object') {
          relation_filters_parametric[element[0]] = element[1];
      }
     });

    cypher =
    `MATCH p=(w` +
    dynamicLabelAdder(mainRootLabelsWithoutEmptyString) +
    dynamicFilterPropertiesAdderAndAddParameterKeyNew(
      main_root_filters,
      FilterPropertiesType.NODE,
      "9"
    )+
    `-[h:${main_relation_name}*1..${main_relation_depth} ` +
    dynamicFilterPropertiesAdderAndAddParameterKeyNew(
      main_relation_filters,
      FilterPropertiesType.RELATION,
      "8"
    ) +
      ` ]->(n` +
      dynamicLabelAdder(rootLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdder(root_filters) +
      `-[r:${relation_name}*1..${relation_depth}` +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        relation_filters,
        FilterPropertiesType.RELATION,
        "2"
      ) +
      ` ]->(m` +
      dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        children_filters,
        FilterPropertiesType.NODE,
        "3"
      )
      
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
    if (isCount) {
      cypher = cypher + ` where id(w) = ${main_root_id}  RETURN count(n) as totalCount `;
    }
    else {
      cypher = cypher + ` where id(w) = ${main_root_id}  RETURN w as main_parent,n as parent, h as main_relation, m as children, r as relation , count(n) as count `;
    }
    if (!isCount) {
      if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
        cypher =
          cypher +
          dynamicOrderByColumnAdder("n", queryObject.orderByColumn) +
          ` ${queryObject.orderBy} SKIP $skip LIMIT $limit  `;
      } else {
        cypher = cypher + ` SKIP $skip LIMIT $limit `;
      }
    }
    
    relation_filters = changeObjectKeyName(relation_filters_parametric, "2");
    children_filters = changeObjectKeyName(children_filters, "3");
    main_root_filters = changeObjectKeyName(main_root_filters, "9");
    main_relation_filters= changeObjectKeyName(main_relation_filters, "8");

    parameters = {
      ...parameters,

      ...children_filters,
      ...relation_filters,
      ...root_filters,
      ...main_root_filters,
      ...main_relation_filters
    };
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
async findChildrensByLabelAndFiltersWithChildrenOfChildrens3CriteriaPagination(
 
  root_labels: string[] = [""],
  root_filters: object = {},
  root_exculuded_labels: string[] = [""],
  children_labels: Array<string> = [],
  children_filters: object = {},
  children_exculuded_labels: string[] = [""],
  relation_name: string,
  relation_filters: object = {},
  relation_depth: number | "",
  queryObject: queryObjectType,
  isCount: boolean = false,
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
  
      let parameters = {  ...queryObject };
      parameters.skip = int(+queryObject.skip) as unknown as number;
      parameters.limit = int(+queryObject.limit) as unknown as number;

     let cypher;
     let response;

     
     let relation_filters_parametric = {};

     Object.entries(relation_filters).forEach((element, index) => {
     
      if (typeof element[1] != 'object') {
          relation_filters_parametric[element[0]] = element[1];
      }
     });

    cypher =

      ` MATCH p=(n` +
      dynamicLabelAdder(rootLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdder(root_filters) +
      `-[r:${relation_name}*1..${relation_depth}` +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        relation_filters,
        FilterPropertiesType.RELATION,
        "2"
      ) +
      ` ]->(m` +
      dynamicLabelAdder(childrenLabelsWithoutEmptyString) +
      dynamicFilterPropertiesAdderAndAddParameterKeyNew(
        children_filters,
        FilterPropertiesType.NODE,
        "3"
      )
      
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
    if (isCount) {
      cypher = cypher + `  RETURN count(n) as totalCount `;
    }
    else {
      cypher = cypher + `  RETURN n as parent,  m as children, r as relation , count(n) as count `;
    }
    if (!isCount) {
      if (queryObject.orderByColumn && queryObject.orderByColumn.length >= 1) {
        cypher =
          cypher +
          dynamicOrderByColumnAdder("n", queryObject.orderByColumn) +
          ` ${queryObject.orderBy} SKIP $skip LIMIT $limit  `;
      } else {
        cypher = cypher + ` SKIP $skip LIMIT $limit `;
      }
    }
   
    relation_filters = changeObjectKeyName(relation_filters_parametric, "2");
    children_filters = changeObjectKeyName(children_filters, "3");
   

    parameters = {
      ...parameters,
      ...children_filters,
      ...relation_filters,
      ...root_filters
    };
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
/////////////////////////////////////

async updateRelationByIdAndLabelWithRelationNameAndWithNoRelationCreationFilters(
  first_node_id: number,
  first_node_labels: string[] = [""],
  first_node_filters: object = {},
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
            `  MATCH (n)-[r:${relation_name}` +
            dynamicFilterPropertiesAdderAndAddParameterKey(
              relation_properties,
              FilterPropertiesType.RELATION
            ) +
            `]->(m) ` +
            "set " +
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
            `)  MATCH (n` +
            dynamicLabelAdder(second_node_labels) +
            `) where id(n)= $second_node_id MATCH (m)<-[:${relation_name}` +
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

}



