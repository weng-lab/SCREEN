import { GraphQLFieldResolver } from 'graphql';
import { loadCache } from '../db/db_cache';
import { rampageByTranscript } from '../db/db_common';
import { Gene } from '../types';

export const resolve_transcript_rampage: GraphQLFieldResolver<
    { gene: Gene; transcript: string },
    any,
    {}
> = async source => {
    if (source.gene.assembly !== 'hg19') {
        return [];
    }
    const rampage_data = await rampageByTranscript(source.gene.assembly, source.transcript);
    const ri = await loadCache(source.gene.assembly).rampage_info();
    return Object.keys(rampage_data.data)
        .map(fileID => {
            const val = rampage_data.data[fileID];
            fileID = fileID.toUpperCase();
            return { ...ri[fileID], counts: val };
        })
        .sort((a, b) => b.counts - a.counts);
};
