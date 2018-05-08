import { GraphQLFieldResolver } from 'graphql';
import * as DbCommon from '../db/db_common';
import HelperGrouper from '../helpergrouper';
import { natsort, getAssemblyFromCre, natsorter } from '../utils';


const sortTranscripts = (a, b) => natsorter(a.transcript, b.transcript);

const _process = (transcript, ri) => {
    const items = Object.keys(transcript.data).map(fileID => {
        const val = transcript['data'][fileID];
        fileID = fileID.toUpperCase();
        return { ...ri[fileID], counts: val };
    }).sort((a, b) => b.counts - a.counts);
    return {
        transcript: transcript.transcript,
        range: transcript.coords,
        geneinfo: transcript.geneinfo,
        items,
    };
};

export async function getByGene(assembly, gene) {
    const ensemblid_ver = gene.gene.ensemblid_ver;
    const transcripts = await DbCommon.rampageByGene(assembly, ensemblid_ver);

    const ri = await DbCommon.rampage_info(assembly);
    const transcripts_out = transcripts.map(t => _process(t, ri));
    return {
        'transcripts': transcripts_out.sort(sortTranscripts),
        'gene': gene
    };
}

async function rampage(assembly, gene) {
    const egene = await DbCommon.rampageEnsemblID(assembly, gene);
    const r = {
        ensemblid_ver: egene,
        name: gene
    };
    return getByGene(assembly, r);
}

const global_data_global = require('../db/db_cache').global_data_global;
export const resolve_rampage: GraphQLFieldResolver<any, any> = (source, args, context) => {
    const assembly = args.assembly;
    const gene = args.gene;
    return rampage(assembly, gene);
};
