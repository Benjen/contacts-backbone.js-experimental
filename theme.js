/**
 * 
 */

var _ = require('underscore');
var sanitize = require('validator').sanitize;

/**
 * Sanitizes value to prevent cross-site scripting attacks. 
 * @param value
 * @returns
 *   Sanitized version of the value.
 */
var checkPlain = function(value) {
  var valueType = typeof value;
  var sanitizedValue = null;
  
  switch (valueType) {
    case 'string':
      sanitizedValue = sanitize(value).xss();
      break;
    case 'undefined':
    default:
      console.error('Invalid argument supplied for sanitize().');
      // TODO: Throw error.
      return false;
      break;  
  }
  return sanitizedValue;
}

exports.breadcrumb = function(args) {
  // Default arg settings.
  if (typeof args === 'undefined' || typeof args.path !== 'string' || typeof args.title !== 'string') {
    console.error('Invalid arguments provided for breadcrumb theme function.');
    // TODO: Throw error.
    return false;
  }
  var themedItem = '';
  var breadcrumbElements = {};
  var path = args.path;
  
  // If more than one element.
  // split path into sections.
  path = path.split('/');
  // Remove first path element as this is the home path which is always 
  // present. Removal facilitates easier testing if of path elements are 
  // present.
  path = _.initial(path);
  
  // Determine type of path. For example determine if the base is for orgs 
  // or elements. This is required to correctly construct the urls for 
  // certain links in the breadcrumb trail.
  var pathType = path[1];
  var basePath = '';
  switch (pathType) {
    case 'orgs':
      basePath = 'orgs';
      break;
    case 'events':
      basePath = 'events';
      break;
    default:
      basePath = null;  
  }
  
  // Construct breadcrumb elements.
  var num = path.length;
  var i = 0;
  for (i = 0; i < num; i++) {
    if (i === 0) {
      breadcrumbElements['Home'] = '/';
    }
    else {
      switch (path[i]) {
        case 'browse':
          breadcrumbElements['Browse'] = '/browse';
          break;
        case 'orgs':
          breadcrumbElements['Organizations'] = '/orgs';
          break;
        case 'events':
          breadcrumbElements['Events'] = '/events';
          break;
        default:
          if (typeof basePath !== 'undefined') {
            breadcrumbElements[path[i].replace('_', ' ')] = '/' + basePath + '/' + path[i];
          }
          else {
            breadcrumbElements[path[i].replace('_', ' ')] = '/' + path[i];
          }
      }
    }
  }
  themedItem = '<div id="breadcrumb-trail">\n';
  if (typeof breadcrumbElements !== 'undefined') {
    for (var label in breadcrumbElements) {
      themedItem += '  <div class="breadcrumb"><a href="' + checkPlain(breadcrumbElements[label]) + '">' + checkPlain(label) + '</a></div>\n';
    }
  }
  themedItem += '  <div class="breadcrumb-active">' + checkPlain(args.title) + '</div>\n';
  themedItem += '</div>\n';
  return themedItem;
};