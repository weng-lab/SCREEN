import { GraphQLFieldResolver } from 'graphql';
import * as DbCommon from '../db/db_common';
import { natsorter } from '../utils';
import { Assembly, Gene, Resolver } from '../types';

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

export const resolve_rampage: GraphQLFieldResolver<any, any> = async (source, args) => {
    const assembly: Assembly = args.assembly.toLowerCase();
    const approved_symbol: string = args.gene;
    const gene = await DbCommon.genesLoader[assembly].load(approved_symbol);
    const ensemblid_ver = gene.ensemblid_ver;
    const transcripts = await DbCommon.rampageByGene(assembly, ensemblid_ver);

    const ri = await DbCommon.rampage_info(assembly);
    const transcripts_out = transcripts.map(t => _process(t, ri));
    return {
        transcripts: transcripts_out.sort(sortTranscripts),
        gene,
    };
};

export const resolve_transcript_rampage: Resolver<
    {},
    { gene: Gene; transcript: string; rampage_info?: any }
> = async source => {
    if (source.gene.assembly !== 'grch38') {
        throw new Error('Rampage only available for GRCh38');
    }
    if (!source.rampage_info) {
        source.rampage_info = DbCommon.rampage_info(source.gene.assembly);
    }
    const ri = await source.rampage_info;
    return _process(source.transcript, ri);
};

export const resolve_gene_rampage: Resolver<{}, Gene> = async source => {
    const assembly: Assembly = source.assembly;
    const approved_symbol: string = source.approved_symbol;
    const gene = await DbCommon.genesLoader[assembly].load(approved_symbol);
    const ensemblid_ver = gene.ensemblid_ver;
    const transcripts = await DbCommon.rampageByGene(assembly, ensemblid_ver);

    const ri = await DbCommon.rampage_info(assembly);
    const transcripts_out = transcripts.map(t => _process(t, ri));
    return {
        transcripts: transcripts_out.sort(sortTranscripts),
        gene,
    };
};
