import * as React from 'react';
import * as RB from 'react-bootstrap';
import { Grid, Row, Panel, Button } from 'react-bootstrap';

const hostbase = 'http://api.wenglab.org/screenv10_graphql';
const datarange = hostbase + '/graphql?operationName=rangeSearchAndData&query=query%20rangeSearchAndData(%24assembly%3A%20Assembly!%2C%20%24dataRange%3A%20DataParameters!%2C%20%24dataCellType%3A%20DataParameters!)%20%7B%0A%20%20dataSearch%3A%20data(assembly%3A%20%24assembly%2C%20data%3A%20%24dataRange)%20%7B%0A%20%20%20%20total%0A%20%20%20%20cres%20%7B%0A%20%20%20%20%20%20accession%0A%20%20%20%20%7D%0A%20%20%7D%0A%20%20dataSearchRefined%3A%20data(assembly%3A%20%24assembly%2C%20data%3A%20%24dataCellType)%20%7B%0A%20%20%20%20total%0A%20%20%20%20cres%20%7B%0A%20%20%20%20%20%20k4me3max%0A%20%20%20%20%20%20range%20%7B%0A%20%20%20%20%20%20%20%20chrom%0A%20%20%20%20%20%20%20%20start%0A%20%20%20%20%20%20%20%20end%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20ctspecific(cellType%3A%20"K562")%20%7B%0A%20%20%20%20%20%20%20%20ct%0A%20%20%20%20%20%20%20%20dnase_zscore%0A%20%20%20%20%20%20%20%20promoter_zscore%0A%20%20%20%20%20%20%20%20enhancer_zscore%0A%20%20%20%20%20%20%20%20ctcf_zscore%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A&variables=%7B%0A%20%20"assembly"%3A%20"hg19"%2C%0A%20%20"dataRange"%3A%20%7B%0A%20%20%20%20"range"%3A%20%7B%0A%20%20%20%20%20%20"chrom"%3A%20"chr1"%2C%0A%20%20%20%20%20%20"start"%3A%205%2C%0A%20%20%20%20%20%20"end"%3A%205000000%0A%20%20%20%20%7D%0A%20%20%7D%2C%0A%20%20"dataCellType"%3A%20%7B%0A%20%20%20%20"range"%3A%20%7B%0A%20%20%20%20%20%20"chrom"%3A%20"chr1"%2C%0A%20%20%20%20%20%20"start"%3A%205%2C%0A%20%20%20%20%20%20"end"%3A%205000000%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D';
const credetails = hostbase + '/graphql?operationName=credetails&query=query%20credetails%20%7B%0A%20%20credetails(accessions%3A%20%5B"EH37E0321285"%5D)%20%7B%0A%20%20%20%20info%20%7B%0A%20%20%20%20%20%20range%20%7B%0A%20%20%20%20%20%20%20%20chrom%0A%20%20%20%20%20%20%20%20start%0A%20%20%20%20%20%20%20%20end%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20ctspecific(cellType%3A%20"K562")%20%7B%0A%20%20%20%20%20%20%20%20ct%0A%20%20%20%20%20%20%20%20dnase_zscore%0A%20%20%20%20%20%20%20%20promoter_zscore%0A%20%20%20%20%20%20%20%20enhancer_zscore%0A%20%20%20%20%20%20%20%20ctcf_zscore%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20topTissues%20%7B%0A%20%20%20%20%20%20dnase%20%7B%0A%20%20%20%20%20%20%20%20ct%20%7B%0A%20%20%20%20%20%20%20%20%20%20displayName%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20one%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20ctcf%20%7B%0A%20%20%20%20%20%20%20%20ct%20%7B%0A%20%20%20%20%20%20%20%20%20%20displayName%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20one%0A%20%20%20%20%20%20%20%20two%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20promoter%20%7B%0A%20%20%20%20%20%20%20%20ct%20%7B%0A%20%20%20%20%20%20%20%20%20%20displayName%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20one%0A%20%20%20%20%20%20%20%20two%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20enhancer%20%7B%0A%20%20%20%20%20%20%20%20ct%20%7B%0A%20%20%20%20%20%20%20%20%20%20displayName%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20one%0A%20%20%20%20%20%20%20%20two%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20nearbyGenomic%0A%20%20%7D%0A%7D%0A';

const host = hostbase + '/graphql';
const schemaurl = hostbase + '/graphqlschema';
class TabAPI extends React.Component {
    state = { schemaopen: false, schema: 'Loading' };

    componentDidMount() {
        console.log(fetch(schemaurl));
        fetch(schemaurl).then(r => r.text()).then(r => this.setState({ schema: r })).catch(r => this.setState({ schema: 'Error' }));
    }

    render() {
        console.log(RB);
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
                        All data used by the SCREEN site is available in the GraphQL API.
                        <br />
                        The current host of the GraphQL server is: <i>{host}</i>
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
                        <pre>
                            <code>{this.state.schema}</code>
                        </pre> 
                    </Panel>
                </Row>
                <Row>
                    <a href={host} target="_blank" rel="noopener noreferrer">
                        Graph<i>i</i>QL
                    </a>
                </Row>
                <Row>
                    <h2>Examples</h2>
                </Row>
                <Row>
                    <a href={datarange} target="_blank"  rel="noopener noreferrer">
                        Search for ccREs by certain parameters
                    </a>
                    <br />
                    <a href={credetails} target="_blank"  rel="noopener noreferrer">
                        ccRE Details
                    </a>
                </Row>
            </Grid>
        );
    }
}

export default TabAPI;
