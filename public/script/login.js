
var description = d3.select("#text")
    .html("<b>Title: </b><br/><b>Number: </b><br/><b>Body: </b><br/><b>ID: </b><br/><b>Assignee: </b><br/><b>Milestone: </b><br/><b>Repo: </b>");


$.getJSON("orgs.json")
  .done(function (data, textStatus, jqXHR) {
    var orgs = data;
    render(orgs);
  })
  .fail();
var render = function (orgs) {
  document.getElementById('user').addEventListener("click", function userClick(){
    document.getElementById('orgdrop').disabled = "true";
    document.getElementById('publictext').disabled = "true";
  }, false);
  

  document.getElementById('public').addEventListener("click", function pubClick(){
    document.getElementById('publictext').disabled = null;
    document.getElementById('orgdrop').disabled = "true";
  }, false);
  
  
  if (orgs.length !== 0){
    document.getElementById('org').addEventListener("click", function orgClick(){
      document.getElementById('orgdrop').disabled = null;
      document.getElementById('publictext').disabled = "true";
    }, false);

    orgs.forEach(function (org) {
      d3.select('select').append('option').append('text').text(org);
    });
  } else {
    document.getElementById('org').disabled = "true";
    d3.select('select').append('option').append('text').text("User has no Orgs");
  }

};
