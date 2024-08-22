import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import DataLoader from 'dataloader';

// Hardcoded Data
const users = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
];

const posts = [
  { id: '1', title: 'Post 1' },
  { id: '2', title: 'Post 2' },
  { id: '3', title: 'Post 3' },
];

const userPosts = [
  { userId: '1', postId: '1' },
  { userId: '1', postId: '2' },
  { userId: '2', postId: '2' },
  { userId: '2', postId: '3' },
];

const dbMock = {
  users: {
    getByIds: async (ids) => {
      console.log('Fetching users with ids:', ids);
      return users.filter(user => ids.includes(user.id));
    },
  },
  posts: {
    getByIds: async (ids) => {
      console.log('Fetching posts with ids:', ids);
      return posts.filter(post => ids.includes(post.id));
    },
  },
  userPosts: {
    getByPostIds: async (postIds) => {
      console.log('Fetching userPosts with postIds:', postIds);
      return userPosts.filter(up => postIds.includes(up.postId));
    },
    getByUserIds: async (userIds) => {
      console.log('Fetching userPosts with userIds:', userIds);
      return userPosts.filter(up => userIds.includes(up.userId));
    }
  }
};

// Type Definitions
const typeDefs = `
  type User {
    id: ID!
    name: String!
    posts: [Post!]!
  }

  type Post {
    id: ID!
    title: String!
    authors: [User!]!
  }

  type Query {
    posts: [Post!]!
    users: [User!]!
  }
`;

const createLoaders = () => ({
  user: new DataLoader(dbMock.users.getByIds),
  post: new DataLoader(dbMock.posts.getByIds),
  userPostsByPost: new DataLoader(async (postIds) => {
    const links = await dbMock.userPosts.getByPostIds(postIds);
    return postIds.map(postId => links.filter(link => link.postId === postId));
  }),
  userPostsByUser: new DataLoader(async (userIds) => {
    const links = await dbMock.userPosts.getByUserIds(userIds);
    return userIds.map(userId => links.filter(link => link.userId === userId));
  }),
});

// Resolvers
const resolvers = {
  Query: {
    posts: () => posts,
    users: () => users,
  },
  Post: {
    authors: async (post, _, { loaders }) => {
      const userPostLinks = await loaders.userPostsByPost.load(post.id);
      const userIds = userPostLinks.map(link => link.userId);
      return loaders.user.loadMany(userIds);
    },
  },
  User: {
    posts: async (user, _, { loaders }) => {
      const userPostLinks = await loaders.userPostsByUser.load(user.id);
      const postIds = userPostLinks.map(link => link.postId);
      return loaders.post.loadMany(postIds);
    },
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
