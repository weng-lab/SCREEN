import { getCreTable } from '../db/db_cre_table';
import { GraphQLFieldResolver } from 'graphql';
import { parse } from './search';
import { loadCache, ccRECtspecificLoaders } from '../db/db_cache';
import { UserInputError } from 'apollo-server-express';
import { Assembly } from '../types';
import { CREDetails } from './credetails';

async function cre_table(data, assembly, pagination) {
    const ctmap = await loadCache(assembly).ctmap();
    const results = await getCreTable(assembly, ctmap, data, pagination);
    return {
        total: results.total,
        ccREs: results.cres,
    };
}

export async function resolve_data(source, inargs, context, info) {
    const assembly = inargs.assembly;
    const data = inargs.data ? inargs.data : {};
    const limit = (inargs.pagination && inargs.pagination.limit) || 1000;
    const offset = (inargs.pagination && inargs.pagination.offset) || 0;
    if (limit > 1000) {
        throw new UserInputError('Cannot have a limit greater than 1000 in pagination parameters.');
    }
    if (offset + limit > 10000) {
        throw new UserInputError('Offset + limit cannot be greater than 10000. Refine your search for more data.');
    }
    if (limit < 0 || offset < 0) {
        throw new UserInputError('Offset and limit must both be greater than or equal to 0.');
    }
    const results = cre_table(data, assembly, { ...(inargs.pagination || {}), limit, offset });
    return results;
}

export async function resolve_data_nearbygenes(source, args, context) {
    const assembly: Assembly = source.assembly;
    const accession: string = source.accession;
    const cre = new CREDetails(assembly, accession);
    const nearby = await cre.nearbyGenes();
    const all = nearby.slice(0, 3);
    const pc = nearby.filter(gene => gene.pc).slice(0, 3);
    return {
        all,
        pc,
    };
}

export function resolve_data_range(source) {
    const { chrom, start, end } = source;
    return {
        chrom,
        start,
        end,
    };
}

export function resolve_data_ctspecific(source, args) {
    const assembly: Assembly = source.assembly;
    const accession: string = source.accession;
    const ct: string = args.ct;
    return ccRECtspecificLoaders[assembly].load(`${accession}::${ct}`);
}
