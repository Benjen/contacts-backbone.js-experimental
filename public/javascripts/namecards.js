/**
 * Client side JavaScript for this app
 */

(function($){

  $(document).ready(function() {

    /**
     * Create namespace for storing data on client-side.
     */
    if (typeof window.Namecards === 'undefined') {
      window.Namecards = new Object();
    }
    
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
          phone: new Array(),
          email: new Array({ 
            value: ''
          }),
          address: new Array({
            street: '',
            district: '',
            city: '',
            country: '',
            postcode: ''
          })
        };
      },
    });
    
    var Contacts = Backbone.Collection.extend({
      model: Contact,
      url: '/contacts.json',
      parse: function(response) {
        return response.data;
      }
    });
    
    /* View - List of contacts */
    var ListContactsView = Backbone.View.extend({
      el: '#content',
      template: _.template($('#list-contacts-tpl').html()),
      initialize: function() {
        _.bindAll(this, 'render');
        this.collection = new Contacts();
        this.collection.bind('reset', this.render);
        this.collection.fetch();
      },
      render: function() {
        this.$el.hide();
        this.$el.html(this.template({ contacts: this.collection }));
        this.$el.fadeIn(500);
      }
    });
    
    /* View - Display single contact */
    var DisplayContactView = Backbone.View.extend({
      el: '#content',
      template: _.template($('#display-contact-tpl').html()),
      initialize: function() {
        _.bindAll(this, 'render');
        if (typeof this.options.id === 'undefined') {
          throw new Error('View DisplayContactView initialized without _id parameter.');
        }
        this.model = new Contact({ _id: this.options.id });
        // Add parse method since parsing is not done by collection in this 
        // instance, as this model is not called in the scope of collection 
        // Contacts.
        this.model.parse = function(response) {
          return response.data;
        };
        this.model.bind('change', this.render);
        this.model.fetch();
      },
      render: function() {
        this.$el.html(this.template({ contact: this.model.attributes }));
      }
    });
    
    /* View - Edit contact form */
    var EditContactFormView = Backbone.View.extend({
      el: '#content',
      events: {
        // Add email field to form.
        'click #add-email-field-button': 'addEmailField',
        // Remove selected email form field
        'click .remove-email-link': 'removeEmailField'
      },
      _editFormTemplate: _.template($('#edit-contact-form-tpl').html()),
      _emailFieldTemplate: _.template($('#email-field-tpl').html()),
      _phoneFieldTemplate: _.template($('#phone-field-tpl').html()),
      initialize: function() {
        console.log('initialize');
        _.bindAll(this, 'addEmailField', 'getEmailFieldsHtml', 'getPhoneFieldsHtml', 'removeEmailField', 'render');
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
        // Trigger view render, since model is unchanged (i.e. was not fetched).
        this.render();
      },
      addEmailField: function(value) {
        console.log('addEmailField');
        var emails = _.clone(this.model.get('email'));
        var emailAddress = (_.isUndefined(value) !== true && _.isString(value) === true ) ? value : '';
        var newEmail = { value: emailAddress };
        var emailsArraySize = emails.push(newEmail);
        this.model.set({ email: emails });
        // Return the index of the newly set email. 
        var newEmailIndex = emailsArraySize - 1;
        //Update UI
        $('#email-fields').append($(this._emailFieldTemplate({ index: newEmailIndex, value: emailAddress })));
      },
      getEmailFieldsHtml: function() {
        // Returns the HTML rendered email fields. 
        var self = this;
        var $container = $('<div></div>');
        if (this.model.attributes.email.length > 0) {
          // If multiple fields present.
          _(this.model.attributes.email).each(function(item, index) {
            $container.append($(self._emailFieldTemplate({ index: index, value: item.value })));
          });
        }
        else {
          // Single email field.
          $container.append($(this._emailFieldTemplate({ index: '0', value: '' })));
        } 
        return $container.html();
      },
      getPhoneFieldsHtml: function() {
        // Returns the HTML rendered phone fields. 
        var self = this;
        var $container = $('<div></div>');
        if (this.model.attributes.phone.length > 0) {
          _(this.model.attributes.phone).each(function(item, index) {
            $container.append($(self._phoneFieldTemplate({ index: index, value: item.value })));
          });
        }
        else {
          $container.append($(this._phoneFieldTemplate({ index: '0', value: '' })));
        } 
        return $container.html();
      },
      removeEmailField: function(ele) {
        console.log('...removeEmailField...');
        // Extract id number of field
        var fieldIdTag = $(ele.currentTarget).attr('id');
        var fieldId = parseInt(fieldIdTag.match(/\d+/));
        // Remove email from model.
        var emails = _.clone(this.model.get('email'));
        emails.splice(fieldId, 1);
        console.log(fieldId);
        console.log(emails.length);
        this.model.set({ email: emails });
        // Remove field from UI.
        $('#email-field-' + fieldId).parent().remove();
        // Ensure that email contains a single default value, in the case 
        // that all the fields have been removed.  This is required to 
        // ensure that the form will always have at least one blank value. 
        if (emails.length === 0) {
          this.addEmailField();
        }
      },
      render: function() {
        var self = this;
        this.$el.hide();
        this.$el.html(this._editFormTemplate({ 
          contact: self.model.toJSON(),
          emailFields: this.getEmailFieldsHtml(),
          phoneFields: this.getPhoneFieldsHtml()
        }));
        this.$el.fadeIn(500);
      }
    });
    
    /**
     * Email field
     * 
     * Implements email field in add contact form.
     */
    var EmailFieldsetView = Backbone.View.extend({
      el: 'fieldset.email',
      events: {
        'click button#add-email-button': 'addNewField'
      },
      initialize: function() {
        _.bindAll(this, 'render');
      },
      render: function() {
        this.$el.html(this._emailFieldsetTemplate({ emailFields: 'Email fields' }));
        return this;
      },
      _emailFieldsetTemplate: _.template($('#email-fieldset-tpl').html()),
      // Add field containing predetermined number and type.
      addField: function(emailAddress, cssClass) {
      },
      // Add new default field.
      addNewField: function() {
      },
      appendField: function(item) {
      },
      removeField: function(item) {
      }
    });
 
    // Create instance of PhoneFieldView.
//    var emailFieldsetView = new EmailFieldsetView();

    
//    /**
//     * Phone field
//     * 
//     * Implements phone field in add contact form.
//     */
//    var PhoneField = Backbone.Model.extend({
//      defaults: function() { 
//        return {
//          textInputElementName: 'phone[value]',
//          selectTypeElementName: 'phone[type]',
//          number: '',
//          type: 'work',
//          cssClass: ['phone-number']
//        };
//      }
//    });
//    
//    var PhoneFields = Backbone.Collection.extend({
//      model: PhoneField
//    });
//    
//    var PhoneFieldView = Backbone.View.extend({
//      tagName: 'div',
//      events: {
//        'click a.delete-phone-number': 'remove'
//      },
//      initialize: function() {
//        _.bindAll(this, 'render', 'remove');
//      },
//      render: function(counter) {
//        var inputCssClass = this.model.get('cssClass').join(' ');
//        this.$el.html('<input id="phone-number-' + counter + '" type="text" name="' + this.model.get('textInputElementName') + '" value="' + this.model.get('number') + '" class="' + inputCssClass + '" autocomplete="off" />' +
//            '<select  id="phone-type-' + counter + '" name="' + this.model.get('selectTypeElementName') + '" phone="phone-type">' +
//            '  <option value="work">Work</option>' +
//            '  <option value="home">Home</option>' +
//            '  <option value="other">Other</option>' +
//            '</select>' +
//            '&nbsp;<a href="#" class="delete-phone-number">Delete</a>');
//        // Select default option.
//        this.$('select option[value="' + this.model.get('type') + '"]').attr('selected', 'selected');
//        return this;
//      },
//      remove: function() {
//        // Destroy the model associated with this view.
//        this.model.destroy();
//        // Remove this model's view from DOM.
//        this.$el.remove();
//      }
//    });
//    
//    var PhoneFieldsetView = Backbone.View.extend({
//      el: $('fieldset.phone'),
//      events: {
//        'click button#add-phone-button': 'addNewField'
//      },
//      initialize: function() {
//        var self = this;
//        _.bindAll(this, 'render', 'addField', 'addNewField', 'appendField', 'removeField');
//        this.counter = 0;
//        this.collection = new PhoneFields();
//        // Create initial fields. The variable window.Namecards.phone is set 
//        // by the server-side controller.  Note that this is added before binding 
//        // the add event to the collection. This prevents the field being appended 
//        // twice; once during initialization and once during rendering. 
//        if (typeof window.Namecards.phone !== 'undefined') {
//          _.each(window.Namecards.phone, function(item, index, list) {
//            self.addField(item.value, item.type, item.cssClass);
//          });
//        }
//        // Bind collection events to view.
//        this.collection.bind('add', this.appendField);
//        this.collection.bind('remove', this.removeField);
//        // Render view.
//        this.render();
//      },
//      render: function() {
//        var self = this;
//        this.$el.append('<legend>Phone</legend>');
//        this.$el.append('<div id="phone-field"></div>');
//        this.$el.append('<button type="button" id="add-phone-button">New</button>');
//        _(this.collection.models).each(function(item){ // in case collection is not empty
//          self.appendField(item);
//        }, this);
//      },
//      // Add field containing predetermined number and type.
//      addField: function(number, type, cssClass) {
//        var phoneField = new PhoneField();
//        console.log(phoneField.attributes);
//        if (typeof number !== 'undefined') { 
//          phoneField.set({
//            number: number
//          });
//        };
//        if (typeof type !== 'undefined') {
//          phoneField.set({
//            type: type
//          });
//        }
//        if (typeof cssClass !== 'undefined' && cssClass.trim() !== '') {
//          phoneField.get('cssClass').push(cssClass);
//        }
//        this.collection.add(phoneField);
//      },
//      // Add new empty field.
//      addNewField: function() {
//        var phoneField = new PhoneField();
//        console.log(phoneField.attributes);
//        this.collection.add(phoneField);
//      },
//      appendField: function(item) {
//        // This appears to be what is binding the model to the view.  
//        // In this case it would be binding PhoneField to PhoneFieldView.
//        phoneFieldView = new PhoneFieldView({
//          model: item
//        });
//        this.$('#phone-field').append(phoneFieldView.render(this.counter).el);
//        this.counter++;
//      },
//      removeField: function(item) {
//        // Create a new field if the last remaining field has been remove.  
//        // This ensures that there will always be at least one field present.
//        if (this.collection.length === 0) {
//          this.addField();
//        }
//      }
//    });
// 
//    // Create instance of PhoneFieldView.
//    var phoneFieldsetView = new PhoneFieldsetView();

    /**
     * Org field
     * 
     * Implements organization "org" text field in add contact form. 
     * Adds jQuery UI Autocomplete widget to field.
     */
    var OrgTextFieldView = Backbone.View.extend({
      el: $('#org'),
      initialize: function() {
        _.bindAll(this, 'render');
        this.render();
      },
      render: function() {
        $(this.el).autocomplete({
          source: function(req, res) {
            $.ajax({
              url: '/orgs.json?terms=' + encodeURIComponent(req.term),
              type: 'GET',
              success: function(data) { 
                res(data); 
              },
              error: function(jqXHR, textStatus, errorThrown) {
                alert('Something went wrong in the client side javascript.');
              },
              dataType: 'json',
              cache: false
            });
          }
        });
      }
    });
    
    // Create instance of OrgTextFieldView.
    var orgTextFieldView = new OrgTextFieldView();
    
    /**
     * Page routes
     */
    var $content = $('#content');
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
      addContact: function() {
        // Display contact edit form.
        var editContactFormView = new EditContactFormView();
        // Display email field in edit form.
//        var emailFieldsetView = new EmailFieldsetView({ model: editContactFormView.model });
      },
      browse: function() {
        var listContactsView = new ListContactsView();
      },
      browseViewContact: function(id) {
        var displayContactView = new DisplayContactView({ id: id });
      },
      confirmDelete: function(id) {
//        this.navigate('/#contact/delete/' + id, { trigger: false, replace: true });
        $.ajax({
          url: '/contact/delete/' + id,
          dataType: 'html',
          success: function(data) {
            $content.html(data);
          }
        });
      },
      defaultPage: function(path) {
        $content.html('Default');
      },
      home: function() {
//        this.navigate('/', { trigger: false, replace: true });
        $content.html('Home');
      },
      orgs: function(orgName, id) {
//        this.navigate('/#orgs', { trigger: false, replace: true });
        $content.html('Orgs');
        if (typeof orgName !== 'undefined') {
          $content.html(' ' + orgName);
        }
        if (typeof id !== 'undefined') {
          $content.html(' ' + id);
        }
      },
      viewContact: function(id) {
//        this.navigate('/#contact/view/' + id, { trigger: false, replace: true });
        $.ajax({
          url: '/contact/view/' + id,
          dataType: 'html',
          success: function(data) {
            $content.html(data);
          }
        });
      }
    });
    
    var clientSideRouter = new ClientSideRouter();
    Backbone.history.start();

    
  });

})(jQuery);