import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import DataLoader from 'dataloader';

// Hardcoded Data
const users = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
];

const posts = [
  { id: '1', title: 'Post 1', authorId: '1', editorId: '2' },
  { id: '2', title: 'Post 2', authorId: '1', editorId: '2' },
  { id: '3', title: 'Post 3', authorId: '1', editorId: '2' },
];

const dbMock  = {
    users: {
      getByIds: async (ids) => {
        console.log('Fetching users with ids:', ids);
        return users.filter(user => ids.includes(user.id))
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

// Resolvers
const resolvers = {
  Query: {
    posts: () => posts, 
    users: () => users,
  },
  Post: {
    author: (post, _, { loaders }) => loaders.user.load(post.authorId),
    editor: (post, _, { loaders }) => loaders.user.load(post.editorId),
  },
}
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
