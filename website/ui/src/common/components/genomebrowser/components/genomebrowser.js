import React from 'react';
import ReactDOM from 'react-dom';
import * as d3 from "d3";
import '../../../../css.css'
import Modal from './modal'
import Rects from './rects'
import ToolTip from './tooltip'
import * as ApiClient from '../../../api_client';
import {makeBwg} from '../external/igvjs/bigwig';
import {URLFetchable} from '../external/igvjs/bin';

class Polylines extends React.Component {

     render() {
          var _self=this;
          if(_self.props.range===undefined  || _self.props.viewLimits===undefined  )
          {
            return null;
          }
          var viewl=this.props.viewLimits,vl;

          if(viewl!==undefined)
             vl=viewl.split(":");
          var y =  d3.scaleLinear().domain([vl[1],vl[0]]).range([_self.props.range ,_self.props.range+50]);
          var yAxis = d3.axisLeft().scale(y);
          yAxis.tickValues(y.ticks(1).concat(y.domain()));
          var data=this.props.data;
          var color ="rgb("+this.props.color+")";
          var x=((_self.props.x(_self.props.min)+_self.props.x(_self.props.max)/parseInt(2)))-parseInt(100);
          var points=_self.props.x(_self.props.min)+","+y(0)+" ";
          var text = _self.props.text;
          if(data===undefined)
          {
            text=""
          }
            if(data)
            {
                data.map(function(d,i)
                {
                  if(d.score > vl[1])
                    d.score =vl[1];

                  for(var j= _self.props.x(d.min);j<=_self.props.x(d.max);j++)
                  {
                    if(j>=_self.props.leftMargin && j <=_self.props.width)
                    points=points + j+","+y(d.score)+" ";
                  }
                });
           }
              points=points +_self.props.x(_self.props.max)+","+y(0);
          return(
              <g>
                  <g transform="translate(100,0)">
                    <Axis  axis={yAxis}/>
                  </g>
                  <polygon points={points} stroke={color} fill={color} strokeWidth="0.1"/>
                  <text x={x} y={_self.props.range-10} fill={color} >{text}</text>
                  <text x={0} y={y(0)}>{_self.props.shortLabel}</text>
              </g>
          );
      }
  }
  class MoveZoom extends React.Component {

     render() {

        var _self=this;
         return (
               <div>
                   Move &nbsp;
                  <input type="submit"  id="backwardbtn95" onClick={_self.props.backward} title="Move 95% to the left" value="<<<"/>
                  <input type="submit"  id="backwardbtn47.5" onClick={_self.props.backward} title="Move 47.5% to the left" value="<<"/>
                  <input type="submit"  id="backwardbtn10" onClick={_self.props.backward} title="Move 10% to the left" value="<"/>
                  <input type="submit" id="forwardbtn10" onClick={_self.props.forward} title="Move 10% to the right" value=">"/>
                  <input type="submit" id="forwardbtn47.5" onClick={_self.props.forward} title="Move 47.5% to the right" value=">>"/>
                  <input type="submit" id="forwardbtn95" onClick={_self.props.forward} title="Move 95% to the right" value=">>>"/>
                  &nbsp;&nbsp;
                  Zoom in&nbsp;
                  <input type="submit"  id="zoomin1.5x" onClick={_self.props.zoomin} value="1.5x"/>
                  <input type="submit"  id="zoomin3x"   onClick={_self.props.zoomin} value="3x"/>
                  <input type="submit"  id="zoomin10x"  onClick={_self.props.zoomin} value="10x"/>
                  &nbsp;&nbsp;
                  Zoom out&nbsp;
                  <input type="submit"  id="zoomout1.5x" onClick={_self.props.zoomout} value="1.5x"/>
                  <input type="submit"  id="zoomout3x" onClick={_self.props.zoomout} value="3x"/>
                  <input type="submit"  id="zoomout10x" onClick={_self.props.zoomout} value="10x"/>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <input type="submit" id="loadtrackhb" onClick={_self.props.loadTrackhub} value="Load Trackhub"/>
               </div>
         );
     }
  }
  class Axis extends React.Component {
     componentDidUpdate() { this.renderAxis(); }
     componentDidMount() { this.renderAxis(); }
     renderAxis() {
         var node = ReactDOM.findDOMNode(this);
         d3.select(node).call(this.props.axis);
     }
     render() {
         return (
             <g className="axis"> </g>
         );
     }
  }
  class Grid extends React.Component {

      componentDidUpdate() { this.renderGrid(); }
      componentDidMount() { this.renderGrid(); }
      renderGrid() {
          var node = ReactDOM.findDOMNode(this);
          d3.select(node).call(this.props.grid);

      }
      render() {
          var translate = "translate(0,"+(this.props.h)+")";
          return (
              <g className="y-grid" transform={this.props.gridType==='x'?translate:""}>
              </g>
          );
      }

  }
  class GenomeBrowser extends React.Component {

       static defaultProps = { width: 1200, height: 200, marginleft:100,marginright: 100};
       constructor(props)
       {
         super(props)
         this.state = {
                        tooltip: {display:false,data:{width:'',height:'',value:''},pos:{x:'',y:''}},
                        xminrange:this.props.minrange,xmaxrange:this.props.maxrange,
                        chrom : 'chr11', bp : (this.props.maxrange -this.props.minrange),
                        x : d3.scaleLinear().domain([this.props.minrange,this.props.maxrange]).range([this.props.marginleft , this.props.width ]),
                        bbdata: {},bwdata :{} ,bwinput : [],bbinput: [],checkedstatus: {},exons : [],
                        isModalOpen: false, showK562: false,height:50,signaltype : {},isFetching: true, isError: false,input: []
                      }
       }
       showToolTip = (e) =>
       {
           this.setState({tooltip:{
               display:true,
               data: {
                   width:e.target.getAttribute('width'),
                   height:e.target.getAttribute('height'),
                   value:e.target.getAttribute('data-value')
                   },
               pos:{
                   x:e.target.getAttribute('x'),
                   y:e.target.getAttribute('y')
                   }
               }
           });
       }
       hideToolTip =(e) =>
       {
           this.setState({tooltip:{ display:false,data:{width:'',height:'',value:''},pos:{x:'',y:''}}});
       }
       componentWillMount(){
          this.changerange();
       }
       componentWillReceiveProps()  {
         this.changerange();
       }
       changerange()
       {
         this.setState({xminrange:this.props.minrange,xmaxrange:this.props.maxrange},() =>{
             var xrange = d3.scaleLinear().domain([this.state.xminrange,this.state.xmaxrange]).range([this.props.marginleft , this.props.width]);
           this.setState({x:xrange},() =>{
             this.readBigBed();
             this.readBigWig();
           });
           })

       }
       componentDidMount()
       {
         this.loadThub()
       }
       loadThub()
       {
         const q = {assembly: this.props.assembly};
         var jq = JSON.stringify(q);
         this.setState({isFetching: true});
         ApiClient.getByPost(jq, "/gbws/trackhub",
         (r) => {
                  this.setState({input: r});
             },
           (msg) => {
         console.log("err loading trackhub");
         console.log(msg);
        this.setState({bbinput: [],
                 isFetching: false, isError: true});
           });
       }
       handlecheck = (e) =>
       {
         let key = e.target.id;
         let c = this.refs[key].checked;
         this.setState({checkedstatus: Object.assign({},this.state.checkedstatus,{ [key]: c })});
         if(c===false)
         {
              let signaltype =this.state.signaltype,obj
              Object.keys(signaltype).forEach(function(k)
              {
                if(key===k)
                {
                   obj = signaltype[k];
                }
              });
              if(obj === "bigbed")
              {
               this.setState((prevState)=> {return{height:prevState.height - 40}});
               let bb = this.state.bbdata;
               delete bb[key];

               this.setState(
               {
                   bbdata: bb// Object.assign( {},this.state.bbdata, { [key]: [] })
               });
              }
              else if (obj === "bigwig") {
                this.setState((prevState)=> {return{height:prevState.height - 100}});
                let bw = this.state.bbdata;
                delete bw[key];
                this.setState(
                {
                    bwdata: bw//Object.assign({},this.state.bwdata,{ [key]: [] })
                });
               }
         }
         else {

               let input=this.state.input;

               for (let j = 0; j < input.length; j++)
               {
                 if(input[j]["shortLabel"]===key &&  input[j]["type"]!=="bigWig")
                 {
                   this.setState((prevState)=> {return{height:prevState.height + 50}});
                   this.setState({signaltype: Object.assign({},this.state.signaltype,{ [key]: "bigbed" })});
                   this.setState({ bbinput: [...this.state.bbinput, input[j]] },()=> {this.readBigBed()})
                 }
                 else if(input[j]["shortLabel"]===key &&  input[j]["type"]==="bigWig")
                 {
                   this.setState((prevState)=> {return{height:prevState.height + 100}});
                   this.setState({signaltype: Object.assign({},this.state.signaltype,{ [key]: "bigwig" })});
                   this.setState({ bwinput: [...this.state.bwinput, input[j]] },()=> {this.readBigWig()})
                 }
               }
         }
       }
       closeModal = () =>
       {
          this.setState({ isModalOpen: false })
       }
       loadTrackhub = () =>
       {
          this.setState({ isModalOpen: true },()=>{this.loadcheckboxes()})
       }
       readBigWig()
       {
         let bwurl =[];
         bwurl = this.state.bwinput;
         let start= this.state.xminrange,end=this.state.xmaxrange,chrom=this.state.chrom;
         let urlLength = bwurl.length;

         for (let j = 0; j < urlLength; j++)
         {
           let key = bwurl[j]["shortLabel"],
           url = bwurl[j]["bigDataUrl"],
           color = bwurl[j]["color"],
           viewLimits = bwurl[j]["viewLimits"],
           shortLabel = bwurl[j]["shortLabel"];
           makeBwg(new URLFetchable(url), function(bwg, err) {
           if (bwg)
           {
            let data,zoomFactor=-1;
            if (zoomFactor< 0)
            {
              data = bwg.getUnzoomedView();
            } else {
              data = bwg.getZoomedView();
            }

            data.readWigData(chrom, start, end, function(data, err)
            {
              if(data)
              {
                  this.setState(
                    {
                        bwdata: Object.assign(
                          {},
                          this.state.bwdata,
                          { [key]:[data,bwurl[j]["longLabel"],shortLabel,color,viewLimits] }
                        )
                    });
              }
              else
              {
                    console.log("error!", err);
              }
            }.bind(this));
            }
            else
            {
            console.log("error!", err);
            }
          }.bind(this));
        }
       }
       readBigBed()
       {
         let bburl = this.state.bbinput;
         for (let j = 0; j < bburl.length; j++)
         {
             let key = bburl[j]["shortLabel"],
             longLabel = bburl[j]["longLabel"],
             shortLabel = bburl[j]["shortLabel"];
             let chrom=this.state.chrom,start=this.state.xminrange,end=this.state.xmaxrange
             makeBwg(new URLFetchable("https://www.encodeproject.org/files/ENCFF415FGZ/@@download/ENCFF415FGZ.bigBed"), function(bwg, err)
                {
                  if(bwg)
                  {
                     let data,zoomFactor=-1;
                     if (zoomFactor< 0)
                      data = bwg.getUnzoomedView();
                     else
                      data = bwg.getZoomedView();
                     data.readWigData(chrom, start, end, function(data, err)
                     {
                        if(data)
                        {
                          this.setState({
                        bbdata: Object.assign(
                          {},
                          this.state.bbdata,
                          { [key]: [data,longLabel,shortLabel] }
                        )})
                        }
                        else
                          console.log("error!", err);

                     }.bind(this));
                  }
                  else
                    console.log("error!", err);

                }.bind(this));
          }
       }
       updateforwardSize = (e) =>
       {
          var range =0;
          if (e.target.id==='forwardbtn10')
          {
             range=Math.round(this.state.bp *0.10);
          }
          else if(e.target.id==='forwardbtn47.5')
          {
            range=Math.round(this.state.bp *0.475);
          }
          else if (e.target.id==='forwardbtn95')
          {
              range=Math.round(this.state.bp *0.95);
          }
         this.setState((prevState) =>
          {
            return {xminrange: parseInt(prevState.xminrange) + parseInt(range),xmaxrange: parseInt(prevState.xmaxrange) + parseInt(range)};
          },() => {
               let xrange = d3.scaleLinear().domain([this.state.xminrange,this.state.xmaxrange ]).range([this.props.marginleft , this.props.width ]);
               this.setState({x:xrange},() => { this.readBigBed();this.readBigWig();
               })
          });
       }
       updatebackwardSize = (e) =>
       {
          var range =0;
          if (e.target.id==='backwardbtn10')
          {
                   range=Math.round(this.state.bp *0.10);
          }
          else if(e.target.id==='backwardbtn47.5')
          {
                  range=Math.round(this.state.bp *0.475);
          }
          else if (e.target.id==='backwardbtn95')
          {
                  range=Math.round(this.state.bp *0.95);
          }
          this.setState((prevState) => {
                    return {xminrange: parseInt(prevState.xminrange) - parseInt(range,10),xmaxrange: parseInt(prevState.xmaxrange) - parseInt(range,10)};
                  },() => {
                    var xrange = d3.scaleLinear().domain([this.state.xminrange,this.state.xmaxrange ]).range([this.props.marginleft , this.props.width]);
                     this.setState({x:xrange},() => {this.readBigBed(); this.readBigWig();
                      })
                    });
       }
       zoomin = (e) =>
       {
         var mean= Math.round((parseInt(this.state.xminrange,10) + parseInt(this.state.xmaxrange,10))/2);
         var range =0,diff=0;
         if (e.target.id==='zoomin1.5x')
         {
             diff= Math.round((this.state.bp)/1.5);
             range =Math.round(diff/2);
         }
         else if(e.target.id==='zoomin3x')
         {
             diff= Math.round((this.state.bp)/3);
             range =Math.round(diff/2);
         }
         else if(e.target.id==='zoomin10x')
         {
             diff= Math.round((this.state.bp)/10);
             range =Math.round(diff/2);
         }
         this.setState({xminrange:parseInt(mean,10)-parseInt(range,10)},
         () => {
           this.setState({xmaxrange:parseInt(this.state.xminrange,10)+parseInt(diff,10)},
           () => {
             this.setState({bp:(parseInt(this.state.xmaxrange,10)-parseInt(this.state.xminrange,10))});
             let xrange = d3.scaleLinear().domain([this.state.xminrange,this.state.xmaxrange]).range([this.props.marginleft , this.props.width]);
             this.setState({x:xrange},()=>{ this.readBigBed(); this.readBigWig();
             });
              })
            });
       }
       zoomout = (e) =>
       {
         var mean= Math.round((parseInt(this.state.xminrange,10) + parseInt(this.state.xmaxrange,10))/2);
         var range =0,diff=0;
         if (e.target.id==='zoomout1.5x')
         {
             diff= Math.round(this.state.bp*1.5);
             range =Math.round(diff/2);
         }
         else if(e.target.id==='zoomout3x')
         {
           diff= Math.round(this.state.bp*3);
           range =Math.round(diff/2);
         }
         else if(e.target.id==='zoomout10x')
         {
           diff= Math.round(this.state.bp*10);
           range =Math.round(diff/2);
         }
         this.setState({xminrange:parseInt(mean,10)-parseInt(range,10)},
         () => {
           this.setState({xmaxrange:parseInt(this.state.xminrange,10)+parseInt(diff,10)},
           () => {
             this.setState({bp:(parseInt(this.state.xmaxrange,10)-parseInt(this.state.xminrange,10))});
             var xrange = d3.scaleLinear().domain([this.state.xminrange,this.state.xmaxrange]).range([this.props.marginleft , this.props.width]);
             this.setState({x:xrange},() =>{ this.readBigBed(); this.readBigWig();
             });
           })
         });
       }
       pasteonselect = (e) => {
        this.refs.itext.value =e.target.value;
       }
       buttonclick = () =>
       {
         var inp =this.refs.itext.value,ivc,iv=null;
         if(inp==="")
         {
           alert("Invalid Input");
         }
         else {
            ivc = inp.split(":");
            iv = ivc[1].split("-");
         }
         if(iv!=null)
         {
           this.setState({xminrange:iv[0],xmaxrange:iv[1]},() =>{
             var xrange = d3.scaleLinear().domain([this.state.xminrange,this.state.xmaxrange]).range([this.props.marginleft , this.props.width]);
           this.setState({x:xrange},() =>{
             this.readBigBed();
             this.readBigWig();
           });
         })
         this.setState({chrom:ivc[0]});
         this.setState({bp:(iv[1]-iv[0])});
         }

       }
       toggleshow = () =>
       {
          this.setState((prevState)=> {return{showK562:!prevState.showK562}},()=>{
            if(this.state.showK562===true)
            this.loadcheckboxes();
          });
       }
       loadcheckboxes = () =>
       {
         let checkedstatus =  this.state.checkedstatus, _self = this;
         Object.keys(checkedstatus).forEach(function(key)
         {
               let obj = checkedstatus[key];
               if(obj ===true)
               {
                _self.refs[key].checked = true;
               }
         });
       }
       render()
       {
           let currentrange = this.state.chrom+":"+this.state.xminrange+"-"+this.state.xmaxrange;
           let bp = parseInt(this.state.bp,10)+1;
           let  xAxis = d3.axisBottom().scale(this.state.x);
           let  xGrid = d3.axisBottom().scale(this.state.x).ticks(100).tickSize(this.state.height, 0, 0).tickFormat("");
           let bigbed = this.state.bbdata, bigwig = this.state.bwdata,bbarr = [],bwarr = [];
           let _self=this,rects = [],r=70,pls=[],diff,max,show,hide,labels,k562lables,crerect;
           max =   parseInt(this.props.selectedaccession.start) + parseInt(this.props.selectedaccession.len)
           diff = this.state.x(max)-this.state.x(this.props.selectedaccession.start)

           if(Object.keys(this.state.bbdata).length !== 0 || Object.keys(this.state.bwdata).length !== 0)
           {
               crerect = (<rect x={this.state.x(this.props.selectedaccession.start)} y={20} style={{opacity:"0.5",fill:"lightblue"}} data-value={this.props.selectedaccession.accession} width={diff} height={this.state.height} onMouseOver={this.showToolTip} onMouseOut={this.hideToolTip}/>)
           }

           //Modal Tracks
           if(this.state.isModalOpen===true)
           {
              show =   <input type="submit" value="+" onClick={_self.toggleshow}/>;
              hide =   <input type="submit" value="-" onClick={_self.toggleshow}/>;
           }

           //Labels
            labels =this.state.input.map((d,i) => {
             if(d.parent==="")
             return ( <div key={i}> <input type="checkbox" ref={d.shortLabel} onClick={_self.handlecheck} id={d.shortLabel} key={i} value={d.longLabel} ></input> {d.longLabel} </div>);
             else return []
           });

           //showK562 Labels
           if(this.state.showK562===true)
           {
             k562lables =this.state.input.map((d,i) => {
              if(d.parent!=="")
              return ( <div key={i}> <input type="checkbox" ref={d.shortLabel} onClick={_self.handlecheck} id={d.shortLabel} key={i} value={d.longLabel} ></input> {d.longLabel}</div>);
               else return []
            });
           }
          //bigbed rects
           Object.keys(bigbed).forEach(function (key)
           {
             let obj = bigbed[key];
             bbarr = [];
             bbarr.push(obj[0])
             if(obj[0]!==undefined)
             {
               rects.push(bbarr.map((d) =>
               {
                   return (<Rects text={obj[1]} data={d} leftMargin={_self.props.marginleft} width={_self.props.width} shortLabel={obj[2]} key={r} x={_self.state.x} min={_self.state.xminrange} max={_self.state.xmaxrange} y={r}  showToolTip={_self.showToolTip} hideToolTip={_self.hideToolTip}   />);           }));
               r+=40;
             }

           });
           //bigwig signals
            Object.keys(bigwig).forEach(function(key)
            {
                let obj = bigwig[key];
                bwarr = [];
                bwarr.push(obj[0])
                if(obj[0]!==undefined)
                {
                  pls.push(bwarr.map((d)=>
                  {
                      return (<Polylines text={obj[1]} leftMargin={_self.props.marginleft} width={_self.props.width} key={r} data={d} shortLabel={obj[2]} viewLimits={obj[4]} color={obj[3]} min={_self.state.xminrange} max={_self.state.xmaxrange} x={_self.state.x} range={r}/>);
                  }));
                  r+=100;
                }
            });
          return (
              <div>
              <div className="search">
                <input type="text" size="30"  onSelect={this.pasteonselect} value={currentrange} readOnly/>&nbsp; {bp} bp &nbsp;
                <input type="text" ref="itext" size="50" placeholder="enter position"/>&nbsp;
                <input type="submit" onClick={this.buttonclick} value="Search" />
                <br/>
                <br/>
                <MoveZoom loadTrackhub={this.loadTrackhub} backward={this.updatebackwardSize} forward={this.updateforwardSize} zoomin={this.zoomin} zoomout={this.zoomout} />
              </div>
              { this.state.isModalOpen && <Modal onClose={this.closeModal}>
                <div className="chkbox">
                  {labels}
                   <br/>
                  K562 Tracks &nbsp;{show}{hide} <br/>
                  <br/>
                  {k562lables}
                  <br/>
                  <button onClick={this.closeModal}>Close</button>
                  </div>
              </Modal> }
              <svg width={this.props.width+50} height={this.state.height}>
                  <g transform="translate(0,20)">
                    <ToolTip tooltip={this.state.tooltip}/>
                    <Axis axis={xAxis} />
                    <Grid h={this.props.height} grid={xGrid} gridType="y"/>
                  </g>
                  {crerect}
                  {this.state.bbdata && rects}
                  {this.state.bwdata && pls}

              </svg>
              </div>
          );
      }
  }
  export default GenomeBrowser;
