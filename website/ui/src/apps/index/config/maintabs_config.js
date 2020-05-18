import TabMain from '../components/tab_main';
import TabAbout from '../components/tab_about';
import TabTutorial, { TabUCSC } from '../components/tab_tutorial';
import TabQuery from '../components/tab_query';
import TabFiles from '../components/tab_files';
import TabVersions from '../components/tab_versions';
import TabAPI from '../components/tab_api';

const MainTabsConfig = () => {
    return {main : {title: "Overview", visible: true, f: TabMain},
            about : {title: "About", visible: true, f: TabAbout},
	    ucsc : {title: "UCSC Genome Browser", visible: true, f: TabUCSC},
            tutorial : {title: "Tutorials", visible: true, f: TabTutorial},
	    files: {title: "Downloads", visible: true, f: TabFiles},
	    versions: {title: "Versions", visible: true, f: TabVersions},
            query: {title: "Query Results", visible: false, f: TabQuery},
            /*api: {title: "API", visible: true, f: TabAPI}*/
    };
}

export default MainTabsConfig;
