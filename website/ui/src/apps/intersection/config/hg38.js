import Hg19Tab from '../components/hg38/hg19intersect';
import CistromeTab from '../components/hg38/cistromeintersect';
import SaturationTab from '../components/hg38/saturationtab';

const Hg38Tabs = {
    hg19intersect: {
	title: "hg19 liftover intersection",
	enabled: true,
	f: Hg19Tab
    },
    saturation: {
	title: "saturation curves",
	enabled: true,
	f: SaturationTab
    },
    cistromeintersect: {
	title: "cistrome liftover intersection",
	enabled: true,
	f: CistromeTab
    }
};
export default Hg38Tabs;
