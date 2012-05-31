/**
 * Contains custom server-side functions specific to this app.
 */

var _ = require('underscore');

/**
 * Parses form submitted values and converts them to an array
 * 
 * Is used for compound form elements consisting of a number 
 * (e.g. phone number) and a type (e.g Home number).
 * 
 * @param Object valuesObject
 *   Values as submitted by form.
 * @return Array
 *   Array containing objects of number/type pairs.
 */
exports.extractValidValuesToArray = function(valuesObject) {
  var temp = new Array();
  var num = valuesObject.value.length;
  for (var i = 0; i < num; i++) {
    if (typeof valuesObject.value[i] === 'string' && valuesObject.value[i].trim() !== '') {
      temp.push({
        value: valuesObject.value[i], 
        type: valuesObject.type[i]
      });
    }
  }
  return temp;
};

/**
 * Returns css class string denoting form field validation error.
 * 
 * @param boolean error
 * @return string
 */
exports.setErrorCss = function(error) {
  var cssString = '';
  if (error === true) {
    cssString = 'form-field-error';
  }
  return cssString;
};

/**
 * Middleware for creating a namespace on which to attach variables specific to the app.
 */
exports.createNamespace = function() {
  return function(req, res, next) {
    req.Namecards = new Object;
    next();
  }
};