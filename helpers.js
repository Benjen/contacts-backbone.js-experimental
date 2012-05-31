/**
 * Provides helpers for app
 */

var _ = require('underscore');
var sanitize = require('validator').sanitize;
var fs = require('fs');
var cycle = require('./cycle.js'); // Adds additional methods to JSON object to deal with stringifying circular data structures.

/**
 * Flash messages
 */

// Define FlashMessage object
function FlashMessage(type, messages) {
  this.type = type;
  this.messages = typeof messages === 'string' ? [messages] : messages;
}

// Attach global properties to FlashMessage object.
FlashMessage.prototype = {
  // Get css definition string for icon.
  get icon() {
    switch (this.type) {
      case 'info':
        return 'ui-icon-info';
      case 'error':
        return 'ui-icon-alert';
    }
  },

  // Get css class for message container.
  get stateClass() {
    switch (this.type) {
      case 'info':
        return 'ui-state-highlight';
      case 'error':
        return 'ui-state-error';
    }
  },

  // Returns HTML formatted message.
  toHTML: function() {
    var output = '<div class="ui-widget flash">' +
                 '  <div class="flash-message-wrapper ' + this.stateClass + '">' +
                 '    <span class="ui-icon ' + this.icon + '"></span>' +
//                 '    <p>' +
                 '      <ul class="flash-messages-list">';
    var num = this.messages.length;
    for (var i =0; i < num; i++) {
      output += '        <li>' + this.messages[i] + '</li>';
    }
    output += '      </ul>' +
//              '    </p>' +
              '  </div>' +
              '</div>';
    return output;
  }
};

/**
 * Export dynamic helpers
 */
exports.dynamicHelpers = {
  // Create HTML rendered flash messages.
  flashMessages: function(req, res) {
    var html = '';
    ['error', 'info'].forEach(function(type) {
      var messages = req.flash(type);
      if (messages.length > 0) {
        html += new FlashMessage(type, messages).toHTML();
      }
    });
    return html;
  },
  // Create HTML rendered version of breadcrumb trail based on current path and page title.
  /*breadcrumbTrail: function(req, res) {
    var html = '';
    var breadcrumbElements = {};
    
    // Confirm required arguments are present.
    if (typeof req.Namecards.breadcrumbTrail === 'undefined' || typeof req.Namecards.breadcrumbTrail.path === 'undefined' || typeof req.Namecards.breadcrumbTrail.title === 'undefined') {
      throw new Error('Required arguments for breadcrumbTrail dynamic helper absent.');
    }
    var path = req.Namecards.breadcrumbTrail.path;
    var title = req.Namecards.breadcrumbTrail.title;
    
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
    html = '<div id="breadcrumb-trail">\n';
    if (typeof breadcrumbElements !== 'undefined') {
      for (var label in breadcrumbElements) {
        html += '  <div class="breadcrumb"><a href="' + sanitize(breadcrumbElements[label]).xss() + '">' + sanitize(label).xss() + '</a></div>\n';
      }
    }
    html += '  <div class="breadcrumb-active">' + sanitize(title).xss() + '</div>\n';
    html += '</div>\n';
    return html;
  },*/
  deleteButton: function(req, res) {
    var html = '';
    var contactID = '';
    if (typeof req.params.id !== 'undefined') {
      contactID = req.params.id;
    }
    html += '<form method="get" action="/#contact/delete/' + contactID + '" >';
    html += '  <input type="hidden" name="_method" value="delete"/>';
    html += '  <input type="submit" value="Delete"/>';
    html += '</form>';
//    html += '<a href="/#contact/delete/' + contactID + '">';
//    html += '  <button type="button" id="delete-contact">Delete</button>';
//    html += '</a>';
    return html;
  },
  editButton: function(req, res) {
    var html = '';
    var contactID = '';
    if (typeof req.params.id !== 'undefined') {
      contactID = req.params.id;
    }
    html = '<a href="/#contact/edit/' + contactID + '">';
    html += '  <button type="button" id="edit-contact">Edit</button>';
    html += '</a>';
    return html;
  }
};
