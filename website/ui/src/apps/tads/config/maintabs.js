import React from 'react'

import CTCFPage from '../components/ctcf_page'

class CTCFDistrPage extends React.Component{
    render() {
        return (
            <div>
                <CTCFPage />
            </div>
	);
    }
}

const MainTabInfo = {
    ctcf_distr: {title: "CTCF distribution", visible: true, f: CTCFDistrPage},
};

export default MainTabInfo;
