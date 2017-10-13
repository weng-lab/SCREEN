import React from 'react';
import ReactDOM from 'react-dom';
import * as d3 from "d3";
import '../../../../css.css'
import Modal from './modal'
import Rects from './rects'
import ToolTip from './tooltip'
import * as ApiClient from '../../../api_client';
import readBig from './gbutils.js'
import Exons from './exons.js'
class Polylines extends React.Component {
    componentDidMount(){
       this.changeheight(this.props);
    }
    componentWillReceiveProps(nextProps)  {
      if(this.props.range!==nextProps.range || this.props.height!==nextProps.height)
      this.changeheight(nextProps);
    }
    changeheight(nextProps)
    {
      if(nextProps.range > nextProps.height-25)
      {
        nextProps.increaseheight("bigwigs");
      }
    }
    render() {
        var _self=this;
        if(_self.props.range===undefined  || _self.props.viewLimits===undefined  )
        {
          return null;
        }
        var viewl=this.props.viewLimits,vl;

        if(viewl!==undefined)
           vl=viewl.split(":");
        var y =  d3.scaleLinear().domain([vl[1],vl[0]]).range([_self.props.range ,_self.props.range+30]);
        var yAxis = d3.axisLeft().scale(y);
        yAxis.tickValues(y.ticks(1).concat(y.domain()));
        var data=this.props.data;
        var color ="rgb("+this.props.color+")";
        var x=((+(_self.props.x(_self.props.min))+ +(_self.props.x(_self.props.max))/+(2)))-+(200);
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
                <text x={x} y={_self.props.range-5} style={{fontSize: 10 }} fill={color} >{text}</text>
                <text x={0} y={y(0)} style={{fontSize: 10 }} >{_self.props.shortLabel}</text>
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
              <g className="y-grid" transform={this.props.gridType==='x'?translate:""}></g>
          );
      }

  }
class GenomeBrowser extends React.Component
{
    static defaultProps = { width: 1200, height: 200, marginleft:100,marginright: 100};
    constructor(props)
    {
     super(props)
     this.state = {
                    tooltip: {display:false,data:{width:'',height:'',value:''},pos:{x:'',y:''}},
                    xminrange:this.props.minrange,xmaxrange:this.props.maxrange,
                    chrom : 'chr11', bp : (this.props.maxrange -this.props.minrange),
                    x : d3.scaleLinear().domain([this.props.minrange,this.props.maxrange]).range([this.props.marginleft , this.props.width ]),
                    bbdata: {},bwdata :{} ,bwinput : [],bbinput: [],checkedstatus: {},exons : [],bwheight: 0,
                    isModalOpen: false, showK562: false,height:0,signaltype : {},isFetching: true, isError: false,input: []
                  }
    }
    showToolTip = (e) =>
    {
       this.setState({tooltip:{
           display:true,
           data: {
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
    componentDidMount(){
      this.changerange(this.props);
    }
    componentWillReceiveProps(nextProps)  {
     if(this.props.selectedaccession!==nextProps.selectedaccession)
        this.setState({height:0})
     if(this.props.minrange!==nextProps.minrange || this.props.maxrange!==nextProps.maxrange)
     this.changerange(nextProps);
    }
    changerange(nextProps)
    {
     this.setState({xminrange:nextProps.minrange,xmaxrange:nextProps.maxrange,chrom:nextProps.chrom},() =>{
       this.setState({bp:(parseInt(this.state.xmaxrange,10)-parseInt(this.state.xminrange,10))});

       var xrange = d3.scaleLinear().domain([this.state.xminrange,this.state.xmaxrange]).range([this.props.marginleft , this.props.width]);
       this.setState({x:xrange},() =>{

         if(this.props.byCellType!==undefined)
         {
            this.loadbigbed();
            this.loadbigwig();
            this.loadgenes();
         }
       });
       })
    }
    loadbigbed()
    {
     let _self=this,globalinput = _self.props.bigBedByCellType,gi=[],signaltype={}
     let h = Object.keys(globalinput).length * 20;

     Object.keys(globalinput).forEach(function (key)
     {
          let url =  "https://www.encodeproject.org/files/"+globalinput[key]+"/@@download/"+globalinput[key]+".bigBed?proxy=true",
          shortLabel = key,longLabel= globalinput[key]+" Signal "+ key +" "+ _self.props.cellType
          let bbinpt = {shortLabel:shortLabel,longLabel: longLabel,url:url}
          gi.push(bbinpt)
          signaltype = _self.state.signaltype
          signaltype[shortLabel]="bigbed"
     });
     this.setState({signaltype:Object.assign({}, this.state.signaltype, signaltype)});
     this.setState((prevState)=> {return{bwheight: prevState.bwheight + h}},()=>{
      });
      this.setState({ bbinput: gi },()=>{
       this.readBigBed();
     })
     /*this.setState((prevState)=> {return{height: prevState.height+ h}},()=>{

    });*/

    }
    loadbigwig()
    {
     let AssayColors = {"DNase" : ["6,218,147", "#06DA93"],
            "RNA-seq" : ["0,170,0", "", "#00aa00"],
            "RAMPAGE" : ["214,66,202", "#D642CA"],
            "H3K4me1" : ["255,223,0", "#FFDF00"],
            "H3K4me2" : ["255,255,128", "#FFFF80"],
            "H3K4me3" : ["255,0,0", "#FF0000"],
            "H3K9ac" : ["255,121,3", "#FF7903"],
            "H3K27ac" : ["255,205,0", "#FFCD00"],
            "H3K27me3" : ["174,175,174", "#AEAFAE"],
            "H3K36me3" : ["0,128,0", "#008000"],
            "H3K9me3" : ["180,221,228", "#B4DDE4"],
            "Conservation" : ["153,153,153", "#999999"],
            "TF ChIP-seq" : ["18,98,235", "#1262EB"],
            "CTCF" : ["0,176,240", "#00B0F0"]}
     let globalinput = this.props.byCellType,gi=[],signaltype={}
     let h = globalinput.length * 60;
     for(let i=0; i < globalinput.length ;i++)
     {
       let signalcolor = AssayColors[globalinput[i]["assay"]][0];
       let url = "https://www.encodeproject.org/files/"+globalinput[i]["fileID"]+"/@@download/"+globalinput[i]["fileID"]+".bigWig?proxy=true",
       viewLimits ,
       shortLabel = (globalinput[i]["assay"]),longLabel=globalinput[i]["fileID"]+" Signal "+ (globalinput[i]["assay"]+ " "+ globalinput[i]["cellTypeName"]);
       if(globalinput[i]["assay"]==="DNase")
       {
         viewLimits="0:150"
       }
       else {
         viewLimits="0:50"
       }
       let bwinpt = {shortLabel:shortLabel,longLabel: longLabel,color:signalcolor,viewLimits:viewLimits,url:url}
       let key= (globalinput[i]["assay"] + globalinput[i]["cellTypeName"])
       //if((globalinput[i]["assay"] + globalinput[i]["cellTypeName"])===key)
       gi.push(bwinpt)
       signaltype= this.state.signaltype;
       signaltype[key]="bigwig"
        //    this.setState({signaltype: Object.assign({},this.state.signaltype,{ [key]: "bigwig" })});
     }
    this.setState({signaltype:signaltype});
    this.setState((prevState)=> {return{bwheight: prevState.bwheight + h}},()=>{
     });
     this.setState({ bwinput: gi },()=>{
       this.readBigWig();
     /*this.setState((prevState)=> {return{height: prevState.height + h}},()=>{

     })*/
    });
    }
    nextexon = (r) =>
    {
     let bp = +(this.state.bp)
     let diff = +(0.05) * +(bp)
     let max = +(r)+ +(diff),min=+(max)- +(this.state.bp);

     this.setState({xminrange: min ,xmaxrange: max}
       ,() => {
         var xrange = d3.scaleLinear().domain([this.state.xminrange,this.state.xmaxrange ]).range([this.props.marginleft , this.props.width]);
          this.setState({x:xrange},() => {this.readBigBed();
            this.readBigWig();
            this.loadgenes(); })
        });
    }
    prevexon = (r) =>
    {
     let bp = +(this.state.bp)
     let diff = +(0.05 * bp)
     let min = +(r)-diff,max=+(min)+ +(this.state.bp);

     this.setState({xminrange: min ,xmaxrange: max}
       ,() => {
         var xrange = d3.scaleLinear().domain([this.state.xminrange,this.state.xmaxrange ]).range([this.props.marginleft , this.props.width]);
          this.setState({x:xrange},() => {this.readBigBed();
             this.readBigWig(); this.loadgenes();})
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
            var bbinp = this.state.bbinput.filter(function(d){
              return (d.shortLabel !== key)
            });
            this.setState({bbinput:bbinp },()=>{
              this.setState((prevState)=> {return{height:prevState.height - 40}});
              this.setState(
              {
                  bbdata:  Object.assign( {},this.state.bbdata, { [key]: [] })
              });
            })

          }
          else  {
            var bwinp = this.state.bwinput.filter(function(d){
              return (d.shortLabel !== key)
            });
            this.setState({bwinput:bwinp },()=>{
              this.setState((prevState)=> {return{height:prevState.height - 60}});
              this.setState(
              {
                  bwdata: Object.assign({},this.state.bwdata,{ [key]: [] })
              });
            });

           }
     }
     else {
           let _self=this,globalinputbigbed = this.props.bigBedByCellType

           Object.keys(globalinputbigbed).forEach(function (k)
           {
             if(key===k)
             {
               let url =  "https://www.encodeproject.org/files/"+globalinputbigbed[k]+"/@@download/"+globalinputbigbed[k]+".bigBed?proxy=true",
               shortLabel = k,longLabel= globalinputbigbed[k]+" Signal "+ k +" "+ _self.props.cellType
               let bbinpt = {shortLabel:shortLabel,longLabel: longLabel,url:url}
               _self.setState((prevState)=> {return{height:prevState.height + 20}},()=>{
                 _self.setState({signaltype: Object.assign({},_self.state.signaltype,{ [key]: "bigbed" })});
                 _self.setState({ bbinput: [..._self.state.bbinput, bbinpt] },()=> {_self.readBigBed()})
               });
             }

           });
           let AssayColors = {"DNase" : ["6,218,147", "#06DA93"],
                 "RNA-seq" : ["0,170,0", "", "#00aa00"],
                 "RAMPAGE" : ["214,66,202", "#D642CA"],
                 "H3K4me1" : ["255,223,0", "#FFDF00"],
                 "H3K4me2" : ["255,255,128", "#FFFF80"],
                 "H3K4me3" : ["255,0,0", "#FF0000"],
                 "H3K9ac" : ["255,121,3", "#FF7903"],
                 "H3K27ac" : ["255,205,0", "#FFCD00"],
                 "H3K27me3" : ["174,175,174", "#AEAFAE"],
                 "H3K36me3" : ["0,128,0", "#008000"],
                 "H3K9me3" : ["180,221,228", "#B4DDE4"],
                 "Conservation" : ["153,153,153", "#999999"],
                 "TF ChIP-seq" : ["18,98,235", "#1262EB"],
                 "CTCF" : ["0,176,240", "#00B0F0"]}
           let globalinput = this.props.byCellType
           for(let i=0; i < globalinput.length ;i++)
           {
               if((globalinput[i]["assay"])===key)
               {
                 let signalcolor = AssayColors[globalinput[i]["assay"]][0];
                 let url = "https://www.encodeproject.org/files/"+globalinput[i]["fileID"]+"/@@download/"+globalinput[i]["fileID"]+".bigWig?proxy=true",
                 viewLimits ,
                 shortLabel = (globalinput[i]["assay"]),longLabel=globalinput[i]["fileID"]+" Signal "+ (globalinput[i]["assay"]+ " "+ globalinput[i]["cellTypeName"]);
                 if(globalinput[i]["assay"]==="DNase")
                 {
                   viewLimits="0:150"
                 }
                 else
                 {
                   viewLimits="0:50"
                 }
                 let bwinpt = {shortLabel:shortLabel,longLabel: longLabel,color:signalcolor,viewLimits:viewLimits,url:url}
                   this.setState((prevState)=> {return{height:prevState.height + 60}},()=>{
                     this.setState({signaltype: Object.assign({},this.state.signaltype,{ [key]: "bigwig" })});
                     this.setState({ bwinput: [...this.state.bwinput, bwinpt] },()=> {this.readBigWig()})
                   });
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
     if(this.props.byCellType!==undefined)
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
       url = bwurl[j]["url"],
       color = bwurl[j]["color"],
       viewLimits = bwurl[j]["viewLimits"],
       shortLabel = bwurl[j]["shortLabel"],longLabel=bwurl[j]["longLabel"];
       readBig(url,chrom,start,end,
          (data) => {
                this.setState(
                  {
                      bwdata: Object.assign(
                        {},
                        this.state.bwdata,
                        { [key]:[data,longLabel,shortLabel,color,viewLimits] }
                      )
                  });
          });
    }
    }
    readBigBed()
    {
     let bburl = this.state.bbinput;
     for (let j = 0; j < bburl.length; j++)
     {
         let key = bburl[j]["shortLabel"],
         longLabel = bburl[j]["longLabel"],
         shortLabel = bburl[j]["shortLabel"],
         url =  bburl[j]["url"];
         let chrom=this.state.chrom,start=this.state.xminrange,end=this.state.xmaxrange
         readBig(url,chrom,start,end,
     (data) => {
       this.setState({
           bbdata: Object.assign(
             {},
             this.state.bbdata,
             { [key]: [data,longLabel,shortLabel] }
           )})
     });
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
        return {xminrange: +(prevState.xminrange) + +(range),xmaxrange: +(prevState.xmaxrange) + +(range)};
      },() => {
           let xrange = d3.scaleLinear().domain([this.state.xminrange,this.state.xmaxrange ]).range([this.props.marginleft , this.props.width ]);
           this.setState({x:xrange},() => { this.readBigBed();
             this.readBigWig();this.loadgenes();
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
                return {xminrange: +(prevState.xminrange) - +(range,10),xmaxrange: +(prevState.xmaxrange) - +(range,10)};
              },() => {
                var xrange = d3.scaleLinear().domain([this.state.xminrange,this.state.xmaxrange ]).range([this.props.marginleft , this.props.width]);
                 this.setState({x:xrange},() => {this.readBigBed();
                    this.readBigWig();this.loadgenes();
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
         this.setState({x:xrange},()=>{
           this.readBigBed();
            this.readBigWig();this.loadgenes();
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
         this.setState({x:xrange},() =>{ this.readBigBed();
           this.readBigWig();this.loadgenes();
         });
       })
     });
    }
    pasteonselect = (e) => {
    this.refs.itext.value =e.target.value;
    }
    loadgenes=()=>{
     const q = {assembly: this.props.assembly,coord_chrom:this.state.chrom,coord_end: this.state.xmaxrange,coord_start: this.state.xminrange};
     var jq = JSON.stringify(q);
     ApiClient.getByPost(jq, "/gbws/geneTrack",
     (r) => {
              if(this.state.exons.length>r.length)
              {
                let h= (+(this.state.exons.length)- +(r.length))*30;
                  this.setState((prevState)=> {return{height:+(prevState.height) - +(h)}},()=>{
                      this.setState({exons: r});
                  });
              }
              else {
                this.setState({exons: r});
              }
         },
       (msg) => {
     console.log("err loading geneTrack");
     console.log(msg);
    this.setState({exons: [],
             isFetching: false, isError: true});
       });
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
         this.loadgenes();
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
    increaseheight=(type)=>
    {
     this.setState((prevState)=> {return{height: prevState.height +10}});
    }
    render()
    {
       let currentrange = this.state.chrom+":"+this.state.xminrange+"-"+this.state.xmaxrange;
       let bp = +(this.state.bp,10)+ +(1);
       let  xAxis = d3.axisBottom().scale(this.state.x);
       let  xGrid = d3.axisBottom().scale(this.state.x).ticks(100).tickSize(this.state.height, 0, 0).tickFormat("");
       let bigbed = this.state.bbdata, bigwig = this.state.bwdata,bbarr = [],bwarr = [];
       let _self=this,rects = [],r=70,pls=[],diff,max,labels,k562lables,crerect,bycelltype;
       max =   +(this.props.selectedaccession.start) + +(this.props.selectedaccession.len)
       diff = this.state.x(max)-this.state.x(this.props.selectedaccession.start)

       if(Object.keys(this.state.bbinput).length !== 0 || Object.keys(this.state.bwinput).length !== 0)
       {
           if(+(this.state.x(this.props.selectedaccession.start)) >= this.props.marginleft && (+(this.state.x(max)) <= this.props.width) )
           {
             crerect = (<rect x={this.state.x(this.props.selectedaccession.start)} y={20} style={{opacity:"0.5",fill:"lightblue"}} data-value={this.props.selectedaccession.accession} width={diff} height={this.state.height} onMouseOver={this.showToolTip} onMouseOut={this.hideToolTip}/>)
           }
       }

       //bycelltype
       if(this.props.byCellType!==undefined)
       {
         bycelltype =this.props.byCellType.map((d,i) => {
           if(this.state.bwinput.length!==0)
         return ( <div key={i}> <input type="checkbox" defaultChecked={true} ref={d.assay}  onClick={_self.handlecheck} id={d.assay} key={i} value={d.assay} ></input> {d.assay +" "+ d.cellTypeName} </div>);
          else {
            return ( <div key={i}> <input type="checkbox"  ref={d.assay}  onClick={_self.handlecheck} id={d.assay} key={i} value={d.assay} ></input> {d.assay +" "+ d.cellTypeName} </div>);

          }
        });
       }

       if(this.props.bigBedByCellType!==undefined)
       {
         Object.keys(this.props.bigBedByCellType).forEach(function (k)
         {
           if(_self.state.bbinput.length!==0)
          bycelltype.push( <div key={k}> <input type="checkbox" defaultChecked={true} ref={k}  onClick={_self.handlecheck} id={k} value={k} ></input> {k} </div>);
          else {
            bycelltype.push( <div key={k}> <input type="checkbox"  ref={k}  onClick={_self.handlecheck} id={k}  value={k} ></input> {k} </div>);
          }
         })
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
               return (<Rects text={obj[1]} data={d} increaseheight={_self.increaseheight} height={_self.state.height}leftMargin={_self.props.marginleft} width={_self.props.width} shortLabel={obj[2]} key={r} x={_self.state.x} min={_self.state.xminrange} max={_self.state.xmaxrange} y={r}  showToolTip={_self.showToolTip} hideToolTip={_self.hideToolTip}   />);           }));
           r+=30;
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
                   return (<Polylines text={obj[1]} increaseheight={_self.increaseheight} leftMargin={_self.props.marginleft} height={_self.state.height} width={_self.props.width} key={r} data={d} shortLabel={obj[2]} viewLimits={obj[4]} color={obj[3]} min={_self.state.xminrange} max={_self.state.xmaxrange} x={_self.state.x} range={r}/>);
               }));
               r+=60;
             }
         });
         r-=30
         let e= []
         e=this.state.exons.map((d,i)=>{
                 r+=20;
                 return(<Exons key={i} strand={d.strand} tstart={d.start} tend={d.end} height={this.state.height} increaseheight={_self.increaseheight}leftMargin={this.props.marginleft} width={this.props.width} prevExon={_self.prevexon} nextExon={_self.nextexon} data={d.values} x={this.state.x} transcript_id={d.transcript_id} range={r} showToolTip={_self.showToolTip} hideToolTip={_self.hideToolTip}/>)
         })
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
              {bycelltype}
              {labels}
               <br/>
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
                <Grid h={this.state.height} grid={xGrid} gridType="y"/>
              </g>
              {crerect}
              {this.state.bbdata && rects}
              {this.state.bwdata && pls}
              {this.state.exons.length >0 && e}
          </svg>
          </div>
      );
    }
}
export default GenomeBrowser;
