let canvasWidth;
let canvasHeight;
let balls;
let restitutionCoeff;
let acceleration;
let fps;
let grain;
let sounds = [];
let oscs;
let osc;

function preload() {
  sounds.push(loadSound('drums/kick.wav'));
  sounds.push(loadSound('drums/snareOpen.wav'));
  sounds.push(loadSound('drums/snareClosed.wav'));
  sounds.push(loadSound('drums/hatClosed.wav'));
}

function setup() {
  canvasWidth = 1000;
  canvasHeight = 1000;
  fps = 60;
  restitutionCoeff = 1;
  grain = 1;
  balls = [makeBall(createVector(50,canvasHeight/2),
                    createVector(900,300),
                    90),
           makeBall(createVector(400,canvasHeight/2),
                    createVector(200,-100),
                    60),
           makeBall(createVector(200,0),
                    createVector(-100,-100),
                    30),
           makeBall(createVector(20,20),
                    createVector(-50,100),
                    15)];
  acceleration = createVector(0,1000);
  createCanvas(canvasWidth, canvasHeight);
}

function draw() {
  background(0);
  balls.forEach(function(ball,index){
    ball.draw();
    ball.velocity.add(p5.Vector.mult(acceleration,grain/fps));
    ball.position.add(p5.Vector.mult(ball.velocity,grain/fps));
    if(handleWallContact(ball)){
      sounds[index].setVolume(calcVolume(ball));
      sounds[index].play();
    }
    for(let otherBallIndex=index+1; otherBallIndex<balls.length; otherBallIndex++){
      let otherBall = balls[otherBallIndex];
      if(handleCollision(ball, otherBall)){
        sounds[index].setVolume(calcVolume(ball));
        sounds[otherBallIndex].setVolume(calcVolume(otherBall));
        sounds[index].play();
        sounds[otherBallIndex].play();
      }
    }
  });
}

function calcVolume(ball) {
  const speed = ball.velocity.mag();
  return speed < 10 ? 0 : ball.radius*speed/1000000;
}

function handleWallContact(ball){
  let r = restitutionCoeff;
  if(ball.position.y + ball.radius > canvasHeight){
    ball.position.y = canvasHeight - ball.radius;
    ball.velocity.y = -ball.velocity.y;
    ball.velocity.mult(restitutionCoeff);
    //if(ball.velocity.mag() > 30)
    return true;
  }
  if(ball.position.y - ball.radius < 0){
    ball.position.y = ball.radius;
    ball.velocity.y = -ball.velocity.y;
    ball.velocity.mult(restitutionCoeff);
    return true;
  }
  if(ball.position.x + ball.radius > canvasWidth){
    ball.position.x = canvasWidth - ball.radius;
    ball.velocity.x = -ball.velocity.x;
    ball.velocity.mult(restitutionCoeff);
    return true;
  }
  if(ball.position.x - ball.radius < 0){
    ball.position.x = ball.radius;
    ball.velocity.x = -ball.velocity.x;
    ball.velocity.mult(restitutionCoeff);
    return true;
  }
  return false;
}

function handleCollision(ball1,ball2){
  if(ball1.position.dist(ball2.position) < ball1.radius+ball2.radius){
    let radialVector = p5.Vector.sub(ball2.position,ball1.position);
    let unitRadial = p5.Vector.mult(radialVector,1/radialVector.mag());
    let unitTangent = p5.Vector.rotate(unitRadial,PI/2);
    let tangentVelocity1 = p5.Vector.mult(unitTangent,ball1.velocity.dot(unitTangent));
    let tangentVelocity2 = p5.Vector.mult(unitTangent,ball2.velocity.dot(unitTangent));
    //r1, r2 are the initial radial velocities (as scalars along the radial)
    let r1 = ball1.velocity.dot(unitRadial);
    let r2 = ball2.velocity.dot(unitRadial);
    let m1 = ball1.mass();
    let m2 = ball2.mass();
    //s1, s2 are the final radial velocities (as scalars along the radial)
    let s1 = (r1*(m1-m2) + r2*2*m2)/(m1+m2);
    let s2 = (r1*2*m1 + r2*(m2-m1))/(m1+m2);
    ball1.velocity = p5.Vector.add(tangentVelocity1,
                                   p5.Vector.mult(unitRadial,s1));
    ball2.velocity = p5.Vector.add(tangentVelocity2,
                                   p5.Vector.mult(unitRadial,s2));
    let radius1 = ball1.radius;
    let radius2 = ball2.radius;
    let pointOfContact = p5.Vector.add(ball1.position,
                                       p5.Vector.mult(radialVector,
                                                      radius1/(radius1+radius2)));

    ball1.position = p5.Vector.sub(pointOfContact,p5.Vector.mult(unitRadial,radius1));
    ball2.position = p5.Vector.add(pointOfContact,p5.Vector.mult(unitRadial,radius2));

    ball1.velocity.mult(restitutionCoeff);
    ball2.velocity.mult(restitutionCoeff);
    return true;
  }
  return false;
}

function makeBall(initPos,initVel,radius){
  return {
    position: initPos,
    velocity: initVel,
    radius: radius,
    mass() {
      return PI*this.radius*this.radius;
    },
    draw() {
      ellipse(this.position.x, this.position.y,
              2*this.radius, 2*this.radius);
    },
  };
}
