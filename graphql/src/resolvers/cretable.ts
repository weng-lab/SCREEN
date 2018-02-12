import { getCreTable } from '../db/db_cre_table';
import { GraphQLFieldResolver } from 'graphql';
import { parse } from './search';
import { cache } from '../db/db_cache';

export function mapcre(assembly, r) {
    const geneIDsToApprovedSymbol = cache(assembly).geneIDsToApprovedSymbol;
    const all = r['gene_all_id'].slice(0, 3).map(gid => geneIDsToApprovedSymbol[gid]);
    const pc = r['gene_pc_id'].slice(0, 3).map(gid => geneIDsToApprovedSymbol[gid]);
    const nearbygenes = {
        'all': all,
        'pc': pc,
    };
    return {
        assembly,
        ...r,
        ctspecific: Object.keys(r.ctspecific || {}).length > 0 ? r.ctspecific : undefined,
        gene_all_id: undefined,
        gene_pc_id: undefined,
        nearbygenes,
    };
}

async function cre_table(data, assembly, pagination) {
    const c = cache(assembly);
    const results = await getCreTable(assembly, c.ctmap, data, pagination);

    results.cres = results.cres.map(r => mapcre(assembly, r));
    if ('cellType' in data && data['cellType']) {
        results['ct'] = c.datasets.byCellTypeValue[data.cellType];
    }
    return results;
}

export async function resolve_data(source, inargs, context) {
    const assembly = inargs.assembly;
    const data = inargs.data ? inargs.data : {};
    const results = cre_table(data, assembly, inargs.pagination || {});
    return results;
}
