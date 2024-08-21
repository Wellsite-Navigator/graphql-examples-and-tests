import { Ctx, Field, FieldResolver, ObjectType, Query, Resolver, Root, ID } from "type-graphql";
import { posts } from "../data";
import { User } from "./user";

@ObjectType()
export class Post {
  @Field(type => ID)
  id: string;

  @Field(type => String) 
  title: string;

  @Field(type => String) 
  authorId: string;

  @Field(type => String) 
  editorId: string;
}

@Resolver(of => Post)
export class PostResolver {
  @Query(returns => [Post])
  posts(): Post[] {
    return posts;
  }

  @FieldResolver(returns => User)
  author(@Root() post: Post, @Ctx() context: any): Promise<User> {
    return context.loaders.user.load(post.authorId);
  }

  @FieldResolver(returns => User)
  editor(@Root() post: Post, @Ctx() context: any): Promise<User> {
    return context.loaders.user.load(post.editorId);
  }
}