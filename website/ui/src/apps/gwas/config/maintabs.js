/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Zhiping Weng
 */

import React from 'react'

import GwasTab from '../components/gwas_tab'
import ConfigureGenomeBrowser from '../../search/components/configure_genome_browser'

import DetailsTabInfo from '../../search/config/details';
import DetailsContainer from '../../search/components/details_container';

class DetailsTab extends React.Component{
    shouldComponentUpdate(nextProps, nextState) {
       return "details" === nextProps.maintabs_active;
    }
    render() {
       if("details" !== this.props.maintabs_active){
            return false;
       }
	return React.createElement(DetailsContainer, {...this.props,
						      tabs: DetailsTabInfo(this.props.assembly)});
    }
}

class Gwas extends React.Component{
    render() {
        return (
	    <div>
		{React.createElement(GwasTab, this.props)}
            </div>);
    }
}

const MainTabInfo = () => ({
    gwas: {title: "GWAS", visible: true, f: Gwas},
    details: {title: "cCRE Details", visible: false, f: DetailsTab},
    configgb: {title: "Configure Genome Browser", visible: false,
	       f: ConfigureGenomeBrowser}
});

export default MainTabInfo;
