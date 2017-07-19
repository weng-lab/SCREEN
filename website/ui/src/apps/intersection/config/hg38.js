import Hg19Tab from '../components/hg38/hg19intersect';
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
    }
};
export default Hg38Tabs;
