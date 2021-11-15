import { gql, useQuery } from '@apollo/client';
import { associateBy } from 'queryz';
import React, { useEffect, useMemo } from 'react';
import { DenseBigBed, EmptyTrack, FullBigWig } from 'umms-gb';
import CCRETooltip from './CCRETooltip';

export const DEFAULT_TRACKS = assembly => assembly === "mm10" ? new Map([
    [ "cCREs", { url: `gs://gcp.wenglab.org/${assembly}-cCREs.bigBed` } ],
    [ "DNase", { url: `gs://gcp.wenglab.org/dnase.${assembly}.sum.bigWig` } ]
]) : new Map([
    [ "cCREs", { url: `gs://gcp.wenglab.org/${assembly}-cCREs.bigBed` } ],
    [ "DNase", { url: `gs://gcp.wenglab.org/dnase.${assembly}.sum.bigWig` } ],
    [ "H3K4me3", { url: `gs://gcp.wenglab.org/h3k4me3.${assembly === "GRCh38" ? "hg38" : "mm10"}.sum.bigWig` } ],
    [ "H3K27ac", { url: `gs://gcp.wenglab.org/h3k27ac.${assembly === "GRCh38" ? "hg38" : "mm10"}.sum.bigWig` } ],
    [ "CTCF", { url: `gs://gcp.wenglab.org/ctcf.${assembly === "GRCh38" ? "hg38" : "mm10"}.sum.bigWig` } ],
]);

export const TRACK_ORDER = [ "DNase", "H3K4me3", "H3K27ac", "CTCF" ];

export const COLOR_MAP = new Map([
    [ "DNase", "#06DA93" ],
    [ "CTCF", "#00b0d0" ],
    [ "H3K4me", "#ff0000" ],
    [ "H3K27ac", "#ffcd00" ]
]);

export const tracks = (assembly, pos) => [ "cCREs", ...(assembly !== "mm10" ? TRACK_ORDER : [ "DNase" ]) ].map(x => ({ chr1: pos.chromosome, start: pos.start, end: pos.end, ...DEFAULT_TRACKS(assembly === "grch38" ? "GRCh38" : "mm10").get(x), preRenderedWidth: 1400 }));
export const etracks = (assembly, pos, tracks) => [ "cCREs", ...tracks ].map(x => ({ chr1: pos.chromosome, start: pos.start, end: pos.end, url: x.url || DEFAULT_TRACKS(assembly === "grch38" ? "GRCh38" : "mm10").get(x).url, preRenderedWidth: 1400 }));

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
    useEffect( () => { props.onHeightChanged && props.onHeightChanged(350); }, [ props ]);
    const cCRECoordinateMap = useMemo( () => associateBy(((data && data.bigRequests && data.bigRequests[0].data) || []), x => x.name, x => ({ chromosome: x.chr, start: x.start, end: x.end })), [ data ]);
    return loading || ((data && data.bigRequests.length) || 0) < 2 ? <EmptyTrack width={1400} height={40} transform="" id="" text="Loading..." /> : (
        <>
            <EmptyTrack
                height={40}
                width={1400}
                transform=""
                id=""
                text="All cCREs colored by group"
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
            <EmptyTrack
                height={40}
                width={1400}
                transform="translate(0,75)"
                id=""
                text="Aggregated DNase-seq signal, all Registry biosamples"
            />
            <FullBigWig
                transform="translate(0,105)"
                width={1400}
                height={30}
                domain={props.domain}
                id="DNase"
                color="#06da93"
                data={data.bigRequests[1].data}
            />
            { props.assembly !== "mm10" && <><EmptyTrack
                height={40}
                width={1400}
                transform="translate(0,140)"
                id=""
                text="Aggregated H3K4me3 ChIP-seq signal, all Registry biosamples"
            />
            <FullBigWig
                transform="translate(0,170)"
                width={1400}
                height={30}
                domain={props.domain}
                id="H3K4me3"
                color="#ff0000"
                data={data.bigRequests[2].data}
            />
            <EmptyTrack
                height={40}
                width={1400}
                transform="translate(0,205)"
                id=""
                text="Aggregated H3K27ac ChIP-seq signal, all Registry biosamples"
            />
            <FullBigWig
                transform="translate(0,235)"
                width={1400}
                height={30}
                domain={props.domain}
                id="H3K27ac"
                color="#ffcd00"
                data={data.bigRequests[3].data}
            />
            <EmptyTrack
                height={40}
                width={1400}
                transform="translate(0,265)"
                id=""
                text="Aggregated CTCF ChIP-seq signal, all Registry biosamples"
            />
            <FullBigWig
                transform="translate(0,300)"
                width={1400}
                height={30}
                domain={props.domain}
                id="CTCF"
                color="#00b0d0"
                data={data.bigRequests[4].data}
            /></>}
            <EmptyTrack height={20} />
        </>
    );
}
export default DefaultTracks;

const E_COLOR_MAP = new Map([
    [ "H3K4me3", "#ff0000" ],
    [ "H3K4me1", "#ebae34" ],
    [ "H3K27ac", "#ffcd00" ],
    [ "H3K27me3", "#888888" ]
]);

const LabeledBigWig = props => {
    useEffect( () => { props.onHeightChanged && props.onHeightChanged(75) });
    return (
        <>
            <EmptyTrack
                height={40}
                width={1400}
                transform={`translate(0,${props.offset})`}
                id=""
                text={props.title}
            />
            <FullBigWig
                transform={`translate(0,${props.offset + 40})`}
                width={1400}
                height={30}
                domain={props.domain}
                id="DNase"
                color={props.color}
                data={props.data}
            />
        </>
    )
};

export const ENTEXTracks = props => {
    const { data, loading } = useQuery(QUERY, { variables: { bigRequests: props.tracks }});
    const cCREData = useMemo( () => data && (
        props.cCREHighlight || props.cCREHighlights ? (data.bigRequests[0].data).map(x => ({
            ...x,
            color: ((props.cCREHighlight && x.end > props.cCREHighlight.start && x.start < props.cCREHighlight.end) || props.cCREHighlights.has(x.name || "")) ? x.color : "#aaaaaa"
        })) : data.bigRequests[0].data
    ), [ data, props ]);
    useEffect( () => { props.onHeightChanged && props.onHeightChanged(350); }, [ props ]);
    const cCRECoordinateMap = useMemo( () => associateBy(((data && data.bigRequests && data.bigRequests[0].data) || []), x => x.name, x => ({ chromosome: x.chr, start: x.start, end: x.end })), [ data ]);
    return loading || ((data && data.bigRequests.length) || 0) < 2 ? <EmptyTrack width={1400} height={40} transform="" id="" text="Loading..." /> : (
        <>
            <EmptyTrack
                height={40}
                width={1400}
                transform=""
                id=""
                text="All cCREs colored by group"
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
            { data.bigRequests.slice(1).map( (t, i) => (
                <LabeledBigWig
                    offset={70 + i * 75}
                    width={1400}
                    height={30}
                    domain={props.domain}
                    id="H3K27ac"
                    color={E_COLOR_MAP.get(props.trackdata[i].target)}
                    data={t.data}
                    title={`${props.trackdata[i].target} in ${props.trackdata[i].biosample}`}
                />
            ))}
        </>
    );
};
