import React, { useEffect, useMemo, useState } from 'react';
import { Button, Container, Divider, Grid, Header, Icon, Message, Modal, Loader } from 'semantic-ui-react';
import { Chart, Scatter } from 'jubilant-carnival';
import HumanHeader from '../HumanHeader';
import { InverseMouseHeader } from '../MouseHeader';
import { DataTable } from 'ts-ztable';

const UMAP_QUERY = `
query q($assembly: String!, $assay: [String!], $a: String!) {
	ccREBiosampleQuery(assay: $assay, assembly: $assembly) {
        biosamples {
            name
            ontology
            umap_coordinates(assay: $a)
            experimentAccession(assay: $a)
        }
    }
}
`;

const ASSAY_MAP = {
    "dnase": "DNase",
    "h3k4me3": "H3K4me3",
    "h3k27ac": "H3K27ac",
    "ctcf": "CTCF"
};

const COLUMNS = [{
    header: "Experiment Accession",
    value: x => x.experimentAccession
}, {
    header: "Name",
    value: x => x.name.replace(/_/g, " ")
}, {
    header: "Tissue",
    value: x => x.ontology
}];

function nearest5(x, low) {
    if (low) return Math.floor(x) - (x > 0 ? Math.floor(x) % 5 : 5 + (Math.floor(x) % 5));
    return Math.ceil(x) + (x > 0 ? Math.ceil(x) % 5 : 5 + (Math.ceil(x) % 5));
}

function fiveRange(min, max) {
    const r = [];
    for (let i = min; i <= max; i += 5) r.push(i);
    return r;
}

const ASSAY_FORMAT = new Map([
    [ "dnase", "DNase" ],
    [ "h3k4me3", "H3K4me3" ],
    [ "h3k27ac", "H3K27ac" ],
    [ "ctcf", "CTCF" ]
]);

function umapHeader(assay, assembly, t) {
    return `${t || "UMAP embedding"}: ${ASSAY_FORMAT.get(assay)} in ${assembly === "grch38" ? "human" : "mouse"}`;
}

function inRange(r, coordinates) {
    const x = r.x.start < r.x.end ? [ r.x.start, r.x.end ] : [ r.x.end, r.x.start ];
    const y = r.y.start < r.y.end ? [ r.y.start, r.y.end ] : [ r.y.end, r.y.start ];
    return coordinates[0] > x[0] && coordinates[0] < x[1] && coordinates[1] > y[0] && coordinates[1] < y[1];
}

const MatrixPage = () => {

    const [ loading, setLoading ] = useState(false);
    const [ assay, setAssay ] = useState("");
    const [ assembly, setAssembly ] = useState("");
    const [ data, setData ] = useState({});
    useEffect( () => {
        assembly !== "" && assay !== "" && fetch("https://ga.staging.wenglab.org/graphql", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ "query": UMAP_QUERY, variables: {
                assembly,
                assay,
                a: assay.toLocaleLowerCase()
            }})
        }).then(x => x.json()).then(x => {
            setData(x.data);
            setLoading(false);
        });
        setLoading(true);
    }, [ assay, assembly ]);

    const [ tooltip, setTooltip ] = useState(-1);
    const [ biosamples, setBiosamples ] = useState([]);
    const fData = useMemo( () => data && data.ccREBiosampleQuery && data.ccREBiosampleQuery.biosamples.filter(x => x.umap_coordinates), [ data ]);
    const xMin = useMemo( () => nearest5(Math.min(...((fData && fData.map(x => x.umap_coordinates[0])) || [ 0 ])), true), [ fData ]);
    const yMin = useMemo( () => nearest5(Math.min(...((fData && fData.map(x => x.umap_coordinates[1])) || [ 0 ])), true), [ fData ]);
    const xMax = useMemo( () => nearest5(Math.max(...((fData && fData.map(x => x.umap_coordinates[0])) || [ 0 ]))), [ fData ]);
    const yMax = useMemo( () => nearest5(Math.max(...((fData && fData.map(x => x.umap_coordinates[1])) || [ 0 ]))), [ fData ]);
    const scatterData = useMemo( () => (fData && fData.map(x => ({ x: x.umap_coordinates[0], y: x.umap_coordinates[1] }))) || [], [ fData ]);
    const ttWidth = (xMax - xMin) * 0.9;
    const ttHeight = (yMax - yMin) / 5;
    const [ modalOpen, setModalOpen ] = useState(false);
    return (
        <Container>
            <Modal open={modalOpen} onClose={() => setModalOpen(false)} style={{ height: "auto", top: "auto", left: "auto", right: "auto", bottom: "auto" }}>
                <Modal.Header style={{ fontSize: "2em" }}>Selected Biosamples</Modal.Header>
                <Modal.Content style={{ fontSize: "1.2em"}}>
                    <DataTable rows={biosamples} columns={COLUMNS} itemsPerPage={8} />
                </Modal.Content>
                <Modal.Actions><Button style={{ fontSize: "1.3em" }} onClick={() => setModalOpen(false)}>OK</Button></Modal.Actions>
            </Modal>
            <Grid>
                <Grid.Column width={5}>
                    <HumanHeader reCount="1,063,878 cCREs" ctCount="1,518 cell types" width={900} />
                    <Button
                        onClick={() => { setAssembly("grch38"); setAssay("dnase"); }}
                        style={{ backgroundColor: "#06da93", fontSize: "1.02em", borderRadius: "6px", marginBottom: "0.2em", width: "65%" }}
                    >
                        DNase
                    </Button>
                    <Button
                        onClick={() => { setAssembly("grch38"); setAssay("h3k4me3"); }}
                        style={{ backgroundColor: "#ff0000", fontSize: "1.02em", borderRadius: "6px", borderRadius: "6px", marginBottom: "0.2em", width: "65%" }}
                    >
                        H3K4me3
                    </Button>
                    <Button
                        onClick={() => { setAssembly("grch38"); setAssay("h3k27ac"); }}
                        style={{ backgroundColor: "#ffcd00", fontSize: "1.02em", borderRadius: "6px", marginBottom: "0.2em", width: "65%" }}
                    >
                        H3K27ac
                    </Button>
                    <Button
                        onClick={() => { setAssembly("grch38"); setAssay("ctcf"); }}
                        style={{ backgroundColor: "#00b0d0", fontSize: "1.02em", borderRadius: "6px", marginBottom: "0.2em", width: "65%" }}
                    >
                        CTCF
                    </Button>
                    <div style={{ marginTop: "3em" }} />
                    <InverseMouseHeader reCount="313,838 cCREs" ctCount="169 cell types" width={900} />
                    <Button
                        onClick={() => { setAssembly("mm10"); setAssay("dnase"); }}
                        style={{ backgroundColor: "#06da93", fontSize: "1.02em", borderRadius: "6px", marginBottom: "0.2em", width: "65%" }}
                    >
                        DNase
                    </Button>
                    <Button
                        onClick={() => { setAssembly("grch38"); setAssay("h3k4me3"); }}
                        style={{ backgroundColor: "#ff0000", fontSize: "1.02em", borderRadius: "6px", marginBottom: "0.2em", width: "65%" }}
                    >
                        H3K4me3
                    </Button>
                    <Button
                        onClick={() => { setAssembly("grch38"); setAssay("h3k27ac"); }}
                        style={{ backgroundColor: "#ffcd00", fontSize: "1.02em", borderRadius: "6px", marginBottom: "0.2em", width: "65%" }}
                    >
                        H3K27ac
                    </Button>
                    <Button
                        onClick={() => { setAssembly("grch38"); setAssay("ctcf"); }}
                        style={{ backgroundColor: "#00b0d0", fontSize: "1.02em", fontWeight: "bold", borderRadius: "6px", marginBottom: "0.2em", width: "65%" }}
                    >
                        CTCF
                    </Button>
                </Grid.Column>
                <Grid.Column width={7}>
                    { assay && data ? (
                        <React.Fragment>
                            <Header style={{ marginLeft: "1em" }} as="h3">{umapHeader(assay, assembly)}</Header>
                            <Divider style={{ borderTop: "1px solid #000" }} />
                            <div style={{ marginTop: "-0.5em" }} />
                            <Message info>Hold shift and draw a lasso to select experiments.</Message>
                            <div style={{ marginTop: "-1.5em" }} />
                            <Chart
                                domain={{ x: { start: xMin, end: xMax }, y: { start: yMin, end: yMax } }}
                                innerSize={{ width: 1000, height: 1000 }}
                                xAxisProps={{ ticks: fiveRange(xMin, xMax), title: "UMAP-1", fontSize: "50" }}
                                yAxisProps={{ ticks: fiveRange(yMin, yMax), title: "UMAP-2", fontSize: "50" }}
                                scatterData={[ scatterData ]}
                                plotAreaProps={{ onFreeformSelectionEnd: (_, c) => { console.log(c); setBiosamples(c[0].map(x => fData[x])) }, freeformSelection: true }}
                            >
                                <Scatter
                                    data={scatterData} pointStyle={{ r: 3 }}
                                    onPointMouseOver={setTooltip}
                                    onPointMouseOut={() => setTooltip(-1)}
                                    onPointClick={i => setBiosamples([ fData[i] ])}
                                />
                                { tooltip !== -1 && (
                                    <rect
                                        x={yMin + (yMax - yMin) * 0.03}
                                        y={fData[tooltip].umap_coordinates[1] - ttHeight * 0.1}
                                        width={ttWidth}
                                        height={ttHeight * 0.65}
                                        strokeWidth={(xMax - xMin) / 150.0}
                                        stroke="#000000"
                                        fill="#ffffffdd"
                                    />
                                )}
                                { tooltip !== -1 && (
                                    <rect
                                        x={yMin + (yMax - yMin) * 0.05}
                                        y={fData[tooltip].umap_coordinates[1] - ttHeight * 0.2}
                                        width={ttWidth * 0.04}
                                        height={ttWidth * 0.04}
                                        strokeWidth={(xMax - xMin) / 600.0}
                                        stroke="#000000"
                                        fill="#00b0d0"
                                    />
                                )}
                                { tooltip !== -1 && (
                                    <text
                                        x={yMin + (yMax - yMin) * 0.1}
                                        y={fData[tooltip].umap_coordinates[1] - ttHeight * 0.35}
                                        fontSize={(yMax - yMin) * 0.03}
                                        fontWeight="bold"
                                    >
                                        {fData[tooltip].name.replace(/_/g, " ").slice(0, 55)}
                                        {fData[tooltip].name.length > 55 ? "..." : ""}
                                    </text>
                                )}
                                { tooltip !== -1 && (
                                    <text
                                        x={yMin + (yMax - yMin) * 0.1}
                                        y={fData[tooltip].umap_coordinates[1] - ttHeight * 0.55}
                                        fontSize={(yMax - yMin) * 0.03}
                                    >
                                        {fData[tooltip].experimentAccession} · click for more information
                                    </text>
                                )}
                            </Chart>
                        </React.Fragment>
                    ) : null}
                </Grid.Column>
                <Grid.Column width={4}>
                    { loading && assay !== "" && <Loader active>Loading...</Loader> }
                    { assay && !loading && data ? (
                        <React.Fragment>
                            <Header as="h3">{umapHeader(assay, assembly, "Downloads")}</Header>
                            <Divider style={{ borderTop: "1px solid #000" }} />
                            <div style={{ marginTop: "2.3em" }} />
                            <Button size="large" href={`http://gcp.wenglab.org/cCREs/matrices/${assembly === "mm10" ? "mm10" : "GRCh38"}.${ASSAY_MAP[assay]}-FC.rDHS-V2.txt`} download style={{ backgroundColor: "#aa8888", borderRadius: "6px", marginBottom: "0.2em", width: "90%" }}>
                                <Icon name="download" /> Fold-change signal matrix
                            </Button>
                            <Button size="large" href={`http://gcp.wenglab.org/cCREs/matrices/${assembly === "mm10" ? "mm10" : "GRCh38"}.${ASSAY_MAP[assay]}-FC-quantileNor.rDHS-V2.txt`} download style={{ backgroundColor: "#88aa88", borderRadius: "6px", marginBottom: "0.2em", width: "90%" }}>
                                <Icon name="download" /> Quantile normalized signal matrix
                            </Button>
                            <Button size="large" download href={`http://gcp.wenglab.org/cCREs/matrices/${assembly === "mm10" ? "mm10" : "GRCh38"}.${ASSAY_MAP[assay]}-zscore.rDHS-V2.txt`} style={{ backgroundColor: "#8888aa", borderRadius: "6px", marginBottom: "0.2em", width: "90%" }}>
                                <Icon name="download" /> Z-scored signal matrix
                            </Button>
                            { biosamples.length > 0 ? (
                                <React.Fragment>
                                    <Divider style={{ borderTop: "1px solid #000" }} />
                                    <Header as="h3">
                                        {biosamples.length.toLocaleString()} experiments selected <Icon name="eye" onClick={() => setModalOpen(true)} />
                                    </Header>
                                    <Button size="medium" style={{ backgroundColor: "#aa88aa", borderRadius: "6px", marginBottom: "0.2em", width: "90%" }}>
                                        <Icon name="download" /> cCREs with average Z-score &gt;1.64 across these experiments
                                    </Button>
                                    <Button size="medium" style={{ backgroundColor: "#aaaa88", borderRadius: "6px", marginBottom: "0.2em", width: "90%" }}>
                                        <Icon name="download" /> cCREs ranked by specificity score for this experiment group
                                    </Button>
                                </React.Fragment>
                            ) : null}
                        </React.Fragment>
                    ) : null}
                </Grid.Column>
            </Grid>
        </Container>
    );
};
export default MatrixPage;
