/**
 * Client side JavaScript for this app
 */

MyApp = (function(Backbone, $) {
  
  /**
   * Move array element from one position to another
   * 
   * @param Int pos1
   *   Index of the element to move.
   * @param Int pos2
   *   Index of the new element location.
   */
  Array.prototype.moveArrayElement = function(pos1, pos2) {
    // local variables
    var i, tmp;
    // cast input parameters to integers
    pos1 = parseInt(pos1, 10);
    pos2 = parseInt(pos2, 10);
    // if positions are different and inside array
    if (pos1 !== pos2 && 0 <= pos1 && pos1 <= this.length && 0 <= pos2 && pos2 <= this.length) {
      // save element from position 1
      tmp = this[pos1];
      // move element down and shift other elements up
      if (pos1 < pos2) {
        for (i = pos1; i < pos2; i++) {
          this[i] = this[i + 1];
        }
      }
      // move element up and shift other elements down
      else {
        for (i = pos1; i > pos2; i--) {
          this[i] = this[i - 1];
        }
      }
      // put element from position 1 to destination
      this[pos2] = tmp;
    }
  };

  /**
   * Create namespace for storing data on client-side.
   */
  if (typeof window.Namecards === 'undefined') {
    window.Namecards = new Object();
  }

  /**
   * Add close method for View.
   * 
   * Unbinds DOM elements, custom events and remove relevant HTML associated with View.   
   */
  Backbone.View.prototype.close = function(){
    this.remove();
    this.unbind();
    if (this.onClose){
      this.onClose();
    }
  };
  
  /**  
   * Event Aggregator
   * 
   * Enables views to subscribe and listen for events. Allows views to be
   * decoupled from each other. 
   * See http://lostechies.com/derickbailey/2011/07/19/references-routing-and-the-event-aggregator-coordinating-views-in-backbone-js/
   */
  var eventAggrigator = _.extend({}, Backbone.Events);
  eventAggrigator.on('submit:contactEditForm', function() {
    console.log('Contact edit form submit event triggered');
  });
  eventAggrigator.on('load:page', function() {
    console.log('Load page event triggered');
  });
  
  /**
   * View Manager
   * 
   * Closes current view and renders new one. Used to "kill" views when 
   * they are no longer in use (i.e. when one switches to a new view).
   */
  function AppView() {
    this.showView = function(view) {
      // Close the current view.
      if (this.currentView){
        this.currentView.close();
      }
      // Set new view as current view.
      this.currentView = view;
      // Add view to page. 
      $('#content').html(this.currentView.el);
    };
  };

  /**
   * Contacts
   */
  var Contact = Backbone.Model.extend({
    urlRoot: '/contacts.json',
    idAttribute: '_id',
    defaults: function() {
      return {
        surname: 'Unknown',
        given_name: '',
        org: '',
        phone: new Array(
          {
            value: '1111111',
            type: 'other'
          },
          {
            value: '2222222',
            type: 'home'
          }
        ),
        email: new Array(
          { value: 'qwerty@hotmail.com' },
          { value: 'brent@skypey.com' }
        ),
        address: new Array({
          street: '',
          district: '',
          city: '',
          country: '',
          postcode: ''
        })
      };
    },
    /**
     * Swap the order of email element
     * @param Int originalIndex
     *   Index denoting original position of a given element.
     * @param Int newIndex
     *   Index denoting new position of given element.
     */
    moveEmailElement: function(originalIndex, newIndex) {
      var emails = this.get('email');
      var placeholder = {};
      // remove the object from its initial position and
      // plant the placeholder object in its place to
      // keep the array length constant
      var objectToMove = emails.splice(originalIndex, 1, placeholder)[0];
      // place the object in the desired position
      emails.splice(newIndex, 0, objectToMove);
      // take out the temporary object
      emails.splice(emails.indexOf(placeholder), 1);
    },
    /**
     * Swap the order of phone element
     * @param Int originalIndex
     *   Index denoting original position of a given element.
     * @param Int newIndex
     *   Index denoting new position of given element.
     */
    movePhoneElement: function(originalIndex, newIndex) {
      var phones = this.get('phone');
      var placeholder = {};
      // remove the object from its initial position and
      // plant the placeholder object in its place to
      // keep the array length constant
      var objectToMove = phones.splice(originalIndex, 1, placeholder)[0];
      // place the object in the desired position
      phones.splice(newIndex, 0, objectToMove);
      // take out the temporary object
      phones.splice(phones.indexOf(placeholder), 1);
    }
  });
  
  var Contacts = Backbone.Collection.extend({
    model: Contact,
    url: '/contacts.json',
    parse: function(response) {
      return response.data;
    }
  });
  
  /** 
   * View - List of contacts 
   */
  var ListContactsView = Backbone.View.extend({
    initialize: function() {
      _.bindAll(this, 'render');
      // Add templates.
      this.template = _.template($('#list-contacts-tpl').html());
      this.collection = this.options.collection;
      this.collection.bind('reset', this.render);
      this.collection.fetch();
    },
    render: function() {
      this.$el
        .hide()
        .html(this.template({ contacts: this.collection }))
        .fadeIn(500);
      return this;
    }
  });
  
  /**
   * View - Delete contact
   * 
   * Responsible for removing contact from the system.
   * 
   */
  var DeleteContactView = Backbone.View.extend({
    el: '#content',
    initialize: function() {
      _.bindAll(this, 'render');
      // Bind deleteContact method to deleteContact event in event aggragator.
      options.eventAggregater.bind('deleteContact', this.deleteContact);
    },
    render: function() {
      return this;
    }
  });
  
  /** 
   * View - Display single contact 
   */
  var DisplayContactView = Backbone.View.extend({
    events: {
      'click #delete-contact-button': 'deleteContact'
    },
    initialize: function() {
      _.bindAll(this, 'deleteContact', 'render');
      // define template in initialize function to ensure DOM has loaded.
      this.template = _.template($('#display-contact-tpl').html());
      // Create reference to event aggregator object.
//      this.eventAggregator = options.eventAggregator;
//      this.eventAggregator.trigger();
      this.model = this.options.model;
      // Add parse method since parsing is not done by collection in this 
      // instance, as this model is not called in the scope of collection 
      // Contacts.
      this.model.parse = function(response) {
        return response.data;
      };
      this.model.bind('change', this.render);
      this.model.fetch();
    },
    deleteContact: function(id) {
      // Trigger deleteContact event.
      this.eventAggregator.trigger('deleteContact', id);
    },
    render: function() {
      this.$el
        .hide()
        .html(this.template({ contact: this.model.attributes }))
        .fadeIn(500);
      return this;
    }
  });
  
  /** 
   * View - Edit contact form 
   */
  var EditContactFormView = Backbone.View.extend({
    events: {
      'click #submit-button': 'saveContact'
    },
    initialize: function() {
      _.bindAll(this, 'render', 'saveContact', 'updateContact');
      // Add templates.
      this._editFormTemplate = _.template($('#edit-contact-form-tpl').html());
      this._emailFieldTemplate = _.template($('#email-field-tpl').html());
      this._phoneFieldTemplate = _.template($('#phone-field-tpl').html());
      // Create array to hold references to all subviews. 
      this.subViews = new Array();
      // Set options for new or existing contact.
      this.model = new Contact();
      // Add parse method since parsing is not done by collection in this 
      // instance, as this model is not called in the scope of collection 
      // Contacts.
      this.model.parse = function(response) {
        return response.data;
      };
      if (typeof this.options.contactId !== 'undefined') {
        // Retrieve contact
        this.model.fetch();
      }
      // Manually trigger view render, since model is unchanged (i.e. was not fetched).
      this.render();
    },
    /**
     * Contains code to run when closing view
     * 
     * Used for unbinding Model and Collection events.
     */
    onClose: function() {
      // Run onClose method of any sub views.
      _.each(this.subViews, function(view, index) {
        if (view.onClose) {
          view.onClose();
        }
      });
    },
    render: function() {
      var self = this;
      this.$el
        .hide()
        .html(this._editFormTemplate({ contact: self.model.toJSON() }));
      // Attach email fieldset subview.
      var emailFieldsetView = new EmailFieldsetView({ model: this.model });
      // Add to subviews array. Useful if need to process subviews later (e.g. if need to run onClose() methods on subviews).
      this.subViews.push(emailFieldsetView);
      emailFieldsetView.render();
      this.$('fieldset.email').append(emailFieldsetView.$el);
      // Attach phone fieldset.
      var phoneFieldsetView = new PhoneFieldsetView({ model: this.model });
      // Add to subviews array. Useful if need to process subviews later (e.g. if need to run onClose() methods on subviews).
      this.subViews.push(phoneFieldsetView);
      phoneFieldsetView.render();
      this.$('fieldset.phone').append(phoneFieldsetView.$el);
      this.$el.fadeIn(500);
      return this;
    },
    saveContact: function(event) {
      var self = this;
      // Prevent submit event trigger from firing.
      event.preventDefault();
      // Trigger form submit event.
      eventAggrigator.trigger('submit:contactEditForm');
      // Update model with form values.
      this.updateContact();
      // Save contact to database.
      this.model.save(this.model.attributes, {
        success: function(model, response) {
          if (typeof response.flash !== 'undefined') {
            Messenger.trigger('newMessages', response.flash);
          }
        },
        error: function(model, response) {
          throw error = new Error('Error occured while saving contact.');
        }
      });
    },
    /**
     * Extract form values and update Contact.
     */
    updateContact: function() {
      this.model.set('surname', this.$('#surname-field').val());
      this.model.set('given_name', this.$('#given-name-field').val());
      this.model.set('org', this.$('#org-field').val());
      // Extract address form values.
      var address = new Array({
        street: this.$('input[name="street"]').val(),
        district: this.$('input[name="district"]').val(),
        city: this.$('input[name="city"]').val(),
        country: this.$('input[name="country"]').val(),
        postcode: this.$('input[name="postcode"]').val()
      });
      this.model.set('address', address);
    }
  });
  
  /**
   * Email fieldset view
   */
  var EmailFieldsetView = Backbone.View.extend({
    /**
     * Events
     */
    events: {
      'click button#add-email-field-button': 'appendNewField',
      'click .remove-email-link': 'removeField'
    },
    /**
     * Init
     */
    initialize: function() {
      _.bindAll(this, 'addSortableFields', 'appendNewField', 'getFieldsHtml', 'removeField', 'render', 'setEmailValues');
      // Bind to event aggregator.
      eventAggrigator.bind('submit:contactEditForm', this.setEmailValues);
      // Add templates.
      this._emailFieldTemplate = _.template($('#email-field-tpl').html());
      this._emailFieldsetTemplate = _.template($('#email-fieldset-tpl').html());
      this.model = this.options.model;
    },
    /**
     * Attaches jQuery UI sortable effect to specified element
     * @param element
     *   jQuery object to which the sortable effect is to be added.
     */
    addSortableFields: function($emailFields) {
      var self = this;
      $emailFields.sortable({
        handle: '.drag-handle',
        create: function(event, ui) {
          // Add move cursor on mouse over effect.
          $emailFields.find('.drag-handle').addClass('drag-handle-enabled');
        },
        start: function(event, ui) {
          // Add drop shadow to object being dragged.
          ui.item.addClass('pop-out');
        },
        stop: function(event, ui) {
          // Remove drop shadow.
          ui.item.removeClass('pop-out');
          // Get original position of element.
          var fieldIdTag = ui.item.find('.email-field').attr('id');
          var fieldId = parseInt(fieldIdTag.match(/\d+/));
          var originalIndex = fieldId;
          // Get new position of element.
          var newIndex = ui.item.parent().children().index(ui.item);
          // Update model.
          var emails = self.model.get('email');
          emails.moveArrayElement(originalIndex, newIndex);
          // Resent id numbering on field elements.
          self._renumberFields();
        }
      });
    },
    /**
     * Append email field to Model and UI
     */
    appendNewField: function() {
      var self = this;
      var newEmailField = { value: '' };
      // Clone Model's email attribute array. 
      var emails = _.clone(this.model.get('email'));
      emails.push(newEmailField);
      // Add updated array to Model.
      this.model.set({ email: emails });
      // Append new field to UI.
      var $emailFields = this.$('#email-fields');
      // New index will be one less than the length of the email array in Model.  
      var newIndex = this.model.get('email').length - 1;
      $renderedNewEmailField = $(this._emailFieldTemplate({ 
        index: newIndex, 
        value: newEmailField.value
      }));
      // Add move cursor on mouse over effect.
      $renderedNewEmailField
        .find('.drag-handle')
        .addClass('drag-handle-enabled');
      $renderedNewEmailField
        .hide()
        .appendTo($emailFields)
        .fadeIn('slow');
      // Add sortable effect if more than one field present.
      if (this.model.get('email').length > 1) {
        this.addSortableFields($emailFields);
      }
    },
    /**
     * Contains code to run when closing view
     * 
     * Used for unbinding Model and Collection events.
     */
    onClose: function() {
    },
    /**
     * Remove selected field from Model and UI
     */
    removeField: function(ele) {
      var self = this;
      // Get index of field.
      var fieldIdTag = $(ele.currentTarget).attr('id');
      var fieldId = parseInt(fieldIdTag.match(/\d+/));
      // Remove email from model. Use clone array method to ensure that 
      // change event will fire when using Model.set().
      var emails = _.clone(this.model.get('email'));
      emails.splice(fieldId, 1);
      this.model.set({ email: emails });
      // Remove field from UI.
      $('#email-field-' + fieldId).parent('.email-field-wrapper').fadeOut('fast', function() {
        $(this).remove();
        // Resent id numbering on field elements.
        self._renumberFields();
        // Ensure that email contains a single default value, in the case 
        // that all the fields have been removed.  This is required to 
        // ensure that the form will always have at least one blank value. 
        if (emails.length === 0) {
          self.appendNewField();
        }
        // Remove sortable effect if only one field remains.
        var $emailFields = self.$('#email-fields');
        if (self.model.get('email').length <= 1) {
          $emailFields.sortable('destroy');
          // Remove move cursor on mouse over effect.
          $emailFields.find('.drag-handle').removeClass('drag-handle-enabled');
        }
      });
    },
    /**
     *  Reset numbering in id attribute of UI email field elements
     */
    _renumberFields: function() {
      var $fields = this.$('#email-fields .email-field-wrapper');
      $fields.each(function(index, element) {
        $element = $(element);
        // Update input element.
        $element.children('.email-field').attr('id', 'email-field-' + index);
        // Update remove email field link element.
        $element.children('.remove-email-link').attr('id', 'remove-email-' + index);
      });
    },
    /**
     * Extract form values and update Model 
     */
    setEmailValues: function() {
      // Extract email form values.
      var emails = _.clone(this.model.get('email'));
      var emailFields = this.$('.email-field');
      _.each(emails, function(email, index) {
        email.value = emailFields.eq(index).val();
      });
      this.model.set('email', emails);
    },
    /**
     * Get html of rendered fields
     * @return String
     *   Rendered html string
     */
    getFieldsHtml: function() {
      var $wrapper = $('<div />');
      var emails = _.clone(this.model.get('email'));
      _.each(emails, function(item, index) {
        $wrapper.append(this._emailFieldTemplate({ index: index, value: item.value }));
      }, this);
      return $wrapper.html();
    },
    /**
     * Render view
     */
    render: function() {
      this.$el.html(this._emailFieldsetTemplate({ emailFields: this.getFieldsHtml() }));
      // Add sortable effect if more than one field present.
      var $emailFields = this.$('#email-fields');
      if (this.model.get('email').length > 1) {
        this.addSortableFields($emailFields);
      }
      return this;
    }
  });

  /**
   * Phone fieldset View
   * 
   * Implements phone field in add contact form.
   */
  var PhoneFieldsetView = Backbone.View.extend({
    /**
     * Events
     */
    events: {
      'click button#add-phone-field-button': 'appendNewField',
      'click .remove-phone-link': 'removeField'
    },
    /**
     * Init
     */
    initialize: function() {
      _.bindAll(this, 'addSortableFields', 'appendNewField', 'getFieldsHtml', 'removeField', 'render', 'setPhoneValues');
      // Bind to event aggregator.
      eventAggrigator.bind('submit:contactEditForm', this.setPhoneValues);
      // Add templates.
      this._phoneFieldTemplate = _.template($('#phone-field-tpl').html());
      this._phoneFieldsetTemplate = _.template($('#phone-fieldset-tpl').html());
      // Add model.
      this.model = this.options.model;
    },
    /**
     * Attaches jQuery UI sortable effect to specified element
     * @param element
     *   jQuery object to which the sortable effect is to be added.
     */
    addSortableFields: function($phoneFields) {
      var self = this;
      $phoneFields.sortable({
        handle: '.drag-handle',
        create: function(event, ui) {
          $phoneFields.find('.drag-handle').addClass('drag-handle-enabled');
        },
        start: function(event, ui) {
          // Add drop shadow to object being dragged.
          ui.item.addClass('pop-out');
        },
        stop: function(event, ui) {
          // Remove drop shadow.
          ui.item.removeClass('pop-out');
          // Get original position of element.
          var fieldIdTag = ui.item.find('.phone-field').attr('id');
          var fieldId = parseInt(fieldIdTag.match(/\d+/));
          var originalIndex = fieldId;
          // Get new position of element.
          var newIndex = ui.item.parent().children().index(ui.item);
          // Update model.
          var phones = self.model.get('phone');
          phones.moveArrayElement(originalIndex, newIndex);
          // Resent id numbering on field elements.
          self._renumberFields();
        }
      });
    },
    /**
     * Append phone field to Model and UI
     */
    appendNewField: function() {
      var self = this;
      var phoneField = { 
          value: '',
          type: 'work'
        };
      // Clone Model's email attribute array. 
      var phones = _.clone(this.model.get('phone'));
      phones.push(phoneField);
      // Add updated array to Model.
      this.model.set({ phone: phones });
      // Append new field to UI.
      var $phoneFields = this.$('#phone-fields');
      // New index will be one less than the length of the phone array in Model.  
      var newIndex = this.model.get('phone').length - 1;
      $renderedNewPhoneField = $(this._phoneFieldTemplate({ 
        index: newIndex, 
        value: phoneField.value,
        type: phoneField.type
      }));
      // Add move cursor on mouse over effect.
      $renderedNewPhoneField
        .find('.drag-handle')
        .addClass('drag-handle-enabled');
      // Add new field to DOM using fade in effectl
      $renderedNewPhoneField
        .hide()
        .appendTo($phoneFields)
        .fadeIn('slow');
      // Add sortable effect if more than one phone present.
      if (this.model.get('phone').length > 1) {
        this.addSortableFields($phoneFields);
      }
    },
    /**
     * Contains code to run when closing view
     * 
     * Used for unbinding Model and Collection events.
     */
    onClose: function() {
    },
    /**
     * Remove selected field from Model and UI
     */
    removeField: function(ele) {
      var self = this;
      // Get index of field.
      var fieldIdTag = $(ele.currentTarget).attr('id');
      var fieldId = parseInt(fieldIdTag.match(/\d+/));
      // Remove phone from model.
      var phones = _.clone(this.model.get('phone'));
      phones.splice(fieldId, 1);
      this.model.set({ phone: phones });
      // Remove field from UI.
      this.$('#phone-field-' + fieldId).parent('.phone-field-wrapper').fadeOut('fast', function() {
        $(this).remove();
        // Resent id numbering on field elements.
        self._renumberFields();
        // Ensure that phone contains a single default value, in the case 
        // that all the fields have been removed.  This is required to 
        // ensure that the form will always have at least one blank value. 
        if (self.model.get('phone').length === 0) {
          self.appendNewField();
        }
        // Remove sortable effect if only one field remains.
        var $phoneFields = self.$('#phone-fields');
        if (self.model.get('phone').length <= 1) {
          $phoneFields.sortable('destroy');
          // Remove move cursor on mouse over effect.
          $phoneFields.find('.drag-handle').removeClass('drag-handle-enabled');
        }  
      });
    },
    /**
     *  Reset numbering in id attribute of UI phone field elements
     */
    _renumberFields: function() {
      var $fields = this.$('#phone-fields .phone-field');
      $fields.each(function(index, element) {
        $element = $(element);
        // Update input element.
        $element.attr('id', 'phone-field-' + index);
        // Update select phone type element.
        $element.siblings('.phone-type-select').attr('id', 'phone-type-' + index);
        // Update remove phone field link element.
        $element.siblings('.remove-phone-link').attr('id', 'remove-phone-' + index);
      });
    },
    /**
     * Extract form values and update Model 
     */
    setPhoneValues: function() {
      // Extract phone form values.
      var phones = _.clone(this.model.get('phone'));
      var phoneFields = this.$('.phone-field');
      var phoneTypes = this.$('.phone-type-select');
      _.each(phones, function(phone, index) {
        phone.value = phoneFields.eq(index).val();
        phone.type = phoneTypes.eq(index).val();
      });
      this.model.set('phone', phones);
    },
    /**
     * Get html of rendered fields
     * @return String
     *   Rendered html string
     */
    getFieldsHtml: function() {
      var $wrapper = $('<div />');
      var phones = _.clone(this.model.get('phone'));
      _.each(phones, function(item, index) {
        $wrapper.append(this._phoneFieldTemplate({ index: index, value: item.value, type: item.type }));
      }, this);
      return $wrapper.html();
    },
    /**
     * Render view
     */
    render: function() {
      this.$el.html(this._phoneFieldsetTemplate({ phoneFields: this.getFieldsHtml() }));
      // Add sortable effect if more than one field present.
      var $phoneFields = this.$('#phone-fields');
      if (this.model.get('phone').length > 1) {
        this.addSortableFields($phoneFields);
      }
      return this;
    }
  });

  /**
   * Org field
   * 
   * Implements organization "org" text field in add contact form. 
   * Adds jQuery UI Autocomplete widget to field.
   */
//  var OrgTextFieldView = Backbone.View.extend({
//    el: $('#org'),
//    initialize: function() {
//      _.bindAll(this, 'render');
//      this.render();
//    },
//    render: function() {
//      $(this.el).autocomplete({
//        source: function(req, res) {
//          $.ajax({
//            url: '/orgs.json?terms=' + encodeURIComponent(req.term),
//            type: 'GET',
//            success: function(data) { 
//              res(data); 
//            },
//            error: function(jqXHR, textStatus, errorThrown) {
//              alert('Something went wrong in the client side javascript.');
//            },
//            dataType: 'json',
//            cache: false
//          });
//        }
//      });
//      return this;
//    }
//  });
  
  // Create instance of OrgTextFieldView.
//  var orgTextFieldView = new OrgTextFieldView();

  /**
   * Menu Item Model
   */
  var MenuItem = Backbone.Model.extend();
  
  /**
   * Menu Collection
   */
  var Menu = Backbone.Collection.extend({
    model: MenuItem,
    comparator: function(menuItem) {
      // Collection is sorted by 'order'. Lower numbers will 
      // come before higher numbers. Where value of order is the same, then they will be sorted alphabetically.
      var order = menuItem.get('order');
      if (order < 0) {
        throw error = new Error('Order attribute of Backbone Model MenuItem cannot be negative.');
      }
      if (order > 999) {
        throw error = new Error('Order attribute of Backbone Model MenuItem cannot be larger than 999.');
      }
      // Convert value of order to String and pad to 3 digits. This prevents 12 coming before 3 when sorting.
      
      if (order < 10) {
        order = '00' + order;
      }
      else if (order < 100) {
        order = '0' + order;
      }
      // Convert value of text to lower case.  Prevents issues of capitalization affecting sort order.
      var text = menuItem.get('text').toLocaleLowerCase();
      return order + text;
    }
  });
  
  /**
   * Menu Item View
   */
  var MenuItemView = Backbone.View.extend({
    tagName: 'li',
    model: MenuItem,
    initialize: function() {
      _.bindAll(this, 'render');
    },
    render: function() {
      var element = '<a class="button" title="' + this.model.get('text') + '" href="' + this.model.get('url') + '"><span>' + this.model.get('text') + '</span></a>';
      this.$el.append(element);
      return this;
    }
  });
  
  /**
   * Menu View 
   */
  var PrimaryMenuView = Backbone.View.extend({
    el: '#primary-menu',
    events: {
      'click .button': 'menuButtonClicked'
    },
    initialize: function() {
      _.bindAll(this, 'menuButtonClicked', 'render', 'setActiveButton');
      this.collection = this.options.collection;
      this.collection.bind('refresh', this.render);
      this.render();
      // Set menu button corresponding to loaded page to active state.
      var uri = window.location.pathname + window.location.hash;
      this.$('a[href="' + uri + '"]').addClass('button-active');
    },
    menuButtonClicked: function(event) {
      // Remove previously applied 'button-active' classes from buttons.
      this.$('.button').each(function(index, element) {
        $(element).removeClass('button-active');
      });
      // Apply class to newly pressed button.
      $(event.currentTarget).addClass('button-active');
    },
    render: function() {
      this.$el.html('<ul></ul>');
      this.collection.each(function(item, index) {
        var menuItemView = new MenuItemView({ model: item });
        this.$('ul').append(menuItemView.render().el);
      });
      return this;
    },
    /**
     * Add active button effect to menu button based on current page URI
     */
    setActiveButton: function() {
      var uri = window.location.pathname + window.location.hash;
      this.$('a[href="' + uri + '"]').addClass('button-active');
    }
  });

  
  
  /**
   * Event aggregator for flash message system
   */
  var Messenger = _.extend({}, Backbone.Events);
  Messenger.on('newMessages', function() {
    console.log('New flash message.');
  });
  Messenger.on('purgeMessages', function() {
    console.log('Purge flash messages.');
  });
  
  /**
   * Message Model
   */
  var Message = Backbone.Model.extend({
    defaults: {
      sticky: false
    }
  });
  
  /**
   * Message Collection
   */
  var Messages = Backbone.Collection.extend({
    model: Message
  });
  
  var FlashMessageView = Backbone.View.extend({
    tagName: 'li',
    initialize: function() {
      _.bindAll(this, 'render');
      // Add templates.
      this._flashMessageTemplate = _.template($('#flash-message-tpl').html());
    },
    render: function() {
      this.$el.html(this._flashMessageTemplate({ 
        cssClass: 'flash-message-' + this.model.get('type'),
        text: this.model.get('text')
      }));
      // Hide close button if not a sticky message.
      if (this.model.get('sticky') === false) {
        this.$('.close-flash-message').css({ 'display': 'none'});
      }
      return this;
    }
  });
  
  /**
   * Messenges View
   */
  var FlashMessagesView = Backbone.View.extend({
    el: '#flash-messages',
    initialize: function() {
      _.bindAll(this, 'appendMessage', 'newMessages', 'render');
      Messenger.bind('newMessages', this.newMessages);
      Messenger.bind('purgeMessages', this.purgeMessages);
      this.render();
      // Bind collection to view.
      this.collection = new Messages();
      this.collection.bind('add', this.appendMessage);
    },
    render: function() {
      this.$el.html('<ul></ul>');
      return this;
    },
    appendMessage: function(message) {
      var messageModel = new Message(message);
      var flashMessageView = new FlashMessageView({ model: messageModel });
      var $newFlashMessage = $(flashMessageView.render().el);
      $newFlashMessage
        .hide()
        .appendTo(this.$('ul'))
        .fadeIn();
      // Remove message if not sticky after time delay. 
      if (messageModel.get('sticky') === false) {
        setTimeout(function() {
          $newFlashMessage.fadeOut(500, function() {
            $newFlashMessage.remove();
          });
        }, 2000);
      }
    },
    newMessages: function(messages) {
      var self = this;
      _.each(messages, function(message, index) {
        self.appendMessage(message);
      });
    },
    purgeMessages: function() {}
  });
  
  
  
  /**
   * Page routes
   */
//  var $content = $('#content');
  var ClientSideRouter = Backbone.Router.extend({
    routes: {
      'browse': 'browse',
      'browse/view/:id': 'browseViewContact',
      'orgs': 'orgs',
      'orgs/:orgName': 'orgs',
      'orgs/:orgName/:id': 'orgs',
      'contact/add': 'addContact',
      'contact/view/:id': 'viewContact',
      'contact/delete/:id': 'confirmDelete',
      '*path': 'defaultPage'
    },
    initialize: function(options) {
      this.appView = options.appView;
      // Create menu collection.
      this.menu = new Menu();
      this.menu.add(options.menuItems);
      var primaryMenuView = new PrimaryMenuView({ collection: this.menu });
      var flashMessagesView = new FlashMessagesView();
      // Create jQuery wrapped content variable.  Avoids having to make repeated calls for the same DOM object.
      this.$content = $('#content');
    },
    addContact: function() {
      // Display contact edit form.
      var editContactFormView = new EditContactFormView();
      this.appView.showView(editContactFormView);
    },
    browse: function() {
      var listContactsView = new ListContactsView({ collection: new Contacts() });
      this.appView.showView(listContactsView);
    },
    browseViewContact: function(id) {
      var model = new Contact({ _id: id });
      var displayContactView = new DisplayContactView({ model: model });
      this.appView.showView(displayContactView);
    },
    confirmDelete: function(id) {
      var self = this;
      $.ajax({
        url: '/contact/delete/' + id,
        dataType: 'html',
        success: function(data) {
          self.$content.html(data);
        }
      });
    },
    defaultPage: function(path) {
      this.$content.html('Default');
    },
    home: function() {
      this.$content.html('Home');
    },
    orgs: function(orgName, id) {
      this.$content.html('Orgs');
      if (typeof orgName !== 'undefined') {
        this.$content.html(' ' + orgName);
      }
      if (typeof id !== 'undefined') {
        this.$content.html(' ' + id);
      }
    },
    viewContact: function(id) {
      var self = this;
      $.ajax({
        url: '/contact/view/' + id,
        dataType: 'html',
        success: function(data) {
          self.$content.html(data);
        }
      });
    }
  });
  
  /**
   * Init method for this module
   */
  return {
    init: function(options) {
      var appView = new AppView();
      var clientSideRouter = new ClientSideRouter({ 
        appView: appView,
        menuItems: options.menuItems
      });
      Backbone.history.start();
    }
  };
  
})(Backbone, jQuery);

(function($){

  var menuItems = new Array(
    {
      url: '/#browse',
      text: 'Browse',
      order: 0
    },
    {
      url: '/#orgs',
      text: 'Organizations',
      order: 1
    },
    {
      url: '/#events',
      text: 'Events',
      order: 2
    },
    {
      url: '/#contact/add',
      text: 'Add',
      order: 3
    },
    {
      url: '/#email',
      text: 'Email',
      order: 4
    }
  );

  $(document).ready(function() {
    MyApp.init({ menuItems: menuItems });
  });

})(jQuery);