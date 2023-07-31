const { mapSchema, getDirective, MapperKind } = require('@graphql-tools/utils');
const gql = require('graphql-tag');

const lookAheadTypes = gql`
  input LookAheadLookup {
    collection: String!
    localField: String!
    foreignField: String!
    preserveNull: Boolean
    conds: String
    sort: String
    limit: Int
  }

  directive @lookahead(
    lookup: LookAheadLookup
    compose: [String!]
    expr: String
  ) on FIELD_DEFINITION
`;

function lookAheadDirective(directiveName = "lookahead") {
  return {
    lookAheadDirectiveTypeDefs: `
      input LookAheadLookup {
        collection: String!
        localField: String!
        foreignField: String!
        preserveNull: Boolean
        conds: String
        sort: String
        limit: Int
      }
    
      directive @${directiveName}(lookup: LookAheadLookup, compose: [String!], expr: String) on FIELD_DEFINITION
    `,

    lookAheadDirectiveTransformer: (schema) =>
      mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig, _fieldName, typeName) => {
          const lookAheadDirective = getDirective(
            schema,
            fieldConfig,
            "lookahead"
          )?.[0];
          if (lookAheadDirective) {
            fieldConfig.astNode.lookahead = lookAheadDirective;
          }
          return fieldConfig;
        },
      }),
  };
}

module.exports = {
  lookAheadDirective,
};
