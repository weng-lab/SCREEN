import { getCreTable } from '../db/db_cre_table';
import { GraphQLFieldResolver } from 'graphql';
import { parse } from './search';
import { cache } from '../db/db_cache';
import { UserError } from 'graphql-errors';

async function cre_table(data, assembly, pagination) {
    const c = await cache(assembly);
    const results = await getCreTable(assembly, c, data, pagination);
    return results;
}

export async function resolve_data(source, inargs, context, info) {
    const assembly = inargs.assembly;
    const data = inargs.data ? inargs.data : {};
    const limit = (inargs.pagination && inargs.pagination.limit) || 1000;
    const offset = (inargs.pagination && inargs.pagination.offset) || 0;
    if (limit > 1000) {
        throw new UserError('Cannot have a limit greater than 1000 in pagination parameters.');
    }
    if (offset + limit > 10000) {
        throw new UserError('Offset + limit cannot be greater than 10000. Refine your search for more data.');
    }
    if (limit < 0 || offset < 0) {
        throw new UserError('Offset and limit must both be greater than or equal to 0.');
    }
    const results = cre_table(data, assembly, { ...(inargs.pagination || {}), limit, offset });
    return results;
}

export async function resolve_data_nearbygenes(source, args, context) {
    const assembly = source.assembly;
    const c = await cache(assembly);
    const geneIDsToApprovedSymbol = c.geneIDsToApprovedSymbol;
    const all = source['gene_all_id'].slice(0, 3).map(gid => geneIDsToApprovedSymbol[gid]);
    const pc = source['gene_pc_id'].slice(0, 3).map(gid => geneIDsToApprovedSymbol[gid]);
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

export function resolve_data_ctspecific(source) {
    const { ct, dnase_zscore, promoter_zscore, enhancer_zscore, ctcf_zscore } = source;
    if (!ct) {
        return undefined;
    }
    const maxz = Math.max(dnase_zscore || -11, promoter_zscore || -11, enhancer_zscore || -11, ctcf_zscore || -11);
    return {
        ct,
        dnase_zscore,
        promoter_zscore,
        enhancer_zscore,
        ctcf_zscore,
        maxz,
    };
}
