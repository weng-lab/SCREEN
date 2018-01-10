import { getCreTable, rfacets_active } from '../db/db_cre_table';
import { GraphQLFieldResolver } from 'graphql';
import { parse } from './search';

const cache = require('../db/db_cache').cache;
async function cre_table(data, assembly, pagination) {
    const c = cache(assembly);
    const results = await getCreTable(assembly, c.ctmap, data, pagination);
    const lookup = c.geneIDsToApprovedSymbol;

    results.cres = results.cres.map(r => {
        const all = r['gene_all_id'].slice(0, 2).map(gid => lookup[gid]);
        const pc = r['gene_pc_id'].slice(0, 2).map(gid => lookup[gid]);
        const genesallpc = {
            'all': all,
            'pc': pc,
        };
        return {
            info: r.info,
            data: {
                range: r.chrom ? {
                    chrom: r.chrom,
                    start: r.start,
                    end: r.stop,
                } : undefined,
                maxz: r.maxz,
                ctcf_zscore: r.ctcf_zscore,
                ctspecific: r.ctspecific,
                enhancer_zscore: r.enhancer_zscore,
                promoter_zscore: r.promoter_zscore,
                genesallpc: genesallpc,
                dnase_zscore: r.dnase_zscore,
            }
        };
    });
    if ('cellType' in data && data['cellType']) {
        results['rfacets'] = rfacets_active(c.ctmap, data);
    } else {
        results['rfacets'] = ['dnase', 'promoter', 'enhancer', 'ctcf'];
    }
    return results;
}

export async function resolve_data(source, inargs, context) {
    const assembly = inargs.assembly;
    const searchResponse = inargs.search ? await parse(assembly, inargs.search) : {};
    const data = inargs.data ? inargs.data : {};
    const args = { ...searchResponse, ...data };
    const results = cre_table(args, assembly, inargs.pagination || {});
    return results;
}
