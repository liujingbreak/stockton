var x = 9;
function makeAdder(a) {
    return function(b) {
        console.log('inner func x=%d', x);
        x = 119;
        return a + b;
    };
}
x = 19;

var f = makeAdder(10);
console.log(f(1));
console.log('x=%d', x);
