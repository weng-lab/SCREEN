import { getCreTable, rfacets_active } from '../db/db_cre_table';
import { GraphQLFieldResolver } from 'graphql';
import { parse } from './search';

export function mapcre(assembly, r, geneIDsToApprovedSymbol) {
    const all = r['gene_all_id'].slice(0, 3).map(gid => geneIDsToApprovedSymbol[gid]);
    const pc = r['gene_pc_id'].slice(0, 3).map(gid => geneIDsToApprovedSymbol[gid]);
    const nearbygenes = {
        'all': all,
        'pc': pc,
    };
    return {
        assembly,
        ...r,
        ctspecific: Object.keys(r.ctspecific).length > 0 ? r.ctspecific : undefined,
        gene_all_id: undefined,
        gene_pc_id: undefined,
        nearbygenes,
    };
}

const cache = require('../db/db_cache').cache;
async function cre_table(data, assembly, pagination) {
    const c = cache(assembly);
    const results = await getCreTable(assembly, c.ctmap, data, pagination);
    const lookup = c.geneIDsToApprovedSymbol;

    results.cres = results.cres.map(r => mapcre(assembly, r, lookup));
    if ('cellType' in data && data['cellType']) {
        results['rfacets'] = rfacets_active(c.ctmap, data);
    } else {
        results['rfacets'] = ['dnase', 'promoter', 'enhancer', 'ctcf'];
    }
    return results;
}

export async function resolve_data(source, inargs, context) {
    const assembly = inargs.assembly;
    const data = inargs.data ? inargs.data : {};
    const results = cre_table(data, assembly, inargs.pagination || {});
    return results;
}
