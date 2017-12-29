import { GraphQLFieldResolver } from 'graphql';

const global_data = require('../db/db_cache').global_data;
export const resolve_globals: GraphQLFieldResolver<any, any> = (source, args, context) => {
    const assembly = args.assembly;
    return global_data(assembly);
};
