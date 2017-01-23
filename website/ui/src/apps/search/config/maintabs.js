import React from 'react'

import ResultsTableContainer from '../components/results_app'
import ResultsTree from '../components/tree'
import DetailsContainer from '../components/details_container'
import TFDisplay from '../components/tf_display'

import DetailsTabInfo from './details'

class ResultsTab extends React.Component{
    render() { return (<ResultsTableContainer />); }
}

class TreeTab extends React.Component{
    render() { return (<ResultsTree />); }
}

class DetailsTab extends React.Component{
    render() { return (<DetailsContainer tabs={DetailsTabInfo} />); }
}

class GcompareTab extends React.Component{
    render() { return (gcompare); }
}

class TFTab extends React.Component {
    render() { return (<TFDisplay />); }
}

const MainTabInfo = {
    results : {title: "Search results", visible: true, f: ResultsTab},
    ct_tree: {title: "Cell Type Clustering", visible: true, f: TreeTab},
    tf_enrichment: {title: "TF enrichment", visible: false, f: TFTab},
    details: {title: "RE Details", visible: false, f: DetailsTab},
    gcompare: {title: "Group comparison", visible: false, f: GcompareTab}
};

export default MainTabInfo;
