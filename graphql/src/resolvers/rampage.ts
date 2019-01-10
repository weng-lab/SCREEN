import { GraphQLFieldResolver } from 'graphql';
import * as DbCommon from '../db/db_common';
import { Gene } from '../types';

const _process = (transcript, ri) => {
    const rampage = Object.keys(transcript.data)
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
        rampage,
    };
};

export const resolve_transcript_rampage: GraphQLFieldResolver<
    { gene: Gene; transcript: string; rampage_info?: any },
    any,
    {}
> = async source => {
    if (source.gene.assembly !== 'hg19') {
        return [];
    }
    if (!source.rampage_info) {
        source.rampage_info = DbCommon.rampage_info(source.gene.assembly);
    }
    const ri = await source.rampage_info;
    return _process(source.transcript, ri);
};
