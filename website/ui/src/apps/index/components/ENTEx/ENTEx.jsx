import React from 'react';
import { Button, Container, Icon, Message, Header, Divider } from 'semantic-ui-react';
import { useGetDownloadFileUrl } from '../utils';

const ENTExDownloadPage = () => {
const entexUrl = useGetDownloadFileUrl("https://downloads.wenglab.org/cCRE_decoration.matrix.1.gz","https://storage.googleapis.com/gcp.wenglab.org/cCRE_decoration.matrix.1.gz")
 return (
    <Container style={{ width: "100%" }}>
        <Header as="h1">EN-TEx cCRE Decoration Matrix</Header>
        <Button size="huge" href={entexUrl}>
            <Icon name="download" /> Download (gzip compressed, 21M)
        </Button>
        <Message info>
            This text format matrix file annotates each cCRE with a variety of states in EN-TEx tissues. Rows correspond to cCREs, with accession in the
            first column. Subsequent columns correspond to states (labeled in the first row). cCREs are labeled with binary 1's or 0's for each state.
            You can view annotations for individual cCREs within SCREEN on the <em>EN-TEx States</em> tab of the cCRE details view.
        </Message>
        For more details, see the <a href="http://entex.encodeproject.org/">EN-TEx Data Portal</a>.
    </Container>
)};
export default ENTExDownloadPage;
