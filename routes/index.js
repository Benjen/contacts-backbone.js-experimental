
var mongoose = require('mongoose');
var _ = require('underscore');
var url = require('url');
var querystring = require('querystring');
var namecards = require('../namecards.js');
var check = require('validator').check;
var Validator = require('validator').Validator;
var sanitize = require('validator').sanitize;
//var theme = require('../theme.js');

/*
 * GET home page.
 */

exports.test = function(req, res){
  res.send('Hi there'); 
};


exports.index = function(req, res){
  //Set args used by breadcrumbTrail helper.
  req.Namecards.breadcrumbTrail = { 
    path: url.parse(req.url).path,
    title: 'Home'
  };
  res.render('index', { 
    locals: {
      title: 'Contacts'
    }
  });
};

/*
 * GET add contact page.
 * 
 * TODO: This is really messy with lots of repeated code. Needs to be overhauled/streamlined.
 * This would not be acceptable in a production system.
 */
exports.addForm = function(req, res) {
  var Contact = mongoose.model('Contact');
  var errors = new Object();
  
  // Set default values for form elements.
  var formValues = {
    surname: {
      value: '',
      cssClass: ''
    },
    given_name: {
      value: '',
      cssClass: ''
    },
    org: {
      value: '',
      cssClass: ''
    },
    phone: new Array({
      value: '',
      type: 'work',
      cssClass: ''
    }),
    email: new Array({
      email: '',
      cssClass: '' 
    }),
    street: { 
      value: '', 
      cssClass: ''
    },
    district: { 
      value: '', 
      cssClass: '' 
    },
    city: { 
      value: '', 
      cssClass: '' 
    },
    country: { 
      value: '', 
      cssClass: '' 
    },
    postcode: { 
      value: '', 
      cssClass: '' 
    }
  };
  
  // Replace default values with submitted form values if existent. 
  if (typeof req.formData !== 'undefined') {
    formValues.surname.value = req.formData.surname.value;
    formValues.surname.cssClass = namecards.setErrorCss(req.formData.surname.error);
    formValues.given_name.value = req.formData.given_name.value;
    formValues.given_name.cssClass = namecards.setErrorCss(req.formData.given_name.error);
    formValues.org.value = req.formData.org.value;
    formValues.org.cssClass = namecards.setErrorCss(req.formData.org.error);
    formValues.street.value = req.formData.address.street.value;
    formValues.street.cssClass = namecards.setErrorCss(req.formData.address.street.error);
    formValues.district.value = req.formData.address.district.value;
    formValues.district.cssClass = namecards.setErrorCss(req.formData.address.district.error);
    formValues.city.value = req.formData.address.city.value;
    formValues.city.cssClass = namecards.setErrorCss(req.formData.address.city.error);
    formValues.country.value = req.formData.address.country.value;
    formValues.country.cssClass = namecards.setErrorCss(req.formData.address.country.error);
    formValues.postcode.value = req.formData.address.postcode.value;
    formValues.postcode.cssClass = namecards.setErrorCss(req.formData.address.postcode.error);
    
    // Process phone numbers.
    var num = req.formData.phone.length;
    if (num > 0) {
      // Remove the default phone number value if actual phone numbers 
      // exist in submitted form data.
      formValues.phone = new Array();
    }
    for (var i = 0; i < num; i++) {
      formValues.phone.push({ 
        value: req.formData.phone[i].value,
        type: req.formData.phone[i].type,
        // Convert error (boolean value) into css class.
        cssClass: namecards.setErrorCss(req.formData.phone[i].error)
      });
    }
    
    // Process email addresses.
    var num = req.formData.email.value.length;
    if (num > 0) {
      // Remove the default phone number value if actual phone numbers 
      // exist in submitted form data.
      formValues.email = new Array();
    }
    for (var i = 0; i < num; i++) {
      formValues.email.push({ 
        value: req.formData.email.value[i],
        // Convert error (boolean value) into css class.
        cssClass: namecards.setErrorCss(req.formData.email.error[i])
      });
    }
  }
  
  // Validation failed errors.
  if (typeof req.formErrors !== 'undefined') {
    errors = req.formErrors;
  }
 
  // Pass relevant values to client-side. Used on client-side by Backbone to construct certain form elements.
  res.expose(formValues.phone, 'window.Namecards.phone');
  res.expose(formValues.email, 'window.Namecards.email');

  // Set args used by breadcrumbTrail helper.
  req.Namecards.breadcrumbTrail = { 
    path: url.parse(req.url).path,
    title: 'Add Contact'
  };
  
  // Render form.
  res.render('add', { 
    locals: {
      title: 'Add Contact',
      put: false,
      formValues: formValues,
      errors: errors
    }
  });
};

/*
 * Display edit contact form.
 * 
 * TODO: This is really messy with lots of repeated code. Needs to be overhauled/streamlined.
 * This would not be acceptable in a production system.
 */
exports.editContact = function(req, res) {
  var Contact = mongoose.model('Contact');
  
  // Set default values for form elements.
  var formValues = {
    surname: {
      value: '',
      cssClass: ''
    },
    given_name: {
      value: '',
      cssClass: ''
    },
    org: {
      value: '',
      cssClass: ''
    },
    phone: new Array({
      value: '',
      type: 'work',
      cssClass: ''
    }),
    email: new Array({
      email: '',
      cssClass: '' 
    }),
    street: { 
      value: '', 
      cssClass: ''
    },
    district: { 
      value: '', 
      cssClass: '' 
    },
    city: { 
      value: '', 
      cssClass: '' 
    },
    country: { 
      value: '', 
      cssClass: '' 
    },
    postcode: { 
      value: '', 
      cssClass: '' 
    }
  };
  
  if (typeof req.formData !== 'undefined') {
    // Set formValues based on formData. 
    formValues.surname.value = req.formData.surname.value;
    formValues.surname.cssClass = namecards.setErrorCss(req.formData.surname.error);
    formValues.given_name.value = req.formData.given_name.value;
    formValues.given_name.cssClass = namecards.setErrorCss(req.formData.given_name.error);
    formValues.org.value = req.formData.org.value;
    formValues.org.cssClass = namecards.setErrorCss(req.formData.org.error);
    formValues.street.value = req.formData.address.street.value;
    formValues.street.cssClass = namecards.setErrorCss(req.formData.address.street.error);
    formValues.district.value = req.formData.address.district.value;
    formValues.district.cssClass = namecards.setErrorCss(req.formData.address.district.error);
    formValues.city.value = req.formData.address.city.value;
    formValues.city.cssClass = namecards.setErrorCss(req.formData.address.city.error);
    formValues.country.value = req.formData.address.country.value;
    formValues.country.cssClass = namecards.setErrorCss(req.formData.address.country.error);
    formValues.postcode.value = req.formData.address.postcode.value;
    formValues.postcode.cssClass = namecards.setErrorCss(req.formData.address.postcode.error);
    
    // Process phone numbers.
    var num = req.formData.phone.length;
    if (num > 0) {
      // Remove the default phone number value if actual phone numbers 
      // exist in submitted form data.
      formValues.phone = new Array();
    }
    for (var i = 0; i < num; i++) {
      formValues.phone.push({ 
        value: req.formData.phone[i].value,
        type: req.formData.phone[i].type,
        // Convert error (boolean value) into css class.
        cssClass: namecards.setErrorCss(req.formData.phone[i].error)
      });
    }
    res.expose(formValues.phone, 'window.Namecards.phone');
    
    // Process email addresses.
    var num = req.formData.email.value.length;
    if (num > 0) {
      // Remove the default phone number value if actual phone numbers 
      // exist in submitted form data.
      formValues.email = new Array();
    }
    for (var i = 0; i < num; i++) {
      formValues.email.push({ 
        value: req.formData.email.value[i],
        // Convert error (boolean value) into css class.
        cssClass: namecards.setErrorCss(req.formData.email.error[i])
      });
    }
    res.expose(formValues.email, 'window.Namecards.email');
    
    //Set args used by breadcrumbTrail helper.
    req.Namecards.breadcrumbTrail = { 
      path: url.parse(req.url).path,
      title: 'Edit Contact'
    };

    // Render form.
    res.render('add', { 
      locals: {
        title: 'Edit Contact',
        put: true,
        _id: req.body._id,
        formValues: formValues
      }
    });
  }
  else {
    // Get values for contact.
    Contact.findById(req.params.id, function(err, doc) {
      formValues.surname.value = doc.surname;
      formValues.given_name.value = doc.given_name;
      formValues.org.value = doc.org;
      formValues.street.value = doc.address[0].street;
      formValues.district.value = doc.address[0].district;
      formValues.city.value = doc.address[0].city;
      formValues.country.value = doc.address[0].country;
      formValues.postcode.value = doc.address[0].postcode;
      
      // Pass relevant values to client-side. Used on client-side by Backbone to construct certain form elements.
      
      // Rebuild the email array as not possible to directly pass values from 
      // the database document as causes a range error. 
      var phones = new Array();
      if (doc.phone.length > 0) {
        _.each(doc.phone, function(item, index) {
          phones.push({
            // Sanitize value since this will be sent to client side.
            value: sanitize(item.value).xss(),
            type: item.type
          });
        });  
      }
      else {
        // Create default value if no values are present. Ensures that empty 
        // field will be rendered in form.
        phones.push({ 
          value: '', 
          type: 'work' 
        });
      }
      res.expose(phones, 'window.Namecards.phone');
      
      // Rebuild the email array as not possible to directly pass values from 
      // the database document as causes a range error. 
      var emails = new Array();
      if (doc.email.length > 0) {
        _.each(doc.email, function(item, index) {
          emails.push({
            // Sanitize value since this will be sent to client side.
            value: sanitize(item.value).xss()
          });
        });
      }
      else {
        // Create default value if no values are present. Ensures that empty 
        // field will be rendered in form.
        emails.push({ 
          value: ''
        });
      }
      res.expose(emails, 'window.Namecards.email');
      
      //Set args used by breadcrumbTrail helper.
      req.Namecards.breadcrumbTrail = { 
        path: url.parse(req.url).path,
        title: 'Edit Contact'
      };
      
      // Render form. The render function must be called within the Contact.findById() 
      // callback since findById() is async in nature. This garrantees that rendering 
      // will always occur after data is retrieved from the database and not before. 
      res.render('add', { 
        locals: {
          title: 'Edit Contact',
          put: true,
          _id: doc._id,
          formValues: formValues
        }
      });
    });
  }
  
  
};

/*
 * POST add contact page.
 */
exports.postContact = function(req, res) {
  var Contact = mongoose.model('Contact');
  
  var contact = new Contact(req.body);
  var errors = new Array();
  var emails = new Array();
  //Save model to database.
  contact.save(function(err) {
    if (err) {
      console.log(err);
      res.json({ 
        flash: [
          { type: 'error', text: 'Contact could not be saved. Error message: ' + err.message, sticky: true }
        ]
      }, 500);
    }
    else {
      res.json({ 
        flash: [
          { type: 'info', text: 'Contact saved' }
        ]
      }, 200);
    }
  });
};
/*exports.postContact = function(req, res){
  console.log('postContact');
  var Contact = mongoose.model('Contact');
  var contact = new Contact();
  var errors = new Array();
  var emails = new Array();
  
  // Extract phone numbers and types.
  if (_.isString(req.body.phone.value)) {
    // Ensure value of object number is an array. For some reason 
    // if only one phone field is present in the form, then it is 
    // passed as a string instead of a string within an Array.
    req.body.phone.value = new Array(req.body.phone.value);
  }
  if (_.isString(req.body.phone.type)) {
    // Ensure value of object type is an array. For some reason 
    // if only one phone field is present in the form, then it is 
    // passed as a string instead of a string within an Array.
    req.body.phone.type = new Array(req.body.phone.type);
  }
  // Filter out empty phone fields and convert phone numbers to array for easier parsing. 
  var phoneNumbers = namecards.extractValidValuesToArray(req.body.phone);
  req.body.phone = phoneNumbers;

  //Extract email addresses.
  if (_.isString(req.body.email) === true) {
    // Ensure value of object email is an array. For some reason 
    // if only one phone field is present in the form, then it is 
    // passed as an object instead of a string within an Array.
    emails.push(req.body.email);
    req.body.email = emails;
  }
  // Filter out empty email fields. This is to avoid validation failure
  // on blank/empty fields, and prevents blank fields being saved to 
  // database.
  var i = 0;
  _.each(req.body.email, function(item) {
    if (typeof item !== 'string' || (typeof item === 'string' && item.trim() === '')) {
      // Remove email from list.
      req.body.email.splice(i, 1);
    }
    i++;
  });
  
  // Validate surname. Is a required field.
  try {
    check(req.body.surname).notEmpty();
  }
  catch (err) {
    errors.push({ field: 'surname', msg: 'Must enter a surname.' });
  }
  
  
  // Validate phone numbers.
  _.each(req.body.phone, function(item, index, list) {
    try {
      check(item.value).is(/^\+[0-9]{1,}\ \([0-9]{1,}\)\ ([0-9]{1,}|[0-9]{1,}-[0-9]{1,})$/);
      list[index].error = false;
    }
    catch (err) {
      list[index].error = true;
      var phoneErrors = _.any(errors, function(item) {
        return item.field === 'phone';
      });
      if (!phoneErrors) {
        errors.push({ field: 'phone', msg: 'Invalid phone number. Correct format is +86 (10) 54367998.' });
      }
    }
  });
  
  // Validate email addresses.  Must be a valid email address format.
  var emailValidationError = new Array();
  var num = req.body.email.length;
  _.each(req.body.email, function(item) {
    try {
      check(item).isEmail();
      emailValidationError.push(false);
    }
    catch (err) {
      emailValidationError.push(true);
      var emailErrors = _.any(errors, function(item) {
        return item.field === 'email';
      });
      if (!emailErrors) {
        errors.push({ field: 'email', msg: 'Invalid email address.' });
      }
    }
  });
 
  // Action to take if any errors occurred.
  if (errors.length) {
    // Add existing form data to request object.
    req.formData = {
      surname: {
        value: req.body.surname,
        error: false
      },
      given_name: {
        value: req.body.given_name,
        error: false
      },
      org: {
        value: req.body.org,
        error: false
      },
      phone: req.body.phone,
      email: {
        value: req.body.email,
        error: emailValidationError
      },
      address: {
        street: {
          value: req.body.street,
          error: false
        },
        district: {
          value: req.body.district,
          error: false
        },
        city: {
          value: req.body.city,
          error: false
        },
        country: {
          value: req.body.country,
          error: false
        },
        postcode: {
          value: req.body.postcode,
          error: false
        }
      }
    };
    // Modify error status of selected elements. 
    var surnameError = _.any(errors, function(item) {
      return item.field === 'surname';
    });
    if (surnameError) {
      req.formData.surname.error = true;
    }
    
    // Add validation errors to flash messages queue.
    var num = errors.length;
    for (var i = 0; i < num; i++) {
      req.flash('error', errors[i].msg);
    }
    
    // Reload form.
    exports.addForm(req, res);
    return;
  }

  // Validation passed so prepare model for saving in database.
  contact.surname = req.body.surname;
  contact.given_name = req.body.given_name;
  contact.org = req.body.org;
  //Remove error property from phone, as not required by DB schema.  
  // Can't use Mongoose middleware, as middleware doesn't support 
  // update method. Could replace Schema.update with Schema.find and 
  // Schema.save to access save method middleware, but this requires 
  // two database calls (i.e. not efficient).  
  req.body.phone.forEach(function(item, index, list) {
    if (typeof item.error !== undefined) {
      item.error = undefined;
    }
  });
  contact.phone = req.body.phone;
  contact.email = new Array();
  _.each(req.body.email, function(item) {
    contact.email.push({ value: item });
  });
  
  contact.address.push({
    street: req.body.street,
    district: req.body.district,
    city: req.body.city,
    country: req.body.country,
    postcode: req.body.postcode
  });

  // Save model to database.
  contact.save(function(err) {
    if (err) {
      console.log(err);
      req.flash('error', 'Contact could not be saved. Error message: ' + err.message);
    }
    else {
      req.flash('info', 'Contact saved.');
    }
    res.redirect('/');
  });
};*/

/*
 * GET Browse contact page.
 */
exports.browse = function(req, res){
  var Contact = mongoose.model('Contact');
  Contact.where({}).asc('surname', 'given_name', 'org').run(function(err, results) {
    if (err) {
      res.send('An error has occurred.  Error message: ' + err.message);
    }
    else {
      // The rendered partial is returned to the client side via ajax. 
      res.partial('browse', { 
          locals: { title: 'Browse', data: results }
        }
      );
    }
  });
};

exports.confirmDeleteOp = function(req, res) {
  var Contact = mongoose.model('Contact');
  // TODO This makes use of a DB call.  Would be more efficient to 
  // pass the surname value directly into this route function, thus 
  // eliminating the need to make the below DB call. 
  Contact.findById(req.params.id, function(err, doc) {
    res.partial('confirmDelete', {
      locals: {
        title: 'Delete confirmation',
        _id: req.params.id,
        text: 'Are you sure you want to delete ' + doc.fullname + '?'
      }
    });
  });
};

// Return JSON object containing all contacts' infomation.
exports.fetchContacts = function(req, res) {
  var Contact = mongoose.model('Contact');
  var conditions = {};
  if (typeof req.params.id !== 'undefined') {
     Contact.findById(req.params.id, function(err, results) {
       if (err) {
         res.send('An error has occurred.  Error message: ' + err.message);
       }
       else {
         // Return json encoded data to the client-side. 
         res.json({ data: results });
       }
     });
  }
  else { 
    Contact.where().asc('surname', 'given_name', 'org').run(function(err, results) {
      if (err) {
        res.send('An error has occurred.  Error message: ' + err.message);
      }
      else {
        // Return json encoded data to the client-side. 
        res.json({ data: results });
      }
    });
  }
};

exports.viewContact = function(req, res) {
  var id = req.params.id;
  // Get document from DB.
  var Contact = mongoose.model('Contact');
  Contact.findOne({ _id: id }, function(err, results) {
    // Set args used by breadcrumbTrail helper.
    req.Namecards.breadcrumbTrail = { 
      path: url.parse(req.url).path,
      title: results.fullname
    };
    req.Namecards.storage = { fullname: results.fullname };
    res.partial('viewContact', {
      locals: {
        title: results.surname + ', ' + results.given_name,
        surname: results.surname,
        givenName: results.given_name,
        org: results.org,
        phones: results.phone,
        emails: results.email,
        addresses: results.address
      }
    });
  });
};

exports.delContact = function(req, res) {
  var Contact = mongoose.model('Contact');
  var id = req.params.id;
  // TODO: Does user have permission to delete contact?
   
  if (req.body.submit === 'Delete') {
    Contact.remove({ _id: id }, function(err) {
      req.flash('info', 'Contact successfully removed.');
      exports.browse(req, res);
    });
  }
  else {
    // Return to previous section.
    exports.viewContact(req, res);
    console.log(req.params);
  }

};

exports.putContact = function(req, res) {
  var Contact = mongoose.model('Contact');
  var contact = new Contact();
  var contactInfo = new Object();
  var errors = new Array();
  var emails = new Array();
  
  // Extract phone numbers and types.
  if (_.isString(req.body.phone.value)) {
    // Ensure value of object number is an array. For some reason 
    // if only one phone field is present in the form, then it is 
    // passed as a string instead of a string within an Array.
    req.body.phone.value = new Array(req.body.phone.value);
  }
  if (_.isString(req.body.phone.type)) {
    // Ensure value of object type is an array. For some reason 
    // if only one phone field is present in the form, then it is 
    // passed as a string instead of a string within an Array.
    req.body.phone.type = new Array(req.body.phone.type);
  }
  // Filter out empty phone fields and convert phone numbers to array for easier parsing. 
  var phoneNumbers = namecards.extractValidValuesToArray(req.body.phone);
  req.body.phone = phoneNumbers;

  // Extract email addresses.
  if (_.isString(req.body.email) === true) {
    // Ensure value of object email is an array. For some reason 
    // if only one phone field is present in the form, then it is 
    // passed as an object instead of a string within an Array.
    emails.push(req.body.email);
    req.body.email = emails;
  }
  // Filter out empty email fields. This is to avoid validation failure
  // on blank/empty fields, and prevents blank fields being saved to 
  // database.
  var i = 0;
  _.each(req.body.email, function(item) {
    if (typeof item !== 'string' || (typeof item === 'string' && item.trim() === '')) {
      // Remove email from list.
      req.body.email.splice(i, 1);
    }
    i++;
  });
  
  // Validate surname. Is a required field.
  try {
    check(req.body.surname).notEmpty();
  }
  catch (err) {
    errors.push({ field: 'surname', msg: 'Must enter a surname.' });
  }
  
  
  // Validate phone numbers.
  _.each(req.body.phone, function(item, index, list) {
    try {
      check(item.value).is(/^\+[0-9]{1,}\ \([0-9]{1,}\)\ ([0-9]{1,}|[0-9]{1,}-[0-9]{1,})$/);
      list[index].error = false;
    }
    catch (err) {
      list[index].error = true;
      var phoneErrors = _.any(errors, function(item) {
        return item.field === 'phone';
      });
      if (!phoneErrors) {
        errors.push({ field: 'phone', msg: 'Invalid phone number. Correct format is +86 (10) 54367998.' });
      }
    }
  });
  
  // Validate email addresses.  Must be a valid email address format.
  var emailValidationError = new Array();
  _.each(req.body.email, function(item) {
    try {
      check(item).isEmail();
      emailValidationError.push(false);
    }
    catch (err) {
      emailValidationError.push(true);
      var emailErrors = _.any(errors, function(item) {
        return item.field === 'email';
      });
      if (!emailErrors) {
        errors.push({ field: 'email', msg: 'Invalid email address.' });
      }
    }
  });
 
  // Action to take if any errors occurred.
  if (errors.length) {
    // Add existing form data to request object.
    req.formData = {
      surname: {
        value: req.body.surname,
        error: false
      },
      given_name: {
        value: req.body.given_name,
        error: false
      },
      org: {
        value: req.body.org,
        error: false
      },
      phone: req.body.phone,
      email: {
        value: req.body.email,
        error: emailValidationError
      },
      address: {
        street: {
          value: req.body.street,
          error: false
        },
        district: {
          value: req.body.district,
          error: false
        },
        city: {
          value: req.body.city,
          error: false
        },
        country: {
          value: req.body.country,
          error: false
        },
        postcode: {
          value: req.body.postcode,
          error: false
        }
      }
    };
    // Modify error status of selected elements. 
    var surnameError = _.any(errors, function(item) {
      return item.field === 'surname';
    });
    if (surnameError) {
      req.formData.surname.error = true;
    }
    
    // Add validation errors to flash messages queue.
    var num = errors.length;
    for (var i = 0; i < num; i++) {
      req.flash('error', errors[i].msg);
    }
    
    // Reload form.
    exports.editContact(req, res);
    return;
  }

  // Validation passed so prepare model for saving in database.
  contactInfo.surname = req.body.surname;
  contactInfo.given_name = req.body.given_name;
  contactInfo.org = req.body.org;
  contactInfo.phone = req.body.phone;
  // Remove error property from phone, as not required by DB schema.  
  // Can't use Mongoose middleware, as middleware doesn't support 
  // update method. Could replace Schema.update with Schema.find and 
  // Schema.save to access save method middleware, but this requires 
  // two database calls (i.e. not efficient).  
  contactInfo.phone.forEach(function(item, index, list) {
    if (typeof item.error !== undefined) {
      item.error = undefined;
    }
  });
  
  contactInfo.email = new Array();
  _.each(req.body.email, function(item) {
    contactInfo.email.push({ value: item });
  });
  
  contactInfo.address = new Array();
  contactInfo.address.push({
    street: req.body.street,
    district: req.body.district,
    city: req.body.city,
    country: req.body.country,
    postcode: req.body.postcode
  });
  
  var query = { _id: req.body._id };
  var updates = {
    $set: {
      surname: contactInfo.surname,
      given_name: contactInfo.given_name,
      org: contactInfo.org,
      address: contactInfo.address,
      email: contactInfo.email,
      phone: contactInfo.phone
    }
  };
  var options = {};
  
  Contact.update(query, updates, options, function(err, result) {
    if (err) {
      res.send(err);
      req.flash('error', 'Unable to update contact. Error message: ' + err.message);
    }
    else {
      req.flash('info', 'Contact has been successfully updated.');
    }
    res.redirect('/contact/view/' + req.body._id);
  });
};

/*
 * GET Orgs page
 * 
 * Render page of organizations or returns a list of unique organizations in json format.
 */
exports.orgs = function(req, res) {
  var Contact = mongoose.model('Contact');
  var query = Contact.find({});
  // Get query from url and search for any terms present.
  var urlQueryStr = url.parse(req.url).query;
  var urlQuery = querystring.parse(urlQueryStr);
  

  //Check if search terms are present.
  if (typeof urlQuery.terms !== 'undefined') {
    var searchTerms = decodeURIComponent(urlQuery.terms);
    var regexp = new RegExp(searchTerms, 'i');
    query.regex('org', regexp);
  }

  query.select('org');
  query.notEqualTo('org', '');
  query.asc('org');
  query.exec(function(err, results) {
    // Create array of org names.
    orgs = _.pluck(results, 'org');
    // Filter out repeated org names.
    orgs = _.uniq(orgs, true);
  
    switch (req.params.format) {
      case 'json':
        // Return list of org names.
        res.send(orgs);
        break;
      
      default:
        // Create encoded version for use in links.
        orgs = _.map(orgs, function(org) { 
          return {
            plain: org, 
            encoded: org.replace(/\ /g, '_') 
          }; 
        });
        // Render org page.
        req.Namecards.breadcrumbTrail = { 
          path: url.parse(req.url).path,
          title: 'Organizations'
        };

        res.render('orgs', {
          locals: {
            title: 'Organizations', 
            data: orgs
          }
        });
        break;
    }
  });
};

exports.orgByName = function(req, res) {
  var Contact = mongoose.model('Contact');
  var orgName = req.params.orgName.replace(/_/g, ' ');
  var query = Contact.find({});
  query.where('org', orgName);
  query.asc('surname', 'given_name');
  query.exec(function(err, results) {
    // Set args used by breadcrumbTrail helper.
    req.Namecards.breadcrumbTrail = { 
        path: url.parse(req.url).path,
        title: orgName
      };
    res.render('orgByName', {
      locals: {
        title: orgName,
        data: results
      }
    });
  });
};