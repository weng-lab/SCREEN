import { GraphQLFieldResolver } from 'graphql';
import * as Common from '../db/db_common';
import * as DbGene from '../db/db_geneexp';

import { loadCache, Compartments } from '../db/db_cache';
import { Assembly } from '../types';
import { UserError } from 'graphql-errors';

type GeneExpArgs = {
    assembly: Assembly;
    gene: string | null;
    biosample: string | null;
    biosample_types: string[] | null;
    compartments: string[] | null;
    experimentaccession: string | null;
    normalized: boolean | null;
    pconly: boolean | null;
    nomitochondrial: boolean | null;
};
export const resolve_geneexp: GraphQLFieldResolver<any, any, GeneExpArgs> = async (source, args, context) => {
    const assembly = args.assembly;
    const gene = args.gene;
    const biosample = args.biosample;
    let biosample_types = args.biosample_types;
    let compartments = args.compartments;
    const experimentaccession = args.experimentaccession;
    const normalized = typeof args.normalized === 'boolean' ? args.normalized : false;
    const pconly = typeof args.pconly === 'boolean' ? args.pconly : false;
    const nomitochondrial = typeof args.nomitochondrial === 'boolean' ? args.nomitochondrial : false;

    if (!gene && !biosample && !experimentaccession) {
        throw new UserError('Must include either gene, biosample, or experimentaccession');
    }

    const geBiosampleTypes = await loadCache(assembly).geBiosampleTypes();

    const available_biosamples = geBiosampleTypes;
    if (!biosample_types) {
        biosample_types = available_biosamples;
    } else if (biosample_types.some(b => available_biosamples.indexOf(b) === -1)) {
        throw new UserError(
            'invalid biosample types: ' + biosample_types.filter(b => available_biosamples.indexOf(b) === -1).join(',')
        );
    }

    const available_compartments = await Compartments;
    if (!compartments) {
        compartments = available_compartments;
    } else if (compartments.some(b => available_compartments.indexOf(b) === -1)) {
        throw new UserError(
            'invalid biosample types: ' + compartments.filter(b => available_compartments.indexOf(b) === -1).join(',')
        );
    }

    let gene_info: any = Promise.resolve(
        new UserError(
            gene + ' is not a valid gene. This may not be an error if you are searching for a spike-in, for example.'
        )
    );
    let name = gene;
    if (gene) {
        const rows = await Common.geneInfo(assembly, gene);
        if (rows.length !== 0) {
            const gi = rows[0];
            name = gi.approved_symbol;
            const strand = gi.strand;
            gene_info = {
                gene: name,
                ensemblid_ver: gi.ensemblid_ver,
                coords: {
                    chrom: gi.chrom,
                    start: gi.start,
                    end: gi.stop,
                    strand: strand,
                },
            };
        }
    }

    const items = await DbGene.geneexp(
        assembly,
        name as any,
        biosample as any,
        experimentaccession as any,
        compartments,
        biosample_types,
        normalized,
        pconly,
        nomitochondrial
    );
    return {
        gene_info,
        items,
    };
};
