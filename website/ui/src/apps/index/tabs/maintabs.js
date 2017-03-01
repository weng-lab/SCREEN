import React from 'react'

import ResultsTableContainer from '../components/results_app'
import ResultsTree from '../components/tree'
import DetailsContainer from '../components/details_container'
import TFDisplay from '../components/tf_display'
import ActivityProfile from '../components/activity_profile'
import ExpressionPlot from '../components/expression_plot'

import loading from '../../../common/components/loading'
import DetailsTabInfo from './details'

import * as Render from '../../../common/renders'

class ResultsTab extends React.Component{
    render() { return (<ResultsTableContainer />); }
}

class TreeTab extends React.Component{
    render() { return (<ResultsTree />); }
}

class DetailsTab extends React.Component{
    render() { return (<DetailsContainer tabs={DetailsTabInfo()} />); }
}

class GcompareTab extends React.Component{
    render() { return (gcompare); }
}

class TFTab extends React.Component {
    render() { return (<TFDisplay />); }
}

class ActivityProfileTab extends React.Component {
    render() { return <ActivityProfile key="aprofile" />;}
}

const MainTabInfo = () => {
    let gene = GlobalParsedQuery.approved_symbol;
    let geTitle = gene ? gene + " Expression" : "";
    
    return {results : {title: "cRE Search Results", visible: true, f: ResultsTab},
	    expression: {title: geTitle, visible: !!gene, f: ExpressionPlot},
	    aprofile: {title: "Activity Profile", visible: false, f: ActivityProfileTab},
	    ct_tree: {title: "Cell Type Clustering", visible: GlobalAssembly == "mm10", f: TreeTab},
	    tf_enrichment: {title: "TF Enrichment", visible: false, f: TFTab},
	    details: {title: "cRE Details", visible: false, f: DetailsTab},
	    gcompare: {title: "Group Comparison", visible: false, f: GcompareTab}};
}

export default MainTabInfo;
