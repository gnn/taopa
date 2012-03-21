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
  this.direction = options.direction || [0, 1];
  this.height    = options.height || 300;
  this.moves     = options.moves || [];
  this.state     = options.state || 0;
  this.width     = options.width || 400;

  this.position  = options.position || [Math.round((this.width-1)/2),
                                        Math.round((this.height-1)/2)];

  this.step = function (color) {
    var x = this.position[0];
    var y = this.position[1];
    var move = this.moves[color][this.state];

    this.state = move.state || this.state;
    this.direction = turn(this.direction, move.turns);
    this.position[0] = fit(x+this.direction[0], this.width);
    this.position[1] = fit(y+this.direction[1], this.height);

    return {"x": x, "y": y, "color": move.color};}}

function combine(){
  var ants = arguments;
  var result = {};
  result.step = function(world){
    result = {};
    for (i = 0; i < ants.length; i++){
      var step = ants[i].step((world[ants[i].position]) || 0);
      var x = step.x; var y = step.y;
      result[x] = result[x] || {};
      result[x][y] = step.color;};
    return result;};
  return result;}

function draw(ant, colors, context, data, image, world) {
  var step = ant.step(world);
  for(var x in step)
    for(var y in step[x]) {
      world[[x,y]] = step[x][y];
      data.set(colors[step[x][y]], 4*image.width*y + 4*x);
      context.putImageData(image, 0, 0, x, y, 1, 1);};
}

function start(){
  var canvas  = document.getElementById("world");
  var height  = canvas.height;
  var width   = canvas.width;
  var langton = new Turmite({
    "moves": [[{"color": 1, "turns": 3}], [{"color": 0, "turns": 1}]]});

  var line = new Turmite({direction: [-1, 0],
                          moves: [[{color: 0, turns: 0}]]});

  var context = canvas.getContext("2d");
  var image   = context.getImageData(0, 0, width, height);
  var ants = [new Turmite({position: [212, 78], direction: [ 0,-1]}),
              new Turmite({position: [639, 78], direction: [ 1, 0]}),
              new Turmite({position: [639,237], direction: [ 0, 1]}),
              new Turmite({position: [212,237], direction: [-1, 0]})];
  for (var i = 0; i < ants.length; i++) {
    ants[i].moves = langton.moves;
    ants[i].height = height;
    ants[i].width = width;}
  var ant = combine.apply(undefined, ants);
  var world = {};
  setInterval(draw, 4, ant, [[255, 255, 255, 255] ,[0, 0, 0, 255]], context,
                       image.data, image, world);
}

