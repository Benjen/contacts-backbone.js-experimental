/**
 * Mongo database models
 */

function defineModels(mongoose, fn) {
  var Schema = mongoose.Schema,
      ObjectId = Schema.ObjectId;

  /**
   * Model: Email
   */
  Email = new Schema({
    'value': String
  }, { strict: true });
  
  mongoose.model('Email', Email);
  
  /**
   * Model: phone
   */
  Phone = new Schema({
    'value': String, 
    'type': { 
      type: String, 
      enum: ['work', 'home', 'other'] 
    }
  }, { strict: true });
  
  mongoose.model('Phone', Phone);
  
  /**
   * Model: Address
   */
  Address = new Schema({
    'street': String,
    'district': String,
    'city': String,
    'country': String,
    'postcode': String
  }, { strict: true });
  
  mongoose.model('Address', Address);
  
  /**
   * Model: Contact
   */
   Contact = new Schema({
     'surname': String,
     'given_name': String,
     'org': String,
     'phone': [ Phone ],
     'email': [ Email ],
     'address': [ Address ]
   }, { strict: true });
  
//   Contact.pre('save', function(next) {
//     console.log(this);
//     // Remove 
//     this.phone.forEach(function(item) {
//       if (typeof item.error !== undefined) {
//         item.error = undefined;
//       }
//     });
//     next();
//   });
   Contact
     // Create a virtual value fullname for convinience. 
     .virtual('fullname')
     .get(function() {
       var fullname = this.surname;
       if (this.given_name.trim() !== '') {
         fullname += ', ' + this.given_name;
       }
       return fullname;
     });
   mongoose.model('Contact', Contact);
 
  fn();
}

exports.defineModels = defineModels; 