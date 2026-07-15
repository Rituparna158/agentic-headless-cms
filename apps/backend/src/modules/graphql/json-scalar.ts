import { Kind, type ValueNode } from 'graphql';

/**
 * Pass-through JSON scalar config for `filters`/`data` arguments and
 * `json`-typed fields — avoids pulling in `graphql-type-json` for what's a
 * ~15 line scalar, and keeps full fidelity (no lossy stringify/parse
 * round-trip).
 *
 * Exported as a plain config object, not a constructed `GraphQLScalarType`
 * instance, and consumed via `composer.createScalarTC(jsonScalarConfig)`
 * rather than `composer.add(new GraphQLScalarType(...))`. graphql-compose
 * classifies externally-constructed types by `instanceof` against its own
 * (CJS-required) copy of the `graphql` package's classes; under Vitest,
 * `graphql`'s dual ESM/CJS build gets loaded as two separate module
 * instances — one for our `import ... from 'graphql'`, one for
 * graphql-compose's internal `require('graphql')` — so an object built with
 * "our" `GraphQLScalarType` fails `instanceof` against "their" class even
 * though it's the same package version. Handing graphql-compose a plain
 * config object instead lets it construct the scalar with its own class,
 * sidestepping the mismatch entirely.
 */
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
