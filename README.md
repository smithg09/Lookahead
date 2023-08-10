# Lookahead
Look Ahead GraphQL fields with recursive joins (`$lookup`) using Mongo aggregation pipelines for Apollo queries, thus avoiding N+1 problem in GraphQL.
## Future
I am building Version 2 of this library which would allow you to recursively convert Nested GraphQL request into N Level Nested Lookups Queries, Along with support for different stages such as Match, Limit & Sort.
You may wanna look into [mongo-aggregation-builder](https://github.com/smithg09/mongo-aggregation-builder), an easier and readable way of building mongodb aggregation pipelines.   

## Overview

A Apollo/MongoDB based project uses GraphQL resolvers to recursively fetch fields from Mongo collections. This approach is often sufficient in most of the cases, however it suffers from a major issue.
- GraphQL attempts to fetch fields recursively due to which single request can lead to many database requests. It's easy to see how we can quickly reach hundreds of lookups for a single Apollo query.
This issue can be solved by performing a _single_ Mongo aggregation that fetches all the data in one go, performing lookups on the related collections, so that we can then sort or filter on any field in the result.

_lookahead_ does all the heavy lifting for you:

1. It analyses the `resolveInfo` data passed to the top-level resolver in order to extract the hierarchy of
   fields that have been requested. It does this to ensure that it only performs the joins required for the
   actual query.

2. From this information it builds a **single** Mongo aggregation pipeline that recursively performs lookups
   for the other collections used in the request.

   You can then include the pipeline as part of a larger aggregation pipeline that sorts and filters the result.

## Installation

```
npm install lookahead
```

You'll also need to include lookahead's type definition and directive when calling Apollo's `makeExecutableSchema`:

```
import { mergeTypes } from 'merge-graphql-schemas';
import { lookAheadDirective } from 'lookahead';

...


const { lookAheadDirectiveTypeDefs, lookAheadDirectiveTransformer } = lookAheadDirective('lookahead');

let schema = makeExecutableSchema({
  typeDefs: mergeTypes([lookAheadDirectiveTypeDefs, ...yourTypes]),
  resolvers,
});

schema = lookAheadDirectiveTransformer(schema)
```

## Specifying the Joins

lookahead needs to know which fields are joins, and how to join them. In order to make this both easy to specify and declarative,
a custom GraphQL directive, `@lookahead`, is used to specify this information directly in the types declaration. Here's an example:

```
type Company {
  ...
  user: User @lookahead(lookup: { collection: "users", localField: "userId", foreignField: "_id" })
}

type Query {
  ...
  companies: [Company!]!
}
```

## Writing the Resolvers

In your resolvers you'll call `createPipeline` to create the aggregation pipeline:

```
import { createPipeline } from 'lookahead';

...

const companies = (_, { limit = 20 }, context, resolveInfo) => {
  // Create a pipeline to first perform any initial matching, then do the lookups and finally fetch the results
  const pipeline = [
    // Perform any initial matching that you need.
    // This would typically depend on the parameters passed to the query.
    { $match: { type: 'b2b' } }

    // Include all the pipeline stages generated by lookahead to do the lookups
    // We pass `null` since the `users` query is mapped directly to the result
    // of an aggregation on the Users collection.
    ...createPipeline(null, resolveInfo, context),

    // Filter, sort or limit the result.
    { $limit: limit },
  ];

  // How you call Mongo will depend on your code base. You'll need to pass your pipeline to Mongo's aggregate.
  // This is how you'd do it using `mongoose`
  return CompanyCollection.aggregate(pipeline);
});

```
