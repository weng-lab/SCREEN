let React = require('react');
import Figure from './figure'
import { Pagination } from 'react-bootstrap'

class FigureTab extends React.Component {

    constructor(props) {
	super(props);
	this.state = {
	    figures: this._get_figures(props),
	    selected_figure: 0
	};
    }

    setSelection(i) {
	this.setState({ selected_figure: i - 1 });
    }

    componentWillReceiveProps(props) {
	this.setState({ figures: this._get_figures(props) });
    }
    
    render() {
        return (
	  <div>
	      <div style={{width: "100%", align: "center"}}>	
		<Pagination className="users-pagination" bsSize="medium"  maxButtons={32}
	          items={this.state.figures.length} activePage={this.state.selected_figure + 1}
	          onSelect={this.setSelection.bind(this)} />
              </div>
	      <div className="row">	
		<div className="col-xs-12">
	          {this.state.figures.map( (f, i) => ( i !== this.state.selected_figure ? null : 
 		    <Figure key={"fig" + i} number={i} title={f.title} description={f.legend} url={f.url} header={f.header} />
		  ) )}
	        </div>
	      </div>
 	  </div>
	);
    }

}
export default FigureTab;
