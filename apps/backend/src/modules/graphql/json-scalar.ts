import { Kind, type ValueNode } from 'graphql';

// Pass-through JSON scalar
export const jsonScalarConfig = {
  name: 'JSON',
  description: 'Arbitrary JSON value.',
  serialize: (value: unknown) => value,
  parseValue: (value: unknown) => value,
  parseLiteral,
};

function parseLiteral(node: ValueNode): unknown {
  switch (node.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return node.value;
    case Kind.INT:
    case Kind.FLOAT:
      return Number(node.value);
    case Kind.OBJECT:
      return Object.fromEntries(
        node.fields.map((field) => [
          field.name.value,
          parseLiteral(field.value),
        ]),
      );
    case Kind.LIST:
      return node.values.map(parseLiteral);
    case Kind.NULL:
      return null;
    default:
      return undefined;
  }
}
