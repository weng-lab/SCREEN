var React = require('react');

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/searchbox_actions';

class SearchBox extends React.Component {
    makeVal(p) {
        let r = "";
        if(p.coord_chrom && p.coord_start && p.coord_end){
            r += p.coord_chrom + ":" + p.coord_start + "-" + p.coord_end + " ";
        } else if(p.coord_start && p.coord_end){
            r += p.coord_start + "-" + p.coord_end + " ";
        }

        if(p.cellType){
            r += p.cellType;
        }

        return r;
    }

    render() {
        const doSubmit = (e) => {
            e.preventDefault();
            this.props.actions.makeSearchQuery(this.refs.input.value);
        }

	return (<form action="search" method="get" onSubmit={doSubmit}
                className="navbar-collapse navbar-searchform">

	        <input className="searchbox" type="text" size="100" name="q"
                ref="input" value={this.makeVal(this.props)}/>&nbsp;

                <a className="btn btn-primary btn-lg searchButton"
                onClick={doSubmit} role="button">Search</a>

		</form>);
    }
}

const mapStateToProps = (state) => ({
        ...state
});

const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SearchBox);
