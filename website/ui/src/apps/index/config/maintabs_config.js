import TabMain from '../components/tab_main';
import TabAbout from '../components/tab_about';
import TabTutorial from '../components/tab_tutorial';
import TabQuery from '../components/tab_query';
import TabFiles from '../components/tab_files';
import TabData from '../components/tab_data';

const MainTabsConfig = () => {
    return {main : {title: "Overview", visible: true, f: TabMain},
            about : {title: "About", visible: true, f: TabAbout},
            tutorial : {title: "Tutorials", visible: true, f: TabTutorial},
	    files: {title: "Downloads", visible: true, f: TabFiles},
	    input_data: {title: "Versions", visible: true, f: TabData},
            query: {title: "Query Results", visible: false, f: TabQuery}
    };
}

export default MainTabsConfig;
