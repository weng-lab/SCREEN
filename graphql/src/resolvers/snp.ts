import { GraphQLFieldResolver } from 'graphql';
import * as DbSnp from '../db/db_snp';

async function snptable(assembly, range, id) {
    return DbSnp.snptable(assembly, range, id);
}

export const resolve_snps: GraphQLFieldResolver<any, any> = (source, args, context, info) => {
    const assembly = args.assembly;
    const range = args.range;
    const id = args.id;
    return snptable(assembly, range, id);
};
