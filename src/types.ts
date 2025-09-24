// Type system definitions for MTS

// Type variables for polymorphic types
export type TypeVar = {
  kind: "TypeVar";
  id: number;
  name?: string;
};

// Primitive types
export type NumberType = {
  kind: "NumberType";
};

export type StringType = {
  kind: "StringType";
};

export type BooleanType = {
  kind: "BooleanType";
};

export type NullType = {
  kind: "NullType";
};

export type UndefinedType = {
  kind: "UndefinedType";
};

export type UnitType = {
  kind: "UnitType";
};

// Array type
export type ArrayType = {
  kind: "ArrayType";
  elementType: Type;
};

// Dictionary/Map type
export type DictType = {
  kind: "DictType";
  keyType: Type;
  valueType: Type;
};

// Object/Record type
export type ObjectType = {
  kind: "ObjectType";
  fields: Map<string, Type>;
};

// Function type
export type FunctionType = {
  kind: "FunctionType";
  paramTypes: Type[];
  returnType: Type;
};

// Union of all types
export type Type =
  | TypeVar
  | NumberType
  | StringType
  | BooleanType
  | NullType
  | UndefinedType
  | UnitType
  | ArrayType
  | DictType
  | ObjectType
  | FunctionType;

// Type scheme for polymorphic types (forall quantification)
export type TypeScheme = {
  typeVars: TypeVar[];
  type: Type;
};

// Type environment (mapping from variable names to type schemes)
export type TypeEnv = Map<string, TypeScheme>;

// Type substitution (mapping from type variables to types)
export type Substitution = Map<number, Type>;

// Type constraint for unification
export type Constraint = {
  left: Type;
  right: Type;
};

// Helper functions for creating types
let typeVarCounter = 0;

export function freshTypeVar(name?: string): TypeVar {
  return {
    kind: "TypeVar",
    id: typeVarCounter++,
    name,
  };
}

export function numberType(): NumberType {
  return { kind: "NumberType" };
}

export function stringType(): StringType {
  return { kind: "StringType" };
}

export function booleanType(): BooleanType {
  return { kind: "BooleanType" };
}

export function nullType(): NullType {
  return { kind: "NullType" };
}

export function undefinedType(): UndefinedType {
  return { kind: "UndefinedType" };
}

export function unitType(): UnitType {
  return { kind: "UnitType" };
}

export function arrayType(elementType: Type): ArrayType {
  return {
    kind: "ArrayType",
    elementType,
  };
}

export function dictType(keyType: Type, valueType: Type): DictType {
  return {
    kind: "DictType",
    keyType,
    valueType,
  };
}

export function objectType(fields: Map<string, Type>): ObjectType {
  return {
    kind: "ObjectType",
    fields,
  };
}

export function functionType(paramTypes: Type[], returnType: Type): FunctionType {
  return {
    kind: "FunctionType",
    paramTypes,
    returnType,
  };
}

// Apply substitution to a type
export function applySubstitution(sub: Substitution, type: Type): Type {
  switch (type.kind) {
    case "TypeVar":
      return sub.get(type.id) || type;

    case "ArrayType":
      return arrayType(applySubstitution(sub, type.elementType));

    case "DictType":
      return dictType(
        applySubstitution(sub, type.keyType),
        applySubstitution(sub, type.valueType)
      );

    case "ObjectType": {
      const newFields = new Map<string, Type>();
      for (const [key, fieldType] of type.fields) {
        newFields.set(key, applySubstitution(sub, fieldType));
      }
      return objectType(newFields);
    }

    case "FunctionType":
      return functionType(
        type.paramTypes.map((t) => applySubstitution(sub, t)),
        applySubstitution(sub, type.returnType),
      );

    default:
      return type;
  }
}

// Compose two substitutions
export function composeSubstitutions(s1: Substitution, s2: Substitution): Substitution {
  const result = new Map<number, Type>();

  // Apply s1 to all types in s2
  for (const [id, type] of s2) {
    result.set(id, applySubstitution(s1, type));
  }

  // Add mappings from s1 that are not in s2
  for (const [id, type] of s1) {
    if (!result.has(id)) {
      result.set(id, type);
    }
  }

  return result;
}

// Get free type variables in a type
export function freeTypeVars(type: Type): Set<number> {
  switch (type.kind) {
    case "TypeVar":
      return new Set([type.id]);

    case "ArrayType":
      return freeTypeVars(type.elementType);

    case "DictType": {
      const keyFree = freeTypeVars(type.keyType);
      const valueFree = freeTypeVars(type.valueType);
      return new Set([...keyFree, ...valueFree]);
    }

    case "ObjectType": {
      const result = new Set<number>();
      for (const fieldType of type.fields.values()) {
        for (const id of freeTypeVars(fieldType)) {
          result.add(id);
        }
      }
      return result;
    }

    case "FunctionType": {
      const result = new Set<number>();
      for (const paramType of type.paramTypes) {
        for (const id of freeTypeVars(paramType)) {
          result.add(id);
        }
      }
      for (const id of freeTypeVars(type.returnType)) {
        result.add(id);
      }
      return result;
    }

    default:
      return new Set();
  }
}

// Get free type variables in a type scheme
export function freeTypeVarsInScheme(scheme: TypeScheme): Set<number> {
  const free = freeTypeVars(scheme.type);
  for (const typeVar of scheme.typeVars) {
    free.delete(typeVar.id);
  }
  return free;
}

// Get free type variables in a type environment
export function freeTypeVarsInEnv(env: TypeEnv): Set<number> {
  const result = new Set<number>();
  for (const scheme of env.values()) {
    for (const id of freeTypeVarsInScheme(scheme)) {
      result.add(id);
    }
  }
  return result;
}

// Generalize a type to a type scheme
export function generalize(env: TypeEnv, type: Type): TypeScheme {
  const envFree = freeTypeVarsInEnv(env);
  const typeFree = freeTypeVars(type);

  const typeVars: TypeVar[] = [];
  for (const id of typeFree) {
    if (!envFree.has(id)) {
      typeVars.push({ kind: "TypeVar", id });
    }
  }

  return {
    typeVars,
    type,
  };
}

// Instantiate a type scheme with fresh type variables
export function instantiate(scheme: TypeScheme): Type {
  const sub = new Map<number, Type>();

  for (const typeVar of scheme.typeVars) {
    sub.set(typeVar.id, freshTypeVar(typeVar.name));
  }

  return applySubstitution(sub, scheme.type);
}

// Type equality check
export function typesEqual(t1: Type, t2: Type): boolean {
  if (t1.kind !== t2.kind) return false;

  switch (t1.kind) {
    case "TypeVar":
      return t1.id === (t2 as TypeVar).id;

    case "ArrayType":
      return typesEqual(t1.elementType, (t2 as ArrayType).elementType);

    case "DictType": {
      const d2 = t2 as DictType;
      return typesEqual(t1.keyType, d2.keyType) && typesEqual(t1.valueType, d2.valueType);
    }

    case "ObjectType": {
      const o2 = t2 as ObjectType;
      if (t1.fields.size !== o2.fields.size) return false;
      for (const [key, type1] of t1.fields) {
        const type2 = o2.fields.get(key);
        if (!type2 || !typesEqual(type1, type2)) return false;
      }
      return true;
    }

    case "FunctionType": {
      const f2 = t2 as FunctionType;
      if (t1.paramTypes.length !== f2.paramTypes.length) return false;
      for (let i = 0; i < t1.paramTypes.length; i++) {
        if (!typesEqual(t1.paramTypes[i], f2.paramTypes[i])) return false;
      }
      return typesEqual(t1.returnType, f2.returnType);
    }

    default:
      return true;
  }
}

// Type to string (for debugging and error messages)
export function typeToString(type: Type): string {
  switch (type.kind) {
    case "TypeVar":
      return type.name || `T${type.id}`;
    case "NumberType":
      return "number";
    case "StringType":
      return "string";
    case "BooleanType":
      return "boolean";
    case "NullType":
      return "null";
    case "UndefinedType":
      return "undefined";
    case "UnitType":
      return "unit";
    case "ArrayType":
      return `[${typeToString(type.elementType)}]`;
    case "DictType":
      return `[${typeToString(type.keyType)} : ${typeToString(type.valueType)}]`;
    case "ObjectType": {
      const fields = Array.from(type.fields.entries())
        .map(([key, fieldType]) => `${key}: ${typeToString(fieldType)}`)
        .join(", ");
      return `{ ${fields} }`;
    }
    case "FunctionType": {
      const params = type.paramTypes.map(typeToString).join(", ");
      return `(${params}) => ${typeToString(type.returnType)}`;
    }
  }
}
