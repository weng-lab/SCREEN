import React from 'react'
import {connect} from 'react-redux'

import ResultsApp from '../components/results_app'
import ResultsDisplayApp from '../components/results_display_app'
import ResultsTree from '../components/tree'

import DetailsApp from '../components/details_app'
import {tabs} from './details'

import TFDisplay from '../../../common/components/tf_display'

const resultsTab  = ({accessions, actions}) => {
    return (<div>
            results
            </div>);
}

const treeTab  = ({accessions, actions}) => {
    return (<div>
            tree
            </div>);
}

const detailsTab = ({accessions, actions}) => {
    return (<div>
            details
            </div>);
}

const gcompareTab = ({accessions, actions}) => {
    return (<div>
            gcompare
            </div>);
}

const maintabs = {
    results : {title: "Search results", visible: true,
               f: resultsTab},
    ct_tree: {title: "Cell Type Clustering", visible: true,
              f: treeTab},
    details: {title: "RE Details", visible: false,
              f: detailsTab},
    gcompare: {title: "Group comparison", visible: false,
               f: gcompareTab}
};

export default maintabs;