'use strict';

function turn(direction, turns){
  var result = undefined;
  if (turns < 0) { turns = 4 - (-turns % 4); }
  switch (turns) {
    case "f": return turn(direction, 0);
    case "l": return turn(direction, 1);
    case "b": return turn(direction, 2);
    case "r": return turn(direction, 3);
    case   0: return direction;
    default : return turn([-direction[1], direction[0]], turns-1);
  };
}

function fit(x, width){
  if (x >= width) { x %= width; }
  else if (x < 0) { x = width+x; }
  return x;
}

function Turmite(options) {
  this.colors    = Math.max(options.colors || Math.pow(255, 3), 2);
  this.direction = options.direction || [0, 1];
  this.height    = options.height || 300;
  this.moves     = options.moves || [];
  this.state     = options.state || 0;
  this.states    = Math.max(options.states || 1/0, 1);
  this.width     = options.width || 400;

  this.position  = options.position || [Math.round((this.width-1)/2),
                                        Math.round((this.height-1)/2)];

  var random_state = function (turmite) {
    if (isFinite(turmite.states)) {
      return Math.floor(Math.random() * turmite.states);
    } else {
      return Math.floor(Math.random() * (turmite.state + 2));
    };
  };

  this.step = function (color) {
    var x = this.position[0];
    var y = this.position[1];
    this.moves[color] = this.moves[color] || [];
    this.moves[color][this.state] = this.moves[color][this.state] || {
      color: Math.floor(Math.random() * this.colors),
      state: random_state(this),
      turns: Math.floor(Math.random() * 4)
    };
    var move = this.moves[color][this.state];

    this.state = move.state || this.state;
    this.direction = turn(this.direction, move.turns);
    this.position[0] = fit(x+this.direction[0], this.width);
    this.position[1] = fit(y+this.direction[1], this.height);

    return {"x": x, "y": y, "color": move.color};
  };
}

function combine(){
  var ants = arguments;
  var result = {};
  result.step = function(world){
    result = {};
    for (var i = 0; i < ants.length; i++){
      var step = ants[i].step((world[ants[i].position]) || 0);
      var x = step.x; var y = step.y;
      result[x] = result[x] || {};
      result[x][y] = result[x][y] || {};
      result[x][y][i] = step.color;};
    return result;
  };
  return result;
}

var delay = 4;

function setDelay(d) { delay = d; }

function draw(ant, colors, context, data, image, world) {
  var step = ant.step(world);
  for(var x in step)
    for(var y in step[x]) {
      var cs = [];
      for (var i in step[x][y]) {
        world[[x,y]] = step[x][y][i];
        cs.push(colors[(+step[x][y][i] + (+i * 2)) % colors.length]);
      };
      var color = [0, 0, 0, 0];
      for (var i = 0; i < 4; i++) {
        for (var c = 0; c < cs.length; c++) { color[i] += cs[c][i]; }
        color[i] = Math.round(color[i] / cs.length);
      };

      data.set(color, 4*image.width*(+y) + 4*(+x));
      context.putImageData(image, 0, 0, x, y, 1, 1);
    };
}

function animate(ant, colors, context, data, image, world) {
  var as = arguments;
  setTimeout(animate, delay, ant, colors, context, data, image, world);
  for (var i = 0; i < animate.stride; i++) { draw.apply(undefined, as); };
}
animate.stride = 7

function greyscale(length) {
  var step = 255 / (length-1);
  var result = [];
  for (var i = 0; i < length; i++) {
    var grey = Math.round(step * i);
    result.push([grey, grey, grey, 255]);
  };
  return result.reverse();
}

function overlapping(palette) {
  var result = palette.slice(0);
  for (var i = result.length-1; i > 0; i--) {
    result.splice(i, 0, [result[i-1][1], result[i][0]]);
  };
  result.push([result[result.length-1][1], result[0][0]]);
  return result;
}

var palettes = new Map([
    ["bw", [[255, 255, 255, 255], [0, 0, 0, 255]]],
    ["complement",
     [[255, 255, 255, 255], [0, 0, 0, 255],
      [0, 255, 255, 255], [255, 0, 0, 255],
      [255, 0, 255, 255], [0, 255, 0, 255],
      [255, 255, 0, 255], [0, 0, 255, 255]]],
    ["complement (ov)",
     overlapping(
       [[255, 255, 255, 255], [0, 0, 0, 255],
        [0, 255, 255, 255], [255, 0, 0, 255],
        [255, 0, 255, 255], [0, 255, 0, 255],
        [255, 255, 0, 255], [0, 0, 255, 255]])],
    ["shaded",
     [[0xFF, 0xFF, 0xFF, 255], [0x00, 0x00, 0x00, 255],
      [0xFF, 0, 0, 255], [0x7F, 0, 0, 255],
      [0, 0xFF, 0, 255], [0, 0x7F, 0, 255],
      [0, 0, 0xFF, 255], [0, 0, 0x7F, 255]]],
    ["shaded (ov)",
     overlapping(
       [[0xFF, 0xFF, 0xFF, 255], [0x00, 0x00, 0x00, 255],
        [0xFF, 0, 0, 255], [0x7F, 0, 0, 255],
        [0, 0xFF, 0, 255], [0, 0x7F, 0, 255],
        [0, 0, 0xFF, 255], [0, 0, 0x7F, 255]])],
    ["solarized (ov)",
     [[253, 246, 227, 255], [101, 123, 131, 255], //B3 , B00
      [101, 123, 131, 255], [238, 232, 213, 255], //B00, B2
      [238, 232, 213, 255], [131, 148, 150, 255], //B2 , B0
      [131, 148, 150, 255], [0, 43, 54, 255],     //B0 , B03
      [0, 43, 54, 255], [147, 161, 161, 255],     //B03, B1
      [147, 161, 161, 255], [7, 54, 66, 255],     //B1 , B02
      [7, 54, 66, 255], [88, 110, 117, 255],      //B02, B01
      [88, 110, 117, 255], [253, 246, 227, 255]]],//B01, B3
     ["web",
      [[255, 255, 255, 255], [0xC0, 0xC0, 0xC0, 255],
       [0x80, 0x80, 0x80, 255], [0, 0, 0, 255],
       [255, 0, 0, 255], [0x80, 0, 0, 255],
       [255, 255, 0, 255], [0x80, 0x80, 0, 255],
       [0, 255, 0, 255], [0, 0x80, 0, 255],
       [0, 255, 255, 255], [0, 0x80, 0x80, 255],
       [0, 0, 255, 255], [0, 0, 0x80, 255],
       [255, 0, 255, 255], [0x80, 0, 0x80, 255]]],
    ["GS16", greyscale(16)],
    ["GS08OV", overlapping(greyscale(8))]]
);

function start(palette){
  var canvas  = document.getElementById("world");
  var height  = canvas.height;
  var width   = canvas.width;
  var langton = new Turmite({
    "moves": [[{"color": 1, "turns": 3}], [{"color": 0, "turns": 1}]]});

  var line = new Turmite({direction: [-1, 0],
                          moves: [[{color: 0, turns: 0}]]});

  var context = canvas.getContext("2d");
  var image   = context.getImageData(0, 0, width, height);
  function offset(x, y){ return [((width-1)/2)+x, ((height-1)/2)+y]; }
  var ants = [new Turmite({position: offset( -23,-122), direction: [ 1,-1]}),
              new Turmite({position: offset( +49, -72), direction: [ 1, 0]}),
              new Turmite({position: offset(+122, -23), direction: [ 1, 1]}),
              new Turmite({position: offset( +72, +49), direction: [ 0, 1]}),
              new Turmite({position: offset( +23,+122), direction: [-1, 1]}),
              new Turmite({position: offset( -49, +72), direction: [-1, 0]}),
              new Turmite({position: offset(-122, +23), direction: [-1,-1]}),
              new Turmite({position: offset( -72, -49), direction: [ 0,-1]})];

  for (var i = 0; i < ants.length; i++) {
    ants[i].moves = langton.moves;
    ants[i].height = height;
    ants[i].width = width;}
  var ant = combine.apply(undefined, ants);
  var random = combine(new Turmite({
    direction: [0, -1], "width": width, "height": height,
    colors: 4, states: 1
  }));
  // var ant = random;
  var world = {};
  setTimeout(animate, delay, ant, palettes.get(palette), context, image.data,
      image,
      world);
}

