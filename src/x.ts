
import {
    changeObjectKeyName,
    dynamicFilterPropertiesAdderAndAddParameterKey,
    dynamicLabelAdder,
    dynamicOrLabelAdder,
    filterArrayForEmptyString,
} from "./func/common.func";
import { FilterPropertiesType } from "./constant/filter.properties.type.enum";
import { IFindMultipleNodesWithFiltersAndId } from "./interfaces/neo4j.service";
const x = (nodes:
    IFindMultipleNodesWithFiltersAndId[]) => {
  
}

console.log(x([
    {
        id: 1,
        andLabels: ['aa'],
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
        orLabels: ['fwef', 'hey', 'teacher', 'we_dont', 'need_no_education'],
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
        andLabels: ['efwf'],
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
        orLabels: ['xa'],
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
        andLabels: ['AA'],
    }
])
)