import React from 'react'
import {connect} from 'react-redux'

import ResultsTableContainer from '../components/results_app'
import ResultsTree from '../components/tree'
import DetailsContainer from '../components/details_container'
import TFDisplay from '../../../common/components/tf_display'

import DetailsTabInfo from './details'

class ResultsTab extends React.Component{
    componentDidMount(){
        //console.log("just made ResultsTab");
    }
    render() {
        return (<div>
                <ResultsTableContainer />
                </div>);
    }
}

class TreeTab extends React.Component{
    render() {
        return (<div>
		<ResultsTree />
                </div>);
    }
}

class DetailsTab extends React.Component{
    render() {
        return (<div>
                <DetailsContainer tabs={DetailsTabInfo} />
                </div>);
    }
}

class GcompareTab extends React.Component{
    render() {
        return (<div>
                gcompare
                </div>);
    }
}

const MainTabInfo = {
    results : {title: "Search results", visible: true, f: ResultsTab},
    ct_tree: {title: "Cell Type Clustering", visible: true, f: TreeTab},
    details: {title: "RE Details", visible: false, f: DetailsTab},
    gcompare: {title: "Group comparison", visible: false, f: GcompareTab}
};

export default MainTabInfo;
