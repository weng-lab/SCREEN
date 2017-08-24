let React = require('react');
import Figure from './figure'

const ITEMS_PER_ROW = 8.0;

class FigureTab extends React.Component {

    constructor(props) {
	super(props);
	this.state = {
	    figures: this._get_figures(props),
	    selected_figure: 0
	};
    }

    setSelection(i) {
	this.setState({ selected_figure: i });
    }

    componentWillReceiveProps(props) {
	this.setState({ figures: this._get_figures(props) });
    }
    
    render() {
	let subrows = Array(Math.ceil(this.state.figures.length / ITEMS_PER_ROW)).fill().map( () => [] );
	this.state.figures.map( (f, i) => {
	    subrows[Math.floor(i / ITEMS_PER_ROW)].push(f);
	} );
        return (
	  <div>
	      <div className="row">
		{subrows.map( (s, _i) => (
		  <ul className="nav nav-pills col-xs-12" key={_i}>
	            {s.map( (f, i) => (
	              <li key={"li" + _i + "_" + i} className={i + (_i * ITEMS_PER_ROW) === this.state.selected_figure ? "active" : ""} style={{width: Math.floor(100.0 / ITEMS_PER_ROW) + "%"}}>
	                  <a href="#" onClick={() => {this.setSelection(i + (_i * ITEMS_PER_ROW))}}>{f.title}</a>
	  	      </li>
		    ) )}
 	          </ul>
		) )}
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
