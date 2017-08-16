import React from 'react';
import Tab from '../common/components/tab';
import Figure from './figure';

class TabSubFigs extends React.Component {
    constructor(props) {
	super(props);
        this.key = "figs"
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.key === nextProps.maintabs_active;
    }

    render() {
        if (this.key !== this.props.maintabs_active) {
	    return false;
	}
	const ext_figures = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
			     11, 12, 13, 14, 15, 16, 17, 18,
			     19, 20, 21, 22];
        return (
	    <Tab>
	      {ext_figures.map( i => (
	        <Figure number={i} title={"Extended Data Figure " + i} style={{}}
		  description={this.props.globals.extlegends[i - 1]}
		  url={"http://users.wenglab.org/pratth/Extended-Data-Figure-" + i + ".svg"} />
	      ) )}
            </Tab>
	);
    }
}

export default TabSubFigs;
