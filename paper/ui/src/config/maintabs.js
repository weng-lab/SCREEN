import TabFigs from '../components/tab_figs';
import TabSubFigs from '../components/tab_subfigs';
import TabTables from '../components/tab_tables';
import IntroTab from '../components/tab_intro';

const MainTabInfo = () => {
    return {
	intro: {title: "Intro", visible: true, f: IntroTab},
	figs: {title: "Figures", visible: true, f: TabFigs},
	subFigs: {title: "Extended Data Figures", visible: true, f: TabSubFigs},
	tables: {title: "Tables", visible: true, f: TabTables},
    };
}

export default MainTabInfo;
