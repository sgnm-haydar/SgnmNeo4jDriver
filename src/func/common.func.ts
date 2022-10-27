import { HttpException } from "@nestjs/common";
import { int } from "neo4j-driver";
import { undefined_value_recieved } from "../constant/custom.error.object";

//transfer dto(object come from client) properties to specific node entity object
export function assignDtoPropToEntity(entity, dto) {
  Object.entries(dto).forEach((element) => {
    if (element[1] === null || element[1] === undefined) {
      throw new HttpException(undefined_value_recieved, 400);
    }
    if (
      element[0] != "parentId" &&
      element[0] != "labels" &&
      element[0] != "parentKey"
    ) {
      entity[element[0]] = dto[element[0]];
    }
  });

  return entity;
}

export function createDynamicCyperCreateQuery(
  entity: object,
  labels?: Array<string>
) {
  let uniqueLabels = [...new Set(labels)];
  let optionalLabels = "";

  if (uniqueLabels && uniqueLabels.length > 0) {
    uniqueLabels.map((item) => {
      if (item.trim() === "") {
        optionalLabels = optionalLabels;
      } else {
        optionalLabels = optionalLabels + ":" + item;
      }
    });
  }

  let dynamicQueryParameter = `CREATE (node${optionalLabels} {`;

  Object.entries(entity).forEach((element, index) => {
    if (element[1] === null || element[1] === undefined) {
      throw new HttpException(undefined_value_recieved, 400);
    }
    if (index === 0) {
      dynamicQueryParameter += ` ${element[0]}` + `: $` + `${element[0]}`;
    } else {
      dynamicQueryParameter += `,${element[0]}` + `: $` + `${element[0]}`;
    }
    if (Object.keys(entity).length === index + 1) {
      dynamicQueryParameter += ` }) return node`;
    }
  });

  return dynamicQueryParameter;
}

export function createDynamicCyperObject(entity) {
  const dynamicObject = {};
  Object.entries(entity).forEach((element) => {
    if (element[1] === null || element[1] === undefined) {
      throw new HttpException(undefined_value_recieved, 400);
    }
    dynamicObject[element[0]] = entity[element[0]];
  });

  return dynamicObject;
}

export function updateNodeQuery(id, dto) {
  id = int(id);
  let dynamicQueryParameter = ` match (node {isDeleted: false}) where id(node) = ${id} set `;

  Object.keys(dto).forEach((element, index) => {
    if (Object.keys(dto).length === index + 1) {
      dynamicQueryParameter += `node.${element}` + `= $` + `${element}`;
    } else {
      dynamicQueryParameter += `node.${element}` + `= $` + `${element} ,`;
    }
  });
  dynamicQueryParameter += `  return node`;
  return dynamicQueryParameter;
}

export function dynamicLabelAdder(labels: Array<string>) {
  let uniqueLabels = [...new Set(labels)];
  let optionalLabels = "";

  if (uniqueLabels && uniqueLabels.length > 0) {
    uniqueLabels.map((item) => {
      if (item.trim() === "") {
        optionalLabels = optionalLabels;
      } else {
        optionalLabels = optionalLabels + ":" + item;
      }
    });
  }
  return optionalLabels;
}

export function dynamicNotLabelAdder(
  queryNodeName: string,
  notLabels: Array<string>
) {
  let uniqueOrLabels = [...new Set(notLabels)];
  let optionalLabels = "";
  const notLabelsWithoutEmptyString = uniqueOrLabels.filter((item) => {
    if (item.trim() !== "") {
      return item;
    }
  });

  if (notLabelsWithoutEmptyString && notLabelsWithoutEmptyString.length > 0) {
    notLabelsWithoutEmptyString.map((item, index) => {
      if (index === 0) {
        optionalLabels = optionalLabels + `not ${queryNodeName}:${item} `;
      } else {
        optionalLabels = optionalLabels + `and not ${queryNodeName}:${item} `;
      }
    });
  }
  return optionalLabels;
}

export function dynamicOrLabelAdder(
  queryNodeName: string,
  notLabels: Array<string>
) {
  let uniqueNotLabels = [...new Set(notLabels)];
  let optionalLabels = "";
  const notLabelsWithoutEmptyString = uniqueNotLabels.filter((item) => {
    if (item.trim() !== "") {
      return item;
    }
  });

  if (notLabelsWithoutEmptyString && notLabelsWithoutEmptyString.length > 0) {
    notLabelsWithoutEmptyString.map((item, index) => {
      if (index === 0) {
        optionalLabels = optionalLabels + ` ${queryNodeName}:${item} `;
      } else {
        optionalLabels = optionalLabels + `or ${queryNodeName}:${item} `;
      }
    });
  }
  return optionalLabels;
}

export function dynamicFilterPropertiesAdder(filterProperties) {
  if (!filterProperties || Object.keys(filterProperties).length === 0) {
    return ")";
  }
  let dynamicQueryParameter = "";

  Object.entries(filterProperties).forEach((element, index) => {
    if (element[1] === null || element[1] === undefined) {
      throw new HttpException(undefined_value_recieved, 400);
    }
    if (index === 0) {
      dynamicQueryParameter += ` { ${element[0]}` + `: $` + `${element[0]}`;
    } else {
      dynamicQueryParameter += `,${element[0]}` + `: $` + `${element[0]}`;
    }
    if (Object.keys(filterProperties).length === index + 1) {
      dynamicQueryParameter += ` })`;
    }
  });
  return dynamicQueryParameter;
}

export function dynamicUpdatePropertyAdder(
  queryNodeName: string,
  updateProperties: object
) {
  let dynamicQueryParameter = "";

  Object.entries(updateProperties).forEach((element, index) => {
    if (element[1] === null || element[1] === undefined) {
      throw new HttpException(undefined_value_recieved, 400);
    }
    if (Object.keys(updateProperties).length === index + 1) {
      dynamicQueryParameter +=
        `${queryNodeName}.${element[0]}` + `= $` + `${element[0]}`;
    } else {
      dynamicQueryParameter +=
        `${queryNodeName}.${element[0]}` + `= $` + `${element[0]} ,`;
    }
  });
  return dynamicQueryParameter;
}

export function changeObjectKeyName(
  obj1: object,
  addedToKeyString: string = "1"
) {
  const changedObject = Object.fromEntries(
    Object.entries(obj1).map(([key, value]) =>
      // Modify key here
      [`${key}${addedToKeyString}`, value]
    )
  );
  return changedObject;
}

export function dynamicUpdatePropertyAdderAndAddParameterKey(
  queryNodeName: string,
  updateProperties: object,
  parameterKey: string = "1"
) {
  let dynamicQueryParameter = "";

  Object.entries(updateProperties).forEach((element, index) => {
    if (element[1] === null || element[1] === undefined) {
      throw new HttpException(undefined_value_recieved, 400);
    }
    if (Object.keys(updateProperties).length === index + 1) {
      dynamicQueryParameter +=
        `${queryNodeName}.${element[0]}` +
        `= $` +
        `${element[0]}` +
        parameterKey;
    } else {
      dynamicQueryParameter +=
        `${queryNodeName}.${element[0]}` +
        `= $` +
        `${element[0]}` +
        parameterKey +
        `,`;
    }
  });
  return dynamicQueryParameter;
}

export function dynamicFilterPropertiesAdderAndAddParameterKey(
  filterProperties,
  parameterKey: string = "1"
) {
  if (!filterProperties || Object.keys(filterProperties).length === 0) {
    return ")";
  }
  let dynamicQueryParameter = "";

  Object.entries(filterProperties).forEach((element, index) => {
    if (element[1] === null || element[1] === undefined) {
      throw new HttpException(undefined_value_recieved, 400);
    }
    if (index === 0) {
      dynamicQueryParameter +=
        ` { ${element[0]}` + `: $` + `${element[0]}` + parameterKey;
    } else {
      dynamicQueryParameter +=
        `,${element[0]}` + `: $` + `${element[0]}` + parameterKey;
    }
    if (Object.keys(filterProperties).length === index + 1) {
      dynamicQueryParameter += ` })`;
    }
  });
  return dynamicQueryParameter;
}

export function filterArrayForEmptyString(array: string[]) {
  let arrayWithoutEmptyString;
  if (array.length > 0) {
    arrayWithoutEmptyString = array.filter((item) => {
      if (item.trim() !== "" || item !== undefined || item !== null) {
        return item;
      }
    });
  } else {
    arrayWithoutEmptyString = [];
  }

  return arrayWithoutEmptyString;
}

export function dynamicOrderByColumnAdder(
  queryNodeName: string,
  orderByColumnArray: string[]
) {
  let orderByArray: string[] = []
  if (typeof orderByColumnArray === 'string') {
    orderByArray.push(orderByColumnArray)
  } else {
    orderByArray = orderByColumnArray
  }
  let optionalLabels = "ORDER BY";
  let uniqueorderByColumnArray = [...new Set(orderByArray)];
  const uniqueorderByColumnArrayWithoutEmptyString = uniqueorderByColumnArray.filter((item) => {
    if (item.trim() !== "") {
      return item;
    }
  });

  if (uniqueorderByColumnArrayWithoutEmptyString && uniqueorderByColumnArrayWithoutEmptyString.length > 0) {
    uniqueorderByColumnArrayWithoutEmptyString.map((item, index) => {
      if (index === 0) {
        optionalLabels = optionalLabels + ` toLower(${queryNodeName}.${item}) `;
      } else {
        optionalLabels = optionalLabels + `, toLower(${queryNodeName}.${item}) `;
      }
    });
  }
  return optionalLabels;
}

