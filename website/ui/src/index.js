import 'babel-polyfill'

import ReactDOM from 'react-dom';
import { Router, Route, browserHistory} from 'react-router';

import Search from './apps/search/main';
import GeneExp from './apps/geneexp/main';
import De from './apps/de/main';
import Gwas from './apps/gwas/main';

//import Tf from './apps/tf/main';
//<Route path="/comparison/:assembly" component={Comparison} />
//<Route path="/tfApp/:assembly/" component={Tf} />
//import Comparison from './apps/comparison/main';
// import CartPage from './apps/cart/main';
//     <Route path="/cart" component={CartPage} />

class IndexPage extends React.Component {
    render() {
        return (<div>
                <div className={"panel panel-default"}>
                <div className={"panel-body"}>
                <div className={"container-fluid"}>
                <div className={"row"}>
                <div className={"col-md-12"}>
                <div id={"mainTitle"}>{"SCREEN: Search Candidate Regulatory Elements by ENCODE"}<hr /></div>
                </div>
                </div>

                <div className={"row vertical-align"}>
                <div className={"col-md-6"}>
                <img className={"img-responsive"} src={"/static/encodeLogo.png"} alt={"ENCODE logo"} />
                </div>
                <div className={"col-md-6"}>
                <div className={"jumbotron"} id={"mainDesc"}>
                {"SCREEN is a web interface for searching and visualizing the Registry of candidate Regulatory Elements (cREs) derived from "}
                <a href={"https://encodeproject.org/"} target={"_blank"}>ENCODE data</a>
                {". The Registry contains 2.67M human cREs in hg19 and 1.67M mouse cREs in mm10, with orthologous cREs cross-referenced.  SCREEN presents the data that support biochemical activities of the cREs and the expression of nearby genes in specific cell and tissue types."}
	        <p>'You may launch SCREEN using the search box below or browse a curated list of SNPs from the NHGRI-EBI GWAS catalog to annotate genetic variants using cREs.'</p>
                <div id={"gwasGroup"}>
                <a className={"btn btn-primary btn-lg"} href={"/gwasApp/hg19/"} role={"button"}>{"Browse GWAS"}</a>
                </div>
                </div>
                </div>
                </div>

                <div className={"row"}>
                <div className={"col-md-12 text-center"}>
                <div>
                <form action={"search"} method={"get"} id={"searchform"}>
                <span style={{color : "#ff0000", fontWeight : "bold"}}>{"failedsearch"}</span>
                <br />
                <div className={"form-group text-center"}>
                <input id={"mainSearchbox"} type={"text"} name={"q"} defaultValue={"K562 chr11:5226493-5403124"} />
                <input id={"searchformassembly"} name={"assembly"} value={"hg19"} type={"hidden"} />
                </div>
                <div id={"mainButtonGroup"}>
	        <a className={"btn btn-primary btn-lg"} href={"javascript:searchHg19();"} role={"button"}>Search hg19</a>
	        <a className={"btn btn-success btn-lg"} href={"javascript:searchMm10();"} role={"button"}>Search mm10</a>
                <br />
                <br />
                <i>{'Examples: "K562 chr11:5226493-5403124", "SOX4 TSS", "rs4846913"'}</i>
                </div>
                </form>
                </div>
                </div>
                </div>
                </div>
                </div>
                </div>
                </div>);
    }
}

function myCreateElement(Component, props) {
    return (<Component {...props} />);
}

ReactDOM.render(
    (<Router history={browserHistory} createElement={myCreateElement} >
     <Route path="/" component={IndexPage} />
     <Route path="/search(.*)" component={Search} />
     <Route path="/geneexp/:assembly/:geneID" component={GeneExp} />
     <Route path="/deGene/:assembly/:geneID" component={De} />
     <Route path="/gwasApp/:assembly" component={Gwas} />
     </Router>),
    document.getElementById('root'));
