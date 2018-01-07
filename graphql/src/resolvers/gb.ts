import { GraphQLFieldResolver } from 'graphql';
import * as DbGb from '../db/db_gb';

const cache = require('../db/db_cache').cache;

async function genetable(assembly, range) {
    return DbGb.genetable(assembly, range.chrom, range.start, range.end);
}

async function trackhubs(assembly) {
    return [];
}

export const resolve_gb_genetable: GraphQLFieldResolver<any, any> = (source, args, context, info) => {
    const assembly = source.assembly;
    const range = args.range;
    return genetable(assembly, range);
};

export const resolve_gb_trackhubs: GraphQLFieldResolver<any, any> = (source, args, context, info) => {
    const assembly = source.assembly;
    return trackhubs(assembly);
};

export const resolve_gb: GraphQLFieldResolver<any, any> = (source, args, context, info) => {
    const assembly = args.assembly;
    return { assembly };
};
