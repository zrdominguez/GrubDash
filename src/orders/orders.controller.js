const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// Checks if user assigned a value to each object property
function checkProperties(req, res, next) {
  const { orderId } = req.params;
  const { data: { id, deliverTo, mobileNumber, dishes } = {} } = req.body;

  //if both the id and route id exists then check if they match
  if (id && orderId) {
    orderId !== id &&
      next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
      });
  }
  //put the data in an object to loop through it and use the key
  //values in the error message
  const deliveryData = { deliverTo, mobileNumber, dishes };
  const deliveryKey = Object.keys(deliveryData);
  for (let key of deliveryKey) {
    /*tried using the condition !deliveryData[key] but the condition was
    not being met when property was undefined and I don't know why*/
    if (deliveryData[key] === "" || deliveryData[key] === undefined) {
      next({
        status: 400,
        message: `Oder must include a ${key}`,
      });
    }
  }
  next();
}

//checks if status entered matches any of the acceptable statuses
function checkStatus(req, res, next) {
  const { data: { status } = {} } = req.body;
  const acceptableStatuses = [
    "pending",
    "preparing",
    "out-for-delivery",
    "delivered",
  ];
  const matchStatus = acceptableStatuses.some(
    (statuses) => statuses === status
  );
  //send error if status does not match
  !matchStatus &&
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  //send error if status is delivered
  status === "delivered" &&
    next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  next();
}

/* checks if the dishes array within the order object is declared
and has the necessary properties*/
function checkDishes(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  //sends an error if dishes is not an array or empty
  if (!Array.isArray(dishes) || dishes.length === 0)
    next({
      status: 400,
      message: `Oder must include at include at least one dish`,
    });

  //checks if dish quantity is a number and greater than and not equal to 0
  dishes.forEach((dish, index) => {
    if (
      dish.quantity === undefined ||
      dish.quantity <= 0 ||
      typeof dish.quantity !== "number"
    ) {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}

// checks if the route id matches the id of any order
function doesOrderExist(req, res, next) {
  const { orderId } = req.params;
  const orderFound = orders.find((order) => order.id === orderId);
  if (orderFound) {
    res.locals.order = orderFound;
    return next();
  }
  next({
    status: 404,
    message: `order id not found : ${orderId}`,
  });
}

// TODO: Implement the /orders handlers needed to make the tests pass

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  let { data: { id } = {} } = req.body;
  //if the id is not assigned by the user, creat a random id
  if (!id) id = nextId();
  const order = { id, deliverTo, mobileNumber, status, dishes };
  orders.push(order);
  res.status(201).json({ data: order });
}

function update(req, res) {
  const originalOrder = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  let { data: { id } = {} } = req.body;
  // if id was not provided by user, assign the same value as the original order
  if (!id) id = originalOrder.id;
  const updatedOrder = { id, deliverTo, mobileNumber, status, dishes };
  const orderKeys = Object.keys(originalOrder);
  // assign property changes to the original order
  for (let key of orderKeys) {
    if (originalOrder[key] !== updatedOrder[key])
      originalOrder[key] = updatedOrder[key];
  }

  res.json({ data: originalOrder });
}

function list(req, res) {
  res.status(200).json({ data: orders });
}

function read(req, res) {
  res.status(200).json({ data: res.locals.order });
}

function destroy(req, res, next) {
  const order = res.locals.order;
  // checks if status is pending, if not then send an error
  order.status !== "pending" &&
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  const index = orders.indexOf(order);
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [checkProperties, checkDishes, create],
  read: [doesOrderExist, read],
  update: [doesOrderExist, checkStatus, checkProperties, checkDishes, update],
  delete: [doesOrderExist, destroy],
};
