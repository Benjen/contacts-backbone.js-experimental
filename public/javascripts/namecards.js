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
    if (this.onClose) {
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
  var eventAggregator = _.extend({}, Backbone.Events);
  // List events bound to eventAggregator.  These are simply placeholder functions
  // which are not directly utilized. Listing them in this manner is to help the 
  // developer understand which events are available through the eventAggregator.
  eventAggregator.on('click:addContact', function() {});
//  eventAggregator.on('click:editContact', function() {});
  eventAggregator.on('click:menuButton', function() {});
  eventAggregator.on('load:page', function() {});
  eventAggregator.on('post-delete:contact', function() {});
  eventAggregator.on('pre-delete:contact', function() {});
  eventAggregator.on('redirect:parentPage', function() {});
  eventAggregator.on('submit:contactEditForm', function() {});
  
  /**
   * View Manager
   * 
   * Closes current view and renders new one. Used to "kill" views when 
   * they are no longer in use (i.e. when one switches to a new view). 
   * Also used to track the current URL.
   */
  function PageManager() {
    /**
     * Show page
     */
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
    this.getCurrentUri = function() {
      return this.currentUri;
    };
    this.setCurrentUri = function(uri) {
      this.currentUri = uri;
    };
  };

  /**
   * Model - Contact
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
  
  /**
   * Collection - Contacts
   */
  var Contacts = Backbone.Collection.extend({
    model: Contact,
    url: '/contacts.json',
    parse: function(response) {
      return response.data;
    }
  });
  
  /**
   * View - Individual list item for Contact in list view. 
   */
  var ListContactsItemView = Backbone.View.extend({
    initialize: function() {
      _.bindAll(this, 'removeContact', 'render');
      // Add templates.
      this._template = _.template($('#list-contact-tpl').html());
      this.render();
    },
    events: {
      'click button': 'removeContact'
    },
    /**
     * Remove contact
     * 
     * Makes use of modal dialog to confirm deletion.
     */
    removeContact: function() {
      var self = this;
      // Initialize confirm delete dialog.
      var $dialog = $('<div></div');
      $dialog.html('Are you sure you wish to delete this contact?');
      var dialogOptions = {
        modal: true,
        autoOpen: true,
        buttons: [
          {
            text: 'Yes',
            click: function() {
              // Delete contact.
              eventAggregator.trigger('pre-delete:contact');
              self.model.destroy({
                success: function(model, response) {
                  // Close and remove dialog.
                  $dialog.dialog('close');
                  // Display any messages.
                  if (typeof response.flash !== 'undefined') {
                    Messenger.trigger('new:messages', response.flash);
                  }
                  // Remove view. This results in contact being removed from browse list.
                  self.$el.fadeOut('slow');
                  self.close();
                },
                error: function(model, response) {
                  console.log(response);
                  // Close and remove dialog.
                  $dialog.dialog('close');
                  // Display any messages.
                  if (typeof response.flash !== 'undefined') {
                    Messenger.trigger('new:messages', response.flash);
                  }
                },
                // Wait for server to confirm delete before running callbacks.
                wait: true
              });
            }
          },
          {
            text: 'No',
            click: function() {
              // Close dialog.
              $dialog.dialog('close');
            }
          }
        ],
        close: function(event, ui) {
          $dialog.dialog('destroy');
          // Remove element.
          $dialog.remove();
        }
      };
      // Create confirm delete dialog.
      $dialog.dialog(dialogOptions);
    },
    render: function() {
      this.$el.html($(this._template({ model: this.model})).html());
      return this;
    }
  });
  
  /** 
   * View - List of contacts 
   */
  var ListContactsView = Backbone.View.extend({
    initialize: function() {
      _.bindAll(this, 'render');
      this.collection = this.options.collection;
      this.collection.bind('reset', this.render);
      this.collection.fetch();
    },
    onClose: function() {},
    render: function() {
      var self = this;
      this.$el.hide();
      this.$el.html('<ul></ul>');
      this.collection.each(function(model, index) {
        // render list items.
        var listContactsItemView = new ListContactsItemView({ model: model });
        self.$('ul').append(listContactsItemView.render().el);
      });
      this.$el.fadeIn(500);
      return this;
    }
  });

  /** 
   * View - Display single contact 
   */
  var DisplayContactView = Backbone.View.extend({
    events: {
      'click #delete-contact-button': 'deleteContact',
      'click #edit-contact-button': 'editContact'
    },
    initialize: function() {
      _.bindAll(this, 'deleteContact', 'editContact', 'render');
      // define template in initialize function to ensure DOM has loaded.
      this.template = _.template($('#display-contact-tpl').html());
      this.currentPageUri = this.options.currentPageUri;
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
    deleteContact: function() {
      var self = this;
      // Initialize confirm delete dialog.
      var $dialog = $('<div></div');
      $dialog.html('Are you sure you wish to delete this contact?');
      var dialogOptions = {
        modal: true,
        autoOpen: true,
        buttons: [
          {
            text: 'Yes',
            click: function() {
              // Delete contact.
              eventAggregator.trigger('pre-delete:contact');
              self.model.destroy({
                success: function(model, response) {
                  // Close and remove dialog.
                  $dialog.dialog('close');
                  // Display any messages.
                  if (typeof response.flash !== 'undefined') {
                    Messenger.trigger('new:messages', response.flash);
                  }
                  // Remove view. This results in contact being removed from browse list.
                  self.$el.fadeOut('slow');
                  // return to parent page.
                  eventAggregator.trigger('redirect:parentPage', self.currentPageUri);
                },
                error: function(model, response) {
                  console.log(response);
                  // Close and remove dialog.
                  $dialog.dialog('close');
                  // Display any messages.
                  if (typeof response.flash !== 'undefined') {
                    Messenger.trigger('new:messages', response.flash);
                  }
                },
                // Wait for server to confirm delete before running callbacks.
                wait: true
              });
            }
          },
          {
            text: 'No',
            click: function() {
              // Close dialog.
              $dialog.dialog('close');
            }
          }
        ],
        close: function(event, ui) {
          $dialog.dialog('destroy');
          // Remove element.
          $dialog.remove();
        }
      };
      // Create confirm delete dialog.
      $dialog.dialog(dialogOptions);
    },
    editContact: function() {
      eventAggregator.trigger('load:page', { uri: '/#contact/edit/' + this.model.id });
    },
    onClose: function() {},
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
    initialize: function() {
      _.bindAll(this, 'createDialog', 'render', 'saveContact', 'updateContact');
      // Add templates.
      this._editFormTemplate = _.template($('#edit-contact-form-tpl').html());
      this._emailFieldTemplate = _.template($('#email-field-tpl').html());
      this._phoneFieldTemplate = _.template($('#phone-field-tpl').html());
      // Get URI of current page.
      this.currentPageUri = this.options.currentPageUri;
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
    createDialog: function() {
      var self = this;
      var $dialog = this.$el;
      var dialogOptions = {
        autoOpen: true,
        modal: true,
        width: 400,
        buttons: [
          {
            text: 'Save',
            click: function(event, ui) {
              self.saveContact(event);
              // Reload the current page. The reloading is handled by the Router.
              console.log(self.currentPageUri);
              eventAggregator.trigger('load:page', { uri: self.currentPageUri });
              // Close dialog.
              $dialog.dialog('close');
              // Destroy current View.
              self.close();
            }
          },
          {
            text: 'Close',
            click: function(event, ui) {
              // Close dialog.
              $dialog.dialog('close');
            }
          }
        ],
        close: function(event, ui) {
          self.close();
        }
      };
      this.$el.dialog(dialogOptions);
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
      this.createDialog();
      return this;
    },
    saveContact: function(event) {
      var self = this;
      // Prevent submit event trigger from firing.
      event.preventDefault();
      // Trigger form submit event.
      eventAggregator.trigger('submit:contactEditForm');
      // Update model with form values.
      this.updateContact();
      // Save contact to database.
      this.model.save(this.model.attributes, {
        success: function(model, response) {
          if (typeof response.flash !== 'undefined') {
            Messenger.trigger('new:messages', response.flash);
          }
        },
        error: function(model, response) {
          throw error = new Error('Error occured while saving contact.');
        }
      }, { wait: true });
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
   * View - Email fieldset
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
      eventAggregator.bind('submit:contactEditForm', this.setEmailValues);
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
   * View - Phone fieldset
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
      eventAggregator.bind('submit:contactEditForm', this.setPhoneValues);
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
   * Model - Menu Item
   */
  var MenuItem = Backbone.Model.extend({
    defaults: {
      // Menu item link does not open in a dialog. 
      openInDialog: false
    }
  });
  
  /**
   * Collection - Menu
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
   * View - Menu Item
   */
  var MenuItemView = Backbone.View.extend({
    tagName: 'li',
    model: MenuItem,
    initialize: function() {
      _.bindAll(this, 'buttonClicked', 'render');
    },
    events: {
      'click .button': 'buttonClicked'
    },
    buttonClicked: function(event) {
      // Prevent submit event trigger from firing.
      event.preventDefault();
      var uri = this.$('.button').attr('href');
      var openInDialog = (this.$('.button').hasClass('openInDialog')) ? true : false ;
      // Delegate click event to Router and other relevant Views.
      eventAggregator.trigger('click:menuButton', { uri: uri });
      // Apply active button class to menu item if linked content does 
      // not open in dialog (i.e. content will open in a new page).
      if (this.$('.button').hasClass('openInDialog') === false) {
        this.$('.button').addClass('button-active');
      }
    },
    render: function() {
      var $element = $('<a class="button" title="' + this.model.get('text') + '" href="' + this.model.get('url') + '"><span>' + this.model.get('text') + '</span></a>');
      if (this.model.get('openInDialog') === true) {
        $element.addClass('openInDialog');
      }
      this.$el.append($element);
      return this;
    }
  });
  
  /**
   * View - Menu 
   */
  var PrimaryMenuView = Backbone.View.extend({
    el: '#primary-menu',
    initialize: function() {
      _.bindAll(this, 'render', 'clearActiveButton');
      eventAggregator.bind('click:menuButton', this.clearActiveButton);
      this.collection = this.options.collection;
      this.collection.bind('refresh', this.render);
      this.render();
      // Set menu button corresponding to loaded page to active state.
      var uri = window.location.pathname + window.location.hash;
      this.$('a[href="' + uri + '"]').addClass('button-active');
    },
    /**
     * Remove active button class from all buttons
     * 
     * This ensures that any previously active buttons are cleared when a 
     * new button is clicked.
     */
    clearActiveButton: function(event) {
      // Only clear buttons if the newly clicked link is for a new page 
      // (i.e. the link doesn't open in a modal). This is required since 
      // a model is viewed within the current page, thus the active 
      // button doesn't need to change.
      if (event.openInDialog === false) {
        this.$('.button').each(function(index, element) {
          var $menuItem = $(element);
          if ($menuItem.hasClass('button-active')) {
            $menuItem.removeClass('button-active');
          }
        });
      }
    },
    render: function() {
      this.$el.html('<ul></ul>');
      this.collection.each(function(item, index) {
        var menuItemView = new MenuItemView({ model: item });
        this.$('ul').append(menuItemView.render().el);
      });
      return this;
    }
  });

  
  
  /**
   * Event aggregator for flash message system
   */
  var Messenger = _.extend({}, Backbone.Events);
  Messenger.on('new:messages', function() {});
  Messenger.on('purgeMessages', function() {});
  
  /**
   * Model - Message
   */
  var Message = Backbone.Model.extend({
    defaults: {
      sticky: false
    }
  });
  
  /**
   * Collection - Message 
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
        this.$('.close-flash-message').css({ 'display': 'none' });
      }
      return this;
    }
  });
  
  /**
   * View - Messenges
   */
  var FlashMessagesView = Backbone.View.extend({
    el: '#flash-messages',
    initialize: function() {
      _.bindAll(this, 'appendMessage', 'newMessages', 'render');
      Messenger.bind('new:messages', this.newMessages);
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
   * Router - Page routes
   */
  var ClientSideRouter = Backbone.Router.extend({
    routes: {
      'browse': 'browse',
      'browse/view/:id': 'viewContact',
      'orgs': 'orgs',
      'orgs/:orgName': 'orgs',
      'orgs/:orgName/:id': 'orgs',
      'contact/add': 'addContact',
      'contact/edit/:id': 'addContact',
//      'contact/view/:id': 'viewContact',
      'contact/delete/:id': 'confirmDelete',
      '*path': 'defaultPage'
    },
    initialize: function(options) {
      this.pageManager = options.pageManager;
      _.bindAll(this, 'addContact', 'browse', 'gotoPage', 'redirectToParentPage', 'viewContact');
      // Bind events.
      eventAggregator.bind('redirect:parentPage', this.redirectToParentPage);
      eventAggregator.bind('click:menuButton', this.gotoPage);
      eventAggregator.bind('load:page', this.gotoPage);
      // Create jQuery wrapped content variable.  Avoids having to make 
      // repeated calls for the same DOM object.
      this.$content = $('#content');
    },
    addContact: function() {
      // Set browser URL to that of current page since this view opens 
      // within a dialog within the current page.
      this.navigate(this.pageManager.getCurrentUri(), { trigger: false });
      // Display contact edit form. Note that this.appView.showView() 
      // method is not used since this view contains its own method 
      // for closing itself.
      var editContactFormView = new EditContactFormView({ currentPageUri: '/#' + this.pageManager.getCurrentUri() });
    },
    browse: function() {
      var listContactsView = new ListContactsView({ collection: new Contacts() });
      this.pageManager.setCurrentUri(Backbone.history.getFragment());
      this.pageManager.showView(listContactsView);
    },
    viewContact: function(id) {
      var model = new Contact({ _id: id });
      var displayContactView = new DisplayContactView({ model: model, currentPageUri: '/#' + this.pageManager.getCurrentUri() });
      this.pageManager.setCurrentUri(Backbone.history.getFragment());
      this.pageManager.showView(displayContactView);
    },
    confirmDelete: function(id) {
      var confirmDeleteView = new ConfirmDeleteView(id);
    },
    defaultPage: function(path) {
      this.$content.html('Default');
    },
    /**
     * Ensures that URL hash will reload
     * 
     * This function ensures that a url will reload if the same link is clicked in succession.  
     * This is normally a problem since Backbone.js utilizes hashed URI fragments. Normally a browser 
     * will not reload a hashed URI if the browser is already at that location. 
     * 
     * @param Object args
     *   contains required arguments.
     *   args.uri
     *     String containing the the URI to be loaded. 
     */
    gotoPage: function(args) {
      this.navigate(args.uri, { trigger: true });
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
    redirectToParentPage: function(uri) {
      // Extract parent page info from URI.
      var temp = uri.split('/', 1);
      var parentUri = temp[0];
      this.navigate(parentUri, { trigger: true });
    }
  });
  
  /**
   * Init method for this module
   */
  return {
    init: function(options) {
      // Add view manager.
      var pageManager = new PageManager();
      // Create menu collection.
      var menu = new Menu();
      menu.add(options.menuItems);
      // Add primary menu.
      var primaryMenuView = new PrimaryMenuView({ collection: menu });
      // Add flash messages.
      var flashMessagesView = new FlashMessagesView();
      // Start router.
      var clientSideRouter = new ClientSideRouter({ 
        pageManager: pageManager
      });
      Backbone.history.start();
    }
  };
  
})(Backbone, jQuery);

(function($){

  // Create menu item properties. 
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
      order: 3,
      openInDialog: true
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