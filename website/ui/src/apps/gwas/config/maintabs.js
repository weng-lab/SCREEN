import React from 'react'

import GwasTab from '../components/gwas_tab'
import ConfigureGenomeBrowser from '../../search/components/configure_genome_browser'

class Gwas extends React.Component{
    render() {
        return (<div>
                <GwasTab />
                </div>);
    }
}

const MainTabInfo = () => ({
    gwas: {title: "GWAS", visible: true, f: Gwas},
    configgb: {title: "Configure Genome Browser", visible: false,
	       f: ConfigureGenomeBrowser}
});

export default MainTabInfo;
