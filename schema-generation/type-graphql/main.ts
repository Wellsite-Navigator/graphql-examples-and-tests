import "reflect-metadata";
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSchema } from "type-graphql";
import DataLoader from 'dataloader';
import { users } from "./data";
import { UserResolver } from "./schema/user";
import { PostResolver } from "./schema/post";

const dbMock  = {
    users: {
      getByIds: async (ids: readonly string[]) => {
        console.log('Fetching users with ids:', ids);
        return users.filter(user => ids.includes(user.id));
      },
    },
};

function createLoaders() {
  return {
    user: new DataLoader(dbMock.users.getByIds),
  };
}

async function startServer() {
  const schema = await buildSchema({
    resolvers: [UserResolver, PostResolver],
  });

  const server = new ApolloServer({
    schema,
  });

  const { url } = await startStandaloneServer(server, {
    context: async () => ({
      loaders: createLoaders(),
    }),
  });

  console.log(`🚀 Server ready at ${url}`);
}

startServer();
