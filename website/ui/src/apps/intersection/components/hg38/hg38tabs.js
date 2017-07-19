import React from 'react';
import TabContainer from '../tabcontainer';
import Hg38Tabs from '../../config/hg38';

const Hg38TabsC = ({ data, actions }) => {
    let tabs = {...Hg38Tabs};
    Object.keys(data).map(k => (
	tabs[k] ? tabs[k].data = {data: data[k], actions} : null
    ));
    return (<div><br /><TabContainer tabs={tabs} /></div>);
};
export default Hg38TabsC;
