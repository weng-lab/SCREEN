import HistogramTab from '../components/fantomcat/histogramtab';
import OverlapTab from '../components/fantomcat/overlaptab';

const CHistogramTab = (key) => ({data}) => (
    <HistogramTab data={data[key]} />
);

const COverlapTab = (key) => ({data}) => {
    console.log(data);
    return <OverlapTab data={data[key]} />
};

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
    }
};
export default FantomCatTabs;
