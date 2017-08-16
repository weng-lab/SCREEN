import React from 'react';

import Tab from '../common/components/tab';
import FigureTab from './figuretab'

class TabSubFigs extends FigureTab {
    
    constructor(props) {
	super(props);
        this.key = "subFigs";
    }

    _get_figures(props) {
	return Array(22).fill().map( (_, i) => ({
	    title: "Extended Data Figure " + (i + 1),
	    url: "http://users.wenglab.org/pratth/Extended-Data-Figure-" + (i + 1) + ".svg",
	    legend: props.globals.extlegends[i]
	}) );
    }
    
    shouldComponentUpdate(nextProps, nextState) {
        return this.key === nextProps.maintabs_active;
    }

    render() {
        if (this.key !== this.props.maintabs_active) {
	    return false;
	}
	return (
	    <Tab>
		{super.render()}
	    </Tab>
	);
    }
}

export default TabSubFigs;
