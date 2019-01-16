var margin = {
	top: 10,
	right: 0,
	bottom: 10,
	left: 120
},
width = 1500 - margin.right - margin.left,
height = 800 - margin.top - margin.bottom;

var i = 0,
    duration = 750,
    root;

var tree = d3.layout.tree().size([height, width]);
var diagonal = d3.svg.diagonal()
	.projection(function (d) {
		return [d.y, d.x];
	});

var svg = d3.select("#render").append("svg")
	.attr("width", width + margin.right + margin.left)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")")


function data_load(){
	// load the external data
	d3.csv("data/data.csv", function(error, data) {

		// *********** Convert flat data into a nice tree ***************
		// create a name: node map
		var dataMap = data.reduce(function(map, node) {
			map[node.id] = node;
			return map;
		}, {});
		
		// create the tree array
		var treeData = [];
		data.forEach(function(node) {
			// add to parent
			var parent = dataMap[node.parent_id];
			if (parent) {
				// create child array if it doesn't exist
				(parent.children || (parent.children = []))
					// add node to child array
					.push(node);
			} else {
				// parent is null or missing
				treeData.push(node);
			}
		});

		root = treeData[0];
		root.x0 = height / 2;
		root.y0 = 0;
		update(root);
		data = treeData[0];
		load_search_select(treeData[0]);
	});

}	

// load the external data
/* d3.csv("data/data.csv", function(error,links) {
	if (error) throw error;
	var nodesByName = {};
	
//	var id = 0;
	// Create nodes for each unique source and target.
 	links.forEach(function(link) {
		var parent = link.parent = nodeByName(id, link.parent, link.created, link.changed, link.url),
		child = link.child = nodeByName(id, link.child, link.created, link.changed, link.url);
		if (parent.children) parent.children.push(child);
		else parent.children = [child];
		id = id + 1;
		console.log(nodesByName);
	}); 
	
	// Extract the root node and compute the layout.
	var nodes = tree.nodes(links[0].parent);
	
	console.log(links[0].parent);
	
	
	function nodeByName(name, node) {
		
		return nodesByName[name] || (nodesByName[name] = { 
			name: name, 
			created: (node.created ? node.created: ''), 
			changed: (node.changed ? node.changed : ''),
			url: ( node.url ? node.url : '')
		});
		
	}
	
	
	root = links[0].parent;
	root.x0 = height / 2;
	root.y0 = 0;
	update(root);
}); */
	
/* root = data;
root.x0 = height / 2;
root.y0 = 0;
update(root); */

 
function collapse(d) {
	if (d.children) {
		d._children = d.children;
		d._children.forEach(collapse);
		d.children = null;
	}
}

function update(source) {
	var newHeight = Math.max(tree.nodes(root).reverse().length * 20, height);

	d3.select("#render svg")
		.attr("width", width + margin.right + margin.left)
		.attr("height", newHeight + margin.top + margin.bottom);

	tree = d3.layout.tree().size([newHeight, width]);

	var nodes = tree.nodes(root).reverse(),
		links = tree.links(nodes);

	nodes.forEach(function (d) {
		d.y = d.depth * 250;
	});

	var node = svg.selectAll("g.node")
		.data(nodes, function (d) {
		return d.id || (d.id = ++i);
	});

	var nodeEnter = node.enter().append("g")
		.attr("class", "node")
		.attr("transform", function (d) {
		return "translate(" + source.y0 + "," + source.x0 + ")";
	}).on("click", click);
  
	nodeEnter.append("circle")
		.attr("r", 1e-6)
		.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
		.on("mousedown", function(d){ d.children || d._children ? '' : nodeClick(d,this) })
		//.on("mouseover", mouseover)
		//.on("mousemove", function(d){mousemove(d);})
		//.on("mouseout", mouseout);
  
	nodeEnter.append("text")
		.attr("x", function(d) { return d.children || d._children ? -15 : 15; })
		.attr("dy", "0.25em")
		.attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
		.text(function(d) {  return d.children || d._children ? d.name + " (" + d.children.length + ")" : d.name; })
		.style("fill-opacity", 1e-6)
		.attr("id",function(d) { return "text_id_" + d.id })
		.on("mousedown", function(d){ d.children || d._children ? '' : nodeClick(d,this) })
		//.call(wrap, 100); // wrap the text in <= 30 pixels

	var nodeUpdate = node.transition()
		.duration(duration)
		.attr("transform", function (d) {
		return "translate(" + d.y + "," + d.x + ")";
	});
	
	nodeUpdate.select("circle")
		.attr("r", 10)
		.style("fill", function(d) { return (d.depth == 1) ? "#dc3545" : ((d.depth == 2) ? "#007bff" : (d.depth == 3) ? "#FFF" : "#28a745");} )
		.style("stroke", function(d) { return (d.depth == 1) ? "#dc3545" : ((d.depth == 2) ? "#007bff" : (d.depth == 3) ? "#000" : "#28a745");} );
	
	nodeUpdate.select("text")
		.style("fill-opacity", 1);

	var nodeExit = node.exit().transition()
		.duration(duration)
		.attr("transform", function (d) {
			return "translate(" + source.y + "," + source.x + ")";
		})
		.remove();

	nodeExit.select("circle")
		.attr("r", 1e-6);

	nodeExit.select("text")
		.style("fill-opacity", 1e-6);

	var link = svg.selectAll("path.link")
		.data(links, function (d) {
		return d.target.id;
	});

	link.enter().insert("path", "g")
		.attr("class", "link")
		.attr("d", function (d) {
		var o = {
			x: source.x0,
			y: source.y0
		};
		return diagonal({
			source: o,
			target: o
		});
	});

	link.transition()
		.duration(duration)
		.attr("d", diagonal);

	link.exit().transition()
		.duration(duration)
		.attr("d", function (d) {
		var o = {
			x: source.x,
			y: source.y
		};
		return diagonal({
			source: o,
			target: o
		});
	})
	.remove();

	nodes.forEach(function (d) {
		d.x0 = d.x;
		d.y0 = d.y;
	});
	
	
}

// Toggle children on click.
function click(d) {
	if (d.children) {
		d._children = d.children;
		d.children = null;
		update(d);
	} else {
		d.children = d._children;
		d._children = null;
	}
	update(d);
}

/* function click(d) {
  console.log(d);

  if (d.children) {
    d._children = d.children;
    d.children = null;
    update(d);
  } else {
    if (d.type !== 'root' && !d.endNode) {
      var children = [];
      for (var i = 0; i < Math.ceil(Math.random() * 1000); i++) {
        children.push({
          name: i,
          type: 'child',
          endNode: true
        });
      }

      d.children = children;
      update(d);
    }
  }
} */



function expand(d){
	
    var children = (d.children)?d.children:d._children;
    if (d._children) {        
        d.children = d._children;
        d._children = null;       
    }
    if(children)
      children.forEach(expand);

}

function expandAll(){
	expand(root);
	update(root);
}

function collapseAll(){
    root.children.forEach(collapse);
    collapse(root);
    update(root);
}

function hideSheets(d) {
    if (d.children && d.depth > 1) {
        d._children = d.children;
        d._children.forEach(hideSheets);
        d.children = null;
    } else if (d.children) {
        d.children.forEach(hideSheets);
    }
}

function hideSheetsAction(){
    root.children.forEach(hideSheets);
    update(root);
}

function hideApps(d) {
    if (d.children && d.depth > 0) {
        d._children = d.children;
        d._children.forEach(hideApps);
        d.children = null;
    } else if (d.children) {
        d.children.forEach(hideApps);
    }
}

function hideAppsAction(){
    root.children.forEach(hideApps);
    update(root);
}


/* function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 2,
            lineHeight = 0.4, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            dy = 0, //parseFloat(text.attr("dy")),
            tspan = text.text(null)
                        .append("tspan")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                            .text(word);
            }
        }
    });
} */



function nodeClick(d,i) {
	//console.log(i);

	if(i){ d3.select(i).style("font-weight", "bold"); }
	
	var find = flatten(root).find(function(e) {
	if (e.id == d.id)
		return true;
    });
	
	//iterate over the selected node and set color.
    //till it reaches it reaches the root
    while (find.parent) {
		find.path_color = "black";
		find = find.parent;
    }
	update(find);
	
	d3.selectAll("path").style("stroke", function(d) {
		if (d.target.path_color) {
			return d.target.path_color ;//if the value is set
		} 
	});


	var slider = $('#slider').slideReveal({
		trigger: $("#slider-close-button"),
		position: "right",
		push: false,
		overlay: true,
		width: '25%',
		hidden: function(slider, trigger){
			
			var find = flatten(root).find(function(e) {
			if (e.id == d.id)
				return true;
			});
			//iterate over the selected node and set color.
			//till it reaches it reaches the root
			while (find.parent) {
				find.path_color = "#e6e6e6";
				find = find.parent;
			}
			update(find);
			if(i){ d3.select(i).style("font-weight", ""); }
			d3.selectAll("path").style("stroke", "#e6e6e6");
		},
	});
	
	$( "#sheet_name" ).empty().append( d.name );
	$( "#created_at" ).empty().append( d.created_at);	
	$( "#published_on" ).empty().append( d.published_on);	
	$( "#last_loaded" ).empty().append( d.last_loaded);	
	
	$( "#owner" ).empty().append( d.owner );
	$( "#app_name" ).empty().append( d.parent.name );
	$( "#stream_name" ).empty().append( d.parent.parent ? d.parent.parent.name : '' );
	$( "#node_url" ).attr("href",d.url);
	slider.slideReveal("toggle", false);

	//d3.select(this).transition().style("fill", "#fff" );

}

function flatten(root) {
	var nodes = [],
	i = 0;

	function recurse(node) {
		if (node.children) node.children.forEach(recurse);
		if (node._children) node._children.forEach(recurse);
		if (!node.id) node.id = ++i;
		nodes.push(node);
	}

	recurse(root);
	return nodes;
}

function load_search_select(source){
		
	
	//$( "#select_streams" ).append( '<option value="1" selected>Select</option>');
	
	$.each(source.children, function( key, value ) {
		$( "#select_streams" ).append( "<option value='"+value.id+"'>"+value.name+"</option>" );
		$.each( value.children, function( key, value ) {
			$( "#select_apps" ).append( "<option value='"+value.id+"'>"+value.name+"</option>" );
			$.each( value.children, function( key, value ) {
				$( "#select_sheets" ).append( "<option value='"+value.id+"'>"+value.name+"</option>" );
			});
		});
	});
	$('.selectpicker').selectpicker('refresh');
}

//load_search_select(root);	

async function refresh(){
	let data_load = new Promise((resolve, reject) => {
		$('#loading_modal').modal({
			backdrop: 'static',
			keyboard: false,
		});
		$('#loading_modal').modal('show');
		this.data_load();
		setTimeout(() => resolve("done!"), 1000)
	});
	
	let result = await data_load; // wait till the promise resolves (*)

	$('#loading_modal').modal('hide'); 
	$('#data_refreshed_message').addClass('visible').removeClass('invisible');
}

/* function refresh_(){
	$('#loading_modal').modal({
		backdrop: 'static',
		keyboard: false,
	});
	$('#loading_modal').modal('show');
	setTimeout(function(){ 
		$('#loading_modal').modal('hide'); 
		$('#data_refreshed_message').addClass('visible').removeClass('invisible');
	}, 1000);

} */

$(document).ready(function () {
	
	data_load();
	
	$('.selectpicker').on('change', function() {
		node_id = this.value;
		var find = flatten(root).find(function(e) {
			if (e.id == node_id ){
				if(e.depth == 3){
					expandAll();
				}
				nodeClick(e,'');
				return true;
			}
		});
	});
	
	$('#collapse_all_option').on('change', function() {
		if (this.checked) {
			$('.node_selection').each(function () { 
				$(this).prop('checked', false); 
			});
			$('.node_selection_group').children('label').each(function () {
				$(this).removeClass('active');
			});
			collapseAll();
		}
	});
	
	$('#expand_all_option').on('change', function() {
		if (this.checked) {
			$('.node_selection').each(function () { 
				$(this).prop('checked', true); 
			});
			$('.node_selection_group').children('label').each(function () {
				$(this).addClass('active');
			});
			expandAll();
		}
	});
	
	$('#node_selection_sheets').on('change', function() {
		if (this.checked) {
			//Show Sheets
			//console.log('Show Sheets');
			expandAll();
		}else{
			//Hide Sheets
			//console.log('Hide Sheets');
			hideSheetsAction();
		}
	});
	
	$('#node_selection_apps').on('change', function() {
		if (this.checked) {
			//Show Sheets
			//console.log('Show Apps');
		}else{
			//Hide Sheets
			//console.log('Hide Apps');
			hideAppsAction();
		}
	});
	
	$(function () {
		$('[data-toggle="tooltip"]').tooltip()
	});
	
	
});