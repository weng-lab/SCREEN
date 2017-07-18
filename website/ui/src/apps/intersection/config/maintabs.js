
import React from 'react'

import FantomCatTab from '../components/fantomcattab'
import Hg38Tab from '../components/hg38tab'
import ConfigureGenomeBrowser from '../../search/components/configure_genome_browser'

class FantomCat extends React.Component{
    render() {
        return (<div>
                    <FantomCatTab />
                </div>);
    }
}

class Hg38 extends React.Component {
    render() {
	return <div><Hg38Tab /></div>;
    }
}

const MainTabInfo = () => ({
    fantomcat: {title: "FantomCAT", visible: true, f: FantomCat},
    hg38: {title: "Hg38 cREs", visible: true, f: Hg38},
    configgb: {title: "Configure Genome Browser", visible: false,
	       f: ConfigureGenomeBrowser}
});

export default MainTabInfo;
