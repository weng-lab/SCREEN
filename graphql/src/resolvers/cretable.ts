import { chroms } from '../constants';
import { getCreTable, rfacets_active } from '../db/db_cre_table';
import { GraphQLFieldResolver } from 'graphql';

const assemblies = ['hg19', 'mm10'];
const checkAssembly = (j) => {
    const assembly = j['assembly'];
    if (!assembly) {
      throw new Error('assembly not defined');
    }
    if (!(assembly in assemblies)) {
        throw new Error('invalid assembly ' + assembly);
    }
    return assembly;
};

const checkChrom = (assembly, chrom) => {
    const achroms = chroms[assembly];
    if (!achroms.includes(chrom)) {
        throw new Error('unknown chrom ' + chrom);
    }
    return chrom;
};

const cache = require('../db/db_cache').cache;
async function cre_table(data, assembly, chrom, start, end) {
    const c = cache(assembly);
    const results = await getCreTable(assembly, c.ctmap, data, chrom, start, end);
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
                ctspecifc: r.ctspecifc,
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

export const resolve_data: GraphQLFieldResolver<any, any> = (source, args, context) => {
    const assembly = args.search.assembly;
    // TODO: first do search if q
    const chrom = args.data.range && checkChrom(assembly, args.data.range.chrom);
    const start = args.data.range && args.data.range.start;
    const end = args.data.range && args.data.range.end;
    const results = cre_table(args.data, assembly, chrom, start, end);
    return results;
};
