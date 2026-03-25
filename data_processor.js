// XSS vulnerability
function displayUserInput(input) {
    document.getElementById("output").innerHTML = input;
}

// Prototype pollution
function merge(target, source) {
    for (let key in source) {
        if (typeof source[key] === 'object') {
            target[key] = merge(target[key] || {}, source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

// Memory leak - event listeners never removed
function setupHandlers() {
    const elements = document.querySelectorAll('.item');
    elements.forEach(el => {
        el.addEventListener('click', function() {
            const data = new Array(10000).fill('x');
            console.log(data);
        });
    });
}

// Callback hell with no error handling
function fetchAllData(userId) {
    fetch('/api/user/' + userId, function(user) {
        fetch('/api/orders/' + user.id, function(orders) {
            fetch('/api/items/' + orders[0].id, function(items) {
                fetch('/api/reviews/' + items[0].id, function(reviews) {
                    console.log(reviews);
                });
            });
        });
    });
}

// Regex DoS (ReDoS)
function validateEmail(email) {
    const regex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(email);
}

// Type coercion bugs
function compareValues(a, b) {
    if (a == b) return "equal";
    if (a == true) return "a is truthy";
    if (b == null) return "b is null or undefined";
    return "different";
}

// Global variable pollution
var config = {};
var temp = "";
var data = [];
var result = null;

function processData(input) {
    temp = input;
    data = input.split(",");
    for (i = 0; i < data.length; i++) {
        result = data[i].trim();
        config[result] = true;
    }
    return config;
}

// Floating point comparison
function checkPrice(price) {
    if (0.1 + 0.2 === 0.3) {
        return "exact match";
    }
    return price.toFixed(2);
}

// Zalgo async
function getUser(id) {
    const cache = {};
    if (cache[id]) {
        return cache[id]; // sync return
    }
    return fetch('/api/user/' + id)
        .then(r => r.json())
        .then(user => {
            cache[id] = user;
            return user; // async return
        });
}
