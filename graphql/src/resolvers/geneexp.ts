import { GraphQLFieldResolver } from 'graphql';
import * as Common from '../db/db_common';
import { GeneExpression } from '../db/db_geneexp';

const { UserError } = require('graphql-errors');


const allBiosampleTypes = [
    'cell line', 'induced pluripotent stem cell line',
    'in vitro differentiated cells', 'primary cell',
    'stem cell', 'tissue'];

async function geneexp(assembly, gene, biosample_types, compartments) {
    // TODO: check for valid gene
    if (biosample_types.length === 0) {
        throw new UserError('no biosample type selected');
    }
    if (biosample_types.some(b => allBiosampleTypes.indexOf(b) === -1)) {
        throw new UserError('invalid biosample type');
    }

    // TODO: check value of compartments
    if (compartments.length === 0) {
        throw new UserError('no compartments');
    }

    const rows = await Common.geneInfo(assembly, gene);
    if (rows.length === 0) {
        return { 'gene': gene };
    }
    const gi = rows[0];

    const name = gi.approved_symbol;
    const strand = gi.strand;

    const cge = new GeneExpression(assembly);
    const single = cge.computeHorBars(name, compartments, biosample_types);
    const mean = cge.computeHorBarsMean(name, compartments, biosample_types);
    const itemsByRID = cge.itemsByRID;
    const r = {
        'gene': name,
        'ensemblid_ver': gi.ensemblid_ver,
        'coords': {
            'chrom': gi.chrom,
            'start': gi.start,
            'end': gi.stop,
            'strand': strand
        },
        'single': single,
        'mean': mean,
        'itemsByRID': itemsByRID
    };
    return r;
}

export const resolve_geneexp: GraphQLFieldResolver<any, any> = (source, args, context) => {
    const assembly = args.assembly;
    const gene = args.gene;
    const biosample_types = args.biosample_types;
    const compartments = args.compartments;
    return geneexp(assembly, gene, biosample_types, compartments);
};
