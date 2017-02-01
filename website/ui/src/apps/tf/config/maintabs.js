import React from 'react'

import TfPage from '../components/tf_page'

class Tfpage extends React.Component{
    render() {
        return (<div>
                <TfPage />
                </div>);
    }
}

const MainTabInfo = {
    tf_enrichment: {title: "TF enrichment", visible: true, f: Tfpage},
};

export default MainTabInfo;
