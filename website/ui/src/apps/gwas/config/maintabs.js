import React from 'react'

import GwasExp from '../components/gwas_exp'

class Gwas extends React.Component{
    render() {
        return (<div>
		{"hi!"}
                </div>);
    }
}


const MainTabInfo = {
    gwas: {title: "GWAS", visible: true, f: Gwas},
};

export default MainTabInfo;
