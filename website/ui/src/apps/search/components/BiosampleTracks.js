import { gql, useQuery } from '@apollo/client';
import { associateBy } from 'queryz';
import React, { useEffect, useMemo } from 'react';
import { DenseBigBed, EmptyTrack, FullBigWig } from 'umms-gb';
import CCRETooltip from './CCRETooltip';

function url(accession) {
    return `https://www.encodeproject.org/files/${accession}/@@download/${accession}.bigWig`;
}

export const tracks = (pos, x) => [
    sevenGroupTrack(pos, x),
    x.dnase_signal && { chr1: pos.chromosome, start: pos.start, end: pos.end, url: url(x.dnase_signal), preRenderedWidth: 1400 },
    x.h3k4me3_signal && { chr1: pos.chromosome, start: pos.start, end: pos.end, url: url(x.h3k4me3_signal), preRenderedWidth: 1400 },
    x.h3k27ac_signal && { chr1: pos.chromosome, start: pos.start, end: pos.end, url: url(x.h3k27ac_signal), preRenderedWidth: 1400 },
    x.ctcf_signal && { chr1: pos.chromosome, start: pos.start, end: pos.end, url: url(x.ctcf_signal), preRenderedWidth: 1400 }
].filter(x => !!x);

const sevenGroupTrack = (pos, x) => {
    const r = [ x.dnase_signal, x.h3k4me3_signal,  x.h3k27ac_signal, x.ctcf_signal ].filter(x => !!x);
    return { chr1: pos.chromosome, start: pos.start, end: pos.end, url: `http://gcp.wenglab.org/Seven-Group/${r.join("_")}.7group.bigBed`, preRenderedWidth: 1400 };
}

const colors = (x) => [
    x.dnase_signal && COLOR_ORDER[0],
    x.h3k4me3_signal && COLOR_ORDER[1],
    x.h3k27ac_signal && COLOR_ORDER[2],
    x.ctcf_signal && COLOR_ORDER[3]
].filter(x => !!x);

const QUERY = gql`
query BigRequests($bigRequests: [BigRequest!]!) {
    bigRequests(requests: $bigRequests) {
        data
        error {
            errortype,
            message
        }
    }
}
`;

const COLOR_ORDER = [ "#06da93", "#ff0000", "#ffcd00", "#00b0f0" ];

const BiosampleTracks = props => {
    const ttracks = useMemo( () => tracks(props.domain, props.biosample), [ props ]);
    const ccolors = useMemo( () => colors(props.biosample), [ props ]);
    const { data, loading } = useQuery(QUERY, { variables: { bigRequests: ttracks }});
    useEffect( () => { props.onHeightChanged && props.onHeightChanged(35 * ttracks.length + 40); }, [ props, ttracks ]);
    const cCRECoordinateMap = useMemo( () => associateBy((data && data.bigRequests && data.bigRequests[0].data || []), x => x.name, x => ({ chromosome: x.chr, start: x.start, end: x.end })), [ data ]);
    return loading ? <EmptyTrack width={1400} height={40} transform="" id="" text="Loading..." /> : (
        <>
            <EmptyTrack
                height={40}
                width={1400}
                transform=""
                id=""
                text={`Epigenetic signal and cCREs colored by activity in ${props.biosample.name}`}
            />
            { ttracks.map( (_, i) => i === 0 ? (
                <DenseBigBed
                    transform={`translate(0,${35 * i + 40})`}
                    width={1400}
                    height={30}
                    domain={props.domain}
                    id={"" + i}
                    data={data.bigRequests[i].data}
                    tooltipContent={rect => <CCRETooltip { ...rect} assembly="grch38" biosample={props.biosample} />}
                    key={i}
                    svgRef={props.svgRef}
                    onClick={x => props.oncCREClicked && x.name && props.oncCREClicked(x.name)}
                    onMouseOver={x => props.oncCREMousedOver && x.name && props.oncCREMousedOver(cCRECoordinateMap.get(x.name))}
                    onMouseOut={props.oncCREMousedOut}
                />
            ) : (
                <FullBigWig
                    transform={`translate(0,${35 * i + 40})`}
                    width={1400}
                    height={30}
                    domain={props.domain}
                    id={"" + i}
                    color={ccolors[i - 1]}
                    data={data.bigRequests[i].data}
                    key={i}
                />
            ))}
        </>
    );
}
export default BiosampleTracks;
