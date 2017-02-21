import ReactDOM from 'react-dom';

import TabMain from './tab_main';
import TabAbout from './tab_about';
import TabTutorial from './tab_tutorial';

class IndexPage extends React.Component {
    tabTitle(href, title, className){
	return (<li className="{className}">
		<a  href="#{href}" data-toggle="tab">{title}</a>
		</li>);
    }
    
    tabContent(href, content, className){
	return (<div className="tab-pane {className{" id="{href}">
		{content}
		</div>);
    }
    
    render() {
        let tabs = (<div id="exTab1" className="container">

                    <ul  className="nav nav-pills">
		    {this.tabTitle("main", "Overview", "active")}
		    {this.tabTitle("about", "About", "")}
		    {this.tabTitle("tut", "Tutorial", "")}
		    </ul>

		    <div className="tab-content clearfix">
		    {this.tabContent("main", TabMain(), "active")}
		    {this.tabContent("about", TabAbout(), "")}
		    {this.tabContent("tut", TabTutorial(), "")}
		    </div>

                    </div>);

        return (<div>
                <div className={"container-fluid"}>

                <div className={"row"}>
                <div className={"col-md-12"}>
                <div id={"mainTitle"}>{"SCREEN: Search Candidate Regulatory Elements by ENCODE"}</div>
                </div>
                </div>

                </div>

                {tabs}
                </div>
               );
    }
}

export default IndexPage;
