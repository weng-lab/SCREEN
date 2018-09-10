import { GraphQLFieldResolver } from 'graphql';
import * as DbCommon from '../db/db_common';
import { natsorter } from '../utils';
import { Assembly } from '../types';

const sortTranscripts = (a, b) => natsorter(a.transcript, b.transcript);

const _process = (transcript, ri) => {
    const items = Object.keys(transcript.data)
        .map(fileID => {
            const val = transcript['data'][fileID];
            fileID = fileID.toUpperCase();
            return { ...ri[fileID], counts: val };
        })
        .sort((a, b) => b.counts - a.counts);
    return {
        transcript: transcript.transcript,
        range: transcript.coords,
        geneinfo: transcript.geneinfo,
        items,
    };
};

export async function getByGene(assembly: Assembly, gene: { ensemblid_ver: string; gene: string }) {
    const ensemblid_ver = gene.ensemblid_ver;
    const transcripts = await DbCommon.rampageByGene(assembly, ensemblid_ver);

    const ri = await DbCommon.rampage_info(assembly);
    const transcripts_out = transcripts.map(t => _process(t, ri));
    return {
        transcripts: transcripts_out.sort(sortTranscripts),
        gene: gene,
    };
}

export const resolve_rampage: GraphQLFieldResolver<any, any> = async (source, args, context) => {
    const assembly: Assembly = args.assembly;
    const gene: string = args.gene;
    const r = await DbCommon.getGene(assembly, gene);
    return getByGene(assembly, r);
};
