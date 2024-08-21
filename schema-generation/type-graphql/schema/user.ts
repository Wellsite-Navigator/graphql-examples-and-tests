import { Field, ObjectType, Query, Resolver, ID } from "type-graphql";
import { users } from "../data";

@ObjectType()
export class User {
  @Field(type => ID)
  id: string;

  @Field(type => String) 
  name: string;
}


@Resolver()
export class UserResolver {
  @Query(returns => [User])
  users(): User[] {
    return users;
  }
}