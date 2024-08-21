import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import DataLoader from 'dataloader';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';

const users = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
];

const posts = [
  { id: '1', title: 'Post 1', authorId: '1', editorId: '2' },
  { id: '2', title: 'Post 2', authorId: '1', editorId: '1' },
  { id: '3', title: 'Post 3', authorId: '2', editorId: '1' },
];

const dbMock  = {
  users: {
    getByIds: async (ids) => users.filter(user => ids.includes(user.id)),
  },
};

const typeDefs = `
  directive @fk(field: String!) on FIELD_DEFINITION

  type User {
    id: ID!
    name: String!
  }

  type Post {
    id: ID!
    title: String!
    author: User! @fk(field: "authorId")
    editor: User! @fk(field: "editorId")
  }

  type Query {
    posts: [Post!]!
    users: [User!]!
  }
`;

const resolvers = {
  Query: {
    posts: () => posts,
    users: () => users,
  },
};

const createDataLoaders = () => ({
  User: new DataLoader(dbMock.users.getByIds),
});

// Schema transformation to apply the @fk directive
function applyFkDirective(schema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const fkDirective = getDirective(schema, fieldConfig, 'fk')?.[0];
      if (fkDirective) {
        fieldConfig.extensions = {
          ...fieldConfig.extensions,
          fkField: fkDirective.field,
        };
      }
      return fieldConfig;
    },
  });
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
const schemaWithDirectives = applyFkDirective(schema);

const server = new ApolloServer({
  schema: schemaWithDirectives,
  fieldResolver: (source, _, context: any, info: any) => {
    const relationName = info.returnType.ofType.name;
    const dataLoader = context.dataloaders[relationName];
    const fieldName = info.parentType.getFields()[info.fieldName].extensions?.fkField as string;
    return dataLoader && fieldName && source[fieldName] ? dataLoader?.load(source[fieldName]) : source[info.fieldName];
  },
});

async function startServer() {
  const { url } = await startStandaloneServer(server, {
    context: async () => ({
      dataloaders: createDataLoaders(),
    }),
  });

  console.log(`🚀 Server ready at ${url}`);
}

startServer();
