import HistogramTab from '../components/fantomcat/histogramtab';
import HistogramZTab from '../components/fantomcat/histogramztab';
import ViolinTab from '../components/fantomcat/violintab';
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
    },
    piecharts_twokb: {
	title: "intersection by class, TSS +/- 2kb",
	enabled: true,
	f: OverlapTab
    },
    perkb_twokb: {
	title: "cREs per kb, TSS +/- 2kb",
	enabled: true,
	f: HistogramTab
    },
    perkbz: {
	title: "cREs per kb by cRE type",
	enabled: true,
	f: HistogramZTab
    },
    testviolin: {
	title: "test violin",
	enabled: true,
	f: ViolinTab
    }
};
export default FantomCatTabs;
