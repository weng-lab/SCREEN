import { gql, useQuery } from '@apollo/client';
import { associateBy } from 'queryz';
import React, { useEffect, useMemo } from 'react';
import { DenseBigBed, EmptyTrack, FullBigWig } from 'umms-gb';
import CCRETooltip from './CCRETooltip';

export const DEFAULT_TRACKS = assembly => new Map([
    [ "cCREs", { url: `gs://gcp.wenglab.org/${assembly}-cCREs.bigBed` } ],
    [ "DNase", { url: `gs://gcp.wenglab.org/dnase.${assembly}.sum.bigWig` } ]
]);

export const TRACK_ORDER = [ "DNase" ];

export const COLOR_MAP = new Map([
    [ "DNase", "#06DA93" ],
    [ "H3K4me3", "#00b0d0" ]
]);

export const tracks = (assembly, pos) => [ "cCREs", ...TRACK_ORDER ].map(x => ({ chr1: pos.chromosome, start: pos.start, end: pos.end, ...DEFAULT_TRACKS(assembly === "grch38" ? "GRCh38" : "mm10").get(x), preRenderedWidth: 1400 }));

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

const DefaultTracks = props => {
    const { data, loading } = useQuery(QUERY, { variables: { bigRequests: props.tracks }});
    const cCREData = useMemo( () => data && (
        props.cCREHighlight || props.cCREHighlights ? (data.bigRequests[0].data).map(x => ({
            ...x,
            color: ((props.cCREHighlight && x.end > props.cCREHighlight.start && x.start < props.cCREHighlight.end) || props.cCREHighlights.has(x.name || "")) ? x.color : "#aaaaaa"
        })) : data.bigRequests[0].data
    ), [ data, props ]);
    useEffect( () => { props.onHeightChanged && props.onHeightChanged(105); }, [ props ]);
    const cCRECoordinateMap = useMemo( () => associateBy(((data && data.bigRequests && data.bigRequests[0].data) || []), x => x.name, x => ({ chromosome: x.chr, start: x.start, end: x.end })), [ data ]);
    return loading || ((data && data.bigRequests.length) || 0) < 2 ? <EmptyTrack width={1400} height={40} transform="" id="" text="Loading..." /> : (
        <>
            <EmptyTrack
                height={40}
                width={1400}
                transform=""
                id=""
                text="All cCREs and aggregated DNase-seq signal across all biosamples (cCREs matching search colored)"
            />
            <DenseBigBed
                width={1400}
                height={30}
                domain={props.domain}
                id="cCREs"
                transform="translate(0,40)"
                data={cCREData || []}
                tooltipContent={rect => <CCRETooltip { ...rect} assembly={props.assembly.toLocaleLowerCase()} />}
                svgRef={props.svgRef}
                onClick={x => props.oncCREClicked && x.name && props.oncCREClicked(x.name)}
                onMouseOver={x => props.oncCREMousedOver && x.name && props.oncCREMousedOver(cCRECoordinateMap.get(x.name))}
                onMouseOut={props.oncCREMousedOut}
            />
            <FullBigWig
                transform="translate(0,75)"
                width={1400}
                height={30}
                domain={props.domain}
                id="DNase"
                color="#06da93"
                data={data.bigRequests[1].data}
            />
        </>
    );
}
export default DefaultTracks;
