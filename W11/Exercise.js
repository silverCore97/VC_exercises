numAsteroids = 20;
earth = {};
ufo = {};
asteroids = [];

const minX = -5, maxX = 5;
const minY = -3, maxY = 3;

// ============================================
// Initialization
// ============================================

// Initialize Earth.
// Earth is not physically simulated, therefore
// we don't need to include all the info we include
// in the ufo and the asteroids.
function initEarth()
{
  return {
    position: {x: 3.5, y: 1.5},
    velocity: {x: 0, y: 0},
    size: 0.5,
  };
}

// Init Ufo
function initUfo()
{
  return {
    position: {x: -3.5, y: 0.0},
    velocity: {x: 0, y: 0},
    force: {x: 0.0, y: 0.0},
    alpha: 0.0,
    angularVelocity: 0.0, 
    torque: 0.0,
    mass: Math.PI * 0.3 * 0.3 * 5, 
    MoI: Math.PI * 0.5 * 0.3 * 0.3 * 0.3 * 0.3,
    size: 0.3,
  };
}

// Unit Asteroids
// We randomly initialize the properties
// so that we find ourselves in a interesting
// environment.
function initAsteroids()
{
  var density = 30.0;
  var minSize = 0.08, maxSize = 0.3;

  var initAsteroids = [];
  for(var i = 0; i < numAsteroids; i++)
  {
    var randX = Math.random() * (maxX - minX) + minX;
    var randY = Math.random() * (maxY - minY) + minY;
    var randVelX = Math.random() * 0.5 - 0.25; randVelX += Math.sign(randVelX) * 0.25;
    var randVelY = Math.random() * 0.5 - 0.25; randVelY += Math.sign(randVelY) * 0.25;
    var randSize = Math.random() * (maxSize - minSize) + minSize;
    var currentAsteroid = {
      position: {x: randX, y: randY}, 
      velocity: {x: randVelX, y: randVelY}, 
      force: {x: 0.0, y: 0.0},
      alpha: 0.0,
      angularVelocity: Math.random() - 0.5, 
      torque: 0.0,
      mass: density * randSize * randSize * Math.PI,
      MoI: Math.PI * 0.5 * randSize * randSize * randSize * randSize,
      size:randSize
    };
    initAsteroids.push(currentAsteroid);
  }
  return initAsteroids;
}

// Call all initialization functions.
function initScene()
{
  earth = initEarth();
  ufo = initUfo();
  asteroids = initAsteroids();
}

// ============================================
// Physics Simulation
// ============================================

// This code is in charge of updating the positions, orientations,
// linear velocities, and angular velocities for a sphere.
// We use symplectic euler.
function integrate(sphere, dt)
{
  // Task 1

  // Linear
  // ######
	const posX = sphere.position.x;
	const posY = sphere.position.y;

	const velX = sphere.velocity.x;
	const velY = sphere.velocity.y;

	const aX = sphere.force.x / sphere.mass;
	const aY = sphere.force.y / sphere.mass;

	sphere.velocity.x = velX + dt * aX;
	sphere.velocity.y = velY + dt * aY;

	sphere.position.x = posX + dt * sphere.velocity.x;
	sphere.position.y = posY + dt * sphere.velocity.y;

  // Angular
  // #######
	const alpha = sphere.alpha;
	const angVel = sphere.angularVelocity;
	const angAcc = sphere.torque / sphere.MoI;

	sphere.angularVelocity = angVel + dt * angAcc;

	sphere.alpha = alpha + dt * sphere.angularVelocity;
}

// Collision handling for two 2D sphere objects. We limit ourselves to linear impulses.
// First: check if the two object are colliding (intersecting). If not, return.
// Second: Project the objects such that there is no more interpenetration between the two.
// Third: Compute the impulse and the relative change in velocities for the two bodies.
function sphereSphereCollisionHandling(sphereA, sphereB)
{
  // Check if collision
  // ##################

  // Task 2a ...
  const deltaX = sphereB.position.x - sphereA.position.x;
  const deltaY = sphereB.position.y - sphereA.position.y;

  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const minDistance = sphereA.size + sphereB.size;

  const areColliding = distance < minDistance;

  if(!areColliding)
  {
    return;
  }
	
	//Check if distance> radiuses
  // Project to avoid overlap
  // #############################

  // Task 2b ...
  const normalX = deltaX / distance;
  const normalY = deltaY / distance;

  sphereA.position.x -= (minDistance - distance) * 0.5 * normalX;
  sphereA.position.y -= (minDistance - distance) * 0.5 * normalY;

  sphereB.position.x += (minDistance - distance) * 0.5 * normalX;
  sphereB.position.y += (minDistance - distance) * 0.5 * normalY;

  // Compute Impulse
  // ###############
  
  // Task 2c ...
  const relativeVelocityX = sphereA.velocity.x - sphereB.velocity.x;
  const relativeVelocityY = sphereA.velocity.y - sphereB.velocity.y;

  const normalVelocityMagnitude = relativeVelocityX * normalX + relativeVelocityY * normalY;
  const elasticity = 0.9;

  const J_num = -(1 + elasticity) * normalVelocityMagnitude;
  const J_denom = (normalX * normalX + normalY * normalY) * (1.0 / sphereA.mass + 1.0 / sphereB.mass);
  const J = J_num / J_denom;

  // Update Linear
  // #############
  
  // Task 2d ...
  const deltaVelAX = J / sphereA.mass * normalX;
  const deltaVelAY = J / sphereA.mass * normalY;

  const deltaVelBX = -J / sphereB.mass * normalX;
  const deltaVelBY = -J / sphereB.mass * normalY;

  sphereA.velocity.x += deltaVelAX;
  sphereA.velocity.y += deltaVelAY;

  sphereB.velocity.x += deltaVelBX;
  sphereB.velocity.y += deltaVelBY;
}

// If an object goes out of screen, it brings it back to the visible space.
function projectObjects()
{
  // Ufo
  const posX = ufo.position.x;
  const posY = ufo.position.y;
  
  if(posX < minX)
  {
    ufo = initUfo();
  }

  if(posX > maxX)
  {
    ufo = initUfo();
  }

  if(posY < minY)
  {
    ufo = initUfo();
  }

  if(posY > maxY)
  {
    ufo = initUfo();
  }

  // Asteroids
  for(var i = 0; i < numAsteroids; i++)
  {
    const posX = asteroids[i].position.x;
    const posY = asteroids[i].position.y;
    
    if(posX < minX)
    {
      asteroids[i].position.x = maxX; 
    }

    if(posX > maxX)
    {
      asteroids[i].position.x = minX; 
    }

    if(posY < minY)
    {
      asteroids[i].position.y = maxY; 
    }

    if(posY > maxY)
    {
      asteroids[i].position.y = minY; 
    }
  }
}

// Call all the necessary methods to update the full physics step.
function performSimStep(dt)
{
  // First perform time integration
  // for all dynamic objects.
  integrate(ufo, dt);
  for(var i = 0; i < numAsteroids; i++)
  {
    integrate(asteroids[i], dt);
  }

  // Resolve Collisions
  for(var i = 0; i < numAsteroids; i++)
  {
    sphereSphereCollisionHandling(asteroids[i], ufo);
  }
  for(var i = 0; i < numAsteroids-1; i++)
  {
    sphereSphereCollisionHandling(asteroids[i], ufo);
    for(var j = i + 1; j < numAsteroids; j++)
    {
      sphereSphereCollisionHandling(asteroids[i], asteroids[j]);
    }
  }

  // Project objects back to the visible space.
  projectObjects();
}