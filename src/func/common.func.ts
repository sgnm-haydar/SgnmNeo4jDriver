import { int } from "neo4j-driver";

//transfer dto(object come from client) properties to specific node entity object
export function assignDtoPropToEntity(entity, dto) {
  Object.keys(dto).forEach((element) => {
    if (
      element != "parentId" &&
      element != "labels" &&
      element != "parentKey"
    ) {
      entity[element] = dto[element];
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

  Object.keys(entity).forEach((element, index) => {
    if (index === 0) {
      dynamicQueryParameter += ` ${element}` + `: $` + `${element}`;
    } else {
      dynamicQueryParameter += `,${element}` + `: $` + `${element}`;
    }
    if (Object.keys(entity).length === index + 1) {
      dynamicQueryParameter += ` }) return node`;
    }
  });

  return dynamicQueryParameter;
}

export function createDynamicCyperObject(entity) {
  const dynamicObject = {};
  Object.keys(entity).forEach((element) => {
    dynamicObject[element] = entity[element];
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

  Object.keys(filterProperties).forEach((element, index) => {
    if (index === 0) {
      dynamicQueryParameter += ` { ${element}` + `: $` + `${element}`;
    } else {
      dynamicQueryParameter += `,${element}` + `: $` + `${element}`;
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

  Object.keys(updateProperties).forEach((element, index) => {
    if (Object.keys(updateProperties).length === index + 1) {
      dynamicQueryParameter +=
        `${queryNodeName}.${element}` + `= $` + `${element}`;
    } else {
      dynamicQueryParameter +=
        `${queryNodeName}.${element}` + `= $` + `${element} ,`;
    }
  });
  return dynamicQueryParameter;
}

export function changeObjectKeyName(obj1: object, addedToKeyString: string="1") {
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
  parameterKey:string='1'
) {
  let dynamicQueryParameter = "";

  Object.keys(updateProperties).forEach((element, index) => {
    if (Object.keys(updateProperties).length === index + 1) {
      dynamicQueryParameter +=
        `${queryNodeName}.${element}` + `= $` + `${element}`+parameterKey;
    } else {
      dynamicQueryParameter +=
        `${queryNodeName}.${element}` + `= $` + `${element}` +parameterKey+`,`;
    }
  });
  return dynamicQueryParameter;
}

export function dynamicFilterPropertiesAdderAndAddParameterKey(filterProperties,parameterKey:string="1") {
  if (!filterProperties || Object.keys(filterProperties).length === 0) {
    return ")";
  }
  let dynamicQueryParameter = "";

  Object.keys(filterProperties).forEach((element, index) => {
    if (index === 0) {
      dynamicQueryParameter += ` { ${element}` + `: $` + `${element}`+parameterKey;
    } else {
      dynamicQueryParameter += `,${element}` + `: $` + `${element}`+parameterKey;
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
