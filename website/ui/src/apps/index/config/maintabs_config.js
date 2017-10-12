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
	    ashg2017: {title: "ASHG 2017", visible: true, f: TabAshg2017}
    };
}

export default MainTabsConfig;
