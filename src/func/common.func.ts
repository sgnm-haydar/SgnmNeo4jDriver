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
  let optionalLabels = "";

  if (labels && labels.length > 0) {
    labels.map((item) => {
      console.log(item);
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
  let optionalLabels = '';

  if (labels && labels.length > 0) {
    labels.map((item) => {
      if (item.trim() === '') {
        optionalLabels = optionalLabels;
      } else {
        optionalLabels = optionalLabels + ':' + item;
      }
    });
  }
  return optionalLabels;
}

export function dynamicNotLabelAdder(notLabels: Array<string>) {
  let optionalLabels = '';
  const notLabelsWithoutEmptyString = notLabels.filter((item) => {
    if (item.trim() !== '') {
      return item;
    }
  });

  if (notLabelsWithoutEmptyString && notLabelsWithoutEmptyString.length > 0) {
    notLabelsWithoutEmptyString.map((item, index) => {
      if (index === 0) {
        optionalLabels = optionalLabels + `not n:${item} `;
      } else {
        optionalLabels = optionalLabels + `and not n:${item} `;
      }
    });
  }
  return optionalLabels;
}

export function dynamicFilterPropertiesAdder(filterProperties) {
  if (!filterProperties || Object.keys(filterProperties).length === 0) {
    return ')';
  }
  let dynamicQueryParameter = '';

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

export function dynamicUpdatePropertyAdder(updateProperties: object) {
  let dynamicQueryParameter = '';

  Object.keys(updateProperties).forEach((element, index) => {
    if (Object.keys(updateProperties).length === index + 1) {
      dynamicQueryParameter += `n.${element}` + `= $` + `${element}`;
    } else {
      dynamicQueryParameter += `n.${element}` + `= $` + `${element} ,`;
    }
  });
  return dynamicQueryParameter;
}
