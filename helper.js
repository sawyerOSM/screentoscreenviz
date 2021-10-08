// https://observablehq.com/@bmpms/network-circle-packs@585
import {zoom} from "https://cdn.skypack.dev/d3-zoom@3";
const handler = zoom();

export default function define(runtime, observer) {
  const main = runtime.module();
  //main.variable(observer()).define(["md"], function(md){return(
//md `# WMTO Screen to Screen Network`
//)});
  main.variable(observer("legend")).define("legend", ["d3","width","category_names","colour_scale"], function(d3,width,category_names,colour_scale)
{ //draw svg
    var h = Math.ceil(category_names.length/8)*18;
    const legend_svg = d3.create("svg")
                         .attr("class","legend_svg")
                         .attr("viewBox", [0, 0, width, h]);

    var legend_x = 400;
    var legend_y = -16;

    for(let c in category_names){
        if ((parseInt(c))%8===0){
            legend_x = 400;
            legend_y += (16)
        }
        legend_svg.append("rect")
                  .attr("x",legend_x)
                  .attr("y",0 + legend_y)
                  .attr("id","legendrect_" + c)
                  .attr("width",20)
                  .attr("height",15)
                  .attr("fill",colour_scale(category_names[c]))
                  .attr("rx",4)
                  .attr("ry",4);

        legend_svg.append("text")
                  .attr("id","legendtext_" + c)
                  .attr("x",legend_x + 25)
                  .attr("y",13 + legend_y)
                  .text(category_names[c]);
        legend_x += (300)
    }



      // normally I would use getBoundingClientRect and an id to
      //get this precise but won't work as elements not rendered
      //until function is returned.

    return legend_svg.node();

 }
);



    // Function needs a d3 selected SVG canvas where it will draw the legend and a source color scale
    function drawLegend(color, legend, legendColorScale) {

      //const legend = d3.select("#colorLegend");
      const legendWidth = legend.attr("width");
      const legendHeight = legend.attr("height");
      const legendMinMax = d3.extent(legendColorScale.domain()); // way to recover the minMax from most kinds of scales
      const barHeight = 20;
      const stepSize = 4; // warning, not using a canvas element so lots of rect tags will be created for low stepSize, causing issues with performance
      // Extend the minmax by 1 in either direction to expose more features
      const pixelScale = d3.scaleLinear().domain([0,legendWidth-40]).range([legendMinMax[0]-1,legendMinMax[1]+1]); // In this case the "data" are pixels, and we get numbers to use in colorScale
      const barScale = d3.scaleLinear().domain([legendMinMax[0],legendMinMax[1]]).range([5,legendWidth-45]);
      const barAxis = d3.axisBottom(barScale).ticks(11);;


      legend.append("g")
        .attr("class", "colorbar axis")
        .attr("transform","translate("+(20)+","+(barHeight+5)+")")
        .style("font-family","Arial")
        .call(barAxis);
      // Draw rects of color down the bar
      let bar = legend.append("g").attr("transform","translate("+(20)+","+(0)+")")
      for (let i=5; i<legendWidth-45; i=i+stepSize) {
        bar.append("rect")
          .attr("x", i)
          .attr("y", 0)
          .attr("width", stepSize)
          .attr("height",barHeight)
          .style("fill", d3.scaleOrdinal().domain(["Pre Production", "Production", "Distribution/Promotion", "Platform"]).range(["#570d00", "#c99400", "green", "#25b6cc"])( color ))
          .style("filter", "saturate("+((legendWidth-40)/i)+")"); // pixels => countData => color
      }
      // Put lines in to mark actual min and max of our data

    }

//    d3.scaleLinear().domain([0, 100]).range([0, 100]);
let color_legend_svg = d3.select("body").append("svg").attr("width",300).attr("height", 60);
drawLegend("Pre Production",  d3.select("body").append("svg").attr("width",300).attr("height", 60), d3.scaleLinear().domain([0, 100]).range([0, 100]));
drawLegend("Production",  d3.select("body").append("svg").attr("width",300).attr("height", 60), d3.scaleLinear().domain([0, 100]).range([0, 100]));
drawLegend("Distribution/Promotion",  d3.select("body").append("svg").attr("width",300).attr("height", 60), d3.scaleLinear().domain([0, 100]).range([0, 100]));
drawLegend("Platform",  d3.select("body").append("svg").attr("width",300).attr("height", 60), d3.scaleLinear().domain([0, 100]).range([0, 100]));


d3.select("body").append("p").text("Team Budget in Millions.").attr("class","center").style("padding-left","500px")









  main.variable(observer("chart")).define("chart", ["d3","width","height","nodes","link_data","colour_scale","forceInABox","margin","invalidation"], function(d3,width,height,nodes,link_data,colour_scale,forceInABox,margin,invalidation)
{

    //draw svg
    const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height]);

    //apply the hierarchy
    const root = d3.hierarchy({name: 'root',children: nodes})
                   .sum(d => d.value)
                   .sort((a, b) => b.value - a.value);

    const value_max = d3.max(nodes, d => d3.max(d.children, m => m.value));
    const radius_scale = d3.scaleLinear().domain([0,value_max]).range([30,80]);
    const link_scale = d3.scaleLinear().domain([0,1]).range([0,6]);
    const total_budget = d3.sum(nodes, d => d.budget);

    //apply the pack
    let pack_data = d3.pack()
                      .size([width*0.6, width*0.6])
                      .radius(d => radius_scale(d.data.value))
                      .padding(10)
                      (d3.hierarchy({name: 'root',children: nodes})
                       .sum(d => d.value)
                       .sort((a, b) => b.value - a.value));

    //set the colour scales with category names;

    //loop through the pack and set pack_x and pack_y for 'sub category' circles to radius
    //then set pack_x and pack_y position for their children to account for this
    //remember only depth === 2 children are subject to the packing positions

    pack_data.children.forEach(function(d){
        const my_x = d.x;
        const my_y = d.y;
        d.pack_x = d.r;
        d.pack_y = d.r;
        d.category = d.data.category;
        for(let c in d.children){
          d.children[c].pack_x = d.children[c].x - my_x + d.r;
          d.children[c].pack_y = d.children[c].y - my_y + d.r;
          d.children[c].category = d.data.category;
        }
    })
    //now the links.  Hard copy so no issue with refreshing (whien link.source === link.source.id)
    let links = JSON.parse(JSON.stringify(link_data));
    //loop through and add source and target category ids
    for(let l in links){
         var my_source = pack_data.children.find(d => d.children.find(f => f.data.id === links[l].source));
         links[l].source_cid = my_source.data.id
         var my_target = pack_data.children.find(d => d.children.find(f => f.data.id === links[l].target));
         links[l].target_cid = my_target.data.id;
    }
    //now loop through categories and add a new link for each category combination

    const category_ids = d3.set(nodes, d => d.id).values();
    var new_links = [], link_id = 0;;
    for(let c in category_ids){
        for(let i in category_ids){
          //this statement here ensures there are no duplicates - ie from 1 -> 2 and then 2 -> 3
          if(+i > +c){
            var total_source = links.filter(d => d.source_cid === category_ids[c] && d.target_cid ===
                                            category_ids[i]);
            var total_target = links.filter(d => d.target_cid === category_ids[c] && d.source_cid ===
                                            category_ids[i]);
            new_links.push({
              id: "l" + link_id,
              source: category_ids[c],
              target: category_ids[i],
              rating: d3.sum(total_source, s => s.rating) + d3.sum(total_target, s => s.rating),
              parent: true
            })
          }
        }
    }
    links = links.concat(new_links)
    //we're ready - links for all depth === 2 and depth === 1 nodes
    //pack data just needs to be collapsed so one row for every circle.
    pack_data = pack_data.descendants().slice(1);

    //links first (separate join as separate dataset)
    var link_group = svg.selectAll('.link_group').append("g")
                        .data(links)
                        .join(function(group){
                            var enter = group.append("g").attr("class","link_group");
                            enter.append("line").attr("class","link_line");
                            return enter;
                        });

    link_group.select(".link_line")
              .attr("id", d => d.source + ":" + d.target)
              .attr("class",d => "link_line " + "link_" + d.source + " link_" + d.target)
              .attr("stroke",d => d.parent === undefined ? "#F0F0F0" : "#D0D0D0")
              .attr("visibility","hidden")
              .attr("stroke-width",d => link_scale(d.rating));


    let modal = d3.select("body").append("div")
        .attr("id", "myModal")
        .attr("class", "modal")
        .style("display", "none")
        .style("position", "fixed")
        .style("z-index", "1")
        .style("left", "0")
        .style("top", "0")
        .style("width", "100%")
        .style("height", "100%")
        .style("overflow", "auto")
        .style("background-color", "rgb(0,0,0)")
        .style("background-color", "rgba(0,0,0,0.4)");

    let modalContent = modal.append("div").attr("class","modal-content")
        .style("background-color", "#fefefe")
        .style("margin", "15% auto")
        .style("padding", "20px")
        .style("border", "1px solid #888")
        .style("width", "80%");

    let span = modalContent.append("span")
        .attr("class","close")
        .text("\u2716")
        .style("color", "#aaaaaa")
        .style("float", "right")
        .style("font-size", "28px")
        .on("click", function(d){
            modal.style("display", "none");
        });


    //now nodes
    var my_group = svg.selectAll('.node_group').append("g")
                           .data(pack_data)
                           .join(function(group){
                              var enter = group.append("g").attr("class","node_group");
                              enter.append("circle").attr("class","pack_circle");
                              enter.append("path").attr("class","pack_label_path");
                              enter.append("text").attr("class","pack_count");
                              enter.append("text").attr("class","pack_text")
                                .append("textPath").attr("class","pack_textpath");
                              return enter;
                           });

    //circles
    my_group.select(".pack_circle")
            .attr("id",d => "node_" + d.data.id)
            .attr("cx", d => d.pack_x)
            .attr("cy",d => d.pack_y)
            .attr("r",d => d.r)
            .attr("fill",d => d.depth === 1 ? colour_scale(d.data.category) : "white")
            .attr("stroke",d => d.depth === 1 ? colour_scale(d.data.category) :
                   colour_scale(d.parent.data.category))
            .attr("stroke-width",d => d.depth === 1 ? 1 : 0.5)
            .attr("opacity", d => d.depth === 1 ? 1.0 : 0.2)
            //.style("filter", d => d.data.budget > 70000000 ? "brightness(1.0)" : "brightness(2)")
            .style("filter", d => "saturate("+(total_budget/5)/d.data.budget+")")
            .on("mouseover",function(d){
                //hide everything
                //d3.selectAll(".pack_circle").attr("visibility","hidden");
                d3.selectAll("this.pack_circle").attr("opacity","1.0");
                //d3.selectAll(".link_line").attr("visibility","hidden");
                //d3.selectAll(".pack_textpath").attr("visibility","hidden");

                //show current
                d3.selectAll("#node_" + d.data.id).attr("visibility","visible");
                d3.selectAll("#node_" + d.data.id).attr("opacity","1.0");
                //show current labels
                d3.selectAll("textPath#node_" + d.data.id)
                            .attr("visibility","visible")
                            .attr("font-weight","bold")
                            .attr("fill",d => d.depth === 1 ? "black" : "black");


                 //loop through links and show links AND attached nodes
                 d3.selectAll(".link_" + d.data.id)
                   .attr("visibility","visible")
                   .attr("opacity","1.0")
                   .each(function(e){
                     if(e.source.data.id === d.data.id){
                       d3.selectAll("#node_" + e.target.data.id).attr("visibility","visible");
                       d3.selectAll("#node_" + e.target.data.id).attr("opacity","1.0");
                       d3.selectAll("textPath#node_" + e.target.data.id).attr("fill",d => d.depth === 1 ? "black" : "black");

                   } if (e.target.data.id === d.data.id) {
                       d3.selectAll("#node_" + e.source.data.id).attr("visibility","visible");
                       d3.selectAll("#node_" + e.source.data.id).attr("opacity","1.0");
                       d3.selectAll("textPath#node_" + e.source.data.id).attr("fill",d => d.depth === 1 ? "black" : "black");
                     }
                 });

                 if(d.depth === 1){
                    //for 'sub category' nodes, hide count label and show pack circles and labels
                    d3.selectAll(".pack_count#node_" + d.data.id).attr("visibility","hidden");
                    d3.selectAll(".pack_count#node_" + d.data.id).attr("opacity","0.2");
                    d3.selectAll(".pack_circle")
                      .filter(function(f){
                         return f.parent.data.id === d.data.id
                    })
                      .each(function(f){
                         d3.selectAll("#node_" + f.data.id).attr("visibility","visible");
                         d3.selectAll("#node_" + f.data.id).attr("opacity","1.0");
                         d3.selectAll("textPath#node_" + f.data.id).attr("fill","black");
                    });
                } else {
                    d3.selectAll(".pack_count#node_" + d.parent.data.id).attr("visibility","hidden");
                    d3.selectAll("textPath#node_" + d.data.id).attr("fill","black").attr("font-weight","bold");
                    d3.selectAll("textPath#node_" + d.parent.data.id).attr("font-weight","bold");
                }







                 // Make tooltip visible
                 tooltip.style("visibility","visible")


                 // Find the state SVG element and add stroke
                 let node = d3.select(this);

                if (d.depth === 1){
                    txt.text(d.data.name);
                }

                if (d.depth === 2){
                    txt.text(d.data.subteam);
                }

                document.onmousemove = handleMouseMove;
                function handleMouseMove(event) {
                    var eventDoc, doc, body;

                    event = event || window.event; // IE-ism

                    // If pageX/Y aren't available and clientX/Y are,
                    // calculate pageX/Y - logic taken from jQuery.
                    // (This is to support old IE)
                    if (event.pageX == null && event.clientX != null) {
                        eventDoc = (event.target && event.target.ownerDocument) || document;
                        doc = eventDoc.documentElement;
                        body = eventDoc.body;

                        event.pageX = event.clientX +
                          (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                          (doc && doc.clientLeft || body && body.clientLeft || 0);
                        event.pageY = event.clientY +
                          (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
                          (doc && doc.clientTop  || body && body.clientTop  || 0 );
                    }
                    // Use event.pageX / event.pageY here
                }

                 // Place it at the bottom of the state, centered
                 let xPos = event.pageX;
                 let yPos = event.pageY;

                 // Transform the <g> group so that everything moves together easily
                 tooltip.attr("transform","translate("+xPos+","+(yPos-725)+")");

                 // To fix the oscillation mentioned at the end of the video, we add this in the CSS for .mouseover
                 //  pointer-events: none;


          })
      .on("click", function(d){
          modalContent.selectAll("p").remove();
          modal.style("display", "block");
          if (d.depth===2){
              console.log(d)
              modalContent.append("p").text("Category: "+d.category+" | Team: "+d.parent.data.name +" | Subteam: "+d.data.subteam);
              modalContent.append("p").text("Lead: "+d.data.details2);
              modalContent.append("p").text("Key Details and Functions: " + d.data.details);
          } else {
              modalContent.append("p").text("Category: "+d.category+" | Team: "+d.data.name);


              descriptions.forEach( team => {

                  if (team.Team === d.data.name){

                      Object.values(team).forEach( detail => {

                          if (detail != "" && detail != team.Team){
                            modalContent.append("p")
                                .attr("class", "details")
                                .text(detail);
                          }
                      })
                  }
              })
          }
      })

         .on("mouseout",function(d){
             d3.selectAll("#node_" + d.data.id).attr("opacity","1.0");
             //d3.selectAll("#node_" + d.data.id).attr("opacity","1.0");
              //d3.selectAll(".pack_circle").attr("visibility","visible");
              d3.selectAll(".pack_circle").attr("opacity",d => d.depth === 1 ? "1.0" : "0.2");
              //d3.selectAll(".pack_count").attr("visibility", "hidden" );
              d3.selectAll(".pack_count").attr("visibility",d => d.depth === 1 ? "visible" : "hidden");
              //d3.selectAll(".pack_count").attr("opacity","1.0");
              d3.selectAll(".pack_count").attr("opacity",1);
              d3.selectAll(".link_line").attr("visibility","hidden");
              d3.selectAll(".pack_textpath")
                .attr("fill","#333333")
                .attr("font-weight","normal")
                .attr("visibility", d => d.depth === 1 ? "visible" : "hidden");






                // Hide when you leave a state
                tooltip.style("visibility","hidden");

                let node = d3.select(this);

                // Reset old style mouseover stroke
                // state.attr("stroke","none")
                //      .attr("stroke-width", 0);
                // }

                // Here we are hiding the mouseover mesh we added at the end of the lecture
                momesh.attr("d", "");
        });



        var zoom = d3.zoom()
                  .scaleExtent([0.5,5])
                  //.translateExtent([[-50,-50],[mapWidth+50,mapHeight+50]])  // to lock to edges
                  .on("zoom", mapZoomed);
        svg.call(zoom);

              // It's a good habit to manually call a zoom interaction just in case you have code in zoomed() which you need
              //  to execute before the user plays with the map (e.g. showing/hiding counties).
              // You can feed it zoomIdentity, which is the zoom state in which nothing has changed
              //svg.call(zoom.transform, d3.zoomIdentity); // Executes zoomed() once because we technically have changed the transform

              function mapZoomed(event) {
                link_group.attr("transform", d3.event.transform);
                my_group.attr("transform", d3.event.transform);
              }

            let tooltipWidth = 650;
            let tooltipHeight = 40;

             // Stub code to draw the tooltip - we use an SVG element here
             // You can use an absolute-positioned HTML element, but the positioning requires some more work
             // Instead, we make something centered at (0,0) and then later use translate() to move it
             //  (this is why the x position for the rect is -tooltipWidth/2.0  -- so it's centered on 0 )
             let tooltip = svg.append("g")
                              .attr("class","tooltip")
                              .attr("visibility","hidden");
             tooltip.append("rect")
                    .attr("fill", "black")
                    .attr("opacity", 0.7)
                    .attr("x", -tooltipWidth / 2.0)
                    .attr("y", 0)
                    .attr("width",tooltipWidth)
                    .attr("height",tooltipHeight);
             let txt = tooltip.append("text")
                              .attr("fill", "white")
                              .attr("text-anchor","middle")
                              .attr("alignment-baseline","hanging")
                              .style("font-size", "28px")
                              .attr("x", 0)
                              .attr("y", 12);


    //count labels
    my_group.select(".pack_count")
        .attr("pointer-events","none")
        .attr("visibility",d => d.depth === 1 ? "visible" : "hidden")
        //.attr("visibility", "hidden")
        .attr("fill",d => d.depth === 1 ? "white" : "#A0A0A0")
        .attr("id",d => "node_" + d.data.id)
        .attr("x", d => d.pack_x)
        .attr("y",d => d.pack_y)
        .attr("text-anchor","middle")
        .attr("font-size",d => d.depth === 1 ? 40 : 20)
        .attr("dy",d => d.depth === 1 ? 10 : 4)
        .text(d => d.value);
        //.text(d => d.value+"\n"+d.data.budget.toExponential());

    //invisible path for circle labels
    my_group.select(".pack_label_path")
      .attr("id", d => "pack_path" + d.data.id)
      .attr("d", draw_path)
      .attr("stroke-width",0)
      .attr("fill","none");

    function draw_path(d){
       return "M" + (d.pack_x - d.r-3) + " " + d.pack_y+10 + " A" + d.r + " " + d.r
       + " 0 0 1 " + (d.pack_x + d.r + 3) + " " + d.pack_y;
    }

    //circle labels - heavily indebted to https://www.visualcinnamon.com/2015/09/placing-text-on-arcs.html
    my_group.select(".pack_textpath")
            .attr("id",d => "node_" + d.data.id)
            .attr("letter-spacing",-0.5)
            .attr("visibility", d => d.depth === 1 ? "visible" : "hidden")
            .attr("fill", "#333333")
            .attr("font-size",d => d.depth === 1 ? 12 : 6)
            .attr("startOffset","50%")
            .style("text-anchor","middle")
            .attr("display","inline")
            .attr("xlink:href", d => "#pack_path" + d.data.id)
            .text(d => d.depth === 1 ? d.data.name : d.data.subteam);

  //now the box force, see the beautiful forceInABox - https://observablehq.com/@john-guerra/force-in-a-box
  const box_force = forceInABox()
          .strength(0.6) // Strength to cluster center
          .template("treemap") // Either treemap or force
          .groupBy("category") // Node attribute to group
          .size([width-(margin*2), height-(margin*2)]);

  //and the simulation - really simple, box force, links with no strength, radius collide

  var max=0;
  var temp=0;
  category_ids.forEach(id=>{
      temp = parseInt(id.substring(id.indexOf("c")+1));
      max = Math.max(temp,max);
  })

  const simulation = d3.forceSimulation(pack_data)
          .force("forceX", d3.forceX().strength(3.5).x( d => {
            if (d["depth"] === 1){
                return (width*parseInt(d.data.id.substring(d.data.id.indexOf("c")+1))*1.3/(max));
            }
          } ))
          .force("forceY", d3.forceY().strength(0.5).y(d=>{return(height*0.5)}))
        .force("forceInABox",box_force)
        .force("link", d3.forceLink(links).id(d => d.data.id).strength(0.2))
        .force("collide", d3.forceCollide(d => d.depth === 1 ? d.r * 1.5 : 0).strength(1.5));

  simulation.on("tick", () => {
    //node items
    d3.selectAll(".pack_circle")
        .attr("transform", get_node_translate);

     d3.selectAll(".pack_count")
        .attr("transform", get_node_translate);

     d3.selectAll(".pack_label_path")
        .attr("transform", get_node_translate);

     //links
     d3.selectAll(".link_line")
       .attr("x1", d => d.source.pack_x  + margin +  get_link_extra(d,"source","x"))
       .attr("x2", d => d.target.pack_x  + margin + get_link_extra(d,"target","x"))
       .attr("y1", d => d.source.pack_y  + (margin/2) +  get_link_extra(d,"source","y"))
       .attr("y2", d => d.target.pack_y  + (margin/2) +  get_link_extra(d,"target","y"));

     function get_node_translate(d){
        //depending on depth use x or the parent's (ie coords provided by d3.pack)
        if( d.depth === 1){
          return "translate(" + (d.x + margin) + "," + (d.y + (margin/2)) + ")";
        } else {
          return "translate(" + (d.parent.x + margin) + "," + (d.parent.y + (margin/2)) + ")";
        }
    }

    function get_link_extra(d, type,coord){
      //depending on depth use x or the parent's (ie coords provided by d3.pack)
      return d.parent === undefined ? d[type].parent[coord] : d[type][coord]
    }

  });

  invalidation.then(() => simulation.stop());

  return svg.node();
}
);

  main.variable(observer("colour_scale")).define("colour_scale", ["d3","category_names"], function(d3,category_names){
      var colors = []
      category_names.forEach( category => {
          //colors.push(d3.interpolateBlues(category_names.indexOf(category)/category_names.length));
      })

      return(d3.scaleOrdinal().domain(category_names).range(["#570d00", "#c99400", "green", "#25b6cc"]));

      //return(d3.scaleOrdinal().domain(category_names).range(colors));


//d3.scaleOrdinal().domain(category_names).range(["#ffedb3","#ffe48f","#ffde75","#ffd54f","#dbb230","#c79d18", "#ab860f"])
//d3.scaleOrdinal(d3.interpolateRgb("purple", "orange")).domain(category_names)
});

  main.variable(observer("category_names")).define("category_names", ["d3","nodes"], function(d3,nodes){return(
d3.set(nodes, d => d.category).values()
)});


var dataset;
var edges;
var descriptions;
d3.csv("team_desc.csv").then( (csv_descs) => {
    descriptions=csv_descs;
});
d3.csv("links.csv").then( (csv_edges) => {
    edges=csv_edges;
});
d3.csv("nodes.csv").then( (data) => {
    dataset=data;
});

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function getNodes(dataset) {
    var teams=[];
    var categories=[];

    dataset.forEach(row => {
        teams.push(row.team);
        categories.push(row.category);

        row.id =  parseInt(row.id);
        row.value = parseInt(row.FTE);
        row.budget = parseInt(row.budget);
    });
    teams = teams.filter(onlyUnique);
    categories = categories.filter(onlyUnique);

    var new_hierarchy = [];

    categories.forEach(category => {
        teams.forEach(team => {
            if (dataset.filter(d=>d.team === team).filter(d=>d.category === category).length >0){
                var budget = 0;
                //(dataset.filter(d=>d.team === team).filter(d=>d.category === category)).forEach(i => {budget+=i.budget});
                dataset.filter(d=>d.team === team).forEach(i => {budget+=i.budget});
                var obj = {}
                obj.id = teams.indexOf(dataset.filter(d=>d.team === team).filter(d=>d.category === category)[0]["team"])+"c"+categories.indexOf(dataset.filter(d=>d.team === team).filter(d=>d.category === category)[0]["category"]);
                obj.name = team;
                obj.category = category;
                obj.budget = budget;

                //var filtered_dataset = dataset.filter(d=>d.parent_name === parent).filter(d=>d.category === category);
                var filtered_dataset = dataset.filter(d=>d.team === team).filter(d=>d.category === category);


                obj.children = filtered_dataset;
                new_hierarchy.push(obj);
            };
        });
    })
    main.variable(observer("nodes")).define("nodes",function()
  {

return(new_hierarchy);

});

}

function getLinks(edges) {
    var final_links = [];

    edges.forEach(row => {
        var obj={"id": parseInt(row.id), "source": parseInt(row.source), "target": parseInt(row.target), "rating": parseInt(row.rating)};
        final_links.push(obj);
    })

    main.variable(observer("link_data")).define("link_data", function()
    {
        return(final_links);
    });
}

function getDescs(descriptions) {
    var descs = [];

    descriptions.forEach(row => {

        descs.push(Object.values(row));
    })

    main.variable(observer("desc_data")).define("desc_data", function()
    {
        return(descs);
    });

}

setTimeout(function(){
getNodes(dataset);
getLinks(edges);
getDescs(descriptions);
},200);





//console.log(main.variable(observer("nodes")));


  main.variable(observer("margin")).define("margin", ["width"], function(width){return(
width * 0.1
)});
  main.variable(observer("height")).define("height", ["width"], function(width){return(
width * 0.6
)});
  main.variable(observer("width")).define("width", function(){return(
window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
)});
  main.variable(observer("forceInABox")).define("forceInABox", ["require"], function(require){return(
require("force-in-a-box")
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("https://d3js.org/d3.v5.min.js")
)});
  return main;
}
