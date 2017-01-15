import React from 'react'
import {connect} from 'react-redux'

import ResultsTableContainer from '../components/results_app'
import ResultsDisplayApp from '../components/results_display_app'
import ResultsTree from '../components/tree'

import DetailsApp from '../components/details_app'
import {tabs} from './details'

import TFDisplay from '../../../common/components/tf_display'

class ResultsTab extends React.Component{
    render() {
        return (<div>
                <ResultsTableContainer />
                </div>);
    }
}

class TreeTab extends React.Component{
    render() {
        return (<div>
                tree
                </div>);
    }
}

class DetailsTab extends React.Component{
    render() {
        return (<div>
                details
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