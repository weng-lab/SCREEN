import React from 'react'

import TabMain from '../components/tab_main';
import TabAbout from '../components/tab_about';
import TabTutorial from '../components/tab_tutorial';
import TabQuery from '../components/tab_query';
import TabFiles from '../components/tab_files';
import TabAshg2017 from '../components/tab_ashg_2017';

const MainTabsConfig = () => {
    return {main : {title: "Overview", visible: true, f: TabMain},
            about : {title: "About", visible: true, f: TabAbout},
            tutorial : {title: "Tutorial", visible: true, f: TabTutorial},
            query: {title: "Query Results", visible: false, f: TabQuery},
	    files: {title: "Files", visible: true, f: TabFiles},
	    ashg2017: {title: (
		<span className="btn btn-warning" style={{display: "inline"}}>
		    <span className="glyphicon glyphicon-star" aria-hidden="true"></span>
		    ASHG 2017
		</span>),
		       visible: true, f: TabAshg2017}
    };
}

export default MainTabsConfig;
