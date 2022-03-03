const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// Helper function declarations

// Checks if router id matches any dish id's
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const dishFound = dishes.find((dish) => dish.id === dishId);
  if (dishFound) {
    res.locals.dish = dishFound;
    return next();
  }
  next({
    status: 404,
    message: `dish id not found : ${dishId}`,
  });
}

/* A function to check if each dish property was assigned 
  by the user*/
function bodyPropertiesExist(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const dish = {
    name,
    description,
    price,
    image_url,
  };

  /*nested function that that checks if the property is
  empty of undefine or returns an error*/
  function propertyWasEntered(dishObject) {
    const dishKeys = Object.keys(dishObject);
    for (let key of dishKeys) {
      if (dishObject[key] === undefined || dishObject[key] === "")
        next({
          status: 400,
          message: `Dish must include a ${key}`,
        });
    }
  }
  propertyWasEntered(dish);

  /* a check to see if the price is an integer and  
  greater than and not equal to 0 */
  if (typeof dish.price !== "number" || dish.price <= 0)
    next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  return next();
}

//function that insures the route id matches the body id
function matchRouteId(req, res, next) {
  const { dishId } = req.params;
  let { data: { id } = {} } = req.body;
  if (!id) id = dishId;
  else if (id !== dishId) {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  return next();
}

// TODO: Implement the /dishes handlers needed to make the tests pass

function read(req, res) {
  res.status(200).json({ data: res.locals.dish });
}

function list(req, res) {
  res.json({ data: dishes });
}

function create(req, res) {
  const id = nextId();
  //dont know how to destructer these variables directly in an object yet
  //so may be redundant
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id,
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;
  const updatedDish = {
    id: dish.id,
    name,
    description,
    price,
    image_url,
  };

  //for loop to change the object elements that are different than the original
  const dishKeys = Object.keys(dish);
  for (let key of dishKeys) {
    if (dish[key] !== updatedDish[key]) {
      dish[key] = updatedDish[key];
    }
  }
  res.json({ data: dish });
}

module.exports = {
  create: [bodyPropertiesExist, create],
  update: [dishExists, matchRouteId, bodyPropertiesExist, update],
  read: [dishExists, read],
  list,
};
