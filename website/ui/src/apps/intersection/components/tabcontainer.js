import React from 'react';

class TabContainer extends React.Component {

    constructor(props) {
	super(props);
	this.state = {
	    active: Object.keys(this.props.tabs)[0]
	};
	this._active = key => key === this.state.active;
    }
    
    title(key, tab) {
        let active = this._active(key);
        if (!tab.enabled) { return <div />; }
	let cn = (active ? "active" : "") + " detailsTabTitle";
        return (<li className={cn}
		  key={"tab_" + key}
		  onClick={ () => { this.setState({ active: key }) }}>
		    <a data-toggle="tab">{tab.title}</a>
		</li>);
    }

    tab(key, tab) {
        let active = this._active(key);
	let content = (active ? React.createElement(tab.f, tab.data) : null);
        return (<div
                  className={active ? "tab-pane active" : "tab-pane"}
                  id={"tab_" + key}
                  key={"tpane_" + key}>
		    {content}
		</div>);
    }
    
    render() {
	let tabs = this.props.tabs;
	return (
            <div className="container" style={{width: "100%"}}>
                <ul className="nav nav-tabs">
  		    {Object.keys(tabs).map(key => this.title(key, tabs[key]))}
                </ul>
		<div className="tab-content clearfix">
		    {Object.keys(tabs).map(key => this.tab(key, tabs[key]))}
		</div>
	    </div>
	);
    }
}
export default TabContainer;
