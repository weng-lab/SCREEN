import React from 'react';

import TabMain from '../components/tab_main';
import TabAbout from '../components/tab_about';
import TabTutorial from '../components/tab_tutorial';
import TabQuery from '../components/tab_query';
import TabFiles from '../components/tab_files';

const MainTabsConfig = () => {
    return {main : {title: "Overview", visible: true, f: TabMain},
            about : {title: "About", visible: true, f: TabAbout},
            tutorial : {title: "Tutorial", visible: true, f: TabTutorial},
            query: {title: "Query Results", visible: false, f: TabQuery},
	    files: {title: "Files", visible: true, f: TabFiles}
    }
}

export default MainTabsConfig;
