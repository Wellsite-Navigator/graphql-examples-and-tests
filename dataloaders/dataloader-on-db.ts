import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import DataLoader from 'dataloader';
import { GraphQLResolveInfo } from 'graphql';

// Hardcoded Data
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
      getByIds: async (ids) => {
        console.log('Fetching users with ids:', ids);
        return users.filter(user => ids.includes(user.id));
      },
    },
};

// Type Definitions
const typeDefs = `
  type User {
    id: ID!
    name: String!
  }

  type Post {
    id: ID!
    title: String!
    author: User!
    editor: User!
  }

  type Query {
    posts: [Post!]!
    users: [User!]!
  }
`;

const createLoaders = () => ({
  user: new DataLoader(dbMock.users.getByIds),
});

// Utility function to check requested fields
const isFieldRequested = (info, fieldName) => {
  const fieldNode = info.fieldNodes[0];
  const selectionSet = fieldNode.selectionSet;
  return selectionSet.selections.some(selection => selection.name.value === fieldName);
};

// Resolvers
const resolvers = {
  Query: {
    posts: (_parent, _args, context, info: GraphQLResolveInfo) => {
      const authorRequested = isFieldRequested(info, 'author');
      const editorRequested = isFieldRequested(info, 'editor');

      console.log('Author requested:', authorRequested);
      console.log('Editor requested:', editorRequested);

      return posts.map(post => {
        const result: Record<string, unknown> = {...post};
        if (authorRequested) {
          result.author = context.loaders.user.load(post.authorId);
        }
        if (editorRequested) {
          result.editor = context.loaders.user.load(post.editorId);
        }
        return result;
      });
    },
    users: () => users,
  },
};

// Apollo Server Setup
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

async function startServer() {
  const { url } = await startStandaloneServer(server, {
    context: async () => ({
      loaders: createLoaders(),
    }),
  });

  console.log(`🚀 Server ready at ${url}`);
}

startServer();
