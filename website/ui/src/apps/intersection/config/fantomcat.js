import HistogramTab from '../components/fantomcat/histogramtab';
import OverlapTab from '../components/fantomcat/overlaptab';

const FantomCatTabs = {
    piecharts: {
	title: "intersection by class",
	enabled: true,
	f: OverlapTab
    },
    perkb: {
	title: "cREs per kb",
	enabled: true,
	f: HistogramTab
    }
};
export default FantomCatTabs;
