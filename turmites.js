function turn(direction, turns){
  var result = undefined;
  if (turns < 0) { turns = 4 - (-turns % 4); }
  switch (turns) {
    case "f": return turn(direction, 0);
    case "l": return turn(direction, 1);
    case "b": return turn(direction, 2);
    case "r": return turn(direction, 3);
    case   0: return direction;
    default : return turn([-direction[1], direction[0]], --turns);};}

function fit(x, width){
  if (x >= width) { x %= width; }
  else if (x < 0) { x = width+x; }
  return x;}

function Turmite(options) {
  this.color     = options.color || 0;
  this.colors    = options.colors || [];
  this.direction = options.direction || [0, 1];
  this.height    = options.height || 300;
  this.moves     = options.moves || [];
  this.state     = options.state || 0;
  this.width     = options.width || 400;
  this.world     = [];

  this.position  = options.position || [Math.round((this.width-1)/2),
                                        Math.round((this.height-1)/2)];

  this.step = function step(){
    var x = this.position[0];
    var y = this.position[1];
    this.world[x] = this.world[x] || [];
    var color = this.world[x][y] || this.color;
    var move = this.moves[color][this.state];

    this.world[x][y] = move.color;
    this.state = move.state || this.state;
    this.direction = turn(this.direction, move.turns);
    this.position[0] = fit(x+this.direction[0], this.width);
    this.position[1] = fit(y+this.direction[1], this.height);

    return {"x": this.position[0], "y": this.position[1],
            "color": this.colors[move.color]};}}

function combine(){
  var ants = arguments;
  var result = {};
  result.step = function(){
    result = {};
    for (i = 0; i < ants.length; i++){
      var step = ants[i].step();
      var x = step.x; var y = step.y;
      result[x] = result[x] || {};
      result[x][y] = (result[x][y] || []).concat([step.color]);};
    for(var x in result)
      for(var y in result[x]){
        var l = result[x][y].length;
        var color = [ 0, 0, 0, 0];
        for(var c = 0; c < 4; c++) {
          for(var i = 0; i < l; i++) color[c] += result[x][y][i][c]; 
          color[c] = Math.round(color[c]/l);}
        result[x][y] = color;
      };
    return result;};
  return result;}

function draw(ant, context, data, image) {
  var step = ant.step();
  for(var x in step)
    for(var y in step[x]) {
      data.set(step[x][y], 4*image.width*y + 4*x);
      context.putImageData(image, 0, 0, x, y, 1, 1);};
}

function start(){
  var canvas  = document.getElementById("world");
  var height  = canvas.height;
  var width   = canvas.width;
  var langton = new Turmite({
    "colors": [[255, 255, 255, 255] ,[0, 0, 0, 255]],
    "moves": [[{"color": 1, "turns": 3}], [{"color": 0, "turns": 1}]]});

  var line = new Turmite({colors: [[0, 0, 0, 255]],
                          direction: [-1, 0],
                          moves: [[{color: 0, turns: 0}]]});

  var context = canvas.getContext("2d");
  var image   = context.getImageData(0, 0, width, height);
  var ants = [new Turmite({position: [212, 78], direction: [ 0,-1]}),
              new Turmite({position: [639, 78], direction: [ 1, 0]}),
              new Turmite({position: [639,237], direction: [ 0, 1]}),
              new Turmite({position: [212,237], direction: [-1, 0]})];
  for (var i = 0; i < ants.length; i++) {
    ants[i].colors = langton.colors;
    ants[i].moves = langton.moves;
    ants[i].height = height;
    ants[i].width = width;}
  var ant = combine.apply(undefined, ants);
  setInterval(draw, 4, ant, context, image.data, image);
}

