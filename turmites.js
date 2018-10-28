function turn(direction, turns){
  var result = undefined;
  if (turns < 0) { turns = 4 - (-turns % 4); }
  switch (turns) {
    case "f": return turn(direction, 0);
    case "l": return turn(direction, 1);
    case "b": return turn(direction, 2);
    case "r": return turn(direction, 3);
    case   0: return direction;
    default : return turn([-direction[1], direction[0]], turns-1);};}

function fit(x, width){
  if (x >= width) { x %= width; }
  else if (x < 0) { x = width+x; }
  return x;}

function Turmite(options) {
  this.colors    = Math.min(Math.max(options.colors || 5, 2), 5);
  this.direction = options.direction || [0, 1];
  this.height    = options.height || 300;
  this.moves     = options.moves || [];
  this.state     = options.state || 0;
  this.states    = Math.max(options.states || 2, 2);
  this.width     = options.width || 400;

  this.position  = options.position || [Math.round((this.width-1)/2),
                                        Math.round((this.height-1)/2)];

  this.step = function (color) {
    var x = this.position[0];
    var y = this.position[1];
    this.moves[color] = this.moves[color] || [];
    this.moves[color][this.state] = this.moves[color][this.state] || {
      color: Math.floor(Math.random() * this.colors),
      state: Math.floor(Math.random() * this.states),
      turns: Math.floor(Math.random() * 4)
    };
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
      result[x][y] = result[x][y] || {};
      result[x][y][i] = step.color;};
    return result;};
  return result;}

var delay = 4;

function setDelay(d) { delay = d; }

function draw(ant, colors, context, data, image, world) {
  setTimeout(draw, delay, ant, colors, context, data, image, world);
  var step = ant.step(world);
  for(var x in step)
    for(var y in step[x]) {
      var cs = [];
      for (var i in step[x][y]) {
        world[[x,y]] = step[x][y][i];
        cs.push(colors[+step[x][y][i] + (+i * 2)]);
      };
      var color = [0, 0, 0, 0];
      for (i = 0; i < 4; i++) {
        for (var c = 0; c < cs.length; c++) { color[i] += cs[c][i]; }
        color[i] = Math.round(color[i] / cs.length);
      };

      data.set(color, 4*image.width*(+y) + 4*(+x));
      context.putImageData(image, 0, 0, x, y, 1, 1);
    };
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
  var ants = [new Turmite({position: [402,  35], direction: [ 1,-1]}),
              new Turmite({position: [474,  85], direction: [ 1, 0]}),
              new Turmite({position: [353, 108], direction: [ 0,-1]}),
              new Turmite({position: [547, 134], direction: [ 1, 1]}),
              new Turmite({position: [448, 279], direction: [-1, 1]}),
              new Turmite({position: [303, 180], direction: [-1,-1]}),
              new Turmite({position: [376, 229], direction: [-1, 0]}),
              new Turmite({position: [497, 206], direction: [ 0, 1]})];
  for (var i = 0; i < ants.length; i++) {
    ants[i].moves = langton.moves;
    ants[i].height = height;
    ants[i].width = width;}
  var ant = combine.apply(undefined, ants);
  var random = combine(new Turmite({
    position: [425, 157], direction: [0, -1], "width": width, "height": height,
    colors: 5, states: 7
  }));
  var world = {};
  var colors = [[255, 255, 255, 255], [0, 0, 0, 255],
                [0, 255, 255, 255], [255, 0, 0, 255],
                [255, 0, 255, 255], [0, 255, 0, 255],
                [255, 255, 0, 255], [0, 0, 255, 255]];
  var shaded = [[0xFF, 0xFF, 0xFF, 255], [0x00, 0x00, 0x00, 255],
                [0xFF, 0, 0, 255], [0x7F, 0, 0, 255],
                [0, 0xFF, 0, 255], [0, 0x7F, 0, 255],
                [0, 0, 0xFF, 255], [0, 0, 0x7F, 255]];
  var web = [[255, 255, 255, 255], [0xC0, 0xC0, 0xC0, 255],
             [0x80, 0x80, 0x80, 255], [0, 0, 0, 255],
             [255, 0, 0, 255], [0x80, 0, 0, 255],
             [255, 255, 0, 255], [0x80, 0x80, 0, 255],
             [0, 255, 0, 255], [0, 0x80, 0, 255],
             [0, 255, 255, 255], [0, 0x80, 0x80, 255],
             [0, 0, 255, 255], [0, 0, 0x80, 255],
             [255, 0, 255, 255], [0x80, 0, 0x80, 255]];

  setTimeout(draw, delay, ant, web, context, image.data, image, world);
}

