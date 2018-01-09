import { GraphQLFieldResolver } from 'graphql';
import * as CommonDb from '../db/db_common';
import * as TrackhubsDb from '../db/db_trackhubs';
import * as CoordUtils from '../coord_utils';

// TODO: change to config
const host = 'http://screen.encodeproject.org/api';

async function trackhub_url_info(info) {
    const assembly = info['assembly'];
    const coord = info['range'] ? info['range'] : await CommonDb.crePos(assembly, info['accession']);

    const resizedcoord = CoordUtils.resize(coord, info['halfWindow']);

    return { assembly, accession: info['accession'], highlighted: coord, coord: resizedcoord };
}

async function ucsc_trackhub_url(info) {
    const { assembly, accession, coord, highlighted } = await trackhub_url_info(info);
    const j = { ...info, version: 2 };
    const hubNum = await TrackhubsDb.insertOrUpdate(assembly, accession, info['uuid'], j);

    const trackhubUrl = [
        host,
        'ucsc_trackhub',
        info['uuid'],
        'hub_' + hubNum + '.txt'
    ].join('/');

    let url = 'https://genome.ucsc.edu/cgi-bin/hgTracks?';
    url += 'db=' + assembly;
    url += '&position=' + CoordUtils.format(coord);
    url += '&hubClear=' + trackhubUrl;
    url += '&highlight=' + assembly + '.' + highlighted.chrom + '%3A' + highlighted.start + '-' + highlighted.end;

    if ('hg19' == assembly) {
        url += '&g=wgEncodeGencodeV19';
        url += '&g=phastCons100way';
    }
    if ('mm10' == assembly) {
        // FIXME
    }

    return {'url': url, 'trackhuburl': trackhubUrl};
}

export const resolve_ucsc_trackhub_url: GraphQLFieldResolver<any, any> = (source, args, context) => {
    const info = args.info;
    return ucsc_trackhub_url(info);
};
