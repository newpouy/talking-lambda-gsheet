module.exports.handler = (event, context, callback) => {
  console.log("value1 = " + event.key1);
  console.log("value2 = " + event.key2); 
  // or 
  // callback("some error type"); 
}