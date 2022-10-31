
import { CustomClassificationError } from "./import-export.error.enum";
import { errorObject } from "../interfaces/errorMessage.interface";


export const classification_import_error_object:errorObject ={
      message: 'error',
      code: CustomClassificationError.CLASSIFICATION_IMPORT_ERROR,
}

  export const classification_already_exist_object: errorObject ={
      message: 'error',
      code: CustomClassificationError.CLASSIFICATION_ALREADY_EXIST,
}


export const floor_already_exist_object: errorObject ={
      message: 'error',
      code: CustomClassificationError.FLOOR_ALREADY_EXIST
}

export const building_already_exist_object: errorObject={
      message: 'error',
      code: CustomClassificationError.BUILDING_ALREADY_EXIST
}

export const space_already_exist_object: errorObject={
      message: 'error',
      code: CustomClassificationError.SPACE_ALREADY_EXIST,
}


export const zone_already_exist_object: errorObject ={
      message: 'error',
      code: CustomClassificationError.ZONE_ALREADY_EXIST,
}
  
export const space_has_already_relation_object: errorObject ={
      message: 'error',
      code: CustomClassificationError.SPACE_HAS_ALREADY_RELATION,
}

export const  contact_already_exist_object: errorObject ={
      message: 'error',
      code: CustomClassificationError.CONTACT_ALREADY_EXIST,
}

export const  there_are_no_spaces_object: errorObject ={
      message: 'error',
      code: CustomClassificationError.THERE_ARE_NO_SPACES,
}

export const  there_are_no_jointSpaces_object:errorObject= {
      message: 'error',
      code: CustomClassificationError.THERE_ARE_NO_JOINTSPACES,
}

export const  there_are_no_zones_object:errorObject= {
      message: 'error',
      code: CustomClassificationError.THERE_ARE_NO_ZONES,
}

export const  type_already_exists_object:errorObject= {
      message: 'error',
      code: CustomClassificationError.TYPE_ALREADY_EXISTS,
}

export const  component_already_exists_object:errorObject= {
      message: 'error',
      code: CustomClassificationError.COMPONENT_ALREADY_EXISTS,
}


export const  component_already_exist_inside_a_system_object:errorObject= {
      message: 'error',
      code: CustomClassificationError.COMPONENT_ALREADY_EXIST_INSIDE_A_SYSTEM,
}

export const  there_are_no_contacts_object:errorObject= {
    message: 'error',
    code: CustomClassificationError.THERE_ARE_NO_CONTACTS,
}

export const  there_are_no_system_or_component_or_both_object:errorObject= {
    message: 'error',
    code: CustomClassificationError.THERE_ARE_NO_SYSTEM_OR_COMPONENT_OR_BOTH,
}

export const  there_are_no_type_or_component_or_type_id_is_wrong_object:errorObject= {
    message: 'error',
    code: CustomClassificationError.THERE_ARE_NO_TYPE_OR_COMPONENT_OR_TYPE_ID_IS_WRONG,
}


