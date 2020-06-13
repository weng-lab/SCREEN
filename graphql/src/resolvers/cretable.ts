import { getCreTable, dbcre } from '../db/db_cre_table';
import { loadCache, ccRECtspecificLoaders } from '../db/db_cache';
import { Assembly, ChromRange, Resolver } from '../types';
import { CREDetails, resolve_details } from './credetails';
import { cleanBiosampleName } from '../utils';

type cCREs_args = {
    assembly: Assembly;
    accessions?: string[];
    range?: ChromRange;
    expmaxs?: any;
    ctexps?: any;
    pagination?: any;
};
export const resolve_ccres: Resolver<cCREs_args> = async (_, args): Promise<{ ccres: dbcre[]; total: number }> => {
    const assembly = args.assembly;
    const limit = args.pagination?.limit ?? 1000;
    const offset = args.pagination?.offset ?? 0;
    if (limit > 1000) {
        throw new Error('Cannot have a limit greater than 1000 in pagination parameters.');
    }
    if (offset + limit > 10000) {
        throw new Error('Offset + limit cannot be greater than 10000. Refine your search for more data.');
    }
    if (limit < 0 || offset < 0) {
        throw new Error('Offset and limit must both be greater than or equal to 0.');
    }

    const ctmap = await loadCache(assembly).ctmap();
    const results = await getCreTable(assembly, ctmap, args, { ...args.pagination, limit, offset });
    return results;
};

export async function resolve_data_nearbygenes(source: dbcre) {
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
    const assembly: Assembly = source.assembly.toLowerCase();
    const accession: string = source.accession;
    // TODO: should really verify cell type exists first
    const ct: string = cleanBiosampleName(args.ct);
    return ccRECtspecificLoaders[assembly].load(`${accession}::${ct}`);
}

export const cCREResolvers = {
    cCRE: {
        range: resolve_data_range,
        ctspecific: resolve_data_ctspecific,
        nearbygenes: resolve_data_nearbygenes,
        details: resolve_details,
    },
};
