const { ApolloServer } = require("apollo-server");
const { mergeTypes } = require("merge-graphql-schemas");
const { gql } = require("apollo-server");
const { lookAheadDirective } = require('./types');
const createPipeline = require("./create-pipeline");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { lookAheadDirectiveTypeDefs, lookAheadDirectiveTransformer } =
  lookAheadDirective('lookahead');
const AggregationController = require('./pipeline-builder-v2');

const typeDefs = gql`
  type NewUser {
    id: Int
    name: String
  }
  type User {
    id: Int!
    name: String!
    email: String!
    meta: [NewUser]! @lookahead(lookup: { collection: "newusers", localField: "id", foreignField: "_id" })
  }

  type Query {
    me(id: Int!): User
  }
`;

const resolvers = {
    Query: {
        async me(root, { id }, context, resolveInfo) {
            const pipeline = [
                { $match: { id } },
                ...createPipeline(null, resolveInfo, context),
            ];
            // const aggregationController = new AggregationController({ typeName: 'User', info: resolveInfo});
            // const { pipelineStages: aggregationQuery } =
            //   await aggregationController.constructQuery({
            //     filters: { id },
            //     limit: 1000,
            //     skip: 0,
            //     sort: null,
            //   });
            // console.log(JSON.stringify(pipelineStages, null, 2));
            return {
                id,
                name: "Robin Wieruch",
                email: "robin@gmail.com",
            }
        },
    },
}

let schema = makeExecutableSchema({
  typeDefs: mergeTypes([lookAheadDirectiveTypeDefs, typeDefs]),
  resolvers,
});

schema = lookAheadDirectiveTransformer(schema);

const server = new ApolloServer({
  schema,
  context:{
    context: true,
  }
});

server
  .listen()
  .then(({ url }) => console.log("Server is running on localhost:4000"));
