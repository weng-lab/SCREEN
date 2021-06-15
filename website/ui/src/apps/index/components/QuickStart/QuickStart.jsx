import React, { useEffect, useMemo, useState } from 'react';
import { Button, Container, Grid, Icon, Search, Loader, Popup, Input, Modal } from 'semantic-ui-react';
import HumanHeader from '../HumanHeader';
import MouseHeader from '../MouseHeader';

export const sevenGroupURL = x => {
    const r = [ x.dnase_signal, x.h3k4me3_signal,  x.h3k27ac_signal, x.ctcf_signal ].filter(x => !!x);
    return `https://api.wenglab.org/beta_screen/download7/${r.join("_")}.7group.bed`;
}

const PROMOTER_MESSAGE = "cCREs with promoter-like signatures have high DNase-seq signal, high H3K4me3 signal, and have centers within 200 bp of an annotated GENCODE TSS.";
const ENHANCER_MESSAGE = "cCREs with enhancer-like signatures have high DNase-seq signal and high H3K27ac signal. These cCREs can either be TSS-proximal (within 2kb) or TSS-distal and do not include promoter annotations.";
const CTCF_MESSAGE = "cCREs with high CTCF-signal. These cCRE may also be classified as promoters, enhancer, or CTCF-only elements.";
const LINK_MESSAGE = "cCRE-gene links curated from Hi-C, ChIA-PET, CRISPR perturbations and eQTL data.";

export const BIOSAMPLE_QUERY = `
  query biosamples {
    human: ccREBiosampleQuery(assembly: "grch38") {
      biosamples {
        name
        dnase: experimentAccession(assay: "DNase")
        h3k4me3: experimentAccession(assay: "H3K4me3")
        h3k27ac: experimentAccession(assay: "H3K27ac")
        ctcf: experimentAccession(assay: "CTCF")
        dnase_signal: fileAccession(assay: "DNase")
        h3k4me3_signal: fileAccession(assay: "H3K4me3")
        h3k27ac_signal: fileAccession(assay: "H3K27ac")
        ctcf_signal: fileAccession(assay: "CTCF")
      }
    }
    mouse: ccREBiosampleQuery(assembly: "mm10") {
      biosamples {
        name
        dnase: experimentAccession(assay: "DNase")
        h3k4me3: experimentAccession(assay: "H3K4me3")
        h3k27ac: experimentAccession(assay: "H3K27ac")
        ctcf: experimentAccession(assay: "CTCF")
        dnase_signal: fileAccession(assay: "DNase")
        h3k4me3_signal: fileAccession(assay: "H3K4me3")
        h3k27ac_signal: fileAccession(assay: "H3K27ac")
        ctcf_signal: fileAccession(assay: "CTCF")
      }
    }
  }
`;

export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

export function downloadTSV(text, filename) {
    downloadBlob(new Blob([text], { type: 'text/plain' }), filename);
}

const SearchBox = props => {
    const [ search, setSearch ] = useState("");
    const [ result, setResult ] = useState(null);
    const [ downloading, setDownloading ] = useState("");
    useEffect( () => {
        downloading !== "" && fetch(downloading).then(x => x.text()).then(x => {
            downloadTSV(x.split("\n").filter(x => props.dl(x)).join("\n"), `${result.name}.${props.title}.bed`);
            setDownloading("");
        });
    }, [ downloading ]);
    return (
        <React.Fragment>
            { downloading !== "" && <Modal open={true}><Modal.Content>Querying cCREs. This may take 30-60 seconds...</Modal.Content></Modal> }
            <Search
                input={{ fluid: true }}
                style={{ width: "90%", marginTop: "0.4em", marginLeft: "-2.5em" }}
                icon="search"
                placeholder="Search for a biosample..."
                results={search !== "" ? props.results.filter(x => x.name.toLocaleLowerCase().includes(search)).map(x => ({ title: x.name.replace(/_/g, " "), description: props.description(x) })) : []}
                onSearchChange={(_, v) => setSearch((v.value + "").toLocaleLowerCase())}
                onResultSelect={e => setResult(props.results.filter(x => x.name.replace(/_/g, " ") === e.target.value)[0] || null)}
            />
            {result !== null && (
                <Button size="large" onClick={() => setDownloading(sevenGroupURL(result))} style={{ border: `2px solid ${props.color}`, width: "65%" }}>
                    Download {props.title} active in {result.name.replace(/_/g, " ")}
                </Button>
            )}
        </React.Fragment>
    );
};

const QuickStart = () => {
    
    const [ loading, setLoading ] = useState(true);
    const [ data, setData ] = useState({});
    useEffect( () => {
        loading && fetch("https://ga.staging.wenglab.org/graphql", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ "query": BIOSAMPLE_QUERY })
        }).then(x => x.json()).then(x => {
            setData(x.data);
            setLoading(false);
        });
    }, [ data, loading ]);
    
    const h3k4me3H = useMemo( () => (data && data.human && data.human.biosamples || []).filter(x => x.h3k4me3 !== null), [ data ]);
    const h3k27acH = useMemo( () => (data && data.human && data.human.biosamples || []).filter(x => x.h3k27ac !== null), [ data ]);
    const ctcfH = useMemo( () => (data && data.human && data.human.biosamples || []).filter(x => x.ctcf !== null), [ data ]);
    const h3k4me3M = useMemo( () => (data && data.mouse && data.mouse.biosamples || []).filter(x => x.h3k4me3 !== null), [ data ]);
    const h3k27acM = useMemo( () => (data && data.mouse && data.mouse.biosamples || []).filter(x => x.h3k27ac !== null), [ data ]);
    const ctcfM = useMemo( () => (data && data.mouse && data.mouse.biosamples || []).filter(x => x.ctcf !== null), [ data ]);

    return loading ? <Loader active>Loading...</Loader> : (
        <Container style={{ width: "100%" }}>
            <Grid divided="vertically" style={{ marginTop: "1em" }}>
                <Grid.Row style={{ padding: "0px" }}>
                    <Grid.Column width={3} />
                    <Grid.Column width={5}>
                        <HumanHeader reCount="926,535 cCREs" ctCount="839 cell types" />
                    </Grid.Column>
                    <Grid.Column width={2} />
                    <Grid.Column width={5}>
                        <MouseHeader reCount="339,815 cCREs" ctCount="157 cell types" />
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row style={{ paddingTop: "1.0em" }}>
                    <Grid.Column width={2} />
                    <Grid.Column width={7} style={{ textAlign: "center" }}>
                        <Button size="large" href="http://gcp.wenglab.org/GRCh38-ccREs.bed" download style={{ border: "2px solid #000000", width: "65%" }}>
                            Download all human cCREs (hg38)
                        </Button>
                    </Grid.Column>
                    <Grid.Column width={7} style={{ textAlign: "center" }}>
                        <Button size="large" href="http://gcp.wenglab.org/mm10-ccREs.bed" download style={{ border: "2px solid #000000", width: "65%" }}>
                            Download all mouse cCREs (mm10)
                        </Button>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column width={2}>
                        <br /><span style={{ fontSize: "1.6em" }}>Promoters <Popup content={PROMOTER_MESSAGE} trigger={<Icon name="info circle" />} /></span>
                    </Grid.Column>
                    <Grid.Column width={7} style={{ textAlign: "center" }}>
                        <Button size="large" style={{ border: "2px solid #ff0000", width: "65%" }} href="http://gcp.wenglab.org/cCREs/GRCh38-PLS.bed" download>
                            Download all human promoters (hg38)
                        </Button><br />
                        <SearchBox results={h3k4me3H || []} description={x => x.h3k4me3 || ""} color="#ff0000" title="promoters" dl={x => x.includes("PLS")} />
                    </Grid.Column>
                    <Grid.Column width={7} style={{ textAlign: "center" }}>
                        <Button size="large" style={{ border: "2px solid #ff0000", width: "65%" }} href="http://gcp.wenglab.org/cCREs/mm10-ELS.bed" download>
                            Download all mouse promoters (mm10)
                        </Button><br />
                        <SearchBox results={h3k4me3M || []} description={x => x.h3k4me3 || ""} color="#ff0000" title="promoters" dl={x => x.includes("PLS")} />
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column width={2}>
                        <br /><span style={{ fontSize: "1.6em" }}>Enhancers <Popup content={ENHANCER_MESSAGE} trigger={<Icon name="info circle" />} /></span>
                    </Grid.Column>
                    <Grid.Column width={7} style={{ textAlign: "center" }}>
                        <Button size="large" style={{ border: "2px solid #ffcd00", width: "65%" }} href="http://gcp.wenglab.org/cCREs/GRCh38-ELS.bed" download>
                            Download all human enhancers (hg38)
                        </Button><br />
                        <SearchBox results={h3k27acH || []} description={x => x.h3k27ac || ""} color="#ffcd00" title="enhancers" dl={x => x.includes("ELS")} />
                    </Grid.Column>
                    <Grid.Column width={7} style={{ textAlign: "center" }}>
                        <Button size="large" style={{ border: "2px solid #ffcd00", width: "65%" }} href="http://gcp.wenglab.org/cCREs/mm10-ELS.bed" download>
                            Download all mouse enhancers (mm10)
                        </Button><br />
                        <SearchBox results={h3k27acM || []} description={x => x.h3k27ac || ""} color="#ffcd00" title="enhancers" dl={x => x.includes("ELS")} />
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column width={2}>
                        <br /><span style={{ fontSize: "1.6em" }}>CTCF-bound <Popup content={CTCF_MESSAGE} trigger={<Icon name="info circle" />} /></span>
                    </Grid.Column>
                    <Grid.Column width={7} style={{ textAlign: "center" }}>
                        <Button size="large" style={{ border: "2px solid #00b0d0", width: "65%" }} href="http://gcp.wenglab.org/cCREs/GRCh38-CTCF.bed" download>
                            Download all human CTCF-bound cCREs (hg38)
                        </Button><br />
                        <SearchBox results={ctcfH || []} description={x => x.ctcf || ""} color="#00b0d0" title="CTCF-bound cCREs" dl={x => x.includes("CTCF")} />
                    </Grid.Column>
                    <Grid.Column width={7} style={{ textAlign: "center" }}>
                        <Button size="large" style={{ border: "2px solid #00b0d0", width: "65%" }} href="http://gcp.wenglab.org/cCREs/mm10-CTCF.bed" download>
                            Download all mouse CTCF-bound cCREs (mm10)
                        </Button><br />
                        <SearchBox results={ctcfM || []} description={x => x.ctcf || ""} color="#00b0d0" title="CTCF-bound cCREs" dl={x => x.includes("CTCF")} />
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column width={2}>
                        <br /><span style={{ fontSize: "1.6em" }}>cCRE-Gene Links <Popup content={LINK_MESSAGE} trigger={<Icon name="info circle" />} /></span>
                    </Grid.Column>
                    <Grid.Column width={7} style={{ textAlign: "center" }}>
                        <Button size="large" style={{ border: "2px solid #b000d0", width: "65%" }} href="http://gcp.wenglab.org/GRCh38-ccREs.bed" download>
                            Download all human cCRE-gene links (hg38)
                        </Button><br />
                        <Input style={{ width: "65%", marginTop: "0.4em" }} icon="search" placeholder="Search for a biosample..." />
                    </Grid.Column>
                    <Grid.Column width={7} style={{ textAlign: "center" }}>
                        <Button size="large" style={{ border: "2px solid #b000d0", width: "65%" }} href="http://gcp.wenglab.org/GRCh38-ccREs.bed" download>
                            Download all mouse cCRE-gene links (mm10)
                        </Button><br />
                        <Input style={{ width: "65%", marginTop: "0.4em" }} icon="search" placeholder="Search for a biosample..." />
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </Container>
    );
};
export default QuickStart;
