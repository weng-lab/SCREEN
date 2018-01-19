import { GraphQLFieldResolver } from 'graphql';
import * as DbCommon from '../db/db_common';
import HelperGrouper from '../helpergrouper';
import { natsort, getAssemblyFromCre } from '../utils';


export async function getByGene(assembly, gene) {
    const ensemblid_ver = gene['ensemblid_ver'];
    const transcripts = await DbCommon.rampageByGene(assembly, ensemblid_ver);
    if (!transcripts) {
        return {
            'sortedTranscripts': [],
            'tsss': [],
            'gene': ''
        };
    }

    const _process = (transcript, ri) => {
        const ret: any = {};
        ret['transcript'] = transcript['transcript'];
        ret['chrom'] = transcript['chrom'];
        ret['start'] = transcript['start'];
        ret['stop'] = transcript['stop'];
        ret['strand'] = transcript['strand'];
        ret['geneinfo'] = transcript['geneinfo'];

        // fold actual data val into each "row"
        const items: Array<any> = [];
        for (let fileID of Object.keys(transcript['data'])) {
            const val = transcript['data'][fileID];
            fileID = fileID.toUpperCase();
            const info = ri[fileID];
            info['counts'] = +(Math.round(+(val + 'e+4'))  + 'e-4');
            items.push(info);
        }

        const hg = new HelperGrouper(transcript, items);
        ret['itemsByID'] = hg.byID;
        ret['itemsGrouped'] = hg.getGroupedItems('counts');
        return ret;
    };
    const ri = await DbCommon.rampage_info(assembly);
    const byTranscript: any = {};
    for (const transcript of transcripts) {
        const info = _process(transcript, ri);
        byTranscript[transcript['transcript']] = info;
    }
    return {
        'sortedTranscripts': natsort(Object.keys(byTranscript)),
        'tsss': byTranscript,
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
