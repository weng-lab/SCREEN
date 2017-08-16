import React from 'react';

import Tab from '../common/components/tab'
import FigureTab from './figuretab'

class TabFigs extends FigureTab {
    
    constructor(props) {
	super(props);
        this.key = "figs";
    }

    _get_figures(props) {
	return Array(8).fill().map( (_, i) => ({
	    title: "Figure " + (i + 1) + ": " + props.globals.titles[i],
	    url: "http://users.wenglab.org/pratth/Figure-" + (i + 1) + ".svg",
	    legend: props.globals.legends[i],
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

export default TabFigs;
