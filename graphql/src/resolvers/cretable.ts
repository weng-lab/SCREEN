import { getCreTable } from '../db/db_cre_table';
import { GraphQLFieldResolver } from 'graphql';
import { parse } from './search';
import { cache, global_data } from '../db/db_cache';
import { UserError } from 'graphql-errors';

const getCtData = (ctvalue, ctmap, r, ctmapkey, rkey) => ctvalue in ctmap[ctmapkey] ? r[rkey][ctmap[ctmapkey][ctvalue] - 1] : undefined;

export function mapcre(assembly, r, ctinfo, ctmap) {
    const geneIDsToApprovedSymbol = cache(assembly).geneIDsToApprovedSymbol;
    const all = r['gene_all_id'].slice(0, 3).map(gid => geneIDsToApprovedSymbol[gid]);
    const pc = r['gene_pc_id'].slice(0, 3).map(gid => geneIDsToApprovedSymbol[gid]);
    const nearbygenes = {
        'all': all,
        'pc': pc,
    };
    const allct = ctinfo.map(ct => {
        const dnase_zscore = getCtData(ct.value, ctmap, r, 'dnase', 'dnase_zscore');
        const promoter_zscore = getCtData(ct.value, ctmap, r, 'promoter', 'promoter_zscore');
        const enhancer_zscore = getCtData(ct.value, ctmap, r, 'enhancer', 'enhancer_zscore');
        const ctcf_zscore = getCtData(ct.value, ctmap, r, 'ctcf', 'ctcf_zscore');
        return ({
            ct: ct.value,
            dnase_zscore,
            promoter_zscore,
            enhancer_zscore,
            ctcf_zscore,
            maxz: Math.max(dnase_zscore || -11, promoter_zscore || -11, enhancer_zscore || -11, ctcf_zscore || -11),
        });
    });
    return {
        assembly,
        ...r,
        chrom: undefined,
        start: undefined,
        end: undefined,
        range: {
            chrom: r.chrom,
            start: r.start,
            end: r.end,
        },
        dnase_zscore: undefined,
        promoter_zscore: undefined,
        enhancer_zscore: undefined,
        ctcf_zscore: undefined,
        allct,
        gene_all_id: undefined,
        gene_pc_id: undefined,
        nearbygenes,
    };
}

async function cre_table(data, assembly, pagination) {
    const c = cache(assembly);
    const results = await getCreTable(assembly, c.ctmap, data, pagination);
    results.cres = results.cres.map(r => mapcre(assembly, r, c.datasets.globalCellTypeInfoArr, c.ctmap));
    results['ct'] = [];
    return results;
}

async function ctspecific(cre, ct) {
    const c = cache(cre.assembly);
    const ctdata = cre.allct.filter(obj => obj.ct === ct);
    if (ctdata.length == 0) {
        throw new UserError(ct, ' does not exist!');
    }
    return ctdata[0];
}

export async function resolve_data(source, inargs, context, info) {
    const assembly = inargs.assembly;
    const data = inargs.data ? inargs.data : {};
    const results = cre_table(data, assembly, inargs.pagination || {});
    return results;
}

export async function resolve_ctspecific(source, inargs) {
    const ct = inargs.cellType;
    if (ct === 'none') return undefined;
    const c = cache(source.assembly);
    source.ct = source.ct || [];
    source.ct.push(c.datasets.byCellTypeValue[ct]);
    return ctspecific(source, ct);
}
