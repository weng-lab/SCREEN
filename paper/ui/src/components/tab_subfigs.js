import React from 'react';

import Tab from '../common/components/tab';
import FigureTab from './figuretab'

class TabSubFigs extends FigureTab {
    
    constructor(props) {
	super(props);
        this.key = "subFigs";
    }

    _get_figures(props) {
	const extensions = ["svg", "png", "png", "svg", "svg", "svg", "svg", "svg", "svg", "svg",
			    "svg", "svg", "svg", "svg", "svg", "svg", "svg", "svg", "svg", "svg",
			    "svg", "svg", "png", "png", "svg", "svg", "svg", "svg", "svg", "png",
			    "png", "png"];
	return Array(32).fill().map( (_, i) => ({
	    smtitle: "Ext. Data Fig. " + (i + 1), // + ": " + props.globals.exttitles[i],
	    title: i + 1,
	    url: "http://users.wenglab.org/pratth/Extended-Data-Figure-" + (i + 1) + "." + extensions[i],
	    legend: props.globals.extlegends[i],
	    header: props.globals.extheaders[i]
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
