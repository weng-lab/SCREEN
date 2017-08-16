import React from 'react'

import * as Para from './tab_encyc_desc';
import {tabPanelize} from '../../../common/utility'

class TabAbout extends React.Component {
    constructor(props) {
	super(props);
        this.key = "encyc"
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.key === nextProps.maintabs_active;
    }

    render() {
        if(this.key !== this.props.maintabs_active){
	    return false;
	}

	const fig = (num, title, desc, style = {}) => {
	    return (
		<div className="row">
                    <div className="col-md-6">
                        <h3>{title}</h3>
                        {Para.figure(num, desc,
                                     {style})}
                    </div>
                </div>);
	}
	
        let content = (
            <div>
                {fig(1, "", "")}
		{fig(2, "", "")} 
		{fig(3, "", "")}
		{fig(4, "", "")}
		{fig(5, "", "")}
		{fig(6, "", "")}
		{fig(7, "", "")}
		{fig(8, "", "")}
		{fig(9, "", "")}
		{fig(10, "", "")}
		{fig(11, "", "")}
		{fig(12, "", "")}
		{fig(13, "", "")}
		{fig(14, "", "")}
		{fig(15, "", "")}
		{fig(16, "", "")}
		{fig(17, "", "")}
		{fig(18, "", "")}
		{fig(19, "", "")}
		{fig(20, "", "")}
		{fig(21, "", "")}
		{fig(22, "", "")}
		{fig(23, "", "")}
		{fig(24, "", "")}
		{fig(25, "", "")}
		{fig(26, "", "")}
		{fig(27, "", "")}
		{fig(28, "", "")}
		{fig(29, "", "")}
		{fig(30, "", "")}
		{fig(31, "", "")}
		{fig(32, "", "")}
		{fig(33, "", "")}
		{fig(34, "", "")}
		{fig(35, "", "")}
           </div>);
	
        return (tabPanelize(
            <div>
                {content}
            </div>));
    }
}

export default TabAbout;
