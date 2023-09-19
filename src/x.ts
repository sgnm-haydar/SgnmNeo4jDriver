
import {
  changeObjectKeyName,
  dynamicFilterPropertiesAdderAndAddParameterKey,
  dynamicLabelAdder,
  filterArrayForEmptyString,
} from "./func/common.func";
import { FilterPropertiesType } from "./constant/filter.properties.type.enum";
const x = (nodes:
  {
    id: number,
    labels: string[],
    filters?: { [key: string]: any },
    relationWithNextNode?: {
      id?: number,
      depth?: string,
      direction?: string,
      name: string,
      filters?:
      {
        [key: string]: any,
      }
    }
  }[]) => {
  const alphabet = Array.from(Array(26)).map((e, i) => i + 65).map((x) => String.fromCharCode(x));
  let cypher = `MATCH`
  let params = []
  let idsHashMap = {}
  let returnItems = []
  nodes.map((node, index) => {
    const isLastNode = nodes.length - 1 === index
    const nodeVariable = alphabet[index]
    const relationVariable = `relation_${alphabet[index]}`
    const hasNodeId = !!node?.id
    const hasRelationId = !!node.relationWithNextNode?.id
    const hasNodeFilter = !!node?.filters
    const hasRelationsFilter = !!node.relationWithNextNode?.filters
    const labelsString = dynamicLabelAdder(filterArrayForEmptyString(node.labels))
    if (hasNodeId) idsHashMap[nodeVariable] = node.id
    if (hasRelationId) idsHashMap[relationVariable] = node.relationWithNextNode.id
    const propertiesString = hasNodeFilter ? dynamicFilterPropertiesAdderAndAddParameterKey(node?.filters, FilterPropertiesType.NODE, `${nodeVariable}_${index}`) : ''
    const relationProperties = hasRelationsFilter ? dynamicFilterPropertiesAdderAndAddParameterKey(node.relationWithNextNode?.filters, FilterPropertiesType.RELATION, `${relationVariable}_${index}`) : ''


    cypher = cypher + '(' + nodeVariable + labelsString + propertiesString
    if (!!node?.relationWithNextNode) {
      cypher = cypher + `${node.relationWithNextNode.direction === 'IN' ? '<' : ''}` +
        `-[${relationVariable}:${node.relationWithNextNode.name}*1` +
        `..${node.relationWithNextNode?.depth ?? ''}${relationProperties}]-${node.relationWithNextNode.direction === 'OUT' ? '>' : ''}`
    }
    if (hasNodeFilter) params.push(changeObjectKeyName(node.filters, `${nodeVariable}_${index}`));
    if (hasRelationsFilter) params.push(changeObjectKeyName(node.relationWithNextNode.filters, `${relationVariable}_${index}`));
    if (isLastNode) cypher = cypher + ') '
    returnItems.push({
      nodeVariable,
      nodeAs: node.labels.join('_') + '_node',
      ...(!!node?.relationWithNextNode && { relationAs: node.labels.join('_') + '_relation' }),
      ...(!!node?.relationWithNextNode && { relationVariable })
    });
  })
  cypher = cypher + ' '
  if (Object.keys(idsHashMap).length > 0) {
    cypher = cypher + 'WHERE ('

    let IDConditions = '';
    Object.keys(idsHashMap).map((variable, index) => {
      const isLast = index === Object.keys(idsHashMap).length - 1
      IDConditions = IDConditions + `id(${variable}) = ${idsHashMap[variable]}`
      if (!isLast) IDConditions = IDConditions + ' AND '
    })
    cypher = cypher + IDConditions + ')'

    cypher = cypher + ' Return ' + returnItems.map((item, index) => {
      let returnValue = ''
      returnValue = returnValue + item.nodeVariable + ' As ' + item.nodeAs
      if (!!item.relationVariable) returnValue = returnValue + ', ' + item.relationVariable + ' As ' + item.relationAs
      returnValue = returnValue + (returnItems.length - 1 === index ? '' : ', ')
      return returnValue
    }).join(' ')

  }
  return {
    params: Object.assign({}, ...params),
    cypher
  }
}

console.log(x([
  {
    id: 1,
    labels: ['aa'],
    filters: {
      aaaa: 'aaa'
    },
    relationWithNextNode: {
      name: 'REAL',
      direction: 'OUT',
      filters: {
        sdfsdf: ['ew']
      }
    }
  },
  {
    id: 22,
    labels: ['fwef'],
    filters: {
      xxx: 'sdd'
    },
    relationWithNextNode: {
      name: 'REAL',
      direction: 'IN',
      filters: {
        x: false
      }
    }
  }, {
    id: 1,
    labels: ['efwf'],
    filters: {
      tesx: 'wtf'
    },
    relationWithNextNode: {
      name: 'REAL',
      direction: 'OUT',
      filters: {
        test: ['x']
      }
    }
  },
  {
    id: 22,
    labels: ['xa'],
    filters: {
      tesx: 'wtf'
    },
    relationWithNextNode: {
      name: 'REAL',
      direction: 'IN',
      filters: {
        x: false
      }
    }
  },
  {
    id: 1,
    labels: ['AA'],

  }
])
)