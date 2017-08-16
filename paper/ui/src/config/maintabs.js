import TabFigs from '../components/tab_figs';
import TabSubFigs from '../components/tab_subfigs';
import TabTables from '../components/tab_tables';

const MainTabInfo = () => {
    return {figs : {title: "Figures", visible: true, f: TabFigs},
	    subFigs: {title: "Supp Figures", visible: true, f: TabSubFigs},
	    tables: {title: "Tables", visible: true, f: TabTables},
    };
}

export default MainTabInfo;
