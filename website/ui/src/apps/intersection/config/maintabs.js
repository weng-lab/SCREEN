
import React from 'react'

import FantomCatTab from '../components/fantomcattab'
import ConfigureGenomeBrowser from '../../search/components/configure_genome_browser'

class FantomCat extends React.Component{
    render() {
        return (<div>
                    <FantomCatTab />
                </div>);
    }
}

const MainTabInfo = () => ({
    fantomcat: {title: "FantomCAT", visible: true, f: FantomCat},
    configgb: {title: "Configure Genome Browser", visible: false,
	       f: ConfigureGenomeBrowser}
});

export default MainTabInfo;
