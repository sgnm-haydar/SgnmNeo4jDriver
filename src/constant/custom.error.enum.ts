export enum CustomNeo4jError {
  HAS_CHILDREN = 5000,
  NOT_FOUND = 5001,
  HAS_NOT_CHILDREN = 5002,
  ROOT_NODE_NOT_FOUND = 5003,
  PARENT_NOT_FOUND = 5004,
  GET_CHILDREN_COUNT_BY_ID_AND_LABELS_NOT_FOUND = 5005,
  NODE_NOT_CREATED = 5006,
  CREATE_NODE_WITH_LABEL_ADD_PARENT_BY_LABELCLASS = 5007,
  INVALID_LABEL_ERROR = 5008,
  DELETE_CHILDREN_NODES_BY_ID_AND_LABELS__NOT_DELETED_ERROR = 5009,
  FIND_ALL_BY_CLASSNAME__FIND_NODE_COUNT_BY_CLASSNAME_ERROR = 5010,
  GET_NODE_WITHOUT_PARENT_ERROR = 5011,
  DELETE__GET_PARENT_BY_ID = 5012,
  NODE_HAS_NOT_CHILDREN = 5013,
  FIND_WITH_CHILDREN_BY_ID_AND_LABELS_AS_TREE__HAS_NO_CHILDREN_ERROR = 5014,
  FIND_NODE_COUNT_BY_CLASSNAME_ERROR = 5015,
  UPDATE_BY_ID__NODE_NOT_FOUND = 5016,
  UPDATE_BY_ID__UPDATE_ERROR = 5017,
  DELETE_CHILDREN_RELATION_ERROR = 5018,
  DELETE_RELATION_BY_RELATION_NAME__NOT_DELETED_ERROR = 5019,
  ADD_PARENT_RELATION_BY_ID_ERROR = 5020,
  FIND_BY_REALM__NOT_FOUND_ERROR = 5021,
  FIND_BY_REALM_WITH_TREE_STRUCTURE_ERROR = 5022,
  FIND_WITH_CHILDREN_BY_REALM_AS_TREE__FIND_BY_REALM_ERROR = 5023,
  FIND_WITH_CHILDREN_BY_REALM_AS_TREE_ERROR = 5024,
  CREATE_NODE__NODE_NOT_CREATED_ERROR = 5025,
  FIND_WITH_CHILDREN_BY_ID_AS_TREE_ERROR = 5026,
  ADD_CHILDREN_RELATION_BY_ID_ERROR = 5027,
  ADD_RELATION_WITH_RELATION_NAME_ERROR = 5028,
  ADD_RELATION_WITH_RELATION_NAME__CREATE_RELATION_ERROR = 5029,
  FIND_BY_REALM__NOT_ENTERED_ERROR = 5030,
  FIND_WITH_CHILDREN_BY_REALM_AS_TREE__NOT_ENTERED_ERROR = 5031,
  FIND_BY_REALM_WITH_TREE_STRUCTURE__NOT_ENTERED_ERROR = 5032,
  GET_CHILDREN_COUNT__MUST_ENTERED_ERROR = 5033,
  GET_PARENT_BY_ID__MUST_ENTERED_ERROR = 5034,
  SET_DELETED_TRUE_TO_NODE_AND_CHILD_BY_ID_AND_LABELS__MUST_ENTERED_ERROR = 5035,
  GET_CHILDRENS_CHILDREN_COUNT_BY_ID_AND_LABELS__MUST_ENTERED_ERROR = 5036,
  GET_CHILDRENS_CHILDREN_COUNT_BY_ID_AND_LABELS__NOT_FOUND_ERROR = 5037,
  DELETE_CHILDREN_NODES_BY_ID_AND_LABELS__MUST_ENTERED_ERROR = 5038,
  CREATE_NODE_WITH_LABEL__MUST_ENTERED_ERROR = 5039,
  CREATE_NODE_WITH_LABEL__NODE_NOT_CREATED = 5040,
  UPDATE_HAS_TYPE_PROP__MUST_ENTERED_ERROR = 5041,
  UPDATE_HAS_TYPE_PROP_ERROR = 5042,
  CREATE__MUST_ENTERED_ERROR = 5043,
  DELETE_RELATION_WITH_RELATION_NAME__MUST_ENTERED_ERROR = 5044,
  ADD_PARENT_RELATION_BY_ID__MUST_ENTERED_ERROR = 5045,
  UPDATE_SELECTABLE_PROP__MUST_ENTERED_ERROR = 5046,
  FIND_BY_ID_AND_LABELS_WITH_ACTIVE_CHILD_NODES__MUST_ENTERED_ERROR = 5047,
  FIND_WITH_CHILDREN_BY_ID_AS_TREE__MUST_ENTERED_ERROR = 5048,
  FIND_BY_ID_WITH_TREE_STRUCTURE__MUST_ENTERED_ERROR = 5049,
  FIND_BY_ID_AND_LABELS_WITH_ACTIVE_CHILD_NODES__NOT_FOUND_ERROR = 5050,
  FIND_BY_ID_AND_LABELS_WITH_ACTIVE_CHILD_NODE__NOT_FOUND_ERROR = 5051,
  FIND_NODE_BY_ID_AND_LABEL__MUST_ENTERED_ERROR = 5052,
  FIND_NODE_BY_ID_AND_LABEL__NOT_FOUND_ERROR = 5053,
  FIND_BY_ID__MUST_ENTERED_ERROR = 5054,
  FIND_NODE_COUNT_BY_CLASSNAME__MUST_ENTERED_ERROR = 5055,
  FIND_WITH_CHILDREN_BY_ID_AND_LABELS_AS_TREE__MUST_ENTERED_ERROR = 5056,
  CREATE_NODE__MUST_ENTERED_ERROR = 5057,
  UPDATE_BY_ID__MUST_ENTERED_ERROR = 5058,
  FIND_ROOT_NODE_BY_CLASSNAME__MUST_ENTERED_ERROR = 5059,
  UPDATE_SELECTABLE_PROP__NOT_UPDATED_ERROR = 5060,
  SET_DELETED_TRUE_TO_NODE_AND_CHILD_BY_ID_AND_LABELS__NOT_UPDATED_ERROR = 5061,
  FIND_BY_ID_AND_LABELS_WITH_TREE_STRUCTURE__NOT_FOUND_ERROR = 5062,
  FIND_BY_ID_AND_LABELS_WITH_TREE_STRUCTURE__MUST_ENTERED_ERROR = 5063,
  ADD_PARENT_RELATION_BY_ID__NOT_CREATED_ERROR = 5064,
  ADD_PARENT_BY_LABEL_CLASS__MUST_ENTERED_ERROR = 5065,
  DELETE_RELATION__MUST_ENTERED_ERROR = 5066,
  ADD_RELATION__MUST_ENTERED_ERROR = 5067,
  FIND_ONE_NODE_BY_KEY__MUST_ENTERED_ERROR = 5068,
  DELETE__MUST_ENTERED_ERROR = 5069,
  REMOVE_LABEL__MUST_ENTERED_ERROR = 5070,
  UPDATE_LABEL__MUST_ENTERED_ERROR = 5071,
  FIND_BY_NAME__MUST_ENTERED_ERROR = 5072,
  ADD_CHILDREN_REALTION_BY_ID__RELATIONSHIP_NOT_CREATED = 5073,
  FIND_BY_NAME_AND_LABELS_WITH_ACTIVE_CHILD_NODES__MUST_ENTERED_ERROR = 5074,
  FIND_BY_NAME_AND_LABELS_WITH_ACTIVE_CHILD_NODES__NOT_FOUND_ERROR = 5075,
  FIND_PARENT_BY_ID__MUST_ENTERED_ERROR = 5076,
  FIND_CHILDREN_BY_ID__MUST_ENTERED_ERROR = 5077,
  DELETE__UPDATE_IS_DELETED_PROP_ERROR = 5078,
  INCORRECT_OPERATION = 5079,
  NODE_CANNOT_DELETE = 5080,
  LİBRARY_ERROR = 5081,
}
