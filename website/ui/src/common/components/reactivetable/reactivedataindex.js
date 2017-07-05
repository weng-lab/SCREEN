import React from 'react';

import { createStore } from 'redux';


import { Provider } from 'react-redux';

import ReactiveTable from './reactivetable';


import { reducers } from './reducers/index';
import App from './app';





class ReactiveDataIndex extends React.Component {

  constructor(props) {
      super(props);

const users = [];

for (let i=1; i<10; i++)
{
users.push({id:i, username: 'John ' + i, job: 'Employee' + i });



}


      this.state = {
	  cols: [
	{
	    key:'info', label: "accession"
	}, {
            key: 'ctspecifc', label: "k562"
	}, {
	    key: 'dnase_zscore', label: "DNase Z"
	}, {
	    key: 'promoter_zscore', label: "H3K4me3<br/> Z" 
	}, {
	    key: 'enhancer_zscore', label: "H3K27ac Z"
	}, {
	    key: 'ctcf_zscore', label: "CTCF Z"
	}, {
	    key: 'chrom', label: "chr"
	}, {
	    key: 'start', label: "start"
	}, {
	    key: 'len', label: "length"
	}, {
            key: 'genesallpc', label: "geneHelp"
	}, {
	    key: 'in_cart', label: "cart"
	}, {
	    key: 'genomebrowsers', label: "genome browsers"
	}
    ],  


users: users, 




      }


  }





    render() { 



const initial_state={users: {list: this.state.users},};



let middleware = applyMiddleware(routerMiddleware(browserHistory));
const store = createStore(reducers, initial_state, middleware);
const history = syncHistoryWithStore(browserHistory, store);





	return (
		<div>

	 <ReactiveTable data = {this.props.data} cols={this.state.cols} columnkey={"key"} columnlabel={"label"}/>
  <br></br><br></br><br></br>

    <Provider store={store}>
        <App/>
    </Provider>
		<br></br><br></br><br></br>
	    </div> );
    
    }






}

export default ReactiveDataIndex; 






