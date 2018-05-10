import { GraphQLFieldResolver } from 'graphql';
import * as Common from '../db/db_common';
import * as DbGene from '../db/db_geneexp';

import { cache, Compartments } from '../db/db_cache';

const { UserError } = require('graphql-errors');

async function geneexp(assembly, gene, biosample_types, compartments, normalized) {
    const c = await cache(assembly);

    const available_biosamples = c.geBiosampleTypes;
    if (!biosample_types) {
        biosample_types = available_biosamples;
    } else if (biosample_types.some(b => available_biosamples.indexOf(b) === -1)) {
        throw new UserError(
            'invalid biosample types: ' + biosample_types.filter(b => available_biosamples.indexOf(b) === -1).join(',')
        );
    }

    const available_compartments = Compartments;
    if (!compartments) {
        compartments = available_compartments;
    } else if (compartments.some(b => available_compartments.indexOf(b) === -1)) {
        throw new UserError(
            'invalid biosample types: ' + compartments.filter(b => available_compartments.indexOf(b) === -1).join(',')
        );
    }

    const rows = await Common.geneInfo(assembly, gene);
    let gene_info: any = Promise.resolve(
        new UserError(
            gene + ' is not a valid gene. This may not be an error if you are searching for a spike-in, for example.'
        )
    );
    let name = gene;
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

    const items = await DbGene.computeHorBarsAll(assembly, name, compartments, biosample_types, normalized);
    return {
        gene_info,
        items,
    };
}

export const resolve_geneexp: GraphQLFieldResolver<any, any> = (source, args, context) => {
    const assembly = args.assembly;
    const gene = args.gene;
    const biosample_types = args.biosample_types;
    const compartments = args.compartments;
    const normalized = args.normalized !== null ? args.normalized : true;
    return geneexp(assembly, gene, biosample_types, compartments, normalized);
};
