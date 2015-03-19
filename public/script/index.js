
//TEXT DESCRIPTION
//==========================================
//==========================================
var description = d3.select("#text")
    .html("<b>Title: </b><br/><b>Number: </b><br/><b>Body: </b><br/><b>ID: </b><br/><b>Assignee: </b><br/><b>Milestone: </b><br/><b>Repo: </b>");

var descriptNode = {
  id: '',
  number: '',
  title: '',
  body: '',
  naked_body: '',
  assignee: '',
  milestone: '',
  repo: '',
  url: ''
};


$.getJSON("graph-data.json")
  .done(function (data, textStatus, jqXHR) {

    var graphData = data;
    $(".preload").attr('hidden',false);
    $("#loading").attr('hidden',true);

    render(graphData);
  })
  .fail(function () {
    alert('No repos were found under the user/organization you enter');
    location.href="/login.html";
  });
var render = function (graphData) {

  //DROPDOWN
  //==========================================
  //==========================================

  var form = d3.select('select');

  graphData.repos.forEach(function (repo) {
    form.append('option').append('text').text(repo);
  });

  //BUTTONS
  //==========================================
  //==========================================

  d3.select('#hide').on('click', function() {
    undoStack.push(descriptNode);
    hide(descriptNode);
    update();
  });

  d3.select('#hidegroup').on('click', function() {
    var hiddenNodes = [];
    var hide_group = function (node) {
      hiddenNodes.push(node);
      hide(node).forEach(function (new_node) {
        hide_group(new_node);
      });
    };
    hide_group(descriptNode);
    undoStack.push(hiddenNodes);
    update();
  });

  d3.select('#undo').on('click', function() {
    var popped = undoStack.pop();
    if (popped){
      if (popped.length > 0){
        popped.forEach(function (n) {add(n);});
      } else {
        add(popped);
      }
    }
    update();
  });

  d3.select('#findbtn').on('click', function() {
    n = d3.select('#dropdown')[0][0].value + d3.select('#issueNum')[0][0].value;
    find(n);
  });


  //GRAPH
  //==========================================
  //==========================================

  var width = document.getElementsByTagName('body')[0].clientWidth * 0.8,
      height = 500,
      radius = 10, //radius of circles
      markerWidth = 6,
      markerHeight = 6,
      refX = radius + (markerWidth * 2),
      refY = 0;



  var svg = d3.select("#graph").append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr('transform','scale(1)')
      .attr("viewbox", "0 0 "+width+" "+height).append("g");

  svg.append("defs").selectAll("marker")
      .data(graphData.keywords)
    .enter().append("marker")
      .attr("id", function (d) { return d; })
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", refX)
      .attr("refY", refY)
      .attr("markerWidth", markerWidth)
      .attr("markerHeight", markerHeight)
      .attr("orient", "auto")
    .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#666")
      .attr("stroke", "#666");

  //Force
  ////////
  var force = d3.layout.force()
      .size([width, height])
      .linkDistance(70)
      //.gravity(0)
      .charge(-150)
      .on("tick", tick);

  var nodes = force.nodes(),
      links = force.links(),
      node = svg.selectAll(".node"),
      link = svg.selectAll(".link"),
      group = svg.selectAll(".group");

  function tick(e) {
    var groupPath = function(d) {
        var hull = d3.geom.hull(d.values.map(function(i) { return [i.x, i.y]; }));
        if (hull.length > 0){
          return "M" + hull.reverse().join("L") + "Z";
        } else {
          var x = d.values[0].x;
          var y = d.values[0].y;
          var x2 = parseFloat(x) + 1;
          var y2 = parseFloat(y) + 1;
          var x3 = parseFloat(x) - 1;
          var y3 = parseFloat(y) - 1;
          var path = "M" + x + "," + y + "L" + x2 + "," + y2 + "L" + x3 + "," + y3;

          for (var i = 1; i < d.values.length; i++) {
              var a = d.values[i].x;
              var b = d.values[i].y;
              path += "L" + a + "," + b;
          }
          path += "Z";
          return path;
        }
    };

    
    

    if (groupObj){
      group.select("path").attr("d", groupPath);
      //group.select("text").text(function (d) {return d.key;});
      nodes.forEach(function(o, i) {

        switch(groupObj.type) {
        case "assignee":
          o.x += groupObj.dict[o.assignee] * 10 * force.alpha();
          break;
        case "repo":
          o.x += groupObj.dict[o.repo] * 10 * force.alpha();
          break;
        case "milestone":
          o.x += groupObj.dict[o.milestone] * 10 * force.alpha();
          break;
          
        }
      });
    } else {
      group.select("path").attr("d", "M0 0");

    }

    link.select("path").attr("d", linkArc);
    link.select("text").attr("x", function (d) {
                          var dx = d.target.x - d.source.x,
                              dy = d.target.y - d.source.y;
                          return (Math.sqrt(dx * dx + dy * dy) - ((d.type[0]).length * 6))/2;
                          //return 25;
                        });

    node.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });


    node.select("circle")
        .style("fill", function (d) {
          var keyword = new RegExp(d3.select('#keyword')[0][0].value, "i");
          if (d.naked_body.match(keyword) || d.title.match(keyword)){
            return repoColor[d.repo];
          } else {
            return;
          }
        })
        .attr("stroke-width", function (d){
                                if(d.id == descriptNode.id){
                                  return "5px";
                                } else {
                                  return "1.5px";
                                }
        });
    node.select("text")
        .text(function (d) { if(d.number === 0){
          return d.title;
        } else {
          return d.number;
        }});

    var xs = [];
    var ys = [];

    force.nodes().forEach(function (d) {
      xs.push(d.x);
      ys.push(d.y);
    });

    dy = -1 * d3.min([1,d3.min(ys)-50]);
    dx = -1 * d3.min([1,d3.min(xs)-50]);
    scale = d3.min([1,width/(d3.max(xs)+50+dx),height/(d3.max(ys)+50+dy)]);

    svg.attr('transform','translate(' + dx*scale +',' + dy*scale + ')scale('+scale+')');
  }


  function linkArc(d) {
    var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = groupObj ? Math.sqrt(dx * dx + dy * dy) : 0;
    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
  }



  //DATA GATHERING
  //==========================================
  //==========================================
  var linkAll = [];

  var nodeDict = {};

  var linkedNodes = [];

  var repoColor = {};

  var repoCount = {};
  graphData.nodes.forEach(function (node) {
    nodeDict[node.repo+node.number] = node;
    if (repoCount[node.repo] == null){
      repoCount[node.repo] = 1;
    } else {
      repoCount[node.repo]++;
    }
    repoColor[node.repo] = node.repo;
  });

  graphData.links.forEach(function (link) {
    link.source = nodeDict[link.source.repo+""+link.source.number];
    link.target = nodeDict[link.target.repo+""+link.target.number];
    if(linkedNodes.indexOf(link.source)==-1){ linkedNodes.push(link.source); }
    if(linkedNodes.indexOf(link.target)==-1){ linkedNodes.push(link.target); }
    linkAll.push({source: link.source, target: link.target, type: link.type});
  });

  d3.values(repoColor).forEach(function (repo, i) {
    var hue = i * 360 /d3.values(repoColor).length;
    repoColor[repo] = d3.hsl(hue, '.5', '.5');
  });





  //CHECKBOXS
  //==========================================
  //==========================================
  //Adds checkbox for each repo


  //Repo checkboxes
    
  //'All' checkbox
  form = d3.select('#checkboxForm');
  var label = form.append('label');
  label.append('input')
        .attr('type','checkbox')
        .attr('id','all')
        .attr('name','All');
  label.append('text').text('All');
  //'All linked' checkbox
  form.append('text').html('<br/>');
  label = form.append('label');
  label.append('input')
        .attr('type','checkbox')
        .attr('class','checkbox')
        .attr('checked','checked')
        .attr('id','linked')
        .attr('name','linked');
  label.append('text').text('All linked');


  graphData.repos.forEach(function (repo) {
    form.append('text').html('<br/>');
    var label = form.append('label');
    label.append('input')
      .attr('type','checkbox')
      .attr('class','checkbox')
      .attr('id','checkbox')
      .attr('name',repo);
    label.append('font').attr('color',repoColor[repo]).append('text').text(repo + ' ('+ (repoCount[repo] || 0)+')');
  });

  //Add Event listeners
  document.getElementById('all').addEventListener("click", allbox, false);
  var checkboxElements = document.getElementsByClassName('checkbox');
  for (var i=0; i<checkboxElements.length; i++) {
    checkboxElements[i].addEventListener("click", checkbox, false);
  }


  function allbox(){
    if(d3.select('#all')[0][0].checked){
      d3.selectAll('.checkbox').property('checked', true);
    } else {
      d3.selectAll('.checkbox').property('checked', false);
    }

    checkbox();
  }

  function checkbox(){
    //Remove all nodes
    while(nodes.length>0){
      hide(nodes[0]);
    }
    d3.selectAll('.checkbox')[0].forEach(function(checkbox){
      if(checkbox.checked){
        if(checkbox.name == 'linked'){
          linkedNodes.forEach(function (node) {
            add(node);
          });
        }


        d3.values(nodeDict).forEach(function (node){
          if(node.repo == checkbox.name){
            add(node);
          }
        });
      }
    });
    update();


  }
  //Initial
  var undoStack = [];
  var groupObj = null;
  if (linkedNodes.length == 0) {
    if (d3.values(nodeDict).length > 500){
      $( "#linked" ).attr('checked',false);
    } else {
      $( "#all" ).attr('checked','checked');
      allbox();
    }
  }
  checkbox();


  //FUNCTIONS
  //==========================================
  //==========================================

  //Update force graph with new nodes and links
  function update() {
    var groups = [];
    if (groupObj){
      switch(groupObj.type){
        case "assignee":
          groups = d3.nest().key(function(d) {return d.assignee; }).entries(nodes);
          break;
        case "repo":
          groups = d3.nest().key(function(d) {return d.repo; }).entries(nodes);
          break;
        case "milestone":
          groups = d3.nest().key(function(d) {return d.milestone; }).entries(nodes);
          break;
      }
    }

    group = group.data(groups)
        .attr("class","group");

    var newgroup = group.enter().insert("g",".node")
        .attr("class","group")
        .on("click",
          function (d) {
            undoStack.push(d.values);
            d.values.forEach(function (obj) {
              hide(obj);
            });
            update();
          });


    newgroup.append("path")
        .attr("id", function (d,i) { return "gpath_" + i; })
        .style("fill", "black")
        .style("stroke", "black")
        .style("stroke-width", 40)
        .style("stroke-linejoin", "round")
        .style("opacity", '.2');

    newgroup.append("text")
        .attr("x", 8)
        .attr("dy", -28)
        .append("textPath").attr("xlink:href", function (d,i) { return "#gpath_" + i; })
        .attr("id","group_label")
        .attr("font-size", "15");

    group.select("#group_label").text(function (d,i) { return d.key; });

    group.exit().remove();


    link = link.data(links);

    var newlink = link.enter().insert("g",".node");

    newlink.append("path")
        .attr("id", function (d,i) { return "path_" + i; })
        .attr("class", "link")
        .attr("marker-end", function (d) { return "url(#" + d.type + ")"; });

    newlink.append("text")
        .attr("dy", -5)
        .append("textPath").attr("xlink:href", function (d,i) { return "#path_" + i; })
        .attr("id","path_label")
        .attr("font-size", "10");

    link.select("#path_label").text(function (d,i) { return d.type != "n/a" ? d.type : ""; });


    link.exit().remove();

    node = node.data(nodes);

    var newnode = node.enter().append("g")
        .on("click", function (d) { click(d);})
        .attr("class", "node")
        .call(force.drag);

    newnode.append("circle")
        .attr("r", radius)
        .attr("class", function (d) { return 'c' + d.id; })
        .style("stroke", "#333");

    newnode.append("text")
        .attr("x", 12)
        .attr("dy", ".35em");


    node.exit().remove();

    if (groupObj){
      groupObj.dict = setGroupDict();

    }
    force.start();
  }

  //Update Text description on click
  //Argument: node clicked
  function click(d) {
    descriptNode = d;
    var add_btns = function (body) {
      var matches = body.match(/[&\'a-z-_/]*#\d+/gi);
      if (matches) {
        matches.forEach(function (match) {
          if (match.indexOf('\'') == -1 && match.indexOf('&') == -1){
            var id = match.match(/[a-z-_/]+#\d+/gi);
            var repo, n;
            if (id && id.length >0) {
              repo = id[0].match(/[a-z-_]+#/)[0].match(/[a-z-_]+/)[0];
              n = id[0].match(/\d+/)[0];
            } else {
              id = match.match(/#\d+/);
              repo = descriptNode.repo;
              n = id[0].match(/\d+/)[0];
            }
            body = body.replace(match,"<input type='button' value='"+id+"' id='"+repo + n + "' class='bodybtn'></input>");

          }

        });


      }
      return body;
    };


    var highlight = function (body) {
      var keyword = d3.select('#keyword')[0][0].value;
      var keyword_re = new RegExp(keyword, "i");
      var new_body = "";

      var mark = function (add) {
        var match = add.match(keyword_re);
        if (match && keyword !== "") {
          var pos = add.indexOf(match[0]);
          var first_half = add.substring(0,pos);
          var second_half = add.substring(pos + keyword.length);

          return first_half + "<mark>"+match[0]+"</mark>" + mark(second_half);
        }
        return add;
      };



      while (body.length > 0){
        if (body[0] != '<'){ //outside of tag //START WORKING HERE
          var index = body.indexOf('<');
          if (index < 0){
            new_body += mark(body);
            body = "";
          } else {
            new_body += mark(body.substring(0,index));

            body = body.substring(index);
          }
        } else { //within Tag
          new_body += body.substring(0,body.indexOf('>')+1);
          body = body.substring(body.indexOf('>')+1);
        }
      }

      return new_body;
    };


    document.getElementById('text').innerHTML = "<b>Title: </b><a href='" + descriptNode.url + "' target='_blank'>"+highlight(descriptNode.title)+"</a>"+
                                      "<br/><b>Number: </b>"+descriptNode.number+
                                      "<br/><b>Body: </b>"+highlight(add_btns(descriptNode.body))+
                                      "<br/><b>ID: </b>"+descriptNode.id+
                                      "<br/><b>Assignee: </b>"+descriptNode.assignee+
                                      "<br/><b>Milestone: </b>"+descriptNode.milestone+
                                      "<br/><b>Repo: </b>"+descriptNode.repo;
    
    var bodybtnElements = document.getElementsByClassName('bodybtn');

    for (var i=0; i<bodybtnElements.length; i++){
      bodybtnElements[i].addEventListener("click",function (repoPlus) {
                                                    find(repoPlus);
                                                  }.bind(null,bodybtnElements[i].id),false);
    }
    tick();
  }


  //Remove passed in node and adjacent links from graph
  function hide(n){
    var i = nodes.indexOf(nodeDict[n.repo+""+n.number]);
    var connect_nodes = [];
    if (i != -1){
      var removed = nodes.splice(i,1);
      for(i=0; i<links.length; i++){
        if(links[i].source.id == removed[0].id){
          connect_nodes.push(links[i].target);
          links.splice(i,1);
          i--;
        } else if (links[i].target.id == removed[0].id){
          connect_nodes.push(links[i].source);

          links.splice(i,1);
          i--;
        }

      }
    }

    click({
      id: '',
      number: '',
      title: '',
      body: '',
      assignee: '',
      milestone: '',
      repo: ''
    });
    return connect_nodes;
  }

  function add(n){
    if(nodes.indexOf(n)==-1){
      nodes.push(n);
      linkAll.forEach(function(link) {
        if(link.source == n && nodes.indexOf(link.target)!= -1){
          links.push(link);
        } else if(link.target == n && nodes.indexOf(link.source)!= -1){
          links.push(link);
        }
      });
    }

  }

  function find(n){
    //error message is issue doesn't exist
    n = nodeDict[n];
    if (n){
      add(n);
      click(n);
      update();
    } else {
      alert("Warning: You are trying to display a non-open issue");
    }

  }
  document.getElementById('assigneeGroup').addEventListener("click",
    function () {
      d3.select('#repoGroup').property('checked', false);
      d3.select('#mileGroup').property('checked', false);
      groupCall("assignee");
    }, false);
  document.getElementById('repoGroup').addEventListener("click",
    function () {
      d3.select('#assigneeGroup').property('checked', false);
      d3.select('#mileGroup').property('checked', false);
      groupCall("repo");
    }, false);
  document.getElementById('mileGroup').addEventListener("click",
    function () {
      d3.select('#repoGroup').property('checked', false);
      d3.select('#assigneeGroup').property('checked', false);
      groupCall("milestone");
    }, false);
  document.getElementById('keyword').addEventListener("keyup", function () { tick();click(descriptNode);});


  function groupCall(type){
    if (groupObj && groupObj.type === type) {
      groupObj = null;
      force.linkStrength(1);
    } else {
      groupObj = null;
      update();
      groupObj = {
        type: type,
        dict: null
      };
      force.linkStrength(0);
    }
    update();//update sets groupDict
  }

  function setGroupDict() {//Called from update
      var temp = {};
      var i = 1;
      nodes.forEach(function (node) {
        switch(groupObj.type){
          case "assignee":
            temp[node.assignee] = temp[node.assignee] ? temp[node.assignee]+1 : 1;
            break;
          case "repo":
            temp[node.repo] = temp[node.repo] ? temp[node.repo]+1 : 1;
            break;
          case "milestone":
            temp[node.milestone] = temp[node.milestone] ? temp[node.milestone]+1 : 1;
            break;
        }
      });
      var sorted = d3.keys(temp).sort(function (a,b) {
        return temp[a] - temp[b];
      });
      sorted.forEach(function (n, i) {
        temp[n] = (i - (sorted.length /2));
      });
      return temp;
  }
};