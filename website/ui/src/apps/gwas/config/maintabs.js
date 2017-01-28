import React from 'react'

import GwasTab from '../components/gwas_tab'

class Gwas extends React.Component{
    render() {
        return (<div>
                <GwasTab />
                </div>);
    }
}


const MainTabInfo = {
    gwas: {title: "GWAS", visible: true, f: Gwas},
};

export default MainTabInfo;
