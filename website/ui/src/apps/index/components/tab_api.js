import * as React from 'react';
import { Grid, Row, Panel, Button } from 'react-bootstrap';

const hostbase = 'http://api.wenglab.org/screenv10_graphql';
const host = hostbase + '/graphql';
const schemaurl = hostbase + '/graphqlschema';

const makelink = (query, variables) =>
    variables
        ? `${host}?query=${encodeURIComponent(query)}&variables=${encodeURIComponent(variables)}`
        : `${host}?query=${encodeURIComponent(query)}`;

const datarangeexample = `
query rangeSearchAndData(
    $assembly: Assembly!,
    $dataRange: DataParameters!,
    $dataCellType: DataParameters!,
    $cellType: String!
  ) {
    # We can search by a range
    dataSearch: data(
                    assembly: $assembly,
                    data: $dataRange) {
      total,
      cres {
        accession
      }
    }
    # Or, we can refine our search. In this case, by cell type "K562"
    dataSearchRefined: data(
                        assembly: $assembly,
                        data: $dataCellType) {
      total
      cres {
        k4me3max
        range {
          chrom,
          start,
          end
        }
        ctspecific(cellType: $cellType) {
          ct
          dnase_zscore
          promoter_zscore
          enhancer_zscore
          ctcf_zscore
        }
      }
    },
  }
`;
const datarangevariables = `{
    "assembly": "hg19",
    "dataRange": {
        "range": {
            "chrom": "chr1",
            "start": 5,
            "end": 5000000
        }
    },
    "dataCellType": {
        "range": {
            "chrom": "chr1",
            "start": 5,
            "end": 5000000
        }
    },
    "cellType": "K562"
}`;

const credetailsexample = `
query credetails {
    credetails(accessions: ["EH37E0321285"]) {
      info {
        range {
          chrom
          start
          end
        }
        ctspecific(cellType: "K562") {
          ct
          dnase_zscore
          promoter_zscore
          enhancer_zscore
          ctcf_zscore
        }
      }
      topTissues {
        dnase { ct { displayName }, one },
        ctcf { ct { displayName }, one, two },
        promoter { ct { displayName }, one, two },
        enhancer { ct { displayName }, one, two },
      }
      nearbyGenomic
    }
  }
`;

const gene_expexample = `
query gene_exp {
    geneexp_search(assembly: hg19, gene: "PTMA", biosample_types: ["cell line"], compartments: ["cell"], normalized: true) {
      gene_info {
        coords {
          chrom
          start
          end
          strand
        }
        gene
        ensemblid_ver
      }
      items {
        tissue
        cellType
        expID
        reps {
          replicate
          rawTPM
          rawFPKM
        }
      }
    }
}
`;

const spikein_expexample = `
query spikein_exp {
    spikein: geneexp_search(assembly: hg19, gene: "gSpikein_ERCC-00058", biosample_types: ["cell line"], compartments: ["cell"], normalized: true) {
      gene_info {
        gene
      }
      items {
        tissue
        reps {
          replicate
          rawTPM
        }
      }
    }
}
`;
const celltypes_examples = `
query celltypes {
    globals {
      byAssembly(assembly: hg19) {
        # Cell types with gene expression data
        geBiosamples
        # Cell types with ccRE data
        cellTypeInfoArr {
          name
          value
          tissue
          displayName
          assays {
            assay
            expid
            fileid
          }
        }
      }
    }
  }  
`;

class TabAPI extends React.Component {
    state = { schemaopen: false, schema: 'Loading' };

    componentDidMount() {
        fetch(schemaurl).then(r => r.text()).then(r => this.setState({ schema: r })).catch(r => this.setState({ schema: 'Error' }));
    }

    render() {
        const schematext = this.state.schema;
        const schemaBlob = new Blob([schematext], { type: 'application/txt' });
        const schemadownloadurl = URL.createObjectURL(schemaBlob);
        const makelinkout = (title, query, variables) => (
            <a href={makelink(query, variables)} target="_blank" rel="noopener noreferrer">
                {title}
            </a>
        );
        return (
            <Grid>
                <Row>
                    <h2>API</h2>
                </Row>
                <Row>
                    <p>
                        The preferred way to programatically access SCREEN and ccRE data is to use our GraphQL
                        API. Information on GraphQL can be found {<a href="http://graphql.org/">{' here'}</a>}.
                    </p>
                    <br />
                    <p>
                        The entire SCREEN site uses the GraphQL API for its backend, so you can have access to
                        any data available on this site.
                        <br />
                        The current host of the GraphQL server is: <i>{host}</i>
                    </p>
                    <p>
                        This page will always contain the latest host, as well as the current schema and
                        examples (below).
                    </p>
                </Row>
                <Row>
                    <h2>Quick Start</h2>
                </Row>
                <Row>
                    <p style={{ width: '100%' }}>
                        The fastest way to begin to use the API is through the GraphiQL UI:
                        {'  '}
                        <a href={host} target="_blank" rel="noopener noreferrer">
                            Graph<i>i</i>QL
                        </a>
                    </p>
                    <p>
                        For more advanced usage, a number of options exist.
                        {'  '}
                        <a
                            href={
                                'https://dev-blog.apollodata.com/4-simple-ways-to-call-a-graphql-api-a6807bcdb355'
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            This
                        </a>{' '}
                        blog post has a few useful examples.
                    </p>
                </Row>
                <Row>
                    <h2>Schema</h2>
                </Row>
                <Row>
                    <Button  onClick={() => this.setState({ schemaopen: !this.state.schemaopen })}>
                        {this.state.schemaopen ? 'Close schema' : 'Open schema'}
                    </Button>
                    <Panel expanded={this.state.schemaopen} collapsible={true}>
                        <a href={schemadownloadurl} download={'schema.txt'}>
                            Download
                        </a>
                        <pre>
                            <code>{this.state.schema}</code>
                        </pre> 
                    </Panel>
                </Row>
                <Row>
                    <h2>Examples</h2>
                </Row>
                <Row>
                    {makelinkout(
                        'Search for ccREs by certain parameters',
                        datarangeexample,
                        datarangevariables
                    )}
                    <br />
                    {makelinkout('ccRE Details', credetailsexample)}
                    <br />
                    {makelinkout('Gene Expression Data', gene_expexample)}
                    <br />
                    {makelinkout('Spike-in Expression Data', spikein_expexample)}
                    <br />
                    {makelinkout('Available Cell Types for ccREs and Gene Expression', celltypes_examples)}
                </Row>
            </Grid>
        );
    }
}

export default TabAPI;
