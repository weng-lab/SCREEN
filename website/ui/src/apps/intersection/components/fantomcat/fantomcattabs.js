var React = require('react');
import TabContainer from '../tabcontainer';
import FantomCatTabs from '../../config/fantomcat';

const FantomCatTabsC = ({ data }) => {
    let tabs = {...FantomCatTabs};
    Object.keys(data).map(k => (
	tabs[k] ? tabs[k].data = data[k] : null
    ));
    return (<div><br /><TabContainer tabs={tabs} /></div>);
};
export default FantomCatTabsC;
