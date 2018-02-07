import { GraphQLFieldResolver } from 'graphql';
import { global_data_global, global_data } from '../db/db_cache';

export const resolve_globals: GraphQLFieldResolver<any, any> = (source, args, context) => {
    return global_data_global();
};

export const resolve_globals_assembly: GraphQLFieldResolver<any, any> = (source, args, context) => {
    const assembly = args.assembly;
    return global_data(assembly);
};
